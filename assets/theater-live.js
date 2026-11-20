window.TheaterLive=(()=>{
 let current=null,player=null,spotify=null,poll=null,heartbeatTimer=null,generation=0,epoch=0,request=0,eventVersion=0,offset=0,active=false,localPaused=false,spState=null,spUri=null,heartbeatBusy=false,controlBusy=false,lastCorrection=0,driftSamples=0,programUntil=0,seekWatch=null,lastHostSample=null,playerHostRole=null;
 const sdks={},el=id=>document.getElementById(id),context=()=>Theater.getContext(),status=text=>{el('theater-media-status').textContent=text;};
 function sdk(kind){
  if(kind==='yt'&&window.YT?.Player)return Promise.resolve(YT);
  if(kind==='sp'&&window.SpotifyIframeApi)return Promise.resolve(SpotifyIframeApi);
  return sdks[kind] ||= new Promise((resolve,reject)=>{
   const script=document.createElement('script'),timeout=setTimeout(()=>{delete sdks[kind];script.remove();reject(Error('Player timeout'));},20000);
   const done=api=>{clearTimeout(timeout);resolve(api);};
   if(kind==='yt'){const old=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{old?.();done(YT);};script.src='https://www.youtube.com/iframe_api';}
   else{window.onSpotifyIframeApiReady=api=>{window.SpotifyIframeApi=api;done(api);};script.src='https://open.spotify.com/embed/iframe-api/v1';}
   script.onerror=()=>{clearTimeout(timeout);delete sdks[kind];reject(Error('Player unavailable'));};document.head.append(script);
  });
 }
 function elapsed(){if(!current)return 0;return Math.max(0,(current.playback_position||0)+(current.playback_paused?0:(Date.now()-Date.parse(current.playback_updated_at||current.started_at))/1000-offset));}
 function isHost(){return !!current&&current.owner===context().user?.id;}
 function isLive(){return !!(current?.is_live||player?.getVideoData?.()?.isLive);}
 function suppress(){programUntil=performance.now()+1600;lastHostSample=null;}
 function destroy(){try{player?.destroy();}catch{}try{spotify?.destroy();}catch{}player=spotify=spState=null;spUri=null;lastHostSample=null;playerHostRole=null;el('theater-screen').replaceChildren();}
 function single(media){return media.provider==='YouTube'?!new URL(media.src).searchParams.has('list'):/\/(track|episode)\//.test(media.original);}
 function renderControl(){const button=el('theater-shared-toggle');button.hidden=!isHost();el('theater-next').hidden=!isHost();button.disabled=!isHost()||controlBusy;button.textContent=current?.playback_paused?'▶ Phát cho cả phòng':'Ⅱ Tạm dừng cả phòng';el('theater-room-playback').textContent=!current?'Chưa có nội dung':current.playback_paused?'Ⅱ Cả phòng đang tạm dừng':isLive()?'● Đang xem nguồn trực tiếp':'▶ Cả phòng đang phát';el('theater-control-hint').textContent=isHost()?'Bạn là host của video này: có thể tua trên thanh thời gian.':'Người thêm link đang phát điều khiển phát / tạm dừng chung.';}
 async function mount(item){
  const token=++generation;destroy();playerHostRole=isHost();el('theater-screen').dataset.viewer=String(!playerHostRole);localPaused=false;lastCorrection=0;driftSamples=0;let durationReported=false;
  const media=Theater.parseMediaLink(item.link);if(!media){status('Link đang phát không hợp lệ.');return;}
  el('theater-external').href=media.original;el('theater-external').hidden=false;
  status(media.provider==='Spotify'?'Đang nghe chung. Khả năng tua đồng bộ phụ thuộc player Spotify.':'Nếu chưa phát, bấm “Vào xem trực tiếp”. Nút phát / tạm dừng chung nằm bên cạnh.');
  const target=document.createElement('div');target.id='theater-shared-player';el('theater-screen').append(target);el('theater-screen').dataset.provider=media.provider;
  const api=await sdk(media.provider==='YouTube'?'yt':'sp');if(token!==generation||!active)return;
  if(media.provider==='YouTube'){
   const url=new URL(media.src),id=url.pathname.split('/').pop();
   player=new api.Player(target,{videoId:id==='videoseries'?undefined:id,playerVars:{autoplay:item.playback_paused?0:1,playsinline:1,controls:playerHostRole?1:0,disablekb:playerHostRole?0:1,origin:location.origin,...(!item.is_live?{start:Math.floor(elapsed())}:{}),...(url.searchParams.has('list')?{list:url.searchParams.get('list'),listType:'playlist'}:{})},events:{
    onReady:()=>{if(token===generation&&player){const iframe=player.getIframe?.();if(iframe){iframe.title=playerHostRole?'YouTube · Bạn đang điều khiển':'YouTube · Màn hình chung';iframe.tabIndex=playerHostRole?0:-1;}joinLive();}},
    onStateChange:event=>{
     if(token!==generation||!player||!current)return;
     if(event.data===1&&single(media)&&!durationReported&&isHost()&&!isLive()){const duration=player.getDuration();if(duration>0){durationReported=true;void context().client.rpc('theater_duration',{expected_id:item.id,seconds:duration});}}
     if(event.data===1)void heartbeat().catch(()=>{});
     if(isHost()&&!localPaused&&!controlBusy&&performance.now()>programUntil){if(event.data===2&&!current.playback_paused)void sharedControl('pause');if(event.data===1&&current.playback_paused)void sharedControl('play');}
     if(event.data===0&&!current.playback_paused&&(single(media)||player.getPlaylistIndex?.()===player.getPlaylist?.()?.length-1))void next();
    },
    onAutoplayBlocked:()=>status('Trình duyệt đang chặn tự phát. Bấm “Vào xem trực tiếp” trên máy này.'),
    onError:()=>status('Nguồn bị chặn nhúng hoặc không khả dụng. Người thêm link có thể chuyển link tiếp theo.')
   }});
  }else api.createController(target,{url:media.original,width:'100%',height:352},controller=>{
   if(token!==generation||!active){controller.destroy();return;}spotify=controller;
   controller.addListener('ready',()=>{if(token===generation)joinLive();});
   controller.addListener('playback_update',event=>{
    if(token!==generation||!current)return;const previous=spState;spState={...event.data,receivedAt:performance.now()};
    if(single(media)&&spState.duration>0){if(!durationReported&&isHost()){durationReported=true;void context().client.rpc('theater_duration',{expected_id:item.id,seconds:spState.duration/1000});}if(spState.position>=spState.duration-500&&spState.isPaused&&!current.playback_paused)void next();}
    if(previous&&previous.isPaused!==spState.isPaused&&!spState.isBuffering&&isHost()&&!localPaused&&!controlBusy&&performance.now()>programUntil){if(spState.isPaused&&!current.playback_paused)void sharedControl('pause');if(!spState.isPaused&&current.playback_paused)void sharedControl('play');}
   });
  });
 }
 function syncPlayer(force=false,controlChanged=false){
  if(!current||localPaused)return;
  const host=isHost(),target=elapsed(),live=isLive(),canCorrect=performance.now()-lastCorrection>12000;
  if(player?.getPlayerState){
   const state=player.getPlayerState(),index=current.playback_index;let seek=force||controlChanged;
   if(index!=null&&player.getPlaylistIndex?.()!==index&&!host){suppress();player.playVideoAt(index);seek=true;}
   const drift=Math.abs(player.getCurrentTime()-target);
   if(!live&&!host&&!current.playback_paused&&state===1&&drift>3)driftSamples++;else driftSamples=0;
   if((!live||(controlChanged&&current.control_action==='seek'))&&(seek||(canCorrect&&driftSamples>=2))&&(drift>.6||force)){suppress();player.seekTo(target,true);lastCorrection=performance.now();driftSamples=0;}
   if(current.playback_paused){if(state!==2){suppress();player.pauseVideo();}}
   else if(force||controlChanged){suppress();player.playVideo();}
  }
  if(spotify){
   if(current.playback_uri&&spUri!==current.playback_uri&&(!host||force)){suppress();spUri=current.playback_uri;spotify.loadEntity(spUri,false,Math.floor(target));}
   // Spotify only documents precise seek for podcast episodes. Avoid repeatedly seeking music.
   if((force||controlChanged)&&/\/episode\//.test(current.link)){suppress();spotify.seek(Math.floor(target));}
   if(current.playback_paused){if(!spState?.isPaused){suppress();spotify.pause();}}
   else if(force||controlChanged){suppress();spotify.play();}
  }
 }
 function older(row){return current&&row.id===current.id&&((row.control_revision||0)<(current.control_revision||0)||((row.control_revision||0)===(current.control_revision||0)&&Date.parse(row.playback_updated_at||row.started_at)<Date.parse(current.playback_updated_at||current.started_at)));}
 function applyUpdate(event){
  const row=event.new;if(!active||event.eventType!=='UPDATE'||!current||row?.id!==current.id||row.status!=='playing')return false;
  if(older(row))return true;
  const changed=(row.control_revision||0)!==(current.control_revision||0)||!!row.playback_paused!==!!current.playback_paused;
  current={...current,...row};eventVersion++;renderControl();if(playerHostRole!==null&&playerHostRole!==isHost())void mount(current);else syncPlayer(false,changed);return true;
 }
 async function heartbeat(){
  if(!current||localPaused||current.playback_paused||heartbeatBusy||controlBusy||!isHost())return;let position=null,index=null,uri=null;
  if(player?.getPlayerState?.()===1){position=player.getCurrentTime();index=player.getPlaylist?.()?.length?player.getPlaylistIndex():null;}
  if(spotify&&spState&&!spState.isPaused&&!spState.isBuffering){position=spState.position/1000+Math.max(0,(performance.now()-spState.receivedAt)/1000);uri=spState.playingURI||null;}
  if(Number.isFinite(position)){heartbeatBusy=true;try{await context().client.rpc('theater_heartbeat',{expected_id:current.id,position_seconds:position,playlist_index:index,playing_uri:uri,expected_revision:current.control_revision||0,live_stream:isLive()});}finally{heartbeatBusy=false;}}
 }
 async function refresh(){
  if(!active)return;const captured=epoch,n=++request,events=eventVersion,{client,user}=context();if(!client||!user)return;
  const start=Date.now(),{data:snapshot,error}=await client.rpc('theater_snapshot');if(!active||captured!==epoch||n!==request)return;
  if(error){status('Chưa tải được màn hình chung; đang thử lại.');return;}
  offset=((start+Date.now())/2-Date.parse(snapshot.server_time))/1000;
  const data=snapshot.items,now=data.find(row=>row.status==='playing')||null,changed=now?.id!==current?.id;
  if(events!==eventVersion&&changed)return;
  const controls=!changed&&now&&((now.control_revision||0)!==(current.control_revision||0)||!!now.playback_paused!==!!current.playback_paused);
  if(!now||!older(now))current=now;
  el('theater-queue').replaceChildren(...data.filter(row=>row.status==='waiting').map(row=>{const li=document.createElement('li');li.textContent=row.link;return li;}));el('theater-next').disabled=!isHost();renderControl();
  if(changed){if(now)void mount(now).catch(()=>{if(captured===epoch)status('Chưa mở được player. Bấm “Vào xem trực tiếp” để thử lại.');});else{generation++;destroy();el('theater-external').hidden=true;status('Phòng chưa có nội dung. Link đầu tiên sẽ phát cho mọi người.');}}
  else if(now){if(playerHostRole!==null&&playerHostRole!==isHost())void mount(now);else syncPlayer(false,controls);}else status('Phòng chưa có nội dung. Thêm link đầu tiên để cùng xem.');
 }
 async function sharedControl(action){
  if(!isHost()||controlBusy)return;controlBusy=true;renderControl();const item=current,version=epoch;
  let position=elapsed(),index=current.playback_index??null,uri=current.playback_uri??null;
  if(action==='pause'||action==='seek'){if(player)position=player.getCurrentTime();if(spotify&&spState)position=spState.position/1000;}
  if(player?.getPlaylist?.()?.length)index=player.getPlaylistIndex();
  try{
   const {data,error}=await context().client.rpc('theater_control',{expected_id:item.id,action,position_seconds:position,expected_revision:item.control_revision||0,playlist_index:index,playing_uri:uri});
   if(!active||version!==epoch)return;
   if(error){status(error.code==='PT409'?'Trạng thái vừa thay đổi. Đã tải lại, bạn thử lại nhé.':'Chưa đổi được trạng thái phòng. Kiểm tra kết nối rồi thử lại.');await refresh();return;}
   if(current?.id===item.id){applyUpdate({eventType:'UPDATE',new:data.item});status(action==='seek'?'Đã cập nhật vị trí phát cho cả phòng.':action==='pause'?'Đã tạm dừng cho cả phòng.':'Đã phát tiếp cho cả phòng.');}
  }catch{status('Mất kết nối. Chưa thay đổi trạng thái chung.');}
  finally{controlBusy=false;renderControl();}
 }
 async function enqueue(){
  const media=Theater.parseMediaLink(el('theater-link').value);if(!media){status('Link YouTube/Spotify chưa hợp lệ.');return false;}
  const {client,user}=context();if(!user){status('Đang kết nối phiên khách. Thử lại sau một chút.');return false;}
  const {error}=await client.rpc('theater_enqueue',{media_link:media.original});if(error){status(error.code==='PT429'?'Mỗi người được chờ tối đa 3 link.':'Chưa thêm được link. Kiểm tra kết nối rồi thử lại.');return false;}
  el('theater-link').value='';await refresh();return true;
 }
 async function next(){if(!current||current.playback_paused&&!isHost())return;const {client}=context(),{error}=await client.rpc('theater_next',{expected_id:current.id});if(!error)await refresh();}
 function joinLive(){localPaused=false;if(current&&!player&&!spotify){void mount(current).catch(()=>status('Chưa tải được player. Kiểm tra kết nối rồi thử lại.'));return;}syncPlayer(true);}
 function pauseLocal(){localPaused=true;suppress();player?.pauseVideo();spotify?.pause();status('Chỉ tạm dừng máy bạn. “Vào xem trực tiếp” để trở lại trạng thái chung.');}
 function detectHostSeek(){
  if(!active||!isHost()||localPaused||controlBusy||!player?.getCurrentTime){lastHostSample=null;return;}
  const state=player.getPlayerState();if(state===3)return;if(state!==1&&state!==2){lastHostSample=null;return;}
  const now=performance.now(),position=player.getCurrentTime(),index=player.getPlaylistIndex?.()??0;
  if(!Number.isFinite(position))return;
  const previous=lastHostSample;lastHostSample={at:now,position,index,state};if(!previous)return;
  const expected=previous.position+(previous.state===1?(now-previous.at)/1000:0);
  if(index!==previous.index||Math.abs(position-expected)>1){lastHostSample=null;void sharedControl('seek');}
 }
 function resumeConnection(){if(active)void refresh();}
 function enter(){active=true;epoch++;void refresh();clearInterval(poll);clearInterval(heartbeatTimer);poll=setInterval(()=>{void refresh();},6000);heartbeatTimer=setInterval(()=>{void heartbeat().catch(()=>{});},1500);clearInterval(seekWatch);seekWatch=setInterval(detectHostSeek,250);}
 function leave(){active=false;epoch++;clearInterval(poll);clearInterval(heartbeatTimer);clearInterval(seekWatch);generation++;current=null;destroy();}
 document.addEventListener('DOMContentLoaded',()=>{el('theater-next').addEventListener('click',()=>{void next();});el('theater-join-live').addEventListener('click',joinLive);el('theater-shared-toggle').addEventListener('click',()=>{void sharedControl(current?.playback_paused?'play':'pause');});});
 window.addEventListener('online',resumeConnection);document.addEventListener('visibilitychange',()=>{if(!document.hidden)resumeConnection();});
 return{enter,leave,refresh,enqueue,joinLive,pauseLocal,applyUpdate,sharedControl};
})();
