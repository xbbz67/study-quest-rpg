window.TheaterChat=(()=>{
 const el=id=>document.getElementById(id),context=()=>Theater.getContext();
 let active=false,epoch=0,messages=new Map(),sending=false,unread=0,connected=false;
 function say(text){el('theater-chat-status').textContent=text;}
 function render(){
  const list=el('theater-chat-list'),atBottom=list.scrollHeight-list.scrollTop-list.clientHeight<60;
  const rows=[...messages.values()].filter(row=>Date.parse(row.created_at)>Date.now()-7*86400000).sort((a,b)=>Number(a.id)-Number(b.id)).slice(-80);messages=new Map(rows.map(row=>[row.id,row]));
  list.replaceChildren(...rows.map(row=>{
   const item=document.createElement('div');item.className='theater-chat-message';item.dataset.messageId=row.id;
   if(row.user_id===context().user?.id)item.classList.add('is-mine');
   const meta=document.createElement('div'),name=document.createElement('strong'),time=document.createElement('time'),body=document.createElement('p');meta.className='theater-chat-meta';
   name.textContent=row.display_name+(row.user_id===context().user?.id?' · Bạn':'');time.dateTime=row.created_at;time.textContent=new Date(row.created_at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});body.textContent=row.body;
   meta.append(name,time);item.append(meta,body);return item;
  }));
  el('theater-chat-empty').hidden=rows.length>0;
  if(atBottom){list.scrollTop=list.scrollHeight;unread=0;}
  el('theater-chat-new').hidden=!unread;el('theater-chat-new').textContent=`${unread} tin mới ↓`;
 }
 function receive(event){
  if(!active)return;
  if(event.eventType==='DELETE'){messages.delete(event.old.id);render();return;}
  const row=event.new;if(!row?.id||!row.body)return;
  if(!messages.has(row.id)&&row.user_id!==context().user?.id)unread++;
  messages.set(row.id,row);render();
 }
 async function refresh(){
  if(!active)return;const captured=epoch,{client,user}=context();if(!client||!user)return;
  const {data,error}=await client.from('theater_messages').select('id,user_id,display_name,body,created_at').order('id',{ascending:false}).limit(80);
  if(!active||captured!==epoch)return;
  if(error){say('Chưa tải được chat. Đang thử kết nối lại.');return;}
  for(const row of data)messages.set(row.id,row);render();
  say(connected?'Chat trực tiếp · Mọi người trong phòng đều thấy tin nhắn.':'Chat sẵn sàng · Đang kết nối cập nhật trực tiếp.');
 }
 async function send(event){
  event?.preventDefault();if(sending||!active)return;
  const input=el('theater-chat-input'),body=input.value.trim(),{client,user}=context();
  if(!user||!client){say('Đang kết nối phòng. Chờ một chút rồi gửi nhé.');return;}
  if(!body)return;
  sending=true;el('theater-chat-send').disabled=true;const captured=epoch;
  try{
   const {data,error}=await client.rpc('theater_send_message',{message_text:body,nickname:String(state.character.name||'Bạn học').slice(0,40)});
   if(!active||captured!==epoch)return;
   if(error){say(error.code==='PT429'?'Bạn gửi hơi nhanh. Chờ một chút rồi thử lại.':'Chưa gửi được tin nhắn. Nội dung vẫn được giữ để thử lại.');return;}
   receive({eventType:'INSERT',new:data});if(input.value.trim()===body)input.value='';say('Đã gửi · Mọi người trong phòng đều thấy tin nhắn.');
  }catch{if(active&&captured===epoch)say('Mất kết nối. Tin nhắn chưa được gửi.');}
  finally{sending=false;if(active)el('theater-chat-send').disabled=false;}
 }
 function setConnection(value){connected=value;if(!active)return;if(value){say('Chat trực tiếp · Mọi người trong phòng đều thấy tin nhắn.');void refresh();}else say('Đang kết nối lại chat. Tin nhắn nháp vẫn được giữ.');}
 function enter(){active=true;epoch++;messages.clear();unread=0;render();el('theater-chat-send').disabled=false;void refresh();}
 function leave(){active=false;epoch++;messages.clear();connected=false;el('theater-chat-send').disabled=true;el('theater-chat-input').value='';}
 document.addEventListener('DOMContentLoaded',()=>{
  el('theater-chat-form').addEventListener('submit',send);
  el('theater-chat-new').addEventListener('click',()=>{const list=el('theater-chat-list');list.scrollTop=list.scrollHeight;unread=0;el('theater-chat-new').hidden=true;});
 });
 return{enter,leave,refresh,receive,setConnection};
})();
