/* =========================================================================
   MOTOR: büyüme/olgunlaşma, test puanlama, branş uygunluğu, program üretimi,
   yük takibi, eğilim analizi, ek gelişim, optimizasyon, video kuralları
   Tüm hesaplamalar açıklanabilir ve deterministiktir (LLM kullanılmaz).
   ========================================================================= */
const STAGES = [
 null,
 {n:"Temel hareket becerileri", focus:"Koşma, sıçrama, atma-tutma ve denge; oyun temelli ve çok yönlü hareket. Kuvvet vücut ağırlığıyla, teknik öncelikli."},
 {n:"Genel motor beceri gelişimi", focus:"Çok sporlu katılım, koordinasyon, kısa mesafe sürat oyunları, temel kuvvet paternleri."},
 {n:"Kuvvet gelişimine hazırlık", focus:"Hareket yeterliliği, vücut ağırlığı ve hafif dış yük, iniş mekaniği, düşük–orta şiddette plyometrik."},
 {n:"Kuvvet ve güç gelişimi", focus:"Kademeli dış yük, orta şiddette plyometrik, sprint mekaniği. Büyüme atağında yük dikkatle yönetilir."},
 {n:"Branşa özgü atletik gelişim", focus:"Branş gereksinimlerine göre güç, sürat, çeviklik ve enerji sistemleri gelişimi."},
 {n:"İleri performans gelişimi", focus:"İleri kuvvet-güç yöntemleri ve bireyselleştirilmiş dönemlendirme (uzman gözetiminde)."}
];
const PHASES = {adapt:"Temel adaptasyon", str:"Kuvvet ve motor beceri gelişimi", spec:"Branşa özgü atletik gelişim", integ:"Performans bütünleştirme", test:"Yeniden değerlendirme"};
const QCAT = {spd:["spd"], pow:["plyo"], str:["str"], agi:["cod"], end:["cond"], coo:["coo"], bal:["bal"], mob:["mob"], rea:["rea"]};
const PLYO_CAP = [0, 40, 50, 70, 90, 110, 120];

const allSports = () => SPORTS.concat((DB && DB.customSports) || []);
const sportById = id => allSports().find(s => s.id === id);
const exById = id => EX[id] || ((DB && DB.customExercises) || []).find(e => e.id === id);
const allExercises = () => EXERCISES.concat((DB && DB.customExercises) || []);
const sexKey = a => a && a.sex === "K" ? "f" : "m";

/* ---------------- Antropometri ---------------- */
const measOf = aid => DB.measurements.filter(m => m.athleteId === aid).sort((a, b) => a.date < b.date ? -1 : 1);
function anth(aid) {
  const r = {};
  for (const m of measOf(aid)) for (const k in m) if (m[k] !== null && m[k] !== "" && m[k] !== undefined && !["id", "athleteId"].includes(k)) r[k] = m[k];
  if (isNum(r.heightCm) && isNum(r.sittingHeightCm) && !isNum(r.legLengthCm)) r.legLengthCm = round(r.heightCm - r.sittingHeightCm, 1);
  return r;
}
function lastWith(aid, ...keys) { const ms = measOf(aid).filter(m => keys.every(k => isNum(m[k]))); return ms[ms.length - 1] || null; }
function growthVelocity(aid) {
  const hs = measOf(aid).filter(m => isNum(m.heightCm));
  if (hs.length < 2) return null;
  const last = hs[hs.length - 1];
  let best = null;
  for (const m of hs.slice(0, -1)) { const d = daysBetween(m.date, last.date); if (d >= 90) { if (!best || Math.abs(d - 365) < Math.abs(daysBetween(best.date, last.date) - 365)) best = m; } }
  if (!best) return {insufficient: true, note: "Büyüme hızı için ölçümler arasında en az 3 ay gerekir."};
  const days = daysBetween(best.date, last.date);
  const v = (last.heightCm - best.heightCm) / days * 365.25;
  return {v: round(v, 1), from: best.date, to: last.date, days, rapid: v >= 7.5, note: v >= 7.5 ? "Hızlı büyüme dönemi göstergesi (≥7,5 cm/yıl): sıçrama, sprint ve yük hacmi dikkatle yönetilmeli." : "Büyüme hızı olağan aralıkta görünüyor."};
}
function maturity(a) {
  const m = lastWith(a.id, "heightCm", "sittingHeightCm", "weightKg") || lastWith(a.id, "heightCm", "sittingHeightCm") || lastWith(a.id, "heightCm");
  if (!m || !a.birthDate) return null;
  const age = ageAt(a.birthDate, m.date), sx = sexKey(a);
  const notes = [];
  let mo, method;
  if (sx === "m") {
    if (!isNum(m.sittingHeightCm)) return {missing: "Erkeklerde olgunlaşma tahmini için oturma boyu gereklidir.", age};
    mo = -8.128741 + 0.0070346 * (age * m.sittingHeightCm); method = "Moore ve ark. (2015) — yaş × oturma boyu";
  } else {
    mo = -7.709133 + 0.0042232 * (age * m.heightCm); method = "Moore ve ark. (2015) — yaş × boy";
  }
  let mir = null;
  if (isNum(m.sittingHeightCm) && isNum(m.weightKg)) {
    const H = m.heightCm, SH = m.sittingHeightCm, LL = H - SH, W = m.weightKg;
    mir = sx === "m" ? -9.236 + 0.0002708 * (LL * SH) - 0.001663 * (age * LL) + 0.007216 * (age * SH) + 0.02292 * (W / H * 100)
                     : -9.376 + 0.0001882 * (LL * SH) + 0.0022 * (age * LL) + 0.005841 * (age * SH) - 0.002658 * (age * W) + 0.07693 * (W / H * 100);
  }
  if (age < 8 || age > 17) notes.push("Eşitlikler 8–17 yaş dışında daha az güvenilirdir.");
  notes.push("Tahmin hatası yaklaşık ±0,5–0,6 yıldır; erken ve geç olgunlaşan çocuklarda sapma artar.");
  const aphv = age - mo, popAPHV = sx === "m" ? 13.8 : 11.8;
  const timing = aphv < popAPHV - 1 ? "erken olgunlaşma eğilimi" : aphv > popAPHV + 1 ? "geç olgunlaşma eğilimi" : "ortalama zamanlama";
  const status = mo < -1 ? "PHV öncesi" : mo <= 1 ? "PHV civarı (büyüme atağı dönemi)" : "PHV sonrası";
  return {mo: round(mo, 2), mir: mir == null ? null : round(mir, 2), aphv: round(aphv, 1), status, timing, method, age: round(age, 2), date: m.date, notes, popAPHV};
}
function devStage(a) {
  const age = ageAt(a.birthDate), mat = maturity(a), ta = num(a.trainingYears) || 0, comp = num(a.competency) || 2;
  const reasons = []; let st;
  if (mat && isNum(mat.mo)) {
    const mo = mat.mo; reasons.push(`Tahmini olgunlaşma ofseti ${fmtN(mo, 1)} yıl (${mat.status}).`);
    if (mo < -3) st = age < 8 ? 1 : 2;
    else if (mo < -1) st = ta >= 1 && comp >= 3 ? 3 : 2;
    else if (mo <= 1) { st = comp >= 3 ? 3 : 2; if (ta >= 2 && comp >= 4) st = 4; reasons.push("Büyüme atağı dönemi: yüklenme artışları kademeli olmalı."); }
    else { st = comp >= 3 ? 4 : 3; if (mo > 2 && ta >= 3 && comp >= 4) st = 5; if (mo > 3 && ta >= 5 && comp >= 5 && age >= 16) st = 6; }
  } else {
    reasons.push("Olgunlaşma verisi yetersiz; kronolojik yaşa göre geçici değerlendirme yapıldı.");
    st = age < 8 ? 1 : age < 11 ? 2 : age < 13 ? 3 : age < 15 ? (comp >= 3 ? 4 : 3) : (comp >= 4 && ta >= 3 ? 5 : 4);
  }
  reasons.push(`Antrenman yaşı ${ta} yıl, teknik yeterlilik ${comp}/5 (antrenör değerlendirmesi).`);
  const gv = growthVelocity(a.id);
  if (gv && gv.rapid) reasons.push("Hızlı büyüme: plyometrik temas sayısı ve sprint hacmi azaltılır.");
  return {stage: st, ...STAGES[st], reasons, mat, gv};
}

/* ---------------- Test puanlama ---------------- */
function normFor(t, age, sx) {
  if (!t.nm || !isNum(age)) return null;
  const arr = t.nm[sx]; const a = clamp(age, 6, 18);
  let m;
  if (a <= 12) m = arr[0] + (arr[1] - arr[0]) * (a - 8) / 4;
  else if (a <= 16) m = arr[1] + (arr[2] - arr[1]) * (a - 12) / 4;
  else m = arr[2] + (arr[2] - arr[1]) * (a - 16) / 8;
  const s = isNum(t.sd) ? t.sd : (t.sdf || 0.15) * Math.abs(m);
  return {mean: m, sd: s};
}
function testValue(r) { if (isNum(r.value)) return r.value; if (isNum(r.left) && isNum(r.right)) return (r.left + r.right) / 2; return isNum(r.left) ? r.left : r.right; }
function pctScore(t, v, age, sx) { const nm = normFor(t, age, sx); if (!nm || !isNum(v)) return null; let z = (v - nm.mean) / nm.sd; if (t.lb) z = -z; return Math.round(normCdf(z) * 100); }
function asym(t, r) {
  if (!t.bil || !isNum(r.left) || !isNum(r.right)) return null;
  const absT = {shoulder: 5, ankle: 2, sitreach: 4}[t.id];
  const diff = Math.abs(r.left - r.right);
  if (absT) return {abs: round(diff, 1), flag: diff > absT, txt: `${fmtN(diff, 1)} ${t.u} fark`};
  const best = t.lb ? Math.min(r.left, r.right) : Math.max(r.left, r.right);
  const pct = best ? diff / Math.abs(best) * 100 : 0;
  const weaker = (t.lb ? r.left > r.right : r.left < r.right) ? "Sol" : "Sağ";
  return {pct: round(pct, 1), flag: pct > 10, high: pct > 15, weaker, txt: `%${fmtN(pct, 1)} (${weaker} taraf zayıf)`};
}
const testsOf = (aid, tid) => DB.tests.filter(r => r.athleteId === aid && (!tid || r.testId === tid)).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.at - b.at);
function scoreResult(a, r) { const t = TEST[r.testId]; return pctScore(t, testValue(r), ageAt(a.birthDate, r.date), sexKey(a)); }
function qualityScores(a, which = "latest") {
  const out = {};
  const all = testsOf(a.id);
  const lastDate = all.length ? all[all.length - 1].date : null;
  for (const q of QUALITIES) {
    const items = [];
    for (const t of TESTS.filter(t => t.q === q.k)) {
      const rs = testsOf(a.id, t.id); if (!rs.length) continue;
      let r = which === "latest" ? rs[rs.length - 1] : rs.length > 1 ? rs[rs.length - 2] : null;
      if (!r) continue;
      if (which === "latest" && lastDate && daysBetween(r.date, lastDate) > 365) continue;
      const sc = scoreResult(a, r);
      items.push({id: t.id, n: t.n, score: sc, value: testValue(r), date: r.date});
    }
    const scored = items.filter(i => isNum(i.score));
    out[q.k] = {score: scored.length ? Math.round(mean(scored.map(i => i.score))) : null, items, hasData: items.length > 0};
  }
  return out;
}
function targetScores(a, cur) { const t = {}; for (const q of QUALITIES) { const c = cur[q.k].score; t[q.k] = a.targets && isNum(a.targets[q.k]) ? a.targets[q.k] : isNum(c) ? Math.min(95, c + 8) : null; } return t; }
function teOf(t, v) { return isNum(t.te) ? t.te : (t.cv || 5) / 100 * Math.abs(v || 1); }
function compareResults(t, r1, r2) {
  const v1 = testValue(r1), v2 = testValue(r2); if (!isNum(v1) || !isNum(v2)) return null;
  const delta = v2 - v1, improved = t.lb ? delta < 0 : delta > 0;
  const pct = v1 > 0 ? (t.lb ? -delta : delta) / v1 * 100 : null;
  const te = teOf(t, (v1 + v2) / 2), ratio = Math.abs(delta) / te;
  let verdict, cls;
  if (ratio < 1) { verdict = "Ölçüm hatası sınırları içinde — anlamlı değişim kanıtı yok"; cls = "info"; }
  else if (ratio < 2) { verdict = improved ? "Olası gelişim — dikkatli yorumlayın" : "Olası gerileme — koşulları kontrol edin"; cls = improved ? "acc" : "warn"; }
  else { verdict = improved ? "Büyük olasılıkla gerçek gelişim" : "Büyük olasılıkla gerçek gerileme"; cls = improved ? "ok" : "bad"; }
  const days = daysBetween(r1.date, r2.date);
  return {v1, v2, delta, pct, improved, te, ratio, verdict, cls, days, growthNote: days > 90 ? "Büyüme ve olgunlaşma etkisi dışlanamaz." : ""};
}
function suggestTests(a, sportId) {
  const age = ageAt(a.birthDate), restr = restrictions(a.id), sp = sportById(sportId || a.primarySport);
  const ok = t => t.minAge <= age && !t.tags.some(x => restr.has(x));
  const pick = new Set(["sbj", "grip", "sp10", "sls", "sitreach", "walltoss", "react"].filter(id => ok(TEST[id])));
  if (sp) for (const q of sp.focus.slice(0, 4)) { const c = TESTS.filter(t => t.q === q && ok(t) && !t.maxEff); c.slice(0, 2).forEach(t => pick.add(t.id)); }
  const coachOnly = TESTS.filter(t => t.maxEff && t.minAge <= age).map(t => ({t, blocked: t.tags.some(x => restr.has(x)) || holds(a.id).length > 0}));
  const excluded = TESTS.filter(t => !ok(t)).map(t => ({t, why: t.minAge > age ? `Önerilen en düşük yaş ${t.minAge}` : "Sağlık kısıtlaması: " + t.tags.filter(x => restr.has(x)).map(x => RTAGS[x]).join(", ")}));
  return {recommended: [...pick].map(id => TEST[id]), coachOnly, excluded};
}

/* ---------------- Sağlık ---------------- */
const healthOf = aid => DB.health.filter(h => h.athleteId === aid);
function restrictions(aid) { const s = new Set(); for (const h of healthOf(aid)) if (h.status !== "geçmiş" || h.permanent) (h.tags || []).forEach(t => s.add(t)); return s; }
function holds(aid) {
  const r = [];
  for (const h of healthOf(aid)) {
    if (h.status === "geçmiş") continue;
    if (h.requiresClearance && !h.clearanceGiven && !(DB.clearances || {})[h.id]) r.push(`"${h.title}" (${HCAT[h.cat] ? HCAT[h.cat].n : h.cat}) için uzman/tıbbi onay bekleniyor.`);
  }
  const recentPain = DB.logs.filter(l => l.athleteId === aid && l.painLevel >= 4 && daysBetween(l.date, todayISO()) <= 3 && !l.painResolved && !(DB.painReviewed || {})[l.id]);
  if (recentPain.length) r.push(`Son 3 günde ${recentPain[0].painLevel}/10 şiddetinde ağrı bildirildi (${recentPain[0].painArea || "bölge belirtilmedi"}). Antrenör/uzman değerlendirmesi gerekli.`);
  return r;
}
function healthAdvice(aid) {
  const out = [];
  for (const h of healthOf(aid)) {
    if (h.status === "geçmiş" && !h.permanent) continue;
    if (h.cat === "asthma") out.push("Astım: inhaler antrenmanda erişilebilir olmalı; ısınma uzatılmalı; soğuk-kuru havada dikkat. Belirti varsa antrenman durdurulur.");
    if (h.cat === "cardio") out.push("Kalp-damar kaydı: maksimal efor testleri ve nefes tutmalı yüklenmeler hariç tutulur; uzman onayı zorunludur.");
    if (h.cat === "sense") out.push("Görme/işitme kısıtlılığı: görsel/işitsel komutlar uyarlanmalı (ör. dokunsal veya görsel işaretler).");
    if (h.cat === "neuro") out.push("Nörolojik kayıt: denge ve yükseklik içeren çalışmalarda gözetim artırılmalı.");
    if (h.cat === "injury") out.push(`Sakatlık geçmişi (${h.title}): ilgili bölgede tek taraflı kuvvet ve denge takibi önerilir.`);
  }
  return [...new Set(out)];
}

/* ---------------- Branş uygunluğu ---------------- */
function featureScores(a) {
  const an = anth(a.id), age = ageAt(a.birthDate), sx = sexKey(a), f = {};
  if (isNum(an.heightCm) && isNum(age)) {
    const ai = clamp(Math.round(age), 6, 18), ref = HREF[sx][ai], s = ai >= 12 && ai <= 15 ? 7.5 : 6.5;
    f.H = Math.round(normCdf((an.heightCm - ref) / s) * 100);
  }
  if (isNum(an.armSpanCm) && isNum(an.heightCm)) f.AS = Math.round(normCdf((an.armSpanCm / an.heightCm - 1.0) / 0.03) * 100);
  if (isNum(an.weightKg) && isNum(an.heightCm) && isNum(age)) {
    const bmi = an.weightKg / Math.pow(an.heightCm / 100, 2), ref = BMIREF[sx][clamp(Math.round(age), 6, 18)];
    f.M = Math.round(normCdf((bmi - ref) / 2.6) * 100);
  }
  const qs = qualityScores(a);
  for (const q of QUALITIES) if (isNum(qs[q.k].score)) f[q.k] = qs[q.k].score;
  return f;
}
const modeAdj = (v, mode) => mode === "low" ? 100 - v : mode === "mid" ? 100 - Math.abs(v - 50) * 2 : v;
function sportFit(a, sp, pos, fs) {
  fs = fs || featureScores(a);
  const w = (pos && pos.w) || sp.w, hM = (pos && pos.hM) || sp.hM || "mid", mM = (pos && pos.mM) || sp.mM || "mid";
  const mat = maturity(a), notes = [];
  let anthroK = 1;
  if (mat && isNum(mat.mo)) {
    if (Math.abs(mat.mo) <= 1) { anthroK = 0.5; notes.push("Büyüme atağı döneminde antropometrik ağırlıklar %50 azaltıldı (geçici avantaj/dezavantaj olabilir)."); }
    else if (mat.mo < -1) { anthroK = 0.7; notes.push("PHV öncesi dönemde boy farkları değişkendir; antropometrik ağırlıklar %30 azaltıldı."); }
  }
  const rows = []; let sw = 0, sa = 0, tot = 0;
  for (const k in w) {
    let wk = w[k] * (["H", "AS", "M"].includes(k) ? anthroK : 1);
    if (wk <= 0) continue;
    tot += wk;
    const raw = fs[k];
    const v = isNum(raw) ? (k === "H" ? modeAdj(raw, hM) : k === "M" ? modeAdj(raw, mM) : raw) : null;
    rows.push({k, n: FEAT_N[k] + (k === "H" && hM !== "high" ? (hM === "low" ? " (düşük avantajlı)" : " (orta ideal)") : k === "M" && mM !== "mid" ? (mM === "low" ? " (hafif avantajlı)" : " (yüksek avantajlı)") : ""), w: wk, v, raw});
    if (v != null) { sw += wk * v; sa += wk; }
  }
  rows.forEach(r => { r.wPct = Math.round(r.w / tot * 100); r.contrib = r.v != null && sa ? r.w / sa * r.v : null; });
  const phys = sa ? Math.round(sw / sa) : null, coverage = tot ? sa / tot : 0;
  const interest = a.interests && isNum(num(a.interests[sp.id])) ? (num(a.interests[sp.id]) - 1) / 4 * 100 : null;
  const score = phys == null ? null : interest == null ? phys : Math.round(phys * 0.8 + interest * 0.2);
  if (interest == null) notes.push("Çocuğun bu branşa ilgisi girilmedi; puan yalnızca fiziksel verilere dayanıyor.");
  const restr = restrictions(a.id), flags = [];
  if (sp.contact && restr.has("contact")) flags.push("Temas kısıtlaması var: bu branş için tıbbi değerlendirme gerekli.");
  const key = Object.entries(sp.w).sort((x, y) => y[1] - x[1]).slice(0, 3).map(x => x[0]);
  const qmap = {pow: "jump", spd: "sprint", agi: "cod"};
  key.forEach(k => { if (qmap[k] && restr.has(qmap[k])) flags.push(`"${RTAGS[qmap[k]]}" kısıtlaması bu branşın temel gereksinimlerinden birini etkiliyor.`); });
  const conf = coverage >= .75 ? "Yüksek veri kapsamı" : coverage >= .5 ? "Orta veri kapsamı" : "Düşük veri kapsamı — daha fazla test gerekli";
  return {score, phys, interest, coverage, conf, rows, notes, flags};
}
function rankSports(a) { const fs = featureScores(a); return allSports().map(sp => ({sp, fit: sportFit(a, sp, null, fs)})).filter(x => x.fit.score != null).sort((x, y) => y.fit.score - x.fit.score); }
function adequacyText(s) { return s >= 65 ? "Mevcut fiziksel profil branş gereksinimleriyle güçlü uyum gösteriyor." : s >= 50 ? "Mevcut fiziksel profil branşa uygun; hedefli gelişimle güçlenebilir." : s >= 35 ? "Gelişime açık: temel kapasitelerin geliştirilmesi önerilir." : "Branşa giriş için önce temel atletik hazırlık önerilir."; }
function similarSports(sp, n = 3) {
  const keys = Object.keys(FEAT_N), vec = s => keys.map(k => s.w[k] || 0);
  const v0 = vec(sp), dot = (x, y) => x.reduce((s, xi, i) => s + xi * y[i], 0), nrm = x => Math.sqrt(dot(x, x));
  return allSports().filter(s => s.id !== sp.id).map(s => ({s, sim: dot(v0, vec(s)) / (nrm(v0) * nrm(vec(s)))})).sort((x, y) => y.sim - x.sim).slice(0, n).map(x => x.s);
}

/* ---------------- Program üretimi ---------------- */
function needsSpace(ex) { return ex.sp === 1 || (ex.sp !== 0 && (ex.tg.includes("sprint") || ex.tg.includes("run") || ex.c === "cod")); }
function allowedEx(ex, ctx, lvMax) {
  if (!ex) return false;
  if (ex.lv > (lvMax || ctx.stage)) return false;
  if (ex.tg.some(t => ctx.restr.has(t))) return false;
  if (needsSpace(ex) && !ctx.space) return false;
  if (ex.eq.length && !ex.eq.every(item => item.split("|").some(x => ctx.eq.has(x)))) return false;
  return true;
}
function buildCtx(a, opt) {
  const ds = devStage(a);
  return {aid: a.id, a, age: ageAt(a.birthDate), stage: ds.stage, ds, restr: restrictions(a.id), eq: new Set(opt.eq || []), space: !!opt.space,
    growthRapid: !!(ds.gv && ds.gv.rapid), sport: sportById(opt.sport) || SPORTS[0], seed: opt.seed || "1"};
}
function buildPhases(weeks) {
  const nC = weeks > 16 ? Math.max(2, Math.round(weeks / 12)) : 1;
  const sizes = Array.from({length: nC}, (_, i) => Math.floor(weeks / nC) + (i < weeks % nC ? 1 : 0));
  const out = []; let w = 1, gb = 0;
  sizes.forEach((L, ci) => {
    let keys, bs;
    if (L >= 4) {
      const R = L - 1, props = [.27, .27, .27, .19];
      bs = props.map(p => Math.floor(p * R)); let rem = R - bs.reduce((x, y) => x + y, 0), i = 0;
      while (rem > 0) { bs[i % 4]++; rem--; i++; }
      bs = bs.map(x => Math.max(1, x));
      while (bs.reduce((x, y) => x + y, 0) > R) { let mi = 3; for (let i = 3; i >= 1; i--) if (bs[i] > bs[mi]) mi = i; bs[mi]--; }
      keys = ["adapt", "str", "spec", "integ"];
    } else { keys = [["adapt"], ["adapt", "integ"], ["adapt", "str", "integ"]][L - 1]; bs = keys.map(() => 1); }
    keys.forEach((k, bi) => {
      for (let j = 0; j < bs[bi]; j++) out.push({w: w++, key: k, name: PHASES[k], cycle: ci + 1, block: gb, wib: j, blockLen: bs[bi], deload: weeks >= 8 && (k === "str" || k === "spec") && bs[bi] >= 3 && j === bs[bi] - 1});
      gb++;
    });
    if (L >= 4) { out.push({w: w++, key: "test", name: PHASES.test, cycle: ci + 1, block: gb++, wib: 0, blockLen: 1, test: true}); }
  });
  return out;
}
function seasonPhaseAt(a, iso) { const s = a.season || {}; const p = (s.phases || []).find(p => p.start <= iso && iso <= p.end); return p ? p.type : null; }
function compsBetween(a, from, to) { return ((a.season || {}).comps || []).filter(c => c.date >= from && c.date <= to); }

function rpeText(ph, c) {
  if (["warm", "mob", "cool"].includes(c)) return "Rahat";
  if (["spd", "plyo"].includes(c)) return ph === "adapt" ? "Teknik odak, %80–90 efor, tam dinlenme" : "Maksimal kalite, tam dinlenme";
  return {adapt: "RPE 5–6 (rahat, teknik odak)", str: "RPE 6–7", spec: "RPE 7 — kaliteli tekrar", integ: "RPE 7–8 — kısa, hızlı", test: "Hafif (test haftası)"}[ph] || "RPE 6";
}
function doseFor(ex, ctx, ph, wib, mult) {
  const d = ex.d || {s: 2, r: 8, rest: 45}; let s = d.s;
  const maxSets = ctx.stage <= 2 ? 2 : ctx.stage === 3 ? 3 : 4;
  const fixed = ["warm", "mob", "cool"].includes(ex.c);
  if (!fixed) {
    if (ph === "adapt") s = Math.max(1, s - 1);
    if (ph === "spec" && (ex.c === "plyo" || ex.c === "spd")) s += 1;
    s = Math.max(1, Math.round(s * mult));
    s = Math.min(s, maxSets + (ex.c === "spd" ? 1 : 0));
  }
  const it = {e: ex.id, s, rest: d.rest, rpe: rpeText(ph, ex.c)};
  if (d.ps) it.ps = 1;
  if (isNum(d.r)) {
    let r = d.r;
    if (!fixed && ["str", "act", "prev", "bal", "coo", "rea"].includes(ex.c)) r = Math.min(d.r + 3, d.r + wib);
    if (ph === "integ" && ex.c === "str") r = Math.max(4, d.r - 2);
    it.r = r;
  }
  if (isNum(d.t)) it.t = fixed ? d.t : Math.round(d.t * Math.min(1.4, 1 + 0.1 * wib));
  if (isNum(d.d)) it.d = d.d;
  return it;
}
function contactsOf(it) { const ex = exById(it.e); if (!ex || !ex.pc) return 0; if (ex.pc > 1) return it.s * ex.pc; return it.s * (it.r || 5) * (it.ps ? 2 : 1); }
function estMinutes(items) {
  let sec = 0;
  for (const it of items) { const per = it.r ? it.r * 3.5 * (it.ps ? 2 : 1) : it.t ? it.t * (it.ps ? 2 : 1) : it.d ? it.d / 4 + 10 : 30; sec += it.s * per + Math.max(0, it.s - 1) * (it.rest || 0) + 25; }
  return Math.round(sec / 60);
}
const QWEAK = {
  bal: {t: "Denge zayıflığı", ex: ["b1", "b2", "b3", "st8"]}, rea: {t: "Reaksiyon yavaşlığı", ex: ["r1", "r2", "r3", "r4"]},
  mob: {t: "Mobilite eksikliği", ex: ["m3", "m1", "m4", "m6"]}, spd: {t: "Sürat gelişimi gereksinimi", ex: ["s1", "s2", "s5", "s4"]},
  pow: {t: "Patlayıcı kuvvet yetersizliği", ex: ["p3", "p4", "p5", "a7"]}, str: {t: "Genel kuvvet gelişimi gereksinimi", ex: ["st1", "st3", "a1", "st12"]},
  agi: {t: "Çeviklik gelişimi gereksinimi", ex: ["c2", "c4", "c3", "c5"]}, end: {t: "Aerobik kapasite gelişimi", ex: ["d1", "d2", "d4", "d3"]},
  coo: {t: "Koordinasyon eksikliği", ex: ["k1", "k5", "k2", "k4"]}
};
function buildSession(ctx, opt, wk, dIdx, mainQs, extras) {
  const rng = seeded(ctx.aid + ":" + wk.block + ":" + dIdx + ":" + ctx.seed);
  const used = new Set(), ph = wk.key, mult = wk.mult;
  const lvMax = ph === "adapt" ? Math.max(1, ctx.stage - 1) : ctx.stage;
  const m = opt.minutes, cnt = {mob: m >= 75 ? 3 : m >= 45 ? 2 : 1, act: m >= 45 ? 2 : 1, main: m >= 75 ? 5 : m >= 60 ? 4 : m >= 45 ? 3 : 2, sport: m >= 60 ? 2 : 1, cb: m >= 60 ? 2 : 1};
  if (opt.type === "focus") { cnt.mob = 1; cnt.act = 1; cnt.sport = 0; cnt.cb = 1; cnt.main = m >= 40 ? 4 : 3; }
  const pool = (filter, lv) => allExercises().filter(e => !used.has(e.id) && allowedEx(e, ctx, lv || lvMax) && filter(e));
  const order = (arr, pref, sortLv) => { const r = arr.map(e => ({e, k: (pref && pref.includes(e.id) ? -10 + pref.indexOf(e.id) : 0) + (sortLv ? (sortLv === "asc" ? e.lv : -e.lv) * 0.5 : 0) + prefScore(e.id) + rng()})); return r.sort((x, y) => x.k - y.k).map(x => x.e); };
  const take = (list, n) => { const out = []; for (const e of list) { if (out.length >= n) break; out.push(e); used.add(e.id); } return out; };
  const blocks = [];
  const add = (k, n, exs) => { if (exs.length) blocks.push({k, n, items: exs.map(e => doseFor(e, ctx, ph, wk.wib, mult))}); };
  const warmPref = [["w1", "w4"], ["w3", "w4"], ["w2", "w4"], ["w5", "w4"]][dIdx % 4];
  add("warm", "Genel ısınma", take(order(pool(e => e.c === "warm", 6), warmPref), 1));
  add("mob", "Dinamik mobilite", take(order(pool(e => e.c === "mob", 6)), cnt.mob));
  const actPref = [ctx.sport.prev[dIdx % ctx.sport.prev.length]];
  add("act", "Aktivasyon", take(order(pool(e => e.c === "act" || ctx.sport.prev.includes(e.id), 6), actPref), cnt.act));
  if (wk.light) {
    add("main", "Müsabaka öncesi kısa uyarı", take(order(pool(e => e.c === "spd" && e.lv <= 2), ["s5", "s8", "s1"]), 1));
    blocks.forEach(b => b.items.forEach(it => { if (!["warm", "mob"].includes(exById(it.e).c)) it.s = Math.max(1, Math.round(it.s * 0.5)); }));
  } else {
    const main = [];
    const per = mainQs.map((q, i) => Math.floor(cnt.main / mainQs.length) + (i < cnt.main % mainQs.length ? 1 : 0));
    mainQs.forEach((q, i) => {
      const n = Math.max(1, per[i]);
      const pref = ph === "spec" ? ctx.sport.drills.filter(id => exById(id) && exById(id).q.includes(q)) : [];
      const cands = pool(e => QCAT[q].includes(e.c) || (e.c === "prev" && e.q[0] === q && ph === "spec"));
      main.push(...take(order(cands, pref, ph === "adapt" ? "asc" : ph === "integ" ? "desc" : null), n));
    });
    if ((ph === "str" || ph === "spec") && !main.some(e => e.c === "str") && opt.type !== "focus") main.push(...take(order(pool(e => e.c === "str"), null, "asc"), 1));
    if (wk.test) main.splice(1);
    add("main", "Ana performans çalışması", main);
    if (cnt.sport) add("sport", `Branşa özgü fiziksel çalışma (${ctx.sport.n})`, take(order(pool(e => ctx.sport.drills.includes(e.id) || ctx.sport.prev.includes(e.id)), ctx.sport.drills), wk.test ? 1 : cnt.sport));
    let cb = [];
    if (extras && extras.length) cb = take(extras.map(id => exById(id)).filter(e => e && !used.has(e.id) && allowedEx(e, ctx)), Math.min(cnt.cb, 2));
    const cbx = cb.map(e => e.id);
    if (cb.length < cnt.cb) cb.push(...take(order(pool(e => e.c === "coo"), ["k1", "k5"]), 1));
    if (cb.length < cnt.cb) cb.push(...take(order(pool(e => e.c === "bal"), ["b1", "b2"]), 1));
    if (cb.length) { blocks.push({k: "cb", n: "Koordinasyon ve denge", items: cb.map(e => Object.assign(doseFor(e, ctx, ph, wk.wib, mult), cbx.includes(e.id) ? {extra: 1} : {}))}); }
  }
  add("cool", "Soğuma", take(order(pool(e => e.c === "cool"), ["cl1", "cl2"]), m >= 60 ? 2 : 1));
  // Plyometrik temas sınırı
  let cap = PLYO_CAP[ctx.stage] * (ctx.growthRapid ? 0.6 : 1) * Math.max(0.5, mult);
  const plyoItems = () => blocks.flatMap(b => b.items).filter(it => contactsOf(it) > 0);
  let total = plyoItems().reduce((s, it) => s + contactsOf(it), 0), guard = 0;
  while (total > cap && guard++ < 40) {
    const big = plyoItems().sort((x, y) => contactsOf(y) - contactsOf(x))[0];
    if (big.s > 1) big.s--; else { for (const b of blocks) b.items = b.items.filter(it => it !== big); }
    total = plyoItems().reduce((s, it) => s + contactsOf(it), 0);
  }
  const allItems = blocks.flatMap(b => b.items);
  return {blocks: blocks.filter(b => b.items.length), contacts: total, cap: Math.round(cap), estMin: estMinutes(allItems)};
}
/* Antrenör tercihlerinden öğrenme: sık değiştirilen/silinen egzersizler geri planda, sık seçilenler önde */
function prefScore(id) { const pf = (DB && DB.prefs) || {}; return Math.min(3, ((pf.avoid || {})[id] || 0)) * 0.35 - Math.min(3, ((pf.prefer || {})[id] || 0)) * 0.35; }
function learnPref(oldId, newId) { DB.prefs = DB.prefs || {avoid: {}, prefer: {}}; if (oldId) DB.prefs.avoid[oldId] = (DB.prefs.avoid[oldId] || 0) + 1; if (newId) DB.prefs.prefer[newId] = (DB.prefs.prefer[newId] || 0) + 1; }
function generateProgram(a, opt) {
  const hold = holds(a.id);
  if (hold.length) return {ok: false, hold};
  const ctx = buildCtx(a, opt);
  const warnings = [], rationale = [];
  const sp = ctx.sport;
  let spw = clamp(parseInt(opt.spw) || 3, 1, 5);
  const teamSess = num(a.weeklySessions) || 0, teamMin = num(a.teamSessionMin) || 90;
  const age = ctx.age;
  const hrs = teamSess * teamMin / 60 + spw * opt.minutes / 60;
  if (isNum(age) && hrs > age) {
    while (spw > 1 && teamSess * teamMin / 60 + spw * opt.minutes / 60 > age) spw--;
    warnings.push(`Toplam organize spor süresi yaşı aştığı için (≈${fmtN(hrs, 1)} sa > ${Math.floor(age)} sa) haftalık seans sayısı ${spw}'e düşürüldü (Jayanthi ve ark. 2015).`);
  }
  if (teamSess + spw > 6) { spw = Math.max(1, 6 - teamSess); warnings.push("Haftada en az 1 tam dinlenme günü için seans sayısı azaltıldı."); }
  const days = (opt.days && opt.days.length >= spw ? opt.days.slice(0, spw) : defaultDays(spw, a.teamDays || [])).map(Number).sort((x, y) => ((x + 6) % 7) - ((y + 6) % 7));
  const weeks = clamp(parseInt(opt.weeks) || 12, 1, 104);
  const phases = buildPhases(weeks);
  const start = mondayOf(opt.startDate || todayISO());
  const testInt = parseInt(opt.testInterval) || 4;
  const testWeeks = [...new Set([...Array.from({length: Math.floor(weeks / testInt)}, (_, i) => (i + 1) * testInt), ...phases.filter(p => p.test).map(p => p.w)])].filter(w => w <= weeks).sort((x, y) => x - y);
  const focus = opt.type === "focus" ? [opt.focusQ] : sp.focus.slice();
  if (opt.focusQ && opt.type !== "focus" && !focus.includes(opt.focusQ)) focus.unshift(opt.focusQ);
  const extras = opt.includeExtra ? detectNeeds(a).flatMap(n => n.ex).filter((x, i, arr) => arr.indexOf(x) === i) : [];
  rationale.push(`Gelişim evresi: ${ctx.ds.n} (evre ${ctx.stage}/6). ${ctx.ds.focus}`);
  ctx.ds.reasons.forEach(r => rationale.push(r));
  rationale.push(`Branş önceliği (${sp.n}): ${focus.map(q => QN[q]).join(" › ")}.`);
  if (ctx.restr.size) rationale.push("Hariç tutulan hareket türleri (sağlık kayıtları): " + [...ctx.restr].map(t => RTAGS[t]).join(", ") + ".");
  rationale.push(`Ekipman/ortam filtresi: ${ENVS[opt.env] ? ENVS[opt.env].n : "—"}; ${opt.space ? "koşu alanı var" : "koşu alanı yok (sprint/koşu çalışmaları çıkarıldı)"}.`);
  if (ctx.growthRapid) rationale.push("Hızlı büyüme dönemi: plyometrik temas üst sınırı %40 düşürüldü.");
  if (extras.length) rationale.push("Ek gelişim çalışmaları koordinasyon-denge bloğuna yerleştirildi; toplam egzersiz sayısı artırılmadı (yük nötr).");
  rationale.push(`Plyometrik temas üst sınırı: seans başına ${Math.round(PLYO_CAP[ctx.stage] * (ctx.growthRapid ? .6 : 1))} (evreye göre).`);
  let skippedStart = 0;
  const weeksData = phases.map(ph => {
    const wStart = addDays(start, (ph.w - 1) * 7), wEnd = addDays(wStart, 6);
    let mult = ph.test ? 0.6 : ph.deload ? 0.7 : 1; const notes = [];
    if (ph.deload) notes.push("Boşaltma haftası: hacim %30 azaltıldı.");
    const sp2 = opt.seasonAware ? seasonPhaseAt(a, wStart) : null;
    let spwW = spw;
    if (sp2 && SEASON_PHASES[sp2]) { mult *= SEASON_PHASES[sp2].vol; notes.push(`${SEASON_PHASES[sp2].n}: hacim ×${SEASON_PHASES[sp2].vol}.`); if (sp2 === "in") spwW = Math.min(spw, 2); if (sp2 === "tourn") spwW = 1; }
    const comps = opt.seasonAware ? compsBetween(a, wStart, addDays(wEnd, 2)) : [];
    if (comps.length) { const hi = comps.some(c => c.imp === "yüksek"); mult *= hi ? 0.6 : 0.8; notes.push(`Müsabaka haftası (${comps.map(c => c.name).join(", ")}): toplam yük azaltıldı, yoğunluk korunur.`); }
    if (ph.test) notes.push("Yeniden değerlendirme haftası: ilk seansta test bataryası uygulanır.");
    else if (testWeeks.includes(ph.w)) notes.push("Ara değerlendirme: haftanın ilk seansında kısa test bataryası.");
    const wk = Object.assign({}, ph, {mult: round(mult, 2)});
    const rawS = days.slice(0, spwW).map((dow, dIdx) => {
      const date = addDays(wStart, (dow + 6) % 7);
      const mainQs = opt.type === "focus" ? [opt.focusQ, opt.focusQ2 || relatedQ(opt.focusQ)] : [focus[dIdx % focus.length], focus[(dIdx + spwW) % focus.length]].filter((x, i, arr) => arr.indexOf(x) === i);
      const light = comps.some(c => { const g = daysBetween(date, c.date); return g >= 0 && g <= 1; });
      const s = buildSession(ctx, opt, Object.assign({}, wk, {light}), dIdx, mainQs, extras);
      const title = light ? "Müsabaka öncesi aktivasyon" : opt.type === "focus" ? `${QN[opt.focusQ]} odaklı seans` : mainQs.map(q => QN[q]).join(" + ");
      return Object.assign({d: dIdx, dow, date, title, focus: mainQs, light, test: dIdx === 0 && testWeeks.includes(ph.w)}, s);
    });
    const sessions = rawS.filter(x => !opt.startDate || x.date >= opt.startDate);
    skippedStart += rawS.length - sessions.length;
    return {w: ph.w, key: ph.key, phase: ph.name, cycle: ph.cycle, mult: wk.mult, deload: !!ph.deload, test: !!ph.test, notes, start: wStart, sessions};
  });
  if (skippedStart) warnings.push(`Başlangıç tarihinden önceki ${skippedStart} seans atlandı; program seçtiğiniz başlangıç gününden itibaren oluşturuldu.`);
  const blocksSummary = []; phases.forEach(p => { const last = blocksSummary[blocksSummary.length - 1]; if (last && last.key === p.key && last.cycle === p.cycle) last.to = p.w; else blocksSummary.push({key: p.key, name: p.name, from: p.w, to: p.w, cycle: p.cycle}); });
  const battery = suggestTests(a, sp.id).recommended.map(t => t.id);
  return {ok: true, program: {
    id: uid("p_"), athleteId: a.id, type: opt.type || "main", focusQ: opt.focusQ || null, sport: sp.id, pos: opt.pos || null,
    weeks, spw, minutes: opt.minutes, env: opt.env, eq: [...ctx.eq], space: ctx.space, days, startDate: start, seasonAware: !!opt.seasonAware,
    testInterval: testInt, testWeeks, battery, blocks: blocksSummary, weeksData, rationale, warnings, includeExtra: !!opt.includeExtra,
    status: "onaylı", createdAt: Date.now(), createdBy: myId(), engine: ENGINE_VERSION, stage: ctx.stage,
    changes: [], approvals: [{at: Date.now(), by: myName(), action: "Antrenör tarafından oluşturuldu"}]
  }};
}
function relatedQ(q) { return {spd: "pow", pow: "str", str: "pow", agi: "spd", end: "coo", coo: "bal", bal: "str", mob: "bal", rea: "agi"}[q] || "coo"; }
function defaultDays(n, team) {
  const pref = {1: [3], 2: [2, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5]}[n] || [1, 3, 5];
  const teamSet = new Set((team || []).map(Number));
  const out = pref.filter(d => !teamSet.has(d));
  for (const d of [1, 2, 3, 4, 5, 6, 0]) { if (out.length >= n) break; if (!out.includes(d) && !teamSet.has(d)) out.push(d); }
  for (const d of [1, 2, 3, 4, 5, 6, 0]) { if (out.length >= n) break; if (!out.includes(d)) out.push(d); }
  return out.slice(0, n);
}
const programsOf = aid => DB.programs.filter(p => p.athleteId === aid).sort((a, b) => b.createdAt - a.createdAt);
function activeProgram(aid, type = "main") { return programsOf(aid).find(p => p.type === type && p.status !== "reddedildi" && p.status !== "arşiv" && daysBetween(p.startDate, todayISO()) < p.weeks * 7) || null; }
function currentWeek(p, iso) { const d = daysBetween(p.startDate, iso || todayISO()); return d < 0 ? 0 : Math.floor(d / 7) + 1; }
const logKey = (pid, w, d) => pid + ":" + w + ":" + d;
const logOf = (pid, w, d) => DB.logs.find(l => l.key === logKey(pid, w, d));
function plannedSessions(aid, from, to) {
  const out = [];
  for (const p of programsOf(aid).filter(p => p.status === "onaylı")) for (const wk of p.weeksData) for (const s of wk.sessions) if (s.date >= from && s.date <= to) out.push({p, wk, s});
  return out.sort((x, y) => x.s.date < y.s.date ? -1 : 1);
}
function adherence(aid, from, to) {
  const pl = plannedSessions(aid, from, to).filter(x => x.s.date <= todayISO());
  const done = pl.filter(x => { const l = logOf(x.p.id, x.wk.w, x.s.d); return l && (l.status === "tamamlandı" || l.status === "kısmi"); }).length;
  return {planned: pl.length, done, pct: pl.length ? Math.round(done / pl.length * 100) : null};
}

/* ---------------- Yük takibi ---------------- */
function dailyLoads(aid, from, to) {
  const m = {};
  for (let d = from; d <= to; d = addDays(d, 1)) m[d] = {load: 0, min: 0, n: 0};
  for (const l of DB.logs.filter(l => l.athleteId === aid && l.date >= from && l.date <= to && isNum(l.load))) { m[l.date].load += l.load; m[l.date].min += l.duration || 0; m[l.date].n++; }
  for (const e of DB.extLoads.filter(e => e.athleteId === aid && e.date >= from && e.date <= to)) { m[e.date].load += e.load; m[e.date].min += e.duration || 0; m[e.date].n++; }
  return m;
}
function loadSummary(a, asOf) {
  asOf = asOf || todayISO();
  const from28 = addDays(asOf, -27), dl = dailyLoads(a.id, addDays(asOf, -7 * 8 + 1), asOf);
  const sumRange = (f, t) => Object.entries(dl).filter(([d]) => d >= f && d <= t).reduce((s, [, v]) => s + v.load, 0);
  const acute = sumRange(addDays(asOf, -6), asOf), chronic = sumRange(from28, asOf) / 4;
  const acwr = chronic > 0 ? acute / chronic : null;
  const last7 = Object.entries(dl).filter(([d]) => d >= addDays(asOf, -6)).map(([, v]) => v.load);
  const mono = sd(last7) > 0 ? mean(last7) / sd(last7) : null;
  const weeks = []; for (let i = 7; i >= 0; i--) { const e = addDays(asOf, -7 * i), s = addDays(e, -6); weeks.push({from: s, to: e, load: sumRange(s, e), min: Object.entries(dl).filter(([d]) => d >= s && d <= e).reduce((x, [, v]) => x + v.min, 0)}); }
  const prevWeek = weeks[weeks.length - 2].load, change = prevWeek > 0 ? (acute - prevWeek) / prevWeek * 100 : null;
  const recentLogs = DB.logs.filter(l => l.athleteId === a.id && daysBetween(l.date, asOf) <= 13 && daysBetween(l.date, asOf) >= 0);
  const sleeps = recentLogs.filter(l => isNum(l.sleep) && daysBetween(l.date, asOf) <= 6).map(l => l.sleep);
  const sleepAvg = sleeps.length ? mean(sleeps) : (num(a.sleepHours) || null);
  const pains = recentLogs.filter(l => l.painLevel > 0);
  const tired = recentLogs.filter(l => ["Yorgun", "Çok yorgun"].includes(l.readiness)).length;
  const age = ageAt(a.birthDate), hrsWeek = weeks[weeks.length - 1].min / 60;
  const flags = [];
  const sleepNeed = age < 13 ? 9 : 8;
  if (acwr != null && acwr > 1.5) flags.push({lv: "warn", t: `Son 7 günlük yük, 4 haftalık ortalamanın ${fmtN(acwr, 2)} katı. Ani yük artışı — antrenör değerlendirmesi önerilir.`});
  if (acwr != null && acwr < 0.6 && chronic > 0) flags.push({lv: "info", t: "Son hafta yükü belirgin düşük; dönüşte yükü kademeli artırın."});
  if (change != null && change > 30 && prevWeek > 200) flags.push({lv: "warn", t: `Haftalık yük bir önceki haftaya göre %${Math.round(change)} arttı.`});
  if (mono != null && mono > 2) flags.push({lv: "warn", t: `Monotoni yüksek (${fmtN(mono, 1)}): günler arası yük çeşitliliği azaltılmış; hafif/zor gün dengesi önerilir.`});
  if (sleepAvg != null && sleepAvg < sleepNeed) flags.push({lv: "warn", t: `Ortalama uyku ${fmtN(sleepAvg, 1)} sa — yaş grubu önerisi en az ${sleepNeed} sa (AASM).`});
  if (pains.length >= 2) flags.push({lv: "bad", t: `Son 14 günde ${pains.length} ağrı bildirimi. Antrenör ve gerekirse sağlık uzmanı değerlendirmesi önerilir.`});
  if (tired >= 3) flags.push({lv: "warn", t: `Son 14 günde ${tired} kez yorgun/çok yorgun hazır oluş bildirimi.`});
  if (isNum(age) && hrsWeek > age) flags.push({lv: "warn", t: `Son 7 günde ${fmtN(hrsWeek, 1)} saat organize spor — yaştan (${Math.floor(age)}) fazla.`});
  return {acute, chronic, acwr, mono, strain: mono != null ? acute * mono : null, weeks, change, sleepAvg, sleepNeed, pains, tired, hrsWeek, flags};
}

/* ---------------- Eğilim (uzun vadeli) ---------------- */
function trend(points) {
  const p = points.filter(x => isNum(x.y)).sort((a, b) => a.x < b.x ? -1 : 1);
  if (p.length < 3) return {insufficient: true, why: `En az 3 ölçüm gerekir (mevcut: ${p.length}).`};
  const span = daysBetween(p[0].x, p[p.length - 1].x);
  if (span < 90) return {insufficient: true, why: `Ölçümler en az 3 aya yayılmalı (mevcut: ${span} gün).`};
  const xs = p.map(q => daysBetween(p[0].x, q.x)), ys = p.map(q => q.y), mx = mean(xs), my = mean(ys);
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0), sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const b = sxx ? sxy / sxx : 0, a0 = my - b * mx;
  const res = ys.map((y, i) => y - (a0 + b * xs[i])), ssr = res.reduce((s, r) => s + r * r, 0), sst = ys.reduce((s, y) => s + (y - my) ** 2, 0);
  return {n: p.length, span, slope30: b * 30, r2: sst ? 1 - ssr / sst : 0, rsd: Math.sqrt(ssr / Math.max(1, p.length - 2)), a0, b, x0: p[0].x, last: p[p.length - 1]};
}
function trendText(name, t, lb, unit) {
  if (t.insufficient) return `${name}: tahmin için yeterli veri bulunmuyor. ${t.why}`;
  const dir = t.slope30 === 0 ? 0 : (lb ? -t.slope30 : t.slope30) > 0 ? 1 : -1;
  const months = Math.round(t.span / 30);
  const strength = t.r2 >= 0.6 ? "tutarlı" : t.r2 >= 0.3 ? "orta düzeyde tutarlı" : "zayıf/değişken";
  if (dir > 0) return `Son ${months} aylık verilere göre ${name.toLocaleLowerCase("tr-TR")} performansında olumlu gelişim eğilimi görülmektedir (≈${fmtN(Math.abs(t.slope30), 2)} ${unit}/ay; eğilim ${strength}, R²=${fmtN(t.r2, 2)}).`;
  if (dir < 0) return `Son ${months} aylık verilerde ${name.toLocaleLowerCase("tr-TR")} için olumsuz yönde bir eğilim var (≈${fmtN(Math.abs(t.slope30), 2)} ${unit}/ay; ${strength}). Test koşulları, yorgunluk ve büyüme etkisi gözden geçirilmeli.`;
  return `${name}: belirgin bir değişim eğilimi yok.`;
}

/* ---------------- Ek gelişim tespiti ---------------- */
function detectNeeds(a) {
  const needs = [], qs = qualityScores(a), sp = sportById(a.primarySport) || null, ctx = buildCtx(a, {eq: Object.keys(EQUIP), space: true, sport: a.primarySport});
  const imp = q => { if (!sp) return "Ana branş seçilmediği için branş önemi hesaplanamadı."; const w = sp.w[q] || 0; const tot = Object.values(sp.w).reduce((x, y) => x + y, 0); const p = Math.round(w / tot * 100); return `${sp.n} uygunluk modelinde ${QN[q] || q} ağırlığı %${p} — ${p >= 14 ? "yüksek" : p >= 8 ? "orta" : "düşük"} önem.`; };
  const filt = ids => ids.filter(id => allowedEx(exById(id), ctx)).slice(0, 3);
  for (const q of QUALITIES) {
    const s = qs[q.k]; if (!isNum(s.score) || s.score >= 40) continue;
    const w = QWEAK[q.k];
    needs.push({key: "q_" + q.k, q: q.k, t: w.t, basis: `Test puanı ${s.score}/100 (${s.items.map(i => i.n).join(", ")}; yaş ve cinsiyete göre yaklaşık referans).`, imp: imp(q.k), ex: filt(w.ex), freq: "Haftada 2–3 kez, ısınma/aktivasyon veya koordinasyon-denge bloğunda (10–12 dk)", target: `Bir sonraki değerlendirmede ${QN[q.k]} puanında tipik ölçüm hatasını aşan gelişim (hedef ≥ ${Math.min(95, s.score + 10)}).`, retest: "4–6 hafta sonra"});
  }
  for (const t of TESTS.filter(t => t.bil)) {
    const rs = testsOf(a.id, t.id); if (!rs.length) continue; const r = rs[rs.length - 1]; const as = asym(t, r);
    if (as && as.flag) needs.push({key: "asym_" + t.id, q: t.q, t: "Sağ-sol farkı (" + t.n + ")", basis: `Son ölçüm (${fmtD(r.date)}): Sol ${fmtN(r.left, t.dec)} / Sağ ${fmtN(r.right, t.dec)} ${t.u} — ${as.txt}.`, imp: "Tek taraflı farklar yön değiştirme ve iniş kalitesini etkileyebilir; tek başına sakatlık göstergesi değildir.", ex: filt(t.q === "mob" ? ["m3", "m1", "m6"] : t.q === "bal" ? ["b1", "b2", "st8"] : ["st3", "st8", "p8", "st6"]), freq: "Haftada 2–3 kez; zayıf tarafla başla, eşit tekrar", target: "Asimetrinin %10'un (veya ölçüm hatasının) altına inmesi.", retest: "6 hafta sonra"});
  }
  const gv = growthVelocity(a.id);
  if (gv && gv.rapid) needs.push({key: "growth", q: "bal", t: "Büyüme atağı: hareket kontrolü", basis: `Büyüme hızı ${fmtN(gv.v, 1)} cm/yıl (${fmtD(gv.from)}–${fmtD(gv.to)}).`, imp: "Büyüme atağında koordinasyon geçici bozulabilir; iniş ve sprint mekaniği önceliklidir.", ex: filt(["v1", "b2", "m3", "a1"]), freq: "Her seansın ısınmasında", target: "İniş ve squat tekniğinde video ile doğrulanan kontrol.", retest: "8 hafta sonra büyüme ölçümü"});
  const vids = DB.videos.filter(v => v.athleteId === a.id).sort((x, y) => y.date < x.date ? -1 : 1);
  const flagSet = new Set(); vids.slice(0, 5).forEach(v => (v.report && v.report.flags || []).forEach(f => flagSet.add(f)));
  if (flagSet.has("landing")) needs.push({key: "vid_landing", q: "bal", t: "İniş mekaniği problemleri", basis: "Video analizinde diz hizası / sert iniş bulgusu.", imp: "İniş kontrolü sıçrama içeren branşlarda (basketbol, voleybol, hentbol) önceliklidir.", ex: filt(["v1", "p3", "a2", "b2"]), freq: "Haftada 3 kez ısınmada", target: "Yeni videoda FPPA <10° ve yumuşak iniş.", retest: "4 hafta sonra video"});
  if (flagSet.has("sprint")) needs.push({key: "vid_sprint", q: "spd", t: "Sprint tekniği eksikliği", basis: "Video analizinde sprint mekaniği bulgusu.", imp: "Sprint mekaniği hızlanma ve maksimal süratin temelidir.", ex: filt(["s1", "s2", "s3", "s5"]), freq: "Haftada 2 kez sürat bölümünden önce", target: "Videoda hızlanma gövde açısı ve kalça altı temas.", retest: "4–6 hafta sonra video + 10 m"});
  if (flagSet.has("trunk")) needs.push({key: "vid_trunk", q: "str", t: "Gövde kontrolü eksikliği", basis: "Video analizinde gövde/kalça kontrol bulgusu.", imp: "Gövde stabilitesi kuvvet aktarımı ve denge için temeldir.", ex: filt(["a3", "a4", "st18", "a6"]), freq: "Haftada 3 kez aktivasyonda", target: "Tek ayak duruşta kalça düşmesi <5°.", retest: "4–6 hafta sonra"});
  return needs;
}

/* ---------------- Optimizasyon önerileri ---------------- */
function optimize(a, p) {
  const out = [], cw = currentWeek(p), qs = qualityScores(a), prev = qualityScores(a, "previous");
  const start = p.startDate;
  for (const t of TESTS) {
    const rs = testsOf(a.id, t.id); if (rs.length < 2) continue;
    const base = [...rs].reverse().find(r => r.date <= start) || rs[0], last = rs[rs.length - 1];
    if (base === last) continue;
    const c = compareResults(t, base, last); if (!c) continue;
    if (c.ratio < 1 && daysBetween(base.date, last.date) >= 42 && p.sport && sportById(p.sport).focus.slice(0, 4).includes(t.q))
      out.push({id: "stag_" + t.id, kind: "warn", title: `${t.n}: gelişim yavaş`, why: `${fmtD(base.date)} → ${fmtD(last.date)}: ${fmtN(c.v1, t.dec)} → ${fmtN(c.v2, t.dec)} ${t.u}; değişim ölçüm hatası içinde. Bu özellik branş önceliklerinden.`, action: {type: "focus", q: t.q}, label: `Kalan haftalarda ${QN[t.q]} vurgusunu artır`});
    else if (c.cls === "ok") out.push({id: "imp_" + t.id, kind: "ok", title: `${t.n}: gelişim`, why: `${fmtN(c.v1, t.dec)} → ${fmtN(c.v2, t.dec)} ${t.u} (${c.pct != null ? (c.pct > 0 ? "+" : "") + fmtN(c.pct, 1) + "%" : ""}). ${c.verdict}. ${c.growthNote}`, action: {type: "none"}});
  }
  const ad = adherence(a.id, p.startDate, todayISO());
  if (ad.pct != null && ad.planned >= 4 && ad.pct < 70) out.push({id: "adh", kind: "warn", title: `Devamlılık %${ad.pct}`, why: `${ad.planned} planlı seansın ${ad.done}'i tamamlandı. Seans sayısı/süresi ailenin takvimine göre azaltılabilir.`, action: {type: "scale", factor: 0.85}, label: "Kalan haftalarda hacmi %15 azalt"});
  const ls = loadSummary(a);
  if (ls.acwr != null && ls.acwr > 1.5) out.push({id: "acwr", kind: "bad", title: "Ani yük artışı", why: `Akut:kronik oran ${fmtN(ls.acwr, 2)}. Bu oran tek başına sakatlık öngörmez; ancak yük artışı kademeli olmalıdır.`, action: {type: "scale", factor: 0.8}, label: "Kalan haftalarda hacmi %20 azalt"});
  const recent = DB.logs.filter(l => l.athleteId === a.id && daysBetween(l.date, todayISO()) <= 14);
  const rpes = recent.filter(l => isNum(l.rpe)).map(l => l.rpe);
  if (rpes.length >= 3 && mean(rpes) >= 8) out.push({id: "rpe", kind: "warn", title: "Algılanan zorluk yüksek", why: `Son 14 gün ortalama RPE ${fmtN(mean(rpes), 1)}. Gençlerde hedef çoğu seans için 5–7.`, action: {type: "scale", factor: 0.85}, label: "Hacmi %15 azalt"});
  if (rpes.length >= 4 && mean(rpes) <= 4 && recent.filter(l => ["Yorgun", "Çok yorgun"].includes(l.readiness)).length === 0) out.push({id: "rpelow", kind: "info", title: "Seanslar kolay algılanıyor", why: `Ortalama RPE ${fmtN(mean(rpes), 1)} ve yorgunluk bildirimi yok. Antrenör onayıyla kademeli ilerleme yapılabilir.`, action: {type: "scale", factor: 1.1}, label: "Hacmi %10 artır"});
  if (ls.pains.length >= 2) out.push({id: "pain", kind: "bad", title: "Tekrarlayan ağrı bildirimi", why: "Son 14 günde birden fazla ağrı bildirimi var. Program değişikliğinden önce sağlık uzmanı değerlendirmesi önerilir. Uygulama teşhis koymaz.", action: {type: "none"}});
  const lastTest = testsOf(a.id).slice(-1)[0];
  if (!lastTest || daysBetween(lastTest.date, todayISO()) > 42) out.push({id: "retest", kind: "info", title: "Yeniden test zamanı", why: lastTest ? `Son test ${fmtD(lastTest.date)} tarihinde (${daysBetween(lastTest.date, todayISO())} gün önce).` : "Henüz test sonucu yok.", action: {type: "retest"}, label: "Gelecek haftaya test planla"});
  (a.goals || []).filter(g => !g.done && g.testId).forEach(g => {
    const t = TEST[g.testId], rs = testsOf(a.id, g.testId); if (!t || !rs.length) return; const v = testValue(rs[rs.length - 1]);
    if (t.lb ? v <= g.target : v >= g.target) out.push({id: "goal_" + g.id, kind: "ok", title: "Hedefe ulaşıldı: " + g.text, why: `Son değer ${fmtN(v, t.dec)} ${t.u}. Yeni hedef belirlenmeli.`, action: {type: "goals"}, label: "Hedefi tamamlandı işaretle"});
  });
  for (const n of detectNeeds(a).filter(n => n.key.startsWith("vid_"))) out.push({id: n.key, kind: "info", title: "Teknik gelişim: " + n.t, why: n.basis, action: {type: "none"}});
  if (!out.length) out.push({id: "none", kind: "info", title: "Belirgin değişiklik önerisi yok", why: "Mevcut veriler programın sürdürülmesini destekliyor. Yeni test ve antrenman kayıtları ile öneriler güncellenir.", action: {type: "none"}});
  return {items: out, cw, qs, prev};
}
function applyOptimization(a, p, s) {
  const cw = Math.max(1, currentWeek(p));
  let what = "";
  if (s.action.type === "scale") {
    p.weeksData.filter(w => w.w > cw).forEach(w => w.sessions.forEach(ss => ss.blocks.forEach(b => b.items.forEach(it => { if (!["warm", "mob", "cool"].includes(b.k)) it.s = Math.max(1, Math.round(it.s * s.action.factor)); }))));
    what = `Hafta ${cw + 1}+ set sayıları ×${s.action.factor}`;
  } else if (s.action.type === "focus") {
    const r = generateProgram(a, {sport: p.sport, pos: p.pos, weeks: p.weeks, spw: p.spw, minutes: p.minutes, env: p.env, eq: p.eq, space: p.space, days: p.days, startDate: p.startDate, seasonAware: p.seasonAware, testInterval: p.testInterval, includeExtra: p.includeExtra, focusQ: s.action.q, type: p.type, seed: "opt" + Date.now()});
    if (!r.ok) { toast("Program güncellenemedi: " + r.hold[0]); return false; }
    p.weeksData = p.weeksData.filter(w => w.w <= cw).concat(r.program.weeksData.filter(w => w.w > cw));
    what = `Hafta ${cw + 1}+ ${QN[s.action.q]} vurgusu artırıldı`;
  } else if (s.action.type === "retest") {
    const nw = Math.min(p.weeks, cw + 1); if (!p.testWeeks.includes(nw)) p.testWeeks.push(nw); p.testWeeks.sort((x, y) => x - y);
    const wk = p.weeksData.find(w => w.w === nw); if (wk && wk.sessions[0]) { wk.sessions[0].test = true; wk.notes.push("Ara değerlendirme eklendi (optimizasyon önerisi)."); }
    what = `Hafta ${nw} test haftası olarak planlandı`;
  } else if (s.action.type === "goals") {
    const g = (a.goals || []).find(g => "goal_" + g.id === s.id); if (g) g.done = true; what = "Hedef tamamlandı işaretlendi";
  } else return false;
  p.changes.push({at: Date.now(), by: myName(), what: "Öneri uygulandı: " + what, reason: s.title});
  saveAth(a.id, "coach"); return true;
}

/* ---------------- Video analizi kuralları ---------------- */
const MOVES = {
  sprint: {n: "Sprint (hızlanma)", view: "side", obs: [["Aşırı öne uzanarak basma (overstriding)", "sprint", ["s1", "s3"]], ["Gövde geride / erken dikleşme", "sprint", ["s1", "s5"]], ["Kollar gövdeyi çaprazlıyor", "sprint", ["s2"]], ["Diz çekişi yetersiz", "sprint", ["s1", "s2"]]]},
  run: {n: "Koşu", view: "side", obs: [["Topukla sert temas", "sprint", ["s2", "a7"]], ["Gövde aşırı geride", "sprint", ["s1"]], ["Kol hareketi asimetrik", "sprint", ["s2"]], ["Kalça düşmesi", "trunk", ["a2", "a6"]]]},
  jump: {n: "Sıçrama", view: "front", obs: [["Diz içe kaçıyor (valgus)", "landing", ["v1", "a2"]], ["Kol savuruşu uyumsuz", null, ["p4"]], ["Asimetrik kalkış", "landing", ["p8"]], ["Gövde aşırı öne", "trunk", ["p3"]]]},
  landing: {n: "İniş", view: "front", obs: [["Diz içe kaçıyor (valgus)", "landing", ["v1", "a2", "b2"]], ["Sert / sesli iniş", "landing", ["v1", "p3"]], ["Düz bacakla iniş", "landing", ["v1"]], ["Asimetrik iniş", "landing", ["p8", "st3"]]]},
  sls: {n: "Tek ayak denge", view: "front", obs: [["Kalça düşüyor", "trunk", ["a2", "a6"]], ["Gövde yana eğiliyor", "trunk", ["a6", "st18"]], ["Diz içe kaçıyor", "landing", ["b2", "a2"]], ["Ayak bileği salınımı fazla", null, ["b1", "st17"]]]},
  squat: {n: "Squat", view: "side", obs: [["Dizler içe kaçıyor", "landing", ["a2", "st1"]], ["Topuklar kalkıyor", null, ["m3", "st1"]], ["Bel yuvarlanıyor", "trunk", ["m1", "st1"]], ["Ağırlık tek tarafa kayıyor", null, ["st3"]]]},
  lunge: {n: "Hamle (lunge)", view: "front", obs: [["Ön diz içe kaçıyor", "landing", ["st3", "a2"]], ["Gövde öne düşüyor", "trunk", ["st3", "a3"]], ["Ön topuk kalkıyor", null, ["m3"]], ["Denge kaybı", null, ["b2"]]]},
  pushup: {n: "Şınav", view: "side", obs: [["Kalça düşüyor", "trunk", ["st19", "a3"]], ["Kalça yukarıda", "trunk", ["st19"]], ["Dirsekler çok açık", null, ["v4"]], ["Eksik hareket açıklığı", null, ["st12"]]]},
  strength: {n: "Temel kuvvet egzersizi", view: "side", obs: [["Nötral omurga korunamıyor", "trunk", ["a3", "st7"]], ["Tempo kontrolsüz", null, []], ["Asimetri", null, ["st3"]]]},
  sport: {n: "Branşa özgü hareket", view: "side", obs: [["Teknik tutarsızlık", null, []], ["Denge kaybı", null, ["b3"]], ["Asimetri", null, ["st3"]]]}
};
const MTYPES = {
  knee: {n: "Diz açısı", pts: 3, hint: "Kalça → Diz → Ayak bileği", view: "side"},
  hip: {n: "Kalça açısı", pts: 3, hint: "Omuz → Kalça → Diz", view: "side"},
  elbow: {n: "Dirsek açısı", pts: 3, hint: "Omuz → Dirsek → El bileği", view: "side"},
  body: {n: "Vücut çizgisi", pts: 3, hint: "Omuz → Kalça → Ayak bileği", view: "side"},
  fppa: {n: "Diz frontal sapma (FPPA)", pts: 3, hint: "Kalça → Diz → Ayak bileği (önden)", view: "front"},
  trunk: {n: "Gövde eğimi (dikeye göre)", pts: 2, hint: "Kalça → Omuz", view: "side"},
  shin: {n: "Kaval kemiği açısı (dikeye göre)", pts: 2, hint: "Ayak bileği → Diz", view: "side"},
  pelvis: {n: "Pelvis eğimi (yataya göre)", pts: 2, hint: "Sol kalça → Sağ kalça (önden/arkadan)", view: "front"}
};
function angle3(p, W, H) { const [a, b, c] = p.map(q => [q[0] * W, q[1] * H]); const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]]; const d = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1); return Math.acos(clamp(d, -1, 1)) * 180 / Math.PI; }
function angleVert(p, W, H) { const dx = (p[1][0] - p[0][0]) * W, dy = (p[1][1] - p[0][1]) * H; return Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI; }
function angleHoriz(p, W, H) { const dx = (p[1][0] - p[0][0]) * W, dy = (p[1][1] - p[0][1]) * H; return Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI; }
function measureValue(type, pts, W, H) {
  if (type === "fppa") return 180 - angle3(pts, W, H);
  if (MTYPES[type].pts === 3) return angle3(pts, W, H);
  if (type === "pelvis") return angleHoriz(pts, W, H);
  return angleVert(pts, W, H);
}
function videoReport(v) {
  const mv = MOVES[v.movement] || MOVES.sport, pos = [], imp = [], params = [], drills = new Set(), flags = new Set(), reshoot = [];
  const q = v.quality || {}; const qn = ["full", "stable", "height", "light", "fps", "clothes"].filter(k => q[k]).length;
  const rel = qn >= 6 ? "İyi" : qn >= 4 ? "Orta" : "Düşük";
  if (rel === "Düşük") reshoot.push("Çekim koşulları yetersiz: kamerayı sabitleyin, tüm vücut kadrajda olsun, kamera kalça hizasında ve hareket düzlemine dik olsun.");
  if (!q.fps && (v.movement === "sprint" || v.movement === "run")) reshoot.push("Sprint/koşu için en az 60 fps (ağır çekim) önerilir.");
  const ms = v.measures || [];
  for (const m of ms) {
    const mt = MTYPES[m.type]; const okView = mt.view === v.view || (mt.view === "front" && v.view === "back");
    params.push({n: mt.n + (m.side && m.side !== "-" ? " (" + (m.side === "L" ? "Sol" : "Sağ") + ")" : ""), v: round(m.value, 1), t: m.t, src: m.src || "manuel", reliable: okView && rel !== "Düşük", note: okView ? "" : `Bu ölçüm ${mt.view === "front" ? "önden/arkadan" : "yandan"} çekim gerektirir.`});
    if (!okView) { reshoot.push(`${mt.n} için ${mt.view === "front" ? "önden veya arkadan" : "yandan"} çekim yapın.`); continue; }
    if (m.type === "fppa") { if (m.value > 10) { imp.push(`${mt.n} ${fmtN(m.value, 0)}° — dizde frontal düzlem sapması belirgin (>10°).`); flags.add("landing"); ["v1", "a2", "b2"].forEach(x => drills.add(x)); } else if (m.value <= 7) pos.push(`Diz hizası iyi (FPPA ${fmtN(m.value, 0)}°).`); }
    if (m.type === "knee") {
      if (v.movement === "squat" || v.movement === "lunge") { if (m.value <= 100) pos.push(`Yeterli hareket derinliği (diz ${fmtN(m.value, 0)}°).`); else if (m.value > 120) { imp.push(`Squat/hamle derinliği sınırlı (diz ${fmtN(m.value, 0)}°).`); ["m3", "st1"].forEach(x => drills.add(x)); } }
      if (v.movement === "landing" || v.movement === "jump") { if (m.value > 120) { imp.push(`İnişte diz bükülmesi az (diz ${fmtN(m.value, 0)}° — sert iniş eğilimi).`); flags.add("landing"); drills.add("v1"); } else pos.push(`İnişte yeterli diz bükülmesi (${fmtN(m.value, 0)}°).`); }
    }
    if (m.type === "trunk") {
      if (v.movement === "sprint") { if (m.value >= 30 && m.value <= 60) pos.push(`Hızlanma gövde açısı uygun (${fmtN(m.value, 0)}°).`); else { imp.push(`Hızlanmada gövde açısı ${fmtN(m.value, 0)}° — ilk adımlarda yaklaşık 40–55° hedeflenir.`); flags.add("sprint"); ["s1", "s5"].forEach(x => drills.add(x)); } }
      else if (v.movement === "run") { if (m.value <= 15) pos.push(`Koşuda dik ve dengeli gövde (${fmtN(m.value, 0)}°).`); else imp.push(`Koşuda gövde eğimi fazla (${fmtN(m.value, 0)}°).`); }
      else if (v.movement === "squat" && m.value > 50) { imp.push(`Squatta gövde öne aşırı eğik (${fmtN(m.value, 0)}°).`); flags.add("trunk"); ["m3", "a3"].forEach(x => drills.add(x)); }
      else if (v.movement === "landing" && m.value > 45) { imp.push(`İnişte gövde öne aşırı eğik (${fmtN(m.value, 0)}°).`); flags.add("trunk"); }
    }
    if (m.type === "pelvis") { if (m.value > 5) { imp.push(`Pelvis eğimi ${fmtN(m.value, 0)}° — tek ayakta kalça kontrolü geliştirilmeli.`); flags.add("trunk"); ["a2", "a6"].forEach(x => drills.add(x)); } else pos.push(`Pelvis kontrolü iyi (${fmtN(m.value, 0)}°).`); }
    if (m.type === "body") { if (m.value < 165) { imp.push(`Vücut çizgisi ${fmtN(m.value, 0)}° — gövde kontrolü (kalça düşmesi/yükselmesi).`); flags.add("trunk"); drills.add("st19"); } else pos.push(`Vücut çizgisi düz (${fmtN(m.value, 0)}°).`); }
    if (m.type === "shin" && v.movement === "sprint") { if (m.value >= 20) pos.push(`İlk adımlarda kaval kemiği öne eğik (${fmtN(m.value, 0)}°) — etkin itiş açısı.`); }
  }
  const byType = {};
  ms.filter(m => m.side === "L" || m.side === "R").forEach(m => { (byType[m.type] = byType[m.type] || {})[m.side] = m.value; });
  for (const k in byType) { const o = byType[k]; if (isNum(o.L) && isNum(o.R)) { const d = Math.abs(o.L - o.R); params.push({n: MTYPES[k].n + " sağ-sol farkı", v: round(d, 1), reliable: true, note: ""}); if (d > 10) { imp.push(`${MTYPES[k].n}: sağ-sol farkı ${fmtN(d, 0)}°.`); ["st3", "p8"].forEach(x => drills.add(x)); } else pos.push(`${MTYPES[k].n}: sağ-sol simetrisi kabul edilebilir (${fmtN(d, 0)}° fark).`); } }
  for (const [txt, flag, dr] of mv.obs) { if ((v.obs || []).includes(txt)) { imp.push(txt + " (antrenör gözlemi)."); if (flag) flags.add(flag); dr.forEach(x => drills.add(x)); } }
  if (!(v.obs || []).length && ms.length) pos.push("Antrenör gözlem listesinde belirgin teknik hata işaretlenmedi.");
  if (!ms.length) reshoot.push("Hiç ölçüm yapılmadı: işaretleme aracıyla en az bir açı ölçün veya otomatik iskelet tespitini deneyin.");
  return {observed: mv.n + " — " + ({side: "yandan", front: "önden", back: "arkadan"}[v.view] || "") + " çekim", positives: pos, improve: imp, params, drills: [...drills].filter(id => exById(id)), reshoot: [...new Set(reshoot)], reliability: rel, flags: [...flags],
    disclaimer: "2B video ölçümleri kamera açısı, perspektif ve işaretleme hatasından etkilenir (tipik hata birkaç derece). Bu rapor sakatlık teşhisi veya eklem hasarı tahmini içermez."};
}

