/* =========================================================================
   ARAYÜZ ÇATISI — simgeler, bileşenler, yönlendirici, kabuk, olaylar
   ========================================================================= */
const IC = {
  refresh: '<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/>',
  key: '<circle cx="8" cy="14" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 11l9-9M16 6l3 3M14 8l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
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


const kv = rows => `<dl class="kv">${rows.filter(r => r).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v == null || v === "" ? "—" : esc(v)}</dd>`).join("")}</dl>`;
const seg = (items, cur, hrefFn) => `<div class="seg">${items.map(([k, n]) => `<a class="${k === cur ? "on" : ""}" href="${hrefFn(k)}">${esc(n)}</a>`).join("")}</div>`;

/* ---------------- Yönlendirici ---------------- */
const ROUTES = [];
const route = (pat, fn, roles) => ROUTES.push({re: new RegExp("^" + pat.replace(/:(\w+)/g, "([^/]+)") + "$"), keys: (pat.match(/:(\w+)/g) || []).map(k => k.slice(1)), fn, roles});
let CUR = {path: "", query: "", params: {}};
const Q = k => new URLSearchParams(CUR.query || "").get(k);
const go = h => { if (location.hash === h) render(); else location.hash = h; };
function back() { if (history.length > 1) history.back(); else go(homeOf()); }
const homeOf = () => ({coach: "#/c", athlete: "#/s", parent: "#/p"})[role()] || "#/welcome";
let afterRender = [];
const PUBLIC = ["/welcome", "/login", "/signup/coach", "/join/student", "/join/parent", "/science"];
function render() {
  const full = (location.hash || "#/").slice(1) || "/", qi = full.indexOf("?");
  const path = qi >= 0 ? full.slice(0, qi) : full, query = qi >= 0 ? full.slice(qi + 1) : "";
  if (!ST.user && !PUBLIC.includes(path)) { location.replace("#/welcome"); return; }
  if (ST.user && !ST.profile && path !== "/finish" && !PUBLIC.includes(path)) { location.replace("#/finish"); return; }
  if (path === "/" || (ST.user && ST.profile && ["/welcome", "/login"].includes(path))) { location.replace(ST.user && ST.profile ? homeOf() : "#/welcome"); return; }
  let match = null; const params = {};
  for (const r of ROUTES) { const m = path.match(r.re); if (m) { match = r; r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1])); break; } }
  if (!match) { location.replace(ST.user ? homeOf() : "#/welcome"); return; }
  CUR = {path, query, params};
  closeSheet();
  if (match.roles && !match.roles.includes(role())) { shell("Yetki yok", alertBox("warn", "Bu ekran sizin rolünüz için değil", "Ana sayfaya yönlendirildiniz.") + `<a class="btn block" href="${homeOf()}">Ana sayfa</a>`); return; }
  if (params.aid && !canView(params.aid)) { shell("Bulunamadı", alertBox("warn", "Öğrenci bulunamadı", "Bu öğrenciyi görüntüleme yetkiniz yok veya kayıt silinmiş.") + `<a class="btn block" href="${homeOf()}">Ana sayfa</a>`); return; }
  afterRender = [];
  try { const out = match.fn(params); if (out && out.html != null) shell(out.title, out.html, out); }
  catch (e) { console.error(e); shell("Hata", alertBox("bad", "Beklenmeyen bir hata oluştu", esc(e.message)) + `<a class="btn block" href="${homeOf()}">Ana sayfa</a>`); }
  afterRender.forEach(f => { try { f(); } catch (e) { console.error(e); } });
}
function tabsFor() {
  const r = role();
  if (r === "coach") return [["#/c", "home", "Ana sayfa"], ["#/c/athletes", "users", "Öğrenciler"], ["#/c/groups", "layers", "Gruplar"], ["#/library", "play", "Egzersizler"], ["#/settings", "gear", "Ayarlar"]];
  if (r === "athlete") return [["#/s", "home", "Bugün"], ["#/s/program", "cal", "Programım"], ["#/s/progress", "trend", "Gelişimim"], ["#/s/video", "camera", "Video AI"], ["#/s/me", "user", "Profilim"]];
  if (r === "parent") return [["#/p", "home", "Özet"], ["#/p/calendar", "cal", "Takvim"], ["#/p/progress", "trend", "Gelişim"], ["#/p/report", "doc", "Rapor"], ["#/settings", "gear", "Ayarlar"]];
  return [];
}
function shell(title, html, opt = {}) {
  const app = $("#app");
  if (opt.bare) { app.innerHTML = html; window.scrollTo(0, 0); return; }
  const tabs = ST.user ? tabsFor() : [], here = "#" + CUR.path;
  const isTab = tabs.some(t => t[0] === here);
  const unread = ST.user && ST.profile ? notifCount() : 0;
  app.innerHTML = `<header class="topbar">${!isTab && opt.back !== false ? `<button class="iconbtn" data-act="back" aria-label="Geri">${ic("back")}</button>` : `<div class="avatar sm" aria-hidden="true">${esc(initials(myName() || "R"))}</div>`}
    <h1>${esc(title)}</h1><span id="saveInd" class="saveind"></span>
    ${ST.user && ST.profile ? `<button class="iconbtn" data-act="refresh" aria-label="Yenile">${ic("refresh")}</button><a class="iconbtn" href="#/notifs" aria-label="Bildirimler">${ic("bell")}${unread ? '<span class="dot"></span>' : ""}</a>` : ""}</header>
    <main class="${tabs.length ? "" : "noNav"}">${html}</main>
    ${tabs.length ? `<nav class="tabbar">${tabs.map(([h, i, l]) => `<a class="tab ${here === h || (h.length > 3 && here.startsWith(h + "/")) ? "on" : ""}" href="${h}">${ic(i)}<span>${l}</span></a>`).join("")}</nav>` : ""}`;
  updateSaveInd();
  if (!opt.keepScroll) window.scrollTo(0, 0);
}
function reRender() { const y = window.scrollY; render(); window.scrollTo(0, y); }

/* ---------------- Olaylar ---------------- */
const ACT = {}, FORM = {};
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  if (el.dataset.act === "sheetBg") { if (e.target === el) closeSheet(); return; }
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); (async () => fn(el, e))().catch(err => { console.warn(err); toast(err.message); }); }
});
document.addEventListener("submit", e => {
  const f = e.target, fn = FORM[f.dataset.form];
  if (!fn) return;
  e.preventDefault();
  const btn = f.querySelector("button[type=submit]"); if (btn) btn.disabled = true;
  (async () => fn(formData(f), f))().catch(err => { console.warn(err.message); toast(err.message, 3500); }).finally(() => { if (btn && document.body.contains(btn)) btn.disabled = false; });
});
document.addEventListener("click", e => { const c = e.target.closest(".chip[data-toggle]"); if (c) { c.classList.toggle("on"); const i = c.querySelector("input"); if (i) i.checked = c.classList.contains("on"); e.preventDefault(); } });
ACT.back = () => back();
ACT.closeSheet = () => closeSheet();
ACT.refresh = async el => { el.disabled = true; await flush(); await loadAll(); toast("Güncellendi"); reRender(); };
ACT.copy = async el => { const t = el.dataset.text; try { await navigator.clipboard.writeText(t); toast("Kopyalandı: " + t); } catch (e) { toast(t); } };
ACT.share = async el => { const t = el.dataset.text; if (navigator.share) { try { await navigator.share({text: t}); } catch (e) {} } else { try { await navigator.clipboard.writeText(t); toast("Mesaj kopyalandı"); } catch (e) { toast(t); } } };
const LOGO_SVG = `<svg class="logo" style="width:72px;height:72px" viewBox="0 0 96 96" aria-hidden="true"><defs><linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3B82F6"/><stop offset="1" stop-color="#22D3C5"/></linearGradient></defs><rect x="4" y="4" width="88" height="88" rx="24" fill="#0F1A30" stroke="url(#lg2)" stroke-width="3"/><path d="M26 64 L42 30 L54 52 L62 40 L72 64" fill="none" stroke="url(#lg2)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="62" cy="26" r="6" fill="#22D3C5"/></svg>`;
const codeBox = code => `<div class="codebox">${esc(String(code).slice(0, 3))}<span>-</span>${esc(String(code).slice(3))}</div>`;
