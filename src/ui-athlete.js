/* =========================================================================
   ÖĞRENCİ ARAYÜZÜ — sade: bugünün antrenmanı, programım, gelişimim, video AI, profilim
   Öğrenci yalnızca kendi kişisel bilgilerini ve antrenman kayıtlarını girer.
   ========================================================================= */
const SR = ["athlete"];
const me = () => myAthlete();
route("/s", () => {
  const a = me(); if (!a) return {title: "Bugün", html: alertBox("warn", "Antrenöre bağlı değilsin", "Hesabın bir antrenöre bağlı görünmüyor.") + `<a class="btn pri block" href="#/finish">Kodu gir</a>`};
  const t = todayISO(), todays = plannedSessions(a.id, t, t), next = plannedSessions(a.id, addDays(t, 1), addDays(t, 14))[0];
  const ws = mondayOf(t), ad = adherence(a.id, ws, addDays(ws, 6));
  const cm = DB.comments.filter(c => c.athleteId === a.id).sort((x, y) => y.at - x.at)[0], goals = (a.goals || []).filter(g => !g.done);
  return {title: "Bugün", html: `
    ${!a.infoDone ? alertBox("warn", "Bilgilerini tamamla", `Antrenörün programını sana göre hazırlayabilmesi için bilgilerini doldur. <a href="#/s/me/edit">Şimdi doldur →</a>`) : ""}
    <div class="card acc"><div class="row"><div class="grow"><div class="small muted">${DOWL[new Date().getDay()]}, ${fmtD(t)}</div><h2 style="margin:2px 0">Selam ${esc(a.name.split(" ")[0])}! 👋</h2><div class="small">${weekStreak(a.id) > 0 ? `🔥 ${weekStreak(a.id)} haftadır düzenli çalışıyorsun` : "Haydi bu haftayı güzel geçirelim!"}</div></div>${ringSVG(ad.pct, "bu hafta")}</div></div>
    ${holds(a.id).length ? alertBox("bad", "Antrenmana ara", "Antrenörün veya bir sağlık uzmanı değerlendirene kadar antrenman yapma.") : ""}
    ${todays.length ? todays.map(x => { const l = logOf(x.p.id, x.wk.w, x.s.d); return `<div class="card"><div class="tiny muted">Bugünün antrenmanı · ${x.s.blocks.reduce((n, b) => n + b.items.length, 0)} egzersiz · ≈${x.s.estMin} dk</div><h2 style="margin:4px 0">${esc(x.s.title)}</h2>${l ? pill(l.status, l.status === "tamamlandı" ? "ok" : "warn") : ""}<a class="btn ${l ? "" : "pri"} block mt" href="#/s/session/${x.p.id}/${x.wk.w}/${x.s.d}">${l ? "Kaydı gör" : "Antrenmana başla"}</a></div>`; }).join("")
      : `<div class="card"><h3>Bugün dinlenme günü 😌</h3><p class="small muted">${next ? `Sıradaki: ${DOWL[parseISO(next.s.date).getDay()]} — ${esc(next.s.title)}` : activeProgram(a.id) ? "Bu hafta için antrenman kalmadı." : "Antrenörün programını hazırlıyor."}</p></div>`}
    ${cm ? `<div class="card flat"><div class="tiny muted">Antrenöründen not 💬 · ${fmtD(isoOf(new Date(cm.at)))}</div><div>${esc(cm.text)}</div></div>` : ""}
    <a class="li" href="#/video/new"><div class="ic">${ic("camera")}</div><div class="grow"><div class="t">Hareketimi kontrol et</div><div class="s">Videonu çek, yapay zekâ yorumlasın</div></div><span class="chev">${ic("chev")}</span></a>
    <a class="li mt" href="#/s/load"><div class="ic">${ic("plus")}</div><div class="grow"><div class="t">Takım antrenmanı / maç ekle</div><div class="s">Toplam yükünü antrenörün görsün</div></div><span class="chev">${ic("chev")}</span></a>
    ${goals.length ? `<h3>Hedeflerim</h3>${goals.map(g => goalRow(a, g)).join("")}` : ""}`};
}, SR);
function weekStreak(aid) { let st = 0; const w = mondayOf(todayISO()); for (let i = 1; i <= 52; i++) { const s = addDays(w, -7 * i); if (DB.logs.some(l => l.athleteId === aid && l.date >= s && l.date <= addDays(s, 6) && l.status === "tamamlandı")) st++; else break; } return st; }

/* ---------- Bilgilerim (yalnızca öğrenci doldurur) ---------- */
const DOMS = [["sağ", "Sağ"], ["sol", "Sol"], ["iki", "İkisi de"]];
route("/s/me/edit", () => {
  const a = me(), first = Q("first") === "1", td = (a.teamDays || []).map(String);
  return {title: first ? "Bilgilerini doldur" : "Bilgilerim", back: !first, html: `${first ? alertBox("info", "Hoş geldin!", "Bu bilgileri yalnızca sen doldurursun. Ölçümleri (boy, kilo, testler) antrenörün girer.") : ""}
    <form data-form="info"><div class="card"><h3>Ben</h3>${field("Ad soyad", inp("name", a.linked && a.name !== a.inviteNote ? a.name : (a.name || ""), 'required autocomplete="name"'))}
      <div class="grid2">${field("Doğum tarihi", inp("birthDate", a.birthDate, `type="date" required max="${todayISO()}"`))}${field("Cinsiyet", sel("sex", [["", "Seç"], ["E", "Erkek"], ["K", "Kız"]], a.sex || "", "required"))}</div>
      <div class="grid2">${field("Yazı yazdığın el", sel("dominantHand", DOMS, a.dominantHand || "sağ"))}${field("Topa vurduğun ayak", sel("dominantFoot", DOMS, a.dominantFoot || "sağ"))}</div>
      <div class="grid2">${field("Okul", inp("school", a.school))}${field("Kulüp", inp("club", a.club))}</div></div>
    <div class="card"><h3>Spor geçmişim</h3>${field("Daha önce hangi sporları yaptın?", inp("sportsHistory", a.sportsHistory, 'placeholder="ör. Yüzme 1 yıl, futbol 6 ay"'))}
      <div class="grid2">${field("Kaç yıldır spor yapıyorsun?", inp("trainingYears", a.trainingYears, 'inputmode="decimal"'))}${field("En çok hangi spor ilgini çekiyor?", sel("wishSport", [["", "—"]].concat(allSports().map(s => [s.id, s.n])), a.wishSport || ""))}</div>
      <div class="grid2">${field("Haftada kaç gün takım antrenmanın var?", sel("weeklySessions", ["0", "1", "2", "3", "4", "5", "6"], String(a.weeklySessions ?? 0)))}${field("Bir antrenman kaç dakika?", inp("teamSessionMin", a.teamSessionMin || 90, 'inputmode="numeric"'))}</div>
      ${field("Takım antrenmanı günlerin", `<div class="chips">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label class="chip ${td.includes(String(d)) ? "on" : ""}" data-toggle><input type="checkbox" name="teamDays" data-multi="1" value="${d}" ${td.includes(String(d)) ? "checked" : ""}>${DOW[d]}</label>`).join("")}</div>`)}
      <div class="grid2">${field("Günde kaç saat uyuyorsun?", inp("sleepHours", a.sleepHours, 'inputmode="decimal"'))}${field("Gün içinde ne kadar hareketlisin?", sel("activityLevel", [["1", "Çok az"], ["2", "Az"], ["3", "Orta"], ["4", "Çok"], ["5", "Çok fazla"]], a.activityLevel || "3"))}</div>
      ${field("Hedefin ne?", inp("personalGoals", a.personalGoals, 'placeholder="ör. Daha hızlı koşmak, takımda forma giymek"'))}</div>
    <button class="btn pri block" type="submit">${first ? "Kaydet ve devam et" : "Kaydet"}</button></form>`};
}, SR);
FORM.info = async d => {
  const a = me(), first = Q("first") === "1";
  if (!d.name.trim() || !d.birthDate || !d.sex) throw new Error("Ad, doğum tarihi ve cinsiyet gerekli.");
  const age = ageAt(d.birthDate); if (age < 5 || age > 25) throw new Error("Doğum tarihini kontrol et.");
  Object.assign(a, {name: d.name.trim(), birthDate: d.birthDate, sex: d.sex, dominantHand: d.dominantHand, dominantFoot: d.dominantFoot, school: d.school, club: d.club, sportsHistory: d.sportsHistory, trainingYears: num(d.trainingYears), wishSport: d.wishSport, weeklySessions: num(d.weeklySessions), teamSessionMin: num(d.teamSessionMin), teamDays: (d.teamDays || []).map(Number), sleepHours: num(d.sleepHours), activityLevel: d.activityLevel, personalGoals: d.personalGoals, consentAt: a.consentAt || Date.now()});
  a.infoDone = true;
  saveAth(a.id, "info"); API.setProfile("athlete", a.name).then(p => { if (p) ST.profile.name = a.name; }).catch(() => {});
  toast("Kaydedildi"); go(first ? "#/s/me/health?first=1" : "#/s/me");
};
const HSTAT = [["aktif", "Hâlâ devam ediyor"], ["takipte", "Doktor takibinde"], ["geçmiş", "Geçti / iyileşti"]];
const HCAT_SIMPLE = [["injury", "Sakatlık (burkulma, kırık vb.)"], ["pain", "Şu an bir yerim ağrıyor"], ["asthma", "Astım"], ["cardio", "Kalp ile ilgili bir durum"], ["chronic", "Başka bir kronik hastalık"], ["surgery", "Ameliyat oldum"], ["doctorban", "Doktorun yasakladığı hareket var"], ["medication", "Düzenli ilaç kullanıyorum"], ["other", "Diğer"]];
route("/s/me/health", () => {
  const a = me(), hs = healthOf(a.id), first = Q("first") === "1";
  return {title: "Sağlık bilgilerim", back: !first, html: `${alertBox("info", "", "Bu bilgileri antrenörün güvenli program hazırlamak için görür. Velinle birlikte doldurman iyi olur.")}
    ${hs.map(h => `<div class="card"><div class="row between"><b>${esc(h.title)}</b>${pill((HSTAT.find(x => x[0] === h.status) || [, h.status])[1], h.status === "geçmiş" ? "ok" : "warn")}</div><div class="small muted">${esc((HCAT_SIMPLE.find(x => x[0] === h.cat) || [, ""])[1])}${h.date ? " · " + fmtD(h.date) : ""}</div>${h.desc ? `<p class="small">${esc(h.desc)}</p>` : ""}<button class="btn sm ghost" data-act="hDel" data-id="${h.id}">Sil</button></div>`).join("")}
    <form class="card" data-form="health"><h3>${hs.length ? "Başka bir durum ekle" : "Bir sağlık durumu ekle"}</h3>${field("Ne oldu?", sel("cat", HCAT_SIMPLE, "injury"))}${field("Kısaca anlat", inp("title", "", 'required placeholder="ör. Sağ ayak bileğim burkuldu"'))}
      <div class="grid2">${field("Ne zaman?", inp("date", "", 'type="date"'))}${field("Şu an durumu", sel("status", HSTAT, "aktif"))}</div>
      ${field("Ek açıklama (isteğe bağlı)", inp("desc", ""))}<label class="check"><input type="checkbox" name="cleared"><span class="small">Doktorum spor yapabileceğimi söyledi</span></label><button class="btn sm pri" type="submit">Ekle</button></form>
    ${!hs.length ? `<label class="check card"><input type="checkbox" id="hNone" ${a.health0 ? "checked" : ""}><span class="small">Bilinen bir sağlık sorunum yok</span></label>` : ""}
    ${first ? `<button class="btn pri block" data-act="healthDone">Bitti</button>` : ""}`};
}, SR);
FORM.health = d => {
  const a = me(), c = HCAT[d.cat] || {clear: false, tags: []};
  DB.health.push({id: uid("h_"), athleteId: a.id, cat: d.cat, title: d.title.trim(), desc: d.desc, date: d.date, status: d.status, requiresClearance: c.clear && d.status !== "geçmiş", clearanceGiven: !!d.cleared, tags: c.tags.slice(), createdAt: Date.now()});
  a.health0 = false; saveAth(a.id, "info"); toast("Eklendi — antrenörün görecek"); reRender();
};
ACT.hDel = async el => { if (!await confirmBox("Silinsin mi?", "Sil", true)) return; const a = me(); DB.health = DB.health.filter(h => h.id !== el.dataset.id); saveAth(a.id, "info"); reRender(); };
document.addEventListener("change", e => { if (e.target.id === "hNone") { const a = me(); a.health0 = e.target.checked; saveAth(a.id, "info"); } });
ACT.healthDone = () => { toast("Harika! Antrenörün artık programını hazırlayabilir."); go("#/s"); };

/* ---------- Profilim + veli kodu ---------- */
route("/s/me", () => {
  const a = me();
  afterRender.push(async () => { const el = $("#parList"); if (!el) return; try { const ps = await API.athleteParents(a.id); el.innerHTML = ps.length ? ps.map(x => `<div class="row" style="padding:6px 0"><span class="avatar sm">${esc(initials(x.name))}</span><span class="grow small">${esc(x.name)}</span><button class="btn sm ghost" data-act="parRemove" data-pid="${x.parent_id}">Kaldır</button></div>`).join("") : `<p class="small muted">Henüz bağlı veli yok.</p>`; } catch (e) { el.textContent = ""; } });
  return {title: "Profilim", html: athleteHead(a) + `<div class="list"><a class="li" href="#/s/me/edit"><div class="ic">${ic("user")}</div><div class="grow"><div class="t">Bilgilerim</div><div class="s">${a.infoDone ? "Doldurdun ✓" : "Eksik — doldur"}</div></div><span class="chev">${ic("chev")}</span></a>
    <a class="li" href="#/s/me/health"><div class="ic">${ic("heart")}</div><div class="grow"><div class="t">Sağlık bilgilerim</div><div class="s">${healthOf(a.id).length} kayıt</div></div><span class="chev">${ic("chev")}</span></a></div>
    <div class="card mt"><h3>Veli kodu</h3><p class="small muted">Velin bu kodla uygulamaya girip gelişimini ve hedeflerini görebilir. Hiçbir şeyi değiştiremez.</p>
      ${a.parentCode ? `<div class="center">${codeBox(a.parentCode)}<div class="grid2"><button class="btn" data-act="copy" data-text="${esc(a.parentCode)}">Kopyala</button><button class="btn pri" data-act="share" data-text="${esc(`Rush Athletic veli kodum: ${a.parentCode}\n${location.origin + location.pathname} adresini aç → “Veliyim” → kodu gir.`)}">${ic("share")} Gönder</button></div></div><button class="btn sm ghost mt" data-act="pcode">Yeni kod oluştur (eskisi geçersiz olur)</button>` : `<button class="btn pri block" data-act="pcode">Veli kodu oluştur</button>`}
      <h3>Bağlı velilerim</h3><div id="parList" class="small muted">Yükleniyor…</div></div>
    <a class="btn block" href="#/library">Egzersiz kütüphanesi</a><a class="btn block mt" href="#/settings">Ayarlar</a>`};
}, SR);
ACT.pcode = async () => { const a = me(); const c = await API.createParentCode(a.id); await loadAll(); toast("Veli kodu: " + c); reRender(); };
ACT.parRemove = async el => { if (!await confirmBox("Bu veli artık seni göremesin mi?", "Kaldır", true)) return; await API.removeParent(me().id, el.dataset.pid); reRender(); };

/* ---------- Programım / gelişimim / video ---------- */
route("/s/program", () => { const a = me(), o = parseInt(Q("o")) || 0, pr = activeProgram(a.id);
  return {title: "Programım", html: (pr ? `<div class="card"><b>${pr.weeks} haftalık program</b><div class="small muted">Hafta ${clamp(currentWeek(pr), 1, pr.weeks)}/${pr.weeks}</div><div class="bar mt"><i style="width:${clamp(currentWeek(pr) / pr.weeks * 100, 0, 100)}%"></i></div></div>` : alertBox("info", "", "Antrenörün henüz bir program hazırlamadı.")) + weekCalendar(a, o, "#/s/program", true)}; }, SR);
route("/s/progress", () => {
  const a = me(), vids = DB.videos.filter(v => v.athleteId === a.id && v.score != null).sort((x, y) => x.at - y.at);
  return {title: "Gelişimim", html: `${radarBlock(a, {simple: true})}<h3>Testlerim</h3>${improvementList(a)}
    ${vids.length >= 2 ? `<div class="card mt"><h3>Hareket puanlarım (video AI)</h3>${lineChart([{color: COL.cur, points: vids.map(v => ({x: isoOf(new Date(v.at)), y: v.score}))}], {dec: 0})}</div>` : ""}
    <h3>Rozetlerim</h3><p class="tiny muted">Rozetler yalnızca senin kendi gelişimine göre verilir.</p><div class="row wrap" style="gap:8px">${badgesFor(a).map(b => `<div class="badge ${b.on ? "" : "off"}"><div class="b">${b.e}</div>${esc(b.n)}</div>`).join("")}</div>
    <a class="btn block mt" href="#/s/report">Gelişim raporum (PDF)</a>`};
}, SR);
route("/s/report", () => reportPage(me(), "athlete"), SR);
function badgesFor(a) {
  const logs = DB.logs.filter(l => l.athleteId === a.id && l.status === "tamamlandı");
  const pr = TESTS.some(t => { const rs = testsOf(a.id, t.id); if (rs.length < 2) return false; const c = compareResults(t, rs[0], rs[rs.length - 1]); return c && c.cls === "ok"; });
  const vids = DB.videos.filter(v => v.athleteId === a.id && v.src === "athlete");
  return [{e: "🎯", n: "İlk antrenman", on: logs.length >= 1}, {e: "🔥", n: "3 hafta düzen", on: weekStreak(a.id) >= 3}, {e: "💯", n: "10 antrenman", on: logs.length >= 10}, {e: "📈", n: "Kendini geçtin", on: pr}, {e: "🎥", n: "İlk video analizi", on: vids.length >= 1}, {e: "⭐", n: "85+ hareket puanı", on: vids.some(v => v.score >= 85)}];
}
route("/s/video", () => {
  const a = me(), vs = DB.videos.filter(v => v.athleteId === a.id).sort((x, y) => y.at - x.at), pr = activeProgram(a.id);
  const exs = pr ? [...new Set(pr.weeksData.flatMap(w => w.sessions.flatMap(s => s.blocks.flatMap(b => b.items.map(i => i.e)))))].filter(id => vtypeOfEx(id)).slice(0, 12) : [];
  return {title: "Video AI", html: `<div class="card acc"><h3 style="margin:0">Yapay zekâ koçun 🎥</h3><p class="small">Hareketini videoya çek; yapay zekâ eklemlerini bulup nasıl yaptığını yorumlasın. Video telefonundan çıkmaz.</p><a class="btn pri block" href="#/video/new">${ic("camera")} Yeni video analizi</a></div>
    ${exs.length ? `<h3>Programındaki egzersizler</h3><div class="chips">${exs.map(id => `<a class="chip" href="#/video/new?ex=${id}">${esc(exById(id).n)}</a>`).join("")}</div>` : ""}
    <h3>Analizlerim</h3>${vs.length ? `<div class="list">${vs.map(v => videoCard(v, `#/video/${a.id}/${v.id}`)).join("")}</div>` : empty("Henüz analiz yok.", "camera")}`};
}, SR);
route("/s/load", () => {
  const a = me(), ext = DB.extLoads.filter(e => e.athleteId === a.id && e.src !== "coach").sort((x, y) => x.date < y.date ? 1 : -1).slice(0, 15);
  return {title: "Takım antrenmanı / maç", html: `<form class="card" data-form="ext"><div class="grid2">${field("Ne yaptın?", sel("type", ["Takım antrenmanı", "Maç", "Beden eğitimi dersi", "Diğer"]))}${field("Tarih", inp("date", todayISO(), `type="date" required max="${todayISO()}"`))}</div><div class="grid2">${field("Kaç dakika?", inp("duration", "90", 'inputmode="numeric" required'))}${field("Ne kadar zordu? (0–10)", sel("rpe", Array.from({length: 11}, (_, i) => [String(i), i + " — " + RPE_D[i]]), "6"))}</div><button class="btn pri block" type="submit">Ekle</button></form>
    ${ext.map(e => `<div class="li" style="cursor:default"><div class="grow"><div class="t">${esc(e.type)}</div><div class="s">${fmtD(e.date)} · ${e.duration} dk · zorluk ${e.rpe}/10</div></div><button class="btn sm ghost" data-act="extDel" data-id="${e.id}">✕</button></div>`).join("")}`};
}, SR);
FORM.ext = d => { const a = me(), dur = num(d.duration), rpe = num(d.rpe); if (!isNum(dur) || dur < 5 || dur > 300) throw new Error("Süre 5–300 dk olmalı."); DB.extLoads.push({id: uid("x_"), athleteId: a.id, src: "athlete", type: d.type, date: d.date, duration: dur, rpe, load: Math.round(dur * rpe)}); saveAth(a.id, "logs"); toast("Eklendi"); reRender(); };
ACT.extDel = el => { DB.extLoads = DB.extLoads.filter(x => x.id !== el.dataset.id); saveAth(me().id, "logs"); reRender(); };

/* ---------- Antrenman seansı ---------- */
let SESS = {timer: null, rest: null, restEnd: 0};
function sessionCtx(p) { const pr = DB.programs.find(x => x.id === p.pid); if (!pr) return null; const wk = pr.weeksData.find(w => w.w === +p.w); if (!wk) return null; const s = wk.sessions.find(x => x.d === +p.d); return s ? {pr, wk, s} : null; }
function adaptedItems(s, log) {
  const out = [];
  s.blocks.forEach((b, bi) => b.items.forEach((it, ii) => {
    const ex = exById(it.e); let skip = null, sets = it.s;
    if (log.mod === "hafif" && !["warm", "mob", "cool"].includes(b.k)) skip = "Bugün yalnızca hafif hareket";
    if (log.mod === "ağrı" && ex && (ex.tg.includes("jump") || ex.tg.includes("sprint"))) skip = "Ağrın olduğu için atlandı";
    if (log.mod === "yorgun" && ex && ((ex.c === "plyo" && ex.lv >= 3) || ex.tg.includes("maxEffort"))) skip = "Yorgun olduğun için atlandı";
    if ((log.mod === "yorgun" || log.mod === "ağrı") && !["warm", "mob", "cool"].includes(b.k)) sets = Math.max(1, Math.round(sets * 0.7));
    out.push({bi, ii, b, it, ex, sets, skip, key: bi + "-" + ii});
  }));
  return out;
}
route("/s/session/:pid/:w/:d", p => {
  const a = me(), c = sessionCtx(p); if (!c) return {title: "Antrenman", html: empty("Antrenman bulunamadı")};
  const {pr, wk, s} = c, log = logOf(pr.id, wk.w, s.d);
  clearInterval(SESS.timer); clearInterval(SESS.rest);
  const head = `<div class="card acc"><div class="tiny muted">${DOWL[s.dow]} ${fmtD(s.date)} · Hafta ${wk.w}</div><h2 style="margin:2px 0">${esc(s.title)}</h2><div class="small muted">≈${s.estMin} dk</div></div>`;
  if (!log) {
    if (holds(a.id).length) return {title: "Antrenman", html: head + alertBox("bad", "Bugün antrenman yok", "Antrenörün veya bir sağlık uzmanı değerlendirene kadar dinlen.")};
    return {title: "Başlamadan önce", html: head + `<form data-form="ready" data-pid="${pr.id}" data-w="${wk.w}" data-d="${s.d}"><div class="card"><h3>Bugün nasıl hissediyorsun?</h3><div class="ready">${READY.map(([n, e], i) => `<label><input type="radio" name="readiness" value="${n}" ${i === 1 ? "checked" : ""} style="position:absolute;opacity:0"><button type="button" class="${i === 1 ? "on" : ""}" data-act="pickReady"><span class="emoji">${e}</span>${n}</button></label>`).join("")}</div></div>
      <div class="card">${field("Dün gece kaç saat uyudun?", inp("sleep", a.sleepHours || "", 'inputmode="decimal"'))}${field("Bir yerin ağrıyor mu?", sel("pain", [["0", "Hayır"], ["1", "Evet"]], "0", 'id="painSel"'))}<div id="painBox" style="display:none">${field("Neresi?", inp("painArea", "", 'placeholder="ör. sağ diz"'))}${field("Ne kadar? (0 = hiç, 10 = çok)", sel("painLevel", Array.from({length: 11}, (_, i) => [String(i), String(i)]), "2"))}</div></div>
      <button class="btn pri block" type="submit">Başla</button></form>`};
  }
  afterRender.push(() => wireTimers(log));
  if (log.status === "durduruldu") return {title: "Antrenman", html: head + alertBox("bad", "Bugünkü antrenman durduruldu", esc(log.stopReason || "") + "<br><br>Dinlen ve durumu velinle, antrenörünle paylaş. Ağrı geçmezse bir sağlık uzmanına görün.") + logSummary(log)};
  const items = adaptedItems(s, log), done = log.done || {}, fin = log.status === "tamamlandı" || log.status === "kısmi";
  const tot = items.filter(x => !x.skip).reduce((n, x) => n + x.sets, 0), dn = items.filter(x => !x.skip).reduce((n, x) => n + Math.min(x.sets, done[x.key] || 0), 0);
  let lastB = -1;
  return {title: "Antrenman", keepScroll: true, html: head + (log.mod !== "normal" ? alertBox("warn", "Antrenmanın hafifletildi", {yorgun: "Yorgun olduğun için bazı zor egzersizler çıkarıldı ve setler azaltıldı.", ağrı: "Ağrın olduğu için sıçrama ve sprintler çıkarıldı. Ağrı artarsa hemen dur.", hafif: "Bugün yalnızca hafif hareket ve esneme yap."}[log.mod] || "") : "") +
    `<div class="card" style="position:sticky;top:calc(var(--safeT) + 66px);z-index:10"><div class="row between"><div><div class="tiny muted">Süre</div><div class="timer" id="sessT" style="font-size:1.5rem;text-align:left">00:00</div></div><div class="grow" style="max-width:150px"><div class="tiny muted">${dn}/${tot} set</div><div class="bar"><i style="width:${tot ? dn / tot * 100 : 0}%"></i></div></div><div id="restBox" class="center" style="min-width:86px"></div></div></div>
    ${items.map(x => { const hb = x.bi !== lastB ? `<div class="blockh">${esc(x.b.n)}</div>` : ""; lastB = x.bi; const d0 = done[x.key] || 0, vt = vtypeOfEx(x.it.e);
      return hb + `<div class="ex ${!x.skip && d0 >= x.sets ? "done" : ""}" ${x.skip ? 'style="opacity:.5"' : ""}><a class="nm" href="#/ex/${x.it.e}" style="color:var(--ink);text-decoration:none">${esc(x.ex ? x.ex.n : x.it.e)} ›</a>
        <div class="small muted">${x.skip ? esc(x.skip) : exDose(Object.assign({}, x.it, {s: x.sets}))}</div>${x.it.note ? `<div class="tiny" style="color:var(--info)">Antrenör: ${esc(x.it.note)}</div>` : ""}
        ${!x.skip && !fin ? `<div class="sets">${["warm", "mob", "cool"].includes(x.b.k) ? `<button class="setb ${d0 >= 1 ? "on" : ""}" style="min-width:96px" data-act="setTap" data-id="${log.id}" data-k="${x.key}" data-n="1" data-rest="0">${d0 >= 1 ? "✓ Tamam" : "Yaptım"}</button>` : Array.from({length: x.sets}, (_, k) => `<button class="setb ${k < d0 ? "on" : ""}" data-act="setTap" data-id="${log.id}" data-k="${x.key}" data-n="${k + 1}" data-rest="${x.it.rest || 0}">${k + 1}</button>`).join("")}${vt ? `<a class="btn sm ghost" href="#/video/new?ex=${x.it.e}" title="Yapay zekâ ile kontrol">${ic("camera")} AI</a>` : ""}</div>` : ""}</div>`; }).join("")}
    ${fin ? logSummary(log) : `<div class="btns"><button class="btn danger" data-act="painReport" data-id="${log.id}">Bir yerim ağrıdı</button><button class="btn pri" data-act="finishSess" data-id="${log.id}">Antrenmanı bitir</button></div>`}`};
}, SR);
function logSummary(l) { return `<div class="card mt"><h3>Kaydın</h3>${kv([["Durum", l.status], ["Nasıldın", l.readiness], ["Süre", isNum(l.duration) ? l.duration + " dk" : ""], ["Zorluk", isNum(l.rpe) ? l.rpe + "/10 — " + RPE_D[l.rpe] : ""], ["Ağrı", l.painLevel ? l.painLevel + "/10 " + (l.painArea || "") : "Yok"]])}${l.notes ? `<p class="small">${esc(l.notes)}</p>` : ""}</div>`; }
function wireTimers(log) {
  const el = $("#sessT"); if (!el) return;
  const tick = () => { const ms = (log.endedAt || Date.now()) - log.startedAt; el.textContent = pad2(Math.floor(ms / 60000)) + ":" + pad2(Math.floor(ms / 1000) % 60); };
  tick(); if (!log.endedAt) SESS.timer = setInterval(() => { if (!document.body.contains(el)) { clearInterval(SESS.timer); return; } tick(); }, 1000);
  if (SESS.restEnd > Date.now()) startRest();
}
function startRest() {
  clearInterval(SESS.rest); const box = $("#restBox"); if (!box) return;
  const draw = () => { const left = Math.ceil((SESS.restEnd - Date.now()) / 1000); if (!document.body.contains(box)) { clearInterval(SESS.rest); return; } if (left <= 0) { box.innerHTML = `<span class="pill ok">Hazır!</span>`; clearInterval(SESS.rest); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} return; } box.innerHTML = `<div class="tiny muted">Dinlen</div><b style="font-size:1.25rem">${pad2(Math.floor(left / 60))}:${pad2(left % 60)}</b><div><button class="btn sm ghost" style="min-height:30px;padding:2px 8px" data-act="restSkip">Geç</button></div>`; };
  draw(); SESS.rest = setInterval(draw, 500);
}
ACT.restSkip = () => { SESS.restEnd = 0; startRest(); };
ACT.pickReady = el => { $$(".ready button").forEach(b => b.classList.remove("on")); el.classList.add("on"); el.closest("label").querySelector("input").checked = true; };
document.addEventListener("change", e => { if (e.target.id === "painSel") $("#painBox").style.display = e.target.value === "1" ? "block" : "none"; });
FORM.ready = (d, f) => {
  const a = me(), pain = d.pain === "1" ? num(d.painLevel) || 0 : 0;
  const log = {id: uid("l_"), key: logKey(f.dataset.pid, +f.dataset.w, +f.dataset.d), athleteId: a.id, programId: f.dataset.pid, w: +f.dataset.w, d: +f.dataset.d, date: todayISO(), readiness: d.readiness, sleep: num(d.sleep), painLevel: pain, painArea: pain ? d.painArea : "", startedAt: Date.now(), done: {}, status: "devam ediyor", mod: "normal"};
  if (pain >= 4) { log.status = "durduruldu"; log.endedAt = Date.now(); log.stopReason = `Ağrı ${pain}/10 (${d.painArea || "bölge belirtilmedi"}).`; }
  else if (d.readiness === "Çok yorgun") log.mod = "hafif"; else if (pain > 0) log.mod = "ağrı"; else if (d.readiness === "Yorgun") log.mod = "yorgun";
  DB.logs.push(log); saveAth(a.id, "logs"); reRender();
};
ACT.setTap = el => { const l = DB.logs.find(x => x.id === el.dataset.id), k = el.dataset.k, n = +el.dataset.n; l.done[k] = (l.done[k] || 0) >= n ? n - 1 : n; if (l.done[k] >= n && +el.dataset.rest > 0) SESS.restEnd = Date.now() + (+el.dataset.rest) * 1000; saveAth(l.athleteId, "logs"); reRender(); };
ACT.painReport = el => sheet(`<h2>Bir yerin mi ağrıdı?</h2><form data-form="painRep" data-id="${el.dataset.id}">${field("Neresi?", inp("area", "", "required"))}${field("Ne kadar? (0–10)", sel("lvl", Array.from({length: 11}, (_, i) => [String(i), String(i)]), "3"))}<p class="small muted">4 ve üzeriyse antrenman durur.</p><button class="btn pri block" type="submit">Bildir</button></form>`);
FORM.painRep = (d, f) => { const l = DB.logs.find(x => x.id === f.dataset.id), lvl = num(d.lvl) || 0; l.painLevel = Math.max(l.painLevel || 0, lvl); l.painArea = d.area; if (lvl >= 4) { l.status = "durduruldu"; l.endedAt = Date.now(); l.stopReason = `Antrenman sırasında ${lvl}/10 ağrı (${d.area}).`; l.duration = Math.round((l.endedAt - l.startedAt) / 60000); } else if (l.mod === "normal") l.mod = "ağrı"; saveAth(l.athleteId, "logs"); closeSheet(); reRender(); };
ACT.finishSess = el => { const l = DB.logs.find(x => x.id === el.dataset.id), mins = Math.max(1, Math.round((Date.now() - l.startedAt) / 60000));
  sheet(`<h2>Antrenmanı bitir</h2><form data-form="finish" data-id="${l.id}">${field("Kaç dakika sürdü?", inp("duration", mins, 'inputmode="numeric" required'))}<label class="f"><span>Ne kadar zordu? (0–10)</span><div class="rpe">${Array.from({length: 11}, (_, i) => `<button type="button" class="${i === 5 ? "on" : ""}" data-act="pickRpe" data-v="${i}">${i}</button>`).join("")}</div><input type="hidden" name="rpe" value="5" id="rpeIn"><div class="hint" id="rpeD">${RPE_D[5]}</div></label>
  ${field("Ağrın var mı? (0 = yok)", sel("pain", Array.from({length: 11}, (_, i) => [String(i), String(i)]), String(l.painLevel || 0)))}${field("Antrenörüne notun", inp("notes", l.notes || ""))}<button class="btn pri block" type="submit">Kaydet</button></form>`); };
ACT.pickRpe = el => { $$(".rpe button").forEach(b => b.classList.remove("on")); el.classList.add("on"); $("#rpeIn").value = el.dataset.v; $("#rpeD").textContent = RPE_D[+el.dataset.v]; };
FORM.finish = (d, f) => {
  const l = DB.logs.find(x => x.id === f.dataset.id), c = sessionCtx({pid: l.programId, w: l.w, d: l.d}), dur = num(d.duration);
  if (!isNum(dur) || dur < 1 || dur > 300) throw new Error("Süre 1–300 dk olmalı.");
  l.duration = Math.round(dur); l.rpe = num(d.rpe); l.painLevel = Math.max(l.painLevel || 0, num(d.pain) || 0); l.notes = d.notes; l.load = Math.round(l.rpe * l.duration); l.endedAt = Date.now();
  const items = c ? adaptedItems(c.s, l).filter(x => !x.skip) : [], tot = items.reduce((n, x) => n + x.sets, 0), dn = items.reduce((n, x) => n + Math.min(x.sets, l.done[x.key] || 0), 0);
  l.completion = tot ? Math.round(dn / tot * 100) : 0; l.status = l.completion >= 70 ? "tamamlandı" : "kısmi";
  if (l.painLevel >= 4) { l.status = "durduruldu"; l.stopReason = `Antrenman sonunda ${l.painLevel}/10 ağrı.`; }
  saveAth(l.athleteId, "logs"); closeSheet(); SESS.restEnd = 0; toast("Harika iş! 💪"); reRender();
};
