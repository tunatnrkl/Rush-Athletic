/* =========================================================================
   ÇEKİRDEK: yardımcılar, IndexedDB, arayüz yardımcıları
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

/* ---------- IndexedDB (yalnızca bu cihazdaki egzersiz demo videoları) ---------- */
function idb() { return new Promise((res, rej) => { const r = indexedDB.open("rush-media", 2); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains("blobs")) r.result.createObjectStore("blobs"); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function idbPut(key, val) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction("blobs", "readwrite"); t.objectStore("blobs").put(val, key); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); }
async function idbGet(key) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction("blobs", "readonly"); const q = t.objectStore("blobs").get(key); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
async function idbDel(key) { try { const d = await idb(); await new Promise(res => { const t = d.transaction("blobs", "readwrite"); t.objectStore("blobs").delete(key); t.oncomplete = res; t.onerror = res; }); } catch (e) {} }
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

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
