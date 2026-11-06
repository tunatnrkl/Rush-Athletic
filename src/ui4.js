/* =========================================================================
   PROGRAM OLUŞTURMA, İNCELEME/ONAY, TAKVİM, GÜNLÜK ANTRENMAN, EGZERSİZLER,
   EK GELİŞİM, ZAYIF YÖN MODU, SEZON YÖNETİMİ
   ========================================================================= */
const DURS = [[2, "2 hafta"], [4, "4 hafta"], [6, "6 hafta"], [8, "8 hafta"], [12, "12 hafta"], [16, "16 hafta"], [24, "24 hafta"], [52, "1 yıl"]];
const FOCUSOPT = [["spd", "Sürat geliştirme"], ["pow", "Patlayıcı kuvvet geliştirme"], ["str", "Genel kuvvet geliştirme"], ["agi", "Çeviklik geliştirme"], ["bal", "Denge geliştirme"], ["coo", "Koordinasyon geliştirme"], ["rea", "Reaksiyon geliştirme"], ["mob", "Mobilite geliştirme"], ["end", "Aerobik kapasite geliştirme"], ["sprinttech", "Sprint tekniği geliştirme"]];
function exDose(it) {
  const p = [];
  p.push(it.s + " set");
  if (it.r) p.push(it.r + (it.d ? " × " + it.d + " m" : " tekrar") + (it.ps ? "/taraf" : ""));
  else if (it.d) p.push(it.d + " m");
  if (it.t) p.push(it.t >= 120 ? Math.round(it.t / 60) + " dk" : it.t + " sn" + (it.ps ? "/taraf" : ""));
  if (it.rest) p.push("dinlenme " + (it.rest >= 60 ? (it.rest / 60).toFixed(it.rest % 60 ? 1 : 0).replace(".", ",") + " dk" : it.rest + " sn"));
  return p.join(" · ");
}
function envEqChips(env, eqSel) {
  const sel0 = new Set(eqSel || ENVS[env].eq);
  return `<div class="chips" id="eqChips">${Object.entries(EQUIP).map(([k, v]) => `<label class="chip ${sel0.has(k) ? "on" : ""}" data-toggle><input type="checkbox" name="eq" data-multi="1" value="${k}" ${sel0.has(k) ? "checked" : ""}>${v}</label>`).join("")}</div>`;
}
function wireEnv() {
  const s = $("#envSel"); if (!s) return;
  s.onchange = () => { const e = ENVS[s.value]; $$("#eqChips .chip").forEach(c => { const i = c.querySelector("input"), on = e.eq.includes(i.value); i.checked = on; c.classList.toggle("on", on); }); const sp = $("#spaceChk"); if (sp) sp.checked = e.space; };
}
function nextMonday() { const t = todayISO(), m = mondayOf(t); return m === t ? t : addDays(m, 7); }

route("/a/:aid/program/new", p => {
  const a = getA(p.aid), q = new URLSearchParams(CUR.query || "");
  if (!canEditProgram(a.id)) return {title: "Program oluştur", html: alertBox("warn", "Yetki yok", "Program oluşturma ve onay antrenöre aittir.")};
  const h = holds(a.id), sid = q.get("sport") || a.primarySport || "basketball", sp = sportById(sid);
  const hasSeason = ((a.season || {}).phases || []).length || ((a.season || {}).comps || []).length;
  return {title: "Program süresi ve ayarlar", html: `${h.length ? alertBox("bad", "Program oluşturma beklemede", h.map(esc).join("<br>") + `<br><a href="#/a/${a.id}/health">Sağlık kayıtlarına git</a>`) : ""}
    <form data-form="progGen" data-aid="${a.id}">
    <div class="card"><h3>Branş</h3>${field("Branş", sel("sport", allSports().map(s => [s.id, s.n]), sid, 'id="spSel"'))}
      ${sp && sp.pos.length ? field("Pozisyon (opsiyonel)", sel("pos", [["", "—"]].concat(sp.pos.map(x => [x.id, x.n])), a.position || "")) : ""}</div>
    <div class="card"><h3>Program süresi</h3><div class="chips">${DURS.map(([w, n]) => `<label class="chip"><input type="radio" name="weeks" value="${w}" ${w === 12 ? "checked" : ""}>${n}</label>`).join("")}<label class="chip"><input type="radio" name="weeks" value="custom">Özel süre</label></div>
      ${field("Özel süre (hafta, 1–104)", inp("customWeeks", "", 'inputmode="numeric" placeholder="ör. 10"'))}
      ${field("Başlangıç tarihi", inp("startDate", nextMonday(), 'type="date" required'), "Program haftaları pazartesiden başlar.")}</div>
    <div class="card"><h3>Haftalık yapı</h3><div class="grid2">${field("Seans / hafta", sel("spw", ["1", "2", "3", "4"], "3"))}${field("Seans süresi", sel("minutes", [["30", "30 dk"], ["45", "45 dk"], ["60", "60 dk"], ["75", "75 dk"]], "60"))}</div>
      ${field("Tercih edilen günler", `<div class="chips">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label class="chip" data-toggle><input type="checkbox" name="days" data-multi="1" value="${d}">${DOW[d]}</label>`).join("")}</div>`, `Boş bırakılırsa takım günleri (${(a.teamDays || []).map(d => DOW[d]).join(", ") || "yok"}) dışında otomatik seçilir. Mevcut takım yükü: ${a.weeklySessions || 0} seans/hafta.`)}
      ${field("Yeniden test aralığı", sel("testInterval", [["2", "2 haftada bir"], ["4", "4 haftada bir"], ["6", "6 haftada bir"], ["8", "8 haftada bir"]], "4"))}</div>
    <div class="card"><h3>Antrenman ortamı ve ekipman</h3>${field("Ortam", sel("env", Object.entries(ENVS).map(([k, v]) => [k, v.n]), "school", 'id="envSel"'))}
      <label class="check"><input type="checkbox" name="space" id="spaceChk" checked><span class="small">En az 20 m koşu alanı var</span></label>${field("Kullanılabilir ekipman", envEqChips("school"), "Mevcut olmayan ekipmanı gerektiren egzersizler önerilmez.")}</div>
    <div class="card"><label class="check"><input type="checkbox" name="includeExtra" checked><span class="small"><b>Ek gelişim önerilerini entegre et</b> (yük nötr — koordinasyon/denge bloğuna yerleşir)</span></label>
      <label class="check"><input type="checkbox" name="seasonAware" ${hasSeason ? "checked" : ""}><span class="small"><b>Sezon dönemi ve müsabaka takvimini dikkate al</b> ${hasSeason ? "" : '<span class="muted">(sezon verisi yok)</span>'}</span></label></div>
    <button class="btn pri block" type="submit" ${h.length ? "disabled" : ""}>${ic("bolt")} Programı oluştur</button></form>
    <p class="tiny muted mt">Program, açıklanabilir kural tabanlı motorla (${ENGINE_VERSION}) oluşturulur ve antrenör onayına sunulur. Gerçek sporcu programları bireysel değerlendirme ve uzman onayı gerektirir.</p>`};
});
FORM.progGen = (d, f) => {
  const a = getA(f.dataset.aid);
  let weeks = d.weeks === "custom" ? parseInt(d.customWeeks) : parseInt(d.weeks);
  if (!weeks || weeks < 1 || weeks > 104) throw new Error("Geçerli bir program süresi seçin (1–104 hafta).");
  const opt = {sport: d.sport, pos: d.pos || null, weeks, spw: d.spw, minutes: parseInt(d.minutes), env: d.env, eq: d.eq || [], space: d.space, days: (d.days || []).map(Number), startDate: d.startDate, testInterval: d.testInterval, includeExtra: d.includeExtra, seasonAware: d.seasonAware, type: "main"};
  const r = generateProgram(a, opt);
  if (!r.ok) { sheet(`<h2>Program oluşturulamadı</h2>${r.hold.map(x => alertBox("bad", "", esc(x))).join("")}<button class="btn block" data-act="closeSheet">Kapat</button>`); return; }
  DB.programs.push(r.program);
  audit("Program oluşturuldu (motor)", a.id, `${weeks} hafta, ${sportById(d.sport).n}`);
  notify({key: "pending:" + r.program.id, athleteId: a.id, type: "program", title: "Program onay bekliyor", body: `${a.name} için ${weeks} haftalık ${sportById(d.sport).n} programı incelemenizi bekliyor.`, roles: ["coach"]});
  save(); toast("Program oluşturuldu — inceleme ve onay bekliyor"); go(`#/a/${a.id}/program/${r.program.id}`);
};
route("/a/:aid/programs", p => {
  const a = getA(p.aid), ps = programsOf(a.id);
  return {title: "Programlar", html: `${canEditProgram(a.id) ? `<div class="grid2"><a class="btn pri" href="#/a/${a.id}/program/new">${ic("plus")} Ana program</a><a class="btn" href="#/a/${a.id}/focus">Zayıf yön modu</a></div><div class="hr"></div>` : ""}
    ${ps.length ? `<div class="list">${ps.map(x => li(`#/a/${a.id}/program/${x.id}`, x.type === "focus" ? "target" : "doc", (x.type === "focus" ? QN[x.focusQ] + " odaklı" : esc(sportById(x.sport).n)) + ` · ${x.weeks} hafta`, `${fmtD(x.startDate)} başlangıç · ${x.spw}×${x.minutes} dk · hafta ${clamp(currentWeek(x), 0, x.weeks)}/${x.weeks}`, pill(x.status, x.status === "onaylı" ? "ok" : x.status === "onay bekliyor" ? "warn" : x.status === "reddedildi" ? "bad" : ""))).join("")}</div>` : empty("Program yok.", "doc")}`};
});

/* ---------- Program inceleme / karar destek ---------- */
route("/a/:aid/program/:pid", p => {
  const a = getA(p.aid), pr = DB.programs.find(x => x.id === p.pid); if (!pr) return {title: "Program", html: empty("Program bulunamadı")};
  const q = new URLSearchParams(CUR.query || ""), cw = currentWeek(pr), wsel = clamp(parseInt(q.get("w")) || clamp(cw, 1, pr.weeks), 1, pr.weeks);
  const wk = pr.weeksData.find(w => w.w === wsel), ed = canEditProgram(a.id), sp = sportById(pr.sport);
  const stCls = pr.status === "onaylı" ? "ok" : pr.status === "onay bekliyor" ? "warn" : pr.status === "reddedildi" ? "bad" : "";
  return {title: pr.type === "focus" ? "Zayıf yön programı" : "Program incelemesi", html: `
    <div class="card acc"><div class="row between"><div><div class="tiny muted">${pr.type === "focus" ? "Odak: " + QN[pr.focusQ] : esc(sp.n) + (pr.pos ? " · " + esc((sp.pos.find(x => x.id === pr.pos) || {}).n || "") : "")}</div><h2 style="margin:2px 0">${pr.weeks} haftalık program</h2><div class="small muted">${fmtD(pr.startDate)} – ${fmtD(addDays(pr.startDate, pr.weeks * 7 - 1))} · ${pr.spw} seans × ${pr.minutes} dk</div></div>${pill(pr.status, stCls)}</div>
      <div class="tiny muted mt">Oluşturan: ${esc(pr.engine)} · gelişim evresi ${pr.stage}/6</div></div>
    ${pr.status === "onay bekliyor" ? (ed ? `<div class="card"><h3>Antrenör kararı</h3><p class="small muted">Programı inceleyin; egzersiz, set/tekrar ve yoğunluğu değiştirebilir, önerileri reddedebilirsiniz. Değişiklikler gerekçesiyle kayıt altına alınır.</p>
      ${role() === "parent" ? alertBox("warn", "", "Çalışma alanında antrenör yok. Onaylamadan önce programın yetkin bir antrenör/uzman tarafından incelendiğini beyan etmeniz gerekir.") : ""}
      <div class="btns"><button class="btn pri" data-act="progApprove" data-pid="${pr.id}">Onayla</button><button class="btn danger" data-act="progReject" data-pid="${pr.id}">Reddet</button></div></div>` : alertBox("warn", "Onay bekliyor", "Program antrenör onayından sonra uygulanabilir.")) : ""}
    ${pr.warnings.map(w => alertBox("warn", "", esc(w))).join("")}
    <details class="acc"><summary>Programın gerekçesi (açıklanabilirlik)</summary><div><ul class="small" style="padding-left:18px">${pr.rationale.map(r => `<li>${esc(r)}</li>`).join("")}</ul></div></details>
    <div class="card"><h3>Dönemlendirme</h3>${pr.blocks.map(b => `<div class="row" style="padding:5px 0"><span class="pill ${b.key === "test" ? "info" : "acc"} nowrap">${b.from === b.to ? b.from : b.from + "–" + b.to}. hf</span><span class="small">${esc(b.name)}${pr.blocks.some(x => x.cycle > 1) ? ` <span class="muted">(döngü ${b.cycle})</span>` : ""}</span></div>`).join("")}
      <p class="small mt"><b>Değerlendirme haftaları:</b> başlangıç, ${pr.testWeeks.join(", ")}. hafta</p><p class="tiny muted">Önerilen batarya: ${pr.battery.map(id => TEST[id] ? TEST[id].n : id).join(", ")}</p></div>
    <h3>Hafta seçimi</h3><div class="chips" style="max-height:132px;overflow:auto">${pr.weeksData.map(w => `<a class="chip ${w.w === wsel ? "on" : ""}" href="#/a/${a.id}/program/${pr.id}?w=${w.w}">${w.w}${w.deload ? "↓" : ""}${w.test ? "T" : ""}${w.w === cw ? "•" : ""}</a>`).join("")}</div>
    ${wk ? `<div class="card mt"><div class="tiny muted">Hafta ${wk.w} · ${fmtD(wk.start)}</div><h3 style="margin:2px 0">${esc(wk.phase)}</h3><div class="small">Hacim katsayısı ×${wk.mult}</div>${wk.notes.map(n => `<div class="small muted">• ${esc(n)}</div>`).join("")}</div>
      ${wk.sessions.map(s => sessionPlanHTML(a, pr, wk, s, ed)).join("")}` : ""}
    ${pr.changes.length ? `<h3>Değişiklik kaydı</h3><div class="card">${pr.changes.slice().reverse().map(c => `<div style="padding:7px 0;border-bottom:1px solid var(--line)"><div class="tiny muted">${fmtDT(c.at)} · ${esc(c.by)}</div><div class="small"><b>${esc(c.what)}</b></div><div class="small muted">Gerekçe: ${esc(c.reason)}</div></div>`).join("")}</div>` : ""}
    ${pr.approvals.length ? `<h3>Onay geçmişi</h3><div class="card">${pr.approvals.map(x => `<div class="small" style="padding:4px 0">${fmtDT(x.at)} — ${esc(x.by)}: ${esc(x.action)}${x.note ? ` <span class="muted">(${esc(x.note)})</span>` : ""}</div>`).join("")}</div>` : ""}
    <p class="tiny muted">Antrenör kararları kayıt altına alınır; ancak otomatik olarak tıbbi onay veya bilimsel doğruluk kabul edilmez.</p>
    <div class="btns"><a class="btn" href="#/a/${a.id}/calendar">Takvimde gör</a>${S.me && mySettings().aiUrl ? `<button class="btn blue" data-act="aiComment" data-pid="${pr.id}">Harici AI yorumu</button>` : ""}${ed ? `<button class="btn danger" data-act="progDelete" data-pid="${pr.id}">Programı sil</button>` : ""}</div>
    <div id="aiOut"></div>`};
});
function sessionPlanHTML(a, pr, wk, s, ed) {
  const l = logOf(pr.id, wk.w, s.d);
  return `<div class="card"><div class="row between"><div class="grow"><div class="tiny muted">${DOWL[s.dow]} · ${fmtD(s.date)}${s.test ? " · test günü" : ""}</div><b>${esc(s.title)}</b><div class="tiny muted">≈${s.estMin} dk · plyometrik temas ${s.contacts}/${s.cap}</div></div>${l ? pill(l.status, l.status === "tamamlandı" ? "ok" : "warn") : ""}</div>
    ${s.blocks.map((b, bi) => `<div class="blockh">${esc(b.n)}</div>${b.items.map((it, ii) => { const ex = exById(it.e); return `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><div class="grow"><a href="#/ex/${it.e}" class="small" style="color:var(--ink);font-weight:650;text-decoration:none">${esc(ex ? ex.n : it.e)}</a> ${it.extra ? pill("ek gelişim", "acc") : ""}${it.mod ? pill("antrenör", "info") : ""}<div class="tiny muted">${exDose(it)} · ${esc(it.rpe || "")}</div>${it.note ? `<div class="tiny" style="color:var(--info)">${esc(it.note)}</div>` : ""}</div>${ed ? `<button class="btn sm ghost" data-act="itemEdit" data-pid="${pr.id}" data-w="${wk.w}" data-d="${s.d}" data-b="${bi}" data-i="${ii}" aria-label="Düzenle">✎</button>` : ""}</div>`; }).join("")}
      ${ed ? `<button class="btn sm ghost" data-act="itemAdd" data-pid="${pr.id}" data-w="${wk.w}" data-d="${s.d}" data-b="${bi}">+ Egzersiz ekle</button>` : ""}`).join("")}
    ${pr.status === "onaylı" ? `<a class="btn ${l ? "" : "pri"} block mt" href="#/a/${a.id}/session/${pr.id}/${wk.w}/${s.d}">${l ? "Seans kaydını aç" : "Seansı başlat"}</a>` : ""}</div>`;
}
ACT.progApprove = async el => {
  const pr = DB.programs.find(x => x.id === el.dataset.pid), a = getA(pr.athleteId);
  let note = "";
  if (role() === "parent") { if (!await confirmBox("Bu programın yetkin bir antrenör/uzman tarafından incelendiğini ve çocuğun sağlık durumuna uygun olduğunu beyan ediyor musunuz?", "Beyan ediyorum")) return; note = "Veli beyanı: uzman incelemesi yapıldı"; }
  else { const v = await promptBox("Programı onayla", "Onay notu (opsiyonel)", "", false); if (v === null) return; note = v; }
  if (pr.type === "main") DB.programs.filter(x => x.id !== pr.id && x.athleteId === a.id && x.type === "main" && x.status === "onaylı").forEach(x => { x.status = "arşiv"; });
  pr.status = "onaylı"; pr.approvals.push({at: Date.now(), by: S.me.name + " (" + ROLE_N[role()] + ")", action: "Onaylandı", note});
  notify({key: "approved:" + pr.id + ":" + Date.now(), athleteId: a.id, type: "program", title: "Program onaylandı ✅", body: `${a.name}: ${pr.weeks} haftalık program ${fmtD(pr.startDate)} tarihinde başlıyor.`, roles: ["athlete", "parent", "coach"]});
  audit("Program onaylandı", a.id, note); save(); toast("Program onaylandı"); reRender();
};
ACT.progReject = async el => {
  const pr = DB.programs.find(x => x.id === el.dataset.pid); const r = await promptBox("Programı reddet", "Ret gerekçesi (kayıt altına alınır)"); if (!r) return;
  pr.status = "reddedildi"; pr.approvals.push({at: Date.now(), by: S.me.name, action: "Reddedildi", note: r}); pr.changes.push({at: Date.now(), by: S.me.name, what: "Motor önerisi reddedildi", reason: r});
  audit("Program reddedildi", pr.athleteId, r); save(); reRender();
};
ACT.progDelete = async el => { const pr = DB.programs.find(x => x.id === el.dataset.pid); if (!await confirmBox("Program ve bağlı seans kayıtları silinsin mi?", "Sil", true)) return; DB.programs = DB.programs.filter(x => x !== pr); DB.logs = DB.logs.filter(l => l.programId !== pr.id); audit("Program silindi", pr.athleteId, ""); save(); go(`#/a/${pr.athleteId}/programs`); };
function itemScopeTargets(pr, w, d, b, exId, scope) {
  const wk = pr.weeksData.find(x => x.w === w);
  const targets = [];
  const weeks = scope === "week" ? [wk] : scope === "block" ? pr.weeksData.filter(x => x.key === wk.key && x.cycle === wk.cycle && x.w >= w) : pr.weeksData.filter(x => x.w >= w);
  for (const W of weeks) { const s = W.sessions.find(x => x.d === d); if (!s || !s.blocks[b]) continue; s.blocks[b].items.forEach((it, i) => { if (it.e === exId) targets.push({W, s, blk: s.blocks[b], it, i}); }); }
  return targets;
}
ACT.itemEdit = el => {
  const pr = DB.programs.find(x => x.id === el.dataset.pid), w = +el.dataset.w, d = +el.dataset.d, b = +el.dataset.b, i = +el.dataset.i;
  const s = pr.weeksData.find(x => x.w === w).sessions.find(x => x.d === d), it = s.blocks[b].items[i], ex = exById(it.e), a = getA(pr.athleteId);
  const ctx = buildCtx(a, {eq: pr.eq, space: pr.space, sport: pr.sport});
  const alts = allExercises().filter(e => e.c === ex.c && e.id !== ex.id && allowedEx(e, ctx, 6));
  sheet(`<h2>${esc(ex.n)}</h2><form data-form="itemSave" data-pid="${pr.id}" data-w="${w}" data-d="${d}" data-b="${b}" data-i="${i}">
    ${field("Egzersizi değiştir", sel("swap", [["", "— aynı egzersiz —"]].concat(alts.map(e => [e.id, e.n + (e.lv > ctx.stage ? " (evre üstü!)" : "")]))))}
    <div class="grid2">${field("Set", inp("s", it.s, 'inputmode="numeric"'))}${field("Tekrar", inp("r", it.r ?? "", 'inputmode="numeric"'))}${field("Süre (sn)", inp("t", it.t ?? "", 'inputmode="numeric"'))}${field("Mesafe (m)", inp("dd", it.d ?? "", 'inputmode="numeric"'))}${field("Dinlenme (sn)", inp("rest", it.rest ?? "", 'inputmode="numeric"'))}</div>
    ${field("Yoğunluk", inp("rpe", it.rpe || ""))}${field("Sporcuya not", inp("note", it.note || ""))}
    ${field("Uygulama kapsamı", sel("scope", [["week", "Yalnızca bu hafta"], ["block", "Bu bloğun kalan haftaları"], ["all", "Programın kalan tüm haftaları"]], "week"))}
    ${field("Değişiklik gerekçesi *", `<textarea class="in" name="reason" required placeholder="ör. Sporcunun iniş tekniği henüz hazır değil"></textarea>`)}
    <div class="btns"><button type="button" class="btn danger" data-act="itemDelete" data-pid="${pr.id}" data-w="${w}" data-d="${d}" data-b="${b}" data-i="${i}">Egzersizi sil</button><button class="btn pri" type="submit">Kaydet</button></div></form>`);
};
FORM.itemSave = (dd, f) => {
  const pr = DB.programs.find(x => x.id === f.dataset.pid), w = +f.dataset.w, d = +f.dataset.d, b = +f.dataset.b, i = +f.dataset.i;
  const it0 = pr.weeksData.find(x => x.w === w).sessions.find(x => x.d === d).blocks[b].items[i];
  if (!dd.reason.trim()) throw new Error("Gerekçe zorunlu.");
  const sN = num(dd.s); if (!isNum(sN) || sN < 1 || sN > 10) throw new Error("Set 1–10 arasında olmalı.");
  const exName = exById(it0.e).n, targets = itemScopeTargets(pr, w, d, b, it0.e, dd.scope);
  const ch = [];
  if (dd.swap && dd.swap !== it0.e) learnPref(it0.e, dd.swap);
  for (const T of targets) {
    const it = T.it;
    if (dd.swap) it.e = dd.swap;
    it.s = sN; ["r", "t", "rest"].forEach(k => { const v = num(dd[k]); if (v == null) delete it[k]; else it[k] = v; });
    const dv = num(dd.dd); if (dv == null) delete it.d; else it.d = dv;
    it.rpe = dd.rpe; it.note = dd.note; it.mod = 1;
  }
  ch.push(`${exName}${dd.swap ? " → " + exById(dd.swap).n : ""}: ${sN} set${dd.r ? " × " + dd.r : ""} (${targets.length} seans, ${{week: "bu hafta", block: "blok", all: "kalan haftalar"}[dd.scope]})`);
  pr.changes.push({at: Date.now(), by: S.me.name, role: role(), what: ch.join("; "), reason: dd.reason.trim()});
  audit("Program düzenlendi", pr.athleteId, ch[0]); save(); closeSheet(); toast("Değişiklik kaydedildi"); reRender();
};
ACT.itemDelete = async el => {
  const pr = DB.programs.find(x => x.id === el.dataset.pid), w = +el.dataset.w, d = +el.dataset.d, b = +el.dataset.b, i = +el.dataset.i;
  const s = pr.weeksData.find(x => x.w === w).sessions.find(x => x.d === d), it = s.blocks[b].items[i];
  closeSheet(); const r = await promptBox("Egzersizi sil", "Gerekçe (zorunlu)"); if (!r) return;
  s.blocks[b].items.splice(i, 1); learnPref(it.e, null); pr.changes.push({at: Date.now(), by: S.me.name, what: `${exById(it.e).n} silindi (hafta ${w})`, reason: r});
  audit("Program düzenlendi", pr.athleteId, "egzersiz silindi"); save(); reRender();
};
ACT.itemAdd = el => {
  const pr = DB.programs.find(x => x.id === el.dataset.pid), a = getA(pr.athleteId), ctx = buildCtx(a, {eq: pr.eq, space: pr.space, sport: pr.sport});
  const list = allExercises().filter(e => allowedEx(e, ctx, 6));
  sheet(`<h2>Egzersiz ekle</h2><form data-form="itemAddSave" data-pid="${pr.id}" data-w="${el.dataset.w}" data-d="${el.dataset.d}" data-b="${el.dataset.b}">
    ${field("Egzersiz", sel("e", list.map(e => [e.id, CATS[e.c] + " — " + e.n + (e.lv > ctx.stage ? " (evre üstü)" : "")])))}<div class="grid2">${field("Set", inp("s", 2, 'inputmode="numeric"'))}${field("Tekrar", inp("r", 8, 'inputmode="numeric"'))}</div>
    ${field("Gerekçe *", `<textarea class="in" name="reason" required></textarea>`)}<div class="btns"><button class="btn pri" type="submit">Ekle</button></div></form>
    <p class="tiny muted">Liste sporcunun sağlık kısıtlamaları ve program ekipmanına göre filtrelenmiştir.</p>`);
};
FORM.itemAddSave = (d, f) => {
  const pr = DB.programs.find(x => x.id === f.dataset.pid), s = pr.weeksData.find(x => x.w === +f.dataset.w).sessions.find(x => x.d === +f.dataset.d);
  const ex = exById(d.e), base = doseFor(ex, buildCtx(getA(pr.athleteId), {eq: pr.eq, space: pr.space, sport: pr.sport}), "str", 0, 1);
  base.s = num(d.s) || base.s; if (num(d.r)) base.r = num(d.r); base.mod = 1;
  s.blocks[+f.dataset.b].items.push(base); pr.changes.push({at: Date.now(), by: S.me.name, what: `${ex.n} eklendi (hafta ${f.dataset.w})`, reason: d.reason});
  save(); closeSheet(); reRender();
};
ACT.aiComment = async el => {
  const pr = DB.programs.find(x => x.id === el.dataset.pid), a = getA(pr.athleteId), url = mySettings().aiUrl, out = $("#aiOut");
  if (!consent(a.id, "data")) { toast("Veri işleme izni yok"); return; }
  out.innerHTML = `<div class="card small">Harici AI sunucusuna anonim özet gönderiliyor…</div>`;
  const payload = {age: Math.floor(ageAt(a.birthDate)), sex: a.sex, sport: pr.sport, stage: pr.stage, weeks: pr.weeks, restrictions: [...restrictions(a.id)], qualities: Object.fromEntries(Object.entries(qualityScores(a)).map(([k, v]) => [k, v.score])), rationale: pr.rationale};
  try {
    const r = await fetch(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({task: "program_review", data: payload})});
    if (!r.ok) throw new Error("HTTP " + r.status); const j = await r.json().catch(() => ({text: "Yanıt okunamadı"}));
    out.innerHTML = `<div class="card"><h3>Harici AI yorumu</h3><p class="small">${esc(j.text || j.message || JSON.stringify(j)).slice(0, 4000)}</p><p class="tiny muted">Harici sunucunun yanıtıdır; antrenör değerlendirmesinin yerini tutmaz.</p></div>`;
    audit("Harici AI yorumu istendi (anonim)", a.id, url);
  } catch (e) { out.innerHTML = alertBox("bad", "AI sunucusuna ulaşılamadı", esc(e.message) + ". Sunucu adresini ve CORS ayarlarını kontrol edin."); }
};

/* ---------- Haftalık takvim ---------- */
route("/a/:aid/calendar", p => {
  const a = getA(p.aid), q = new URLSearchParams(CUR.query || ""), off = parseInt(q.get("o")) || 0;
  const ws = addDays(mondayOf(todayISO()), off * 7), we = addDays(ws, 6), t = todayISO();
  const pl = plannedSessions(a.id, ws, we), comps = compsBetween(a, ws, we), team = (a.teamDays || []).map(Number);
  const ext = DB.extLoads.filter(e => e.athleteId === a.id && e.date >= ws && e.date <= we);
  const days = Array.from({length: 7}, (_, i) => addDays(ws, i));
  const ad = adherence(a.id, addDays(t, -27), t);
  const pend = programsOf(a.id).find(x => x.status === "onay bekliyor");
  return {title: "Haftalık takvim", html: `<div class="row between"><a class="btn sm" href="#/a/${a.id}/calendar?o=${off - 1}">‹ Önceki</a><b class="small">${fmtD(ws)} – ${fmtD(we)}</b><a class="btn sm" href="#/a/${a.id}/calendar?o=${off + 1}">Sonraki ›</a></div>
    ${pend ? alertBox("warn", "", "Onay bekleyen bir program var; onaylanana kadar takvimde gösterilmez.") : ""}
    <div class="week mt">${days.map(d => { const dow = parseISO(d).getDay(); const ss = pl.filter(x => x.s.date === d); const cs = comps.filter(c => c.date === d);
      return `<div class="day ${d === t ? "today" : ""}"><span class="muted">${DOW[dow]}</span><b>${parseISO(d).getDate()}</b>${ss.map(x => { const l = logOf(x.p.id, x.wk.w, x.s.d); return `<span class="ev ${l && l.status === "tamamlandı" ? "d" : "s"}">${l && l.status === "tamamlandı" ? "✓" : "S"}${x.s.test ? "T" : ""}</span>`; }).join("")}${team.includes(dow) ? '<span class="ev t">Takım</span>' : ""}${cs.map(() => '<span class="ev c">Maç</span>').join("")}</div>`; }).join("")}</div>
    ${legend([[COL.cur, "Program seansı (S)"], [COL.ok, "Tamamlandı"], [COL.blue, "Takım antrenmanı"], [COL.tgt, "Müsabaka"]])}
    <h3>Bu haftanın seansları</h3>${pl.length ? `<div class="list">${pl.map(x => { const l = logOf(x.p.id, x.wk.w, x.s.d); return li(`#/a/${a.id}/session/${x.p.id}/${x.wk.w}/${x.s.d}`, "bolt", `${DOWL[x.s.dow]} — ${esc(x.s.title)}`, `Hafta ${x.wk.w} · ${esc(x.wk.phase)} · ≈${x.s.estMin} dk`, l ? pill(l.status, l.status === "tamamlandı" ? "ok" : "warn") : x.s.date < t ? pill("yapılmadı", "bad") : ""); }).join("")}</div>` : `<p class="small muted">Bu hafta planlı seans yok.</p>`}
    ${comps.length ? `<h3>Müsabakalar</h3>${comps.map(c => `<div class="card flat small"><b>${esc(c.name)}</b> · ${fmtD(c.date)} · önem: ${esc(c.imp)}</div>`).join("")}` : ""}
    ${ext.length ? `<h3>Kaydedilen dış yükler</h3>${ext.map(e => `<div class="small">${fmtD(e.date)} · ${esc(e.type)} · ${e.duration} dk · RPE ${e.rpe}</div>`).join("")}` : ""}
    <div class="card mt"><h3>Antrenman devamlılığı (son 4 hafta)</h3><div class="row">${ringSVG(ad.pct, "devam")}<div class="small">${ad.done} / ${ad.planned} planlı seans tamamlandı.</div></div></div>`};
});

/* ---------- Günlük antrenman ---------- */
const READY = [["Çok iyi", "😄"], ["İyi", "🙂"], ["Normal", "😐"], ["Yorgun", "😮‍💨"], ["Çok yorgun", "😫"]];
const RPE_D = ["Dinlenme", "Çok çok hafif", "Çok hafif", "Hafif", "Orta", "Biraz zor", "Zor", "Zor+", "Çok zor", "Çok çok zor", "Maksimal"];
let SESS = {timer: null, rest: null, restEnd: 0};
function sessionCtx(p) { const pr = DB.programs.find(x => x.id === p.pid); if (!pr) return null; const wk = pr.weeksData.find(w => w.w === +p.w); if (!wk) return null; const s = wk.sessions.find(x => x.d === +p.d); return s ? {pr, wk, s} : null; }
function adaptedItems(s, log) {
  const out = [];
  s.blocks.forEach((b, bi) => b.items.forEach((it, ii) => {
    const ex = exById(it.e); let skip = null, sets = it.s;
    if (log.mod === "hafif" && !["warm", "mob", "cool"].includes(b.k)) skip = "Bugün yalnızca hafif mobilite";
    if (log.mod === "ağrı" && ex && (ex.tg.includes("jump") || ex.tg.includes("sprint"))) skip = "Ağrı bildirimi: sıçrama/sprint çıkarıldı";
    if (log.mod === "yorgun" && ex && ((ex.c === "plyo" && ex.lv >= 3) || ex.tg.includes("maxEffort"))) skip = "Yorgunluk: yüksek şiddet çıkarıldı";
    if ((log.mod === "yorgun" || log.mod === "ağrı") && !["warm", "mob", "cool"].includes(b.k)) sets = Math.max(1, Math.round(sets * 0.7));
    out.push({bi, ii, b, it, ex, sets, skip, key: bi + "-" + ii});
  }));
  return out;
}
route("/a/:aid/session/:pid/:w/:d", p => {
  const a = getA(p.aid), c = sessionCtx(p); if (!c) return {title: "Seans", html: empty("Seans bulunamadı")};
  const {pr, wk, s} = c, log = logOf(pr.id, wk.w, s.d), mine = role() === "athlete" || canEditProgram(a.id) || role() === "parent";
  clearInterval(SESS.timer); clearInterval(SESS.rest);
  const head = `<div class="card acc"><div class="tiny muted">Hafta ${wk.w} · ${esc(wk.phase)} · ${DOWL[s.dow]} ${fmtD(s.date)}</div><h2 style="margin:2px 0">${esc(s.title)}</h2><div class="small muted">≈${s.estMin} dk · plyometrik temas ${s.contacts}</div></div>`;
  if (pr.status !== "onaylı") return {title: "Günlük antrenman", html: head + alertBox("warn", "Program onaylı değil", "Antrenman, program antrenör tarafından onaylandıktan sonra başlatılabilir.")};
  if (!log) {
    const h = holds(a.id);
    if (h.length) return {title: "Günlük antrenman", html: head + alertBox("bad", "Antrenman başlatılamaz", h.map(esc).join("<br>"))};
    return {title: "Hazır oluş değerlendirmesi", html: head + (mine ? `<form data-form="ready" data-aid="${a.id}" data-pid="${pr.id}" data-w="${wk.w}" data-d="${s.d}"><div class="card"><h3>Bugün kendini nasıl hissediyorsun?</h3><div class="ready">${READY.map(([n, e], i) => `<label><input type="radio" name="readiness" value="${n}" ${i === 2 ? "checked" : ""} style="position:absolute;opacity:0"><button type="button" class="${i === 2 ? "on" : ""}" data-act="pickReady"><span class="emoji">${e}</span>${n}</button></label>`).join("")}</div></div>
      <div class="card"><div class="grid2">${field("Dün geceki uyku (saat)", inp("sleep", a.sleepHours || "", 'inputmode="decimal"'))}${field("Ağrın var mı?", sel("pain", [["0", "Yok"], ["1", "Var"]], "0", 'id="painSel"'))}</div>
      <div id="painBox" style="display:none">${field("Ağrı bölgesi", inp("painArea", "", 'placeholder="ör. sağ diz"'))}${field("Ağrı şiddeti (0–10)", sel("painLevel", Array.from({length: 11}, (_, i) => [String(i), String(i)]), "2"))}</div></div>
      <button class="btn pri block" type="submit">Devam et</button></form>` : alertBox("info", "", "Seans henüz başlatılmadı."))};
  }
  afterRender.push(() => wireSessionTimers(log));
  if (log.status === "durduruldu") return {title: "Günlük antrenman", html: head + alertBox("bad", "Antrenman durduruldu", esc(log.stopReason || "") + "<br><br>Bugün dinlenmen önerilir. Ağrı devam ederse velin ve antrenörünle birlikte bir sağlık uzmanına başvur. Uygulama teşhis koymaz.") + (log.painResolved ? "" : canEditProgram(a.id) ? `<button class="btn block" data-act="painResolve" data-id="${log.id}">Antrenör: değerlendirildi, devam edilebilir</button>` : "") + logSummary(log)};
  const items = adaptedItems(s, log), done = log.done || {};
  const totalSets = items.filter(x => !x.skip).reduce((n, x) => n + x.sets, 0), doneSets = items.filter(x => !x.skip).reduce((n, x) => n + Math.min(x.sets, done[x.key] || 0), 0);
  const finished = log.status === "tamamlandı" || log.status === "kısmi";
  let lastB = -1;
  return {title: "Günlük antrenman", keepScroll: true, html: head +
    (log.mod !== "normal" ? alertBox(log.mod === "hafif" ? "bad" : "warn", "Antrenman uyarlandı", {yorgun: "Yorgunluk bildirdiğin için hacim %30 azaltıldı ve yüksek şiddetli çalışmalar çıkarıldı.", ağrı: `Hafif ağrı (${log.painLevel}/10, ${esc(log.painArea || "")}) bildirdin: sıçrama ve sprint çıkarıldı, hacim azaltıldı. Ağrı artarsa hemen dur.`, hafif: "Bugün yalnızca hafif mobilite ve soğuma uygulanır."}[log.mod] || "") : "") +
    `<div class="card" style="position:sticky;top:calc(var(--safeT) + 66px);z-index:10"><div class="row between"><div><div class="tiny muted">Süre</div><div class="timer" id="sessT" style="font-size:1.5rem;text-align:left">00:00</div></div><div class="grow" style="max-width:150px"><div class="tiny muted">${doneSets}/${totalSets} set</div><div class="bar"><i style="width:${totalSets ? doneSets / totalSets * 100 : 0}%"></i></div></div><div id="restBox" class="center" style="min-width:86px"></div></div></div>
    ${s.test ? `<div class="card flat"><h3>Test bataryası (değerlendirme günü)</h3><p class="small muted">Isınmadan sonra uygulayın. ${canEnterTests(a.id) ? "" : "Testleri antrenör kaydeder."}</p><div class="chips">${pr.battery.map(id => TEST[id] ? (canEnterTests(a.id) ? `<button class="chip" data-act="testEntry" data-aid="${a.id}" data-t="${id}">${esc(TEST[id].n)}</button>` : pill(TEST[id].n)) : "").join("")}</div></div>` : ""}
    ${items.map(x => { const hb = x.bi !== lastB ? `<div class="blockh">${esc(x.b.n)}</div>` : ""; lastB = x.bi; const dn = done[x.key] || 0;
      return hb + `<div class="ex ${!x.skip && dn >= x.sets ? "done" : ""}" ${x.skip ? 'style="opacity:.5"' : ""}><div class="row between"><a class="nm" href="#/ex/${x.it.e}" style="color:var(--ink);text-decoration:none">${esc(x.ex ? x.ex.n : x.it.e)} ›</a>${x.it.extra ? pill("ek gelişim", "acc") : ""}</div>
        <div class="small muted">${x.skip ? `<s>${exDose(x.it)}</s> — ${esc(x.skip)}` : exDose(Object.assign({}, x.it, {s: x.sets})) + " · " + esc(x.it.rpe || "")}</div>${x.it.note ? `<div class="tiny" style="color:var(--info)">${esc(x.it.note)}</div>` : ""}
        ${!x.skip && !finished ? `<div class="sets">${Array.from({length: x.sets}, (_, k) => `<button class="setb ${k < dn ? "on" : ""}" data-act="setTap" data-id="${log.id}" data-k="${x.key}" data-n="${k + 1}" data-rest="${x.it.rest || 0}" aria-label="Set ${k + 1}">${k + 1}</button>`).join("")}</div>` : ""}</div>`; }).join("")}
    ${finished ? logSummary(log) : `<div class="btns"><button class="btn danger" data-act="painReport" data-id="${log.id}">Ağrı / sorun bildir</button><button class="btn pri" data-act="finishSess" data-id="${log.id}">Antrenmanı bitir</button></div>`}`};
});
function logSummary(l) {
  return `<div class="card mt"><h3>Seans kaydı</h3><dl class="kv"><dt>Durum</dt><dd>${esc(l.status)}</dd><dt>Hazır oluş</dt><dd>${esc(l.readiness)}</dd><dt>Uyku</dt><dd>${isNum(l.sleep) ? l.sleep + " sa" : "—"}</dd>${isNum(l.duration) ? `<dt>Süre</dt><dd>${l.duration} dk</dd>` : ""}${isNum(l.rpe) ? `<dt>Zorluk (RPE)</dt><dd>${l.rpe}/10 — ${RPE_D[l.rpe]}</dd><dt>Seans yükü</dt><dd>${l.load} AU</dd>` : ""}${isNum(l.fatigue) ? `<dt>Antrenman sonrası yorgunluk</dt><dd>${l.fatigue}/5</dd>` : ""}<dt>Ağrı</dt><dd>${l.painLevel ? l.painLevel + "/10 " + esc(l.painArea || "") : "Yok"}</dd></dl>${l.notes ? `<p class="small">${esc(l.notes)}</p>` : ""}</div>`;
}
function wireSessionTimers(log) {
  const el = $("#sessT"); if (!el) return;
  const tick = () => { const ms = (log.endedAt || Date.now()) - log.startedAt; const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60; el.textContent = pad2(m) + ":" + pad2(s); };
  tick(); if (!log.endedAt) SESS.timer = setInterval(() => { if (!document.body.contains(el)) { clearInterval(SESS.timer); return; } tick(); }, 1000);
  if (SESS.restEnd > Date.now()) startRest();
}
function startRest() {
  clearInterval(SESS.rest);
  const box = $("#restBox"); if (!box) return;
  const draw = () => { const left = Math.ceil((SESS.restEnd - Date.now()) / 1000); if (!document.body.contains(box)) { clearInterval(SESS.rest); return; } if (left <= 0) { box.innerHTML = `<span class="pill ok">Hazır!</span>`; clearInterval(SESS.rest); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} beep(); return; } box.innerHTML = `<div class="tiny muted">Dinlenme</div><b style="font-size:1.25rem">${pad2(Math.floor(left / 60))}:${pad2(left % 60)}</b><div><button class="btn sm ghost" style="min-height:30px;padding:2px 8px" data-act="restAdd">+15</button><button class="btn sm ghost" style="min-height:30px;padding:2px 8px" data-act="restSkip">Atla</button></div>`; };
  draw(); SESS.rest = setInterval(draw, 500);
}
function beep() { try { const C = window.AudioContext || window.webkitAudioContext; const c = new C(); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880; o.connect(g); g.connect(c.destination); g.gain.value = .15; o.start(); o.stop(c.currentTime + .25); } catch (e) {} }
ACT.restAdd = () => { SESS.restEnd += 15000; startRest(); };
ACT.restSkip = () => { SESS.restEnd = 0; startRest(); };
ACT.pickReady = el => { const lab = el.closest("label"); $$(".ready button").forEach(b => b.classList.remove("on")); el.classList.add("on"); lab.querySelector("input").checked = true; };
document.addEventListener("change", e => { if (e.target.id === "painSel") $("#painBox").style.display = e.target.value === "1" ? "block" : "none"; });
FORM.ready = (d, f) => {
  const a = getA(f.dataset.aid), pid = f.dataset.pid, w = +f.dataset.w, dd = +f.dataset.d;
  const pain = d.pain === "1" ? num(d.painLevel) || 0 : 0;
  const log = {id: uid("l_"), key: logKey(pid, w, dd), athleteId: a.id, programId: pid, w, d: dd, date: todayISO(), readiness: d.readiness, sleep: num(d.sleep), painLevel: pain, painArea: pain ? d.painArea : "", startedAt: Date.now(), done: {}, status: "devam ediyor", mod: "normal", by: S.me.name};
  if (pain >= 4 || d.readiness === "Çok yorgun") {
    log.status = "durduruldu"; log.endedAt = Date.now();
    log.stopReason = pain >= 4 ? `Ağrı şiddeti ${pain}/10 (${d.painArea || "bölge belirtilmedi"}) bildirildi.` : "Çok yorgun hissettiğini bildirdin.";
    if (pain < 4) { log.status = "devam ediyor"; log.mod = "hafif"; delete log.endedAt; }
    notify({key: "stop:" + log.id, athleteId: a.id, type: "health", title: pain >= 4 ? "Ağrı nedeniyle antrenman durduruldu" : "Çok yorgun — hafif seans", body: `${a.name}: ${log.stopReason}`, roles: ["coach", "parent"]});
  } else if (pain > 0) log.mod = "ağrı";
  else if (d.readiness === "Yorgun") log.mod = "yorgun";
  DB.logs.push(log); audit("Seans başlatıldı", a.id, `hazır oluş: ${d.readiness}`); save(); reRender();
};
ACT.setTap = el => {
  const l = DB.logs.find(x => x.id === el.dataset.id), k = el.dataset.k, n = +el.dataset.n;
  l.done[k] = (l.done[k] || 0) >= n ? n - 1 : n;
  if (l.done[k] >= n && +el.dataset.rest > 0) SESS.restEnd = Date.now() + (+el.dataset.rest) * 1000;
  save(); reRender();
};
ACT.painReport = el => {
  sheet(`<h2>Ağrı / sorun bildir</h2><form data-form="painRep" data-id="${el.dataset.id}">${field("Bölge", inp("area", "", "required"))}${field("Şiddet (0–10)", sel("lvl", Array.from({length: 11}, (_, i) => [String(i), String(i)]), "3"))}${field("Açıklama", `<textarea class="in" name="desc"></textarea>`)}
    <p class="small muted">4 ve üzeri şiddette antrenman otomatik durdurulur.</p><div class="btns"><button class="btn pri" type="submit">Bildir</button></div></form>`);
};
FORM.painRep = (d, f) => {
  const l = DB.logs.find(x => x.id === f.dataset.id), a = getA(l.athleteId), lvl = num(d.lvl) || 0;
  l.painLevel = Math.max(l.painLevel || 0, lvl); l.painArea = d.area; l.notes = ((l.notes || "") + " Ağrı: " + d.desc).trim();
  if (lvl >= 4) { l.status = "durduruldu"; l.endedAt = Date.now(); l.stopReason = `Antrenman sırasında ${lvl}/10 ağrı (${d.area}).`; l.duration = Math.round((l.endedAt - l.startedAt) / 60000); }
  else if (l.mod === "normal") l.mod = "ağrı";
  notify({key: "pain:" + l.id + ":" + Date.now(), athleteId: a.id, type: "health", title: "Ağrı bildirimi", body: `${a.name}: ${d.area} ${lvl}/10${lvl >= 4 ? " — antrenman durduruldu" : ""}`, roles: ["coach", "parent"]});
  audit("Ağrı bildirildi", a.id, `${d.area} ${lvl}/10`); save(); closeSheet(); reRender();
};
ACT.painResolve = async el => { const l = DB.logs.find(x => x.id === el.dataset.id); if (!await confirmBox("Ağrı bildirimi antrenör/uzman tarafından değerlendirildi ve sporcu antrenmana devam edebilir mi?", "Onaylıyorum")) return; l.painResolved = {by: S.me.name, at: Date.now()}; audit("Ağrı bildirimi değerlendirildi", l.athleteId, ""); save(); reRender(); };
ACT.finishSess = el => {
  const l = DB.logs.find(x => x.id === el.dataset.id), mins = Math.max(1, Math.round((Date.now() - l.startedAt) / 60000));
  sheet(`<h2>Antrenmanı bitir</h2><form data-form="finish" data-id="${l.id}">${field("Süre (dk)", inp("duration", mins, 'inputmode="numeric" required'))}
    <label class="f"><span>Antrenman ne kadar zordu? (RPE 0–10)</span><div class="rpe">${Array.from({length: 11}, (_, i) => `<button type="button" class="${i === 5 ? "on" : ""}" data-act="pickRpe" data-v="${i}">${i}</button>`).join("")}</div><input type="hidden" name="rpe" value="5" id="rpeIn"><div class="hint" id="rpeD">${RPE_D[5]}</div></label>
    ${field("Antrenman sonrası yorgunluk", sel("fatigue", [["1", "1 — hiç yorgun değilim"], ["2", "2"], ["3", "3 — orta"], ["4", "4"], ["5", "5 — çok yorgunum"]], "3"))}
    ${field("Ağrı var mı? (0–10)", sel("pain", Array.from({length: 11}, (_, i) => [String(i), i ? String(i) : "0 — yok"]), String(l.painLevel || 0)))}${field("Ağrı bölgesi", inp("painArea", l.painArea || ""))}
    ${field("Notlar", `<textarea class="in" name="notes">${esc(l.notes || "")}</textarea>`)}<button class="btn pri block" type="submit">Kaydet</button></form>`);
};
ACT.pickRpe = el => { $$(".rpe button").forEach(b => b.classList.remove("on")); el.classList.add("on"); $("#rpeIn").value = el.dataset.v; $("#rpeD").textContent = RPE_D[+el.dataset.v]; };
FORM.finish = (d, f) => {
  const l = DB.logs.find(x => x.id === f.dataset.id), a = getA(l.athleteId), c = sessionCtx({pid: l.programId, w: l.w, d: l.d});
  const dur = num(d.duration); if (!isNum(dur) || dur < 1 || dur > 300) throw new Error("Süre 1–300 dk olmalı.");
  l.duration = Math.round(dur); l.rpe = num(d.rpe); l.fatigue = num(d.fatigue); l.painLevel = Math.max(l.painLevel || 0, num(d.pain) || 0); if (d.painArea) l.painArea = d.painArea; l.notes = d.notes;
  l.load = Math.round(l.rpe * l.duration); l.endedAt = Date.now();
  const items = c ? adaptedItems(c.s, l).filter(x => !x.skip) : [];
  const tot = items.reduce((n, x) => n + x.sets, 0), dn = items.reduce((n, x) => n + Math.min(x.sets, l.done[x.key] || 0), 0);
  l.completion = tot ? Math.round(dn / tot * 100) : 0;
  l.status = l.completion >= 70 ? "tamamlandı" : "kısmi";
  if (l.painLevel >= 4) { l.status = "durduruldu"; l.stopReason = `Seans sonunda ${l.painLevel}/10 ağrı bildirildi.`; }
  if (l.painLevel > 0 || l.rpe >= 9) notify({key: "fin:" + l.id, athleteId: a.id, type: "load", title: l.painLevel > 0 ? "Seans sonrası ağrı bildirimi" : "Çok yüksek algılanan zorluk", body: `${a.name}: RPE ${l.rpe}, ağrı ${l.painLevel}/10 ${l.painArea || ""}`, roles: ["coach", "parent"]});
  if (l.status === "tamamlandı") { const n = DB.logs.filter(x => x.athleteId === a.id && x.status === "tamamlandı").length; if ([1, 10, 25, 50].includes(n)) notify({key: "ms:" + a.id + ":" + n, athleteId: a.id, type: "milestone", title: `${n}. antrenman tamamlandı 🎉`, body: `${a.name} kendi hedeflerine doğru ilerliyor.`}); }
  const pr = DB.programs.find(x => x.id === l.programId); if (pr && l.w === pr.weeks && c && c.s.d === pr.weeksData[pr.weeks - 1].sessions.length - 1) notify({key: "progdone:" + pr.id, athleteId: a.id, type: "milestone", title: "Program tamamlandı 🏁", body: `${a.name}: ${pr.weeks} haftalık program tamamlandı. Yeniden değerlendirme zamanı.`});
  audit("Seans kaydedildi", a.id, `RPE ${l.rpe}, ${l.duration} dk`); save(); closeSheet(); toast("Harika iş! Seans kaydedildi"); SESS.restEnd = 0; reRender();
};

/* ---------- Egzersiz detayı ve kütüphane ---------- */
route("/ex/:id", p => {
  const e = exById(p.id); if (!e) return {title: "Egzersiz", html: empty("Egzersiz bulunamadı")};
  const alt = exById(e.alt), vid = DB.exVideos[e.id];
  afterRender.push(async () => { if (vid) { const u = await loadBlobURL(vid); const v = $("#exVid"); if (v && u) v.src = u; } });
  const yt = "https://www.youtube.com/results?search_query=" + encodeURIComponent(e.n + " egzersiz çocuk tekniği");
  return {title: e.n, html: `<div class="card acc"><div class="tiny muted">${esc(CATS[e.c])} · en düşük gelişim evresi ${e.lv}</div><h2 style="margin:2px 0">${esc(e.n)}</h2><div class="chips mt">${e.q.map(q => pill(QN[q], "acc")).join("")}</div></div>
    <div class="card"><h3>Video anlatım</h3>${vid ? `<video id="exVid" controls playsinline style="width:100%;border-radius:12px;background:#000"></video>` : `<p class="small muted">Bu egzersiz için kulübünüzün yüklediği doğrulanmış bir video yok.</p>`}
      ${role() === "coach" ? `<label class="btn sm mt">${vid ? "Videoyu değiştir" : "Demo video yükle"}<input type="file" accept="video/*" data-exvid="${e.id}" style="display:none"></label>` : ""}
      <a class="btn sm ghost mt" href="${yt}" target="_blank" rel="noopener">YouTube'da ara ↗</a><p class="tiny muted">Harici arama sonuçları uygulama tarafından doğrulanmaz; tekniği antrenörünüzle kontrol edin.</p></div>
    <div class="card"><dl class="kv"><dt>Amaç</dt><dd>${esc(e.p)}</dd><dt>Hedef kas grupları</dt><dd>${esc(e.m)}</dd><dt>Varsayılan doz</dt><dd>${exDose(doseFor(e, {stage: 4}, "str", 0, 1))}</dd><dt>Ekipman</dt><dd>${e.eq.length ? e.eq.map(x => x.split("|").map(y => EQUIP[y]).join(" veya ")).join(", ") : "Gerekmez"}</dd>${e.tg.length ? `<dt>Hareket türü</dt><dd>${e.tg.map(t => RTAGS[t]).join(", ")}</dd>` : ""}</dl></div>
    <div class="card"><h3>Uygulama tekniği</h3><p class="small">${esc(e.tech)}</p><h3>Dikkat edilecek noktalar</h3><ul class="small" style="padding-left:18px">${e.cues.map(c => `<li>${esc(c)}</li>`).join("")}</ul><h3>Sık yapılan hatalar</h3><ul class="small" style="padding-left:18px">${e.mis.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div>
    <div class="grid2"><div class="card flat"><div class="tiny muted">Kolaylaştırılmış</div><div class="small">${esc(e.easy)}</div></div><div class="card flat"><div class="tiny muted">Zorlaştırılmış</div><div class="small">${esc(e.hard)}</div></div></div>
    ${alt ? li("#/ex/" + alt.id, "bolt", "Alternatif: " + esc(alt.n), esc(CATS[alt.c])) : ""}`};
});
document.addEventListener("change", async e => {
  const inpEl = e.target; if (!inpEl.dataset || !inpEl.dataset.exvid || !inpEl.files[0]) return;
  const f = inpEl.files[0]; if (f.size > 60 * 1024 * 1024) { toast("Video 60 MB'tan küçük olmalı"); return; }
  toast("Video şifrelenip kaydediliyor…", 6000);
  try { const old = DB.exVideos[inpEl.dataset.exvid]; if (old) await idbDel(old); DB.exVideos[inpEl.dataset.exvid] = await storeBlob(f); audit("Egzersiz demo videosu yüklendi", null, inpEl.dataset.exvid); save(); toast("Video kaydedildi"); reRender(); } catch (err) { toast("Video kaydedilemedi: " + err.message); }
});
let LIBF = {q: "", c: ""};
route("/library", () => {
  const list = allExercises().filter(e => (!LIBF.c || e.c === LIBF.c) && (!LIBF.q || (e.n + " " + e.m + " " + e.p).toLocaleLowerCase("tr-TR").includes(LIBF.q.toLocaleLowerCase("tr-TR"))));
  afterRender.push(() => { const s = $("#libQ"); if (s) { s.oninput = () => { LIBF.q = s.value; clearTimeout(s._t); s._t = setTimeout(() => { reRender(); const n = $("#libQ"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); }; } });
  return {title: "Video egzersiz kütüphanesi", html: `<input class="in" id="libQ" placeholder="Egzersiz ara…" value="${esc(LIBF.q)}" type="search">
    <div class="chips mt" style="margin-bottom:12px"><button class="chip ${!LIBF.c ? "on" : ""}" data-act="libC" data-c="">Tümü</button>${Object.entries(CATS).map(([k, v]) => `<button class="chip ${LIBF.c === k ? "on" : ""}" data-act="libC" data-c="${k}">${v}</button>`).join("")}</div>
    <p class="tiny muted">${list.length} egzersiz · ${Object.keys(DB.exVideos).length} kulüp videosu</p>
    <div class="list">${list.map(e => li("#/ex/" + e.id, DB.exVideos[e.id] ? "play" : "bolt", esc(e.n), esc(CATS[e.c]) + " · " + e.q.map(q => QN[q]).join(", "))).join("")}</div>`};
});
ACT.libC = el => { LIBF.c = el.dataset.c; reRender(); };

/* ---------- Ek gelişim ---------- */
route("/a/:aid/extra", p => {
  const a = getA(p.aid), needs = detectNeeds(a), pr = activeProgram(a.id);
  return {title: "Ek gelişim önerileri", html: `${alertBox("info", "", "Öneriler test sonuçları, asimetri, büyüme ve video analizinden türetilir. Ek çalışmalar mevcut programın koordinasyon-denge bloğuna yerleştirilir; toplam yük kontrolsüz artırılmaz.")}
    ${needs.length ? needs.map((n, i) => `<div class="card"><h3>${i + 1}. ${esc(n.t)}</h3><dl class="kv" style="grid-template-columns:110px 1fr"><dt>1. Tespit</dt><dd style="text-align:left">${esc(n.t)}</dd><dt>2. Dayanak</dt><dd style="text-align:left">${esc(n.basis)}</dd><dt>3. Branş önemi</dt><dd style="text-align:left">${esc(n.imp)}</dd><dt>4. Egzersizler</dt><dd style="text-align:left">${n.ex.length ? n.ex.map(id => `<a href="#/ex/${id}">${esc(exById(id).n)}</a>`).join(", ") : "Kısıtlamalar nedeniyle uygun egzersiz yok"}</dd><dt>5. Sıklık</dt><dd style="text-align:left">${esc(n.freq)}</dd><dt>6. Hedef</dt><dd style="text-align:left">${esc(n.target)}</dd><dt>7. Yeniden değerlendirme</dt><dd style="text-align:left">${esc(n.retest)}</dd></dl></div>`).join("") : empty("Belirgin ek gelişim gereksinimi tespit edilmedi (veya yeterli test verisi yok).", "plus")}
    ${needs.length && pr && canEditProgram(a.id) ? `<button class="btn pri block" data-act="integrateExtra" data-pid="${pr.id}">Aktif programın kalan haftalarına entegre et</button>` : ""}`};
});
ACT.integrateExtra = el => {
  const pr = DB.programs.find(x => x.id === el.dataset.pid), a = getA(pr.athleteId), cw = Math.max(1, currentWeek(pr));
  const r = generateProgram(a, {sport: pr.sport, pos: pr.pos, weeks: pr.weeks, spw: pr.spw, minutes: pr.minutes, env: pr.env, eq: pr.eq, space: pr.space, days: pr.days, startDate: pr.startDate, seasonAware: pr.seasonAware, testInterval: pr.testInterval, includeExtra: true, type: pr.type, focusQ: pr.focusQ});
  if (!r.ok) { toast(r.hold[0]); return; }
  pr.weeksData = pr.weeksData.filter(w => w.w <= cw).concat(r.program.weeksData.filter(w => w.w > cw)); pr.includeExtra = true;
  pr.changes.push({at: Date.now(), by: S.me.name, what: `Ek gelişim çalışmaları hafta ${cw + 1}+ entegre edildi (yük nötr)`, reason: "Ek gelişim modülü önerisi"});
  if (role() !== "coach") pr.status = "onay bekliyor";
  audit("Ek gelişim entegre edildi", a.id, ""); save(); toast("Entegre edildi"); go(`#/a/${a.id}/program/${pr.id}?w=${Math.min(pr.weeks, cw + 1)}`);
};

/* ---------- Zayıf yön modu ---------- */
route("/a/:aid/focus", p => {
  const a = getA(p.aid), h = holds(a.id), main = activeProgram(a.id), qs = qualityScores(a);
  if (!canEditProgram(a.id)) return {title: "Zayıf yön geliştirme", html: alertBox("warn", "", "Odak programlarını antrenör oluşturur.")};
  const weakest = QUALITIES.filter(q => isNum(qs[q.k].score)).sort((x, y) => qs[x.k].score - qs[y.k].score)[0];
  return {title: "Zayıf yön geliştirme", html: `${h.length ? alertBox("bad", "Beklemede", h.map(esc).join("<br>")) : ""}
    ${weakest ? alertBox("info", "Öneri", `Test verilerine göre en düşük alan: <b>${weakest.n}</b> (${qs[weakest.k].score}/100).`) : ""}
    ${main ? alertBox("warn", "Toplam yük", `Aktif ana program (${main.spw} seans/hafta) ve ${a.weeklySessions || 0} takım seansı var. Odak programı ek yük getirir; seans sayısını düşük tutun veya ana programa “Ek gelişim” olarak entegre edin.`) : ""}
    <form data-form="focusGen" data-aid="${a.id}"><div class="card">${field("Geliştirilecek özellik", sel("focus", FOCUSOPT, weakest ? weakest.k : "spd"))}
      <div class="grid3">${field("Süre", sel("weeks", [["2", "2 hf"], ["4", "4 hf"], ["6", "6 hf"], ["8", "8 hf"]], "4"))}${field("Seans/hf", sel("spw", ["1", "2", "3"], main ? "1" : "2"))}${field("Süre", sel("minutes", [["20", "20 dk"], ["30", "30 dk"], ["45", "45 dk"]], "30"))}</div>
      ${field("Başlangıç", inp("startDate", nextMonday(), 'type="date"'))}${field("Ortam", sel("env", Object.entries(ENVS).map(([k, v]) => [k, v.n]), "home", 'id="envSel"'))}
      <label class="check"><input type="checkbox" name="space" id="spaceChk"><span class="small">Koşu alanı var</span></label>${field("Ekipman", envEqChips("home"))}</div>
      <button class="btn pri block" type="submit" ${h.length ? "disabled" : ""}>Odak programı oluştur</button></form>`};
});
FORM.focusGen = (d, f) => {
  const a = getA(f.dataset.aid), tech = d.focus === "sprinttech";
  const opt = {type: "focus", focusQ: tech ? "spd" : d.focus, focusQ2: tech ? "coo" : null, sport: a.primarySport || "athletics", weeks: +d.weeks, spw: d.spw, minutes: +d.minutes, env: d.env, eq: d.eq || [], space: d.space, startDate: d.startDate, testInterval: d.weeks >= 4 ? 4 : 2, seed: "focus"};
  if (tech && !d.space) throw new Error("Sprint tekniği için koşu alanı gerekir.");
  const r = generateProgram(a, opt);
  if (!r.ok) { sheet(`<h2>Oluşturulamadı</h2>${r.hold.map(x => alertBox("bad", "", esc(x))).join("")}<button class="btn block" data-act="closeSheet">Kapat</button>`); return; }
  if (tech) r.program.rationale.unshift("Sprint tekniği modu: sürat mekaniği drilleri ve ritim/koordinasyon çalışmaları önceliklendirildi.");
  DB.programs.push(r.program); audit("Zayıf yön programı oluşturuldu", a.id, QN[opt.focusQ]); save(); go(`#/a/${a.id}/program/${r.program.id}`);
};

/* ---------- Sezon yönetimi ---------- */
route("/a/:aid/season", p => {
  const a = getA(p.aid); a.season = a.season || {phases: [], comps: []};
  const t = todayISO(), cur = seasonPhaseAt(a, t), ed = canEditProfile(a.id);
  const up = a.season.comps.filter(c => c.date >= t).sort((x, y) => x.date < y.date ? -1 : 1);
  return {title: "Sezon yönetimi", html: `<div class="card acc"><div class="tiny muted">Bugünkü dönem</div><h2 style="margin:2px 0">${cur ? esc(SEASON_PHASES[cur].n) : "Dönem tanımlı değil"}</h2>${cur ? `<p class="small">${esc(SEASON_PHASES[cur].note)} Hacim katsayısı ×${SEASON_PHASES[cur].vol}.</p>` : ""}</div>
    ${up.length ? `<h3>Yaklaşan müsabakalar</h3>${up.map(c => { const g = daysBetween(t, c.date); return `<div class="card"><div class="row between"><b>${esc(c.name)}</b>${pill(g + " gün", g <= 7 ? "warn" : "")}</div><div class="small muted">${fmtD(c.date)} · önem: ${esc(c.imp)}</div><p class="small">${g <= 2 ? "Son 48 saat: yalnızca aktivasyon, mobilite ve kısa sürat uyarıları." : g <= 10 ? "Müsabaka öncesi: hacmi %40–60 azaltın, yoğunluğu ve sürat kalitesini koruyun." : "Normal yüklenme; müsabakadan ~10 gün önce yük azaltımı planlanır."}</p>${ed ? `<button class="btn sm ghost" data-act="seasonDel" data-aid="${a.id}" data-t="comps" data-id="${c.id}">Sil</button>` : ""}</div>`; }).join("")}` : ""}
    <h3>Dönemler</h3>${a.season.phases.length ? a.season.phases.slice().sort((x, y) => x.start < y.start ? -1 : 1).map(ph => `<div class="li" style="cursor:default"><div class="ic">${ic("cal")}</div><div class="grow"><div class="t">${esc(SEASON_PHASES[ph.type].n)}</div><div class="s">${fmtD(ph.start)} – ${fmtD(ph.end)}</div></div>${ed ? `<button class="btn sm ghost" data-act="seasonDel" data-aid="${a.id}" data-t="phases" data-id="${ph.id}">✕</button>` : ""}</div>`).join("") : `<p class="small muted">Dönem eklenmedi.</p>`}
    ${ed ? `<form class="card mt" data-form="seasonPh" data-aid="${a.id}"><h3>Dönem ekle</h3>${field("Dönem", sel("type", Object.entries(SEASON_PHASES).map(([k, v]) => [k, v.n])))}<div class="grid2">${field("Başlangıç", inp("start", todayISO(), 'type="date" required'))}${field("Bitiş", inp("end", addDays(todayISO(), 60), 'type="date" required'))}</div><button class="btn sm pri" type="submit">Ekle</button></form>
    <form class="card" data-form="seasonComp" data-aid="${a.id}"><h3>Müsabaka ekle</h3>${field("Ad", inp("name", "", "required"))}<div class="grid2">${field("Tarih", inp("date", addDays(todayISO(), 14), 'type="date" required'))}${field("Önem", sel("imp", ["yüksek", "orta", "düşük"], "orta"))}</div><button class="btn sm pri" type="submit">Ekle</button></form>
    ${canEditProgram(a.id) ? `<a class="btn block" href="#/a/${a.id}/program/new">Sezonu dikkate alan program oluştur</a>` : ""}` : ""}`};
});
FORM.seasonPh = (d, f) => { if (d.end < d.start) throw new Error("Bitiş başlangıçtan önce olamaz."); const a = getA(f.dataset.aid); a.season.phases.push({id: uid("sp_"), type: d.type, start: d.start, end: d.end}); save(); reRender(); };
FORM.seasonComp = (d, f) => { const a = getA(f.dataset.aid); a.season.comps.push({id: uid("cp_"), name: d.name.trim(), date: d.date, imp: d.imp}); notify({key: "comp:" + a.id + d.date, athleteId: a.id, type: "season", title: "Müsabaka eklendi", body: `${a.name}: ${d.name} (${fmtD(d.date)})`}); save(); reRender(); };
ACT.seasonDel = el => { const a = getA(el.dataset.aid); a.season[el.dataset.t] = a.season[el.dataset.t].filter(x => x.id !== el.dataset.id); save(); reRender(); };
