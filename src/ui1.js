/* =========================================================================
   ARAYÜZ — yönlendirici, kabuk, kimlik doğrulama, panolar
   ========================================================================= */
const IC = {
  back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  bell: '<path d="M6 10a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 004 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  users: '<circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.5 3.5 0 010 7M18 14.5c2 .6 3.3 2.5 3.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  play: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 8.5l5.5 3.5-5.5 3.5z" fill="currentColor"/>',
  user: '<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  doc: '<path d="M6 3h8l5 5v13H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v5h5M9 13h7M9 17h7" stroke="currentColor" stroke-width="2"/>',
  gear: '<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  ruler: '<rect x="2.5" y="8" width="19" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4" stroke="currentColor" stroke-width="2"/>',
  grow: '<path d="M12 21V9M12 9c0-3 2-5 6-5 0 4-2 6-6 5zM12 13c0-2.5-2-4-5-4 0 3 2 4.5 5 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  radar: '<polygon points="12,3 21,9.5 17.5,20 6.5,20 3,9.5" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="12,8 16,11 14.5,16 9.5,16 8,11" fill="currentColor" opacity=".35"/>',
  compass: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor"/>',
  video: '<rect x="2.5" y="6" width="13" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 10l6-3v10l-6-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  target: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  sun: '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10.5V7.5a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="2"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 015.5 3H20v15H5.5A1.5 1.5 0 004 19.5zM4 19.5A1.5 1.5 0 005.5 21H20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  chev: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  timer: '<circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4l2.5 2M9.5 2.5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
};
const ic = (n, cls = "") => `<svg viewBox="0 0 24 24" class="i ${cls}" aria-hidden="true">${IC[n] || ""}</svg>`;
const pill = (t, c = "") => `<span class="pill ${c}">${esc(t)}</span>`;
const alertBox = (cls, title, body) => `<div class="alert ${cls}">${title ? `<b class="at">${esc(title)}</b>` : ""}${body}</div>`;
const li = (href, icon, t, s, right = "") => `<a class="li" href="${href}"><div class="ic">${typeof icon === "string" && IC[icon] ? ic(icon) : esc(icon)}</div><div class="grow"><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ""}</div>${right}<span class="chev">${ic("chev")}</span></a>`;
const field = (label, inner, hint = "") => `<label class="f"><span>${label}</span>${inner}${hint ? `<div class="hint">${hint}</div>` : ""}</label>`;
const inp = (name, val = "", attrs = "") => `<input class="in" name="${name}" value="${esc(val == null ? "" : val)}" ${attrs}>`;
const sel = (name, opts, val, attrs = "") => `<select class="in" name="${name}" ${attrs}>${opts.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(val) ? "selected" : ""}>${esc(l)}</option>`; }).join("")}</select>`;
const empty = (t, icon = "doc") => `<div class="empty">${ic(icon)}<p>${t}</p></div>`;
const scoreBar = (lab, v, extra = "") => `<div class="scorebar"><div class="lab">${esc(lab)}</div><div class="bar"><i style="width:${isNum(v) ? v : 0}%"></i></div><div class="v">${isNum(v) ? v : "—"}</div>${extra}</div>`;

/* ---------------- Yönlendirici ---------------- */
const ROUTES = [];
const route = (pat, fn, opt = {}) => ROUTES.push({re: new RegExp("^" + pat.replace(/:(\w+)/g, "([^/]+)") + "$"), keys: (pat.match(/:(\w+)/g) || []).map(k => k.slice(1)), fn, opt});
let CUR = {path: "", params: {}};
const go = h => { if (location.hash === h) render(); else location.hash = h; };
function back() { if (history.length > 1) history.back(); else go("#/home"); }
let afterRender = [];
function render() {
  const full = (location.hash || "#/").slice(1) || "/", qi = full.indexOf("?");
  const path = qi >= 0 ? full.slice(0, qi) : full, query = qi >= 0 ? full.slice(qi + 1) : "";
  if (!S.me) { const pub = ["/login", "/register", "/register/role", "/"]; if (!pub.includes(path)) { location.replace("#/login"); return; } }
  let match = null, params = {};
  for (const r of ROUTES) { const m = path.match(r.re); if (m) { match = r; r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1])); break; } }
  if (!match) { if (S.me) { location.replace("#/home"); return; } location.replace("#/login"); return; }
  CUR = {path, query, params, r: match};
  if (params.aid && S.me && !canView(params.aid)) { shell("Yetkisiz erişim", alertBox("bad", "Erişim engellendi", "Bu sporcunun verilerini görüntüleme yetkiniz yok."), {}); audit("Yetkisiz erişim denemesi", params.aid, path); return; }
  afterRender = [];
  try {
    const out = match.fn(params);
    if (out && out.html != null) shell(out.title, out.html, Object.assign({}, match.opt, out));
  } catch (e) { console.error(e); shell("Hata", alertBox("bad", "Beklenmeyen bir hata oluştu", esc(e.message) + "<br><span class='small muted'>Verileriniz korunmuştur. Ana sayfaya dönebilirsiniz.</span>") + `<a class="btn block" href="#/home">Ana sayfa</a>`, {}); }
  afterRender.forEach(f => { try { f(); } catch (e) { console.error(e); } });
  if (S.me) runScheduler();
}
function tabsFor() {
  const r = role(), a = myAthlete();
  if (r === "coach") return [["#/home", "home", "Panel"], ["#/athletes", "users", "Sporcular"], ["#/coach", "layers", "Antrenör"], ["#/library", "play", "Kütüphane"], ["#/menu", "grid", "Menü"]];
  if (r === "parent") return [["#/home", "home", "Panel"], ["#/parent", "heart", "Veli"], ["#/athletes", "users", "Çocuklar"], ["#/notifications", "bell", "Bildirim"], ["#/menu", "grid", "Menü"]];
  const id = a ? a.id : "";
  return [["#/home", "home", "Bugün"], [a ? `#/a/${id}/calendar` : "#/home", "cal", "Takvim"], [a ? `#/a/${id}/progress` : "#/home", "trend", "Gelişim"], ["#/library", "play", "Videolar"], ["#/menu", "grid", "Menü"]];
}
function shell(title, html, opt = {}) {
  const app = $("#app");
  if (opt.bare) { app.innerHTML = html; window.scrollTo(0, 0); return; }
  const showBack = opt.back !== false && !["/home", "/menu"].includes(CUR.path);
  const tabs = S.me ? tabsFor() : [];
  const unread = S.me ? unreadCount() : 0;
  app.innerHTML = `<header class="topbar">${showBack ? `<button class="iconbtn" data-act="back" aria-label="Geri">${ic("back")}</button>` : `<div class="avatar sm" aria-hidden="true">${esc(initials(S.me ? S.me.name : "R"))}</div>`}
    <h1>${esc(title)}</h1><span id="saveInd" class="saveind"></span>
    ${S.me ? `<a class="iconbtn" href="#/notifications" aria-label="Bildirimler">${ic("bell")}${unread ? '<span class="dot"></span>' : ""}</a>` : ""}</header>
    <main class="${opt.noNav ? "noNav" : ""}">${html}</main>
    ${S.me && !opt.noNav ? `<nav class="tabbar">${tabs.map(([h, i, l]) => `<a class="tab ${("#" + CUR.path) === h || (h !== "#/home" && ("#" + CUR.path).startsWith(h)) ? "on" : ""}" href="${h}">${ic(i)}<span>${l}</span></a>`).join("")}</nav>` : ""}`;
  updateSaveInd();
  if (!opt.keepScroll) window.scrollTo(0, 0);
}
function reRender() { const y = window.scrollY; render(); window.scrollTo(0, y); }

/* ---------------- Olay yönetimi ---------------- */
const ACT = {}, FORM = {};
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  if (el.dataset.act === "sheetBg") { if (e.target === el) closeSheet(); return; }
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); (async () => fn(el, e))().catch(err => { console.warn(err); toast("Hata: " + err.message); }); }
});
document.addEventListener("submit", e => {
  const f = e.target; const fn = FORM[f.dataset.form];
  if (fn) { e.preventDefault(); (async () => fn(formData(f), f))().catch(err => { console.warn(err.message); toast(err.message); }); }
});
document.addEventListener("click", e => { const c = e.target.closest(".chip[data-toggle]"); if (c) { c.classList.toggle("on"); const i = c.querySelector("input"); if (i) i.checked = c.classList.contains("on"); e.preventDefault(); } });
ACT.back = () => back();
ACT.closeSheet = () => closeSheet();
ACT.sheetBg = (el, e) => { if (e.target === el) closeSheet(); };
ACT.go = el => go(el.dataset.href);

/* ---------------- Açılış / giriş / kayıt ---------------- */
route("/", () => { go(S.me ? "#/home" : "#/login"); return null; });
const LOGO_SVG = `<svg class="logo" style="width:72px;height:72px" viewBox="0 0 96 96" aria-hidden="true"><defs><linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3B82F6"/><stop offset="1" stop-color="#22D3C5"/></linearGradient></defs><rect x="4" y="4" width="88" height="88" rx="24" fill="#0F1A30" stroke="url(#lg2)" stroke-width="3"/><path d="M26 64 L42 30 L54 52 L62 40 L72 64" fill="none" stroke="url(#lg2)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="62" cy="26" r="6" fill="#22D3C5"/></svg>`;
function authFrame(inner) {
  return `<div class="lock"><div class="center" style="margin-bottom:22px">${LOGO_SVG}<div class="brand" style="margin-top:8px">RUSH <em>ATHLETIC</em></div><div class="muted small">Atletik performans ve sporcu gelişim platformu</div></div>${inner}</div>`;
}
route("/login", () => {
  if (S.me) { go("#/home"); return null; }
  const has = vaultIds().length > 0;
  return {bare: true, html: authFrame(`
    ${!cryptoOK() ? alertBox("bad", "Güvenli bağlantı gerekli", "Şifreli veri saklama için uygulama HTTPS üzerinden (ör. GitHub Pages) açılmalıdır.") : ""}
    <div class="card"><h2>Giriş yap</h2>
    <form data-form="login" autocomplete="on">
      ${field("E-posta", inp("email", "", 'type="email" required autocomplete="username" inputmode="email"'))}
      ${field("Şifre", inp("password", "", 'type="password" required autocomplete="current-password" minlength="8"'))}
      <label class="check"><input type="checkbox" name="remember"><span class="small">Bu cihazda oturumu açık tut <span class="muted">(paylaşılan cihazlarda önerilmez)</span></span></label>
      <button class="btn pri block" type="submit">Giriş yap</button>
    </form></div>
    <a class="btn block" href="#/register">Yeni hesap oluştur</a>
    <div class="card flat mt"><h3>Örnek sporcu ile dene</h3><p class="small muted">Spesifikasyondaki 13 yaşındaki basketbolcu örneğiyle (12 haftalık program, ilk ve son testler, yük kayıtları, video analizi) bir demo çalışma alanı oluşturur.</p><button class="btn blue block" data-act="demo">Demo çalışma alanı oluştur</button></div>
    ${has ? `<p class="tiny muted center">Bu cihazda ${vaultIds().length} şifreli çalışma alanı var.</p>` : ""}
    <p class="tiny muted center">Sürüm ${APP_VERSION} · Veriler bu cihazda AES-256 ile şifrelenir.</p>`)};
});
FORM.login = async d => {
  if (!cryptoOK()) throw new Error("Bu tarayıcıda güvenli şifreleme kullanılamıyor (HTTPS gerekli).");
  const b = $("form[data-form=login] button[type=submit]"); b.disabled = true; b.textContent = "Doğrulanıyor…";
  try { await login(d.email, d.password, d.remember); applyPrefs(); toast("Hoş geldiniz, " + S.me.name); go("#/home"); }
  catch (e) { b.disabled = false; b.textContent = "Giriş yap"; throw e; }
};
let REG = {};
route("/register", () => ({bare: true, html: authFrame(`<div class="card"><h2>Kayıt ol</h2>
  <form data-form="reg1">
    ${field("Ad soyad", inp("name", REG.name || "", 'required autocomplete="name"'))}
    ${field("E-posta", inp("email", REG.email || "", 'type="email" required autocomplete="email" inputmode="email"'))}
    ${field("Şifre", inp("password", "", 'type="password" required minlength="8" autocomplete="new-password"'), "En az 8 karakter; harf ve rakam içermeli. Şifre kaybolursa veriler kurtarılamaz (yedek alın).")}
    ${field("Şifre tekrar", inp("password2", "", 'type="password" required minlength="8" autocomplete="new-password"'))}
    ${field("Kulüp / akademi / aile adı", inp("wsName", REG.wsName || "", 'placeholder="ör. Yıldız Spor Akademisi"'))}
    <label class="check"><input type="checkbox" name="kvkk" required><span class="small">KVKK aydınlatma metnini okudum; verilerin yalnızca atletik gelişim amacıyla işleneceğini, reklam/pazarlama için kullanılmayacağını anladım.</span></label>
    <button class="btn pri block" type="submit">Devam: rol seçimi</button></form></div>
  <a class="btn ghost block" href="#/login">Giriş ekranına dön</a>`)}));
FORM.reg1 = d => {
  if (d.password !== d.password2) throw new Error("Şifreler eşleşmiyor.");
  if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(d.password) || !/\d/.test(d.password)) throw new Error("Şifre en az bir harf ve bir rakam içermeli.");
  if (vaultIds().some(id => (vaultGet(id) || {users: []}).users.some(u => u.email === d.email.toLowerCase().trim()))) throw new Error("Bu e-posta bu cihazda zaten kayıtlı. Giriş yapın.");
  REG = d; go("#/register/role");
};
route("/register/role", () => {
  if (!REG.email) { go("#/register"); return null; }
  const card = (r, icon, t, s) => `<button class="li" style="width:100%;text-align:left" data-act="pickRole" data-role="${r}"><div class="ic">${ic(icon)}</div><div class="grow"><div class="t">${t}</div><div class="s">${s}</div></div><span class="chev">${ic("chev")}</span></button>`;
  return {bare: true, html: authFrame(`<h2 class="center">Rolünüzü seçin</h2><p class="small muted center">Her rol yalnızca yetkili olduğu verilere erişir.</p><div class="list">
    ${card("coach", "layers", "Antrenör", "Sporcu ekleme, test girişi, program onayı, grup antrenmanı, raporlar")}
    ${card("parent", "heart", "Veli", "Çocuğunun gelişimi, takvim, devamlılık, izin ve onay yönetimi")}
    ${card("athlete", "user", "Sporcu", "Kendi programı, günlük antrenman, hedefler ve gelişim grafikleri")}</div>
    <a class="btn ghost block mt" href="#/register">Geri</a>`)};
});
ACT.pickRole = async el => {
  if (!cryptoOK()) { toast("HTTPS gerekli"); return; }
  el.disabled = true; toast("Şifreli çalışma alanı oluşturuluyor…", 5000);
  await createWorkspace({wsName: REG.wsName, name: REG.name, email: REG.email, password: REG.password, role: el.dataset.role});
  audit("Çalışma alanı oluşturuldu", null, ROLE_N[el.dataset.role]);
  REG = {}; applyPrefs(); await flushSave();
  go(role() === "athlete" ? "#/athlete/new?self=1" : "#/home");
};

/* ---------------- Ana panel ---------------- */
route("/home", () => {
  const r = role();
  if (r === "athlete") return athleteHome();
  if (r === "parent") return parentHome();
  return coachHome();
});
function athleteCard(a, extra = "") {
  const sp = sportById(a.primarySport), age = ageAt(a.birthDate);
  return `<a class="li" href="#/a/${a.id}"><div class="avatar sm">${esc(initials(a.name))}</div><div class="grow"><div class="t">${esc(a.name)}</div><div class="s">${isNum(age) ? Math.floor(age) + " yaş" : ""}${sp ? " · " + esc(sp.n) : ""}${a.position && sp ? " · " + esc((sp.pos.find(p => p.id === a.position) || {}).n || "") : ""}</div></div>${extra}<span class="chev">${ic("chev")}</span></a>`;
}
function coachHome() {
  const as = visibleAthletes();
  const pend = DB.programs.filter(p => p.status === "onay bekliyor" && canView(p.athleteId));
  const flags = []; as.forEach(a => loadSummary(a).flags.filter(f => f.lv !== "info").forEach(f => flags.push({a, f})));
  const holdList = as.map(a => ({a, h: holds(a.id)})).filter(x => x.h.length);
  const today = todayISO(), todays = as.flatMap(a => plannedSessions(a.id, today, today).map(x => ({a, ...x})));
  return {title: "Antrenör paneli", html: `
    <div class="card acc"><div class="row"><div class="grow"><div class="small muted">${esc(DB.ws.name)}</div><h2 style="margin:2px 0">Merhaba, ${esc(S.me.name.split(" ")[0])}</h2><div class="small muted">${fmtD(today)} · ${DOWL[new Date().getDay()]}</div></div>${ic("bolt")}</div>
    <div class="grid3 mt"><div class="stat"><b>${as.length}</b><span>Sporcu</span></div><div class="stat"><b>${pend.length}</b><span>Onay bekleyen</span></div><div class="stat"><b>${todays.length}</b><span>Bugünkü seans</span></div></div></div>
    <div class="btns" style="margin-top:0;margin-bottom:12px"><a class="btn pri" href="#/athlete/new">${ic("plus")} Sporcu ekle</a><a class="btn" href="#/groups">Grup antrenmanı</a></div>
    ${holdList.length ? `<h3>Tıbbi onay / değerlendirme bekleyenler</h3>${holdList.map(x => alertBox("bad", x.a.name, x.h.map(esc).join("<br>"))).join("")}` : ""}
    ${pend.length ? `<h3>Onay bekleyen programlar</h3><div class="list">${pend.map(p => li(`#/a/${p.athleteId}/program/${p.id}`, "doc", esc(getA(p.athleteId).name) + " — " + p.weeks + " hafta", esc(sportById(p.sport).n) + " · " + fmtD(isoOf(new Date(p.createdAt))), pill("onay bekliyor", "warn"))).join("")}</div>` : ""}
    ${flags.length ? `<h3>Yük ve toparlanma uyarıları</h3>${flags.slice(0, 6).map(x => alertBox(x.f.lv, x.a.name, esc(x.f.t))).join("")}` : ""}
    <h3>Bugünkü antrenmanlar</h3>${todays.length ? `<div class="list">${todays.map(x => { const l = logOf(x.p.id, x.wk.w, x.s.d); return li(`#/a/${x.a.id}/session/${x.p.id}/${x.wk.w}/${x.s.d}`, "bolt", esc(x.a.name), esc(x.s.title), l ? pill(l.status, l.status === "tamamlandı" ? "ok" : "warn") : pill("planlı")); }).join("")}</div>` : `<p class="muted small">Bugün planlı seans yok.</p>`}
    <h3>Sporcular</h3>${as.length ? `<div class="list">${as.slice(0, 8).map(a => athleteCard(a)).join("")}</div>${as.length > 8 ? `<a class="btn block mt" href="#/athletes">Tümünü gör</a>` : ""}` : empty("Henüz sporcu yok. “Sporcu ekle” ile başlayın veya giriş ekranından demo oluşturun.", "users")}`};
}
function parentHome() {
  const as = visibleAthletes();
  if (!as.length) return {title: "Veli paneli", html: empty("Henüz bağlı çocuk profili yok.", "users") + `<a class="btn pri block" href="#/athlete/new">${ic("plus")} Çocuk profili oluştur</a>`};
  return {title: "Veli paneli", html: `<div class="card acc"><div class="small muted">${esc(DB.ws.name)}</div><h2 style="margin:2px 0">Merhaba, ${esc(S.me.name.split(" ")[0])}</h2><p class="small muted">Çocuğunuzun gelişimini, takvimini ve antrenör yorumlarını buradan takip edebilirsiniz.</p></div>
    ${as.map(a => parentChildCard(a)).join("")}<a class="btn block" href="#/athlete/new">${ic("plus")} Çocuk profili ekle</a>`};
}
function parentChildCard(a) {
  const p = activeProgram(a.id), ad = p ? adherence(a.id, p.startDate, todayISO()) : null, h = holds(a.id);
  const cm = DB.comments.filter(c => c.athleteId === a.id && (c.vis || []).includes("parent")).sort((x, y) => y.at - x.at)[0];
  const missing = ["data", "health", "video"].filter(t => !consent(a.id, t));
  return `<div class="card"><div class="row"><div class="avatar">${esc(initials(a.name))}</div><div class="grow"><b>${esc(a.name)}</b><div class="small muted">${Math.floor(ageAt(a.birthDate))} yaş · ${esc((sportById(a.primarySport) || {n: "Branş seçilmedi"}).n)}</div></div>${p ? ringSVG(ad.pct, "devam") : ""}</div>
    ${h.length ? alertBox("bad", "Onay/değerlendirme gerekli", h.map(esc).join("<br>")) : ""}
    ${missing.length ? alertBox("warn", "Eksik izinler", "Verilmemiş izinler: " + missing.map(t => CONSENT_N[t]).join(", ") + `. <a href="#/a/${a.id}/consents">İzinleri yönet</a>`) : ""}
    ${cm ? `<div class="card flat"><div class="tiny muted">Antrenör yorumu · ${fmtD(isoOf(new Date(cm.at)))}</div><div>${esc(cm.text)}</div></div>` : ""}
    <div class="grid2"><a class="btn sm" href="#/a/${a.id}/calendar">Takvim</a><a class="btn sm" href="#/a/${a.id}/progress">Gelişim</a><a class="btn sm" href="#/a/${a.id}/report">Raporlar</a><a class="btn sm" href="#/a/${a.id}">Profil</a></div></div>`;
}
function athleteHome() {
  const a = myAthlete();
  if (!a) return {title: "Bugün", html: alertBox("info", "Profil bekleniyor", "Hesabınız henüz bir sporcu profiline bağlı değil. Antrenörünüz veya veliniz profilinizi bağlayabilir; ya da kendi profilinizi oluşturun.") + `<a class="btn pri block" href="#/athlete/new?self=1">Profilimi oluştur</a>`};
  const p = activeProgram(a.id), today = todayISO();
  const todays = plannedSessions(a.id, today, today);
  const next = plannedSessions(a.id, today, addDays(today, 14)).find(x => !logOf(x.p.id, x.wk.w, x.s.d));
  const wk = mondayOf(today), ad = adherence(a.id, wk, addDays(wk, 6));
  const streak = weekStreak(a.id), badges = badgesFor(a);
  const goals = (a.goals || []).filter(g => !g.done);
  const cm = DB.comments.filter(c => c.athleteId === a.id && (c.vis || []).includes("athlete")).sort((x, y) => y.at - x.at)[0];
  return {title: "Bugün", html: `
    <div class="card acc"><div class="row"><div class="grow"><div class="small muted">${DOWL[new Date().getDay()]}, ${fmtD(today)}</div><h2 style="margin:2px 0">Selam ${esc(a.name.split(" ")[0])}! 👋</h2><div class="small">${streak > 0 ? `🔥 ${streak} haftadır düzenli çalışıyorsun` : "Bu hafta harika bir başlangıç yap!"}</div></div>${ringSVG(ad.pct, "bu hafta")}</div></div>
    ${p && p.status !== "onaylı" ? alertBox("warn", "Programın onay bekliyor", "Antrenörün onayladıktan sonra antrenmanlara başlayabilirsin.") : ""}
    ${todays.length ? todays.map(x => { const l = logOf(x.p.id, x.wk.w, x.s.d); return `<div class="card"><div class="row between"><div><div class="tiny muted">Hafta ${x.wk.w} · ${esc(x.wk.phase)}</div><h3 style="margin:2px 0">${esc(x.s.title)}</h3><div class="small muted">≈${x.s.estMin} dk · ${x.s.blocks.reduce((n, b) => n + b.items.length, 0)} egzersiz</div></div>${l ? pill(l.status, l.status === "tamamlandı" ? "ok" : "warn") : ""}</div><a class="btn ${l ? "" : "pri"} block mt" href="#/a/${a.id}/session/${x.p.id}/${x.wk.w}/${x.s.d}">${l ? "Seansı görüntüle" : "Antrenmana başla"}</a></div>`; }).join("")
      : `<div class="card"><h3>Bugün dinlenme günü 😌</h3><p class="small muted">${next ? `Sonraki antrenman: ${DOWL[parseISO(next.s.date).getDay()]} ${fmtD(next.s.date)} — ${esc(next.s.title)}` : p ? "Bu hafta için planlı seans kalmadı." : "Henüz aktif bir programın yok."}</p><a class="btn sm" href="#/a/${a.id}/load">Takım antrenmanı / maç ekle</a></div>`}
    ${cm ? `<div class="card flat"><div class="tiny muted">Antrenöründen not 💬</div><div>${esc(cm.text)}</div></div>` : ""}
    <h3>Hedeflerim</h3>${goals.length ? goals.map(g => goalRow(a, g)).join("") : `<p class="small muted">Henüz hedef yok.</p>`}<a class="btn sm" href="#/a/${a.id}/goals">Hedefleri yönet</a>
    <h3>Rozetlerim</h3><p class="tiny muted">Rozetler yalnızca senin kendi gelişimine göre verilir; kimseyle karşılaştırılmazsın.</p>
    <div class="row wrap" style="gap:8px">${badges.map(b => `<div class="badge ${b.on ? "" : "off"}"><div class="b">${b.e}</div>${esc(b.n)}</div>`).join("")}</div>
    <h3>Kısayollar</h3><div class="menuGrid">
      <a class="mtile" href="#/a/${a.id}/calendar">${ic("cal")}Haftalık takvim</a><a class="mtile" href="#/a/${a.id}/radar">${ic("radar")}Atletik profilim</a><a class="mtile" href="#/a/${a.id}/progress">${ic("trend")}Gelişimim</a>
      <a class="mtile" href="#/a/${a.id}/reaction">${ic("timer")}Reaksiyon testi</a><a class="mtile" href="#/library">${ic("play")}Egzersiz videoları</a><a class="mtile" href="#/a/${a.id}/report">${ic("doc")}Raporum</a></div>`};
}
function goalRow(a, g) {
  const t = g.testId ? TEST[g.testId] : null; let prog = null, cur = null;
  if (t) { const rs = testsOf(a.id, t.id); if (rs.length) { cur = testValue(rs[rs.length - 1]); const base = isNum(g.base) ? g.base : testValue(rs[0]); const span = g.target - base; prog = span ? clamp((cur - base) / span * 100, 0, 100) : (cur === g.target ? 100 : 0); } }
  return `<div class="card flat" style="padding:11px"><div class="row between"><div class="grow"><b>${esc(g.text)}</b><div class="tiny muted">${t ? `${esc(t.n)} · şu an ${fmtN(cur, t.dec)} ${t.u} → hedef ${fmtN(g.target, t.dec)} ${t.u}` : ""}${g.date ? " · " + fmtD(g.date) : ""}</div></div>${g.done ? pill("tamamlandı", "ok") : ""}</div>${prog != null ? `<div class="bar mt"><i style="width:${prog}%"></i></div>` : ""}</div>`;
}
function weekStreak(aid) {
  let st = 0, w = mondayOf(todayISO());
  for (let i = 1; i <= 52; i++) { const s = addDays(w, -7 * i); if (DB.logs.some(l => l.athleteId === aid && l.date >= s && l.date <= addDays(s, 6) && l.status === "tamamlandı")) st++; else break; }
  return st;
}
function badgesFor(a) {
  const logs = DB.logs.filter(l => l.athleteId === a.id && l.status === "tamamlandı");
  const prs = TESTS.some(t => { const rs = testsOf(a.id, t.id); if (rs.length < 2) return false; const c = compareResults(t, rs[0], rs[rs.length - 1]); return c && c.cls === "ok"; });
  const p = activeProgram(a.id) || programsOf(a.id)[0];
  return [
    {e: "🎯", n: "İlk antrenman", on: logs.length >= 1}, {e: "🔥", n: "3 hafta düzen", on: weekStreak(a.id) >= 3}, {e: "💯", n: "10 antrenman", on: logs.length >= 10},
    {e: "📈", n: "Kişisel gelişim", on: prs}, {e: "🏁", n: "Programın yarısı", on: !!p && currentWeek(p) > p.weeks / 2}, {e: "🧘", n: "Dürüst geri bildirim", on: logs.filter(l => isNum(l.rpe)).length >= 5}
  ];
}

/* ---------------- Menü (tüm ekranlar) ---------------- */
route("/menu", () => {
  const r = role(), a = r === "athlete" ? myAthlete() : (visibleAthletes()[0] || null);
  const A = a ? `#/a/${a.id}` : null;
  const t = (h, i, l) => h ? `<a class="mtile" href="${h}">${ic(i)}${l}</a>` : "";
  const sec = (title, tiles) => tiles.filter(Boolean).length ? `<h3>${title}</h3><div class="menuGrid">${tiles.join("")}</div>` : "";
  return {title: "Menü", html: `
    <div class="card row"><div class="avatar">${esc(initials(S.me.name))}</div><div class="grow"><b>${esc(S.me.name)}</b><div class="small muted">${ROLE_N[r]} · ${esc(S.me.email)}</div></div><a class="btn sm" href="#/settings">${ic("gear")}</a></div>
    ${a && r !== "athlete" ? `<p class="small muted">Sporcu ekranları <b>${esc(a.name)}</b> için açılır. Başka sporcu için <a href="#/athletes">Sporcular</a> listesinden seçin.</p>` : ""}
    ${sec("Genel", [t("#/home", "home", "Ana panel"), r !== "athlete" ? t("#/athletes", "users", "Sporcular") : "", r === "coach" ? t("#/coach", "layers", "Antrenör paneli") : "", r === "parent" ? t("#/parent", "heart", "Veli paneli") : "", r !== "athlete" ? t("#/athlete/new", "plus", "Sporcu oluştur") : "", t("#/notifications", "bell", "Bildirimler")])}
    ${A ? sec("Sporcu profili", [t(A, "user", "Sporcu profili"), t(A + "/health", "heart", "Sağlık bilgileri"), t(A + "/physical", "user", "Fiziksel özellikler"), t(A + "/anthro", "ruler", "Antropometri"), t(A + "/maturity", "grow", "Biyolojik gelişim"), t(A + "/goals", "target", "Hedefler")]) : ""}
    ${A ? sec("Test ve analiz", [t(A + "/tests", "flask", "Test merkezi"), t(A + "/results", "chart", "Test sonuçları"), t(A + "/radar", "radar", "Atletik radar"), t(A + "/discover", "compass", "Branş keşfi"), t(A + "/reaction", "timer", "Reaksiyon testi"), t(A + "/video", "video", "Video analizi")]) : ""}
    ${A ? sec("Program ve antrenman", [r !== "athlete" ? t(A + "/program/new", "bolt", "Program oluştur") : "", t(A + "/programs", "doc", "Programlar"), t(A + "/calendar", "cal", "Haftalık takvim"), t(A + "/load", "chart", "Yük takibi"), t(A + "/extra", "plus", "Ek gelişim"), r !== "athlete" ? t(A + "/focus", "target", "Zayıf yön modu") : "", t(A + "/season", "cal", "Sezon yönetimi")]) : ""}
    ${A ? sec("Gelişim ve rapor", [t(A + "/progress", "trend", "Gelişim takibi"), t(A + "/longterm", "grow", "Uzun vadeli analiz"), r !== "athlete" ? t(A + "/optimize", "bolt", "Program optimizasyonu") : "", t(A + "/report", "doc", "PDF raporları")]) : ""}
    ${sec("Kütüphane ve ayarlar", [t("#/library", "play", "Egzersiz kütüphanesi"), r === "coach" ? t("#/groups", "users", "Grup antrenmanı") : "", r === "coach" ? t("#/compare", "chart", "Sporcu karşılaştırma") : "", r === "coach" ? t("#/sports", "compass", "Branş veri tabanı") : "", t("#/science", "book", "Bilimsel referanslar"), t("#/settings", "gear", "Kullanıcı ayarları"), t("#/privacy", "shield", "Veri ve gizlilik"), S.me.admin ? t("#/members", "users", "Üyeler ve erişim") : ""])}
    <button class="btn danger block mt" data-act="logout">${ic("lock")} Çıkış yap</button>
    <div class="card flat mt"><b>Durum ve sınırlamalar</b><ul class="small muted" style="padding-left:18px;margin:6px 0">
      <li>Program üretimi <b>kural tabanlı, açıklanabilir bir motordur</b>; büyük dil modeli (LLM) bağlı değildir. İsteğe bağlı harici AI sunucusu Ayarlar'dan tanımlanabilir.</li>
      <li>Video analizi: manuel açı ölçümü tam çalışır; otomatik iskelet tespiti (MediaPipe) deneyseldir ve internet gerektirir.</li>
      <li>Veriler yalnızca bu cihazda şifreli saklanır; cihazlar arası senkronizasyon ve sunucu tabanlı anlık bildirim için arka uç gerekir (henüz yok).</li></ul></div>`};
});
ACT.logout = async () => { if (await confirmBox("Oturumu kapatmak istiyor musunuz?", "Çıkış yap")) { await flushSave(); audit("Çıkış yapıldı", null, ""); await flushSave(); logout(); go("#/login"); } };
