window.EntryGate=(()=>{
 const KEY='STUDY_RPG_GUEST_NAME_v1',el=id=>document.getElementById(id),verified=new Map();
 let mode='choice',busy=false,booting=null,lastAccount=null,roomWanted=false,waiters=[];
 const mainUser=()=>window.CloudSave?.getUser(),context=()=>Theater.getContext();
 function normalize(value){return String(value||'').normalize('NFKC').trim().replace(/\s+/gu,' ');}
 function validate(value){const name=normalize(value),length=[...name].length;if(length<2||length>24||!/^[\p{L}\p{N} ._-]+$/u.test(name))return 'Tên cần 2–24 ký tự: chữ, số, dấu cách, dấu chấm, gạch ngang hoặc gạch dưới.';if(['chiến thần vnu','chien than vnu'].includes(name.toLocaleLowerCase('vi')))return 'Hãy đặt tên riêng, không dùng tên mặc định “Chiến Thần VNU”.';return '';}
 function errorText(error){return error?.code==='PT409'?'Tên này đã có người dùng. Bạn chọn một tên khác nhé.':error?.code==='PT422'?'Hãy đổi tên mặc định “Chiến Thần VNU” thành tên riêng của bạn.':error?.code==='22023'?'Tên cần 2–24 ký tự hợp lệ.':'Chưa xác nhận được tên. Kiểm tra kết nối rồi thử lại; tiến độ trên máy vẫn được giữ.';}
 function say(text){el('entry-message').textContent=text;}
 function signal(value=true){const current=waiters;waiters=[];current.forEach(resolve=>resolve(value));}
 function wait(){return new Promise(resolve=>waiters.push(resolve));}
 function stored(){try{return JSON.parse(localStorage.getItem(KEY));}catch{return null;}}
 function isRoomReady(){const user=context().user;return !!user&&verified.has(user.id);}
 function displayName(){return verified.get(context().user?.id)||'';}
 function close(){if(el('entry-dialog').open)el('entry-dialog').close();}
 function setBusy(value){busy=value;el('entry-name').disabled=value;for(const id of ['entry-login','entry-guest','entry-submit','entry-back'])el(id).disabled=value;}
 function show(nextMode='choice'){
  const same=el('entry-dialog').open&&mode===nextMode;mode=nextMode;
  el('entry-choices').hidden=mode!=='choice';el('entry-name-form').hidden=mode==='choice';el('entry-back').hidden=mode!=='guest';el('entry-close').hidden=mode!=='account';
  el('entry-title').textContent=mode==='choice'?'Bắt đầu theo cách của bạn':mode==='guest'?'Bạn muốn mọi người gọi là gì?':'Đặt tên riêng trước khi vào phòng';
  el('entry-intro').textContent=mode==='choice'?'Đăng nhập để đồng bộ tiến độ, hoặc chọn một tên riêng để học bằng tài khoản khách.':mode==='guest'?'Một tên riêng để nhận ra bạn trên ghế và trong chat. Tên không được trùng người khác.':'Tên này sẽ hiển thị trên ghế và tin nhắn của bạn. Mỗi người một tên, dễ nhận ra nhau hơn.';
  el('entry-submit').textContent=mode==='account'?'Lưu tên và vào phòng':'Dùng tên này · Vào Study RPG';
  if(!same&&mode!=='choice'){const candidate=normalize(state.character.name);el('entry-name').value=validate(candidate)?'':candidate;say('');}
  if(el('cloud-dialog').open)return;
  if(!el('entry-dialog').open)el('entry-dialog').showModal();
  if(!same&&mode!=='choice')el('entry-name').focus();
 }
 function accept(ctx,name){
  if(context().user?.id!==ctx.user.id)return false;
  verified.set(ctx.user.id,name);
  if(!mainUser())localStorage.setItem(KEY,JSON.stringify({id:ctx.user.id,name}));
  if(state.character.name!==name){state.character.name=name;saveGameState();renderHUD();}
  close();signal();return true;
 }
 async function readProfile(ctx){const result=await ctx.client.from('theater_profiles').select('display_name').eq('user_id',ctx.user.id).maybeSingle();if(result.error)throw result.error;return result.data?.display_name||'';}
 async function register(ctx,name){const result=await ctx.client.rpc('theater_register_name',{chosen_name:normalize(name)});if(result.error)throw result.error;return result.data.display_name;}
 async function boot(){
  if(mainUser()){close();signal();return;}
  if(booting)return booting;
  booting=(async()=>{const marker=stored();if(marker&&!validate(marker.name)){
   try{const ctx=await Theater.prepareGuest();if(mainUser())return;const name=await readProfile(ctx);if(name){const confirmed=await register(ctx,name);accept(ctx,confirmed);return;}}
   catch{if(mainUser())return;}
  }show('choice');})();
  try{await booting;}finally{booting=null;}
 }
 async function ensureRoom(){
  roomWanted=true;
  while(roomWanted){
   if(isRoomReady())return true;
   if(mainUser()){
    const ctx=context();try{
     let name=await readProfile(ctx);
     if(!name&&!validate(state.character.name))name=await register(ctx,state.character.name);
     if(name&&accept(ctx,name))return true;
    }catch(error){show('account');say(errorText(error));}
    if(!isRoomReady())show('account');
   }else if(!el('entry-dialog').open)await boot();
   if(isRoomReady())return true;
   if(!await wait())return false;
  }
  return false;
 }
 async function submit(event){
  event.preventDefault();if(busy)return;
  const name=normalize(el('entry-name').value),problem=validate(name);if(problem){say(problem);el('entry-name').focus();return;}
  setBusy(true);say('Đang xác nhận tên của bạn…');
  try{const ctx=mainUser()?context():await Theater.prepareGuest();const confirmed=await register(ctx,name);if(!accept(ctx,confirmed))signal();}
  catch(error){say(errorText(error));}
  finally{setBusy(false);}
 }
 async function rename(name){
  const problem=validate(name);if(problem){alert(problem);return null;}
  try{const ctx=context();if(!ctx.user){show('choice');return null;}const confirmed=await register(ctx,name);accept(ctx,confirmed);return confirmed;}
  catch(error){alert(errorText(error));return null;}
 }
 function accountChanged(){
  const id=mainUser()?.id||null;
  if(lastAccount!==id)verified.clear();
  if(lastAccount!==id&&Theater.connectionStatus().realtime)switchTab('tab-timer');
  lastAccount=id;signal();
  if(id)close();else void boot();
 }
 document.addEventListener('DOMContentLoaded',()=>{
  el('entry-dialog').addEventListener('cancel',event=>{event.preventDefault();});
  el('entry-name-form').addEventListener('submit',submit);
  el('entry-guest').addEventListener('click',()=>show('guest'));
  el('entry-back').addEventListener('click',()=>{say('');show('choice');});
  el('entry-login').addEventListener('click',()=>{close();el('cloud-account-button').click();});
  el('entry-close').addEventListener('click',()=>{roomWanted=false;close();signal(false);switchTab('tab-timer');});
  el('cloud-dialog').addEventListener('close',()=>{if(!mainUser())show(mode);else signal();});
 });
 return{boot,ensureRoom,isRoomReady,displayName,rename,accountChanged};
})();
