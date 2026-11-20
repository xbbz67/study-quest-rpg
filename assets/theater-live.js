window.TheaterLive=(()=>{
 let current=null,player=null,spotify=null,poll=null,generation=0,epoch=0,request=0,offset=0,active=false,paused=false,spState=null,spUri=null,heartbeatTimer=null,heartbeatBusy=false,lastCorrection=0,networkSeconds=0;
 const sdks={},el=id=>document.getElementById(id),context=()=>Theater.getContext(),status=text=>{el('theater-media-status').textContent=text;};
 function sdk(kind){
  if(kind==='yt'&&window.YT?.Player)return Promise.resolve(YT);
  if(kind==='sp'&&window.SpotifyIframeApi)return Promise.resolve(SpotifyIframeApi);
  return sdks[kind] ||= new Promise((resolve,reject)=>{
   const script=document.createElement('script'),timeout=setTimeout(()=>{delete sdks[kind];script.remove();reject(new Error('Player timeout'));},20000);
   const done=api=>{clearTimeout(timeout);resolve(api);};
   if(kind==='yt'){const old=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{old?.();done(YT);};script.src='https://www.youtube.com/iframe_api';}
   else{window.onSpotifyIframeApiReady=api=>{window.SpotifyIframeApi=api;done(api);};script.src='https://open.spotify.com/embed/iframe-api/v1';}
   script.onerror=()=>{clearTimeout(timeout);delete sdks[kind];reject(new Error('Player unavailable'));};document.head.append(script);
  });
 }
 function elapsed(){if(!current)return 0;return Math.max(0,(current.playback_position||0)+(Date.now()-Date.parse(current.playback_updated_at||current.started_at))/1000-offset);}
 function destroy(){try{player?.destroy();}catch{}try{spotify?.destroy();}catch{}player=spotify=spState=null;spUri=null;el('theater-screen').replaceChildren();}
 function single(media){return media.provider==='YouTube'?!new URL(media.src).searchParams.has('list'):/\/(track|episode)\//.test(media.original);}
 async function mount(item){
  const token=++generation;destroy();paused=false;lastCorrection=0;let durationReported=false;
  const media=Theater.parseMediaLink(item.link);if(!media){status('Link đang phát không hợp lệ.');return;}
  el('theater-external').href=media.original;el('theater-external').hidden=false;
  status(media.provider==='Spotify'?'Đang nghe chung. Spotify có thể yêu cầu đăng nhập; tua đồng bộ phụ thuộc loại nội dung.':'Đang phát chung. Nếu chưa phát, bấm “Vào xem trực tiếp”.');
  const target=document.createElement('div');target.id='theater-shared-player';el('theater-screen').append(target);el('theater-screen').dataset.provider=media.provider;
  const api=await sdk(media.provider==='YouTube'?'yt':'sp');if(token!==generation||!active)return;
  if(media.provider==='YouTube'){
   const url=new URL(media.src),id=url.pathname.split('/').pop();
   player=new api.Player(target,{videoId:id==='videoseries'?undefined:id,playerVars:{autoplay:1,playsinline:1,origin:location.origin,start:Math.floor(elapsed()),...(url.searchParams.has('list')?{list:url.searchParams.get('list'),listType:'playlist'}:{})},events:{
    onReady:()=>{if(token===generation&&player)joinLive();},
    onStateChange:event=>{if(token!==generation||!player)return;if(event.data===1&&single(media)&&!durationReported&&item.owner===context().user?.id&&!player.getVideoData?.()?.isLive){const duration=player.getDuration();if(duration>0){durationReported=true;void context().client.rpc('theater_duration',{expected_id:item.id,seconds:duration});}}if(event.data===0&&(single(media)||player.getPlaylistIndex?.()===player.getPlaylist?.()?.length-1))void next();},
    onError:()=>status('Nội dung bị chặn nhúng hoặc không khả dụng. Người thêm link có thể chuyển sang link tiếp theo.')
   }});
  }else api.createController(target,{url:media.original,width:'100%',height:352},controller=>{
   if(token!==generation||!active){controller.destroy();return;}spotify=controller;
   controller.addListener('ready',()=>{if(token===generation)joinLive();});
   controller.addListener('playback_update',event=>{
    if(token!==generation)return;spState=event.data;
    if(single(media)&&spState.duration>0){if(!durationReported&&item.owner===context().user?.id){durationReported=true;void context().client.rpc('theater_duration',{expected_id:item.id,seconds:spState.duration/1000});}if(spState.position>=spState.duration-500&&spState.isPaused)void next();}
   });
  });
 }
 function syncPlayer(force=false){
  if(!current||paused)return;const host=current.owner===context().user?.id,canCorrect=force||performance.now()-lastCorrection>4000;
  if(player?.getPlayerState){
   const index=current.playback_index;
   if(index!=null&&player.getPlaylistIndex?.()!==index&&(!host||force)){player.playVideoAt(index);player.seekTo(elapsed(),true);}
   else if(force||(!host&&player.getPlayerState()===1&&canCorrect&&Math.abs(player.getCurrentTime()-elapsed())>1.2)){player.seekTo(elapsed(),true);lastCorrection=performance.now();}
   if(force)player.playVideo();
  }
  if(spotify){
   if(current.playback_uri&&spUri!==current.playback_uri&&(!host||force)){spUri=current.playback_uri;spotify.loadEntity(spUri,false,Math.floor(elapsed()));spotify.play();}
   else if(force||(!host&&spState&&!spState.isPaused&&canCorrect&&Math.abs(spState.position/1000-elapsed())>1.5)){spotify.seek(Math.floor(elapsed()));lastCorrection=performance.now();}
   if(force)spotify.play();
  }
 }
 async function heartbeat(){
  if(!current||paused||heartbeatBusy||current.owner!==context().user?.id)return;let position=null,index=null,uri=null;
  if(player?.getPlayerState?.()===1){position=player.getCurrentTime();index=player.getPlaylist?.()?.length?player.getPlaylistIndex():null;}
  if(spotify&&spState&&!spState.isPaused&&!spState.isBuffering){position=spState.position/1000;uri=spState.playingURI||null;}
  if(Number.isFinite(position)){heartbeatBusy=true;try{await context().client.rpc('theater_heartbeat',{expected_id:current.id,position_seconds:position+networkSeconds,playlist_index:index,playing_uri:uri});}finally{heartbeatBusy=false;}}
 }
 async function refresh(){
  if(!active)return;const captured=epoch,n=++request,{client,user}=context();if(!client||!user)return;
  const start=Date.now(),{data:snapshot,error}=await client.rpc('theater_snapshot');if(!active||captured!==epoch||n!==request)return;
  if(error){status('Chưa tải được màn hình chung; đang thử lại.');return;}
  networkSeconds=Math.min(1,(Date.now()-start)/2000);offset=((start+Date.now())/2-Date.parse(snapshot.server_time))/1000;
  const data=snapshot.items,now=data.find(row=>row.status==='playing')||null,changed=now?.id!==current?.id;current=now;
  el('theater-queue').replaceChildren(...data.filter(row=>row.status==='waiting').map(row=>{const li=document.createElement('li');li.textContent=row.link;return li;}));
  el('theater-next').disabled=!now||now.owner!==user.id;
  if(changed){if(now)void mount(now).catch(()=>{if(captured===epoch)status('Chưa mở được player. Bấm “Vào xem trực tiếp” để thử lại.');});else{generation++;destroy();el('theater-external').hidden=true;status('Phòng chưa có nội dung. Link đầu tiên sẽ phát cho mọi người.');}}
  else if(now)syncPlayer();else status('Phòng chưa có nội dung. Thêm link đầu tiên để cùng xem.');
 }
 async function enqueue(){
  const media=Theater.parseMediaLink(el('theater-link').value);if(!media){status('Link YouTube/Spotify chưa hợp lệ.');return false;}
  const {client,user}=context();if(!user){status('Đang kết nối phiên khách. Thử lại sau một chút.');return false;}
  const {error}=await client.rpc('theater_enqueue',{media_link:media.original});if(error){status(error.code==='PT429'?'Mỗi người được chờ tối đa 3 link.':'Chưa thêm được link. Kiểm tra kết nối rồi thử lại.');return false;}
  el('theater-link').value='';await refresh();return true;
 }
 async function next(){if(!current)return;const {client}=context(),{error}=await client.rpc('theater_next',{expected_id:current.id});if(!error)await refresh();}
 function joinLive(){paused=false;if(current&&!player&&!spotify){void mount(current).catch(()=>status('Chưa tải được player. Kiểm tra kết nối rồi thử lại.'));return;}syncPlayer(true);}
 function pauseLocal(){paused=true;player?.pauseVideo();spotify?.pause();status('Đã tạm dừng trên máy bạn. Bấm “Vào xem trực tiếp” để bắt kịp phòng.');}
 function resumeConnection(){if(active)void refresh();}
 function enter(){active=true;epoch++;void refresh();clearInterval(poll);clearInterval(heartbeatTimer);poll=setInterval(()=>{void refresh();},6000);heartbeatTimer=setInterval(()=>{void heartbeat().catch(()=>{});},1000);}
 function leave(){active=false;epoch++;clearInterval(poll);clearInterval(heartbeatTimer);generation++;current=null;destroy();}
 document.addEventListener('DOMContentLoaded',()=>{el('theater-next').addEventListener('click',()=>{void next();});el('theater-join-live').addEventListener('click',joinLive);});
 window.addEventListener('online',resumeConnection);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)resumeConnection();});
 return{enter,leave,refresh,enqueue,joinLive,pauseLocal};
})();
