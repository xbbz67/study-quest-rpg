/* Study RPG cloud saves. Only public Supabase configuration belongs in the browser. */
window.CloudSave = (() => {
  const ROOT_KEY = 'STUDY_RPG_DATA_v1';
  const el = id => document.getElementById(id);
  let client, bridge, user = null, ready = false, applying = false;
  let revision = 0, dirty = false, changeNumber = 0, generation = 0;
  let debounce, inFlight = null, conflict = false, recovery = false, authBusy = false;
  const accountKey = id => `${ROOT_KEY}:account:${id}`;
  const metaKey = id => `${ROOT_KEY}:sync:${id}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  function stored(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
  function remember() {
    if (user) localStorage.setItem(metaKey(user.id), JSON.stringify({ revision, dirty }));
  }
  function status(text) {
    for (const id of ['cloud-status', 'cloud-account-status']) if (el(id)) el(id).textContent = text;
  }
  function message(text) { el('cloud-message').textContent = text; }
  function setAuthBusy(value) {
    authBusy = value;
    for (const id of ['cloud-login', 'cloud-signup', 'cloud-logout', 'cloud-forgot']) el(id).disabled = value;
  }
  function lock(value) { document.querySelector('main').inert = value; }
  function paint() {
    el('cloud-account-button').textContent = user ? '☁ Tài khoản' : '☁ Đăng nhập';
    el('cloud-auth-form').hidden = !!user || recovery;
    el('cloud-account').hidden = !user || recovery;
    el('cloud-recovery').hidden = !recovery;
    el('cloud-email-label').textContent = user?.email || '';
    el('cloud-conflict').hidden = !conflict;
  }
  function open() {
    paint();
    const dialog = el('cloud-dialog');
    if (!dialog.open) dialog.showModal();
  }
  function readable(error) {
    const messages = {
      invalid_credentials: 'Email hoặc mật khẩu chưa đúng.',
      email_not_confirmed: 'Hãy xác nhận email trước khi đăng nhập.',
      user_already_exists: 'Email này đã có tài khoản. Hãy đăng nhập.',
      email_address_not_authorized: 'Chưa thể gửi email xác nhận tới địa chỉ này. Hãy liên hệ chủ website để mở quyền đăng ký.',
      over_email_send_rate_limit: 'Đã đạt giới hạn gửi email. Vui lòng thử lại sau.',
      weak_password: 'Hãy dùng mật khẩu mạnh hơn, tối thiểu 8 ký tự.',
      same_password: 'Mật khẩu mới cần khác mật khẩu cũ.'
    };
    return messages[error?.code] || 'Chưa kết nối được cloud. Dữ liệu trên máy vẫn được giữ; hãy kiểm tra mạng rồi thử lại.';
  }
  function apply(payload, key) {
    applying = true;
    try { bridge.apply(payload, key); } finally { applying = false; }
  }
  async function readRemote() {
    const { data, error } = await client.from('study_progress').select('payload,revision,updated_at').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return data;
  }
  function showConflict() {
    conflict = true;
    bridge.pause();
    status('Có tiến độ mới trên máy khác');
    message('Cloud đã được cập nhật từ phiên khác. Bản trên máy vẫn được giữ. Bạn có thể xuất bản này trước khi tải tiến độ cloud.');
    paint(); open();
  }
  async function hydrate(nextUser) {
    const epoch = ++generation;
    clearTimeout(debounce);
    ready = false; conflict = false; user = nextUser;
    paint(); lock(true);
    if (!user) {
      revision = 0; dirty = false;
      apply(stored(ROOT_KEY), ROOT_KEY);
      ready = true; lock(false); status('Chỉ lưu trên máy'); return;
    }
    const cache = stored(accountKey(user.id));
    const meta = stored(metaKey(user.id)) || {};
    status('Đang tải tiến độ cloud…');
    try {
      const remote = await readRemote();
      if (epoch !== generation) return;
      revision = remote?.revision || 0;
      if (cache && meta.dirty) {
        apply(cache, accountKey(user.id));
        dirty = true; ready = true; lock(false);
        if ((meta.revision || 0) !== revision) { revision = meta.revision || 0; showConflict(); return; }
      } else {
        let payload = remote?.payload || cache;
        if (!remote && !cache) {
          const guest = stored(ROOT_KEY);
          const hasProgress = guest && (guest.level > 1 || guest.totalMinutesStudied > 0 || guest.quests?.some(q => !q.isDaily));
          if (hasProgress && confirm('Tài khoản chưa có tiến độ cloud. Chuyển tiến độ đang có trên máy này lên tài khoản? Bản local vẫn được giữ.')) payload = guest;
        }
        apply(payload, accountKey(user.id));
        dirty = !remote; ready = true; lock(false);
      }
      remember();
      if (dirty) await flush(); else status('Đã đồng bộ cloud');
    } catch (error) {
      if (epoch !== generation) return;
      if (cache) {
        revision = meta.revision || 0; dirty = !!meta.dirty;
        apply(cache, accountKey(user.id)); ready = true; lock(false);
        status('Đang dùng bản trên máy · chờ kết nối');
      } else {
        // Do not overwrite the existing remote save with a new empty game on a network failure.
        status('Chưa tải được tiến độ · thử lại');
        message(readable(error)); open();
      }
    }
  }
  function queueSave() {
    if (!user || !ready || applying) return;
    dirty = true; changeNumber++; remember();
    if (conflict) return;
    status('Đã lưu máy · chờ đồng bộ');
    clearTimeout(debounce);
    debounce = setTimeout(() => { void flush(); }, 1200);
  }
  async function flush() {
    clearTimeout(debounce);
    if (inFlight) return inFlight;
    if (!user || !ready || !dirty || conflict) return !dirty;
    const epoch = generation;
    const id = user.id;
    inFlight = (async () => {
      try {
        while (dirty && epoch === generation && !conflict) {
          const change = changeNumber;
          const payload = clone(bridge.snapshot());
          status('Đang lưu cloud…');
          const { data, error } = await client.rpc('save_study_progress', { expected_revision: revision, new_payload: payload, expected_account: id });
          if (epoch !== generation) return false;
          if (error) {
            if (error.code === 'PT409') showConflict();
            else { status('Đã lưu máy · chưa lên cloud'); message(readable(error)); }
            return false;
          }
          revision = data[0].revision;
          dirty = changeNumber !== change;
          remember();
        }
        if (epoch === generation) status('Đã đồng bộ cloud');
        return true;
      } catch (error) {
        if (epoch === generation) { status('Đã lưu máy · chờ kết nối'); message(readable(error)); }
        return false;
      } finally { inFlight = null; }
    })();
    return inFlight;
  }
  async function syncNow() {
    if (!user) return;
    if (!ready) return hydrate(user);
    if (dirty) return flush();
    try {
      const remote = await readRemote();
      if (remote && remote.revision !== revision) { showConflict(); return; }
      status('Đã đồng bộ cloud');
    } catch (error) { status('Chưa kiểm tra được cloud'); message(readable(error)); }
  }
  function downloadLocal() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(bridge.snapshot(), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `StudyRPG_local_${Date.now()}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function useRemote() {
    try {
      const epoch = generation;
      const remote = await readRemote();
      if (epoch !== generation || !remote) return;
      // Keep a recovery copy even when the user chooses not to download one.
      localStorage.setItem(`${accountKey(user.id)}:before-cloud`, JSON.stringify(bridge.snapshot()));
      revision = remote.revision; dirty = false; conflict = false;
      apply(remote.payload, accountKey(user.id)); remember(); ready = true; lock(false);
      paint(); message('Đã tải tiến độ từ cloud.'); status('Đã đồng bộ cloud');
    } catch (error) { message(readable(error)); }
  }
  async function authenticate(kind) {
    if (authBusy) return;
    if (!el('cloud-auth-form').reportValidity()) return;
    setAuthBusy(true);
    message(kind === 'signup' ? 'Đang tạo tài khoản…' : 'Đang đăng nhập…');
    try {
      const credentials = { email: el('cloud-email').value.trim(), password: el('cloud-password').value };
      const result = kind === 'signup'
        ? await client.auth.signUp({ ...credentials, options: { emailRedirectTo: location.origin + '/' } })
        : await client.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      el('cloud-password').value = '';
      message(result.data.session ? 'Đăng nhập thành công.' : 'Hãy mở email xác nhận để kích hoạt tài khoản, sau đó quay lại đăng nhập.');
    } catch (error) { message(readable(error)); }
    finally { setAuthBusy(false); }
  }
  async function logout() {
    if (authBusy) return;
    setAuthBusy(true);
    try {
      if (dirty && !await flush() && !confirm('Tiến độ mới nhất chưa lên cloud. Bản này vẫn được giữ trong trình duyệt cho tài khoản hiện tại. Vẫn đăng xuất?')) return;
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
      message('Đã đăng xuất. Bạn đang dùng tiến độ khách trên máy.');
    } catch (error) { message(readable(error)); }
    finally { setAuthBusy(false); }
  }
  async function init(callbacks) {
    bridge = callbacks;
    const config = window.STUDY_CLOUD_CONFIG;
    if (!config?.url || !config?.key || !window.supabase) { status('Cloud chưa sẵn sàng'); return; }
    client = window.supabase.createClient(config.url, config.key);
    el('cloud-account-button').addEventListener('click', open);
    el('cloud-close').addEventListener('click', () => el('cloud-dialog').close());
    el('cloud-dialog').addEventListener('keydown', event => event.stopPropagation());
    el('cloud-auth-form').addEventListener('submit', event => { event.preventDefault(); void authenticate('login'); });
    el('cloud-signup').addEventListener('click', () => { void authenticate('signup'); });
    el('cloud-sync').addEventListener('click', () => { void syncNow(); });
    el('cloud-logout').addEventListener('click', () => { void logout(); });
    el('cloud-download').addEventListener('click', downloadLocal);
    el('cloud-use-remote').addEventListener('click', () => { void useRemote(); });
    el('cloud-forgot').addEventListener('click', async () => {
      const email = el('cloud-email');
      if (!email.reportValidity()) return;
      const { error } = await client.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: location.origin + '/' });
      message(error ? readable(error) : 'Nếu email có tài khoản, bạn sẽ nhận liên kết đặt lại mật khẩu.');
    });
    el('cloud-recovery').addEventListener('submit', async event => {
      event.preventDefault();
      const { error } = await client.auth.updateUser({ password: el('cloud-new-password').value });
      if (error) { message(readable(error)); return; }
      el('cloud-new-password').value = ''; recovery = false; paint(); message('Đã đổi mật khẩu.');
    });
    client.auth.onAuthStateChange((event, session) => {
      // Run outside the Supabase auth callback lock.
      setTimeout(() => {
        if (event === 'PASSWORD_RECOVERY') { recovery = true; paint(); open(); }
        if ((session?.user?.id || null) !== (user?.id || null)) void hydrate(session?.user || null);
      }, 0);
    });
    status('Đang kiểm tra tài khoản…'); lock(true);
    const { data, error } = await client.auth.getSession();
    if (error) { lock(false); status('Chỉ lưu trên máy · chưa đăng nhập'); return; }
    await hydrate(data.session?.user || null);
    window.addEventListener('online', () => { void syncNow(); });
    window.addEventListener('focus', () => { if (!authBusy && ready) void syncNow(); });
    window.addEventListener('beforeunload', event => { if (user && dirty) { event.preventDefault(); event.returnValue = ''; } });
    setInterval(() => { if (dirty && !conflict) void flush(); }, 30000);
  }
  return { init, queueSave, flush };
})();
