window.Leaderboard=(()=>{
 let busy=false,active=false,epoch=0;
 const el=id=>document.getElementById(id);
 async function report(){
  if(busy||!window.EntryGate?.isRoomReady()||state.dailyFocus?.date!==getQuestDay())return;
  busy=true;try{return await Theater.getContext().client.rpc('report_focus_score',{study_day:state.dailyFocus.date,focus_seconds:Math.floor(state.dailyFocus.focusSeconds)});}finally{busy=false;}
 }
 async function refresh(){
  const token=epoch;
  try{await report();const {data,error}=await Theater.getContext().client.rpc('focus_leaderboard');if(!active||token!==epoch)return;if(error)throw error;
   el('leaderboard-day').textContent=`Khách: ngày ${data.day.split('-').reverse().join('/')} · Giờ Việt Nam`;
   el('leaderboard-rows').replaceChildren(...data.rows.map((row,i)=>{const tr=document.createElement('tr');if(row.is_me)tr.className='leaderboard-me';for(const text of [String(i+1),row.display_name+(row.is_me?' · Bạn':''),row.registered?'Tài khoản · Tích lũy':'Khách · Hôm nay',`${Math.floor(row.seconds/3600)} giờ ${Math.floor(row.seconds%3600/60)} phút`]){const td=document.createElement('td');td.textContent=text;tr.append(td);}return tr;}));
   el('leaderboard-status').textContent=data.rows.length?'Cập nhật mỗi 30 giây khi mở bảng.':'Chưa có thời gian tập trung. Bắt đầu một phiên học để xuất hiện ở đây.';
  }catch{if(active)el('leaderboard-status').textContent='Chưa tải được bảng xếp hạng. Kiểm tra kết nối rồi thử lại.';}
 }
 async function enter(){active=true;const token=++epoch;if(await EntryGate.ensureRoom()&&active&&token===epoch)await refresh();}
 function leave(){active=false;epoch++;}
 document.addEventListener('DOMContentLoaded',()=>{el('leaderboard-refresh').addEventListener('click',()=>{void refresh();});setInterval(()=>{if(active)void refresh();else void report().catch(()=>{});},30000);});
 return{enter,leave,report};
})();
