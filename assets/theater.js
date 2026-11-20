window.Theater = (() => {
 const el=id=>document.getElementById(id);
 let active=false, rows=[], seat=null, account=null, connected=false, busy=false, polling=null, lastBeat=0, epoch=0, refreshNumber=0, releasePending=Promise.resolve(),doorBusy=false,sceneLoader=null;
 let guestClient=null,guestUser=null,identityPromise=null,seatClient=null;
 let roomChannel=null,realtimeClient=null,realtimeAccount=null,realtimeReady=false,seatEvent=null,mediaEvent=null;
 function stopRealtime(){clearTimeout(seatEvent);clearTimeout(mediaEvent);if(roomChannel)void realtimeClient.removeChannel(roomChannel);roomChannel=null;realtimeClient=null;realtimeAccount=null;realtimeReady=false;}
 function connectRealtime(client,user){
  if(roomChannel&&realtimeClient===client&&realtimeAccount===user.id)return;
  stopRealtime();realtimeClient=client;realtimeAccount=user.id;
  const channel=client.channel('study-theater-room-v2')
   .on('postgres_changes',{event:'*',schema:'public',table:'theater_seats'},()=>{clearTimeout(seatEvent);seatEvent=setTimeout(()=>{if(active)void refresh();},60);})
   .on('postgres_changes',{event:'*',schema:'public',table:'theater_queue'},event=>{if(window.TheaterLive?.applyUpdate(event))return;clearTimeout(mediaEvent);mediaEvent=setTimeout(()=>{if(active)void window.TheaterLive?.refresh();},30);})
   .on('postgres_changes',{event:'*',schema:'public',table:'theater_messages'},event=>window.TheaterChat?.receive(event));
  roomChannel=channel;
  channel.subscribe(status=>{if(roomChannel!==channel||!active)return;realtimeReady=status==='SUBSCRIBED';window.TheaterChat?.setConnection(realtimeReady);if(realtimeReady){void refresh();void window.TheaterLive?.refresh();}});
 }
 function roomClient(){return window.CloudSave?.getUser()?window.CloudSave.getClient():guestClient;}
 function roomUser(){return window.CloudSave?.getUser()||guestUser;}
 async function ensureIdentity(){
  if(window.CloudSave?.getUser())return;
  if(identityPromise)return identityPromise;
  identityPromise=(async()=>{const config=window.STUDY_CLOUD_CONFIG;guestClient ||= supabase.createClient(config.url,config.key,{auth:{storageKey:'study_theater_guest_v1'}});const session=await guestClient.auth.getSession();let data=session.data;if(!data.session){const result=await guestClient.auth.signInAnonymously();if(result.error)throw result.error;data=result.data;}guestUser={id:data.session.user.id};})();
  try{await identityPromise;}finally{identityPromise=null;}
 }
 const say=text=>{if(el('theater-status'))el('theater-status').textContent=text;};
 function parseMediaLink(text){
  let url;try{url=new URL(text.trim());}catch{return null;}
  if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
  const host=url.hostname.toLowerCase(), parts=url.pathname.split('/').filter(Boolean);
  if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be'].includes(host)){
   const id=host==='youtu.be'?parts[0]:['embed','shorts','live'].includes(parts[0])?parts[1]:url.searchParams.get('v');
   if(id&&/^[A-Za-z0-9_-]{11}$/.test(id))return{provider:'YouTube',src:`https://www.youtube.com/embed/${id}?playsinline=1&rel=0`,original:`https://www.youtube.com/watch?v=${id}`};
   const list=url.searchParams.get('list');
   if(parts[0]==='playlist'&&list&&/^[A-Za-z0-9_-]{10,100}$/.test(list))return{provider:'YouTube',src:`https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list)}`,original:`https://www.youtube.com/playlist?list=${encodeURIComponent(list)}`};
  }
  if(host==='open.spotify.com'){
   if(parts[0]?.startsWith('intl-'))parts.shift();
   if(parts[0]==='embed')parts.shift();
   if(['track','album','playlist','episode','show','artist'].includes(parts[0])&&/^[A-Za-z0-9]{22}$/.test(parts[1]||'')&&parts.length===2)return{provider:'Spotify',src:`https://open.spotify.com/embed/${parts[0]}/${parts[1]}`,original:`https://open.spotify.com/${parts[0]}/${parts[1]}`};
  }
  return null;
 }
 function loadMedia(){return window.TheaterLive.enqueue();}
 function personAvatar(name,userId,mine){
  const colors=['#818cf8','#e5af6b','#c084fc','#6cb8cf','#c77993'];
  const hash=Array.from(userId||'').reduce((total,char)=>total+char.charCodeAt(0),0);
  const shirt=mine?'#55cdb0':colors[hash%colors.length];
  const initials=String(name||'Bạn học').trim().split(/\s+/).slice(0,2).map(part=>Array.from(part)[0]||'').join('').toUpperCase();
  return `<span class="theater-person" aria-hidden="true"><svg viewBox="0 0 56 68" focusable="false"><ellipse cx="28" cy="62" rx="22" ry="4" fill="#000" opacity=".3"/><path d="M17 43h22l4 19H32l-4-12-4 12H13Z" fill="#202a40"/><path d="M17 29Q28 24 39 29l8 20-8 3-5-14H22l-5 14-8-3Z" fill="${shirt}"/><rect x="24" y="20" width="8" height="10" rx="3" fill="#dba77f"/><circle cx="28" cy="15" r="12" fill="#e9bd95"/><path d="M16 16V13C16-1 40-1 40 13v5l-5-8c-5 4-11 1-14 0l-5 8Z" fill="#322b31"/><path d="M15 36Q28 29 41 36v19H15Z" fill="${shirt}"/><text x="28" y="47" text-anchor="middle" fill="#11212a" font-size="10" font-weight="800">${escapeHtml(initials)}</text><path d="M8 52q20-8 40 0v9H8Z" fill="#31242b" opacity=".9"/></svg></span>`;
 }
 function renderSeats(){
  const map=new Map(rows.map(row=>[row.seat,row]));
  el('theater-seats').innerHTML='ABCDEF'.split('').map(letter=>`<div class="theater-seat-row"><span class="theater-row-label">${letter}</span><div class="theater-seat-grid">${Array.from({length:8},(_,i)=>{
   const id=letter+(i+1),occupant=map.get(id),mine=occupant?.user_id===account;
   return `<button type="button" data-seat="${id}" data-seat-occupied="${!!occupant}" class="theater-seat ${mine?'is-mine':occupant?'is-occupied':''}" aria-label="Ghế ${id}${occupant?': '+escapeHtml(occupant.display_name)+(mine?' (bạn)':''):': còn trống'}" title="${occupant?escapeHtml(occupant.display_name):'Chọn ghế '+id}" aria-pressed="${mine}" ${!connected||!account||busy||doorBusy||(occupant&&!mine)?'disabled':''}>${occupant?personAvatar(occupant.display_name,occupant.user_id,mine):''}<span class="theater-seat-code">${id}</span>${occupant?`<span class="theater-seat-name">${mine?'Bạn':escapeHtml(occupant.display_name)}</span>`:''}${mine?'<span class="theater-you-marker" aria-hidden="true">▼</span>':''}</button>`;
  }).join('')}</div></div>`).join('');
  el('theater-occupancy').textContent=`${rows.length}/48 ghế`;
  el('theater-my-seat').textContent=seat?`Ghế của bạn: ${seat}`:'Chọn một ghế để ngồi học';
  el('theater-people').textContent=rows.length?rows.map(row=>`${row.seat} · ${row.display_name}`).join('   /   '):'Chưa có người ngồi trong phòng.';
  el('theater-leave-seat').disabled=!seat||busy||doorBusy;
  el('theater-door-in').disabled=busy||doorBusy;
  el('theater-door-exit').disabled=busy||doorBusy;
  window.Theater3D?.sync(rows,account,{confirmed:connected});
 }
 async function chooseSeat(id){
  const client=roomClient(),user=roomUser();
  if(!user){say('Đang kết nối phiên khách. Thử lại sau một chút.');return false;}
  if(busy)return false;
  busy=true;renderSeats();
  try{
   const {error}=await client.rpc('choose_theater_seat',{chosen_seat:id,nickname:String(state.character.name||'Bạn học').slice(0,40)});
   if(error){say(error.code==='PT409'?'Ghế vừa có người chọn. Bạn chọn ghế khác nhé.':'Chưa giữ được ghế. Kiểm tra kết nối rồi thử lại.');return false;}
   seat=id;seatClient=client;lastBeat=Date.now();say(id?`Đã giữ ghế ${id} cho bạn. Chúc bạn một phiên học tốt!`:'Đã rời ghế.');return true;
  }catch{say('Mất kết nối phòng học. Timer vẫn hoạt động trên máy.');return false;}
  finally{busy=false;await refresh();}
 }
 async function releaseSeat(){
  if(!seat)return;
  const client=seatClient||roomClient();seat=null;seatClient=null;
  if(client){try{await client.rpc('choose_theater_seat',{chosen_seat:null,nickname:'Bạn học'});}catch{}}
 }
 async function refresh(){
  if(!active)return;
  const user=roomUser(),client=roomClient(),currentEpoch=epoch,request=++refreshNumber;
  if(!user||!client){void ensureIdentity().catch(()=>{});account=null;rows=[];seat=null;connected=false;stopRealtime();window.Theater3D?.stop();renderSeats();say('Đang kết nối phiên khách để vào phòng chung…');return;}
  if(account!==user.id){await releaseSeat();account=user.id;seat=null;}
  connectRealtime(client,user);
  try{
   if(seat&&!busy&&Date.now()-lastBeat>30000){
    const {error}=await client.rpc('choose_theater_seat',{chosen_seat:seat,nickname:String(state.character.name||'Bạn học').slice(0,40)});
    if(error){seat=null;say('Ghế không còn được giữ. Chọn lại một ghế để tiếp tục.');}lastBeat=Date.now();
   }
   const {data,error}=await client.from('theater_seats').select('user_id,seat,display_name,updated_at').gte('updated_at',new Date(Date.now()-120000).toISOString()).order('seat');
   if(currentEpoch!==epoch||request!==refreshNumber||!active)return;
   if(error)throw error;
   rows=data;connected=true;seat=rows.find(row=>row.user_id===account)?.seat||null;if(seat)seatClient=client;renderSeats();
   if(!seat)say(realtimeReady?'Phòng chung · Đang cập nhật trực tiếp. Chọn ghế trống để ngồi.':'Phòng chung · Đang kết nối cập nhật trực tiếp. Chọn ghế trống để ngồi.');
  }catch{if(currentEpoch===epoch){connected=false;renderSeats();say('Chưa kết nối được phòng. Đang thử lại; timer vẫn dùng được.');}}
 }
 function renderTimer(){
  if(!el('theater-timer'))return;
  const seconds=currentTimerMode==='STOPWATCH'?stopwatchSeconds:timeRemaining;
  el('theater-timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  el('theater-timer-label').textContent=isBreakSession?'Đang nghỉ giải lao':`${TIMER_MODES[currentTimerMode].label} · ${timerState==='RUNNING'?'Đang tập trung':timerState==='PAUSED'?'Tạm dừng':'Sẵn sàng'}`;
  el('theater-start').hidden=timerState==='RUNNING';el('theater-pause').hidden=timerState!=='RUNNING';
 }
 function enter(){
  if(active)return;active=true;epoch++;document.body.classList.add('theater-active');
  sounds.stopAmbient();
  document.getElementById('lofi-iframe')?.contentWindow?.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),'https://www.youtube.com');
  connected=false;renderSeats();renderTimer();
  sceneLoader ||= import('./theater-3d.js').catch(()=>{el('theater-motion-status').textContent='Đang dùng nhân vật 2D; có thể tải lại trang để mở 3D.';});
  void sceneLoader.then(()=>{if(active)window.Theater3D?.sync(rows,account,{confirmed:connected});});
  void releasePending.then(async()=>{await ensureIdentity();if(active){await refresh();window.TheaterLive?.enter();window.TheaterChat?.enter();window.TheaterChat?.setConnection(realtimeReady);}}).catch(()=>say('Chưa mở được phiên khách. Hãy thử lại hoặc đăng nhập tài khoản.'));polling=setInterval(()=>{void refresh();void window.TheaterChat?.refresh();},10000);
 }
 function leave(){
  if(!active)return;active=false;epoch++;connected=false;clearInterval(polling);stopRealtime();document.body.classList.remove('theater-active');releasePending=releaseSeat();window.Theater3D?.stop();window.TheaterLive?.leave();window.TheaterChat?.leave();
  el('theater-screen').replaceChildren();el('theater-external').hidden=true;
 }
 document.addEventListener('DOMContentLoaded',()=>{
  el('theater-door-in').addEventListener('click',()=>{
   if(!account){say('Đang kết nối phiên khách. Thử lại sau một chút.');return;}
   if(!connected){say('Đang kết nối phòng. Thử lại sau một chút nhé.');return;}
   if(seat){say(`Bạn đã ngồi ghế ${seat}.`);return;}
   const taken=new Set(rows.map(row=>row.seat)),available='ABCDEF'.split('').flatMap(letter=>Array.from({length:8},(_,i)=>letter+(i+1))).find(id=>!taken.has(id));
   if(available)void chooseSeat(available);else say('Phòng đã đủ 48 ghế. Bạn có thể tiếp tục xem màn hình và dùng timer.');
  });
  el('theater-door-exit').addEventListener('click',async()=>{
   if(busy||doorBusy)return;
   if(!seat){switchTab('tab-timer');return;}
   doorBusy=true;const id=account;renderSeats();
   try{if(await chooseSeat(null)){say('Đang đi ra cửa EXIT…');await window.Theater3D?.waitForExit(id);if(active)switchTab('tab-timer');}}
   finally{doorBusy=false;renderSeats();}
  });
  el('theater-media-form').addEventListener('submit',event=>{event.preventDefault();loadMedia();});
  el('theater-stop-media').addEventListener('click',()=>window.TheaterLive?.pauseLocal());
  el('theater-seats').addEventListener('click',event=>{const button=event.target.closest('[data-seat]');if(button&&!button.disabled)void chooseSeat(button.dataset.seat);});
  el('theater-leave-seat').addEventListener('click',()=>{void chooseSeat(null);});
  renderSeats();
 });
 return{connectionStatus:()=>({realtime:realtimeReady}),getContext:()=>({client:roomClient(),user:roomUser()}),enter,leave,renderTimer,releaseSeat,parseMediaLink,loadMedia,refresh};
})();
