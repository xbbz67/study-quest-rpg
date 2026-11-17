/**
 * STUDY RPG - GAME ENGINE & STATE CONTROLLER
 * Full Gamification: EXP, Levels, Ranks, Pomodoro, Quests, Shop, LocalStorage
 */

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================

const STORAGE_KEY = 'STUDY_RPG_DATA_v1';

// Ranks definition based on level thresholds
const RANKS = [
  { minLevel: 1, maxLevel: 4, name: "Bronze", vietnamese: "Đồng Đoàn", icon: "🥉", color: "from-amber-700 to-amber-900", text: "text-amber-500", border: "border-amber-700", frameClass: "avatar-frame-bronze", badge: "BRONZE" },
  { minLevel: 5, maxLevel: 9, name: "Silver", vietnamese: "Bạc Tinh Anh", icon: "🥈", color: "from-slate-400 to-slate-600", text: "text-slate-300", border: "border-slate-400", frameClass: "avatar-frame-silver", badge: "SILVER" },
  { minLevel: 10, maxLevel: 19, name: "Gold", vietnamese: "Vàng Chiến Tướng", icon: "🥇", color: "from-yellow-400 to-amber-500", text: "text-yellow-400", border: "border-yellow-400", frameClass: "avatar-frame-gold", badge: "GOLD" },
  { minLevel: 20, maxLevel: 29, name: "Platinum", vietnamese: "Bạch Kim Siêu Đẳng", icon: "💠", color: "from-teal-300 to-cyan-500", text: "text-cyan-300", border: "border-cyan-400", frameClass: "avatar-frame-platinum", badge: "PLATINUM" },
  { minLevel: 30, maxLevel: 39, name: "Diamond", vietnamese: "Kim Cương Tối Thượng", icon: "💎", color: "from-blue-400 to-indigo-600", text: "text-blue-400", border: "border-blue-400", frameClass: "avatar-frame-diamond", badge: "DIAMOND" },
  { minLevel: 40, maxLevel: 49, name: "Master", vietnamese: "Cao Thủ Học Thuật", icon: "🔮", color: "from-purple-500 to-fuchsia-600", text: "text-purple-400", border: "border-purple-400", frameClass: "avatar-frame-master", badge: "MASTER" },
  { minLevel: 50, maxLevel: 69, name: "Grandmaster", vietnamese: "Đại Cao Thủ", icon: "👑", color: "from-rose-500 to-red-700", text: "text-rose-400", border: "border-rose-500", frameClass: "avatar-frame-grandmaster", badge: "GRANDMASTER" },
  { minLevel: 70, maxLevel: 999, name: "Challenger", vietnamese: "Global Elite Thần Thoại", icon: "⚡", color: "from-amber-300 via-rose-500 to-purple-600", text: "text-amber-300", border: "border-amber-400", frameClass: "avatar-frame-challenger", badge: "GLOBAL ELITE" }
];

const SHOP_ITEMS = [
  { id: 'buff_exp_2x', category: 'buff', name: 'Bùa X2 EXP (30 Phút)', desc: 'Gấp đôi toàn bộ EXP nhận được khi học và làm nhiệm vụ trong 30 phút.', cost: 80, icon: '📜', durationMinutes: 30 },
  { id: 'pet_owl', category: 'pet', name: 'Cú Mèo Thức Khuya', desc: 'Thần thú hộ mệnh tăng thêm +10% EXP vĩnh viễn khi tập trung.', cost: 250, icon: '🦉' },
  { id: 'pet_coffee', category: 'pet', name: 'Ly Cà Phê Bất Tử', desc: 'Linh vật chống buồn ngủ, tăng +5 Vàng mỗi phiên Pomodoro.', cost: 200, icon: '☕' },
  { id: 'title_night_owl', category: 'title', name: 'Chiến Binh Đêm Khuya', desc: 'Danh hiệu dành cho những người cày cuốc thâu đêm.', cost: 50, icon: '🌙' },
  { id: 'title_exam_slayer', category: 'title', name: 'Kẻ Hủy Diệt Đề Thi', desc: 'Danh hiệu tối thượng khi chuẩn bị vào phòng thi.', cost: 120, icon: '⚔️' },
  { id: 'title_gpa_wizard', category: 'title', name: 'Đại Pháp Sư GPA 4.0', desc: 'Danh hiệu tối cao của bậc học giả.', cost: 300, icon: '🎓' },
  { id: 'title_god_speed', category: 'title', name: 'Chúa Tể Không Trì Hoãn', desc: 'Không có việc gì ngày mai làm mà hôm nay không giải quyết!', cost: 500, icon: '⚡' },
  { id: 'frame_gold', category: 'frame', name: 'Khung Hào Quang Vàng', desc: 'Khung viền phát sáng ánh kim rực rỡ quanh Avatar.', cost: 100, icon: '✨' },
  { id: 'frame_neon_cyan', category: 'frame', name: 'Khung Cyber Neon', desc: 'Khung viền công nghệ tương lai phát sáng xanh cyan.', cost: 150, icon: '🩵' },
  { id: 'frame_arcane_purple', category: 'frame', name: 'Khung Ma Thuật Hư Không', desc: 'Khung viền tím ma thuật bí ẩn.', cost: 250, icon: '🔮' }
];

const DEFAULT_STATE = {
  character: {
    name: "Chiến Thần VNU",
    title: "Giang Hồ Học Thuật",
    avatar: "🐱",
    frame: "default",
    pet: null
  },
  level: 1,
  currentExp: 0,
  gold: 50,
  totalMinutesStudied: 0,
  pomodoroCompleted: 0,
  streak: 1,
  streakEarnedToday: null, // ngày YYYY-MM-DD khi streak đã được tích hôm nay
  lastActiveDate: new Date().toISOString().split('T')[0],
  activeBuff: null, // { type: 'exp_2x', expiresAt: timestamp }
  inventory: [],
  purchasedItems: [],
  quests: [],
  logs: [
    { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: "Ân oán giang hồ nuôi tao lớn - ĐHQG Hà Nội dạy tao khôn! Bắt đầu cày cấp ngay!" }
  ],
  settings: {
    sound: true,
    ambient: 'off',
    ambientVolume: 0.3
  }
};

// ==========================================
// 2. AUDIO SYNTHESIZER (Web Audio API)
// ==========================================

class SoundManager {
  constructor() {
    this.ctx = null;
    this.ambientSource = null;
    this.ambientGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playQuestDone() {
    if (!state.settings.sound) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.4);
    });
  }

  playCoin() {
    if (!state.settings.sound) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playLevelUp() {
    if (!state.settings.sound) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Triumphant Fanfare Arpeggio
    const chords = [
      { f: 440.00, t: 0.0 },   // A4
      { f: 554.37, t: 0.12 },  // C#5
      { f: 659.25, t: 0.24 },  // E5
      { f: 880.00, t: 0.38 },  // A5
      { f: 1108.73, t: 0.52 }, // C#6
      { f: 1318.51, t: 0.68 }  // E6
    ];

    chords.forEach(c => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f, now + c.t);

      gain.gain.setValueAtTime(0, now + c.t);
      gain.gain.linearRampToValueAtTime(0.25, now + c.t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + c.t + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + c.t);
      osc.stop(now + c.t + 0.7);
    });
  }

  playRankUp() {
    if (!state.settings.sound) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Grand royal fanfare
    const notes = [392, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, now);

      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.8);
    });
  }

  playAlarm() {
    if (!state.settings.sound) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let r = 0; r < 3; r++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now + r * 0.25);

      gain.gain.setValueAtTime(0.25, now + r * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + r * 0.25 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + r * 0.25);
      osc.stop(now + r * 0.25 + 0.22);
    }
  }

  startAmbient(type) {
    this.stopAmbient();
    if (type === 'off') return;

    this.init();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    if (type === 'rain' || type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    } else {
      // White noise / flow
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.2;
      }
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
    filter.frequency.value = type === 'rain' ? 800 : 1000;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = state.settings.ambientVolume || 0.2;

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    whiteNoise.start(0);

    this.ambientSource = whiteNoise;
    this.ambientGain = gainNode;
  }

  stopAmbient() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      } catch (e) {}
      this.ambientSource = null;
    }
  }

  setAmbientVolume(vol) {
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }
}

const sounds = new SoundManager();

// ==========================================
// 3. GAME STATE MANAGEMENT & STORAGE
// ==========================================

let state = { ...DEFAULT_STATE };

function loadGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...DEFAULT_STATE, ...parsed };
      // Deep merge character & settings
      state.character = { ...DEFAULT_STATE.character, ...(parsed.character || {}) };
      state.settings = { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) };
      
      // Check streak
      checkDailyStreak();
      checkBuffExpiration();
    } else {
      saveGameState();
    }
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu LocalStorage:", err);
    state = { ...DEFAULT_STATE };
  }
  ensureDailyQuests();
  saveGameState();
}

function saveGameState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    showSaveIndicator();
  } catch (err) {
    console.error("Không thể lưu LocalStorage:", err);
  }
}

function checkDailyStreak() {
  // Streak KHÔNG tự tăng khi mở website.
  // Streak chỉ được cập nhật khi người dùng hoàn thành ≥30 phút học (gọi từ onTimerCompleted).
  const today = new Date().toISOString().split('T')[0];
  if (!state.lastActiveDate) {
    state.lastActiveDate = today;
    state.streak = 1;
  }
  // Chỉ kiểm tra xem streak có bị gãy không (không hoạt động hơn 1 ngày)
  const lastDate = new Date(state.lastActiveDate);
  const todayDate = new Date(today);
  const diffDays = Math.round((todayDate - lastDate) / 86400000);
  if (diffDays > 1) {
    // Gãy streak vì bỏ cách hơn 1 ngày không học
    state.streak = 0;
    addLog(`💔 Chuỗi cày cấp bị gãy! Hãy hoàn thành ≥30 phút học hôm nay để bắt đầu streak mới.`);
    saveGameState();
  }
  // Hiển thị note nhắc nhở khi mở website
  const todayEarned = state.streakEarnedToday || false;
  if (!todayEarned) {
    addLog(`ℹ️ Streak hôm nay chưa được tích! Hãy hoàn thành ít nhất 1 phiên ≥30 phút để +1 streak 🔥`);
  }
}

// Hàm này được gọi từ onTimerCompleted khi đủ điều kiện (≥30 phút)
function earnDailyStreak() {
  const today = new Date().toISOString().split('T')[0];
  // Đã tích streak hôm nay rồi thì không tích nữa
  if (state.streakEarnedToday === today) return;

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (state.lastActiveDate === yesterday || state.lastActiveDate === today) {
    state.streak = (state.streak || 0) + 1;
    addLog(`🔥 STREAK! Chuỗi cày cấp liên tục: ${state.streak} ngày! Xuất sắc!`);
  } else {
    state.streak = 1;
    addLog(`🔥 Bắt đầu chuỗi cày cấp mới! Duy trì mỗi ngày để lên cao nhé!`);
  }
  state.streakEarnedToday = today;
  state.lastActiveDate = today;
  saveGameState();
}

function checkBuffExpiration() {
  if (state.activeBuff && state.activeBuff.expiresAt) {
    if (Date.now() > state.activeBuff.expiresAt) {
      addLog(`⏳ Hiệu lực ${state.activeBuff.name} đã kết thúc.`);
      state.activeBuff = null;
      saveGameState();
    }
  }
}

// ==========================================
// 4. LEVEL, EXP & RANK CALCULATIONS
// ==========================================

function getExpNeeded(level) {
  // Formula: 100 * (level ^ 1.25)
  return Math.floor(100 * Math.pow(level, 1.25));
}

function getCurrentRank(level) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (level >= RANKS[i].minLevel) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

function getNextRank(level) {
  const currentRank = getCurrentRank(level);
  const currentIndex = RANKS.indexOf(currentRank);
  if (currentIndex < RANKS.length - 1) {
    return RANKS[currentIndex + 1];
  }
  return null; // Highest Rank (Challenger / Global Elite)
}

function addExp(amount, sourceText = "", eventX = null, eventY = null) {
  if (amount <= 0) return;

  // Calculate pet multiplier
  let petMultiplier = 1;
  if (state.character.pet === 'pet_owl') {
    petMultiplier += 0.10; // +10% EXP
  }

  // Calculate buff multiplier
  let buffMultiplier = 1;
  if (state.activeBuff && state.activeBuff.type === 'buff_exp_2x') {
    if (Date.now() < state.activeBuff.expiresAt) {
      buffMultiplier = 2;
    } else {
      state.activeBuff = null;
    }
  }

  const finalExp = Math.round(amount * buffMultiplier * petMultiplier);
  state.currentExp += finalExp;

  // Visual floating text
  spawnFloatingText(`+${finalExp} EXP`, 'text-indigo-400', eventX, eventY);

  const prevLevel = state.level;
  const prevRank = getCurrentRank(prevLevel);

  let leveledUp = false;
  while (state.currentExp >= getExpNeeded(state.level)) {
    state.currentExp -= getExpNeeded(state.level);
    state.level += 1;
    leveledUp = true;
    
    // Level up reward
    const rewardGold = state.level * 25;
    state.gold += rewardGold;
    addLog(`🎉 THĂNG CẤP LÊN LEVEL ${state.level}! Nhận thưởng +${rewardGold} Vàng.`);
  }

  if (leveledUp) {
    const newRank = getCurrentRank(state.level);
    if (newRank.name !== prevRank.name) {
      // RANK UP!
      triggerRankUpModal(prevRank, newRank);
    } else {
      triggerLevelUpModal(state.level);
    }
  }

  saveGameState();
  renderHUD();
}

function addGold(amount, eventX = null, eventY = null) {
  if (amount <= 0) return;
  state.gold += amount;
  sounds.playCoin();
  spawnFloatingText(`+${amount} Vàng`, 'text-yellow-400', eventX, eventY);
  saveGameState();
  renderHUD();
}

// ==========================================
// 5. FOCUS TIMER & POMODORO SYSTEM
// ==========================================

const TIMER_MODES = {
  POMODORO: { label: 'Pomodoro', focusMinutes: 25, breakMinutes: 5, expReward: 50, goldReward: 20 },
  DEEP_WORK: { label: 'Deep Work', focusMinutes: 50, breakMinutes: 10, expReward: 120, goldReward: 50 },
  CUSTOM: { label: 'Tùy Chỉnh', focusMinutes: 15, breakMinutes: 5, expReward: 30, goldReward: 15 },
  STOPWATCH: { label: 'Bấm Giờ Tự Do', focusMinutes: 0, breakMinutes: 0, expReward: 0, goldReward: 0 }
};

let currentTimerMode = 'POMODORO';
let timerState = 'IDLE'; // 'IDLE', 'RUNNING', 'PAUSED', 'BREAK'
let timeRemaining = 25 * 60; // in seconds
let totalSessionSeconds = 25 * 60;
let stopwatchSeconds = 0;
let timerInterval = null;
let secondsAccumulator = 0; // Tracks every 60s of active study for real-time EXP/Gold
let isBreakSession = false;

function setTimerMode(modeKey, customMinutes = null) {
  if (timerState === 'RUNNING') {
    if (!confirm("Phiên học đang diễn ra. Bạn có chắc muốn đổi chế độ và hủy phiên hiện tại?")) {
      return;
    }
  }

  clearInterval(timerInterval);
  timerState = 'IDLE';
  currentTimerMode = modeKey;
  isBreakSession = false;

  const mode = TIMER_MODES[modeKey];
  if (modeKey === 'CUSTOM' && customMinutes) {
    mode.focusMinutes = customMinutes;
    mode.expReward = Math.round(customMinutes * 2);
    mode.goldReward = Math.round(customMinutes * 0.8);
  }

  if (modeKey === 'STOPWATCH') {
    stopwatchSeconds = 0;
    timeRemaining = 0;
    totalSessionSeconds = 0;
  } else {
    timeRemaining = mode.focusMinutes * 60;
    totalSessionSeconds = timeRemaining;
  }

  secondsAccumulator = 0;
  updateTimerUI();
  updateTimerModeButtons();
}

function startTimer() {
  if (timerState === 'RUNNING') return;

  sounds.init();
  if (timerState === 'BREAK') isBreakSession = true;
  timerState = 'RUNNING';

  // If ambient sound is selected, play it
  if (state.settings.ambient !== 'off') {
    sounds.startAmbient(state.settings.ambient);
  }

  // Auto show Lofi Girl if toggled
  const lofiAuto = document.getElementById('lofi-autostart-toggle');
  if (lofiAuto && lofiAuto.checked) {
    const lofiExpanded = document.getElementById('lofi-expanded');
    if (lofiExpanded && lofiExpanded.classList.contains('hidden')) {
      toggleLofiExpand();
    }
  }

  timerInterval = setInterval(() => {
    tickTimer();
  }, 1000);

  updateTimerUI();
  addLog(isBreakSession ? '☕ Bắt đầu giờ nghỉ giải lao.' : `⏱️ Bắt đầu phiên học: ${TIMER_MODES[currentTimerMode].label}`);
}

function pauseTimer() {
  if (timerState !== 'RUNNING') return;

  clearInterval(timerInterval);
  timerState = 'PAUSED';
  sounds.stopAmbient();
  updateTimerUI();
  addLog(`⏸️ Tạm dừng phiên học.`);
}

function resetTimer() {
  clearInterval(timerInterval);
  sounds.stopAmbient();
  timerState = 'IDLE';
  isBreakSession = false;

  if (currentTimerMode === 'STOPWATCH') {
    stopwatchSeconds = 0;
  } else {
    timeRemaining = TIMER_MODES[currentTimerMode].focusMinutes * 60;
    totalSessionSeconds = timeRemaining;
  }

  secondsAccumulator = 0;
  updateTimerUI();
}

function tickTimer() {
  if (timerState !== 'RUNNING') return;
  if (isBreakSession) {
    timeRemaining = Math.max(0, timeRemaining - 1);
    updateTimerUI();
    if (timeRemaining === 0) onTimerCompleted();
    return;
  }
  const newDay = ensureDailyQuests();
  state.dailyFocus.focusSeconds += 1;
  if (currentTimerMode === 'STOPWATCH') state.dailyFocus.stopwatchSeconds += 1;
  if (newDay) renderQuests();
  secondsAccumulator++;

  // Every 60 seconds of focused study gives +10 EXP and +2 Gold
  if (secondsAccumulator >= 60) {
    secondsAccumulator = 0;
    state.totalMinutesStudied += 1;
    
    // Live accumulation: 10 EXP + 2 Gold per minute
    addExp(10, 'per_minute');
    addGold(2);

    // Check if daily quest for focus minutes exists
    checkFocusQuests();
    saveGameState();
    renderHUD();
  }

  if (currentTimerMode === 'STOPWATCH') {
    stopwatchSeconds++;
    updateTimerUI();
    return;
  }

  // Countdown modes
  if (timeRemaining > 0) {
    timeRemaining--;
    updateTimerUI();
  }
  if (timeRemaining === 0) onTimerCompleted();
}

function onTimerCompleted() {
  clearInterval(timerInterval);
  sounds.stopAmbient();
  sounds.playAlarm();

  if (timerState === 'RUNNING' && !isBreakSession) {
    // Finished focus block
    const mode = TIMER_MODES[currentTimerMode];
    state.pomodoroCompleted += 1;
    ensureDailyQuests();
    if (currentTimerMode === 'POMODORO') state.dailyFocus.pomodoros += 1;
    if (currentTimerMode === 'DEEP_WORK') state.dailyFocus.deepWork += 1;
    if (currentTimerMode === 'CUSTOM' && mode.focusMinutes >= 15) state.dailyFocus.customSessions += 1;
    checkFocusQuests();

    // Additional pet coffee bonus
    let bonusGold = mode.goldReward;
    if (state.character.pet === 'pet_coffee') {
      bonusGold += 5;
    }

    addExp(mode.expReward, 'session_complete');
    addGold(bonusGold);

    addLog(`🏆 Hoàn thành trọn vẹn phiên ${mode.label} (+${mode.expReward} EXP, +${bonusGold} Vàng)!`);
    triggerConfetti();

    // Tích streak nếu phiên học >= 30 phút
    if (mode.focusMinutes >= 30) {
      earnDailyStreak();
    } else {
      addLog(`⏳ Phiên này chỉ ${mode.focusMinutes} phút — cần ≥30 phút để tích streak 🔥`);
    }

    // Switch to break
    timerState = 'BREAK';
    timeRemaining = mode.breakMinutes * 60;
    totalSessionSeconds = timeRemaining;
    updateTimerUI();

    alert(`🎉 XUẤT SẮC! Bạn đã hoàn thành phiên học ${mode.label}.\nNhận ngay +${mode.expReward} EXP và +${bonusGold} Vàng!\nHãy nghỉ ngơi thư giãn ${mode.breakMinutes} phút nào!`);
  } else if (timerState === 'BREAK' || isBreakSession) {
    // Finished break
    timerState = 'IDLE';
    isBreakSession = false;
    timeRemaining = TIMER_MODES[currentTimerMode].focusMinutes * 60;
    totalSessionSeconds = timeRemaining;
    updateTimerUI();
    alert(`⚡ Hết giờ nghỉ giải lao! Đã sẵn sàng cho phiên cày cấp tiếp theo chưa?`);
  }
}

function updateTimerUI() {
  const timerDisplay = document.getElementById('timer-display');
  const timerStatus = document.getElementById('timer-status');
  const timerCircle = document.getElementById('timer-progress-ring');
  const startBtn = document.getElementById('btn-timer-start');
  const pauseBtn = document.getElementById('btn-timer-pause');
  const resetBtn = document.getElementById('btn-timer-reset');
  const timerContainer = document.getElementById('timer-container');

  let minutes = 0;
  let seconds = 0;

  if (currentTimerMode === 'STOPWATCH') {
    minutes = Math.floor(stopwatchSeconds / 60);
    seconds = stopwatchSeconds % 60;
    if (timerCircle) {
      // Just keep full ring for stopwatch
      timerCircle.style.strokeDashoffset = 0;
    }
  } else {
    minutes = Math.floor(timeRemaining / 60);
    seconds = timeRemaining % 60;

    if (timerCircle && totalSessionSeconds > 0) {
      const radius = 130;
      const circumference = 2 * Math.PI * radius;
      const progress = (totalSessionSeconds - timeRemaining) / totalSessionSeconds;
      const offset = circumference - (progress * circumference);
      timerCircle.style.strokeDashoffset = offset;
    }
  }

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  if (timerDisplay) {
    timerDisplay.innerText = formattedTime;
  }
  document.title = timerState === 'RUNNING' ? `(${formattedTime}) ${isBreakSession ? 'Đang nghỉ' : 'Đang cày cấp'}... | Study RPG` : `Study RPG - Cày Cấp Học Tập`;

  // Status text and glow
  if (timerStatus) {
    if (timerState === 'RUNNING' && !isBreakSession) {
      timerStatus.innerText = '🔥 ĐANG TẬP TRUNG HỌC TẬP';
      timerStatus.className = 'text-xs uppercase tracking-widest font-bold text-amber-400 animate-pulse';
      timerContainer?.classList.add('timer-active-glow');
    } else if (timerState === 'BREAK' || (timerState === 'RUNNING' && isBreakSession)) {
      timerStatus.innerText = '☕ ĐANG GIẢI LAO THƯ GIÃN';
      timerStatus.className = 'text-xs uppercase tracking-widest font-bold text-emerald-400 animate-pulse';
      timerContainer?.classList.remove('timer-active-glow');
    } else if (timerState === 'PAUSED') {
      timerStatus.innerText = '⏸️ ĐANG TẠM DỪNG';
      timerStatus.className = 'text-xs uppercase tracking-widest font-bold text-slate-400';
      timerContainer?.classList.remove('timer-active-glow');
    } else {
      timerStatus.innerText = 'READY TO FOCUS';
      timerStatus.className = 'text-xs uppercase tracking-widest font-bold text-slate-500';
      timerContainer?.classList.remove('timer-active-glow');
    }
  }

  // Buttons visibility
  if (startBtn && pauseBtn) {
    if (timerState === 'RUNNING') {
      startBtn.classList.add('hidden');
      pauseBtn.classList.remove('hidden');
    } else {
      startBtn.classList.remove('hidden');
      pauseBtn.classList.add('hidden');
    }
  }
}

function updateTimerModeButtons() {
  document.querySelectorAll('.timer-mode-btn').forEach(btn => {
    const mode = btn.dataset.mode;
    if (mode === currentTimerMode) {
      btn.className = 'timer-mode-btn px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400';
    } else {
      btn.className = 'timer-mode-btn px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50';
    }
  });
}

// ==========================================
// 6. DAILY QUESTS SYSTEM
// ==========================================

let questFilter = 'all'; // 'all', 'active', 'completed'

const TIMER_QUESTS = [
  { key: 'warmup', title: 'Khởi động: tập trung đủ 10 phút', metric: 'focusSeconds', target: 600, unit: 'phút', difficulty: 'easy', exp: 60, gold: 15 },
  { key: 'rhythm', title: 'Vào guồng: tích lũy 30 phút tập trung', metric: 'focusSeconds', target: 1800, unit: 'phút', difficulty: 'medium', exp: 120, gold: 35 },
  { key: 'pomodoro', title: 'Hoàn thành 2 phiên Pomodoro 25 phút', metric: 'pomodoros', target: 2, unit: 'phiên', difficulty: 'medium', exp: 150, gold: 50 },
  { key: 'deep', title: 'Lặn sâu: hoàn thành 1 phiên Deep Work 50 phút', metric: 'deepWork', target: 1, unit: 'phiên', difficulty: 'hard', exp: 220, gold: 65 },
  { key: 'custom', title: 'Nhịp riêng: hoàn thành 1 phiên tùy chỉnh từ 15 phút', metric: 'customSessions', target: 1, unit: 'phiên', difficulty: 'easy', exp: 80, gold: 20 },
  { key: 'free', title: 'Tự do tập trung: bấm giờ đủ 15 phút', metric: 'stopwatchSeconds', target: 900, unit: 'phút', difficulty: 'easy', exp: 80, gold: 25 },
  { key: 'boss', title: 'Boss: chinh phục 90 phút tập trung trong ngày', metric: 'focusSeconds', target: 5400, unit: 'phút', difficulty: 'boss', exp: 400, gold: 120 }
];

function getQuestDay() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function ensureDailyQuests() {
  const day = getQuestDay();
  if (state.dailyFocus?.date === day && state.dailyFocus.version === 1) return false;
  state.dailyFocus = { date: day, version: 1, focusSeconds: 0, stopwatchSeconds: 0, pomodoros: 0, deepWork: 0, customSessions: 0 };
  const customQuests = state.quests.filter(q => !q.timerGoal && !(q.isDaily && ['q1', 'q2', 'q3', 'q4'].includes(q.id)));
  state.quests = [...customQuests, ...TIMER_QUESTS.map(goal => ({
    id: `daily_${day}_${goal.key}`, title: goal.title, category: 'Tập trung',
    difficulty: goal.difficulty, exp: goal.exp, gold: goal.gold,
    completed: false, isDaily: true, timerGoal: { ...goal }
  }))];
  return true;
}

function timerQuestProgress(quest) {
  const goal = quest.timerGoal;
  const value = Math.min(state.dailyFocus[goal.metric] || 0, goal.target);
  const divisor = goal.unit === 'phút' ? 60 : 1;
  return { current: Math.floor(value / divisor), target: goal.target / divisor, percent: Math.floor(value / goal.target * 100) };
}

function renderQuests() {
  if (ensureDailyQuests()) saveGameState();
  const container = document.getElementById('quests-list');
  if (!container) return;

  const filtered = state.quests.filter(q => {
    if (questFilter === 'active') return !q.completed;
    if (questFilter === 'completed') return q.completed;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-slate-500">
        <div class="text-4xl mb-3">📜</div>
        <p class="font-medium">Chưa có nhiệm vụ nào trong danh sách!</p>
        <p class="text-xs text-slate-600 mt-1">Bấm "+ Thêm Nhiệm Vụ" để đặt mục tiêu cày cấp hôm nay.</p>
      </div>
    `;
    return;
  }

  const difficultyBadges = {
    easy: { label: 'DỄ', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    medium: { label: 'VỪA', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    hard: { label: 'KHÓ', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    boss: { label: 'BOSS', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' }
  };

  container.innerHTML = filtered.map(quest => {
    const badge = difficultyBadges[quest.difficulty] || difficultyBadges.easy;
    const progress = quest.timerGoal ? timerQuestProgress(quest) : null;
    return `
      <div class="quest-item group p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border ${quest.completed ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-700/60'} transition-all flex items-center justify-between gap-4">
        <div class="flex items-start gap-3.5 flex-1 min-w-0">
          <button ${quest.timerGoal ? 'disabled title="Tự động hoàn thành khi đạt mục tiêu timer"' : `onclick="toggleQuest('${quest.id}', event)"`} aria-label="${quest.completed ? 'Đã hoàn thành' : 'Hoàn thành nhiệm vụ'}" class="mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${quest.completed ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30' : 'border-slate-600 hover:border-indigo-400 bg-slate-900/50'}">
            ${quest.completed ? '<svg class="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>' : ''}
          </button>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}">
                ${badge.label}
              </span>
              <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/80 px-2 py-0.5 rounded">
                ${escapeHtml(quest.category || 'Mục tiêu')}
              </span>
            </div>
            <h4 class="text-sm font-semibold ${quest.completed ? 'line-through text-slate-500' : 'text-slate-200'}">
              ${escapeHtml(quest.title)}
            </h4>
            ${progress ? `<p class="text-xs text-slate-400 mt-1">${progress.current}/${progress.target} ${quest.timerGoal.unit} · ${quest.completed ? 'Đã nhận thưởng' : 'Tự động ghi nhận từ timer'}</p>
            <div class="h-1.5 mt-2 rounded-full bg-slate-700/60 overflow-hidden" role="progressbar" aria-label="Tiến độ nhiệm vụ" aria-valuenow="${progress.current}" aria-valuemin="0" aria-valuemax="${progress.target}"><div class="h-full rounded-full ${quest.completed ? 'bg-emerald-400' : 'bg-indigo-400'} transition-all" style="width:${progress.percent}%"></div></div>` : ''}
          </div>
        </div>

        <div class="flex items-center gap-3 flex-shrink-0">
          <div class="text-right">
            <div class="text-xs font-bold text-indigo-400 flex items-center justify-end gap-1">
              <span>+${quest.exp}</span> <span class="text-[10px] text-slate-400">EXP</span>
            </div>
            <div class="text-xs font-bold text-yellow-400 flex items-center justify-end gap-1">
              <span>+${quest.gold}</span> <span class="text-[10px]">🪙</span>
            </div>
          </div>
          <button ${quest.timerGoal ? 'hidden' : ''} onclick="deleteQuest('${quest.id}')" title="Xóa nhiệm vụ" class="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleQuest(id, event) {
  if (ensureDailyQuests()) { saveGameState(); renderQuests(); }
  const quest = state.quests.find(q => q.id === id);
  if (!quest || quest.timerGoal) return;

  quest.completed = !quest.completed;

  if (quest.completed) {
    sounds.playQuestDone();
    addExp(quest.exp, 'quest', event?.clientX, event?.clientY);
    addGold(quest.gold, event?.clientX, event?.clientY);
    addLog(`⚔️ Hoàn thành nhiệm vụ: "${quest.title}" (+${quest.exp} EXP, +${quest.gold} Vàng)!`);
  } else {
    // If unchecked, deduct reward
    state.currentExp = Math.max(0, state.currentExp - quest.exp);
    state.gold = Math.max(0, state.gold - quest.gold);
    addLog(`↩️ Đã hủy hoàn thành nhiệm vụ: "${quest.title}".`);
  }

  saveGameState();
  renderQuests();
  renderHUD();
}

function addCustomQuest(title, category, difficulty) {
  if (!title || !title.trim()) return;

  const rewards = {
    easy: { exp: 80, gold: 20 },
    medium: { exp: 160, gold: 45 },
    hard: { exp: 300, gold: 80 },
    boss: { exp: 650, gold: 180 }
  };

  const reward = rewards[difficulty] || rewards.medium;

  const newQuest = {
    id: 'quest_' + Date.now(),
    title: title.trim(),
    category: category || 'Học tập',
    difficulty: difficulty || 'medium',
    exp: reward.exp,
    gold: reward.gold,
    completed: false,
    isDaily: false,
    createdAt: new Date().toISOString()
  };

  state.quests.unshift(newQuest);
  saveGameState();
  renderQuests();
  addLog(`📋 Đã thêm nhiệm vụ mới: "${newQuest.title}"`);
}

function deleteQuest(id) {
  state.quests = state.quests.filter(q => q.id !== id || q.timerGoal);
  saveGameState();
  renderQuests();
}

function resetAllQuests() {
  ensureDailyQuests();
  saveGameState();
  renderQuests();
  addLog('🔄 Đã cập nhật nhiệm vụ hôm nay. Thử thách timer tự làm mới khi sang ngày mới.');
}

function checkFocusQuests() {
  ensureDailyQuests();
  for (const quest of state.quests) {
    if (quest.timerGoal && !quest.completed && state.dailyFocus[quest.timerGoal.metric] >= quest.timerGoal.target) {
      quest.completed = true;
      sounds.playQuestDone();
      addExp(quest.exp, 'quest_auto');
      addGold(quest.gold);
      addLog(`🎯 Hoàn thành: ${quest.title} (+${quest.exp} EXP, +${quest.gold} Vàng)!`);
    }
  }
  saveGameState();
  renderQuests();
}

// ==========================================
// 7. RPG SHOP & INVENTORY
// ==========================================

function renderShop() {
  const container = document.getElementById('shop-items-list');
  if (!container) return;

  container.innerHTML = SHOP_ITEMS.map(item => {
    const isPurchased = state.purchasedItems.includes(item.id);
    const isEquipped = 
      (item.category === 'title' && state.character.title === item.name) ||
      (item.category === 'frame' && state.character.frame === item.id) ||
      (item.category === 'pet' && state.character.pet === item.id);
    const canAfford = state.gold >= item.cost;

    let buttonHtml = '';
    if (item.category === 'buff') {
      const isBuffActive = state.activeBuff && state.activeBuff.type === item.id && Date.now() < state.activeBuff.expiresAt;
      if (isBuffActive) {
        const remainingMin = Math.ceil((state.activeBuff.expiresAt - Date.now()) / 60000);
        buttonHtml = `<button disabled class="w-full py-2 px-3 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Đang kích hoạt (${remainingMin}p)</button>`;
      } else {
        buttonHtml = `<button onclick="buyShopItem('${item.id}')" ${!canAfford ? 'disabled' : ''} class="w-full py-2 px-3 rounded-lg text-xs font-bold ${canAfford ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-md shadow-yellow-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'} transition-all">Mua ngay (${item.cost} 🪙)</button>`;
      }
    } else {
      // Permanent item / title / frame / pet
      if (isEquipped) {
        buttonHtml = `<button disabled class="w-full py-2 px-3 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Đang trang bị</button>`;
      } else if (isPurchased) {
        buttonHtml = `<button onclick="equipShopItem('${item.id}')" class="w-full py-2 px-3 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all">Trang bị</button>`;
      } else {
        buttonHtml = `<button onclick="buyShopItem('${item.id}')" ${!canAfford ? 'disabled' : ''} class="w-full py-2 px-3 rounded-lg text-xs font-bold ${canAfford ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-md shadow-yellow-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'} transition-all">Mua (${item.cost} 🪙)</button>`;
      }
    }

    return `
      <div class="rpg-card p-4 rounded-xl flex flex-col justify-between border border-slate-700/60 hover:border-slate-500 transition-all">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-3xl">${item.icon}</span>
            <span class="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full border border-yellow-400/20 flex items-center gap-1">
              ${item.cost} <span>🪙</span>
            </span>
          </div>
          <h4 class="text-sm font-bold text-slate-100 mb-1">${escapeHtml(item.name)}</h4>
          <p class="text-xs text-slate-400 line-clamp-2 mb-4">${escapeHtml(item.desc)}</p>
        </div>
        <div>
          ${buttonHtml}
        </div>
      </div>
    `;
  }).join('');
}

function buyShopItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  if (state.gold < item.cost) {
    alert("Bạn chưa đủ Vàng! Hãy hoàn thành thêm Pomodoro hoặc nhiệm vụ để tích lũy vàng nhé.");
    return;
  }

  state.gold -= item.cost;

  if (item.category === 'buff') {
    const expiresAt = Date.now() + (item.durationMinutes * 60 * 1000);
    state.activeBuff = {
      type: item.id,
      name: item.name,
      expiresAt: expiresAt
    };
    addLog(`✨ Đã kích hoạt ${item.name}! Hiệu lực trong ${item.durationMinutes} phút.`);
    triggerConfetti();
  } else {
    state.purchasedItems.push(item.id);
    equipShopItem(item.id);
    addLog(`🛒 Đã sở hữu và trang bị: ${item.name}!`);
  }

  sounds.playCoin();
  saveGameState();
  renderHUD();
  renderShop();
}

function equipShopItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  if (item.category === 'title') {
    state.character.title = item.name;
  } else if (item.category === 'frame') {
    state.character.frame = item.id;
  } else if (item.category === 'pet') {
    state.character.pet = item.id;
  }

  saveGameState();
  renderHUD();
  renderShop();
}

// ==========================================
// 8. RANK SHOWROOM & MILESTONES
// ==========================================

function renderRankMilestones() {
  const container = document.getElementById('rank-milestones-list');
  if (!container) return;

  const currentRank = getCurrentRank(state.level);

  container.innerHTML = RANKS.map((rank, index) => {
    const isCurrent = rank.name === currentRank.name;
    const isUnlocked = state.level >= rank.minLevel;

    return `
      <div class="relative p-4 rounded-xl border ${isCurrent ? 'border-amber-400 bg-amber-950/20 glow-gold' : isUnlocked ? 'border-indigo-500/40 bg-slate-800/40' : 'border-slate-800 bg-slate-900/30 opacity-60'} transition-all flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${rank.color} shadow-lg border ${rank.border}">
            ${rank.icon}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-base font-display ${rank.text}">${rank.name}</h4>
              <span class="text-xs text-slate-400">(${rank.vietnamese})</span>
              ${isCurrent ? '<span class="text-[10px] font-extrabold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">Rank Hiện Tại</span>' : ''}
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Yêu cầu cấp độ: <span class="font-bold text-slate-200">Level ${rank.minLevel}${rank.maxLevel < 900 ? ` - ${rank.maxLevel}` : '+'}</span>
            </p>
          </div>
        </div>

        <div>
          ${isCurrent 
            ? `<span class="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 rounded-lg">ĐANG NẮM GIỮ</span>` 
            : isUnlocked 
            ? `<span class="text-xs font-bold text-emerald-400 flex items-center gap-1">✓ ĐÃ ĐẠT</span>` 
            : `<span class="text-xs font-bold text-slate-500 flex items-center gap-1">🔒 KHÓA</span>`}
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 9. HUD, UI & MODAL RENDERING
// ==========================================

function renderHUD() {
  const currentRank = getCurrentRank(state.level);
  const nextRank = getNextRank(state.level);
  const expNeeded = getExpNeeded(state.level);
  const expPercent = Math.min(100, Math.round((state.currentExp / expNeeded) * 100));

  // Character Profile
  const nameEl = document.getElementById('char-name');
  const titleEl = document.getElementById('char-title');
  const avatarEl = document.getElementById('char-avatar');
  const avatarContainer = document.getElementById('char-avatar-container');
  const petBadgeEl = document.getElementById('char-pet-badge');

  if (nameEl) nameEl.innerText = state.character.name;
  if (titleEl) titleEl.innerText = state.character.title;
  if (avatarEl) avatarEl.innerText = state.character.avatar;

  if (avatarContainer) {
    // Reset frame classes
    avatarContainer.className = `w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all relative ${currentRank.frameClass}`;
    if (state.character.frame === 'frame_neon_cyan') {
      avatarContainer.className += ' avatar-frame-platinum';
    } else if (state.character.frame === 'frame_arcane_purple') {
      avatarContainer.className += ' avatar-frame-master';
    } else if (state.character.frame === 'frame_gold') {
      avatarContainer.className += ' avatar-frame-gold';
    }
  }

  if (petBadgeEl) {
    if (state.character.pet === 'pet_owl') {
      petBadgeEl.innerText = '🦉';
      petBadgeEl.classList.remove('hidden');
    } else if (state.character.pet === 'pet_coffee') {
      petBadgeEl.innerText = '☕';
      petBadgeEl.classList.remove('hidden');
    } else {
      petBadgeEl.classList.add('hidden');
    }
  }

  // Level & Rank Badges
  const levelNumEl = document.getElementById('level-number');
  const rankNameEl = document.getElementById('rank-name');
  const rankIconEl = document.getElementById('rank-icon');
  const rankSubEl = document.getElementById('rank-subtext');

  if (levelNumEl) levelNumEl.innerText = state.level;
  if (rankNameEl) {
    rankNameEl.innerText = currentRank.name;
    rankNameEl.className = `font-display font-black text-sm uppercase tracking-wider ${currentRank.text}`;
  }
  if (rankIconEl) rankIconEl.innerText = currentRank.icon;
  if (rankSubEl) rankSubEl.innerText = currentRank.vietnamese;

  // EXP Progress
  const expTextEl = document.getElementById('exp-text');
  const expBarEl = document.getElementById('exp-bar-fill');
  const expPercentEl = document.getElementById('exp-percent-text');

  if (expTextEl) expTextEl.innerText = `${state.currentExp.toLocaleString()} / ${expNeeded.toLocaleString()} EXP`;
  if (expPercentEl) expPercentEl.innerText = `${expPercent}%`;
  if (expBarEl) expBarEl.style.width = `${expPercent}%`;

  // Gold & Streak & Minutes
  const goldEl = document.getElementById('gold-count');
  const shopBalanceEl = document.getElementById('shop-balance');
  const streakEl = document.getElementById('streak-count');
  const totalMinutesEl = document.getElementById('total-minutes-count');
  const statTotalTimeEl = document.getElementById('stat-total-time');
  const pomodoroCountEl = document.getElementById('total-pomodoro-count');

  if (goldEl) goldEl.innerText = state.gold.toLocaleString();
  if (shopBalanceEl) shopBalanceEl.innerText = state.gold.toLocaleString();
  if (streakEl) streakEl.innerText = `${state.streak} ngày`;
  if (totalMinutesEl) totalMinutesEl.innerText = `${state.totalMinutesStudied}p`;
  if (statTotalTimeEl) statTotalTimeEl.innerText = `${state.totalMinutesStudied}p`;
  if (pomodoroCountEl) pomodoroCountEl.innerText = state.pomodoroCompleted;

  // Active Buff Indicator
  const buffBadgeEl = document.getElementById('active-buff-badge');
  if (buffBadgeEl) {
    if (state.activeBuff && Date.now() < state.activeBuff.expiresAt) {
      const remainingMin = Math.ceil((state.activeBuff.expiresAt - Date.now()) / 60000);
      buffBadgeEl.innerText = `⚡ ${state.activeBuff.name} (${remainingMin}m)`;
      buffBadgeEl.classList.remove('hidden');
    } else {
      buffBadgeEl.classList.add('hidden');
    }
  }

  // Rank Progress to next tier
  const nextRankProgressEl = document.getElementById('next-rank-progress');
  if (nextRankProgressEl) {
    if (nextRank) {
      const levelsNeeded = nextRank.minLevel - state.level;
      nextRankProgressEl.innerText = `Còn ${levelsNeeded} Level nữa để đạt ${nextRank.name} (${nextRank.vietnamese})`;
    } else {
      nextRankProgressEl.innerText = `Bạn đang ở đỉnh cao danh vọng: Global Elite!`;
    }
  }

  // Update Activity Logs
  renderLogs();
}

function renderLogs() {
  const container = document.getElementById('activity-logs-list');
  if (!container) return;

  container.innerHTML = state.logs.slice(0, 15).map(log => `
    <div class="py-2 border-b border-slate-800/80 flex items-start gap-2.5 text-xs">
      <span class="text-slate-500 font-mono flex-shrink-0">${log.time}</span>
      <span class="text-slate-300">${escapeHtml(log.text)}</span>
    </div>
  `).join('');
}

function addLog(text) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  state.logs.unshift({ time, text });
  if (state.logs.length > 50) state.logs.pop();
  renderLogs();
}

function showSaveIndicator() {
  const indicator = document.getElementById('save-indicator');
  if (!indicator) return;
  indicator.classList.remove('opacity-0');
  setTimeout(() => {
    indicator.classList.add('opacity-0');
  }, 1200);
}

function spawnFloatingText(text, colorClass, x = null, y = null) {
  const el = document.createElement('div');
  el.className = `floating-exp-text ${colorClass} text-lg font-bold`;
  el.innerText = text;

  const posX = x !== null ? x : window.innerWidth / 2 + (Math.random() * 80 - 40);
  const posY = y !== null ? y : window.innerHeight / 2 - 50;

  el.style.left = `${posX}px`;
  el.style.top = `${posY}px`;

  document.body.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 1500);
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function triggerLevelUpModal(newLevel) {
  sounds.playLevelUp();
  triggerConfetti();

  const modal = document.getElementById('modal-levelup');
  const levelText = document.getElementById('modal-levelup-num');
  const rewardGold = document.getElementById('modal-levelup-reward');

  if (levelText) levelText.innerText = `LEVEL ${newLevel}`;
  if (rewardGold) rewardGold.innerText = `+${newLevel * 25} Vàng`;

  if (modal) modal.classList.remove('hidden');
}

function closeLevelUpModal() {
  const modal = document.getElementById('modal-levelup');
  if (modal) modal.classList.add('hidden');
}

function triggerRankUpModal(oldRank, newRank) {
  sounds.playRankUp();
  triggerConfetti();

  const modal = document.getElementById('modal-rankup');
  const icon = document.getElementById('modal-rankup-icon');
  const name = document.getElementById('modal-rankup-name');
  const desc = document.getElementById('modal-rankup-desc');

  if (icon) icon.innerText = newRank.icon;
  if (name) {
    name.innerText = `${newRank.name} - ${newRank.vietnamese}`;
    name.className = `text-2xl font-black font-display uppercase tracking-wider ${newRank.text}`;
  }
  if (desc) desc.innerText = `Chúc mừng bạn đã xuất sắc vượt qua các thử thách học tập để thăng hạng lên ${newRank.name}!`;

  if (modal) modal.classList.remove('hidden');
}

function closeRankUpModal() {
  const modal = document.getElementById('modal-rankup');
  if (modal) modal.classList.add('hidden');
}

// Edit Character Profile
function promptEditProfile() {
  const newName = prompt("Nhập tên Chiến Binh của bạn:", state.character.name);
  if (newName && newName.trim()) {
    state.character.name = newName.trim();
  }
  const avatars = ['🧙‍♂️', '⚔️', '🏹', '🛡️', '🧠', '🦉', '🚀', '🔥', '⚡', '👑'];
  const newAvatar = prompt(`Chọn biểu tượng Avatar (${avatars.join(' ')}):`, state.character.avatar);
  if (newAvatar && newAvatar.trim()) {
    state.character.avatar = newAvatar.trim();
  }
  saveGameState();
  renderHUD();
}

// Backup & Restore
function exportData() {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `StudyRPG_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.level && parsed.character) {
          state = { ...DEFAULT_STATE, ...parsed };
          saveGameState();
          renderHUD();
          renderQuests();
          renderShop();
          renderRankMilestones();
          alert("🎉 Khôi phục dữ liệu tiến độ thành công!");
        } else {
          alert("Tập tin sao lưu không đúng định dạng Study RPG!");
        }
      } catch (err) {
        alert("Lỗi khi đọc file sao lưu: " + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function resetAllData() {
  if (confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ tiến trình, Level, Vàng và Nhiệm vụ để bắt đầu lại từ đầu không?")) {
    localStorage.removeItem(STORAGE_KEY);
    state = { ...DEFAULT_STATE };
    saveGameState();
    location.reload();
  }
}

// Toggle Zen Mode
let tabBeforeZen = 'tab-timer';
function toggleZenMode() {
  const entering = !document.body.classList.contains('zen-active');
  if (entering) {
    tabBeforeZen = Array.from(document.querySelectorAll('[id^="tab-"]')).find(tab => !tab.classList.contains('hidden'))?.id || 'tab-timer';
    switchTab('tab-timer');
  }
  document.body.classList.toggle('zen-active');
  const isZen = document.body.classList.contains('zen-active');
  const zenBtn = document.getElementById('btn-zen-mode');
  if (zenBtn) {
    zenBtn.innerText = isZen ? 'Thoát Zen Mode (Esc)' : '🧘 Zen Mode';
    zenBtn.setAttribute('aria-pressed', String(isZen));
  }
  if (isZen) {
    document.getElementById('btn-zen-exit')?.focus({ preventScroll: true });
  } else {
    switchTab(tabBeforeZen);
    zenBtn?.focus({ preventScroll: true });
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('zen-active')) {
    toggleZenMode();
  }
});

// Helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Tab Switching
function switchTab(tabId) {
  const tabs = ['tab-timer', 'tab-quests', 'tab-ranks', 'tab-shop', 'tab-logs'];
  tabs.forEach(t => {
    const el = document.getElementById(t);
    if (el) el.classList.add('hidden');
  });

  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.classList.remove('hidden');

  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.className = 'nav-tab-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-600/30';
    } else {
      btn.className = 'nav-tab-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-slate-100 hover:bg-slate-800/80';
    }
  });

  if (tabId === 'tab-quests') renderQuests();
  if (tabId === 'tab-ranks') renderRankMilestones();
  if (tabId === 'tab-shop') renderShop();
}

// ==========================================
// 10. INITIALIZATION
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
  loadGameState();
  renderHUD();
  renderQuests();
  renderRankMilestones();
  renderShop();
  updateTimerUI();
  updateTimerModeButtons();

  // Preset button hooks for quests
  document.querySelectorAll('.quest-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quest-filter-btn').forEach(b => {
        b.className = 'quest-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:text-slate-200';
      });
      btn.className = 'quest-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white';
      questFilter = btn.dataset.filter;
      renderQuests();
    });
  });

  // Sound settings toggles
  const soundToggle = document.getElementById('sound-toggle-btn');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      state.settings.sound = !state.settings.sound;
      soundToggle.innerText = state.settings.sound ? '🔊 Bật' : '🔇 Tắt';
      saveGameState();
    });
  }

  // Ambient sound selector
  const ambientSelect = document.getElementById('ambient-sound-select');
  if (ambientSelect) {
    ambientSelect.value = state.settings.ambient || 'off';
    ambientSelect.addEventListener('change', (e) => {
      state.settings.ambient = e.target.value;
      if (timerState === 'RUNNING') {
        sounds.startAmbient(state.settings.ambient);
      }
      saveGameState();
    });
  }

  // Auto check buff expiry every minute
  setInterval(() => {
    if (ensureDailyQuests()) { saveGameState(); renderQuests(); }
    checkBuffExpiration();
    renderHUD();
  }, 30000);
});

// ==========================================
// 11. LOFI GIRL YOUTUBE & MEME WALLPAPER
// ==========================================

function toggleMemeBg() {
  document.body.classList.toggle('meme-focus-mode');
  const btn = document.getElementById('btn-meme-bg');
  const isClear = document.body.classList.contains('meme-focus-mode');
  if (btn) {
    btn.innerHTML = isClear ? '<span>🖼️</span> Nền Mờ' : '<span>🖼️</span> Nền Rõ';
  }
}

function toggleLofiExpand() {
  const expanded = document.getElementById('lofi-expanded');
  if (!expanded) return;
  expanded.classList.toggle('hidden');
}

function changeLofiStation(videoId) {
  const iframe = document.getElementById('lofi-iframe');
  const label = document.getElementById('lofi-mini-label');
  if (!iframe) return;

  const stations = {
    'jfKfPfyJRdk': 'Beats to relax/study',
    '4xDzrJKXOOY': 'Synthwave Chill Radio',
    '7NOSDKb0HlU': 'Peaceful Piano Radio'
  };

  iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1`;
  if (label && stations[videoId]) {
    label.innerText = stations[videoId];
  }
  addLog(`📻 Đã chuyển đài Lofi: ${stations[videoId] || 'Lofi Girl'}`);
}
