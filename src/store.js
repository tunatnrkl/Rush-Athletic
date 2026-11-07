/* =========================================================================
   UYGULAMA DURUMU — sunucudaki satırları motorun kullandığı düz listelere çevirir,
   değişiklikleri doğru belgeye (öğrenci bilgisi / antrenör verisi / antrenman kaydı) geri yazar.
   ========================================================================= */
const ST = {user: null, profile: null, rows: [], coachDoc: {}, loaded: false, pending: {}, saving: false, lastErr: null};
let DB = emptyDB();
function emptyDB() { return {athletes: [], measurements: [], tests: [], health: [], programs: [], logs: [], extLoads: [], videos: [], comments: [], groups: [], prefs: {avoid: {}, prefer: {}}, customSports: [], customExercises: [], exVideos: lsGet("rush2.exvideos") || {}, painReviewed: {}, clearances: {}}; }
const role = () => ST.profile ? ST.profile.role : null;
const myId = () => ST.user ? ST.user.id : null;
const myName = () => ST.profile ? ST.profile.name : "";
const getA = id => DB.athletes.find(a => a.id === id);
const canView = id => DB.athletes.some(a => a.id === id);
const myAthlete = () => role() === "athlete" ? DB.athletes[0] || null : null;
const ROLE_N = {coach: "Antrenör", parent: "Veli", athlete: "Öğrenci"};
/* Öğrencinin kendisinin doldurduğu alanlar */
const INFO_FIELDS = ["name", "birthDate", "sex", "dominantHand", "dominantFoot", "activityLevel", "sportsHistory", "trainingYears", "weeklySessions", "teamSessionMin", "teamDays", "sleepHours", "club", "school", "personalGoals", "interests", "wishSport", "consentAt"];
const strip = o => { const c = Object.assign({}, o); delete c.athleteId; delete c.src; return c; };

function buildDB() {
  const D = emptyDB();
  for (const r of ST.rows) {
    const i = r.info || {}, c = r.coach || {}, l = r.logs || {};
    const a = {};
    INFO_FIELDS.forEach(k => { if (i[k] !== undefined) a[k] = i[k]; });
    Object.assign(a, {id: r.id, name: i.name || r.invite_note || "Yeni öğrenci", linked: !!r.athlete_user_id, inviteCode: r.invite_code, inviteNote: r.invite_note, parentCode: r.parent_code,
      coachName: r.coach_name, coachId: r.coach_id, createdAt: r.created_at, infoDone: !!(i.name && i.birthDate && i.sex),
      primarySport: c.primarySport || "", position: c.position || "", level: c.level || "", competency: c.competency || 2, goals: c.goals || [], targets: c.targets || {},
      season: c.season || {phases: [], comps: []}, coachNote: c.note || "", interests: i.interests || {}, health0: i.healthNone || false});
    D.athletes.push(a);
    const put = (arr, list, extra) => (list || []).forEach(x => arr.push(Object.assign({}, x, {athleteId: r.id}, extra || {})));
    put(D.measurements, c.measurements); put(D.tests, c.tests); put(D.programs, c.programs); put(D.comments, c.comments);
    put(D.videos, c.videos, {src: "coach"}); put(D.extLoads, c.groupLoads, {src: "coach"});
    put(D.health, i.health); put(D.logs, l.logs); put(D.extLoads, l.extLoads, {src: "athlete"}); put(D.videos, l.videos, {src: "athlete"});
    Object.assign(D.painReviewed, c.painReviewed || {}); Object.assign(D.clearances, c.clearances || {});
  }
  const cd = ST.coachDoc || {};
  D.groups = cd.groups || []; D.prefs = cd.prefs || {avoid: {}, prefer: {}}; D.customSports = cd.customSports || []; D.customExercises = cd.customExercises || [];
  DB = D;
}
async function loadAll() {
  ST.rows = await API.listAthletes();
  ST.coachDoc = role() === "coach" ? await API.getCoachDoc() : {};
  buildDB(); ST.loaded = true; ST.loadedAt = Date.now();
}
function docInfo(aid) {
  const a = getA(aid), o = {};
  INFO_FIELDS.forEach(k => { if (a[k] !== undefined) o[k] = a[k]; });
  o.healthNone = !!a.health0;
  o.health = DB.health.filter(x => x.athleteId === aid).map(strip);
  return o;
}
function docLogs(aid) {
  return {logs: DB.logs.filter(x => x.athleteId === aid).map(strip), extLoads: DB.extLoads.filter(x => x.athleteId === aid && x.src !== "coach").map(strip),
    videos: DB.videos.filter(x => x.athleteId === aid && x.src === "athlete").map(strip)};
}
function docCoach(aid) {
  const a = getA(aid), mine = arr => arr.filter(x => x.athleteId === aid).map(strip);
  const logIds = new Set(DB.logs.filter(l => l.athleteId === aid).map(l => l.id)), hIds = new Set(DB.health.filter(h => h.athleteId === aid).map(h => h.id));
  const pr = {}, cl = {};
  for (const k in DB.painReviewed) if (logIds.has(k)) pr[k] = DB.painReviewed[k];
  for (const k in DB.clearances) if (hIds.has(k)) cl[k] = DB.clearances[k];
  return {primarySport: a.primarySport, position: a.position, level: a.level, competency: a.competency, goals: a.goals, targets: a.targets, season: a.season, note: a.coachNote,
    measurements: mine(DB.measurements), tests: mine(DB.tests), programs: mine(DB.programs), comments: mine(DB.comments),
    videos: DB.videos.filter(x => x.athleteId === aid && x.src === "coach").map(strip), groupLoads: DB.extLoads.filter(x => x.athleteId === aid && x.src === "coach").map(strip), painReviewed: pr, clearances: cl};
}
/* Hangi rol hangi belgeye yazabilir — arayüzde de aynı kural uygulanır, sunucuda zorunludur */
const WRITE_RULE = {info: "athlete", logs: "athlete", coach: "coach", coachdoc: "coach"};
function saveAth(aid, part) {
  if (WRITE_RULE[part] !== role()) { console.warn("izin yok", part); return; }
  ST.pending[part === "coachdoc" ? "coachdoc" : aid + "|" + part] = 1; scheduleFlush();
}
const saveCoachDoc = () => saveAth(null, "coachdoc");
let flushT = null;
function scheduleFlush(ms = 500) { clearTimeout(flushT); flushT = setTimeout(flush, ms); updateSaveInd(); }
async function flush() {
  if (ST.saving) { scheduleFlush(400); return; }
  const keys = Object.keys(ST.pending); if (!keys.length) { updateSaveInd(); return; }
  ST.saving = true; updateSaveInd();
  for (const k of keys) {
    delete ST.pending[k];
    try {
      if (k === "coachdoc") await API.saveCoachDoc({groups: DB.groups, prefs: DB.prefs, customSports: DB.customSports, customExercises: DB.customExercises});
      else { const [aid, part] = k.split("|"); if (!getA(aid)) continue; if (part === "info") await API.saveInfo(aid, docInfo(aid)); else if (part === "logs") await API.saveLogs(aid, docLogs(aid)); else await API.saveCoach(aid, docCoach(aid)); }
      ST.lastErr = null;
    } catch (e) { ST.pending[k] = 1; ST.lastErr = e.message; toast("Kaydedilemedi: " + e.message + " — tekrar denenecek", 3500); }
  }
  ST.saving = false; updateSaveInd();
  if (Object.keys(ST.pending).length) scheduleFlush(15000);
}
function updateSaveInd() {
  const el = $("#saveInd"); if (!el) return;
  const n = Object.keys(ST.pending).length;
  el.textContent = ST.saving || n ? (ST.lastErr ? "⚠︎ Bekliyor" : "Kaydediliyor…") : "✓ Kaydedildi";
}
window.addEventListener("online", () => scheduleFlush(100));
/* Cihaz başına egzersiz demo videoları (sunucuya gönderilmez) */
function saveExVideos() { lsSet("rush2.exvideos", DB.exVideos); }
