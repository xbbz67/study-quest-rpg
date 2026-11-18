window.Theater = (() => {
 const el=id=>document.getElementById(id);
 let active=false, rows=[], seat=null, account=null, connected=false, busy=false, polling=null, lastBeat=0, epoch=0, refreshNumber=0, releasePending=Promise.resolve();
 const say=text=>{if(el('theater-status'))el('theater-status').textContent=text;};
 function parseMediaLink(text){
  let url;try{url=new URL(text.trim());}catch{return null;}
  if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
  const host=url.hostname.toLowerCase(), parts=url.pathname.split('/').filter(Boolean);
  if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be'].includes(host)){
   const id=host==='youtu.be'?parts[0]:['embed','shorts','live'].includes(parts[0])?parts[1]:url.searchParams.get('v');
   if(id&&/^[A-Za-z0-9_-]{11}$/.test(id))return{provider:'YouTube',src:`https://www.youtube.com/embed/${id}?playsinline=1&rel=0`,original:url.href};
   const list=url.searchParams.get('list');
   if(parts[0]==='playlist'&&list&&/^[A-Za-z0-9_-]{10,100}$/.test(list))return{provider:'YouTube',src:`https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list)}`,original:url.href};
  }
  if(host==='open.spotify.com'){
   if(parts[0]?.startsWith('intl-'))parts.shift();
   if(parts[0]==='embed')parts.shift();
   if(['track','album','playlist','episode','show','artist'].includes(parts[0])&&/^[A-Za-z0-9]{22}$/.test(parts[1]||'')&&parts.length===2)return{provider:'Spotify',src:`https://open.spotify.com/embed/${parts[0]}/${parts[1]}`,original:url.href};
  }
  return null;
 }
 function loadMedia(){
  const media=parseMediaLink(el('theater-link').value);
  if(!media){el('theater-media-status').textContent='Dùng link HTTPS YouTube video/playlist hoặc open.spotify.com. Link rút gọn Spotify cần đổi sang link đầy đủ.';return false;}
  const iframe=document.createElement('iframe');iframe.src=media.src;iframe.title=`${media.provider} — màn hình Theater`;iframe.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';
  el('theater-screen').replaceChildren(iframe);
  el('theater-screen').dataset.provider=media.provider;
  el('theater-external').href=media.original;el('theater-external').hidden=false;
  el('theater-media-status').textContent=`${media.provider} · Bấm Play trong màn hình để phát. Nội dung phát riêng trên máy bạn; một số nội dung có thể bị nhà cung cấp chặn nhúng.`;
  return true;
 }
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
   return `<button type="button" data-seat="${id}" data-seat-occupied="${!!occupant}" class="theater-seat ${mine?'is-mine':occupant?'is-occupied':''}" aria-label="Ghế ${id}${occupant?': '+escapeHtml(occupant.display_name)+(mine?' (bạn)':''):': còn trống'}" title="${occupant?escapeHtml(occupant.display_name):'Chọn ghế '+id}" aria-pressed="${mine}" ${!connected||!account||busy||(occupant&&!mine)?'disabled':''}>${occupant?personAvatar(occupant.display_name,occupant.user_id,mine):''}<span class="theater-seat-code">${id}</span>${occupant?`<span class="theater-seat-name">${mine?'Bạn':escapeHtml(occupant.display_name)}</span>`:''}${mine?'<span class="theater-you-marker" aria-hidden="true">▼</span>':''}</button>`;
  }).join('')}</div></div>`).join('');
  el('theater-occupancy').textContent=`${rows.length}/48 ghế`;
  el('theater-my-seat').textContent=seat?`Bạn đang ngồi ghế ${seat}`:'Chọn một ghế để ngồi học';
  el('theater-people').textContent=rows.length?rows.map(row=>`${row.seat} · ${row.display_name}`).join('   /   '):'Chưa có người ngồi trong phòng.';
  el('theater-leave-seat').disabled=!seat||busy;
 }
 async function chooseSeat(id){
  const client=window.CloudSave?.getClient(),user=window.CloudSave?.getUser();
  if(!user){say('Đăng nhập tài khoản để chọn ghế và ngồi cùng mọi người.');return false;}
  if(busy)return false;
  busy=true;renderSeats();
  try{
   const {error}=await client.rpc('choose_theater_seat',{chosen_seat:id,nickname:String(state.character.name||'Bạn học').slice(0,40)});
   if(error){say(error.code==='PT409'?'Ghế vừa có người chọn. Bạn chọn ghế khác nhé.':'Chưa giữ được ghế. Kiểm tra kết nối rồi thử lại.');return false;}
   seat=id;lastBeat=Date.now();say(id?`Đã vào ghế ${id}. Chúc bạn một phiên học tốt!`:'Đã rời ghế.');return true;
  }catch{say('Mất kết nối phòng học. Timer vẫn hoạt động trên máy.');return false;}
  finally{busy=false;await refresh();}
 }
 async function releaseSeat(){
  if(!seat)return;
  const client=window.CloudSave?.getClient();seat=null;
  if(client){try{await client.rpc('choose_theater_seat',{chosen_seat:null,nickname:'Bạn học'});}catch{}}
 }
 async function refresh(){
  if(!active)return;
  const user=window.CloudSave?.getUser(),client=window.CloudSave?.getClient(),currentEpoch=epoch,request=++refreshNumber;
  if(!user||!client){account=null;rows=[];seat=null;connected=false;renderSeats();say('Bạn có thể xem và chạy timer. Đăng nhập để chọn ghế và thấy người trong phòng.');return;}
  if(account!==user.id){account=user.id;seat=null;}
  try{
   if(seat&&!busy&&Date.now()-lastBeat>30000){
    const {error}=await client.rpc('choose_theater_seat',{chosen_seat:seat,nickname:String(state.character.name||'Bạn học').slice(0,40)});
    if(error){seat=null;say('Ghế không còn được giữ. Chọn lại một ghế để tiếp tục.');}lastBeat=Date.now();
   }
   const {data,error}=await client.from('theater_seats').select('user_id,seat,display_name,updated_at').gte('updated_at',new Date(Date.now()-120000).toISOString()).order('seat');
   if(currentEpoch!==epoch||request!==refreshNumber||!active)return;
   if(error)throw error;
   rows=data;connected=true;seat=rows.find(row=>row.user_id===account)?.seat||null;renderSeats();
   if(!seat)say('Phòng chung · Ghế cập nhật mỗi 10 giây. Chọn ghế trống để ngồi.');
  }catch{if(currentEpoch===epoch){connected=false;renderSeats();say('Chưa kết nối được phòng. Đang thử lại; timer và màn hình riêng vẫn dùng được.');}}
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
  connected=false;renderSeats();renderTimer();void releasePending.then(()=>refresh());polling=setInterval(()=>{void refresh();},10000);
 }
 function leave(){
  if(!active)return;active=false;epoch++;connected=false;clearInterval(polling);document.body.classList.remove('theater-active');releasePending=releaseSeat();
  el('theater-screen').replaceChildren();el('theater-external').hidden=true;
 }
 document.addEventListener('DOMContentLoaded',()=>{
  el('theater-media-form').addEventListener('submit',event=>{event.preventDefault();loadMedia();});
  el('theater-stop-media').addEventListener('click',()=>{el('theater-screen').replaceChildren();el('theater-external').hidden=true;el('theater-media-status').textContent='Đã tắt màn hình.';});
  el('theater-seats').addEventListener('click',event=>{const button=event.target.closest('[data-seat]');if(button&&!button.disabled)void chooseSeat(button.dataset.seat);});
  el('theater-leave-seat').addEventListener('click',()=>{void chooseSeat(null);});
  renderSeats();
 });
 return{enter,leave,renderTimer,releaseSeat,parseMediaLink,loadMedia,refresh};
})();
