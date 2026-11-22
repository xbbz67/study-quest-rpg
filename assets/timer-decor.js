window.TimerDecor=(()=>{
 const themes={
  orbit:{name:'Quỹ đạo',note:'Một hành tinh nhỏ, một mục tiêu lớn. Cứ đi hết vòng tập trung của bạn.',icon:'✦',art:`<g fill="currentColor"><circle cx="57" cy="102" r="2"/><circle cx="338" cy="302" r="2"/><circle cx="108" cy="352" r="1.5"/><path d="m93 49 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z"/><path d="m343 214 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" opacity=".65"/></g><g class="timer-art-float"><circle cx="334" cy="92" r="20" fill="#d5b48b"/><path d="M315 87q20 10 38 1M315 96q16 8 34 3" stroke="#b38e6c" fill="none" stroke-width="3"/><ellipse cx="334" cy="93" rx="35" ry="9" transform="rotate(-26 334 93)" fill="none" stroke="#ead1a9" stroke-width="3"/><circle cx="65" cy="299" r="9" fill="#a6a4ed"/><circle cx="63" cy="296" r="2" fill="#d0cdfc"/></g>`,},
  garden:{name:'Khu vườn',note:'Chăm chút từng phút một. Để sự tập trung lớn lên như một khu vườn.',icon:'❧',art:`<g fill="none" stroke="#81bda4" stroke-width="2.5" stroke-linecap="round"><path d="M65 282q-23-72 7-137M327 142q33 89 2 145M135 348q62 17 127-1"/></g><g class="timer-art-float" fill="#81bda4"><path d="M62 236q-39-12-31-43 35 7 31 43ZM61 208q38-9 33-36-29 2-33 36ZM66 177q-26-12-17-34 24 9 17 34ZM336 202q34-13 29-38-30 7-29 38ZM338 232q-34-12-33-37 31 6 33 37ZM332 267q32-3 35-27-29-1-35 27Z"/><path d="M161 353q-4-22-25-25 0 20 25 25ZM233 353q4-22 25-25 0 20-25 25Z" fill="#afcf97"/></g><g fill="#e9cb91"><circle cx="84" cy="116" r="3"/><circle cx="316" cy="307" r="3"/><path d="m305 73 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g>`},
  moon:{name:'Ánh trăng',note:'Hạ bớt tiếng ồn. Dành một khoảng bình yên để học theo nhịp của mình.',icon:'☾',art:`<g class="timer-art-float"><path d="M327 56a29 29 0 1 0 29 39 25 25 0 0 1-29-39Z" fill="#ded5fc"/><path d="m66 113 3 9 9 3-9 3-3 9-3-9-9-3 9-3ZM330 292l2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#c2b4f0"/></g><path d="m83 295 25 32 40 10M287 66l-33-21-34 9" stroke="#a293cf" opacity=".5" fill="none" stroke-dasharray="3 5"/><g fill="#c2b4f0"><circle cx="83" cy="295" r="3"/><circle cx="108" cy="327" r="2"/><circle cx="148" cy="337" r="2.5"/><circle cx="287" cy="66" r="2"/><circle cx="254" cy="45" r="3"/><circle cx="220" cy="54" r="2"/><circle cx="56" cy="233" r="1.5"/></g>`},
  minimal:{name:'Tối giản',note:'Chỉ có bạn và thời gian. Một mặt đồng hồ gọn gàng, không xao nhãng.',icon:'○',art:''}
 };
 const circumference=2*Math.PI*130;
 let applied=null;
 function selected(){return Object.hasOwn(themes,state.settings?.timerDecoration)?state.settings.timerDecoration:'orbit';}
 function art(key){return `<svg viewBox="0 0 400 400" fill="none" aria-hidden="true" focusable="false">${themes[key].art}</svg>`;}
 function render(){
  const key=selected(),theme=themes[key];
  if(applied!==key){
   document.querySelectorAll('[data-timer-orb]').forEach(orb=>{orb.dataset.decoration=key;orb.querySelector('.timer-decoration-art').innerHTML=art(key);});
   document.querySelectorAll('[data-timer-decoration]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.timerDecoration===key)));
   document.querySelectorAll('[data-timer-decoration-select]').forEach(select=>{select.value=key;});
   const note=document.getElementById('timer-decoration-note');if(note)note.textContent=theme.note;
   applied=key;
  }
  const stopwatch=currentTimerMode==='STOPWATCH';
  const seconds=stopwatch?stopwatchSeconds:timeRemaining;
  const ratio=Math.min(1,Math.max(0,stopwatch?stopwatchSeconds/1800:totalSessionSeconds>0?timeRemaining/totalSessionSeconds:1));
  const mode=stopwatch?'Bấm giờ · Mốc 30 phút':isBreakSession||timerState==='BREAK'?'Một chút nghỉ ngơi':TIMER_MODES[currentTimerMode].label;
  const phase=timerState==='RUNNING'?'running':timerState==='PAUSED'?'paused':'idle';
  document.querySelectorAll('[data-timer-orb]').forEach(orb=>{
   orb.dataset.state=phase;orb.dataset.break=String(isBreakSession||timerState==='BREAK');orb.style.setProperty('--timer-angle',`${ratio*360}deg`);
   const ring=orb.querySelector('[data-timer-ring]');ring.style.strokeDasharray=String(circumference);ring.style.strokeDashoffset=String(circumference*(1-ratio));
   const progress=orb.querySelector('[data-timer-progress]');progress.setAttribute('aria-valuenow',String(Math.round(ratio*100)));progress.setAttribute('aria-valuetext',`${stopwatch?'Đã tập trung':'Còn lại'} ${Math.floor(seconds/60)} phút ${seconds%60} giây`);
   orb.querySelector('[data-timer-mode-label]').textContent=mode;
  });
 }
 function select(key){if(!Object.hasOwn(themes,key))return;state.settings.timerDecoration=key;saveGameState();render();}
 function init(){
  const options=document.getElementById('timer-decoration-options');
  options.innerHTML=Object.entries(themes).map(([key,theme])=>`<button type="button" class="timer-decoration-choice" data-timer-decoration="${key}" aria-pressed="false"><span class="timer-decoration-swatch" data-decoration="${key}" aria-hidden="true"><span>${theme.icon}</span><i></i></span><span>${theme.name}</span><span class="timer-decoration-check" aria-hidden="true">✓</span></button>`).join('');
  options.addEventListener('click',event=>{const button=event.target.closest('[data-timer-decoration]');if(button)select(button.dataset.timerDecoration);});
  document.querySelectorAll('[data-timer-decoration-select]').forEach(selectElement=>{selectElement.innerHTML=Object.entries(themes).map(([key,theme])=>`<option value="${key}">${theme.name}</option>`).join('');selectElement.addEventListener('change',()=>select(selectElement.value));});
  applied=null;render();
 }
 document.addEventListener('DOMContentLoaded',init);
 return{render,select};
})();
