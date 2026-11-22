const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const storage=new Map();const context=vm.createContext({console,Date,Math,JSON,window:{addEventListener(){}},document:{getElementById(){return null;},querySelectorAll(){return[];},querySelector(){return null;},addEventListener(){}},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},setInterval(){return 1;},clearInterval(){},setTimeout(){},alert(){},confirm(){return true;}});
vm.runInContext(fs.readFileSync(process.argv[2]||path.join(__dirname,'../../app.js'),'utf8'),context);
vm.runInContext(`
 let testDay='2026-11-22';getQuestDay=()=>testDay;
 addLog=()=>{};renderHUD=()=>{};renderQuests=()=>{};updateTimerUI=()=>{};updateTimerModeButtons=()=>{};triggerConfetti=()=>{};showSaveIndicator=()=>{};addExp=()=>0;addGold=()=>0;
 for(const name of ['init','playAlarm','playQuestDone','startAmbient','stopAmbient'])sounds[name]=()=>{};
 function fresh(){state=JSON.parse(JSON.stringify(DEFAULT_STATE));testDay='2026-11-22';currentTimerMode='POMODORO';timerState='IDLE';isBreakSession=false;stopwatchSeconds=0;secondsAccumulator=0;ensureDailyQuests();}
 function broken(stock=0,last='2026-11-20'){fresh();state.streak=9;state.streakFreezes=stock;state.streakEarnedToday=state.lastActiveDate=last;checkDailyStreak();}
 function run(mode,seconds,minutes){setTimerMode(mode,minutes);timerState='RUNNING';for(let i=0;i<seconds;i++)tickTimer();}
`,context);
const run=code=>vm.runInContext(code,context);let checks=0;function check(name,condition){assert.equal(run(condition),true,name);checks++;console.log('PASS',name);}
run("broken();run('CUSTOM',1799,30);");check('Broken chain remains zero before 30 focused minutes','state.streak===0');run('tickTimer();');check('Completing 30-minute countdown restarts at one','state.streak===1&&state.streakEarnedToday===testDay');
run("broken();run('STOPWATCH',1800);");check('Stopwatch restarts a broken chain at exactly 30 minutes','state.streak===1&&state.dailyFocus.focusSeconds===1800');
run("broken();run('CUSTOM',900,15);run('CUSTOM',900,15);");check('Two 15-minute sessions restart a broken chain','state.streak===1&&state.dailyFocus.focusSeconds===1800');
run("broken();run('DEEP_WORK',1800);");check('Long focus session earns at minute 30 without waiting for minute 50','state.streak===1&&timerState==="RUNNING"&&timeRemaining===1200');
run("broken();run('POMODORO',1500);timerState='RUNNING';isBreakSession=true;for(let i=0;i<300;i++)tickTimer();");check('25-minute focus plus 5-minute break does not count as 30 focus minutes','state.streak===0&&state.dailyFocus.focusSeconds===1500');run("run('CUSTOM',300,5);");check('Another 5 focused minutes completes the daily streak','state.streak===1&&state.dailyFocus.focusSeconds===1800');
run("broken();timerState='PAUSED';for(let i=0;i<1800;i++)tickTimer();");check('Paused timer never earns a streak','state.streak===0&&state.dailyFocus.focusSeconds===0');
run("broken();run('STOPWATCH',1800);run('STOPWATCH',1800);resetTimer();run('CUSTOM',1800,30);");check('Further sessions and timer resets cannot add a second day','state.streak===1');
run("testDay='2026-11-23';resetTimer();run('STOPWATCH',1800);");check('Next calendar day advances a restarted chain normally','state.streak===2&&state.streakEarnedToday===testDay');
run("broken(1);run('STOPWATCH',1800);");check('Freeze preserves old chain and study adds one real day','state.streak===10&&state.streakFreezes===0');
run("broken(2,'2026-11-18');run('STOPWATCH',1800);");check('Insufficient freeze stock restarts chain without wasting stock','state.streak===1&&state.streakFreezes===2');
run("fresh();state.streak=0;state.streakEarnedToday=testDay;run('STOPWATCH',1800);");check('Stale earned-today marker cannot lock a zero streak forever','state.streak===1&&state.streakEarnedToday===testDay');
run("fresh();state.dailyFocus.focusSeconds=1800;saveGameState();state={};loadGameState();");check('Reload recovers today\'s already-recorded 30-minute study','state.streak===1&&state.streakEarnedToday===testDay');run('loadGameState();loadGameState();');check('Reload recovery is idempotent','state.streak===1');
run("testDay='2026-11-23';loadGameState();");check('Yesterday\'s saved focus cannot claim today\'s streak','state.streak===1&&state.dailyFocus.focusSeconds===0&&state.streakEarnedToday!==testDay');
run("broken();run('STOPWATCH',1200);testDay='2026-11-23';for(let i=0;i<600;i++)tickTimer();");check('Midnight splits focus between calendar days','state.streak===0&&state.dailyFocus.focusSeconds===600');
console.log('All '+checks+' streak restart checks passed.');
