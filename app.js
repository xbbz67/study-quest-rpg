/**
 * STUDY RPG - GAME ENGINE & STATE CONTROLLER
 * Full Gamification: EXP, Levels, Ranks, Pomodoro, Quests, Shop, LocalStorage
 */

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================

const STORAGE_KEY = 'STUDY_RPG_DATA_v1';
const DAILY_STREAK_FOCUS_SECONDS = 30 * 60;

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
  { id: 'streak_freeze', category: 'protection', name: 'Đóng băng streak', desc: 'Bảo vệ 1 ngày bỏ lỡ, tự dùng từ kho đã mua. Tối đa 3 viên. Giữ nguyên chuỗi, không cộng ngày. Nghỉ vượt số viên: reset chuỗi và giữ lại vật phẩm.', cost: 120, icon: '🧊' },
  { id: 'buff_exp_2x_short', category: 'buff', name: 'Bùa Khởi Động X2 EXP', desc: 'Nhân đôi EXP từ timer và nhiệm vụ trong 15 phút. Mua là kích hoạt; chỉ dùng 1 bùa mỗi lần.', cost: 45, icon: '🪄', durationMinutes: 15, expMultiplier: 2 },
  { id: 'buff_exp_2x', category: 'buff', name: 'Bùa X2 EXP (30 Phút)', desc: 'Nhân đôi EXP từ timer và nhiệm vụ trong 30 phút. Mua là kích hoạt; chỉ dùng 1 bùa mỗi lần.', cost: 80, icon: '📜', durationMinutes: 30, expMultiplier: 2 },
  { id: 'buff_exp_2x_long', category: 'buff', name: 'Bùa Marathon X2 EXP', desc: 'Nhân đôi EXP từ timer và nhiệm vụ trong 60 phút. Mua là kích hoạt; chỉ dùng 1 bùa mỗi lần.', cost: 150, icon: '🔮', durationMinutes: 60, expMultiplier: 2 },
  { id: 'buff_gold_2x', category: 'buff', name: 'Bùa Thịnh Vượng X2 Vàng', desc: 'Nhân đôi vàng từ timer và nhiệm vụ trong 30 phút, không áp dụng vàng lên cấp. Chỉ dùng 1 bùa mỗi lần.', cost: 100, icon: '💰', durationMinutes: 30, goldMultiplier: 2 },
  { id: 'pet_owl', category: 'pet', name: 'Cú Mèo Thức Khuya', desc: 'Tăng 10% EXP từ timer và nhiệm vụ khi trang bị. Mỗi lần chỉ đồng hành cùng 1 thú cưng.', cost: 250, icon: '🦉', expBonus: 0.10 },
  { id: 'pet_coffee', category: 'pet', name: 'Ly Cà Phê Bất Tử', desc: 'Thưởng thêm 5 vàng mỗi phiên đếm ngược hoàn thành khi trang bị.', cost: 200, icon: '☕', sessionGold: 5 },
  { id: 'pet_fox', category: 'pet', name: 'Cáo Săn Kho Báu', desc: 'Thêm 1 vàng mỗi phút tập trung khi trang bị. Không nhận vàng trong giờ nghỉ.', cost: 400, icon: '🦊', perMinuteGold: 1 },
  { id: 'pet_cat', category: 'pet', name: 'Mèo Đồng Hành', desc: 'Tăng 5% EXP và thưởng thêm 2 vàng mỗi phiên đếm ngược hoàn thành khi trang bị.', cost: 350, icon: '🐈', expBonus: 0.05, sessionGold: 2 },
  { id: 'pet_dragon', category: 'pet', name: 'Rồng Tri Thức', desc: 'Tăng 15% EXP từ timer và nhiệm vụ khi trang bị. Mỗi lần chỉ đồng hành cùng 1 thú cưng.', cost: 650, icon: '🐉', expBonus: 0.15 },
  { id: 'title_night_owl', category: 'title', name: 'Chiến Binh Đêm Khuya', desc: 'Danh hiệu dành cho những người cày cuốc thâu đêm.', cost: 50, icon: '🌙' },
  { id: 'title_exam_slayer', category: 'title', name: 'Kẻ Hủy Diệt Đề Thi', desc: 'Danh hiệu tối thượng khi chuẩn bị vào phòng thi.', cost: 120, icon: '⚔️' },
  { id: 'title_gpa_wizard', category: 'title', name: 'Đại Pháp Sư GPA 4.0', desc: 'Danh hiệu tối cao của bậc học giả.', cost: 300, icon: '🎓' },
  { id: 'title_god_speed', category: 'title', name: 'Chúa Tể Không Trì Hoãn', desc: 'Không có việc gì ngày mai làm mà hôm nay không giải quyết!', cost: 500, icon: '⚡' },
  { id: 'title_deep_diver', category: 'title', name: 'Lữ Khách Deep Work', desc: 'Danh hiệu hiển thị trên hồ sơ cho người thích những phiên tập trung sâu.', cost: 180, icon: '🌊' },
  { id: 'title_timekeeper', category: 'title', name: 'Người Giữ Nhịp Thời Gian', desc: 'Danh hiệu hiển thị trên hồ sơ, không thay đổi chỉ số hay phần thưởng.', cost: 450, icon: '⌛' },
  { id: 'frame_gold', category: 'frame', name: 'Khung Hào Quang Vàng', desc: 'Viền vàng phát sáng quanh avatar. Vật phẩm trang trí, không thay đổi rank.', cost: 100, icon: '✨', frameClass: 'avatar-frame-gold' },
  { id: 'frame_neon_cyan', category: 'frame', name: 'Khung Cyber Neon', desc: 'Viền xanh cyan quanh avatar. Vật phẩm trang trí, không thay đổi rank.', cost: 150, icon: '🩵', frameClass: 'avatar-frame-platinum' },
  { id: 'frame_arcane_purple', category: 'frame', name: 'Khung Ma Thuật Hư Không', desc: 'Viền tím ma thuật quanh avatar. Vật phẩm trang trí, không thay đổi rank.', cost: 250, icon: '🔮', frameClass: 'avatar-frame-master' },
  { id: 'frame_ocean', category: 'frame', name: 'Khung Đại Dương', desc: 'Ánh xanh lam dịu quanh avatar. Vật phẩm trang trí, không thay đổi rank.', cost: 280, icon: '🌊', frameClass: 'avatar-frame-diamond' },
  { id: 'frame_sakura', category: 'frame', name: 'Khung Hoa Anh Đào', desc: 'Hào quang hồng quanh avatar. Vật phẩm trang trí, không thay đổi rank.', cost: 320, icon: '🌸', frameClass: 'avatar-frame-grandmaster' },
  { id: 'frame_rainbow', category: 'frame', name: 'Khung Lăng Kính', desc: 'Hào quang đổi màu quanh avatar. Vật phẩm trang trí, không thay đổi rank.', cost: 550, icon: '🌈', frameClass: 'avatar-frame-challenger' }
];
const MAX_STREAK_FREEZES = 3;
const STREAK_TREE_STAGES = [
  { id: 'seed', name: 'Hạt giống', minDays: 0, icon: '🌰' },
  { id: 'sprout', name: 'Nảy mầm', minDays: 1, icon: '🌱' },
  { id: 'stem', name: 'Vươn thân', minDays: 3, icon: '🌿' },
  { id: 'branches', name: 'Phân cành', minDays: 7, icon: '🌿' },
  { id: 'leaves', name: 'Xanh tán', minDays: 14, icon: '🌳' },
  { id: 'fruit', name: 'Kết trái', minDays: 30, icon: '🍎' }
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
  streak: 0,
  streakFreezes: 0,
  streakProtectedThrough: null,
  streakEarnedToday: null, // ngày YYYY-MM-DD khi streak đã được tích hôm nay
  lastActiveDate: null,
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
    ambientVolume: 0.3,
    timerDecoration: 'orbit'
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

let state = JSON.parse(JSON.stringify(DEFAULT_STATE));
let activeStorageKey = STORAGE_KEY;

function loadGameState() {
  try {
    const saved = localStorage.getItem(activeStorageKey);
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
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  ensureDailyQuests();
  awardStreakForDailyFocus();
  saveGameState();
}

function saveGameState() {
  try {
    localStorage.setItem(activeStorageKey, JSON.stringify(state));
    showSaveIndicator();
    window.CloudSave?.queueSave();
  } catch (err) {
    console.error("Không thể lưu LocalStorage:", err);
  }
}

function streakDayNumber(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  if (new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
  return timestamp / 86400000;
}

function normalizeShopState() {
  const stock = Number(state.streakFreezes);
  state.streakFreezes = Number.isFinite(stock) ? Math.min(MAX_STREAK_FREEZES, Math.max(0, Math.floor(stock))) : 0;
  state.purchasedItems = [...new Set((Array.isArray(state.purchasedItems) ? state.purchasedItems : []).filter(id => typeof id === 'string'))];
}

function checkDailyStreak() {
  normalizeShopState();
  if (state.streak === 1 && !state.streakEarnedToday && !state.streakProtectedThrough) {
    state.streak = 0;
    state.lastActiveDate = null;
    saveGameState();
    return true;
  }
  if (!(state.streak > 0)) return false;
  const today = streakDayNumber(getQuestDay());
  const lastEarned = streakDayNumber(state.streakEarnedToday) ?? streakDayNumber(state.lastActiveDate);
  if (lastEarned === null || lastEarned >= today) return false;
  const protectedDay = streakDayNumber(state.streakProtectedThrough);
  const coveredThrough = Math.max(lastEarned, protectedDay ?? lastEarned);
  const missedDays = today - coveredThrough - 1;
  if (missedDays <= 0) return false;
  if (state.streakFreezes >= missedDays) {
    state.streakFreezes -= missedDays;
    state.streakProtectedThrough = new Date((today - 1) * 86400000).toISOString().slice(0, 10);
    addLog(`🧊 Tự dùng ${missedDays} viên đóng băng cho ${missedDays} ngày bỏ lỡ. Giữ chuỗi ${state.streak} ngày; còn ${state.streakFreezes} viên.`);
  } else {
    state.streak = 0;
    state.streakProtectedThrough = null;
    addLog(`💔 Bỏ lỡ ${missedDays} ngày, không đủ viên đóng băng. Chuỗi về 0; giữ lại ${state.streakFreezes} viên. Tích lũy đủ 30 phút tập trung trong ngày để bắt đầu lại.`);
  }
  saveGameState();
  return true;
}

// Award at most one earned day after the daily focus threshold has been reached.
function earnDailyStreak() {
  checkDailyStreak();
  const today = getQuestDay();
  // Đã tích streak hôm nay rồi thì không tích nữa
  if (state.streak > 0 && state.streakEarnedToday === today) return;

  const todayNumber = streakDayNumber(today);
  const actualEarned = streakDayNumber(state.streakEarnedToday) ?? streakDayNumber(state.lastActiveDate);
  const protectedThrough = streakDayNumber(state.streakProtectedThrough);
  if ((actualEarned !== null && actualEarned > todayNumber) || (protectedThrough !== null && protectedThrough >= todayNumber)) return;
  const coveredThrough = Math.max(streakDayNumber(state.streakEarnedToday) ?? -Infinity, streakDayNumber(state.streakProtectedThrough) ?? -Infinity, state.streak > 1 ? (streakDayNumber(state.lastActiveDate) ?? -Infinity) : -Infinity);
  if (state.streak > 0 && coveredThrough >= todayNumber - 1) {
    state.streak = (state.streak || 0) + 1;
    addLog(`🔥 STREAK! Chuỗi cày cấp liên tục: ${state.streak} ngày! Xuất sắc!`);
  } else {
    state.streak = 1;
    addLog(`🔥 Bắt đầu chuỗi cày cấp mới! Duy trì mỗi ngày để lên cao nhé!`);
  }
  state.streakEarnedToday = today;
  state.lastActiveDate = today;
  state.streakProtectedThrough = null;
  saveGameState();
  renderHUD();
}

function awardStreakForDailyFocus() {
  const today = getQuestDay();
  const focus = state.dailyFocus;
  if (focus?.date !== today || !Number.isFinite(focus.focusSeconds) || focus.focusSeconds < DAILY_STREAK_FOCUS_SECONDS) return false;
  if (state.streak > 0 && state.streakEarnedToday === today) return false;
  const previousStreak = state.streak;
  earnDailyStreak();
  return state.streak !== previousStreak;
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
  const petMultiplier = 1 + (getEquippedPet()?.expBonus || 0);
  const buffMultiplier = getActiveBoost('expMultiplier');

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
  return finalExp;
}

function addGold(amount, eventX = null, eventY = null) {
  if (amount <= 0) return;
  amount = Math.round(amount * getActiveBoost('goldMultiplier'));
  state.gold += amount;
  sounds.playCoin();
  spawnFloatingText(`+${amount} Vàng`, 'text-yellow-400', eventX, eventY);
  saveGameState();
  renderHUD();
  return amount;
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
const CUSTOM_TIMER_PRESETS = [5, 10, 15, 30, 45, 60, 90, 120];
const MAX_CUSTOM_TIMER_MINUTES = 180;

let currentTimerMode = 'POMODORO';
let timerState = 'IDLE'; // 'IDLE', 'RUNNING', 'PAUSED', 'BREAK'
let timeRemaining = 25 * 60; // in seconds
let totalSessionSeconds = 25 * 60;
let stopwatchSeconds = 0;
let timerInterval = null;
let secondsAccumulator = 0; // Tracks every 60s of active study for real-time EXP/Gold
let isBreakSession = false;

function setTimerMode(modeKey, customMinutes = null) {
  if (!Object.prototype.hasOwnProperty.call(TIMER_MODES, modeKey)) {
    setTimerDurationMessage('Chế độ đồng hồ không hợp lệ.');
    return false;
  }
  const requestedMinutes = customMinutes === null ? TIMER_MODES.CUSTOM.focusMinutes : parseCustomTimerMinutes(customMinutes);
  if (modeKey === 'CUSTOM' && requestedMinutes === null) {
    setTimerDurationMessage('Nhập số phút nguyên từ 1 đến 180.');
    return false;
  }
  if (timerState === 'RUNNING' || timerState === 'PAUSED') {
    if (!confirm("Đồng hồ đang chạy hoặc tạm dừng. Đổi thời gian sẽ bắt đầu lại phiên hiện tại. Bạn muốn tiếp tục?")) {
      return false;
    }
  }

  clearInterval(timerInterval);
  sounds.stopAmbient();
  timerState = 'IDLE';
  currentTimerMode = modeKey;
  isBreakSession = false;

  const mode = TIMER_MODES[modeKey];
  if (modeKey === 'CUSTOM') {
    mode.focusMinutes = requestedMinutes;
    mode.label = `Tùy chỉnh (${requestedMinutes} phút)`;
    mode.expReward = Math.round(requestedMinutes * 2);
    mode.goldReward = Math.round(requestedMinutes * 0.8);
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
  setTimerDurationMessage(modeKey === 'CUSTOM' ? `Đã chọn ${mode.focusMinutes} phút tập trung · nghỉ ${mode.breakMinutes} phút.` : '');
  return true;
}

function parseCustomTimerMinutes(value) {
  if (!['string', 'number'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return null;
  const minutes = Number(value);
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= MAX_CUSTOM_TIMER_MINUTES ? minutes : null;
}

function setTimerDurationMessage(message) {
  const element = document.getElementById('timer-duration-message');
  if (element) element.textContent = message;
}

function applyCustomTimerDuration(value) {
  const minutes = parseCustomTimerMinutes(value);
  if (minutes === null) {
    setTimerDurationMessage('Nhập số phút nguyên từ 1 đến 180.');
    return false;
  }
  return setTimerMode('CUSTOM', minutes);
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
  if (lofiAuto && lofiAuto.checked && !document.body.classList.contains('theater-active')) {
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
  if (newDay) { checkDailyStreak(); renderQuests(); }
  awardStreakForDailyFocus();
  secondsAccumulator++;

  // Every 60 seconds of focused study gives +10 EXP and +2 Gold
  if (secondsAccumulator >= 60) {
    secondsAccumulator = 0;
    state.totalMinutesStudied += 1;
    
    // Live accumulation: 10 EXP + 2 Gold per minute
    addExp(10, 'per_minute');
    addGold(2 + (getEquippedPet()?.perMinuteGold || 0));

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
    const bonusGold = mode.goldReward + (getEquippedPet()?.sessionGold || 0);

    const awardedExp = addExp(mode.expReward, 'session_complete') ?? mode.expReward;
    const awardedGold = addGold(bonusGold) ?? bonusGold;

    addLog(`🏆 Hoàn thành trọn vẹn phiên ${mode.label} (+${awardedExp} EXP, +${awardedGold} Vàng)!`);
    triggerConfetti();

    // Focus from all timer modes counts toward the same daily streak goal.
    awardStreakForDailyFocus();
    if (state.dailyFocus.focusSeconds < DAILY_STREAK_FOCUS_SECONDS && state.streakEarnedToday !== getQuestDay()) {
      const remaining = Math.ceil((DAILY_STREAK_FOCUS_SECONDS - state.dailyFocus.focusSeconds) / 60);
      addLog(`⏳ Còn ${remaining} phút tập trung hôm nay để tích streak 🔥`);
    }

    // Switch to break
    timerState = 'BREAK';
    timeRemaining = mode.breakMinutes * 60;
    totalSessionSeconds = timeRemaining;
    updateTimerUI();

    alert(`🎉 XUẤT SẮC! Bạn đã hoàn thành phiên học ${mode.label}.\nNhận ngay +${awardedExp} EXP và +${awardedGold} Vàng!\nHãy nghỉ ngơi thư giãn ${mode.breakMinutes} phút nào!`);
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
  window.Theater?.renderTimer();
  const timerDisplay = document.getElementById('timer-display');
  const timerStatus = document.getElementById('timer-status');
  const startBtn = document.getElementById('btn-timer-start');
  const pauseBtn = document.getElementById('btn-timer-pause');
  const resetBtn = document.getElementById('btn-timer-reset');
  const timerContainer = document.getElementById('timer-container');

  let minutes = 0;
  let seconds = 0;

  if (currentTimerMode === 'STOPWATCH') {
    minutes = Math.floor(stopwatchSeconds / 60);
    seconds = stopwatchSeconds % 60;
  } else {
    minutes = Math.floor(timeRemaining / 60);
    seconds = timeRemaining % 60;
  }

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  if (timerDisplay) {
    timerDisplay.innerText = formattedTime;
  }
  document.title = timerState === 'RUNNING' ? `(${formattedTime}) ${isBreakSession ? 'Đang nghỉ' : 'Đang cày cấp'}... | Study RPG` : `Study RPG - Cày Cấp Học Tập`;

  // Status text and glow
  if (timerStatus) {
    if (timerState === 'RUNNING' && !isBreakSession) {
      timerStatus.innerText = 'Đang tập trung';
      timerStatus.className = 'text-xs uppercase tracking-widest font-bold text-amber-400 animate-pulse';
      timerContainer?.classList.add('timer-active-glow');
    } else if (timerState === 'BREAK' || (timerState === 'RUNNING' && isBreakSession)) {
      timerStatus.innerText = 'Giờ giải lao';
      timerStatus.className = 'text-xs uppercase tracking-widest font-bold text-emerald-400 animate-pulse';
      timerContainer?.classList.remove('timer-active-glow');
    } else if (timerState === 'PAUSED') {
      timerStatus.innerText = 'Đang tạm dừng';
      timerStatus.className = 'text-xs uppercase tracking-widest font-bold text-slate-400';
      timerContainer?.classList.remove('timer-active-glow');
    } else {
      timerStatus.innerText = 'Sẵn sàng';
      timerStatus.className = 'text-xs uppercase tracking-widest font-bold text-slate-500';
      timerContainer?.classList.remove('timer-active-glow');
    }
  }

  window.TimerDecor?.render();

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
  const input = document.getElementById('custom-timer-minutes');
  if (input) input.value = TIMER_MODES.CUSTOM.focusMinutes;
  const label = document.getElementById('custom-timer-mode-label');
  if (label) label.textContent = `Tùy chỉnh (${TIMER_MODES.CUSTOM.focusMinutes}p)`;
  document.querySelectorAll('[data-timer-minutes]').forEach(button => {
    button.setAttribute('aria-pressed', String(currentTimerMode === 'CUSTOM' && Number(button.dataset.timerMinutes) === TIMER_MODES.CUSTOM.focusMinutes));
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

  if (quest.completed) quest.rewardClaimed = true;
  quest.completed = !quest.completed;

  if (quest.completed && !quest.rewardClaimed) {
    quest.rewardClaimed = true;
    sounds.playQuestDone();
    addExp(quest.exp, 'quest', event?.clientX, event?.clientY);
    addGold(quest.gold, event?.clientX, event?.clientY);
    addLog(`⚔️ Hoàn thành nhiệm vụ: "${quest.title}" (+${quest.exp} EXP, +${quest.gold} Vàng)!`);
  } else if (!quest.completed) {
    addLog(`↩️ Đánh dấu chưa xong: "${quest.title}". Mỗi nhiệm vụ chỉ nhận thưởng một lần.`);
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

let shopFilter = 'all';
const SHOP_CATEGORY_LABELS = { protection: 'Bảo vệ chuỗi', buff: 'Bùa hỗ trợ', pet: 'Bạn đồng hành', title: 'Danh hiệu', frame: 'Khung avatar' };

function getEquippedPet() {
  if (!Array.isArray(state.purchasedItems) || !state.purchasedItems.includes(state.character.pet)) return null;
  return SHOP_ITEMS.find(item => item.category === 'pet' && item.id === state.character.pet) || null;
}

function getActiveBoost(property) {
  if (!state.activeBuff || Date.now() >= state.activeBuff.expiresAt) return 1;
  return SHOP_ITEMS.find(item => item.category === 'buff' && item.id === state.activeBuff.type)?.[property] || 1;
}

function shopMessage(text) {
  const result = document.getElementById('shop-result');
  if (result) result.textContent = text;
}

function setShopFilter(category) {
  shopFilter = category === 'all' || SHOP_CATEGORY_LABELS[category] ? category : 'all';
  renderShop();
}

function renderShop() {
  const container = document.getElementById('shop-items-list');
  if (!container) return;
  normalizeShopState();
  for (const [id, value] of [['shop-freeze-count', state.streakFreezes], ['shop-streak-count', state.streak]]) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }
  document.querySelectorAll('[data-shop-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shopFilter === shopFilter)));
  const equippedList = document.getElementById('shop-equipped-list');
  if (equippedList) {
    equippedList.innerHTML = ['pet', 'title', 'frame'].map(category => {
      const item = SHOP_ITEMS.find(entry => entry.category === category && (category === 'title' ? entry.name === state.character.title : entry.id === state.character[category]));
      const name = item?.name || (category === 'title' ? state.character.title : category === 'frame' ? 'Khung theo rank' : 'Chưa có bạn đồng hành');
      return `<div class="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3 min-w-0"><p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">${SHOP_CATEGORY_LABELS[category]}</p><p class="text-xs font-semibold text-slate-200 break-words">${item?.icon || '◇'} ${escapeHtml(name)}</p>${item ? `<button type="button" data-unequip="${category}" onclick="unequipShopCategory('${category}')" class="text-xs text-indigo-300 hover:text-white mt-2">Tháo trang bị</button>` : ''}</div>`;
    }).join('');
  }
  const activeBuff = state.activeBuff && Date.now() < state.activeBuff.expiresAt;
  const visibleItems = SHOP_ITEMS.filter(item => shopFilter === 'all' || item.category === shopFilter);
  container.innerHTML = visibleItems.map(item => {
    const purchased = state.purchasedItems.includes(item.id);
    const equipped = (item.category === 'title' && state.character.title === item.name) ||
      (item.category === 'frame' && state.character.frame === item.id) || (item.category === 'pet' && state.character.pet === item.id);
    let label, action = `buyShopItem('${item.id}')`, disabled = false;
    if (item.category === 'protection' && state.streakFreezes >= MAX_STREAK_FREEZES) { label = 'Kho đã đầy · 3/3 viên'; disabled = true; }
    else if (item.category === 'buff' && activeBuff) {
      label = state.activeBuff.type === item.id ? `Đang dùng · ${Math.ceil((state.activeBuff.expiresAt - Date.now()) / 60000)} phút` : 'Đợi bùa hiện tại kết thúc'; disabled = true;
    } else if (equipped && purchased) { label = 'Đang trang bị'; disabled = true; }
    else if (purchased && !['buff', 'protection'].includes(item.category)) { label = 'Trang bị'; action = `equipShopItem('${item.id}')`; }
    else if (state.gold < item.cost) { label = `Cần thêm ${item.cost - state.gold} vàng`; disabled = true; }
    else { label = item.category === 'protection' ? `Mua 1 viên · ${item.cost} 🪙` : `Mua · ${item.cost} 🪙`; }
    const ownedLabel = item.category === 'protection' ? `Trong túi: ${state.streakFreezes}/${MAX_STREAK_FREEZES}` : item.category === 'buff' ? 'Dùng ngay khi mua' : purchased ? 'Đã sở hữu · dùng lâu dài' : 'Mua một lần · dùng lâu dài';
    return `<article data-shop-item="${item.id}" data-shop-category="${item.category}" class="rpg-card p-5 rounded-2xl flex flex-col justify-between border ${item.category === 'protection' ? 'border-cyan-500/50 bg-cyan-950/10' : 'border-slate-700/60'} gap-4">
      <div><div class="flex items-center justify-between gap-2 mb-3"><span class="text-3xl" aria-hidden="true">${item.icon}</span><span class="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full">${item.cost} 🪙</span></div>
      <p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">${SHOP_CATEGORY_LABELS[item.category]}</p><h4 class="text-sm font-bold text-slate-100 mb-2">${escapeHtml(item.name)}</h4><p class="text-xs leading-relaxed text-slate-400">${escapeHtml(item.desc)}</p></div>
      <div><p class="text-[11px] text-slate-500 mb-2">${ownedLabel}</p><button type="button" data-shop-buy="${item.id}" onclick="${action}" ${disabled ? 'disabled' : ''} class="w-full py-2.5 px-3 rounded-xl text-xs font-bold ${disabled ? 'bg-slate-800 text-slate-400 cursor-not-allowed' : purchased && item.category !== 'protection' && item.category !== 'buff' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950'} transition-all">${label}</button></div></article>`;
  }).join('');
}

function buyShopItem(itemId) {
  const item = SHOP_ITEMS.find(entry => entry.id === itemId);
  if (!item) return false;
  checkDailyStreak();
  normalizeShopState();
  renderHUD();
  if (!['buff', 'protection'].includes(item.category) && state.purchasedItems.includes(item.id)) {
    equipShopItem(item.id); return false;
  }
  if (item.category === 'protection' && state.streakFreezes >= MAX_STREAK_FREEZES) {
    shopMessage('Bạn đã có đủ 3 viên đóng băng. Hãy dùng bớt trước khi mua thêm.'); return false;
  }
  if (item.category === 'buff' && state.activeBuff && Date.now() < state.activeBuff.expiresAt) {
    shopMessage('Bạn đang dùng một bùa hỗ trợ. Đợi bùa này kết thúc để không mất thời gian hiệu lực.'); return false;
  }
  if (!Number.isFinite(state.gold) || state.gold < item.cost) {
    shopMessage('Chưa đủ vàng. Hoàn thành timer và nhiệm vụ để tích lũy thêm nhé.'); return false;
  }
  state.gold -= item.cost;
  if (item.category === 'protection') {
    state.streakFreezes += 1;
    addLog(`🧊 Mua 1 viên đóng băng streak (${item.cost} vàng). Trong túi: ${state.streakFreezes}/${MAX_STREAK_FREEZES}.`);
    shopMessage('Đã cất 1 viên đóng băng vào túi. Viên sẽ tự dùng cho ngày bỏ lỡ khi đủ số lượng bảo vệ chuỗi.');
  } else if (item.category === 'buff') {
    state.activeBuff = { type: item.id, name: item.name, expiresAt: Date.now() + item.durationMinutes * 60000 };
    addLog(`✨ Kích hoạt ${item.name} trong ${item.durationMinutes} phút.`);
    shopMessage(`Đã kích hoạt ${item.name}. Thời gian hiệu lực bắt đầu ngay.`);
    triggerConfetti();
  } else {
    state.purchasedItems.push(item.id);
    equipShopItem(item.id);
    addLog(`🛒 Đã mua và trang bị ${item.name} (${item.cost} vàng).`);
    shopMessage(`Đã sở hữu và trang bị ${item.name}. Có thể đổi hoặc tháo miễn phí.`);
  }
  sounds.playCoin();
  saveGameState(); renderHUD(); renderShop();
  return true;
}

function equipShopItem(itemId) {
  normalizeShopState();
  const item = SHOP_ITEMS.find(entry => entry.id === itemId);
  if (!item || !state.purchasedItems.includes(itemId) || !['pet', 'title', 'frame'].includes(item.category)) return false;
  state.character[item.category] = item.category === 'title' ? item.name : item.id;
  saveGameState(); renderHUD(); renderShop();
  shopMessage(`Đã trang bị ${item.name}.`);
  return true;
}

function unequipShopCategory(category) {
  if (!['pet', 'title', 'frame'].includes(category)) return;
  state.character[category] = DEFAULT_STATE.character[category];
  saveGameState(); renderHUD(); renderShop();
  shopMessage('Đã tháo trang bị. Vật phẩm vẫn thuộc sở hữu của bạn.');
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

function getStreakTreeProgress(streak) {
  const numeric = Number(streak);
  const days = Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
  const index = STREAK_TREE_STAGES.findLastIndex(stage => days >= stage.minDays);
  const stage = STREAK_TREE_STAGES[index];
  const nextStage = STREAK_TREE_STAGES[index + 1] || null;
  const progress = nextStage ? Math.min(100, Math.floor((days - stage.minDays) / (nextStage.minDays - stage.minDays) * 100)) : 100;
  return { stage, nextStage, days, progress, remaining: nextStage ? nextStage.minDays - days : 0 };
}

function renderStreakTree() {
  const growth = getStreakTreeProgress(state.streak);
  for (const id of ['streak-tree-icon', 'stat-streak-icon', 'shop-streak-icon']) {
    const icon = document.getElementById(id);
    if (icon) icon.textContent = growth.stage.icon;
  }
  const garden = document.getElementById('streak-garden');
  if (!garden) return;
  garden.dataset.stage = growth.stage.id;
  const today = getQuestDay();
  const earnedToday = state.streak > 0 && state.streakEarnedToday === today;
  const preserved = !earnedToday && state.streak > 0 && streakDayNumber(state.streakProtectedThrough) !== null && streakDayNumber(state.streakProtectedThrough) >= streakDayNumber(today) - 1;
  garden.dataset.protected = String(preserved);
  const text = {
    'tree-stage-name': growth.stage.name,
    'tree-days': growth.days,
    'tree-next-label': growth.nextStage ? `Còn ${growth.remaining} ngày học để đạt ${growth.nextStage.name}` : 'Cây đã kết trái. Tiếp tục chăm sóc chuỗi học của bạn!',
    'tree-progress-label': `${growth.progress}%`,
    'tree-art-title': `Cây chuyên cần: ${growth.stage.name}, ${growth.days} ngày học liên tiếp`,
    'tree-status': earnedToday ? 'Đã chăm cây hôm nay. Hẹn bạn vào ngày mai!' : 'Tích lũy đủ 30 phút tập trung trong ngày để chăm cây và tăng chuỗi.',
    'tree-freeze-note': preserved ? 'Đã giữ cây qua ngày bỏ lỡ. Học để cây tiếp tục lớn.' : 'Đóng băng giữ nguyên cây, không cộng ngày.',
    'tree-freeze-stock': String(state.streakFreezes || 0)
  };
  for (const [id, value] of Object.entries(text)) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }
  const progressBar = document.getElementById('tree-progress-bar');
  if (progressBar) {
    progressBar.setAttribute('aria-valuenow', String(growth.progress));
    progressBar.setAttribute('aria-valuetext', growth.nextStage ? `${growth.remaining} ngày đến ${growth.nextStage.name}` : 'Đã đạt Kết trái');
  }
  const fill = document.getElementById('tree-progress-fill');
  if (fill) fill.style.width = `${growth.progress}%`;
  const steps = document.getElementById('tree-stage-list');
  if (steps) steps.innerHTML = STREAK_TREE_STAGES.map((stage, index) => `<li class="tree-step ${stage.id === growth.stage.id ? 'is-current' : stage.minDays < growth.stage.minDays ? 'is-complete' : ''}" ${stage.id === growth.stage.id ? 'aria-current="step"' : ''}><span class="tree-step-number">${String(index + 1).padStart(2, '0')}</span><span class="tree-step-name">${stage.name}</span><span class="tree-step-days">${stage.minDays === 0 ? 'Khởi đầu' : `${stage.minDays} ngày`}</span></li>`).join('');
}

function renderHUD() {
  window.TimerDecor?.render();
  renderStreakTree();
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
    const equippedFrame = SHOP_ITEMS.find(item => item.category === 'frame' && item.id === state.character.frame && state.purchasedItems.includes(item.id));
    avatarContainer.className = `w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all relative ${equippedFrame?.frameClass || currentRank.frameClass}`;
  }

  if (petBadgeEl) {
    const pet = getEquippedPet();
    if (pet) {
      petBadgeEl.innerText = pet.icon;
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
  for (const [id, count] of [['streak-freeze-count', state.streakFreezes || 0], ['shop-freeze-count', state.streakFreezes || 0], ['shop-streak-count', state.streak || 0], ['stat-streak-count', state.streak || 0]]) {
    const counter = document.getElementById(id);
    if (counter) counter.textContent = count;
  }
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
    localStorage.removeItem(activeStorageKey);
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    ensureDailyQuests();
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
  const tabs = ['tab-timer', 'tab-quests', 'tab-ranks', 'tab-shop', 'tab-logs', 'tab-theater'];
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
  if (tabId === 'tab-theater') window.Theater?.enter();
  else window.Theater?.leave();
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
    checkDailyStreak();
    if (ensureDailyQuests()) { saveGameState(); renderQuests(); }
    checkBuffExpiration();
    renderHUD();
    const shopTab = document.getElementById('tab-shop');
    if (shopTab && !shopTab.classList.contains('hidden')) renderShop();
  }, 30000);

  window.CloudSave?.init({
    snapshot: () => state,
    pause: () => { if (timerState === 'RUNNING') pauseTimer(); },
    apply: (payload, storageKey) => {
      if (payload && (!Number.isFinite(payload.level) || !Array.isArray(payload.quests) || !payload.character)) throw new Error('Invalid cloud save');
      if (timerState === 'RUNNING') pauseTimer();
      resetTimer();
      const defaults = JSON.parse(JSON.stringify(DEFAULT_STATE));
      activeStorageKey = storageKey;
      state = { ...defaults, ...(payload || {}) };
      state.character = { ...defaults.character, ...(payload?.character || {}) };
      state.settings = { ...defaults.settings, ...(payload?.settings || {}) };
      ensureDailyQuests();
      checkDailyStreak();
      awardStreakForDailyFocus();
      checkBuffExpiration();
      saveGameState();
      renderHUD(); renderQuests(); renderShop(); renderRankMilestones();
    }
  }).catch(error => {
    console.error('Cloud initialization failed:', error);
    document.querySelector('main').inert = false;
    const indicator = document.getElementById('cloud-status');
    if (indicator) indicator.textContent = 'Cloud chưa kết nối · dữ liệu vẫn trên máy';
  });
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
