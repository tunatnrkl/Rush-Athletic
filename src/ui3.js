/* =========================================================================
   TEST MERKEZİ, SONUÇLAR, RADAR, REAKSİYON TESTİ, BRANŞ KEŞFİ, POZİSYONLAR
   ========================================================================= */
function refText(t, a, date) {
  const nm = normFor(t, ageAt(a.birthDate, date), sexKey(a));
  return nm ? `${fmtN(nm.mean, t.dec)} ± ${fmtN(nm.sd, t.dec)} ${t.u}` : "Norm yok (bireysel karşılaştırma)";
}
function testInfo(t, a) {
  return `<dl class="kv"><dt>Amaç</dt><dd>${esc(t.purpose)}</dd><dt>Birim</dt><dd>${esc(t.u)}${t.lb ? " (düşük daha iyi)" : ""}</dd><dt>Ekipman</dt><dd>${esc(t.eq)}</dd><dt>En düşük yaş</dt><dd>${t.minAge}</dd><dt>Referans (bu yaş/cinsiyet)</dt><dd>${refText(t, a)}</dd><dt>Tipik ölçüm hatası</dt><dd>${isNum(t.te) ? fmtN(t.te, t.dec) + " " + t.u : "≈%" + t.cv}</dd><dt>Referans popülasyon</dt><dd>${esc(t.pop)}</dd></dl>
    <p class="small"><b>Protokol:</b> ${esc(t.proto)}</p><p class="tiny muted"><b>Kaynak:</b> ${esc(t.src)}</p>${t.maxEff ? alertBox("warn", "Maksimal efor testi", "Çocuklarda otomatik önerilmez; antrenör onayı ve sağlık engeli olmaması gerekir.") : ""}`;
}
route("/a/:aid/tests", p => {
  const a = getA(p.aid), sug = suggestTests(a), canE = canEnterTests(a.id) || role() === "athlete";
  const row = t => { const rs = testsOf(a.id, t.id), l = rs[rs.length - 1]; const sc = l ? scoreResult(a, l) : null;
    return `<details class="acc"><summary><div class="grow"><div>${esc(t.n)}</div><div class="tiny muted">${l ? `Son: ${t.bil && isNum(l.left) ? `S ${fmtN(l.left, t.dec)} / Sğ ${fmtN(l.right, t.dec)}` : fmtN(testValue(l), t.dec)} ${t.u} · ${fmtD(l.date)}${isNum(sc) ? " · puan " + sc : ""}` : "Henüz ölçülmedi"}</div></div></summary><div>${testInfo(t, a)}
      ${(canEnterTests(a.id) || (role() === "athlete" && t.inApp)) ? `<div class="btns">${t.inApp ? `<a class="btn sm blue" href="#/a/${a.id}/reaction">Uygulamada ölç</a>` : ""}${canEnterTests(a.id) ? `<button class="btn sm pri" data-act="testEntry" data-aid="${a.id}" data-t="${t.id}">Sonuç gir</button>` : ""}</div>` : ""}</div></details>`; };
  return {title: "Performans test merkezi", html: `
    ${!canEnterTests(a.id) ? alertBox("info", "", "Test sonuçlarını antrenör girer. Reaksiyon testini uygulama içinden kendiniz yapabilirsiniz.") : ""}
    <div class="card acc"><h3>Önerilen test bataryası</h3><p class="small muted">Yaş (${Math.floor(ageAt(a.birthDate))}), branş (${esc((sportById(a.primarySport) || {n: "genel"}).n)}) ve sağlık kısıtlamalarına göre seçildi.</p><div class="chips">${sug.recommended.map(t => pill(t.n, "acc")).join("")}</div>
      ${canEnterTests(a.id) ? `<button class="btn pri block mt" data-act="batteryEntry" data-aid="${a.id}">Bataryayı toplu gir</button>` : ""}</div>
    ${sug.coachOnly.length ? `<div class="card"><h3>Yalnızca antrenör onayıyla</h3>${sug.coachOnly.map(x => `<div class="small" style="padding:4px 0">${esc(x.t.n)} ${x.blocked ? pill("sağlık nedeniyle uygun değil", "bad") : pill("maksimal efor", "warn")}</div>`).join("")}</div>` : ""}
    ${sug.excluded.length ? `<details class="acc"><summary>Uygun olmayan testler (${sug.excluded.length})</summary><div>${sug.excluded.map(x => `<div class="small" style="padding:4px 0"><b>${esc(x.t.n)}</b> — <span class="muted">${esc(x.why)}</span></div>`).join("")}</div></details>` : ""}
    ${QUALITIES.map(q => `<div class="blockh">${q.n}</div>${TESTS.filter(t => t.q === q.k).map(row).join("")}`).join("")}
    <a class="btn block mt" href="#/a/${a.id}/results">Sonuçlar ve karşılaştırma</a>`};
});
function testFields(t, prefix = "") {
  return t.bil ? `<div class="grid2">${field("Sol (" + t.u + ")", inp(prefix + "left", "", 'inputmode="decimal"'))}${field("Sağ (" + t.u + ")", inp(prefix + "right", "", 'inputmode="decimal"'))}</div>` : field("Sonuç (" + t.u + ")", inp(prefix + "value", "", 'inputmode="decimal"'));
}
ACT.testEntry = el => {
  const a = getA(el.dataset.aid), t = TEST[el.dataset.t], h = holds(a.id);
  if (t.maxEff && h.length) { sheet(`<h2>${esc(t.n)}</h2>${alertBox("bad", "Uygulanamaz", "Maksimal efor testleri tıbbi onay bekleyen durumlarda uygulanamaz.<br>" + h.map(esc).join("<br>"))}<button class="btn block" data-act="closeSheet">Kapat</button>`); return; }
  sheet(`<h2>${esc(t.n)}</h2><p class="small muted">${esc(t.proto)}</p><form data-form="testRes" data-aid="${a.id}" data-t="${t.id}">
    ${field("Tarih", inp("date", todayISO(), 'type="date" required max="' + todayISO() + '"'))}${testFields(t)}
    ${field("Test koşulları", inp("cond", "", 'placeholder="ör. kapalı salon, fotosel, ısınma sonrası"'), "Koşulların kaydı tekrar testlerde karşılaştırmayı güvenilir kılar.")}
    ${t.maxEff ? `<label class="check"><input type="checkbox" name="approve" required><span class="small"><b>Antrenör onayı:</b> Sporcu sağlıklı, hazır ve maksimal efor testine uygundur; test gözetim altında yapıldı.</span></label>` : ""}
    <div class="btns"><button type="button" class="btn" data-act="closeSheet">Vazgeç</button><button class="btn pri" type="submit">Kaydet</button></div></form>`);
};
function saveTestResult(a, t, d, date, cond) {
  const r = {id: uid("t_"), athleteId: a.id, testId: t.id, date, cond: cond || "", by: S.me.name, at: Date.now()};
  if (t.bil) { r.left = num(d.left); r.right = num(d.right); if (!isNum(r.left) && !isNum(r.right)) return null; }
  else { r.value = num(d.value); if (!isNum(r.value)) return null; }
  const v = testValue(r);
  if (v < 0 && !["sitreach", "shoulder"].includes(t.id)) throw new Error(t.n + ": negatif değer girilemez.");
  if (t.max && v > t.max) throw new Error(`${t.n}: en fazla ${t.max} ${t.u}.`);
  const nm = normFor(t, ageAt(a.birthDate, date), sexKey(a));
  if (nm && Math.abs(v - nm.mean) > 5 * nm.sd) throw new Error(`${t.n}: ${v} ${t.u} beklenen aralığın çok dışında. Birimi kontrol edin.`);
  const prev = testsOf(a.id, t.id);
  DB.tests.push(r);
  if (prev.length) {
    const best = prev.map(testValue).reduce((b, x) => t.lb ? Math.min(b, x) : Math.max(b, x));
    const c = compareResults(t, {date: prev[prev.length - 1].date, value: best}, r);
    if ((t.lb ? v < best : v > best) && c && c.ratio >= 1) notify({key: "pr:" + r.id, athleteId: a.id, type: "milestone", title: "Kişisel rekor! 🏅", body: `${a.name}: ${t.n} ${fmtN(v, t.dec)} ${t.u} (önceki en iyi ${fmtN(best, t.dec)})`});
  }
  (a.goals || []).filter(g => !g.done && g.testId === t.id && isNum(g.target)).forEach(g => { if (t.lb ? v <= g.target : v >= g.target) { g.done = true; notify({key: "goalhit:" + g.id, athleteId: a.id, type: "milestone", title: "Hedefe ulaşıldı 🎉", body: `${a.name}: ${g.text}`}); } });
  audit("Test sonucu girildi", a.id, `${t.n}: ${fmtN(v, t.dec)} ${t.u}`);
  return r;
}
FORM.testRes = (d, f) => {
  const a = getA(f.dataset.aid), t = TEST[f.dataset.t];
  const r = saveTestResult(a, t, d, d.date, d.cond); if (!r) throw new Error("Sonuç girin.");
  save(); closeSheet(); toast("Sonuç kaydedildi"); reRender();
};
ACT.batteryEntry = el => {
  const a = getA(el.dataset.aid), sug = suggestTests(a).recommended;
  sheet(`<h2>Test bataryası</h2><form data-form="battery" data-aid="${a.id}">${field("Değerlendirme tarihi", inp("date", todayISO(), 'type="date" required'))}${field("Test koşulları", inp("cond", "", 'placeholder="ör. kapalı salon, fotosel"'))}
    <p class="tiny muted">Boş bırakılan testler kaydedilmez.</p>${sug.map(t => `<div class="card flat" style="padding:10px"><b class="small">${esc(t.n)}</b>${testFields(t, t.id + "__")}</div>`).join("")}
    <div class="btns"><button type="button" class="btn" data-act="closeSheet">Vazgeç</button><button class="btn pri" type="submit">Tümünü kaydet</button></div></form>`);
};
FORM.battery = (d, f) => {
  const a = getA(f.dataset.aid); let n = 0;
  for (const t of suggestTests(a).recommended) { const sub = {}; ["value", "left", "right"].forEach(k => sub[k] = d[t.id + "__" + k]); if (saveTestResult(a, t, sub, d.date, d.cond)) n++; }
  if (!n) throw new Error("En az bir sonuç girin.");
  save(); closeSheet(); toast(n + " sonuç kaydedildi"); reRender();
};

/* ---------- Sonuçlar ---------- */
route("/a/:aid/results", p => {
  const a = getA(p.aid), done = TESTS.filter(t => testsOf(a.id, t.id).length);
  const dates = [...new Set(testsOf(a.id).map(r => r.date))].sort().reverse();
  return {title: "Test sonuçları", html: `${!done.length ? empty("Henüz test sonucu yok.", "flask") + `<a class="btn pri block" href="#/a/${a.id}/tests">Test merkezine git</a>` : ""}
    ${dates.length ? `<div class="card"><h3>Değerlendirme oturumları</h3><div class="chips">${dates.map(d => pill(fmtD(d) + " · " + testsOf(a.id).filter(r => r.date === d).length + " test")).join("")}</div></div>` : ""}
    ${done.map(t => {
      const rs = testsOf(a.id, t.id), l = rs[rs.length - 1], f = rs[0], sc = scoreResult(a, l), as = asym(t, l), c = rs.length > 1 ? compareResults(t, f, l) : null;
      return `<div class="card"><div class="row between"><div class="grow"><div class="tiny muted">${QN[t.q]}</div><b>${esc(t.n)}</b></div>${isNum(sc) ? pill("puan " + sc, sc >= 60 ? "ok" : sc >= 40 ? "acc" : "warn") : pill("norm yok")}</div>
        <div class="grid2 mt"><div class="stat"><b>${fmtN(testValue(l), t.dec)} ${t.u}</b><span>Son (${fmtD(l.date)})</span></div><div class="stat"><b class="small">${refText(t, a, l.date)}</b><span>Yaklaşık referans</span></div></div>
        ${as ? `<p class="small mt">Sol ${fmtN(l.left, t.dec)} / Sağ ${fmtN(l.right, t.dec)} ${t.u} — asimetri ${esc(as.txt)} ${as.flag ? pill("dikkat", "warn") : pill("kabul edilebilir", "ok")}</p>` : ""}
        ${c ? `<p class="small">İlk → son: ${fmtN(c.v1, t.dec)} → ${fmtN(c.v2, t.dec)} ${t.u} (${c.pct != null ? (c.pct > 0 ? "+" : "") + fmtN(c.pct, 1) + "%" : ""}, ${c.days} gün) ${pill(c.verdict, c.cls)}</p>${c.growthNote ? `<p class="tiny muted">${c.growthNote}</p>` : ""}` : ""}
        ${rs.length > 1 ? lineChart([{color: COL.cur, points: rs.map(r => ({x: r.date, y: testValue(r)}))}], {dec: t.dec, labels: true}) : ""}
        <details class="acc"><summary class="small">Tüm sonuçlar (${rs.length})</summary><div><table class="tbl"><tr><th>Tarih</th><th class="r">Değer</th><th>Koşul</th><th></th></tr>${rs.slice().reverse().map(r => `<tr><td>${fmtD(r.date)}</td><td class="r">${t.bil && isNum(r.left) ? fmtN(r.left, t.dec) + " / " + fmtN(r.right, t.dec) : fmtN(testValue(r), t.dec)}</td><td class="tiny">${esc(r.cond || "")}</td><td>${canEnterTests(a.id) ? `<button class="btn sm ghost" data-act="testDel" data-id="${r.id}" aria-label="Sil">✕</button>` : ""}</td></tr>`).join("")}</table></div></details></div>`;
    }).join("")}
    <p class="tiny muted">Değişim yorumu tipik ölçüm hatasına (Hopkins 2000) göre yapılır: değişim < 1× hata → anlamlı değil; 1–2× → olası; ≥2× → büyük olasılıkla gerçek. Farklı yöntem/koşullardaki ölçümler doğrudan karşılaştırılmamalıdır.</p>`};
});
ACT.testDel = async el => { if (!await confirmBox("Bu sonuç silinsin mi?", "Sil", true)) return; const r = DB.tests.find(x => x.id === el.dataset.id); DB.tests = DB.tests.filter(x => x !== r); audit("Test sonucu silindi", r.athleteId, TEST[r.testId].n); save(); reRender(); };

/* ---------- Radar ---------- */
let radarShow = {cur: true, prev: true, tgt: true};
route("/a/:aid/radar", p => {
  const a = getA(p.aid), cur = qualityScores(a), prev = qualityScores(a, "previous"), tgt = targetScores(a, cur);
  const val = o => Object.fromEntries(QUALITIES.map(q => [q.k, o[q.k] && typeof o[q.k] === "object" ? o[q.k].score : o[q.k]]));
  const series = [];
  if (radarShow.cur) series.push({name: "Mevcut", color: COL.cur, values: val(cur), fill: .18});
  if (radarShow.prev) series.push({name: "Önceki", color: COL.prev, values: val(prev), dash: "5 4", dot: 2.5});
  if (radarShow.tgt) series.push({name: "Hedef", color: COL.tgt, values: tgt, dash: "2 4", dot: 2});
  if (!radarShow.cur) series.unshift({name: "", color: "transparent", values: val(cur)});
  const missing = QUALITIES.filter(q => !cur[q.k].hasData);
  return {title: "Atletik radar", html: `<div class="seg">${[["cur", "Mevcut"], ["prev", "Önceki"], ["tgt", "Hedef"]].map(([k, n]) => `<button class="${radarShow[k] ? "on" : ""}" data-act="radarT" data-k="${k}">${n}</button>`).join("")}</div>
    <div class="card">${radarSVG(QUALITIES, series)}${legend([[COL.cur, "Mevcut seviye"], [COL.prev, "Önceki değerlendirme"], [COL.tgt, "Hedeflenen seviye"]])}</div>
    ${missing.length ? alertBox("warn", "Eksik veri", `Test yapılmamış alanlar sıfır olarak gösterilmez: <b>${missing.map(q => q.n).join(", ")}</b>. <a href="#/a/${a.id}/tests">Test ekle</a>`) : ""}
    <div class="card"><h3>Ayrıntı</h3><table class="tbl"><tr><th>Özellik</th><th class="r">Önceki</th><th class="r">Mevcut</th><th class="r">Hedef</th></tr>${QUALITIES.map(q => `<tr><td>${q.n}<div class="tiny muted">${cur[q.k].items.map(i => esc(i.n)).join(", ") || "veri yok"}</div></td><td class="r">${prev[q.k].score ?? "—"}</td><td class="r"><b>${cur[q.k].score ?? "—"}</b></td><td class="r">${tgt[q.k] ?? "—"}</td></tr>`).join("")}</table>
    <p class="tiny muted">Skorlar 0–100 arası yaklaşık yüzdelik değerlerdir (yaş ve cinsiyete göre referanslar). Yetişkin normları çocuklara uygulanmaz. Önceki = her testin bir önceki ölçümü.</p></div>
    ${role() === "coach" ? `<form class="card" data-form="targets" data-aid="${a.id}"><h3>Hedef seviyeleri düzenle</h3><div class="grid3">${QUALITIES.map(q => field(q.n, inp(q.k, tgt[q.k] ?? "", 'inputmode="numeric"'))).join("")}</div><button class="btn sm pri" type="submit">Hedefleri kaydet</button></form>` : ""}`};
});
ACT.radarT = el => { radarShow[el.dataset.k] = !radarShow[el.dataset.k]; reRender(); };
FORM.targets = (d, f) => { const a = getA(f.dataset.aid); a.targets = {}; QUALITIES.forEach(q => { const v = num(d[q.k]); if (isNum(v)) a.targets[q.k] = clamp(Math.round(v), 0, 100); }); audit("Radar hedefleri güncellendi", a.id, ""); save(); toast("Hedefler kaydedildi"); reRender(); };

/* ---------- Reaksiyon testi ---------- */
let RT = null;
route("/a/:aid/reaction", p => {
  const a = getA(p.aid); RT = {aid: a.id, trials: [], state: "idle", t0: 0, timer: null};
  afterRender.push(() => rtDraw());
  return {title: "Reaksiyon testi", html: `<p class="small muted">Ekran <b style="color:var(--ok)">yeşile</b> döndüğünde mümkün olduğunca hızlı dokunun. 5 deneme yapılır; medyan kaydedilir. Erken dokunma geçersiz sayılır.</p>
    <button id="rtPad" class="btn block" style="min-height:280px;font-size:1.3rem;border-radius:20px;touch-action:manipulation" data-act="rtTap">Başlamak için dokunun</button>
    <div id="rtOut" class="mt"></div>${alertBox("info", "", "Dokunmatik ekranlar ≈40–80 ms gecikme ekler; sonuçlar yalnızca aynı cihazda bireysel takip için güvenilirdir.")}`};
});
function rtDraw() {
  const pad = $("#rtPad"), out = $("#rtOut"); if (!pad || !RT) return;
  const st = RT.state;
  pad.style.background = st === "wait" ? "#7F1D1D" : st === "go" ? "#047857" : "";
  pad.style.color = st === "wait" || st === "go" ? "#fff" : "";
  pad.textContent = st === "idle" ? (RT.trials.length ? `Deneme ${RT.trials.length + 1}/5 — dokunun` : "Başlamak için dokunun") : st === "wait" ? "Bekle…" : st === "go" ? "DOKUN!" : st === "early" ? "Erken! Tekrar için dokunun" : "Tamamlandı";
  out.innerHTML = RT.trials.length ? `<div class="chips">${RT.trials.map((t, i) => pill(`${i + 1}: ${t} ms`, "acc")).join("")}</div>` + (RT.trials.length >= 5 ? `<div class="card mt"><div class="stat"><b>${median(RT.trials)} ms</b><span>Medyan</span></div>${(canEnterTests(RT.aid) || role() === "athlete") ? `<button class="btn pri block mt" data-act="rtSave">Sonucu kaydet</button>` : ""}<button class="btn block mt" data-act="rtReset">Yeniden başlat</button></div>` : "") : "";
}
ACT.rtTap = () => {
  if (!RT || RT.trials.length >= 5) return;
  if (RT.state === "idle" || RT.state === "early") { RT.state = "wait"; rtDraw(); RT.timer = setTimeout(() => { RT.state = "go"; RT.t0 = performance.now(); rtDraw(); }, 1500 + Math.random() * 2500); }
  else if (RT.state === "wait") { clearTimeout(RT.timer); RT.state = "early"; rtDraw(); }
  else if (RT.state === "go") { RT.trials.push(Math.round(performance.now() - RT.t0)); RT.state = RT.trials.length >= 5 ? "done" : "idle"; rtDraw(); }
};
ACT.rtReset = () => { RT.trials = []; RT.state = "idle"; rtDraw(); };
ACT.rtSave = () => { const a = getA(RT.aid); saveTestResult(a, TEST.react, {value: median(RT.trials)}, todayISO(), "Uygulama içi, " + (navigator.userAgent.includes("Mobile") ? "mobil" : "masaüstü") + ` (denemeler: ${RT.trials.join(", ")})`); save(); toast("Reaksiyon sonucu kaydedildi"); go("#/a/" + a.id + "/results"); };

/* ---------- Branş keşfi ---------- */
route("/a/:aid/discover", p => {
  const a = getA(p.aid), ranked = rankSports(a), fs = featureScores(a), top = ranked.slice(0, 5);
  const ed = canEditProfile(a.id) || role() === "athlete";
  return {title: "Branş keşfi", html: `${alertBox("info", "", "Uygunluk puanları <b>profesyonel sporcu olma ihtimali veya kesin yetenek göstergesi değildir</b>. Mevcut fiziksel verilerin branş gereksinimleriyle uyumunu açıklanabilir ağırlıklarla gösterir. Çocuğun ilgisi ve keyif alması en az fiziksel uygunluk kadar önemlidir.")}
    ${Object.keys(fs).length < 4 ? alertBox("warn", "Veri az", "Güvenilir analiz için antropometrik ölçümler ve test bataryası girilmelidir.") : ""}
    <h3>En uygun 5 branş</h3>${top.length ? `<div class="list">${top.map((x, i) => li(`#/a/${a.id}/sport/${x.sp.id}`, String(i + 1), esc(x.sp.n) + ` <span class="pill acc">${x.fit.score}</span>`, `Fiziksel ${x.fit.phys ?? "—"}${x.fit.interest != null ? " · İlgi " + Math.round(x.fit.interest) : ""} · ${esc(x.fit.conf)}`)).join("")}</div>` : empty("Hesaplama için veri yok.", "compass")}
    <form class="card mt" data-form="interests" data-aid="${a.id}"><h3>Çocuğun ilgisi ve tercihi (1–5)</h3><p class="tiny muted">Puanın %20'si ilgiye dayanır. Boş bırakılırsa yalnızca fiziksel veri kullanılır.</p>
      ${allSports().map(s => `<div class="row between" style="padding:5px 0"><span class="small">${esc(s.n)}</span>${sel("i_" + s.id, [["", "—"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]], (a.interests || {})[s.id] || "", 'style="width:90px;min-height:40px;padding:6px 26px 6px 10px"' + (ed ? "" : " disabled"))}</div>`).join("")}
      ${ed ? `<button class="btn sm pri" type="submit">İlgileri kaydet</button>` : ""}</form>
    <h3>Tüm branşlar</h3><div class="list">${ranked.map(x => li(`#/a/${a.id}/sport/${x.sp.id}`, "compass", esc(x.sp.n), `Uygunluk ${x.fit.score} · kapsam %${Math.round(x.fit.coverage * 100)}`)).join("")}</div>`};
});
FORM.interests = (d, f) => { const a = getA(f.dataset.aid); a.interests = {}; allSports().forEach(s => { if (d["i_" + s.id]) a.interests[s.id] = num(d["i_" + s.id]); }); audit("İlgi tercihleri güncellendi", a.id, ""); save(); toast("Kaydedildi"); reRender(); };
function fitTable(fit) {
  return `<table class="tbl"><tr><th>Özellik</th><th class="r">Ağırlık</th><th class="r">Puan</th><th class="r">Katkı</th></tr>${fit.rows.sort((x, y) => y.w - x.w).map(r => `<tr><td>${esc(r.n)}</td><td class="r">%${r.wPct}</td><td class="r">${r.v == null ? '<span class="muted">veri yok</span>' : Math.round(r.v)}</td><td class="r">${r.contrib == null ? "—" : fmtN(r.contrib, 1)}</td></tr>`).join("")}</table>`;
}
route("/a/:aid/sport/:sid", p => {
  const a = getA(p.aid), sp = sportById(p.sid); if (!sp) return {title: "Branş", html: empty("Branş bulunamadı")};
  const ranked = rankSports(a), rank = ranked.findIndex(x => x.sp.id === sp.id) + 1, fit = sportFit(a, sp);
  const strengths = fit.rows.filter(r => r.v != null && r.v >= 60 && r.wPct >= 8), weak = fit.rows.filter(r => r.v != null && r.v < 45 && r.wPct >= 8), miss = fit.rows.filter(r => r.v == null);
  const key = fit.rows.slice().sort((x, y) => y.w - x.w).slice(0, 5);
  const ctx = buildCtx(a, {eq: Object.keys(EQUIP), space: true, sport: sp.id});
  const starts = [...new Set(sp.drills.concat(sp.prev))].map(exById).filter(e => e && allowedEx(e, ctx));
  const alts = similarSports(sp).map(s => ({s, f: sportFit(a, s)}));
  const sec = (n, t, body) => `<div class="card"><h3><span class="pill acc">${n}</span> ${t}</h3>${body}</div>`;
  return {title: sp.n + " uygunluk raporu", html: `
    ${sec(1, "Sıralama", `<p>${rank ? `Analiz edilen ${ranked.length} branş arasında <b>${rank}.</b> sırada.` : "Sıralama için yeterli veri yok."}</p>`)}
    ${sec(2, "Uygunluk değerlendirmesi", `<div class="grid3"><div class="stat"><b>${fit.score ?? "—"}</b><span>Toplam</span></div><div class="stat"><b>${fit.phys ?? "—"}</b><span>Fiziksel</span></div><div class="stat"><b>${fit.interest == null ? "—" : Math.round(fit.interest)}</b><span>İlgi</span></div></div><p class="small mt">${esc(fit.conf)} (%${Math.round(fit.coverage * 100)}).</p>
      <details class="acc"><summary class="small">Puan nasıl hesaplandı? (açıklanabilir algoritma)</summary><div>${fitTable(fit)}<p class="tiny muted">Toplam = 0,8 × (Σ ağırlık × puan / Σ mevcut ağırlık) + 0,2 × ilgi. Eksik veriler hesaptan çıkarılır ve kapsam oranı düşer; sıfır kabul edilmez.</p>${fit.notes.map(n => `<p class="tiny muted">• ${esc(n)}</p>`).join("")}</div></details>
      ${fit.flags.map(x => alertBox("bad", "", esc(x))).join("")}`)}
    ${sec(3, "Fiziksel güçlü yönler", strengths.length ? `<div class="chips">${strengths.map(r => pill(r.n + " " + Math.round(r.v), "ok")).join("")}</div>` : `<p class="small muted">Belirgin güçlü yön bulunmadı veya veri yetersiz.</p>`)}
    ${sec(4, "Geliştirilmesi gereken özellikler", weak.length ? `<div class="chips">${weak.map(r => pill(r.n + " " + Math.round(r.v), "warn")).join("")}</div>` : `<p class="small muted">Branş açısından belirgin zayıf alan yok.</p>`)}${miss.length ? `<p class="tiny muted">Veri yok: ${miss.map(r => esc(r.n)).join(", ")}</p>` : ""}
    ${sec(5, "Branşın gerektirdiği temel kapasiteler", `<p class="small">${esc(sp.demands)}</p><div class="chips">${key.map(r => pill(r.n + " %" + r.wPct)).join("")}</div>`)}
    ${sec(6, "Mevcut fiziksel yeterlilik", `<p class="small">${fit.phys == null ? "Veri yetersiz." : esc(adequacyText(fit.phys))}</p>`)}
    ${sec(7, "Önerilen başlangıç çalışmaları", starts.length ? `<div class="list">${starts.slice(0, 6).map(e => li("#/ex/" + e.id, "bolt", esc(e.n), esc(CATS[e.c]))).join("")}</div>` : `<p class="small muted">Sağlık kısıtlamaları nedeniyle uygun başlangıç egzersizi bulunamadı; uzmanla görüşün.</p>`)}
    ${sec(8, "Branşa giriş için ön koşullar", `<p class="small">${esc(sp.prereq)}</p>`)}
    ${sec(9, "Alternatif branşlar", `<div class="list">${alts.map(x => li(`#/a/${a.id}/sport/${x.s.id}`, "compass", esc(x.s.n), "Benzer gereksinim profili · uygunluk " + (x.f.score ?? "—"))).join("")}</div>`)}
    ${sec(10, "Gelişim hedefleri", `<p class="small">${esc(sp.goals)}</p>`)}
    <div class="btns">${sp.pos && sp.pos.length ? `<a class="btn" href="#/a/${a.id}/positions/${sp.id}">Pozisyon önerileri</a>` : ""}${canEditProfile(a.id) ? `<button class="btn" data-act="setSport" data-aid="${a.id}" data-sid="${sp.id}">Ana branş yap</button>` : ""}${canEditProgram(a.id) ? `<a class="btn pri" href="#/a/${a.id}/program/new?sport=${sp.id}">Program oluştur</a>` : ""}</div>`};
});
ACT.setSport = el => { const a = getA(el.dataset.aid); a.primarySport = el.dataset.sid; a.position = ""; audit("Ana branş değiştirildi", a.id, sportById(a.primarySport).n); save(); toast("Ana branş güncellendi"); reRender(); };
route("/a/:aid/positions/:sid", p => {
  const a = getA(p.aid), sp = sportById(p.sid), fs = featureScores(a);
  if (!sp || !sp.pos.length) return {title: "Pozisyonlar", html: empty("Bu branş için pozisyon tanımı yok.")};
  const rows = sp.pos.map(ps => ({ps, fit: sportFit(a, sp, ps, fs)})).sort((x, y) => (y.fit.phys ?? -1) - (x.fit.phys ?? -1));
  return {title: sp.n + " — pozisyonlar", html: `${alertBox("info", "", "Pozisyon önerileri mevcut fiziksel özelliklere dayanır; büyüme ve gelişimle değişebilir. Gençlerde birden fazla pozisyon deneyimi önerilir.")}
    ${rows.map((x, i) => `<div class="card"><div class="row between"><b>${i + 1}. ${esc(x.ps.n)}</b>${pill(x.fit.phys == null ? "veri yok" : "uyum " + x.fit.phys, i === 0 ? "acc" : "")}</div><div class="bar mt"><i style="width:${x.fit.phys || 0}%"></i></div>
      <details class="acc mt"><summary class="small">Ağırlıklar ve katkılar</summary><div>${fitTable(x.fit)}</div></details>${x.fit.notes.filter(n => !n.includes("ilgisi")).map(n => `<p class="tiny muted">${esc(n)}</p>`).join("")}
      ${canEditProfile(a.id) ? `<button class="btn sm" data-act="setPos" data-aid="${a.id}" data-sid="${sp.id}" data-pid="${x.ps.id}">Pozisyon olarak kaydet</button>` : ""}</div>`).join("")}`};
});
ACT.setPos = el => { const a = getA(el.dataset.aid); a.primarySport = el.dataset.sid; a.position = el.dataset.pid; save(); toast("Pozisyon kaydedildi"); };

/* ---------- Branş veri tabanı (genişletilebilir) ---------- */
route("/sports", () => ({title: "Branş veri tabanı", html: `${alertBox("info", "", "Branşlar modüler veri yapısında tutulur; yeni branş eklemek için uygulamanın yeniden yazılması gerekmez.")}
  ${allSports().map(s => `<details class="acc"><summary>${esc(s.n)} ${s.custom ? pill("özel", "acc") : ""}</summary><div><p class="small">${esc(s.demands || "")}</p><table class="tbl">${Object.entries(s.w).sort((x, y) => y[1] - x[1]).map(([k, v]) => `<tr><td>${esc(FEAT_N[k])}</td><td class="r">%${Math.round(v * 100)}</td></tr>`).join("")}</table>${s.pos.length ? `<p class="small"><b>Pozisyonlar:</b> ${s.pos.map(x => esc(x.n)).join(", ")}</p>` : ""}${s.custom && role() === "coach" ? `<button class="btn sm danger" data-act="delSport" data-id="${s.id}">Sil</button>` : ""}</div></details>`).join("")}
  ${role() === "coach" ? `<form class="card mt" data-form="sportAdd"><h3>Yeni branş ekle</h3>${field("Branş adı", inp("n", "", "required"))}<div class="grid2">${field("Tür", sel("team", [["0", "Bireysel"], ["1", "Takım"]]))}${field("Temas", sel("contact", [["0", "Temassız"], ["1", "Temaslı"]]))}</div>
    <p class="small muted">Özellik ağırlıkları (0–30; otomatik normalize edilir)</p><div class="grid3">${Object.keys(FEAT_N).map(k => field(FEAT_N[k], inp("w_" + k, "", 'inputmode="numeric"'))).join("")}</div>
    ${field("Boy yönü", sel("hM", [["mid", "Orta ideal"], ["high", "Uzun avantajlı"], ["low", "Kısa avantajlı"]]))}
    ${field("Fiziksel gereksinimler", `<textarea class="in" name="demands"></textarea>`)}${field("Ön koşullar", inp("prereq"))}
    <button class="btn pri block" type="submit">Branşı ekle</button></form>` : ""}`}));
FORM.sportAdd = d => {
  const w = {}; let tot = 0; Object.keys(FEAT_N).forEach(k => { const v = num(d["w_" + k]); if (v > 0) { w[k] = v; tot += v; } });
  if (tot <= 0) throw new Error("En az bir ağırlık girin.");
  Object.keys(w).forEach(k => w[k] = round(w[k] / tot, 3));
  const focus = Object.entries(w).filter(([k]) => QN[k]).sort((x, y) => y[1] - x[1]).map(x => x[0]); QUALITIES.forEach(q => { if (!focus.includes(q.k)) focus.push(q.k); });
  const drills = [...new Set(focus.slice(0, 3).flatMap(q => QWEAK[q].ex.slice(0, 2)))];
  DB.customSports.push({id: "cs_" + uid(), n: d.n.trim(), team: +d.team, contact: +d.contact, hM: d.hM, w, focus: focus.slice(0, 6), prev: ["v1", "b2", "a1", "a6"], drills, demands: d.demands || "", prereq: d.prereq || "", goals: "Branş önceliklerinde bireysel gelişim.", pos: [], custom: 1});
  audit("Yeni branş eklendi", null, d.n); save(); toast("Branş eklendi"); reRender();
};
ACT.delSport = el => { DB.customSports = DB.customSports.filter(s => s.id !== el.dataset.id); save(); reRender(); };
