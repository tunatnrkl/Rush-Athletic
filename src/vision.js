/* =========================================================================
   GÖRSEL YAPAY ZEKÂ — videodan hareket yorumu
   1) MediaPipe Pose (Google, cihaz üzerinde çalışan sinir ağı) videonun her karesinde 33 vücut noktası bulur.
   2) Bu noktalardan eklem açıları, hizalar, tekrarlar, uçuş süresi vb. hesaplanır.
   3) Harekete özel kurallar (NSCA / iniş-squat-sprint literatürü) ile Türkçe yorum, puan ve öneri üretilir.
   Video cihazdan çıkmaz; yalnızca analiz sonucu kaydedilir.
   ========================================================================= */
const MP_VER = "0.10.14";
const MP_CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`;
const MP_MODEL_CDN = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const VTYPES = {
  squat: {n: "Squat (çömelme)", view: "side", tip: "Yandan çekin, kamera kalça hizasında. 3–5 tekrar yapın."},
  lunge: {n: "Hamle (lunge / split squat)", view: "side", tip: "Yandan çekin. Her bacakla 3 tekrar."},
  jump: {n: "Sıçrama ve iniş", view: "front", tip: "Önden çekin, ayaklar ve baş kadrajda. 2–3 sıçrama, aralarda dur."},
  sprint: {n: "Sprint / koşu tekniği", view: "side", tip: "Yandan, 5–10 m uzaktan sabit çekin; mümkünse ağır çekim (60 fps)."},
  balance: {n: "Tek ayak denge", view: "front", tip: "Önden çekin. 10–20 sn tek ayakta durun."},
  pushup: {n: "Şınav", view: "side", tip: "Yandan, yere yakın çekin. 3–5 tekrar."},
  plank: {n: "Plank (ön destek)", view: "side", tip: "Yandan, yere yakın çekin. 15–30 sn tutun."},
  hinge: {n: "Kalça menteşe (RDL / swing)", view: "side", tip: "Yandan çekin. 3–5 tekrar."},
  generic: {n: "Diğer hareket", view: "side", tip: "Tüm vücut kadrajda olacak şekilde sabit çekin."}
};
/* Egzersiz → analiz türü (uygulamadaki egzersizlerin çoğu video ile kontrol edilebilir) */
const EX_VTYPE = {st1: "squat", st2: "squat", st11: "squat", b4: "squat", d4: "squat", st3: "lunge", st4: "lunge", st5: "lunge", m8: "lunge", st6: "lunge", v13: "lunge",
  p3: "jump", p4: "jump", p5: "jump", p6: "jump", p7: "jump", p8: "jump", p9: "jump", p10: "jump", v1: "jump", v7: "jump", a7: "jump", p2: "jump", w2: "jump", w3: "jump", k3: "jump", p14: "sprint",
  s1: "sprint", s2: "sprint", s3: "sprint", s4: "sprint", s5: "sprint", s6: "sprint", s7: "sprint", s8: "sprint", s9: "sprint", s10: "sprint", k6: "sprint", d1: "sprint", d5: "sprint", w1: "sprint", v6: "sprint",
  b1: "balance", b2: "balance", b3: "balance", st8: "balance", st12: "pushup", v4: "pushup", st19: "plank", a6: "plank", v8: "plank", v11: "plank", st21: "plank", st7: "hinge", st9: "hinge", st10: "hinge", a1: "hinge"};
const vtypeOfEx = id => EX_VTYPE[id] || null;

/* ---------------- Model yükleme ---------------- */
let POSE = null, TS_BASE = 1;
function simdSupported() { try { return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])); } catch (e) { return false; } }
async function loadPose() {
  if (POSE) return POSE;
  const local = new URL("vendor/mediapipe/", location.href).href, simd = simdSupported();
  let vision, base, model;
  try { vision = await import(local + "vision_bundle.mjs"); base = simd ? local + "wasm" : MP_CDN + "/wasm"; model = local + "pose_landmarker_lite.task"; }
  catch (e) { vision = await import(MP_CDN + "/vision_bundle.mjs"); base = MP_CDN + "/wasm"; model = MP_MODEL_CDN; }
  const files = await vision.FilesetResolver.forVisionTasks(base);
  const mk = delegate => vision.PoseLandmarker.createFromOptions(files, {baseOptions: {modelAssetPath: model, delegate}, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5});
  try { POSE = await mk("GPU"); } catch (e) { POSE = await mk("CPU"); }
  return POSE;
}
function seekTo(v, t) {
  return new Promise(res => {
    if (Math.abs(v.currentTime - t) < 0.001 && v.readyState >= 2) return res();
    const done = () => { clearTimeout(to); v.removeEventListener("seeked", done); res(); };
    const to = setTimeout(done, 2000); v.addEventListener("seeked", done); v.currentTime = t;
  });
}
/* Videodaki tüm kareleri işler → poz serisi */
async function extractPose(video, type, onProgress) {
  const pl = await loadPose();
  try { await video.play(); } catch (e) {} video.pause();
  const fast = type === "jump" || type === "sprint";
  const fps = fast ? 30 : 15, maxSec = fast ? 10 : 20, dur = Math.min(video.duration || 0, maxSec);
  if (!dur) throw new Error("Video okunamadı.");
  const frames = [], n = Math.floor(dur * fps);
  for (let i = 0; i <= n; i++) {
    const t = Math.min(dur - 0.001, i / fps);
    await seekTo(video, t);
    let r = null; try { r = pl.detectForVideo(video, TS_BASE + Math.round(t * 1000)); } catch (e) { r = null; }
    const lm = r && r.landmarks && r.landmarks[0];
    frames.push({t, lm: lm ? lm.map(p => ({x: p.x, y: p.y, v: p.visibility == null ? 1 : p.visibility})) : null});
    if (onProgress && i % 3 === 0) onProgress(i / n);
  }
  TS_BASE += Math.round(dur * 1000) + 1000;
  return {frames, W: video.videoWidth, H: video.videoHeight, fps, dur};
}

/* ---------------- Geometri ---------------- */
const J = {nose: 0, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16, lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28, lHeel: 29, rHeel: 30, lToe: 31, rToe: 32};
const P2 = (f, i, W, H) => [f.lm[i].x * W, f.lm[i].y * H];
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function ang(a, b, c) { const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]]; const d = (v1[0] * v2[0] + v1[1] * v2[1]) / ((Math.hypot(...v1) * Math.hypot(...v2)) || 1); return Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI; }
const fromVert = (a, b) => Math.atan2(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * 180 / Math.PI;
const fromHoriz = (a, b) => Math.atan2(Math.abs(b[1] - a[1]), Math.abs(b[0] - a[0])) * 180 / Math.PI;
function features(f, W, H) {
  if (!f.lm) return null;
  const p = i => P2(f, i, W, H), vis = i => f.lm[i].v;
  const lHip = p(J.lHip), rHip = p(J.rHip), lKn = p(J.lKn), rKn = p(J.rKn), lAn = p(J.lAn), rAn = p(J.rAn), lSh = p(J.lSh), rSh = p(J.rSh);
  const mHip = mid(lHip, rHip), mSh = mid(lSh, rSh), mAn = mid(lAn, rAn);
  const leg = (dist(lHip, lKn) + dist(lKn, lAn) + dist(rHip, rKn) + dist(rKn, rAn)) / 2;
  const torso = dist(mSh, mHip) || 1;
  const kneeL = ang(lHip, lKn, lAn), kneeR = ang(rHip, rKn, rAn);
  const ankSep = Math.abs(lAn[0] - rAn[0]), knSep = Math.abs(lKn[0] - rKn[0]);
  return {t: f.t, kneeL, kneeR, kneeMin: Math.min(kneeL, kneeR), hipL: ang(lSh, lHip, lKn), hipR: ang(rSh, rHip, rKn), elbowL: ang(lSh, p(J.lEl), p(J.lWr)), elbowR: ang(rSh, p(J.rEl), p(J.rWr)),
    trunk: fromVert(mHip, mSh), trunkLat: (mSh[0] - mHip[0]) / torso, pelvis: fromHoriz(lHip, rHip), body: ang(mSh, mHip, mAn), fppaL: 180 - kneeL, fppaR: 180 - kneeR,
    kasr: ankSep > leg * 0.05 ? knSep / ankSep : null, swRatio: Math.abs(lSh[0] - rSh[0]) / torso, leg, hipX: mHip[0] / (leg || 1), hipY: mHip[1] / (leg || 1),
    ankY: mAn[1], lAnY: lAn[1], rAnY: rAn[1], lAnX: lAn[0], rAnX: rAn[0], hipXpx: mHip[0], hipYpx: mHip[1],
    heelL: (p(J.lToe)[1] - p(J.lHeel)[1]) / (leg || 1), heelR: (p(J.rToe)[1] - p(J.rHeel)[1]) / (leg || 1),
    wristUp: Math.min(p(J.lWr)[1], p(J.rWr)[1]) < mSh[1], noseVis: vis(J.nose), legVis: Math.min(vis(J.lKn), vis(J.rKn), vis(J.lAn), vis(J.rAn)), vis: mean([J.lSh, J.rSh, J.lHip, J.rHip, J.lKn, J.rKn, J.lAn, J.rAn].map(vis))};
}
const smooth = (arr, k = 1) => arr.map((_, i) => { const w = arr.slice(Math.max(0, i - k), i + k + 1).filter(isNum); return w.length ? mean(w) : null; });
const pct = (arr, q) => { const s = arr.filter(isNum).sort((a, b) => a - b); if (!s.length) return null; return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]; };
const r0 = v => Math.round(v), r1 = v => Math.round(v * 10) / 10;
/* Tekrar sayımı: değer "dinlenme" seviyesinden belirgin düşüp geri dönünce bir tekrar */
function reps(series, drop = 25, back = 12) {
  const top = pct(series, 0.9); if (!isNum(top)) return [];
  const out = []; let cur = null;
  series.forEach((v, i) => {
    if (!isNum(v)) return;
    if (!cur && v < top - drop) cur = {start: i, min: v, minI: i};
    else if (cur) { if (v < cur.min) { cur.min = v; cur.minI = i; } if (v > top - back) { cur.end = i; out.push(cur); cur = null; } }
  });
  return out;
}

/* ---------------- Analiz ---------------- */
function analyzePose(data, type, exId) {
  const F = data.frames.map(f => features(f, data.W, data.H));
  const ok = F.filter(f => f && f.vis > 0.45);
  const det = data.frames.length ? ok.length / data.frames.length : 0;
  const base = {type, typeName: VTYPES[type].n, exId: exId || null, frames: data.frames.length, detected: Math.round(det * 100), duration: r1(data.dur || 0), fps: data.fps, at: Date.now(), metrics: [], positives: [], fixes: [], drills: [], notes: [], flags: []};
  if (ok.length < 6) return Object.assign(base, {score: null, level: "Analiz edilemedi", view: "?", viewName: "—", reliability: "Düşük", summary: "Videoda kişi yeterince net görünmüyor. Tüm vücut kadrajda olacak şekilde, sabit ve aydınlık bir ortamda tekrar çekin.", reshoot: true});
  const swr = median(ok.map(f => f.swRatio)), front = swr > 0.45, view = front ? (median(ok.map(f => f.noseVis)) > 0.5 ? "front" : "back") : "side";
  const legVis = median(ok.map(f => f.legVis));
  const rel = det > 0.8 && legVis > 0.6 ? "İyi" : det > 0.55 ? "Orta" : "Düşük";
  Object.assign(base, {view, viewName: {front: "önden", back: "arkadan", side: "yandan"}[view], reliability: rel});
  const want = VTYPES[type].view;
  if ((want === "side") !== (view === "side")) base.notes.push(`Bu hareket için en iyi açı ${want === "side" ? "yandan" : "önden"} çekimdir; bazı ölçümler sınırlı.`);
  if (legVis < 0.5) base.notes.push("Ayaklar/dizler net görünmüyor; alt vücut ölçümleri sınırlı.");
  const fn = {squat: anSquat, lunge: anLunge, jump: anJump, sprint: anSprint, balance: anBalance, pushup: anPushup, plank: anPlank, hinge: anHinge, generic: anGeneric}[type] || anGeneric;
  const res = fn(F, base, data);
  let score = 100; res.fixes.forEach(x => score -= x.w || 10); score = clamp(score, 20, 100);
  if (!res.fixes.length && !res.positives.length) score = null;
  /* Güvenilirlik kapısı: hareket net görülmüyorsa puan verilmez, kayıt engellenir */
  const gate = [];
  if (legVis < 0.5 && ["squat", "lunge", "jump", "sprint", "balance", "hinge"].includes(type)) gate.push("Bacaklar net görünmüyor.");
  if (det < 0.6) gate.push("Kişi videonun çoğunda algılanamadı.");
  if (res.metrics.some(m => m.n === "Tekrar sayısı" && m.v === 0) && ["squat", "lunge", "pushup", "hinge"].includes(type)) gate.push("İstenen tekrarlar algılanmadı.");
  if (res.implausible) gate.push(res.implausible);
  if (gate.length) { score = null; res.gated = true; res.summary = "Bu video güvenilir değerlendirme için yeterli değil. " + gate.join(" ") + " Tüm vücut kadrajda, sabit ve yandan/önden net bir şekilde tekrar çekin."; res.reshoot = true; }
  res.score = score; res.level = score == null ? "—" : score >= 85 ? "Çok iyi" : score >= 70 ? "İyi" : score >= 50 ? "Geliştirilmeli" : "Dikkat";
  res.drills = [...new Set(res.fixes.flatMap(x => x.dr || []))].filter(id => typeof exById === "function" ? exById(id) : true).slice(0, 4);
  const top = res.fixes.slice().sort((a, b) => (b.w || 0) - (a.w || 0))[0];
  res.summary = res.summary || (score == null ? "Hareket algılandı fakat değerlendirme için yeterli tekrar/veri bulunamadı." : top ? `${res.level}. ${res.positives[0] ? res.positives[0] + " " : ""}Öncelikli düzeltme: ${top.t.charAt(0).toLocaleLowerCase("tr-TR") + top.t.slice(1)}` : `${res.level}! ${res.positives.slice(0, 2).join(" ")}`);
  res.fixes = res.fixes.map(({w, ...x}) => x);
  return res;
}
const M = (r, n, v, u, ok) => r.metrics.push({n, v, u: u || "", ok});
const FIX = (r, t, cue, w, dr, flag) => { r.fixes.push({t, cue, w, dr}); if (flag) r.flags.push(flag); };

/* Kalçanın düşüşüyle tekrar bulma (her çekim açısında çalışır) */
function hipReps(F, drop = 0.08, back = 0.035) { const s = smooth(F.map(f => f && -f.hipY)); const rs = reps(s, drop, back); const top = pct(s, 0.9); rs.forEach(x => { x.drop = top - x.min; }); return rs; }
function depthCheck(F, r, reps0, label) {
  if (r.view === "side") {
    const depth = mean(reps0.map(x => Math.min(...F.slice(x.start, x.end + 1).filter(Boolean).map(f => f.kneeMin))));
    M(r, label + " (diz açısı)", r0(depth), "°", depth <= 110);
    if (depth <= 100) r.positives.push(`Derinlik çok iyi (dizler ~${r0(depth)}°).`);
    else if (depth <= 120) r.positives.push(`Derinlik yeterli (~${r0(depth)}°).`);
    else FIX(r, `Hareket yüzeysel kalıyor (dizler ~${r0(depth)}°).`, "Kalçayı geriye ve aşağıya, uyluklar yere paralel olana kadar indir.", 18, ["m3", "st1"]);
  } else {
    const d = mean(reps0.map(x => x.drop)); M(r, label + " (kalça düşüşü)", r0(d * 100), "% bacak boyu", d >= 0.35);
    if (d >= 0.4) r.positives.push("Derinlik iyi."); else if (d >= 0.28) r.positives.push("Derinlik yeterli; biraz daha inilebilir."); else FIX(r, "Hareket yüzeysel kalıyor.", "Kalçayı uyluklar yere paralel olana kadar indir.", 18, ["m3", "st1"]);
    r.notes.push("Derinlik önden çekimde kalçanın düşüşünden tahmin edildi; diz açısı için yandan çekin.");
  }
}
/* Hareketsiz (izometrik) duruş: tekrar yoksa en derin anı değerlendir */
function staticHold(F, r, kind) {
  const v = F.filter(f => f && f.vis > 0.45); if (!v.length) return false;
  const kmin = median(v.map(f => f.kneeMin)), tr = median(v.map(f => f.trunk)), pel = median(v.map(f => f.pelvis));
  if (!(kmin < 140)) return false;
  r.notes.push("Tekrar algılanmadı; sabit duruş (izometrik pozisyon) değerlendirildi.");
  M(r, "Bükülü diz açısı", r0(kmin), "°", kmin >= 80 && kmin <= 115);
  if (kmin >= 80 && kmin <= 115) r.positives.push(`Bükülü diz ~${r0(kmin)}° — iyi pozisyon derinliği.`);
  else if (kmin > 115) FIX(r, `Pozisyon yüksek kalıyor (diz ~${r0(kmin)}°).`, kind === "lunge" ? "Ön dizi yaklaşık 90° olacak kadar alçal." : "Uyluklar yere paralel olana kadar alçal.", 12, kind === "lunge" ? ["st3"] : ["st1"]);
  else FIX(r, `Diz çok fazla bükülü (${r0(kmin)}°).`, "Dizin ayak ucunu fazla geçmesin; kalçayı geride tut.", 8, ["st3"]);
  M(r, "Gövde eğimi", r0(tr), "°", tr <= 20); if (tr <= 15) r.positives.push("Gövde dik ve dengeli."); else if (tr > 30) FIX(r, `Gövde öne/yana eğik (${r0(tr)}°).`, "Göğsü yukarıda, gövdeyi dik tut.", 10, ["a3"], "trunk");
  if (r.view !== "side") { M(r, "Pelvis eğimi", r1(pel), "°", pel <= 5); if (pel <= 5) r.positives.push("Kalçalar dengede."); else FIX(r, `Kalça bir tarafa düşüyor (${r1(pel)}°).`, "Kalçaları yere paralel tut.", 8, ["a2"], "trunk"); }
  return true;
}
function anSquat(F, r) {
  let reps0 = hipReps(F); if (!reps0.length && r.view === "side") reps0 = reps(smooth(F.map(f => f && f.kneeMin)), 25, 12);
  if (!reps0.length) { M(r, "Tekrar sayısı", 0, ""); staticHold(F, r, "squat"); r.notes.push("Belirgin bir çömelme tekrarı bulunamadı."); return r; }
  M(r, "Tekrar sayısı", reps0.length, "");
  const bottoms = reps0.map(x => F[x.minI]).filter(Boolean);
  depthCheck(F, r, reps0, "Ortalama derinlik");
  if (r.view === "side") {
    const tr = mean(bottoms.map(f => f.trunk)); M(r, "Gövde eğimi (en alt)", r0(tr), "°", tr <= 45);
    if (tr > 50) FIX(r, `Gövde öne fazla eğiliyor (${r0(tr)}°).`, "Göğsü yukarıda tut, bakışı ileri ver; ayak bileği mobilitesine çalış.", 15, ["m3", "st2", "a3"], "trunk"); else r.positives.push("Gövde açısı kontrollü.");
    const heel = Math.max(...reps0.map(x => Math.max(...F.slice(x.start, x.end + 1).filter(Boolean).map(f => Math.max(f.heelL, f.heelR)))));
    if (heel > 0.06) FIX(r, "Topuklar yerden kalkıyor.", "Ağırlığı orta ayak ve topuğa ver; topuklar yere bassın.", 12, ["m3", "st17"]);
  } else {
    const ks = bottoms.map(f => f.kasr).filter(isNum);
    if (ks.length) { const k = mean(ks); M(r, "Diz/ayak bileği aralık oranı", r1(k), "", k >= 0.85);
      if (k < 0.75) FIX(r, "Dizler belirgin şekilde içe kaçıyor (valgus).", "Dizleri ayak parmaklarının (2–3. parmak) yönüne doğru dışa it.", 22, ["a2", "v1", "st1"], "landing");
      else if (k < 0.88) FIX(r, "Dizler hafifçe içe kaçıyor.", "İnerken dizlerini ayak uçlarının hizasında tut.", 12, ["a2", "v1"], "landing");
      else r.positives.push("Dizler ayak hizasında, iyi diz kontrolü."); }
    const as = mean(bottoms.map(f => Math.abs(f.kneeL - f.kneeR)));
    if (as > 14) FIX(r, `Sağ-sol farkı var (${r0(as)}°): ağırlık bir tarafa kayıyor olabilir.`, "Ağırlığı iki ayağa eşit dağıt.", 10, ["st3"]);
  }
  const dt = mean(reps0.map(x => (x.minI - x.start) / (r.fps || 15)));
  M(r, "İniş süresi", r1(dt), "sn", dt >= 0.8);
  if (dt < 0.6) FIX(r, "İniş çok hızlı.", "Aşağı inerken 2'ye kadar say, kontrollü in.", 8, ["st1"]);
  if (reps0.length >= 3 && reps0[0].drop != null && sd(reps0.map(x => x.drop)) > 0.08) FIX(r, "Tekrarlar arasında derinlik değişiyor.", "Her tekrarda aynı derinliğe in (hedef bir kutu/sandalye kullanılabilir).", 6, ["st1"]);
  return r;
}
function anLunge(F, r) {
  let reps0 = hipReps(F, 0.07, 0.03); if (!reps0.length && r.view === "side") reps0 = reps(smooth(F.map(f => f && f.kneeMin)), 25, 12);
  if (!reps0.length) { M(r, "Tekrar sayısı", 0, ""); staticHold(F, r, "lunge"); r.notes.push("Belirgin bir hamle tekrarı bulunamadı."); return r; }
  M(r, "Tekrar sayısı", reps0.length, "");
  depthCheck(F, r, reps0, "Hamle derinliği");
  const bott = reps0.map(x => F[x.minI]).filter(Boolean);
  if (r.view === "side") { const tr = mean(bott.map(f => f.trunk)); M(r, "Gövde eğimi", r0(tr), "°", tr <= 25); if (tr > 30) FIX(r, `Gövde öne düşüyor (${r0(tr)}°).`, "Gövdeyi dik tut, kalçayı aşağı indir.", 12, ["st3", "a3"], "trunk"); else r.positives.push("Gövde dik ve kontrollü."); }
  else { const fp = mean(bott.map(f => Math.max(f.fppaL, f.fppaR))); M(r, "Ön diz frontal sapma", r0(fp), "°", fp <= 10); if (fp > 12) FIX(r, `Ön diz içe kaçıyor (${r0(fp)}°).`, "Ön dizi ayak ucunun üzerinde tut.", 18, ["st3", "a2"], "landing"); else r.positives.push("Ön diz hizası iyi."); }
  return r;
}
function anJump(F, r, data) {
  const fps = data.fps || 30;
  const valid = F.map(f => f && f.legVis > 0.4 ? f : null);
  const leg = median(valid.filter(Boolean).map(f => f.leg)) || 1;
  const ay = valid.map(f => f && f.ankY), ground = pct(ay, 0.9);
  if (!isNum(ground)) { r.notes.push("Ayaklar görünmüyor; sıçrama analizi yapılamadı."); return r; }
  const air = ay.map(v => isNum(v) && v < ground - 0.05 * leg);
  const segs = []; let s = null;
  air.forEach((a, i) => { if (a && s == null) s = i; if (!a && s != null) { if (i - s >= 2) segs.push([s, i]); s = null; } });
  M(r, "Sıçrama sayısı", segs.length, "");
  if (!segs.length) { r.notes.push("Ayakların yerden kesildiği an algılanamadı. Ayaklar kadrajda olacak şekilde çekin."); return r; }
  const flights = segs.map(([a, b]) => (b - a) / fps);
  const best = Math.max(...flights), h = 9.81 * best * best / 8 * 100, err = 9.81 * 2 * best * (1 / fps) / 8 * 100;
  if (flights.length === 1 || segs.length <= 4) { M(r, "En iyi uçuş süresi", Math.round(best * 1000), "ms"); M(r, "Tahmini sıçrama yüksekliği", r0(h), "cm (±" + Math.max(1, r0(err)) + ")"); r.notes.push("Yükseklik uçuş süresinden hesaplanır (h = g·t²/8); 30 fps videoda ±" + Math.max(1, r0(err)) + " cm hata payı vardır. Resmi test yerine geçmez."); }
  if (segs.length >= 3) {
    const contacts = []; for (let i = 1; i < segs.length; i++) contacts.push((segs[i][0] - segs[i - 1][1]) / fps);
    const ct = mean(contacts), rsi = mean(flights) / (ct || 1);
    M(r, "Ortalama yer temas süresi", Math.round(ct * 1000), "ms", ct <= 0.3); M(r, "Reaktif kuvvet indeksi (RSI)", r1(rsi), "");
    if (ct > 0.35) FIX(r, "Yere temas süresi uzun (ardışık sıçramalarda).", "Yere 'sıcak sobaya dokunur gibi' kısa ve sert dokun.", 8, ["a7", "p2"]);
  }
  const standHip = median(valid.slice(0, segs[0][0]).filter(f => f && !air[valid.indexOf(f)]).map(f => f.hipY).concat(valid.filter(Boolean).slice(-5).map(f => f.hipY)));
  const land = segs.map(([a, b]) => { const w = valid.slice(b, Math.min(valid.length, b + Math.round(0.4 * fps))).filter(Boolean); return w.length ? {kmin: Math.min(...w.map(f => f.kneeMin)), absorb: Math.max(...w.map(f => f.hipY)) - standHip, kasr: Math.min(...w.map(f => isNum(f.kasr) ? f.kasr : 9)), trunk: Math.max(...w.map(f => f.trunk)), asy: Math.max(...w.map(f => Math.abs(f.kneeL - f.kneeR)))} : null; }).filter(Boolean);
  if (land.length) {
    if (r.view === "side") { const km = mean(land.map(x => x.kmin)); M(r, "İnişte diz bükülmesi (en az açı)", r0(km), "°", km <= 125);
      if (km > 140) FIX(r, `İniş sert: dizler yeterince bükülmüyor (~${r0(km)}°).`, "Yere değince kalçayı geri, dizleri bükerek yumuşak ve sessiz in.", 20, ["v1", "p3"], "landing"); else r.positives.push("İnişte dizler bükülerek darbe emiliyor."); }
    else { const ab = mean(land.map(x => x.absorb)); M(r, "İnişte kalçanın çökme miktarı", r0(ab * 100), "% bacak boyu", ab >= 0.1);
      if (ab < 0.07) FIX(r, "İniş sert: inişte dizler ve kalça yeterince bükülmüyor.", "Yere değince kalçayı geri, dizleri bükerek yumuşak ve sessiz in.", 20, ["v1", "p3"], "landing"); else r.positives.push("İnişte darbe dizler ve kalçayla emiliyor."); }
    if (r.view !== "side") { const k = mean(land.map(x => x.kasr).filter(v => v < 9));
      if (isNum(k)) { M(r, "İnişte diz/ayak bileği aralık oranı", r1(k), "", k >= 0.85);
        if (k < 0.75) FIX(r, "İnişte dizler belirgin şekilde içe kaçıyor (dinamik valgus).", "İnişte dizleri ayak uçlarının hizasında tut; 'dizler dışarı' komutu.", 25, ["v1", "a2", "b2"], "landing");
        else if (k < 0.88) FIX(r, "İnişte dizler hafif içe kaçıyor.", "İnişte dizleri ayak hizasında tut.", 12, ["v1", "a2"], "landing");
        else r.positives.push("İnişte diz hizası iyi."); }
      const as = mean(land.map(x => x.asy)); if (as > 18) FIX(r, `İniş asimetrik (sağ-sol diz farkı ~${r0(as)}°).`, "İki ayakla eşit yüklenerek in.", 10, ["p8", "st3"], "landing");
    } else { const tr = mean(land.map(x => x.trunk)); if (tr > 50) FIX(r, `İnişte gövde öne fazla eğiliyor (${r0(tr)}°).`, "İnişte göğsü yukarıda tut.", 10, ["v1"], "trunk"); }
  }
  const pre = valid.slice(Math.max(0, segs[0][0] - Math.round(0.8 * fps)), segs[0][0]).filter(Boolean);
  if (pre.length) { if (r.view === "side") M(r, "Sıçrama öncesi çömelme (diz)", r0(Math.min(...pre.map(f => f.kneeMin))), "°"); if (pre.some(f => f.wristUp) || valid.slice(segs[0][0], segs[0][1]).some(f => f && f.wristUp)) r.positives.push("Kol savuruşu sıçramaya katkı sağlıyor."); else if (r.type === "jump") FIX(r, "Kollar sıçramaya yeterince katılmıyor.", "Sıçrarken kolları güçlüce yukarı savur.", 6, ["p4"]); }
  return r;
}
function anSprint(F, r, data) {
  const fps = data.fps || 30, v = F.filter(f => f && f.vis > 0.45);
  if (r.view !== "side") r.notes.push("Sprint tekniği yandan çekimle değerlendirilir; önden çekimde yalnızca simetri bakılır.");
  const dir = Math.sign((v[v.length - 1].hipXpx - v[0].hipXpx) || 1);
  const n = v.length, early = v.slice(0, Math.max(3, Math.round(n * 0.3))), late = v.slice(Math.round(n * 0.5));
  const trE = mean(early.map(f => f.trunk)), trL = mean(late.map(f => f.trunk));
  M(r, "Gövde açısı (başlangıç)", r0(trE), "°"); M(r, "Gövde açısı (devam)", r0(trL), "°", trL <= 20);
  if (trL > 25) FIX(r, `Koşu sırasında gövde öne fazla eğik (${r0(trL)}°).`, "Hızlandıktan sonra gövdeyi dikleştir, 'uzun boylu koş'.", 10, ["s2", "s1"], "sprint");
  else r.positives.push("Koşu postürü dik ve dengeli.");
  if (trE >= 30 && trE <= 60) r.positives.push(`Çıkışta etkili öne eğilme (~${r0(trE)}°).`);
  const thigh = Math.max(...v.map(f => Math.max(180 - f.hipL, 180 - f.hipR)));
  M(r, "Diz çekişi (uyluk açısı)", r0(thigh), "°", thigh >= 60);
  if (thigh < 50) FIX(r, "Diz çekişi yetersiz.", "Dizini kalça hizasına yakın kaldır; A-skip drili yap.", 12, ["s1", "s2"], "sprint"); else r.positives.push("Diz çekişi iyi.");
  const ground = pct(v.map(f => f.ankY), 0.85), contacts = [];
  for (let i = 1; i < v.length - 1; i++) for (const k of ["lAnY", "rAnY"]) { if (v[i][k] >= ground && v[i][k] >= v[i - 1][k] && v[i][k] > v[i + 1][k] - 1) contacts.push({f: v[i], k}); }
  const os = contacts.map(c => ((c.k === "lAnY" ? c.f.lAnX : c.f.rAnX) - c.f.hipXpx) * dir / (c.f.leg || 1)).filter(isNum);
  if (os.length >= 2 && r.view === "side") { const o = median(os); M(r, "Ayak basış konumu (kalçanın önü)", r1(o), "× bacak", o <= 0.3);
    if (o > 0.35) FIX(r, "Ayak vücudun çok önüne basıyor (overstriding).", "Ayağını kalçanın altına, yere 'pençeleyerek' bas.", 15, ["s3", "s1"], "sprint"); else r.positives.push("Ayak kalçaya yakın basıyor."); }
  const span = (v[v.length - 1].t - v[0].t) || 1, steps = Math.max(0, Math.round(contacts.length / 2));
  if (steps >= 3) { const sf = steps / span; M(r, "Adım frekansı (yaklaşık)", r1(sf), "adım/sn", sf <= 6); if (sf > 6) r.implausible = "Adım frekansı insan sınırının üstünde çıktı; ölçüm güvenilir değil."; }
  const elbowRange = Math.max(...v.map(f => f.elbowL)) - Math.min(...v.map(f => f.elbowL));
  if (elbowRange < 25) FIX(r, "Kol hareketi zayıf.", "Kolları dirsek ~90° ile omuzdan güçlü salla.", 6, ["s2"]);
  return r;
}
function anBalance(F, r, data) {
  const v = F.filter(f => f && f.legVis > 0.4);
  const one = v.filter(f => Math.abs(f.lAnY - f.rAnY) > 0.08 * f.leg);
  const fps = data.fps || 15;
  const dur = one.length / fps; M(r, "Tek ayakta kalma süresi", r1(dur), "sn", dur >= 10);
  if (!one.length) { r.notes.push("Tek ayak duruşu algılanamadı."); return r; }
  const sway = sd(one.map(f => f.hipX)); M(r, "Salınım (kalça)", r1(sway * 100), "% bacak", sway <= 0.03);
  if (sway > 0.045) FIX(r, "Vücut salınımı fazla.", "Bir noktaya bak, karnını sık, destek dizini hafif bük.", 14, ["b1", "b2"]); else r.positives.push("Denge stabil, salınım az.");
  if (r.view !== "side") {
    const pel = mean(one.map(f => f.pelvis)); M(r, "Pelvis eğimi", r1(pel), "°", pel <= 5);
    if (pel > 6) FIX(r, `Kalça düşüyor (${r1(pel)}°).`, "Kalçaları yere paralel tut; destek bacağın kalçasını sık.", 14, ["a2", "a6"], "trunk"); else r.positives.push("Pelvis seviyesi korunuyor.");
    const lat = mean(one.map(f => Math.abs(f.trunkLat))); if (lat > 0.12) FIX(r, "Gövde yana eğilerek dengeleniyor.", "Gövdeyi dik tut; dengeyi kalçadan sağla.", 10, ["a6", "st18"], "trunk");
    const fp = mean(one.map(f => f.lAnY > f.rAnY ? f.fppaL : f.fppaR)); if (fp > 12) FIX(r, `Destek dizi içe kaçıyor (${r0(fp)}°).`, "Destek dizini ayak ucunun üzerinde tut.", 12, ["b2", "a2"], "landing");
  }
  return r;
}
function anPushup(F, r) {
  const E = smooth(F.map(f => f && Math.min(f.elbowL, f.elbowR))), reps0 = reps(E, 35, 15);
  M(r, "Tekrar sayısı", reps0.length, "");
  if (reps0.length) { const d = mean(reps0.map(x => x.min)); M(r, "En alt dirsek açısı", r0(d), "°", d <= 100);
    if (d > 110) FIX(r, `Yeterince aşağı inilmiyor (dirsek ~${r0(d)}°).`, "Göğsün yere bir yumruk kalana kadar in.", 15, ["st12"]); else r.positives.push("Tam hareket açıklığı."); }
  const body = F.filter(Boolean).map(f => f.body), b = mean(body);
  M(r, "Vücut çizgisi (omuz-kalça-ayak bileği)", r0(b), "°", b >= 165);
  if (b < 160) { FIX(r, `Vücut düz bir çizgide değil (${r0(b)}°): kalça düşüyor veya yükseliyor.`, "Karın ve kalçanı sık; baştan topuğa düz bir tahta gibi ol.", 18, ["st19", "a3"], "trunk"); }
  else r.positives.push("Vücut düz bir çizgide.");
  return r;
}
function anPlank(F, r, data) {
  const v = F.filter(Boolean), good = v.filter(f => f.body >= 160);
  M(r, "Toplam süre", r1(v.length / (data.fps || 15)), "sn"); M(r, "Doğru pozisyonda geçen süre", r1(good.length / (data.fps || 15)), "sn");
  const b = mean(v.map(f => f.body)); M(r, "Ortalama vücut çizgisi", r0(b), "°", b >= 165);
  if (b < 160) FIX(r, `Kalça düşüyor/yükseliyor (vücut çizgisi ${r0(b)}°).`, "Kalçanı sık, karnını içeri çek; baş-kalça-topuk aynı çizgide.", 20, ["st19", "a3"], "trunk"); else r.positives.push("Gövde pozisyonu çok iyi korunuyor.");
  const late = v.slice(Math.round(v.length * 0.7)); if (late.length && mean(late.map(f => f.body)) < b - 8) FIX(r, "Süre ilerledikçe pozisyon bozuluyor.", "Pozisyon bozulunca dur; süreyi kademeli artır.", 8, ["st19"]);
  return r;
}
function anHinge(F, r) {
  const Hh = smooth(F.map(f => f && Math.min(f.hipL, f.hipR))), reps0 = reps(Hh, 35, 15);
  M(r, "Tekrar sayısı", reps0.length, "");
  if (!reps0.length) { r.notes.push("Belirgin bir kalça menteşe tekrarı bulunamadı."); return r; }
  const bott = reps0.map(x => F[x.minI]).filter(Boolean), hip = mean(reps0.map(x => x.min)), kn = mean(bott.map(f => f.kneeMin));
  M(r, "Kalça açısı (en alt)", r0(hip), "°"); M(r, "Diz açısı (en alt)", r0(kn), "°", kn >= 130);
  if (kn < 120) FIX(r, `Hareket squat'a dönüşüyor (dizler ~${r0(kn)}°).`, "Dizleri hafif bükülü sabit tut, kalçayı geriye it.", 15, ["st7", "a1"]); else r.positives.push("Kalça menteşe paterni doğru: hareket kalçadan.");
  if (hip > 130) FIX(r, "Kalçadan yeterince eğilinmiyor.", "Kalçayı duvara dokundurmaya çalışır gibi geriye it.", 10, ["st7"]);
  r.notes.push("Bel/omurga eğriliği 2B videodan güvenilir ölçülemez; antrenör gözüyle kontrol edilmeli.");
  return r;
}
function anGeneric(F, r) {
  const v = F.filter(Boolean);
  const rng = k => Math.max(...v.map(f => f[k])) - Math.min(...v.map(f => f[k]));
  M(r, "Diz hareket açıklığı (sol/sağ)", r0(rng("kneeL")) + " / " + r0(rng("kneeR")), "°"); M(r, "Kalça hareket açıklığı (sol/sağ)", r0(rng("hipL")) + " / " + r0(rng("hipR")), "°");
  if (Math.max(rng("kneeL"), rng("kneeR"), rng("hipL"), rng("hipR")) < 12) { r.notes.push("Videoda belirgin bir hareket algılanmadı."); return r; }
  const as = Math.abs(rng("kneeL") - rng("kneeR")); if (as > 25) FIX(r, "Sağ ve sol bacak farklı açıklıkta hareket ediyor.", "İki tarafı eşit çalıştır; zayıf tarafla başla.", 10, ["st3"]); else r.positives.push("Sağ-sol hareket açıklığı dengeli.");
  return r;
}

/* ---------------- Görsel: anahtar kare + iskelet ---------------- */
const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [27, 29], [28, 30]];
function drawSkeleton(g, lm, W, H, color = "#22D3C5") {
  if (!lm) return; g.lineWidth = Math.max(2, W / 160); g.strokeStyle = color; g.fillStyle = "#FBBF24";
  for (const [a, b] of BONES) { if (lm[a].v < 0.3 || lm[b].v < 0.3) continue; g.beginPath(); g.moveTo(lm[a].x * W, lm[a].y * H); g.lineTo(lm[b].x * W, lm[b].y * H); g.stroke(); }
  for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) { if (lm[i].v < 0.3) continue; g.beginPath(); g.arc(lm[i].x * W, lm[i].y * H, Math.max(2.5, W / 110), 0, 7); g.fill(); }
}
async function keyframeThumb(video, data, res) {
  try {
    const F = data.frames.filter(f => f.lm); if (!F.length) return null;
    let kf = F[Math.floor(F.length / 2)];
    if (["squat", "lunge"].includes(res.type)) kf = F.reduce((b, f) => { const x = features(f, data.W, data.H); const y = features(b, data.W, data.H); return x && y && x.kneeMin < y.kneeMin ? f : b; }, F[0]);
    else if (res.type === "pushup") kf = F.reduce((b, f) => { const x = features(f, data.W, data.H), y = features(b, data.W, data.H); return x && y && Math.min(x.elbowL, x.elbowR) < Math.min(y.elbowL, y.elbowR) ? f : b; }, F[0]);
    await seekTo(video, kf.t);
    const w = 260, h = Math.round(w * data.H / data.W), c = document.createElement("canvas"); c.width = w; c.height = Math.min(h, 420);
    const g = c.getContext("2d"); g.drawImage(video, 0, 0, w, h); drawSkeleton(g, kf.lm, w, h);
    return c.toDataURL("image/jpeg", 0.62);
  } catch (e) { return null; }
}
/* Tam akış: video öğesi → sonuç */
async function analyzeVideo(video, type, exId, onProgress) {
  const data = await extractPose(video, type, onProgress);
  const res = analyzePose(data, type, exId);
  res.thumb = await keyframeThumb(video, data, res);
  return res;
}
