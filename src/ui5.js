/* =========================================================================
   VİDEO ANALİZİ, YÜK TAKİBİ, GELİŞİM, UZUN VADE, OPTİMİZASYON, PANELLER,
   GRUPLAR, KARŞILAŞTIRMA, RAPORLAR, BİLDİRİMLER, AYARLAR, GİZLİLİK, DEMO, BAŞLATMA
   ========================================================================= */
/* ---------- Video hareket analizi ---------- */
route("/a/:aid/video", p => {
  const a = getA(p.aid), vs = DB.videos.filter(v => v.athleteId === a.id).sort((x, y) => y.at - x.at), ok = consent(a.id, "video");
  return {title: "Video hareket analizi", html: `${alertBox("info", "", "Manuel açı ölçümü (işaretleme) tam çalışır. Otomatik iskelet tespiti <b>deneyseldir</b>, internet bağlantısı gerektirir ve her cihazda çalışmayabilir. Video analizinden sakatlık teşhisi veya eklem hasarı tahmini yapılmaz.")}
    ${!ok ? alertBox("warn", "Video izni yok", `Video yükleme ve analiz için velinin “${CONSENT_N.video}” iznini vermesi gerekir. <a href="#/a/${a.id}/consents">İzinler</a>`) : `<a class="btn pri block" href="#/a/${a.id}/video/new">${ic("video")} Yeni video analizi</a>`}
    <h3>Geçmiş analizler</h3>${vs.length ? `<div class="list">${vs.map(v => li(`#/a/${a.id}/video/${v.id}`, "video", esc((MOVES[v.movement] || {}).n || v.movement), `${fmtD(v.date)} · ${v.measures.length} ölçüm · güvenilirlik: ${esc(v.report.reliability)}`, v.blob ? pill("video", "acc") : "")).join("")}</div>` : empty("Henüz analiz yok.", "video")}`};
});
let VA = null;
const QCHK = [["full", "Tüm vücut kadrajda"], ["stable", "Kamera sabit (tripod/destek)"], ["height", "Kamera kalça hizasında ve harekete dik"], ["light", "Yeterli ışık, net görüntü"], ["fps", "≥60 fps (ağır çekim) — sprint/sıçrama için"], ["clothes", "Eklemleri gösteren kıyafet"]];
route("/a/:aid/video/new", p => {
  const a = getA(p.aid);
  if (!consent(a.id, "video")) return {title: "Video analizi", html: alertBox("warn", "Video izni yok", "Veli izni olmadan video yüklenemez.")};
  if (!VA || VA.aid !== a.id) VA = {aid: a.id, measures: [], pts: [], type: "knee", side: "L", obs: [], file: null, url: null, movement: "landing", view: "front", quality: {}};
  afterRender.push(wireVideo);
  const mv = MOVES[VA.movement];
  return {title: "Yeni video analizi", keepScroll: true, html: `
    <div class="card"><div class="grid2">${field("Hareket", sel("vaMove", Object.entries(MOVES).map(([k, v]) => [k, v.n]), VA.movement, 'id="vaMove"'))}${field("Kamera açısı", sel("vaView", [["side", "Yandan"], ["front", "Önden"], ["back", "Arkadan"]], VA.view, 'id="vaView"'))}</div>
      <p class="tiny muted">Bu hareket için önerilen açı: <b>${mv.view === "side" ? "yandan" : "önden"}</b>.</p>
      ${field("Çekim kalitesi kontrol listesi", QCHK.map(([k, n]) => `<label class="check" style="padding:5px 0"><input type="checkbox" data-q="${k}" ${VA.quality[k] ? "checked" : ""}><span class="small">${n}</span></label>`).join(""))}
      <label class="btn blue block">${ic("video")} ${VA.file ? "Başka video seç" : "Video seç / çek"}<input type="file" id="vaFile" accept="video/*" style="display:none"></label>
      ${VA.file ? `<p class="tiny muted">${esc(VA.file.name)} · ${VA.file.size < 1048576 ? Math.max(1, Math.round(VA.file.size / 1024)) + " KB" : (VA.file.size / 1048576).toFixed(1) + " MB"}</p>` : ""}</div>
    ${VA.url ? `<div class="vwrap" id="vaWrap"><video id="vaVid" src="${VA.url}" playsinline muted preload="auto"></video><canvas id="vaCan"></canvas></div>
      <div class="row mt" style="gap:6px"><button class="btn sm" data-act="vaStep" data-s="-0.0333">−1 kare</button><button class="btn sm" data-act="vaPlay">▶︎/❚❚</button><button class="btn sm" data-act="vaStep" data-s="0.0333">+1 kare</button><span class="tiny muted grow" id="vaTime" style="text-align:right">0.00 s</span></div>
      <input type="range" id="vaSeek" min="0" max="1000" value="0" style="width:100%;margin:10px 0;accent-color:var(--acc)">
      <div class="card"><h3>Ölçüm aracı</h3><div class="grid2">${field("Ölçüm", sel("vaType", Object.entries(MTYPES).map(([k, v]) => [k, v.n]), VA.type, 'id="vaType"'))}${field("Taraf", sel("vaSide", [["L", "Sol"], ["R", "Sağ"], ["-", "—"]], VA.side, 'id="vaSide"'))}</div>
        <p class="small" id="vaHint">Videoyu durdurun ve sırayla dokunun: <b>${esc(MTYPES[VA.type].hint)}</b> (${VA.pts.length}/${MTYPES[VA.type].pts})</p>
        <div class="btns"><button class="btn sm" data-act="vaUndo">Son noktayı sil</button><button class="btn sm blue" data-act="vaAuto">Otomatik iskelet (deneysel)</button></div><div id="vaAutoOut"></div></div>
      <div class="card"><h3>Ölçümler (${VA.measures.length})</h3>${VA.measures.length ? `<table class="tbl">${VA.measures.map((m, i) => `<tr><td>${esc(MTYPES[m.type].n)} ${m.side !== "-" ? (m.side === "L" ? "(Sol)" : "(Sağ)") : ""}<div class="tiny muted">${m.t.toFixed(2)} s · ${m.src || "manuel"}</div></td><td class="r"><b>${fmtN(m.value, 1)}°</b></td><td class="r"><button class="btn sm ghost" data-act="vaDelM" data-i="${i}">✕</button></td></tr>`).join("")}</table>` : `<p class="small muted">Henüz ölçüm yok.</p>`}</div>` : ""}
    <div class="card"><h3>Antrenör gözlemleri</h3>${mv.obs.map(([t]) => `<label class="check" style="padding:5px 0"><input type="checkbox" data-obs="${esc(t)}" ${VA.obs.includes(t) ? "checked" : ""}><span class="small">${esc(t)}</span></label>`).join("")}</div>
    <div class="card"><label class="check"><input type="checkbox" id="vaKeep" checked><span class="small">Videoyu bu cihazda şifreli sakla (aksi halde yalnızca ölçümler kaydedilir)</span></label>
      <button class="btn pri block" data-act="vaSave" ${VA.measures.length || VA.obs.length ? "" : "disabled"}>Analiz raporunu oluştur ve kaydet</button></div>`};
});
function vaContentRect(v, c) { const W = c.width, H = c.height, vw = v.videoWidth || W, vh = v.videoHeight || H, sc = Math.min(W / vw, H / vh); const w = vw * sc, h = vh * sc; return {x: (W - w) / 2, y: (H - h) / 2, w, h}; }
function vaDraw() {
  const v = $("#vaVid"), c = $("#vaCan"); if (!v || !c) return;
  const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; c.width = r.width * dpr; c.height = r.height * dpr;
  const g = c.getContext("2d"), cr = vaContentRect(v, c), P = q => [cr.x + q[0] * cr.w, cr.y + q[1] * cr.h];
  g.clearRect(0, 0, c.width, c.height); g.lineWidth = 3 * dpr; g.font = `${13 * dpr}px sans-serif`;
  const drawSet = (pts, col, label) => { g.strokeStyle = col; g.fillStyle = col; g.beginPath(); pts.forEach((q, i) => { const [x, y] = P(q); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); pts.forEach(q => { const [x, y] = P(q); g.beginPath(); g.arc(x, y, 5 * dpr, 0, 7); g.fill(); }); if (label && pts.length) { const [x, y] = P(pts[Math.min(1, pts.length - 1)]); g.fillStyle = "#000a"; g.fillRect(x + 8 * dpr, y - 16 * dpr, g.measureText(label).width + 10 * dpr, 20 * dpr); g.fillStyle = "#fff"; g.fillText(label, x + 13 * dpr, y - 2 * dpr); } };
  VA.measures.filter(m => Math.abs(m.t - v.currentTime) < 0.05 && m.pts).forEach(m => drawSet(m.pts, "#FBBF24", fmtN(m.value, 0) + "°"));
  if (VA.pose && Math.abs(VA.pose.t - v.currentTime) < 0.05) { g.fillStyle = "#3B82F6"; VA.pose.lm.forEach(q => { const [x, y] = P([q.x, q.y]); g.beginPath(); g.arc(x, y, 3 * dpr, 0, 7); g.fill(); }); }
  drawSet(VA.pts, "#22D3C5");
  const tl = $("#vaTime"); if (tl) tl.textContent = v.currentTime.toFixed(2) + " / " + (v.duration || 0).toFixed(2) + " s";
  const sk = $("#vaSeek"); if (sk && v.duration) sk.value = Math.round(v.currentTime / v.duration * 1000);
}
function wireVideo() {
  const f = $("#vaFile"); if (f) f.onchange = () => { const file = f.files[0]; if (!file) return; if (file.size > 150 * 1048576) { toast("Video 150 MB'tan küçük olmalı"); return; } if (VA.url) URL.revokeObjectURL(VA.url); VA.file = file; VA.url = URL.createObjectURL(file); VA.measures = []; VA.pts = []; VA.pose = null; reRender(); };
  const mv = $("#vaMove"); if (mv) mv.onchange = () => { VA.movement = mv.value; VA.view = MOVES[mv.value].view === "side" ? "side" : "front"; VA.obs = []; reRender(); };
  const vw = $("#vaView"); if (vw) vw.onchange = () => { VA.view = vw.value; };
  $$("[data-q]").forEach(el => el.onchange = () => { VA.quality[el.dataset.q] = el.checked; });
  $$("[data-obs]").forEach(el => el.onchange = () => { VA.obs = el.checked ? VA.obs.concat(el.dataset.obs) : VA.obs.filter(x => x !== el.dataset.obs); const b = $("[data-act=vaSave]"); if (b) b.disabled = !(VA.measures.length || VA.obs.length); });
  const ty = $("#vaType"); if (ty) ty.onchange = () => { VA.type = ty.value; VA.pts = []; VA.side = MTYPES[VA.type].pts === 2 && VA.type !== "trunk" && VA.type !== "shin" ? "-" : VA.side; reRender(); };
  const sd = $("#vaSide"); if (sd) sd.onchange = () => { VA.side = sd.value; };
  const v = $("#vaVid"), c = $("#vaCan"), sk = $("#vaSeek"); if (!v) return;
  v.onloadedmetadata = () => { v.currentTime = 0.001; vaDraw(); }; v.onseeked = vaDraw; v.ontimeupdate = vaDraw; v.onloadeddata = vaDraw;
  if (v.readyState >= 1) vaDraw();
  if (sk) sk.oninput = () => { if (v.duration) { v.pause(); v.currentTime = sk.value / 1000 * v.duration; } };
  window.addEventListener("resize", vaDraw);
  c.onpointerdown = e => {
    e.preventDefault(); if (!v.paused) { v.pause(); return; }
    if (!v.videoWidth) { toast("Video henüz yüklenmedi"); return; }
    vaDraw();
    const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1, cr = vaContentRect(v, c);
    const x = ((e.clientX - r.left) * dpr - cr.x) / cr.w, y = ((e.clientY - r.top) * dpr - cr.y) / cr.h;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    VA.pts.push([x, y]);
    const need = MTYPES[VA.type].pts;
    if (VA.pts.length >= need) {
      const val = measureValue(VA.type, VA.pts, v.videoWidth || 1, v.videoHeight || 1);
      VA.measures.push({type: VA.type, side: $("#vaSide") ? $("#vaSide").value : VA.side, value: round(val, 1), t: v.currentTime, pts: VA.pts.slice(), src: "manuel"});
      VA.pts = []; toast(`${MTYPES[VA.type].n}: ${fmtN(val, 1)}°`); reRender(); return;
    }
    const h = $("#vaHint"); if (h) h.innerHTML = `Sırayla dokunun: <b>${esc(MTYPES[VA.type].hint)}</b> (${VA.pts.length}/${need})`;
    vaDraw();
  };
}
ACT.vaStep = el => { const v = $("#vaVid"); if (!v) return; v.pause(); v.currentTime = clamp(v.currentTime + parseFloat(el.dataset.s), 0, v.duration || 0); };
ACT.vaPlay = () => { const v = $("#vaVid"); if (!v) return; v.paused ? v.play() : v.pause(); };
ACT.vaUndo = () => { if (VA.pts.length) VA.pts.pop(); vaDraw(); };
ACT.vaDelM = el => { VA.measures.splice(+el.dataset.i, 1); reRender(); };
let POSE = null;
const MP_VER = "0.10.14";
async function loadPose() {
  if (POSE) return POSE;
  const vision = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}/vision_bundle.mjs`);
  const files = await vision.FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}/wasm`);
  const mk = delegate => vision.PoseLandmarker.createFromOptions(files, {baseOptions: {modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task", delegate}, runningMode: "IMAGE", numPoses: 1});
  try { POSE = await mk("GPU"); } catch (e) { POSE = await mk("CPU"); }
  return POSE;
}
ACT.vaAuto = async () => {
  const v = $("#vaVid"), out = $("#vaAutoOut"); if (!v) return; v.pause();
  out.innerHTML = `<p class="small muted">Model yükleniyor (ilk seferde ~6 MB)…</p>`;
  try {
    const pl = await loadPose(); const res = pl.detect(v); const lm = res.landmarks && res.landmarks[0];
    if (!lm) { out.innerHTML = alertBox("warn", "", "Bu karede kişi tespit edilemedi. Tüm vücudun göründüğü bir kare seçin."); return; }
    const W = v.videoWidth, H = v.videoHeight, P = i => [lm[i].x, lm[i].y], vis = i => (lm[i].visibility ?? 1) > 0.5;
    const add = (type, side, idx) => { if (!idx.every(vis)) return; const pts = idx.map(P); VA.measures.push({type, side, value: round(measureValue(type, pts, W, H), 1), t: v.currentTime, pts, src: "otomatik"}); };
    VA.pose = {t: v.currentTime, lm};
    const front = VA.view !== "side";
    add(front ? "fppa" : "knee", "L", [23, 25, 27]); add(front ? "fppa" : "knee", "R", [24, 26, 28]);
    if (!front) { add("hip", "L", [11, 23, 25]); add("hip", "R", [12, 24, 26]); const mid = (a, b) => [(lm[a].x + lm[b].x) / 2, (lm[a].y + lm[b].y) / 2]; if ([11, 12, 23, 24].every(vis)) VA.measures.push({type: "trunk", side: "-", value: round(measureValue("trunk", [mid(23, 24), mid(11, 12)], W, H), 1), t: v.currentTime, pts: [mid(23, 24), mid(11, 12)], src: "otomatik"}); }
    else add("pelvis", "-", [23, 24]);
    audit("Otomatik iskelet tespiti kullanıldı", VA.aid, ""); toast("Otomatik ölçümler eklendi — doğruluğunu kontrol edin"); reRender();
  } catch (e) { console.warn(e); out.innerHTML = alertBox("bad", "Otomatik tespit kullanılamadı", "İnternet bağlantısı, tarayıcı desteği (WebAssembly) veya model indirme sorunu: " + esc(e.message || e) + ". Manuel işaretleme ile devam edebilirsiniz."); }
};
ACT.vaSave = async el => {
  el.disabled = true;
  const rec = {id: uid("v_"), athleteId: VA.aid, date: todayISO(), at: Date.now(), by: S.me.name, movement: VA.movement, view: VA.view, quality: Object.assign({}, VA.quality), measures: VA.measures.map(m => Object.assign({}, m)), obs: VA.obs.slice(), fileName: VA.file ? VA.file.name : null, blob: null};
  if (VA.file && $("#vaKeep") && $("#vaKeep").checked) { try { toast("Video şifreleniyor…", 8000); rec.blob = await storeBlob(VA.file); } catch (e) { toast("Video saklanamadı, yalnızca ölçümler kaydedildi"); } }
  rec.report = videoReport(rec);
  DB.videos.push(rec); audit("Video analizi kaydedildi", VA.aid, MOVES[rec.movement].n);
  if (rec.report.flags.length) notify({key: "vid:" + rec.id, athleteId: VA.aid, type: "video", title: "Video analizinde teknik bulgu", body: `${getA(VA.aid).name}: ${rec.report.improve.slice(0, 2).join(" ")}`, roles: ["coach", "parent"]});
  const aid = VA.aid; if (VA.url) URL.revokeObjectURL(VA.url); VA = null; save(); go(`#/a/${aid}/video/${rec.id}`);
};
route("/a/:aid/video/:vid", p => {
  if (p.vid === "new") return null;
  const a = getA(p.aid), v = DB.videos.find(x => x.id === p.vid); if (!v) return {title: "Analiz", html: empty("Bulunamadı")};
  const r = v.report;
  afterRender.push(async () => { if (v.blob) { try { const u = await loadBlobURL(v.blob); const el = $("#vrVid"); if (el && u) el.src = u; } catch (e) { } } });
  const sec = (n, t, b) => `<div class="card"><h3><span class="pill acc">${n}</span> ${t}</h3>${b}</div>`;
  const ul = arr => arr.length ? `<ul class="small" style="padding-left:18px">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="small muted">—</p>`;
  return {title: "Video analiz raporu", html: `${v.blob ? `<video id="vrVid" controls playsinline style="width:100%;border-radius:14px;background:#000;margin-bottom:12px"></video>` : ""}
    <div class="card acc"><div class="tiny muted">${fmtD(v.date)} · ${esc(v.by)}</div><h2 style="margin:2px 0">${esc(MOVES[v.movement].n)}</h2><div class="small">Görüntü güvenilirliği: ${pill(r.reliability, r.reliability === "İyi" ? "ok" : r.reliability === "Orta" ? "warn" : "bad")}</div></div>
    ${sec(1, "Gözlemlenen hareket", `<p class="small">${esc(r.observed)}</p>`)}
    ${sec(2, "Olumlu özellikler", ul(r.positives))}
    ${sec(3, "Geliştirilmesi gereken teknik detaylar", ul(r.improve))}
    ${sec(4, "Görüntüden ölçülebilen parametreler", r.params.length ? `<table class="tbl">${r.params.map(x => `<tr><td>${esc(x.n)}<div class="tiny muted">${x.src ? esc(x.src) : ""}${x.note ? " · " + esc(x.note) : ""}</div></td><td class="r"><b>${fmtN(x.v, 1)}°</b></td><td>${x.reliable ? pill("güvenilir", "ok") : pill("sınırlı", "warn")}</td></tr>`).join("")}</table>` : `<p class="small muted">Ölçüm yok.</p>`)}
    ${sec(5, "Önerilen teknik çalışmalar", r.drills.length ? `<div class="list">${r.drills.map(id => li("#/ex/" + id, "bolt", esc(exById(id).n), esc(CATS[exById(id).c]))).join("")}</div>` : `<p class="small muted">Ek çalışma önerisi yok.</p>`)}
    ${sec(6, "Yeniden çekim önerisi", ul(r.reshoot.length ? r.reshoot : ["Çekim koşulları yeterli görünüyor. 4–6 hafta sonra aynı açı ve mesafeden tekrar çekim önerilir."]))}
    <p class="tiny muted">${esc(r.disclaimer)}</p>
    ${role() !== "athlete" ? `<button class="btn danger block" data-act="vidDel" data-id="${v.id}">Analizi${v.blob ? " ve videoyu" : ""} sil</button>` : ""}`};
});
ACT.vidDel = async el => { const v = DB.videos.find(x => x.id === el.dataset.id); if (!await confirmBox("Analiz silinsin mi?", "Sil", true)) return; if (v.blob) await idbDel(v.blob); DB.videos = DB.videos.filter(x => x !== v); audit("Video analizi silindi", v.athleteId, ""); save(); go(`#/a/${v.athleteId}/video`); };

/* ---------- Sakatlık riski ve yük takibi ---------- */
route("/a/:aid/load", p => {
  const a = getA(p.aid), ls = loadSummary(a);
  const logs = DB.logs.filter(l => l.athleteId === a.id).concat(DB.extLoads.filter(e => e.athleteId === a.id).map(e => Object.assign({ext: 1}, e))).sort((x, y) => x.date < y.date ? 1 : -1).slice(0, 20);
  return {title: "Yük ve toparlanma takibi", html: `${alertBox("info", "", "Bu modül sakatlık teşhisi yapmaz ve tek bir oran ile sakatlık olacağını iddia etmez. Amaç olası yüklenme sorunlarını erken fark edip antrenörün değerlendirmesine sunmaktır.")}
    ${ls.flags.length ? ls.flags.map(f => alertBox(f.lv, "", esc(f.t))).join("") : alertBox("ok", "", "Belirgin yük veya toparlanma uyarısı yok.")}
    <div class="grid2"><div class="stat"><b>${Math.round(ls.acute)}</b><span>Son 7 gün yük (AU)</span></div><div class="stat"><b>${Math.round(ls.chronic)}</b><span>4 hafta ort. (AU/hf)</span></div><div class="stat"><b>${ls.acwr == null ? "—" : fmtN(ls.acwr, 2)}</b><span>Akut:kronik oran*</span></div><div class="stat"><b>${ls.mono == null ? "—" : fmtN(ls.mono, 1)}</b><span>Monotoni</span></div><div class="stat"><b>${ls.sleepAvg == null ? "—" : fmtN(ls.sleepAvg, 1)} sa</b><span>Uyku ort. (öneri ≥${ls.sleepNeed})</span></div><div class="stat"><b>${fmtN(ls.hrsWeek, 1)} sa</b><span>Son 7 gün organize spor</span></div></div>
    <p class="tiny muted">* Oran yalnızca bağlam sağlar (Gabbett 2016; Impellizzeri ve ark. 2020 eleştirisi). Yük = RPE × süre (Foster 2001).</p>
    <div class="card"><h3>Haftalık toplam yük</h3>${barChart(ls.weeks.map((w, i) => ({l: fmtD(w.to).slice(0, 5), v: w.load, c: i === ls.weeks.length - 1 ? COL.cur : COL.blue})))}${ls.change != null ? `<p class="small">Önceki haftaya göre değişim: <b>${ls.change > 0 ? "+" : ""}${Math.round(ls.change)}%</b></p>` : ""}</div>
    <form class="card" data-form="extLoad" data-aid="${a.id}"><h3>Takım antrenmanı / maç ekle</h3><div class="grid2">${field("Tür", sel("type", ["Takım antrenmanı", "Maç", "Okul beden eğitimi", "Diğer"]))}${field("Tarih", inp("date", todayISO(), 'type="date" required'))}${field("Süre (dk)", inp("duration", "90", 'inputmode="numeric" required'))}${field("RPE (0–10)", sel("rpe", Array.from({length: 11}, (_, i) => String(i)), "6"))}</div><button class="btn sm pri" type="submit">Ekle</button></form>
    <h3>Son kayıtlar</h3><div class="card"><table class="tbl"><tr><th>Tarih</th><th>Tür</th><th class="r">dk</th><th class="r">RPE</th><th class="r">Yük</th></tr>${logs.map(l => `<tr><td>${fmtD(l.date)}</td><td class="tiny">${l.ext ? esc(l.type) : "Program seansı"}${l.readiness ? `<br>${esc(l.readiness)}` : ""}${l.painLevel ? `<br><span style="color:var(--bad)">ağrı ${l.painLevel}/10</span>` : ""}</td><td class="r">${l.duration ?? "—"}</td><td class="r">${l.rpe ?? "—"}</td><td class="r">${l.load ?? "—"}${l.ext ? ` <button class="btn sm ghost" style="min-height:28px;padding:0 6px" data-act="extDel" data-id="${l.id}">✕</button>` : ""}</td></tr>`).join("")}</table></div>`};
});
FORM.extLoad = (d, f) => { const dur = num(d.duration), rpe = num(d.rpe); if (!isNum(dur) || dur <= 0 || dur > 300) throw new Error("Süre 1–300 dk olmalı."); DB.extLoads.push({id: uid("x_"), athleteId: f.dataset.aid, type: d.type, date: d.date, duration: dur, rpe, load: Math.round(dur * rpe), by: S.me.name}); audit("Dış yük eklendi", f.dataset.aid, d.type); save(); toast("Eklendi"); reRender(); };
ACT.extDel = el => { DB.extLoads = DB.extLoads.filter(x => x.id !== el.dataset.id); save(); reRender(); };

/* ---------- Gelişim takibi ve periyodik yeniden değerlendirme ---------- */
route("/a/:aid/progress", p => {
  const a = getA(p.aid), pr = activeProgram(a.id) || programsOf(a.id).find(x => x.status === "onaylı" || x.status === "arşiv");
  const ad = pr ? adherence(a.id, pr.startDate, todayISO()) : null;
  const tested = TESTS.filter(t => testsOf(a.id, t.id).length >= 2);
  const cmp = tested.map(t => { const rs = testsOf(a.id, t.id); return {t, c: compareResults(t, rs[0], rs[rs.length - 1]), rs}; }).filter(x => x.c);
  const notImp = cmp.filter(x => !x.c.improved || x.c.ratio < 1);
  const logs = DB.logs.filter(l => l.athleteId === a.id && isNum(l.rpe)).sort((x, y) => x.date < y.date ? -1 : 1);
  const athleteView = role() === "athlete";
  const dates = [...new Set(testsOf(a.id).map(r => r.date))].sort();
  return {title: athleteView ? "Gelişimim" : "Gelişim takibi", html: `
    ${pr ? `<div class="card row"><div class="grow"><div class="tiny muted">${pr.type === "focus" ? "Odak programı" : esc(sportById(pr.sport).n)} · hafta ${clamp(currentWeek(pr), 0, pr.weeks)}/${pr.weeks}</div><b>Antrenman devamlılığı</b><div class="small muted">${ad.done}/${ad.planned} seans</div><div class="bar mt"><i style="width:${clamp(currentWeek(pr) / pr.weeks * 100, 0, 100)}%"></i></div><div class="tiny muted">Program ilerlemesi</div></div>${ringSVG(ad.pct, "devam")}</div>` : ""}
    <div class="card"><h3>Periyodik değerlendirmeler</h3>${dates.length ? `<div class="chips">${dates.map((d, i) => pill((i === 0 ? "Başlangıç · " : "") + fmtD(d), i === dates.length - 1 ? "acc" : "")).join("")}</div>` : `<p class="small muted">Henüz test yok.</p>`}
      ${pr ? `<p class="small mt">Planlı değerlendirme haftaları: ${pr.testWeeks.map(w => `${w}. hafta (${fmtD(addDays(pr.startDate, (w - 1) * 7))})`).join(", ")}</p>` : ""}</div>
    ${cmp.length ? `<div class="card"><h3>İlk ve son değerlendirme karşılaştırması</h3><table class="tbl"><tr><th>Test</th><th class="r">İlk</th><th class="r">Son</th><th class="r">%</th></tr>${cmp.map(x => `<tr><td>${esc(x.t.n)}<div>${pill(x.c.verdict, x.c.cls)}</div></td><td class="r">${fmtN(x.c.v1, x.t.dec)}</td><td class="r"><b>${fmtN(x.c.v2, x.t.dec)}</b></td><td class="r">${x.c.pct != null ? (x.c.pct > 0 ? "+" : "") + fmtN(x.c.pct, 1) : "—"}</td></tr>`).join("")}</table>
      <p class="tiny muted">% değişim iyileşme yönünde pozitif gösterilir. Tipik ölçüm hatası ve test koşulu farklılıkları dikkate alınmıştır; çocuklarda büyüme ve olgunlaşma da performansı etkiler.</p></div>` : `<div class="card"><p class="small muted">Karşılaştırma için aynı testin en az iki ölçümü gerekir.</p></div>`}
    ${cmp.slice(0, 6).map(x => `<div class="card"><h3>${esc(x.t.n)} (${esc(x.t.u)})</h3>${lineChart([{color: COL.cur, points: x.rs.map(r => ({x: r.date, y: testValue(r)}))}], {dec: x.t.dec, labels: true})}<p class="tiny muted">${x.t.lb ? "Düşük değer daha iyi." : "Yüksek değer daha iyi."}</p></div>`).join("")}
    ${!athleteView && notImp.length ? `<div class="card"><h3>Gelişmeyen alanlar</h3><ul class="small" style="padding-left:18px">${notImp.map(x => `<li>${esc(x.t.n)}: ${esc(x.c.verdict)}</li>`).join("")}</ul></div>` : ""}
    ${!athleteView && cmp.length ? `<div class="card"><h3>Önerilen yeni hedefler</h3><ul class="small" style="padding-left:18px">${cmp.map(x => { const step = 2 * x.c.te; const tgt = x.t.lb ? x.c.v2 - step : x.c.v2 + step; return `<li>${esc(x.t.n)}: ${fmtN(tgt, x.t.dec)} ${x.t.u} (ölçüm hatasının 2 katı kadar gelişim)</li>`; }).join("")}</ul><a class="btn sm" href="#/a/${a.id}/goals">Hedefleri düzenle</a></div>` : ""}
    ${logs.length >= 2 ? `<div class="card"><h3>Seans zorluğu (RPE)</h3>${lineChart([{color: COL.blue, points: logs.map(l => ({x: l.date, y: l.rpe}))}], {dec: 0})}</div>` : ""}
    ${!athleteView ? `<div class="btns"><a class="btn" href="#/a/${a.id}/longterm">Uzun vadeli analiz</a><a class="btn pri" href="#/a/${a.id}/optimize">Program değişikliği önerileri</a></div>` : `<a class="btn block" href="#/a/${a.id}/radar">Atletik profilim</a>`}`};
});

/* ---------- Uzun vadeli gelişim ---------- */
route("/a/:aid/longterm", p => {
  const a = getA(p.aid), q = new URLSearchParams(CUR.query || ""), m = q.get("m") || "heightCm";
  const vars = [["heightCm", "Boy", "cm", 0, 1], ["weightKg", "Kilo", "kg", 0, 1]].concat(TESTS.filter(t => testsOf(a.id, t.id).length).map(t => [t.id, t.n, t.u, t.lb, t.dec]));
  const pts = k => TEST[k] ? testsOf(a.id, k).map(r => ({x: r.date, y: testValue(r)})) : measOf(a.id).filter(x => isNum(x[k])).map(x => ({x: x.date, y: x[k]}));
  const cur = vars.find(v => v[0] === m) || vars[0], tr = trend(pts(cur[0])), isBody = !TEST[cur[0]];
  let proj = [];
  if (!tr.insufficient && !isBody) { const last = tr.last.x; for (let i = 0; i <= 3; i++) { const x = addDays(last, i * 30), dd = daysBetween(tr.x0, x), y = tr.a0 + tr.b * dd; const band = tr.rsd * (1 + i * 0.35) + (TEST[cur[0]] ? teOf(TEST[cur[0]], y) : 0); proj.push({x, y, lo: y - band, hi: y + band}); } }
  const gv = growthVelocity(a.id);
  return {title: "Uzun vadeli gelişim", html: `${alertBox("info", "", "Bu modül geçmiş ölçümlerdeki eğilimleri inceler. Kesin gelecek performansı, profesyonel sporcu olma olasılığı veya yetişkin boyu tahmini yapılmaz. Yeterli veri yoksa tahmin üretilmez.")}
    ${field("Değişken", `<select class="in" id="ltSel">${vars.map(v => `<option value="${v[0]}" ${v[0] === cur[0] ? "selected" : ""}>${esc(v[1])}</option>`).join("")}</select>`)}
    <div class="card"><h3>${esc(cur[1])} (${esc(cur[2])})</h3>${lineChart([{color: COL.cur, points: pts(cur[0]), proj}], {dec: isBody ? 0 : cur[4], labels: true})}
      ${proj.length ? legend([[COL.cur, "Ölçümler"], [COL.cur, "Senaryo: eğilim sürerse (3 ay, belirsizlik bandıyla)", 1]]) : ""}
      <p class="small mt">${esc(isBody && cur[0] === "heightCm" ? (gv && !gv.insufficient ? `Büyüme hızı ${fmtN(gv.v, 1)} cm/yıl. ${gv.note} Boy için gelecek projeksiyonu yapılmaz.` : "Büyüme hızı için yeterli veri yok.") : trendText(cur[1], tr, cur[3], cur[2]))}</p>
      ${proj.length ? `<p class="tiny muted">Senaryo bir tahmin değildir; büyüme, olgunlaşma, antrenman ve ölçüm koşulları eğilimi değiştirebilir.</p>` : ""}</div>
    <h3>Tüm değişkenler</h3>${vars.map(v => { const t2 = trend(pts(v[0])); return `<div class="card flat" style="padding:11px"><b class="small">${esc(v[1])}</b><div class="small ${t2.insufficient ? "muted" : ""}">${esc(!TEST[v[0]] ? (t2.insufficient ? t2.why : `≈${fmtN(t2.slope30, 2)} ${v[2]}/ay (${t2.n} ölçüm, ${Math.round(t2.span / 30)} ay)`) : trendText(v[1], t2, v[3], v[2]))}</div></div>`; }).join("")}`};
});
document.addEventListener("change", e => { if (e.target.id === "ltSel") go(`#/a/${CUR.params.aid}/longterm?m=${e.target.value}`); });

/* ---------- Program optimizasyonu ---------- */
route("/a/:aid/optimize", p => {
  const a = getA(p.aid), pr = activeProgram(a.id);
  if (!pr) return {title: "Program optimizasyonu", html: empty("Aktif program yok.", "bolt") + (canEditProgram(a.id) ? `<a class="btn pri block" href="#/a/${a.id}/program/new">Program oluştur</a>` : "")};
  const o = optimize(a, pr), sp10 = testsOf(a.id, "sp10");
  return {title: "Program optimizasyonu", html: `${alertBox("info", "", "Öneriler test değişimleri (ölçüm hatası dikkate alınarak), devamlılık, algılanan zorluk, hazır oluş, ağrı bildirimleri ve yük verilerinden kural tabanlı üretilir. Çocuklarda program değişiklikleri antrenör onayından geçer.")}
    <div class="card"><div class="tiny muted">Aktif program</div><b>${pr.type === "focus" ? QN[pr.focusQ] + " odaklı" : esc(sportById(pr.sport).n)} · hafta ${clamp(o.cw, 0, pr.weeks)}/${pr.weeks}</b> ${pill(pr.status, pr.status === "onaylı" ? "ok" : "warn")}</div>
    ${sp10.length >= 2 ? `<div class="card"><h3>Örnek: 10 m sprint gelişimi</h3>${lineChart([{color: COL.cur, points: sp10.map(r => ({x: r.date, y: r.value}))}], {dec: 2, labels: true})}<p class="small">${sp10.map(r => `${fmtD(r.date)}: ${fmtN(r.value, 2)} s`).join(" → ")}</p><p class="small">${esc(compareResults(TEST.sp10, sp10[0], sp10[sp10.length - 1]).verdict)}.</p></div>` : ""}
    ${o.items.map(s => `<div class="card"><div class="row between"><b>${esc(s.title)}</b>${pill({ok: "olumlu", warn: "dikkat", bad: "önemli", info: "bilgi"}[s.kind], s.kind)}</div><p class="small">${esc(s.why)}</p>${s.action.type !== "none" && canEditProgram(a.id) ? `<button class="btn sm pri" data-act="optApply" data-pid="${pr.id}" data-id="${s.id}">${esc(s.label || "Uygula")}</button>` : ""}</div>`).join("")}`};
});
ACT.optApply = async el => {
  const pr = DB.programs.find(x => x.id === el.dataset.pid), a = getA(pr.athleteId), s = optimize(a, pr).items.find(x => x.id === el.dataset.id);
  if (!s) return; if (!await confirmBox(`“${s.label}” uygulansın mı? Değişiklik program kaydına gerekçesiyle eklenir.`, "Uygula")) return;
  if (applyOptimization(a, pr, s)) { toast("Uygulandı"); reRender(); }
};

/* ---------- Antrenör paneli ---------- */
route("/coach", () => {
  if (role() !== "coach") return {title: "Antrenör paneli", html: alertBox("warn", "Yetki yok", "Bu panel antrenörlere özeldir.")};
  const as = visibleAthletes(), t = todayISO();
  const rows = as.map(a => { const pr = activeProgram(a.id), ad = adherence(a.id, addDays(t, -27), t), lt = testsOf(a.id).slice(-1)[0], ls = loadSummary(a); return {a, pr, ad, lt, fl: ls.flags.filter(f => f.lv !== "info").length, st: devStage(a).stage}; });
  const myProgs = DB.programs.filter(p => canView(p.athleteId));
  const modified = myProgs.filter(p => p.changes.length).length, approvedClean = myProgs.filter(p => p.status === "onaylı" && !p.changes.length).length;
  const pf = DB.prefs || {avoid: {}, prefer: {}}, topAvoid = Object.entries(pf.avoid).sort((x, y) => y[1] - x[1]).slice(0, 5), topPrefer = Object.entries(pf.prefer).sort((x, y) => y[1] - x[1]).slice(0, 5);
  return {title: "Antrenör paneli", html: `<div class="menuGrid"><a class="mtile" href="#/athlete/new">${ic("plus")}Sporcu ekle</a><a class="mtile" href="#/groups">${ic("users")}Grup antrenmanı</a><a class="mtile" href="#/compare">${ic("chart")}Karşılaştır</a><a class="mtile" href="#/sports">${ic("compass")}Branşlar</a><a class="mtile" href="#/library">${ic("play")}Kütüphane</a><a class="mtile" href="#/members">${ic("shield")}Erişim</a></div>
    <h3>Sporcu durumu</h3>${rows.length ? `<div class="list">${rows.map(r => athleteCard(r.a, `<div class="center" style="min-width:58px">${r.fl ? pill(r.fl + " uyarı", "warn") : ""}<div class="tiny muted">evre ${r.st} · %${r.ad.pct ?? "—"}</div></div>`)).join("")}</div>` : empty("Sporcu yok.", "users")}
    <div class="card mt"><h3>Karar destek özeti</h3><dl class="kv"><dt>Toplam program</dt><dd>${myProgs.length}</dd><dt>Onay bekleyen</dt><dd>${myProgs.filter(p => p.status === "onay bekliyor").length}</dd><dt>Antrenörce değiştirilen</dt><dd>${modified}</dd><dt>Değişikliksiz onaylanan</dt><dd>${approvedClean}</dd></dl></div>
    <div class="card"><h3>Öğrenilen antrenör tercihleri</h3><p class="tiny muted">Motor, sık değiştirdiğiniz/sildiğiniz egzersizleri sonraki programlarda geri plana, sık seçtiklerinizi öne alır. Bu tercihler tıbbi onay veya bilimsel doğruluk kabul edilmez; güvenlik filtreleri her zaman önceliklidir.</p>
      ${topAvoid.length || topPrefer.length ? `<div class="grid2"><div><div class="tiny muted">Geri planda</div>${topAvoid.map(([id, n]) => `<div class="small">${esc((exById(id) || {n: id}).n)} (${n})</div>`).join("") || "—"}</div><div><div class="tiny muted">Öne alınan</div>${topPrefer.map(([id, n]) => `<div class="small">${esc((exById(id) || {n: id}).n)} (${n})</div>`).join("") || "—"}</div></div><button class="btn sm ghost mt" data-act="prefReset">Tercihleri sıfırla</button>` : `<p class="small muted">Henüz öğrenilmiş tercih yok.</p>`}</div>
    <h3>Son program kararları</h3><div class="card">${myProgs.flatMap(p => p.changes.map(c => ({p, c}))).sort((x, y) => y.c.at - x.c.at).slice(0, 10).map(x => `<div style="padding:6px 0;border-bottom:1px solid var(--line)"><div class="tiny muted">${fmtDT(x.c.at)} · ${esc(getA(x.p.athleteId).name)}</div><div class="small">${esc(x.c.what)}</div><div class="tiny muted">${esc(x.c.reason)}</div></div>`).join("") || `<p class="small muted">Kayıt yok.</p>`}</div>`};
});
ACT.prefReset = () => { DB.prefs = {avoid: {}, prefer: {}}; save(); reRender(); };

/* ---------- Veli paneli ---------- */
route("/parent", () => {
  const as = visibleAthletes();
  if (role() !== "parent") return {title: "Veli paneli", html: alertBox("warn", "", "Bu panel velilere özeldir.")};
  return {title: "Veli paneli", html: as.length ? as.map(a => {
    const t = todayISO(), next = plannedSessions(a.id, t, addDays(t, 13)), ad = adherence(a.id, addDays(t, -27), t);
    const cms = DB.comments.filter(c => c.athleteId === a.id && (c.vis || []).includes("parent")).sort((x, y) => y.at - x.at).slice(0, 3);
    return `<div class="card acc"><div class="row"><div class="avatar">${esc(initials(a.name))}</div><div class="grow"><b>${esc(a.name)}</b><div class="small muted">${Math.floor(ageAt(a.birthDate))} yaş · ${esc((sportById(a.primarySport) || {n: ""}).n)}</div></div>${ringSVG(ad.pct, "4 hafta")}</div></div>
      <h3>Önümüzdeki 2 hafta</h3>${next.length ? `<div class="list">${next.slice(0, 6).map(x => li(`#/a/${a.id}/session/${x.p.id}/${x.wk.w}/${x.s.d}`, "cal", `${DOWL[x.s.dow]} ${fmtD(x.s.date)}`, esc(x.s.title), logOf(x.p.id, x.wk.w, x.s.d) ? pill("yapıldı", "ok") : "")).join("")}</div>` : `<p class="small muted">Planlı seans yok.</p>`}
      <h3>Antrenör yorumları</h3>${cms.length ? cms.map(c => `<div class="card flat" style="padding:11px"><div class="tiny muted">${esc(c.byName)} · ${fmtDT(c.at)}</div>${esc(c.text)}</div>`).join("") : `<p class="small muted">Yorum yok.</p>`}
      <div class="menuGrid mt"><a class="mtile" href="#/a/${a.id}/calendar">${ic("cal")}Takvim</a><a class="mtile" href="#/a/${a.id}/progress">${ic("trend")}Gelişim</a><a class="mtile" href="#/a/${a.id}/report">${ic("doc")}Raporlar</a><a class="mtile" href="#/a/${a.id}/consents">${ic("shield")}İzinler</a><a class="mtile" href="#/a/${a.id}/health">${ic("heart")}Sağlık</a><a class="mtile" href="#/a/${a.id}/load">${ic("chart")}Yük</a></div><div class="hr"></div>`;
  }).join("") : empty("Bağlı çocuk profili yok.", "users")};
});

/* ---------- Grup antrenmanı ---------- */
route("/groups", () => {
  if (role() !== "coach") return {title: "Gruplar", html: alertBox("warn", "", "Yalnızca antrenör.")};
  const gs = DB.groups.filter(g => g.athleteIds.some(canView));
  return {title: "Grup antrenmanları", html: `<form class="card" data-form="groupAdd"><h3>Yeni grup</h3>${field("Grup adı", inp("name", "", 'required placeholder="ör. U14 Basketbol"'))}${field("Sporcular", `<div class="chips">${visibleAthletes().map(a => `<label class="chip" data-toggle><input type="checkbox" name="ids" data-multi="1" value="${a.id}">${esc(a.name)}</label>`).join("")}</div>`)}<button class="btn pri sm" type="submit">Grubu oluştur</button></form>
    ${gs.length ? `<div class="list">${gs.map(g => li("#/groups/" + g.id, "users", esc(g.name), g.athleteIds.length + " sporcu · " + (g.sessions || []).length + " seans")).join("")}</div>` : empty("Grup yok.", "users")}`};
});
FORM.groupAdd = d => { if (!(d.ids || []).length) throw new Error("En az bir sporcu seçin."); DB.groups.push({id: uid("gr_"), name: d.name.trim(), athleteIds: d.ids, sessions: [], by: S.me.id}); save(); reRender(); };
route("/groups/:gid", p => {
  const g = DB.groups.find(x => x.id === p.gid); if (!g) return {title: "Grup", html: empty("Bulunamadı")};
  const as = g.athleteIds.map(getA).filter(Boolean), hl = as.filter(a => holds(a.id).length);
  return {title: g.name, html: `<div class="card"><h3>Üyeler</h3>${as.map(a => `<div class="row" style="padding:5px 0"><span class="avatar sm">${esc(initials(a.name))}</span><span class="grow small">${esc(a.name)} · evre ${devStage(a).stage}</span>${holds(a.id).length ? pill("onay bekliyor", "bad") : ""}</div>`).join("")}</div>
    ${hl.length ? alertBox("bad", "Katılamaz", hl.map(a => esc(a.name)).join(", ") + ": tıbbi onay/değerlendirme bekleniyor; grup seansına dahil edilmez.") : ""}
    <form class="card" data-form="groupSess" data-gid="${g.id}"><h3>Grup seansı oluştur</h3><p class="tiny muted">Seans, gruptaki tüm sporcuların sağlık kısıtlamalarının birleşimine ve en düşük gelişim evresine göre güvenli şekilde oluşturulur.</p>
      <div class="grid2">${field("Branş", sel("sport", allSports().map(s => [s.id, s.n]), as[0] && as[0].primarySport || "basketball"))}${field("Süre", sel("minutes", [["45", "45 dk"], ["60", "60 dk"], ["75", "75 dk"]], "60"))}</div>${field("Odak", sel("focus", [["", "Branş önceliği"]].concat(QUALITIES.map(q => [q.k, q.n]))))}
      ${field("Tarih", inp("date", todayISO(), 'type="date"'))}${field("Ortam", sel("env", Object.entries(ENVS).map(([k, v]) => [k, v.n]), "school", 'id="envSel"'))}<label class="check"><input type="checkbox" name="space" id="spaceChk" checked><span class="small">Koşu alanı var</span></label>${field("Ekipman", envEqChips("school"))}
      <button class="btn pri block" type="submit">Seansı oluştur</button></form>
    ${(g.sessions || []).slice().reverse().map((s, i) => `<div class="card"><div class="row between"><b>${fmtD(s.date)} · ${esc(s.title)}</b>${s.att ? pill(Object.values(s.att).filter(Boolean).length + " katıldı", "ok") : ""}</div>${s.notes.map(n => `<div class="tiny" style="color:var(--warn)">• ${esc(n)}</div>`).join("")}
      ${s.blocks.map(b => `<div class="blockh">${esc(b.n)}</div>${b.items.map(it => `<div class="small" style="padding:3px 0"><a href="#/ex/${it.e}">${esc(exById(it.e).n)}</a> <span class="muted tiny">${exDose(it)}</span></div>`).join("")}`).join("")}
      ${s.att ? "" : `<form data-form="groupAtt" data-gid="${g.id}" data-sid="${s.id}" class="mt"><div class="tiny muted">Katılım ve RPE</div>${as.filter(a => !holds(a.id).length).map(a => `<div class="row" style="padding:4px 0"><label class="check grow" style="padding:0"><input type="checkbox" name="att_${a.id}" checked><span class="small">${esc(a.name)}</span></label>${sel("rpe_" + a.id, Array.from({length: 11}, (_, i) => String(i)), "6", 'style="width:84px;min-height:40px;padding:6px 26px 6px 10px"')}</div>`).join("")}<button class="btn sm pri" type="submit">Katılımı kaydet</button></form>`}</div>`).join("")}`};
});
FORM.groupSess = (d, f) => {
  const g = DB.groups.find(x => x.id === f.dataset.gid), as = g.athleteIds.map(getA).filter(a => a && !holds(a.id).length);
  if (!as.length) throw new Error("Uygun sporcu yok.");
  const restr = new Set(), notes = []; as.forEach(a => restrictions(a.id).forEach(t => restr.add(t)));
  const stages = as.map(a => devStage(a)), stage = Math.min(...stages.map(s => s.stage));
  const sp = sportById(d.sport), ctx = {aid: g.id, stage, restr, eq: new Set(d.eq || []), space: !!d.space, growthRapid: stages.some(s => s.gv && s.gv.rapid), sport: sp, seed: d.date};
  if (restr.size) notes.push("Grup kısıtlamaları: " + [...restr].map(t => RTAGS[t]).join(", "));
  as.forEach((a, i) => { if (stages[i].gv && stages[i].gv.rapid) notes.push(`${a.name}: hızlı büyüme — sıçrama tekrarlarını yarıya indirin.`); if (stages[i].stage > stage + 1) notes.push(`${a.name}: daha ileri evrede — zorlaştırılmış versiyonları uygulayabilir.`); });
  const focus = d.focus ? [d.focus, relatedQ(d.focus)] : sp.focus.slice(0, 2);
  const s = buildSession(ctx, {minutes: +d.minutes, type: "main"}, {key: "spec", block: 0, wib: 0, mult: 1}, 0, focus, []);
  g.sessions = g.sessions || []; g.sessions.push(Object.assign({id: uid("gs_"), date: d.date, title: focus.map(q => QN[q]).join(" + "), notes}, s));
  audit("Grup seansı oluşturuldu", null, g.name); save(); reRender();
};
FORM.groupAtt = (d, f) => {
  const g = DB.groups.find(x => x.id === f.dataset.gid), s = g.sessions.find(x => x.id === f.dataset.sid); s.att = {};
  g.athleteIds.forEach(id => { if (d["att_" + id]) { s.att[id] = true; const rpe = num(d["rpe_" + id]); DB.extLoads.push({id: uid("x_"), athleteId: id, type: "Grup antrenmanı: " + g.name, date: s.date, duration: s.estMin, rpe, load: Math.round(rpe * s.estMin), by: S.me.name}); } });
  save(); toast("Katılım ve yük kaydedildi"); reRender();
};

/* ---------- Sporcu karşılaştırma (antrenör) ---------- */
let CMP = [];
route("/compare", () => {
  if (role() !== "coach") return {title: "Karşılaştırma", html: alertBox("warn", "", "Yalnızca antrenör karar desteği içindir.")};
  const as = visibleAthletes(); CMP = CMP.filter(id => canView(id));
  const cols = [COL.cur, COL.tgt, COL.blue, COL.bad], sel0 = CMP.map(getA);
  const scs = sel0.map(a => qualityScores(a));
  return {title: "Sporcu karşılaştırma", html: `${alertBox("info", "", "Karşılaştırma yalnızca antrenörün planlama kararları içindir; çocuklarla paylaşılmaz ve sıralama/rekabet amacıyla kullanılmamalıdır. Farklı olgunlaşma düzeyleri sonuçları etkiler.")}
    <div class="chips">${as.map(a => `<button class="chip ${CMP.includes(a.id) ? "on" : ""}" data-act="cmpT" data-id="${a.id}">${esc(a.name)}</button>`).join("")}</div>
    ${sel0.length ? `<div class="card mt">${radarSVG(QUALITIES, sel0.map((a, i) => ({name: a.name, color: cols[i], values: Object.fromEntries(QUALITIES.map(q => [q.k, scs[i][q.k].score])), dot: 3})))}${legend(sel0.map((a, i) => [cols[i], a.name]))}</div>
      <div class="card"><table class="tbl"><tr><th>Özellik</th>${sel0.map(a => `<th class="r">${esc(a.name.split(" ")[0])}</th>`).join("")}</tr>${QUALITIES.map(q => `<tr><td>${q.n}</td>${scs.map(s => `<td class="r">${s[q.k].score ?? "—"}</td>`).join("")}</tr>`).join("")}<tr><td>Olgunlaşma ofseti</td>${sel0.map(a => { const m = maturity(a); return `<td class="r">${m && isNum(m.mo) ? fmtN(m.mo, 1) : "—"}</td>`; }).join("")}</tr></table></div>` : `<p class="small muted mt">En fazla 4 sporcu seçin.</p>`}`};
});
ACT.cmpT = el => { const id = el.dataset.id; CMP = CMP.includes(id) ? CMP.filter(x => x !== id) : CMP.concat(id).slice(-4); reRender(); };

/* ---------- Raporlar ---------- */
let REP = {aud: null, note: ""};
route("/a/:aid/report", p => {
  const a = getA(p.aid), r = role();
  const auds = r === "athlete" ? [["athlete", "Sporcu"]] : r === "parent" ? [["parent", "Veli"], ["athlete", "Sporcu"]] : [["coach", "Antrenör"], ["parent", "Veli"], ["athlete", "Sporcu"]];
  if (!REP.aud || !auds.some(x => x[0] === REP.aud)) REP.aud = auds[0][0];
  return {title: "PDF raporları", html: `<div class="seg">${auds.map(([k, n]) => `<button class="${REP.aud === k ? "on" : ""}" data-act="repAud" data-k="${k}">${n} raporu</button>`).join("")}</div>
    ${r === "coach" ? field("Antrenör değerlendirmesi (rapora eklenir)", `<textarea class="in" id="repNote">${esc(REP.note)}</textarea>`) : ""}
    <div class="btns" style="margin-top:0;margin-bottom:12px"><button class="btn pri" data-act="repPrint" data-aid="${a.id}">${ic("doc")} PDF olarak kaydet / yazdır</button><button class="btn" data-act="repHtml" data-aid="${a.id}">HTML indir</button></div>
    <p class="tiny muted">“PDF olarak kaydet”: açılan yazdırma ekranında hedef olarak “PDF olarak kaydet” seçin (iOS: Paylaş → Yazdır → iki parmakla büyüt → Kaydet).</p>
    <div class="card" style="background:#fff;color:#111"><div id="repPrev" style="font-size:13px">${reportHTML(a, REP.aud)}</div></div>`};
});
ACT.repAud = el => { REP.aud = el.dataset.k; const n = $("#repNote"); if (n) REP.note = n.value; reRender(); };
function reportHTML(a, aud) {
  const n = $("#repNote"); if (n) REP.note = n.value;
  const an = anth(a.id), ds = devStage(a), qs = qualityScores(a), prev = qualityScores(a, "previous"), tgt = targetScores(a, qs), sp = sportById(a.primarySport);
  const pr = activeProgram(a.id) || programsOf(a.id).find(x => x.status === "onaylı" || x.status === "arşiv"), ad = pr ? adherence(a.id, pr.startDate, todayISO()) : null;
  const ranked = rankSports(a).slice(0, 5), showHealth = aud !== "athlete" && canSeeHealth(a.id) && (aud === "parent" || consent(a.id, "shareCoach"));
  const all = testsOf(a.id), firstDate = all.length ? all[0].date : null;
  const tst = TESTS.filter(t => testsOf(a.id, t.id).length).map(t => { const rs = testsOf(a.id, t.id); return {t, f: rs[0], l: rs[rs.length - 1], c: rs.length > 1 ? compareResults(t, rs[0], rs[rs.length - 1]) : null, rs}; });
  const strengths = QUALITIES.filter(q => isNum(qs[q.k].score) && qs[q.k].score >= 60), devs = QUALITIES.filter(q => isNum(qs[q.k].score) && qs[q.k].score < 45);
  const cms = DB.comments.filter(c => c.athleteId === a.id && (aud === "coach" || (c.vis || []).includes(aud))).sort((x, y) => y.at - x.at).slice(0, 3);
  const H = (t) => `<h2 style="font-size:15px;margin:16px 0 6px;color:#0B1426;border-bottom:2px solid #22D3C5;padding-bottom:3px">${t}</h2>`;
  const tb = `style="width:100%;border-collapse:collapse;font-size:12px"`, td = `style="border-bottom:1px solid #dde;padding:4px"`;
  const radar = radarSVG(QUALITIES, [{color: "#0E9F94", values: Object.fromEntries(QUALITIES.map(q => [q.k, qs[q.k].score])), fill: .15}, {color: "#8391AB", values: Object.fromEntries(QUALITIES.map(q => [q.k, prev[q.k].score])), dash: "5 4", dot: 2}, {color: "#D97706", values: tgt, dash: "2 4", dot: 2}], {size: 320}).replace(/var\(--line\)/g, "#ccd").replace(/var\(--ink2\)/g, "#333").replace(/var\(--ink3\)/g, "#777").replace(/var\(--acc\)/g, "#0E9F94");
  const goals = (a.goals || []).filter(g => !g.done);
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><div style="font-size:11px;color:#667">RUSH ATHLETIC · ${{coach: "Antrenör", parent: "Veli", athlete: "Sporcu"}[aud]} raporu</div><h1 style="font-size:20px;margin:2px 0">${esc(a.name)}</h1><div style="font-size:12px;color:#445">${fmtD(todayISO())} · ${esc(DB.ws.name)}</div></div><div style="font-size:11px;color:#667;text-align:right">Gizli — yalnızca yetkili kişiler</div></div>
    ${H("Sporcu profili")}<table ${tb}>${[["Yaş", fmtN(ageAt(a.birthDate), 1)], ["Cinsiyet", a.sex === "K" ? "Kız" : "Erkek"], ["Branş / pozisyon", sp ? sp.n + (a.position ? " · " + ((sp.pos.find(x => x.id === a.position) || {}).n || "") : "") : "—"], ["Seviye", a.level || "—"], ["Spor geçmişi", (a.trainingYears ?? "—") + " yıl"], ["Gelişim evresi", ds.stage + "/6 — " + ds.n]].map(([k, v]) => `<tr><td ${td}>${k}</td><td ${td}><b>${esc(v)}</b></td></tr>`).join("")}</table>
    ${H("Fiziksel özellikler")}<table ${tb}>${[["Boy", an.heightCm, "cm"], ["Kilo", an.weightKg, "kg"], ["Oturma boyu", an.sittingHeightCm, "cm"], ["Kol açıklığı", an.armSpanCm, "cm"], ["Baskın el / ayak", null, (a.dominantHand || "") + " / " + (a.dominantFoot || "")]].map(([k, v, u]) => `<tr><td ${td}>${k}</td><td ${td}>${v == null ? esc(u) : fmtN(v, 1) + " " + u}</td></tr>`).join("")}${ds.mat && isNum(ds.mat.mo) ? `<tr><td ${td}>Tahmini olgunlaşma</td><td ${td}>${fmtN(ds.mat.mo, 1)} yıl (${esc(ds.mat.status)}) — tahmini, tıbbi veri değildir</td></tr>` : ""}</table>
    ${H("Atletik radar grafiği")}<div style="max-width:330px;margin:0 auto">${radar}</div><div style="font-size:11px;color:#556;text-align:center">Turkuaz: mevcut · gri: önceki · turuncu: hedef · “veri yok” = test yapılmadı</div>
    ${aud !== "athlete" && ranked.length ? H("Branş uygunluk analizi") + `<table ${tb}>${ranked.map((x, i) => `<tr><td ${td}>${i + 1}. ${esc(x.sp.n)}</td><td ${td}>${x.fit.score}</td><td ${td} style="font-size:11px">${esc(x.fit.conf)}</td></tr>`).join("")}</table><div style="font-size:10.5px;color:#667">Uygunluk puanı yetenek veya profesyonel sporcu olma ihtimali göstergesi değildir.</div>` : ""}
    ${H("Performans testleri ve karşılaştırma")}${firstDate ? `<div style="font-size:11.5px">İlk değerlendirme: ${fmtD(firstDate)}</div>` : ""}<table ${tb}><tr><th ${td}>Test</th><th ${td}>İlk</th><th ${td}>Son</th><th ${td}>Değişim</th>${aud !== "athlete" ? `<th ${td}>Puan</th>` : ""}</tr>${tst.map(x => `<tr><td ${td}>${esc(x.t.n)} (${x.t.u})</td><td ${td}>${fmtN(testValue(x.f), x.t.dec)}</td><td ${td}><b>${fmtN(testValue(x.l), x.t.dec)}</b></td><td ${td} style="font-size:11px">${x.c ? (x.c.pct != null ? (x.c.pct > 0 ? "+" : "") + fmtN(x.c.pct, 1) + "% · " : "") + esc(x.c.verdict) : "tek ölçüm"}</td>${aud !== "athlete" ? `<td ${td}>${scoreResult(a, x.l) ?? "—"}</td>` : ""}</tr>`).join("")}</table>
    ${tst.filter(x => x.rs.length >= 2).slice(0, 3).map(x => `<div style="margin-top:6px"><div style="font-size:12px;font-weight:700">${esc(x.t.n)} gelişimi</div>${lineChart([{color: "#0E9F94", points: x.rs.map(r => ({x: r.date, y: testValue(r)}))}], {dec: x.t.dec, labels: true, h: 150}).replace(/var\(--line\)/g, "#dde")}</div>`).join("")}
    ${H("Güçlü yönler ve gelişim alanları")}<div style="font-size:12.5px"><b>Güçlü:</b> ${strengths.map(q => q.n).join(", ") || "—"}<br><b>Gelişim alanları:</b> ${devs.map(q => q.n).join(", ") || "—"}</div>
    ${pr ? H("Uygulanan program") + `<div style="font-size:12.5px">${pr.type === "focus" ? QN[pr.focusQ] + " odaklı" : esc(sportById(pr.sport).n)} · ${pr.weeks} hafta · ${pr.spw}×${pr.minutes} dk · ${fmtD(pr.startDate)} başlangıç<br>${pr.blocks.map(b => `${b.from}–${b.to}. hf: ${esc(b.name)}`).join(" · ")}</div>` + H("Antrenman devamlılığı") + `<div style="font-size:12.5px">${ad.done}/${ad.planned} planlı seans tamamlandı (%${ad.pct ?? "—"}).</div>` : ""}
    ${H("Sonraki dönem hedefleri")}${goals.length ? `<ul style="font-size:12.5px;padding-left:18px">${goals.map(g => `<li>${esc(g.text)}${g.date ? " (" + fmtD(g.date) + ")" : ""}</li>`).join("")}</ul>` : `<div style="font-size:12.5px">Hedefler antrenörle birlikte belirlenecek.</div>`}
    ${showHealth ? H("Sağlık ve kısıtlamalar (gizli)") + `<div style="font-size:12px">${healthOf(a.id).filter(h => h.status !== "geçmiş").map(h => `• ${esc(h.title)} (${esc(h.status)})${h.requiresClearance ? (h.clearanceGiven ? " — uzman onayı var" : " — uzman onayı bekleniyor") : ""}`).join("<br>") || "Aktif kayıt yok."}<br>Kısıtlamalar: ${[...restrictions(a.id)].map(t => RTAGS[t]).join(", ") || "yok"}</div>` : ""}
    ${H("Antrenör değerlendirmesi")}<div style="font-size:12.5px">${REP.note && aud !== "athlete" ? esc(REP.note) + "<br>" : ""}${cms.map(c => `“${esc(c.text)}” — ${esc(c.byName)}, ${fmtD(isoOf(new Date(c.at)))}`).join("<br>") || (REP.note ? "" : "—")}</div>
    <div style="font-size:10px;color:#778;margin-top:14px;border-top:1px solid #dde;padding-top:6px">Bu rapor açıklanabilir kural tabanlı bir sistemle hazırlanmıştır; tıbbi teşhis içermez. Referans değerler yaklaşık popülasyon değerleridir. Gerçek sporcu programları bireysel değerlendirme ve uzman onayı gerektirir.</div></div>`;
}
ACT.repPrint = el => { const a = getA(el.dataset.aid); $("#printArea").innerHTML = reportHTML(a, REP.aud); audit("Rapor yazdırıldı/PDF", a.id, REP.aud); const t = document.title; document.title = `Rush-Athletic-${a.name.replace(/\s+/g, "-")}-${REP.aud}-${todayISO()}`; setTimeout(() => { window.print(); document.title = t; }, 60); };
ACT.repHtml = el => { const a = getA(el.dataset.aid); audit("Rapor indirildi (HTML)", a.id, REP.aud); download(`rapor-${a.name.replace(/\s+/g, "-")}-${REP.aud}-${todayISO()}.html`, `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(a.name)} raporu</title><style>body{margin:16px;max-width:760px}@media print{body{margin:0}}</style></head><body>${reportHTML(a, REP.aud)}</body></html>`, "text/html"); };

/* ---------- Bildirimler ---------- */
const NIC = {training: "bolt", test: "flask", milestone: "target", comment: "doc", summary: "chart", load: "chart", program: "doc", health: "heart", goal: "target", video: "video", season: "cal"};
route("/notifications", () => {
  const ns = myNotifs();
  afterRender.push(() => { let ch = false; ns.forEach(n => { if (!n.readBy[S.me.id]) { n.readBy[S.me.id] = Date.now(); ch = true; } }); if (ch) save(); });
  return {title: "Bildirimler", html: `<div class="btns" style="margin-top:0;margin-bottom:12px"><button class="btn sm" data-act="notifPerm">Telefon bildirimlerine izin ver</button><button class="btn sm" data-act="notifRun">Yenile</button></div>
    ${ns.length ? `<div class="list">${ns.slice(0, 100).map(n => `<a class="li" href="${n.athleteId && canView(n.athleteId) ? "#/a/" + n.athleteId + (n.type === "test" ? "/tests" : n.type === "load" ? "/load" : n.type === "training" ? "/calendar" : n.type === "video" ? "/video" : "") : "#/home"}"><div class="ic">${ic(NIC[n.type] || "bell")}</div><div class="grow"><div class="t" style="${n.readBy[S.me.id] ? "" : "color:var(--acc)"}">${esc(n.title)}</div><div class="s">${esc(n.body)}</div><div class="tiny muted">${fmtDT(n.at)}</div></div></a>`).join("")}</div>` : empty("Bildirim yok.", "bell")}
    <p class="tiny muted mt">Bildirimler uygulama açıkken oluşturulur. Uygulama kapalıyken anlık (push) bildirim için sunucu altyapısı gerekir — henüz yok.</p>`};
});
ACT.notifPerm = async () => { if (!("Notification" in window)) { toast("Bu tarayıcı bildirimleri desteklemiyor (iOS'ta uygulamayı ana ekrana ekleyin)."); return; } const r = await Notification.requestPermission(); mySettings().sysNotif = r === "granted"; save(); toast(r === "granted" ? "Bildirim izni verildi" : "İzin verilmedi"); };
ACT.notifRun = () => { runScheduler(true); reRender(); };

/* ---------- Ayarlar ---------- */
let INSTALL_EVT = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); INSTALL_EVT = e; });
route("/settings", () => {
  const s = mySettings(), standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  let used = 0; try { for (const k in localStorage) if (k.startsWith("rush.")) used += (localStorage.getItem(k) || "").length; } catch (e) {}
  return {title: "Kullanıcı ayarları", html: `<form class="card" data-form="settings"><h3>Profil</h3>${field("Ad soyad", inp("name", S.me.name, "required"))}
    <h3>Görünüm</h3><div class="grid2">${field("Tema", sel("theme", [["dark", "Koyu"], ["light", "Açık"]], s.theme))}${field("Yazı boyutu", sel("text", [["normal", "Normal"], ["large", "Büyük"]], s.text))}</div>
    <h3>Bildirimler</h3><label class="check"><input type="checkbox" name="remind" ${s.remind ? "checked" : ""}><span class="small">Antrenman ve test hatırlatmaları</span></label><label class="check"><input type="checkbox" name="sysNotif" ${s.sysNotif ? "checked" : ""}><span class="small">Telefon bildirimi göster (izin gerekir)</span></label>
    <h3>Güvenlik</h3>${field("Otomatik kilit", sel("autoLock", [["0", "Kapalı"], ["5", "5 dk arka planda"], ["10", "10 dk"], ["30", "30 dk"]], String(s.autoLock)), "“Oturumu açık tut” seçiliyse otomatik kilit uygulanmaz.")}
    <h3>Harici AI sunucusu (opsiyonel)</h3>${field("Sunucu adresi (HTTPS)", inp("aiUrl", s.aiUrl, 'type="url" placeholder="https://sunucunuz.example/api/ai"'), "AI anahtarları istemcide tutulmaz; kendi sunucunuz anahtarı güvenli şekilde saklamalıdır. Uygulama yalnızca anonim özet (ad içermez) gönderir.")}
    <button class="btn pri block" type="submit">Kaydet</button></form>
    <form class="card" data-form="pw"><h3>Şifre değiştir</h3>${field("Mevcut şifre", inp("old", "", 'type="password" required autocomplete="current-password"'))}${field("Yeni şifre", inp("n1", "", 'type="password" minlength="8" required autocomplete="new-password"'))}${field("Yeni şifre tekrar", inp("n2", "", 'type="password" minlength="8" required autocomplete="new-password"'))}<button class="btn block" type="submit">Şifreyi değiştir</button></form>
    <div class="card"><h3>Uygulamayı telefona yükle</h3>${standalone ? `<p class="small">${pill("Yüklü", "ok")} Uygulama ana ekrandan çalışıyor.</p>` : `<p class="small"><b>iPhone (Safari):</b> Paylaş ⬆︎ → “Ana Ekrana Ekle”.<br><b>Android (Chrome):</b> ⋮ menü → “Uygulamayı yükle” / “Ana ekrana ekle”.</p>${INSTALL_EVT ? `<button class="btn pri block" data-act="install">Şimdi yükle</button>` : ""}`}
      <p class="tiny muted">Sürüm ${APP_VERSION} · ${ENGINE_VERSION} · yerel veri ≈ ${(used / 1024).toFixed(0)} KB</p><button class="btn sm" data-act="swUpdate">Güncellemeleri denetle</button></div>`};
});
FORM.settings = d => { const s = mySettings(); S.me.name = d.name.trim() || S.me.name; Object.assign(s, {theme: d.theme, text: d.text, remind: d.remind, sysNotif: d.sysNotif, autoLock: +d.autoLock, aiUrl: d.aiUrl.trim()}); if (s.aiUrl && !/^https:\/\//.test(s.aiUrl)) throw new Error("AI sunucu adresi https:// ile başlamalı."); applyPrefs(); save(); toast("Ayarlar kaydedildi"); reRender(); };
FORM.pw = async d => { if (d.n1 !== d.n2) throw new Error("Yeni şifreler eşleşmiyor."); if (d.n1.length < 8) throw new Error("En az 8 karakter."); await changePassword(d.old, d.n1); lsDel(REM_KEY); toast("Şifre değiştirildi"); reRender(); };
ACT.install = async () => { if (!INSTALL_EVT) return; INSTALL_EVT.prompt(); await INSTALL_EVT.userChoice; INSTALL_EVT = null; reRender(); };
ACT.swUpdate = async () => { try { const r = await navigator.serviceWorker.getRegistration(); if (r) { await r.update(); toast("Güncelleme denetlendi; yeni sürüm varsa yeniden açılışta etkinleşir."); } else toast("Hizmet çalışanı yok (yerel dosya modu)."); } catch (e) { toast("Denetlenemedi"); } };

/* ---------- Veri ve gizlilik ---------- */
let AUDF = "";
route("/privacy", () => {
  const as = visibleAthletes(), logs = DB.audit.filter(x => !AUDF || x.athleteId === AUDF).slice(-150).reverse();
  const canExport = S.me.admin || role() === "parent";
  return {title: "Veri ve gizlilik", html: `<div class="card"><h3>KVKK aydınlatma özeti</h3><ul class="small" style="padding-left:18px">
      <li><b>Veri sorumlusu:</b> ${esc(DB.ws.name)} (çalışma alanı yöneticisi).</li><li><b>Amaç:</b> yalnızca atletik performans değerlendirmesi, güvenli program oluşturma ve gelişim takibi.</li>
      <li><b>Saklama:</b> veriler yalnızca bu cihazda, AES-256-GCM ile şifreli; anahtar her kullanıcının şifresinden PBKDF2 (150.000 tekrar) ile türetilir. Sunucuya gönderim yoktur.</li>
      <li><b>Erişim:</b> rol bazlı; antrenör sağlık ayrıntılarını yalnızca veli izniyle görür.</li><li><b>Haklar:</b> erişim, dışa aktarma, düzeltme ve silme bu ekrandan kullanılabilir.</li>
      <li>Çocuk verileri reklam, pazarlama veya izinsiz profil oluşturma amacıyla <b>kullanılmaz</b>.</li></ul></div>
    <div class="card"><h3>İzinler (fotoğraf, video, sağlık)</h3>${as.length ? `<div class="list">${as.map(a => li(`#/a/${a.id}/consents`, "shield", esc(a.name), Object.keys(CONSENT_N).filter(k => consent(a.id, k)).length + "/" + Object.keys(CONSENT_N).length + " izin verildi")).join("")}</div>` : `<p class="small muted">Sporcu yok.</p>`}</div>
    <div class="card"><h3>Veri dışa aktarma ve yedek</h3>${canExport ? `<button class="btn block" data-act="expJson">Okunabilir dışa aktarma (JSON)</button><p class="tiny muted">Şifresiz dosyadır; güvenli saklayın.</p><button class="btn block mt" data-act="expVault">Şifreli yedek indir</button><label class="btn block mt">Şifreli yedeği geri yükle<input type="file" accept=".json,application/json" id="impVault" style="display:none"></label><p class="tiny muted">Videolar yedeğe dahil değildir.</p>` : `<p class="small muted">Dışa aktarma yöneticiye veya veliye açıktır.</p>`}</div>
    <div class="card"><h3>Veri silme</h3>${as.length && role() !== "athlete" ? `<p class="small">Bir sporcunun tüm verilerini silmek için profil sayfasındaki “Sporcu profilini sil” düğmesini kullanın.</p>` : ""}
      ${S.me.admin ? `<button class="btn danger block" data-act="wipeWs">Çalışma alanını ve tüm verileri sil</button>` : `<button class="btn danger block" data-act="wipeMe">Hesabımı bu cihazdan kaldır</button>`}</div>
    <div class="card"><h3>Veri işleme kayıtları</h3>${field("Filtre", `<select class="in" id="audF"><option value="">Tümü</option>${as.map(a => `<option value="${a.id}" ${AUDF === a.id ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</select>`)}
      ${role() === "athlete" ? `<p class="small muted">Kayıtları yönetici ve veliler görebilir.</p>` : `<table class="tbl">${logs.map(l => `<tr><td class="tiny">${fmtDT(l.at)}</td><td class="small">${esc(l.action)}${l.athleteId && getA(l.athleteId) ? ` <span class="muted">· ${esc(getA(l.athleteId).name)}</span>` : ""}<div class="tiny muted">${esc(l.byName)}${l.detail ? " · " + esc(l.detail) : ""}</div></td></tr>`).join("")}</table>`}</div>`};
});
document.addEventListener("change", async e => {
  if (e.target.id === "audF") { AUDF = e.target.value; reRender(); }
  if (e.target.id === "impVault" && e.target.files[0]) {
    try { const v = JSON.parse(await e.target.files[0].text()); if (!v || v.v !== 1 || !v.wsId || !v.users || !v.data) throw new Error("Geçersiz yedek dosyası");
      if (!await confirmBox(`“${v.wsName}” yedeği bu cihaza geri yüklensin mi? Aynı çalışma alanı varsa üzerine yazılır. Yedekteki şifrelerle giriş yapılır.`, "Geri yükle", true)) return;
      vaultPut(v.wsId, v); await flushSave(); logout(); toast("Yedek yüklendi. Lütfen giriş yapın."); go("#/login");
    } catch (err) { toast("Yedek yüklenemedi: " + err.message); }
  }
});
ACT.expJson = () => { const as = visibleAthletes().map(a => a.id); const pick = arr => arr.filter(x => !x.athleteId || as.includes(x.athleteId)); const out = {exportedAt: new Date().toISOString(), app: "Rush Athletic " + APP_VERSION, workspace: DB.ws.name, athletes: DB.athletes.filter(a => as.includes(a.id))}; ["measurements", "health", "tests", "programs", "logs", "extLoads", "videos", "comments", "consents"].forEach(k => out[k] = pick(DB[k])); if (role() === "coach") out.health = out.health.filter(h => canSeeHealth(h.athleteId)); audit("Veri dışa aktarıldı (JSON)", null, ""); download(`rush-athletic-veri-${todayISO()}.json`, JSON.stringify(out, null, 2)); };
ACT.expVault = async () => { await flushSave(); audit("Şifreli yedek indirildi", null, ""); await flushSave(); download(`rush-athletic-yedek-${todayISO()}.json`, JSON.stringify(vaultGet(S.ws))); };
ACT.wipeWs = async () => { if (!await confirmBox("Çalışma alanındaki TÜM veriler (tüm sporcular, testler, programlar, videolar) bu cihazdan kalıcı olarak silinecek. Bu işlem geri alınamaz.", "Hepsini sil", true)) return; for (const v of DB.videos) if (v.blob) await idbDel(v.blob); for (const k in DB.exVideos) await idbDel(DB.exVideos[k]); const id = S.ws; S.dirty = false; logout(); vaultDel(id); toast("Tüm veriler silindi"); go("#/login"); };
ACT.wipeMe = async () => { if (!await confirmBox("Bu cihazdaki giriş bilgileriniz kaldırılacak.", "Kaldır", true)) return; removeMemberLogin(S.me.id); DB.members = DB.members.filter(m => m.id !== S.me.id); audit("Üye kendini kaldırdı", null, ""); await flushSave(); logout(); go("#/login"); };

/* ---------- Bilimsel referanslar ---------- */
route("/science", () => ({title: "Bilimsel referanslar", html: `${alertBox("info", "", "Egzersiz seçimi, test yorumlaması ve değerlendirmeler aşağıdaki kaynaklara dayanır. Yetişkin normları çocuklara doğrudan uygulanmaz. Bilimsel kaynağı olmayan değerlendirmeler kesin bilgi olarak sunulmaz; referans değerler “yaklaşık” olarak işaretlenmiştir ve kulüp/ülke normlarıyla güncellenmelidir.")}
  <div class="card">${REFS.map(([t, r]) => `<div style="padding:7px 0;border-bottom:1px solid var(--line)"><b class="small">${esc(t)}</b><div class="small muted">${esc(r)}</div></div>`).join("")}</div>
  <h3>Test kaynakları</h3><div class="card"><table class="tbl"><tr><th>Test</th><th>Yaş</th><th>Birim</th><th>Referans popülasyon / kaynak</th></tr>${TESTS.map(t => `<tr><td class="small">${esc(t.n)}</td><td>${t.minAge}+</td><td>${esc(t.u)}</td><td class="tiny">${esc(t.pop)}<br>${esc(t.src)}</td></tr>`).join("")}</table></div>`}));

/* ---------- Demo çalışma alanı (Bölüm 27: uçtan uca örnek) ---------- */
ACT.demo = async el => {
  if (!cryptoOK()) { toast("HTTPS gerekli"); return; }
  el.disabled = true; el.textContent = "Demo hazırlanıyor…";
  try { await seedDemo(); applyPrefs(); toast("Demo hazır: antrenor@demo.app / Demo1234", 5000); go("#/home"); }
  catch (e) { console.error(e); el.disabled = false; el.textContent = "Demo çalışma alanı oluştur"; toast("Demo oluşturulamadı: " + e.message); }
};
async function seedDemo() {
  for (const id of vaultIds()) { const v = vaultGet(id); if (v && v.users.some(u => u.email === "antrenor@demo.app")) { vaultDel(id); } }
  await createWorkspace({wsName: "Demo Akademi", name: "Demo Antrenör", email: "antrenor@demo.app", password: "Demo1234", role: "coach"});
  const T = todayISO(), start = addDays(mondayOf(T), -77);
  const a = {id: uid("a_"), name: "Deniz Yılmaz", birthDate: addDays(T, -Math.round(13.48 * 365.25)), sex: "E", dominantHand: "sağ", dominantFoot: "sağ", activityLevel: "4", sportsHistory: "Basketbol 2 yıl (okul takımı), yüzme 1 yıl (8–9 yaş)", trainingYears: 2, weeklySessions: 2, teamSessionMin: 90, teamDays: [2, 4], sleepHours: 8.5, club: "Demo Akademi U14", coachName: "Demo Antrenör", primarySport: "basketball", position: "sf", level: "Başlangıç-orta", competency: 3, personalGoals: "Daha hızlı ilk adım ve daha yükseğe sıçramak", goals: [], interests: {basketball: 5, volleyball: 4, athletics: 3, tennis: 3, handball: 3, football: 2}, targets: {}, season: {phases: [{id: uid("sp_"), type: "pre", start, end: addDays(start, 41)}, {id: uid("sp_"), type: "in", start: addDays(start, 42), end: addDays(start, 230)}], comps: [{id: uid("cp_"), name: "Okul ligi maçı", date: addDays(T, 4), imp: "orta"}, {id: uid("cp_"), name: "Bölge turnuvası", date: addDays(T, 15), imp: "yüksek"}]}, createdAt: Date.now(), createdBy: S.me.id};
  DB.athletes.push(a);
  const b = {id: uid("a_"), name: "Ece Kaya", birthDate: addDays(T, -Math.round(12.2 * 365.25)), sex: "K", dominantHand: "sağ", dominantFoot: "sol", activityLevel: "3", sportsHistory: "Voleybol 1 yıl", trainingYears: 1, weeklySessions: 2, teamSessionMin: 75, teamDays: [1, 3], sleepHours: 9, club: "Demo Akademi", primarySport: "volleyball", level: "Başlangıç", competency: 2, goals: [], interests: {volleyball: 5, basketball: 3, swimming: 4}, targets: {}, season: {phases: [], comps: []}, createdAt: Date.now(), createdBy: S.me.id};
  DB.athletes.push(b); S.me.athleteIds = [a.id, b.id];
  Object.keys(CONSENT_N).forEach(t => { DB.consents.push({athleteId: a.id, type: t, granted: true, by: "Demo Veli (Veli)", at: Date.now() - 864e5 * 90}); DB.consents.push({athleteId: b.id, type: t, granted: t !== "shareCoach", by: "Demo Antrenör (Antrenör) — veli yazılı onayı", at: Date.now() - 864e5 * 30}); });
  [[-290, 158.0, 47.0, 81.5, null], [-110, 161.5, 49.5, 83.2, null], [-5, 165.0, 52.0, 85.3, 168]].forEach(([d, h, w, sh, as]) => DB.measurements.push({id: uid("ms_"), athleteId: a.id, date: addDays(start, d), heightCm: h, weightKg: w, sittingHeightCm: sh, armSpanCm: as, waistCircCm: d === -5 ? 66 : null, shoulderWidthCm: d === -5 ? 36 : null, thighCircL: d === -5 ? 44 : null, thighCircR: d === -5 ? 45 : null, romAnkleDFL: d === -5 ? 36 : null, romAnkleDFR: d === -5 ? 40 : null, posture: d === -5 ? ["Pelvik öne tilt"] : []}));
  DB.measurements.push({id: uid("ms_"), athleteId: b.id, date: addDays(T, -20), heightCm: 154, weightKg: 42, sittingHeightCm: 79, armSpanCm: 156});
  DB.health.push({id: uid("h_"), athleteId: a.id, cat: "asthma", title: "Egzersize bağlı astım", desc: "Kontrol altında; antrenman öncesi doktorun önerdiği şekilde inhaler kullanıyor.", date: addDays(start, -400), status: "takipte", requiresClearance: true, clearanceGiven: true, clearedBy: "Çocuk göğüs hastalıkları uzmanı", clearanceDate: addDays(start, -20), tags: [], createdAt: Date.now(), by: "Demo Veli"});
  DB.health.push({id: uid("h_"), athleteId: a.id, cat: "injury", title: "Sağ ayak bileği burkulması", desc: "Hafif derece; fizyoterapi sonrası tam dönüş.", date: addDays(start, -520), status: "geçmiş", requiresClearance: false, tags: [], createdAt: Date.now(), by: "Demo Veli"});
  const R = (tid, d, v, l, r) => DB.tests.push(Object.assign({id: uid("t_"), athleteId: a.id, testId: tid, date: d, cond: "Kapalı salon, fotosel, standart ısınma", by: "Demo Antrenör", at: Date.now()}, l != null ? {left: l, right: r} : {value: v}));
  const d0 = addDays(start, -4), d4 = addDays(start, 21), d8 = addDays(start, 49), d12 = mondayOf(T);
  const dS = addDays(start, -150); [["sp10", 2.46], ["sbj", 166], ["cmj", 28.5]].forEach(([t, v]) => DB.tests.push({id: uid("t_"), athleteId: a.id, testId: t, date: dS, value: v, cond: "Okul spor taraması (aynı salon ve fotosel)", by: "Demo Antrenör", at: Date.now()}));
  [["sp5", 1.35], ["sp10", 2.40], ["sp20", 4.05], ["cmj", 30.0], ["sbj", 172], ["ttest", 12.4], ["sitreach", -3], ["walltoss", 22], ["react", 330], ["ktk", 48], ["pushup", 12], ["plank", 55], ["shuttle20", 42]].forEach(([t, v]) => R(t, d0, v));
  R("grip", d0, null, 21.0, 24.0); R("t505", d0, null, 2.95, 2.85); R("sls", d0, null, 10, 14); R("ybal", d0, null, 86, 90); R("ankle", d0, null, 9.0, 11.0); R("shoulder", d0, null, -4, 0);
  R("sp10", d4, 2.32); R("cmj", d4, 31.0); R("sbj", d4, 175); R("t505", d4, null, 2.92, 2.82); R("sls", d4, null, 12, 15);
  R("sp10", d8, 2.25); R("cmj", d8, 32.5); R("sbj", d8, 178); R("react", d8, 318); R("sls", d8, null, 13, 17);
  [["sp5", 1.31], ["sp10", 2.21], ["sp20", 3.95], ["cmj", 33.5], ["sbj", 180], ["ttest", 12.0], ["sitreach", -1], ["walltoss", 25], ["react", 312], ["ktk", 53], ["pushup", 15], ["plank", 70], ["shuttle20", 45]].forEach(([t, v]) => R(t, d12, v));
  R("grip", d12, null, 23.0, 26.0); R("t505", d12, null, 2.84, 2.76); R("sls", d12, null, 15, 18); R("ybal", d12, null, 90, 93); R("ankle", d12, null, 10.0, 11.0); R("shoulder", d12, null, -2, 1);
  [["sbj", 140], ["cmj", 24], ["sp10", 2.30], ["walltoss", 21], ["sls", null, 14, 12], ["sitreach", 8]].forEach(([t, v, l, r]) => DB.tests.push(Object.assign({id: uid("t_"), athleteId: b.id, testId: t, date: addDays(T, -19), cond: "Okul salonu", by: "Demo Antrenör", at: Date.now()}, l != null ? {left: l, right: r} : {value: v})));
  a.goals = [{id: uid("g_"), text: "10 m sprint 2,25 sn altı", testId: "sp10", target: 2.25, base: 2.40, date: addDays(start, 84), done: true, at: Date.now()}, {id: uid("g_"), text: "CMJ 35 cm", testId: "cmj", target: 35, base: 30, date: addDays(T, 60), done: false, at: Date.now()}, {id: uid("g_"), text: "Tek ayak denge ortalaması 18 sn", testId: "sls", target: 18, base: 12, date: addDays(T, 45), done: false, at: Date.now()}];
  const v = {id: uid("v_"), athleteId: a.id, date: addDays(start, 10), at: Date.now() - 864e5 * 60, by: "Demo Antrenör", movement: "landing", view: "front", quality: {full: true, stable: true, height: true, light: true, fps: false, clothes: true}, measures: [{type: "fppa", side: "L", value: 8, t: 1.2, src: "manuel"}, {type: "fppa", side: "R", value: 14, t: 1.2, src: "manuel"}, {type: "pelvis", side: "-", value: 3, t: 1.2, src: "manuel"}], obs: ["Diz içe kaçıyor (valgus)"], blob: null};
  v.report = videoReport(v); DB.videos.push(v);
  const gen = generateProgram(a, {sport: "basketball", pos: "sf", weeks: 12, spw: 3, minutes: 60, env: "club", eq: ENVS.club.eq, space: true, startDate: start, testInterval: 4, includeExtra: true, seasonAware: true, type: "main"});
  if (!gen.ok) throw new Error(gen.hold.join(" "));
  const pr = gen.program; pr.createdAt = Date.now() - 864e5 * 80;
  const w1 = pr.weeksData[0].sessions[0], mi = w1.blocks.find(x => x.k === "main");
  if (mi && mi.items.length) { const oldE = mi.items[0].e; const T0 = itemScopeTargets(pr, 1, 0, w1.blocks.indexOf(mi), oldE, "block"); T0.forEach(x => { x.it.note = "İlk 3 hafta iniş tekniğine odaklan; her tekrarda 2 sn yapış."; x.it.mod = 1; }); pr.changes.push({at: Date.now() - 864e5 * 79, by: "Demo Antrenör", role: "coach", what: `${exById(oldE).n}: teknik notu eklendi (${T0.length} seans, blok)`, reason: "Video analizinde sağ dizde FPPA 14° — iniş kalitesi öncelikli."}); }
  pr.status = "onaylı"; pr.approvals.push({at: Date.now() - 864e5 * 79, by: "Demo Antrenör (Antrenör)", action: "Onaylandı", note: "Astım için uzman onayı mevcut; inhaler erişilebilir olmalı."});
  DB.programs.push(pr);
  const rng = seeded("demo-logs"); let k = 0;
  for (const wk of pr.weeksData) for (const s of wk.sessions) {
    if (s.date >= T) continue; k++;
    if (k % 9 === 0) continue;
    const pain = wk.w === 6 && s.d === 1 ? 2 : 0, rd = pain ? "Normal" : ["Çok iyi", "İyi", "İyi", "Normal", "Normal", "Yorgun"][Math.floor(rng() * 6)];
    const log = {id: uid("l_"), key: logKey(pr.id, wk.w, s.d), athleteId: a.id, programId: pr.id, w: wk.w, d: s.d, date: s.date, readiness: rd, sleep: round(8 + rng() * 1.5, 1), painLevel: pain, painArea: pain ? "sağ diz önü" : "", startedAt: parseISO(s.date).getTime() + 17 * 36e5, done: {}, mod: pain ? "ağrı" : rd === "Yorgun" ? "yorgun" : "normal", by: "Deniz Yılmaz"};
    adaptedItems(s, log).forEach(x => { if (!x.skip) log.done[x.key] = x.sets; });
    log.duration = s.estMin + Math.round(rng() * 8 - 4); log.rpe = clamp(Math.round(5 + rng() * 2.4 + (wk.deload ? -1 : 0)), 3, 8); log.load = log.rpe * log.duration; log.fatigue = 2 + Math.round(rng() * 2); log.endedAt = log.startedAt + log.duration * 6e4; log.completion = 100; log.status = "tamamlandı";
    if (pain) log.notes = "Sıçramalarda hafif diz önü hassasiyeti; seans sonrası geçti.";
    DB.logs.push(log);
  }
  for (let d = addDays(start, -28); d < T; d = addDays(d, 1)) { const dow = parseISO(d).getDay(); if (dow === 2 || dow === 4) DB.extLoads.push({id: uid("x_"), athleteId: a.id, type: "Takım antrenmanı", date: d, duration: 90, rpe: 6, load: 540, by: "Demo"}); if (dow === 6 && daysBetween(start, d) % 14 < 7) DB.extLoads.push({id: uid("x_"), athleteId: a.id, type: "Maç", date: d, duration: 40, rpe: 8, load: 320, by: "Demo"}); }
  DB.comments.push({id: uid("c_"), athleteId: a.id, at: Date.now() - 864e5 * 50, by: S.me.id, byName: "Demo Antrenör", text: "İniş tekniğinde belirgin ilerleme var; dizlerini ayak hizasında tutmaya devam!", vis: ["athlete", "parent"]});
  DB.comments.push({id: uid("c_"), athleteId: a.id, at: Date.now() - 864e5 * 3, by: S.me.id, byName: "Demo Antrenör", text: "12. hafta testlerinde 10 m sprint 2,40 → 2,21 sn. Harika bir dönem geçirdin. Turnuva öncesi yüklenmeyi azaltacağız.", vis: ["athlete", "parent"]});
  DB.groups.push({id: uid("gr_"), name: "U14 Karma Atletik Grup", athleteIds: [a.id, b.id], sessions: [], by: S.me.id});
  learnPref("w2", "w1");
  const par = {id: uid("m_"), name: "Demo Veli", email: "veli@demo.app", role: "parent", admin: false, athleteIds: [a.id], createdAt: Date.now()};
  const ath = {id: uid("m_"), name: "Deniz Yılmaz", email: "sporcu@demo.app", role: "athlete", admin: false, athleteIds: [a.id], createdAt: Date.now()};
  await addMemberLogin(par, "Demo1234"); await addMemberLogin(ath, "Demo1234"); DB.members.push(par, ath);
  audit("Demo çalışma alanı oluşturuldu", null, "Bölüm 27 örnek sporcu"); runScheduler(true); await flushSave();
}

/* ---------- Başlatma, otomatik kilit, servis çalışanı ---------- */
let hiddenAt = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { hiddenAt = Date.now(); flushSave(); }
  else if (S.me) {
    const m = mySettings().autoLock;
    if (m > 0 && !lsGet(REM_KEY) && hiddenAt && Date.now() - hiddenAt > m * 60000) { audit("Otomatik kilit", null, ""); flushSave().then(() => { logout(); toast("Güvenliğiniz için oturum kilitlendi"); go("#/login"); }); }
    else runScheduler();
  }
});
window.addEventListener("pagehide", () => flushSave());
window.addEventListener("hashchange", render);
async function boot() {
  applyPrefs();
  if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(e => console.warn("SW", e));
  try { if (cryptoOK()) await tryRemembered(); } catch (e) {}
  if (S.me) applyPrefs();
  render();
  setTimeout(() => { const sp = $("#splash"); sp.classList.add("hide"); setTimeout(() => sp.remove(), 500); }, 900);
}
boot();
