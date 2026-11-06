/* =========================================================================
   ÇEKİRDEK: yardımcılar, şifreli kasa (AES-GCM + PBKDF2), IndexedDB, yetki, denetim kaydı
   ========================================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = (p = "") => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isNum = v => typeof v === "number" && isFinite(v);
const num = v => { if (v === "" || v == null) return null; const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : null; };
const round = (v, d = 0) => { const m = Math.pow(10, d); return Math.round(v * m) / m; };
const fmtN = (v, d = 1) => isNum(v) ? round(v, d).toLocaleString("tr-TR", {minimumFractionDigits: d, maximumFractionDigits: d}) : "—";
const pad2 = n => String(n).padStart(2, "0");
const isoOf = d => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
const todayISO = () => isoOf(new Date());
const parseISO = s => { const [y, m, d] = String(s).slice(0, 10).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const fmtD = iso => { if (!iso) return "—"; const d = parseISO(iso); return pad2(d.getDate()) + "." + pad2(d.getMonth() + 1) + "." + d.getFullYear(); };
const fmtDT = ts => { const d = new Date(ts); return fmtD(isoOf(d)) + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()); };
const DOW = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const DOWL = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const mondayOf = iso => { const d = parseISO(iso); const k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return isoOf(d); };
const ageAt = (birth, at) => birth ? (parseISO(at || todayISO()) - parseISO(birth)) / (365.25 * 86400000) : null;
function normCdf(z) { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const d = 0.3989423 * Math.exp(-z * z / 2); let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }
function seeded(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const initials = n => String(n || "?").trim().split(/\s+/).map(x => x[0]).slice(0, 2).join("").toLocaleUpperCase("tr-TR");
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const sd = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1)); };
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };

/* ---------- Base64 / kripto ---------- */
const b64e = buf => { const b = new Uint8Array(buf); let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
const b64d = str => { const s = atob(str); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; };
const TE = new TextEncoder(), TD = new TextDecoder();
const PBKDF2_IT = 150000;
function cryptoOK() { return !!(window.crypto && crypto.subtle && window.isSecureContext !== false); }
async function deriveKEK(password, saltB64, it) {
  const base = await crypto.subtle.importKey("raw", TE.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name: "PBKDF2", salt: b64d(saltB64), iterations: it, hash: "SHA-256"}, base, {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]);
}
async function aesEnc(key, bytes) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({name: "AES-GCM", iv}, key, bytes); return {iv: b64e(iv), ct: b64e(ct)}; }
async function aesDec(key, obj) { return new Uint8Array(await crypto.subtle.decrypt({name: "AES-GCM", iv: b64d(obj.iv)}, key, b64d(obj.ct))); }
async function importDEK(raw) { return crypto.subtle.importKey("raw", raw, {name: "AES-GCM"}, false, ["encrypt", "decrypt"]); }
async function wrapFor(email, password, memberId, dekRaw) {
  const salt = b64e(crypto.getRandomValues(new Uint8Array(16)));
  const kek = await deriveKEK(password, salt, PBKDF2_IT);
  return {email: email.toLowerCase().trim(), memberId, salt, it: PBKDF2_IT, wk: await aesEnc(kek, dekRaw)};
}

/* ---------- Kasa (localStorage) ---------- */
const IDX_KEY = "rush.index.v1", REM_KEY = "rush.remember.v1", PREF_KEY = "rush.prefs.v1";
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { console.warn(e); return false; } };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };
const vaultIds = () => lsGet(IDX_KEY) || [];
const vaultGet = id => lsGet("rush.v." + id);
function vaultPut(id, v) {
  const ok = lsSet("rush.v." + id, v);
  if (!ok) throw new Error("Depolama alanı dolu. Eski videoları veya kayıtları silin.");
  const ids = vaultIds(); if (!ids.includes(id)) { ids.push(id); lsSet(IDX_KEY, ids); }
}
function vaultDel(id) { lsDel("rush.v." + id); lsSet(IDX_KEY, vaultIds().filter(x => x !== id)); }

/* Oturum durumu */
const S = {ws: null, dek: null, dekRaw: null, me: null, db: null, dirty: false, saving: false, lastSave: null, lockedAt: null};
let DB = null;

function emptyDB(wsName) {
  return {schema: 1, ws: {id: uid("ws_"), name: wsName, createdAt: Date.now()}, members: [], athletes: [], measurements: [], health: [],
    tests: [], programs: [], logs: [], extLoads: [], videos: [], groups: [], comments: [], notifs: [], consents: [], audit: [],
    customSports: [], customExercises: [], exVideos: {}, prefs: {avoid: {}, prefer: {}}, settings: {}};
}

async function createWorkspace({wsName, name, email, password, role}) {
  const dekRaw = crypto.getRandomValues(new Uint8Array(32));
  const db = emptyDB(wsName || (name + " çalışma alanı"));
  const me = {id: uid("m_"), name, email: email.toLowerCase().trim(), role, admin: true, athleteIds: [], createdAt: Date.now()};
  db.members.push(me);
  const vault = {v: 1, wsId: db.ws.id, wsName: db.ws.name, users: [await wrapFor(email, password, me.id, dekRaw)], data: null, updatedAt: Date.now()};
  const dek = await importDEK(dekRaw);
  vault.data = await aesEnc(dek, TE.encode(JSON.stringify(db)));
  vaultPut(db.ws.id, vault);
  return openSession(db.ws.id, dekRaw, me.id, db);
}

async function openSession(wsId, dekRaw, memberId, db) {
  S.ws = wsId; S.dekRaw = dekRaw; S.dek = await importDEK(dekRaw);
  if (!db) { const v = vaultGet(wsId); db = JSON.parse(TD.decode(await aesDec(S.dek, v.data))); }
  DB = S.db = migrate(db);
  S.me = DB.members.find(m => m.id === memberId);
  if (!S.me) throw new Error("Üye bulunamadı");
  S.lastSave = Date.now();
  return S.me;
}

async function login(email, password, remember) {
  email = String(email || "").toLowerCase().trim();
  for (const id of vaultIds()) {
    const v = vaultGet(id); if (!v) continue;
    const u = v.users.find(x => x.email === email); if (!u) continue;
    try {
      const kek = await deriveKEK(password, u.salt, u.it);
      const raw = await aesDec(kek, u.wk);
      await openSession(id, raw, u.memberId);
      if (remember) lsSet(REM_KEY, {wsId: id, memberId: u.memberId, k: b64e(raw)}); else lsDel(REM_KEY);
      audit("Giriş yapıldı", null, S.me.email);
      return true;
    } catch (e) { throw new Error("E-posta veya şifre hatalı."); }
  }
  throw new Error("E-posta veya şifre hatalı.");
}
async function tryRemembered() {
  const r = lsGet(REM_KEY); if (!r) return false;
  try { await openSession(r.wsId, b64d(r.k), r.memberId); return true; } catch (e) { lsDel(REM_KEY); return false; }
}
function logout() { flushSave(); S.ws = S.dek = S.dekRaw = S.me = S.db = null; DB = null; lsDel(REM_KEY); }

let saveTimer = null;
function save() { S.dirty = true; clearTimeout(saveTimer); saveTimer = setTimeout(flushSave, 350); updateSaveInd(); }
async function flushSave() {
  if (!S.dirty || !S.dek || !DB) return;
  clearTimeout(saveTimer); S.dirty = false; S.saving = true; updateSaveInd();
  try {
    const v = vaultGet(S.ws);
    v.data = await aesEnc(S.dek, TE.encode(JSON.stringify(DB)));
    v.wsName = DB.ws.name; v.updatedAt = Date.now();
    vaultPut(S.ws, v);
    S.lastSave = Date.now();
  } catch (e) { S.dirty = true; toast("Kayıt hatası: " + e.message); }
  S.saving = false; updateSaveInd();
}
function updateSaveInd() { const el = $("#saveInd"); if (el) el.textContent = S.saving || S.dirty ? "Kaydediliyor…" : "✓ Kaydedildi"; }
async function addMemberLogin(member, password) {
  const v = vaultGet(S.ws);
  if (vaultIds().some(id => (vaultGet(id) || {users: []}).users.some(u => u.email === member.email)))
    throw new Error("Bu e-posta bu cihazda zaten kayıtlı.");
  v.users.push(await wrapFor(member.email, password, member.id, S.dekRaw));
  vaultPut(S.ws, v);
}
async function changePassword(oldPw, newPw) {
  const v = vaultGet(S.ws); const u = v.users.find(x => x.memberId === S.me.id);
  const kek = await deriveKEK(oldPw, u.salt, u.it);
  try { await aesDec(kek, u.wk); } catch (e) { throw new Error("Mevcut şifre hatalı."); }
  const n = await wrapFor(u.email, newPw, u.memberId, S.dekRaw);
  Object.assign(u, n); vaultPut(S.ws, v); audit("Şifre değiştirildi", null, "");
}
function removeMemberLogin(memberId) { const v = vaultGet(S.ws); v.users = v.users.filter(u => u.memberId !== memberId); vaultPut(S.ws, v); }

function migrate(db) {
  const def = emptyDB(db.ws ? db.ws.name : "Çalışma alanı");
  for (const k in def) if (db[k] == null) db[k] = def[k];
  return db;
}

/* ---------- IndexedDB (şifreli video blob) ---------- */
function idb() {
  return new Promise((res, rej) => { const r = indexedDB.open("rush-media", 1); r.onupgradeneeded = () => r.result.createObjectStore("blobs"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
async function idbPut(key, val) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction("blobs", "readwrite"); t.objectStore("blobs").put(val, key); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); }
async function idbGet(key) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction("blobs", "readonly"); const q = t.objectStore("blobs").get(key); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
async function idbDel(key) { const d = await idb(); return new Promise(res => { const t = d.transaction("blobs", "readwrite"); t.objectStore("blobs").delete(key); t.oncomplete = () => res(); t.onerror = () => res(); }); }
async function idbClear() { try { const d = await idb(); await new Promise(res => { const t = d.transaction("blobs", "readwrite"); t.objectStore("blobs").clear(); t.oncomplete = res; t.onerror = res; }); } catch (e) {} }
async function storeBlob(file) {
  const key = uid("blob_");
  const enc = await aesEnc(S.dek, new Uint8Array(await file.arrayBuffer()));
  await idbPut(key, {ws: S.ws, type: file.type || "video/mp4", iv: enc.iv, ct: enc.ct});
  return key;
}
async function loadBlobURL(key) {
  const r = await idbGet(key); if (!r) return null;
  const bytes = await aesDec(S.dek, r);
  return URL.createObjectURL(new Blob([bytes], {type: r.type}));
}

/* ---------- Yetkilendirme ---------- */
const ROLE_N = {coach: "Antrenör", parent: "Veli", athlete: "Sporcu"};
const role = () => S.me ? S.me.role : null;
function visibleAthletes() {
  if (!DB || !S.me) return [];
  if (S.me.admin && S.me.role !== "athlete") return DB.athletes;
  return DB.athletes.filter(a => (S.me.athleteIds || []).includes(a.id));
}
const canView = aid => visibleAthletes().some(a => a.id === aid);
const getA = id => DB.athletes.find(a => a.id === id);
function consent(aid, type) { const c = DB.consents.filter(x => x.athleteId === aid && x.type === type).sort((a, b) => b.at - a.at)[0]; return c ? c.granted : false; }
function canSeeHealth(aid) { if (!canView(aid)) return false; if (role() === "coach") return consent(aid, "shareCoach"); return true; }
function canEditHealth(aid) { if (!canView(aid)) return false; if (role() === "parent") return true; if (role() === "coach") return consent(aid, "shareCoach") && consent(aid, "health"); return false; }
function canEditProfile(aid) { return canView(aid) && (role() === "coach" || role() === "parent"); }
function canEnterTests(aid) { return canView(aid) && role() === "coach"; }
function hasCoach() { return DB.members.some(m => m.role === "coach"); }
function canApprove() { return role() === "coach" || (role() === "parent" && !hasCoach()); }
function canEditProgram(aid) { return canView(aid) && (role() === "coach" || (role() === "parent" && !hasCoach())); }
const myAthlete = () => role() === "athlete" ? visibleAthletes()[0] || null : null;

function audit(action, athleteId, detail) {
  if (!DB) return;
  DB.audit.push({at: Date.now(), by: S.me ? S.me.id : null, byName: S.me ? S.me.name + " (" + ROLE_N[S.me.role] + ")" : "-", action, athleteId: athleteId || null, detail: detail || ""});
  if (DB.audit.length > 3000) DB.audit.splice(0, DB.audit.length - 3000);
  save();
}

/* ---------- Bildirimler ---------- */
function notify(n) {
  if (!DB) return;
  if (n.key && DB.notifs.some(x => x.key === n.key)) return;
  const item = Object.assign({id: uid("n_"), at: Date.now(), roles: ["coach", "parent", "athlete"], readBy: {}}, n);
  DB.notifs.push(item);
  if (DB.notifs.length > 600) DB.notifs.splice(0, DB.notifs.length - 600);
  save();
  if (myNotifs().some(x => x.id === item.id)) systemNotify(item);
}
function myNotifs() {
  if (!DB || !S.me) return [];
  return DB.notifs.filter(n => n.roles.includes(role()) && (!n.athleteId || canView(n.athleteId)) && (!n.memberId || n.memberId === S.me.id)).sort((a, b) => b.at - a.at);
}
const unreadCount = () => myNotifs().filter(n => !n.readBy[S.me.id]).length;
function systemNotify(n) {
  try {
    const p = mySettings();
    if (!p.sysNotif || !("Notification" in window) || Notification.permission !== "granted") return;
    if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then(r => r.showNotification(n.title, {body: n.body, icon: "icons/icon-192.png", tag: n.key || n.id}));
    else new Notification(n.title, {body: n.body, icon: "icons/icon-192.png"});
  } catch (e) {}
}
function mySettings() {
  if (!DB || !S.me) return {};
  DB.settings[S.me.id] = Object.assign({theme: "dark", text: "normal", sysNotif: false, remind: true, autoLock: 10, aiUrl: ""}, DB.settings[S.me.id] || {});
  return DB.settings[S.me.id];
}
function applyPrefs() {
  const p = S.me ? mySettings() : (lsGet(PREF_KEY) || {});
  document.documentElement.dataset.theme = p.theme === "light" ? "light" : "dark";
  document.documentElement.dataset.text = p.text === "large" ? "large" : "normal";
  lsSet(PREF_KEY, {theme: p.theme, text: p.text});
}

/* ---------- UI yardımcıları ---------- */
function toast(msg, ms = 2600) {
  const h = $("#toastHost"); h.innerHTML = `<div class="toast" role="status">${esc(msg)}</div>`;
  clearTimeout(toast._t); toast._t = setTimeout(() => { h.innerHTML = ""; }, ms);
}
function sheet(html) { $("#sheetHost").innerHTML = `<div class="sheetbg" data-act="sheetBg"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`; }
function closeSheet() { $("#sheetHost").innerHTML = ""; }
function confirmBox(msg, okLabel = "Onayla", danger = false) {
  return new Promise(res => {
    sheet(`<h2>Onay</h2><p>${esc(msg)}</p><div class="btns"><button class="btn" id="cfNo">Vazgeç</button><button class="btn ${danger ? "danger" : "pri"}" id="cfOk">${esc(okLabel)}</button></div>`);
    $("#cfNo").onclick = () => { closeSheet(); res(false); };
    $("#cfOk").onclick = () => { closeSheet(); res(true); };
  });
}
function promptBox(title, label, def = "", required = true) {
  return new Promise(res => {
    sheet(`<h2>${esc(title)}</h2><label class="f"><span>${esc(label)}</span><textarea class="in" id="pbIn">${esc(def)}</textarea></label><div class="btns"><button class="btn" id="pbNo">Vazgeç</button><button class="btn pri" id="pbOk">Kaydet</button></div>`);
    $("#pbNo").onclick = () => { closeSheet(); res(null); };
    $("#pbOk").onclick = () => { const v = $("#pbIn").value.trim(); if (required && !v) { toast("Bu alan zorunlu."); return; } closeSheet(); res(v); };
  });
}
function download(name, text, type = "application/json") {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], {type})); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function formData(form) {
  const o = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === "checkbox") { if (el.dataset.multi) { (o[el.name] = o[el.name] || []); if (el.checked) o[el.name].push(el.value); } else o[el.name] = el.checked; }
    else if (el.type === "radio") { if (el.checked) o[el.name] = el.value; }
    else o[el.name] = el.value;
  }
  return o;
}
