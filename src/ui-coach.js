/* =========================================================================
   ANTRENÖR ARAYÜZÜ — detaylı panel
   ========================================================================= */
const C = ["coach"];
route("/c", () => {
  const as = DB.athletes, t = todayISO();
  const alerts = as.flatMap(a => alertsFor(a).map(x => Object.assign({}, x, {t: a.name + " · " + x.t})));
  const urgent = alerts.filter(x => x.lv !== "info"), info = alerts.filter(x => x.lv === "info");
  const today = as.flatMap(a => plannedSessions(a.id, t, t).map(x => ({a, ...x})));
  const vids = DB.videos.filter(v => v.src === "athlete").sort((x, y) => y.at - x.at).slice(0, 3);
  return {title: "Ana sayfa", html: `
    <div class="card acc"><div class="small muted">${DOWL[new Date().getDay()]}, ${fmtD(t)}</div><h2 style="margin:2px 0 10px">Merhaba ${esc(myName().split(" ")[0])}</h2>
      <div class="grid3"><a class="stat" href="#/c/athletes" style="text-decoration:none;color:inherit"><b>${as.length}</b><span>Öğrenci</span></a><div class="stat"><b>${today.length}</b><span>Bugün antrenman</span></div><div class="stat"><b style="${urgent.length ? "color:var(--warn)" : ""}">${urgent.length}</b><span>Dikkat</span></div></div></div>
    <a class="btn pri block" href="#/c/new">${ic("plus")} Yeni öğrenci ekle (kod oluştur)</a>
    ${urgent.length ? `<h3>Dikkat gerektirenler</h3><div class="list">${urgent.slice(0, 8).map(alertItem).join("")}</div>` : ""}
    <h3>Bugünkü antrenmanlar</h3>${today.length ? `<div class="list">${today.map(x => { const l = logOf(x.p.id, x.wk.w, x.s.d); return li(`#/c/a/${x.a.id}?t=takip`, "bolt", esc(x.a.name), esc(x.s.title), l ? pill(l.status, l.status === "tamamlandı" ? "ok" : "warn") : pill("bekliyor")); }).join("")}</div>` : `<p class="small muted">Bugün planlı antrenman yok.</p>`}
    ${vids.length ? `<h3>Öğrencilerin son video analizleri</h3><div class="list">${vids.map(v => videoCard(Object.assign({}, v, {typeName: getA(v.athleteId).name + " · " + (v.exId && exById(v.exId) ? exById(v.exId).n : v.typeName)}), `#/video/${v.athleteId}/${v.id}`)).join("")}</div>` : ""}
    ${info.length ? `<h3>Yapılacaklar</h3><div class="list">${info.slice(0, 8).map(alertItem).join("")}</div>` : ""}
    ${!as.length ? `<div class="card flat mt"><b>Nasıl başlarım?</b><ol class="small" style="padding-left:18px;margin:6px 0"><li>“Yeni öğrenci ekle” ile kod oluştur.</li><li>Kodu öğrencine gönder; öğrenci uygulamada “Öğrenciyim”e basıp kodu girer ve kendi bilgilerini doldurur.</li><li>Sen ölçüm ve testleri girersin, programı oluşturursun.</li><li>Öğrenci kendi telefonundan velisine veli kodu verir; veli yalnızca izler.</li></ol></div>` : ""}`};
}, C);

/* ---------- Yeni öğrenci: davet kodu ---------- */
route("/c/new", () => ({title: "Yeni öğrenci", html: `<form class="card" data-form="newInvite">
  <p class="small muted">Bir kod oluşturulacak. Öğrenci bu kodla uygulamaya girip kendi hesabını açacak ve kişisel bilgilerini kendisi dolduracak.</p>
  ${field("Öğrencinin adı (kendi notunuz)", inp("note", "", 'required placeholder="ör. Ahmet Yılmaz"'))}
  ${field("Branş", sel("sport", [["", "Sonra seçeceğim"]].concat(allSports().map(s => [s.id, s.n])), ""))}
  ${DB.groups.length ? field("Gruba ekle (isteğe bağlı)", sel("group", [["", "—"]].concat(DB.groups.map(g => [g.id, g.name])), "")) : ""}
  <label class="check"><input type="checkbox" required><span class="small">18 yaş altı öğrenciler için velinin onayını aldım.</span></label>
  <button class="btn pri block" type="submit">Kodu oluştur</button></form>`}), C);
FORM.newInvite = async d => {
  const r = await API.createInvite(d.note.trim());
  await loadAll();
  const a = getA(r.athlete_id);
  if (a && d.sport) { a.primarySport = d.sport; saveAth(a.id, "coach"); }
  if (d.group) { const g = DB.groups.find(x => x.id === d.group); if (g && !g.athleteIds.includes(r.athlete_id)) { g.athleteIds.push(r.athlete_id); saveCoachDoc(); } }
  go("#/c/code/" + r.athlete_id);
};
route("/c/code/:aid", p => {
  const a = getA(p.aid);
  if (a.linked) return {title: "Kod", html: alertBox("ok", "Kod kullanıldı", `${esc(a.name)} hesabını oluşturdu.`) + `<a class="btn pri block" href="#/c/a/${a.id}">Öğrenciye git</a>`};
  const msg = `Rush Athletic uygulamasına katılma kodun: ${a.inviteCode}\n1) ${location.origin + location.pathname} adresini aç\n2) “Öğrenciyim”e dokun\n3) Bu kodu gir ve kendi hesabını oluştur.`;
  return {title: "Öğrenci kodu", html: `<div class="card center"><div class="small muted">${esc(a.name)} için katılma kodu</div>${codeBox(a.inviteCode)}
    <div class="grid2"><button class="btn" data-act="copy" data-text="${esc(a.inviteCode)}">Kopyala</button><button class="btn pri" data-act="share" data-text="${esc(msg)}">${ic("share")} Paylaş</button></div></div>
    <div class="card flat"><b class="small">Öğrenci ne yapacak?</b><ol class="small" style="padding-left:18px;margin:6px 0"><li>Uygulamayı açar → <b>Öğrenciyim</b></li><li>Bu kodu girer, kullanıcı adı ve şifre belirler</li><li>Kendi bilgilerini (doğum tarihi, spor geçmişi, sağlık) doldurur</li></ol><p class="tiny muted">Kod yalnızca bir kez kullanılabilir.</p></div>
    <a class="btn block" href="#/c/a/${a.id}">Öğrenci sayfasına git</a><a class="btn ghost block mt" href="#/c">Ana sayfa</a>`};
}, C);

/* ---------- Öğrenci listesi ---------- */
let AQ = "";
route("/c/athletes", () => {
  const as = DB.athletes.filter(a => !AQ || a.name.toLocaleLowerCase("tr-TR").includes(AQ.toLocaleLowerCase("tr-TR")));
  afterRender.push(() => { const s = $("#aq"); if (s) s.oninput = () => { AQ = s.value; clearTimeout(s._t); s._t = setTimeout(() => { reRender(); const n = $("#aq"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); }; });
  return {title: "Öğrenciler", html: `<a class="btn pri block" href="#/c/new">${ic("plus")} Yeni öğrenci</a><input class="in mt" id="aq" type="search" placeholder="Öğrenci ara…" value="${esc(AQ)}">
    <div class="list mt">${as.map(a => { const al = alertsFor(a), bad = al.filter(x => x.lv !== "info").length; const st = !a.linked ? pill("kod bekliyor", "info") : !a.infoDone ? pill("bilgi eksik", "warn") : bad ? pill(bad + " uyarı", "warn") : activeProgram(a.id) ? pill("programda", "ok") : pill("program yok");
      return `<a class="li" href="${a.linked ? "#/c/a/" + a.id : "#/c/code/" + a.id}"><div class="avatar sm">${esc(initials(a.name))}</div><div class="grow"><div class="t">${esc(a.name)}</div><div class="s">${[ageTxt(a), sportTxt(a)].filter(Boolean).join(" · ")}</div></div>${st}<span class="chev">${ic("chev")}</span></a>`; }).join("") || empty("Öğrenci yok.", "users")}</div>`};
}, C);

/* ---------- Öğrenci detay (sekmeli) ---------- */
const TABS = [["ozet", "Özet"], ["olcum", "Ölçüm"], ["program", "Program"], ["takip", "Takip"], ["video", "Video"]];
route("/c/a/:aid", p => {
  const a = getA(p.aid), t = Q("t") || "ozet";
  const body = {ozet: tabOzet, olcum: tabOlcum, program: tabProgram, takip: tabTakip, video: tabVideo}[t] || tabOzet;
  return {title: a.name, keepScroll: !!Q("keep"), html: athleteHead(a, a.linked ? "" : `<a class="btn sm" href="#/c/code/${a.id}">Kod</a>`) + seg(TABS, t, k => `#/c/a/${a.id}?t=${k}`) + body(a)};
}, C);
function tabOzet(a) {
  const al = alertsFor(a), hl = healthOf(a.id), comments = DB.comments.filter(c => c.athleteId === a.id).sort((x, y) => y.at - x.at);
  return `${al.length ? `<div class="list" style="margin-bottom:12px">${al.map(alertItem).join("")}</div>` : ""}
    ${radarBlock(a)}
    <div class="card"><div class="row between"><h3 style="margin:0">Hedefler</h3><button class="btn sm" data-act="goalAdd" data-aid="${a.id}">${ic("plus")} Hedef</button></div>${(a.goals || []).length ? (a.goals || []).map(g => goalRow(a, g) + `<div class="row" style="gap:6px;margin:-4px 0 10px"><button class="btn sm ghost" data-act="goalDone" data-aid="${a.id}" data-id="${g.id}">${g.done ? "Aktif yap" : "Tamamlandı"}</button><button class="btn sm ghost" data-act="goalDel" data-aid="${a.id}" data-id="${g.id}">Sil</button></div>`).join("") : `<p class="small muted">Hedef yok.</p>`}</div>
    <form class="card" data-form="comment" data-aid="${a.id}"><h3>Öğrenciye / veliye not</h3><textarea class="in" name="text" required placeholder="ör. İniş tekniğinde çok iyi ilerleme var!"></textarea><button class="btn sm pri mt" type="submit">Gönder</button>
      ${comments.slice(0, 3).map(c => `<div class="small" style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="tiny muted">${fmtDT(c.at)}</span><br>${esc(c.text)} <button class="btn sm ghost" style="min-height:26px;padding:0 6px" data-act="cmDel" data-aid="${a.id}" data-id="${c.id}">✕</button></div>`).join("")}</form>
    <div class="card"><h3>Öğrencinin girdiği bilgiler</h3>${a.infoDone ? kv([["Doğum tarihi", fmtD(a.birthDate)], ["Cinsiyet", a.sex === "K" ? "Kız" : "Erkek"], ["Baskın el / ayak", (a.dominantHand || "—") + " / " + (a.dominantFoot || "—")], ["Spor geçmişi", a.sportsHistory], ["Antrenman yılı", a.trainingYears], ["Takım antrenmanı", isNum(a.weeklySessions) ? a.weeklySessions + " / hafta" : ""], ["Takım günleri", (a.teamDays || []).map(d => DOW[d]).join(", ")], ["Uyku", isNum(a.sleepHours) ? a.sleepHours + " saat" : ""], ["Kulüp / okul", [a.club, a.school].filter(Boolean).join(" · ")], ["Hedefi", a.personalGoals], ["İlgi duyduğu branş", a.wishSport ? (sportById(a.wishSport) || {}).n : ""]]) : `<p class="small muted">Öğrenci henüz bilgilerini doldurmadı.</p>`}<p class="tiny muted">Bu bilgileri yalnızca öğrenci değiştirebilir.</p></div>
    <div class="card"><h3>Sağlık</h3>${hl.length ? hl.map(h => { const cl = h.clearanceGiven || DB.clearances[h.id]; return `<div style="padding:7px 0;border-bottom:1px solid var(--line)"><b class="small">${esc(h.title)}</b> ${pill(h.status, h.status === "aktif" ? "bad" : h.status === "takipte" ? "warn" : "ok")}<div class="tiny muted">${esc(HCAT[h.cat] ? HCAT[h.cat].n : "")}${h.desc ? " · " + esc(h.desc) : ""}</div>${(h.tags || []).length ? `<div class="tiny" style="color:var(--warn)">Kaçınılacak: ${h.tags.map(x => RTAGS[x]).join(", ")}</div>` : ""}${h.requiresClearance && h.status !== "geçmiş" ? (cl ? `<div class="tiny" style="color:var(--ok)">✓ Doktor/uzman onayı ${DB.clearances[h.id] ? "antrenör tarafından kaydedildi" : "öğrenci beyanı"}</div>` : `<button class="btn sm mt" data-act="clear" data-aid="${a.id}" data-id="${h.id}">Doktor onayını gördüm — onayla</button>`) : ""}</div>`; }).join("") : `<p class="small muted">${a.health0 ? "Öğrenci bilinen sağlık sorunu olmadığını belirtti." : "Sağlık bilgisi girilmedi."}</p>`}</div>
    <div class="card"><h3>Antrenör ayarları</h3><form data-form="coachSet" data-aid="${a.id}"><div class="grid2">${field("Branş", sel("primarySport", [["", "—"]].concat(allSports().map(s => [s.id, s.n])), a.primarySport))}${field("Pozisyon", sel("position", [["", "—"]].concat(((sportById(a.primarySport) || {}).pos || []).map(x => [x.id, x.n])), a.position))}${field("Seviye", sel("level", ["Başlangıç", "Başlangıç-orta", "Orta", "İleri"], a.level || "Başlangıç"))}${field("Teknik yeterlilik", sel("competency", [["1", "1 zayıf"], ["2", "2"], ["3", "3 yeterli"], ["4", "4"], ["5", "5 ileri"]], String(a.competency || 2)))}</div><button class="btn sm pri" type="submit">Kaydet</button></form></div>
    <div class="menuGrid"><a class="mtile" href="#/c/a/${a.id}/sport">${ic("compass")}Branş analizi</a><a class="mtile" href="#/c/a/${a.id}/maturity">${ic("grow")}Gelişim evresi</a><a class="mtile" href="#/c/a/${a.id}/report">${ic("doc")}Rapor (PDF)</a><a class="mtile" href="#/c/a/${a.id}/season">${ic("cal")}Sezon / maç</a><a class="mtile" href="#/c/a/${a.id}/parents">${ic("heart")}Veliler</a><a class="mtile" href="#/c/a/${a.id}/radar">${ic("radar")}Hedef ayarla</a></div>
    <button class="btn danger block mt" data-act="delAthlete" data-aid="${a.id}">Öğrenciyi sil</button>`;
}
FORM.coachSet = (d, f) => { const a = getA(f.dataset.aid); if (d.primarySport !== a.primarySport) d.position = ""; Object.assign(a, {primarySport: d.primarySport, position: d.position, level: d.level, competency: num(d.competency)}); saveAth(a.id, "coach"); toast("Kaydedildi"); reRender(); };
FORM.comment = (d, f) => { DB.comments.push({id: uid("c_"), athleteId: f.dataset.aid, at: Date.now(), by: myName(), byName: myName(), text: d.text.trim(), vis: ["athlete", "parent"]}); saveAth(f.dataset.aid, "coach"); toast("Not gönderildi"); reRender(); };
ACT.cmDel = el => { DB.comments = DB.comments.filter(c => c.id !== el.dataset.id); saveAth(el.dataset.aid, "coach"); reRender(); };
ACT.clear = async el => { if (!await confirmBox("Doktor/uzman onayını gördüğünüzü ve öğrencinin antrenmana katılabileceğini onaylıyor musunuz?", "Onaylıyorum")) return; DB.clearances[el.dataset.id] = {by: myName(), at: Date.now()}; saveAth(el.dataset.aid, "coach"); reRender(); };
ACT.goalAdd = el => {
  const a = getA(el.dataset.aid);
  sheet(`<h2>Yeni hedef</h2><form data-form="goal" data-aid="${a.id}">${field("Hedef", inp("text", "", 'required placeholder="ör. 10 m sprint 2,25 sn altı"'))}<div class="grid2">${field("Bağlı test", sel("testId", [["", "—"]].concat(TESTS.map(t => [t.id, t.n]))))}${field("Hedef değer", inp("target", "", 'inputmode="decimal"'))}</div>${field("Tarih", inp("date", addDays(todayISO(), 56), 'type="date"'))}<button class="btn pri block" type="submit">Ekle</button></form>`);
};
FORM.goal = (d, f) => { const a = getA(f.dataset.aid); const g = {id: uid("g_"), text: d.text.trim(), testId: d.testId || null, target: num(d.target), date: d.date, done: false, at: Date.now()}; if (g.testId) { if (!isNum(g.target)) throw new Error("Hedef değer girin."); const rs = testsOf(a.id, g.testId); if (rs.length) g.base = testValue(rs[rs.length - 1]); } a.goals = (a.goals || []).concat(g); saveAth(a.id, "coach"); closeSheet(); reRender(); };
ACT.goalDone = el => { const a = getA(el.dataset.aid), g = a.goals.find(x => x.id === el.dataset.id); g.done = !g.done; saveAth(a.id, "coach"); reRender(); };
ACT.goalDel = el => { const a = getA(el.dataset.aid); a.goals = a.goals.filter(x => x.id !== el.dataset.id); saveAth(a.id, "coach"); reRender(); };
ACT.delAthlete = async el => { const a = getA(el.dataset.aid); if (!await confirmBox(`${a.name} ve tüm verileri (testler, programlar, kayıtlar) kalıcı olarak silinsin mi?`, "Sil", true)) return; await flush(); await API.deleteAthlete(a.id); DB.groups.forEach(g => g.athleteIds = g.athleteIds.filter(x => x !== a.id)); saveCoachDoc(); await loadAll(); go("#/c/athletes"); };
route("/c/a/:aid/parents", p => {
  const a = getA(p.aid);
  afterRender.push(async () => { const el = $("#parList"); if (!el) return; try { const ps = await API.athleteParents(a.id); el.innerHTML = ps.length ? ps.map(x => `<div class="row" style="padding:6px 0"><span class="avatar sm">${esc(initials(x.name))}</span><span class="grow small">${esc(x.name)}<br><span class="tiny muted">${fmtD(String(x.created_at).slice(0, 10))}</span></span></div>`).join("") : `<p class="small muted">Henüz bağlı veli yok.</p>`; } catch (e) { el.textContent = e.message; } });
  return {title: "Veliler", html: `<div class="card"><h3>Bağlı veliler</h3><div id="parList" class="small muted">Yükleniyor…</div></div><p class="small muted">Veli kodunu öğrenci kendi telefonundan (Profilim → Veli kodu) oluşturur. Veliler yalnızca izler, değişiklik yapamaz.</p>`};
}, C);

/* --- Ölçüm sekmesi --- */
const AFIELDS = [["heightCm", "Boy", "cm"], ["weightKg", "Kilo", "kg"], ["sittingHeightCm", "Oturma boyu", "cm"], ["armSpanCm", "Kol açıklığı", "cm"], ["legLengthCm", "Bacak uzunluğu", "cm"], ["shoulderWidthCm", "Omuz genişliği", "cm"], ["waistCircCm", "Bel çevresi", "cm"], ["bodyFatPct", "Yağ oranı", "%"]];
function tabOlcum(a) {
  const an = anth(a.id), mat = maturity(a), done = TESTS.filter(t => testsOf(a.id, t.id).length);
  return `<div class="grid2"><button class="btn pri" data-act="testPick" data-aid="${a.id}">${ic("flask")} Test sonucu gir</button><button class="btn" data-act="measAdd" data-aid="${a.id}">${ic("ruler")} Vücut ölçümü</button></div>
    <button class="btn block mt" data-act="batteryEntry" data-aid="${a.id}">Önerilen test bataryasını toplu gir</button>
    <div class="card mt"><h3>Vücut ölçümleri</h3>${Object.keys(an).length > 1 ? kv(AFIELDS.filter(([k]) => isNum(an[k])).map(([k, n, u]) => [n, fmtN(an[k], 1) + " " + u]).concat(isNum(an.armSpanCm) && isNum(an.heightCm) ? [["Kol açıklığı / boy", fmtN(an.armSpanCm / an.heightCm, 2)]] : [])) + `<p class="tiny muted">Son ölçüm: ${fmtD(an.date)}</p>` : `<p class="small muted">Henüz ölçüm yok.</p>`}
      ${mat && isNum(mat.mo) ? `<a class="li mt" href="#/c/a/${a.id}/maturity"><div class="ic">${ic("grow")}</div><div class="grow"><div class="t">${esc(mat.status)}</div><div class="s">Olgunlaşma ofseti ${fmtN(mat.mo, 1)} yıl · gelişim evresi ${devStage(a).stage}/6</div></div><span class="chev">${ic("chev")}</span></a>` : ""}</div>
    <h3>Test sonuçları</h3>${done.length ? `<div class="list">${done.map(t => { const rs = testsOf(a.id, t.id), l = rs[rs.length - 1], c = rs.length > 1 ? compareResults(t, rs[rs.length - 2], l) : null, sc = scoreResult(a, l), as = asym(t, l);
      return `<a class="li" href="#/c/a/${a.id}/test/${t.id}"><div class="ic">${isNum(sc) ? sc : "•"}</div><div class="grow"><div class="t">${esc(t.n)}</div><div class="s">${t.bil && isNum(l.left) ? `S ${fmtN(l.left, t.dec)} / Sğ ${fmtN(l.right, t.dec)}` : fmtN(testValue(l), t.dec)} ${t.u} · ${fmtD(l.date)}${as && as.flag ? " · ⚠ asimetri" : ""}</div></div>${c ? pill(c.cls === "ok" ? "▲" : c.cls === "bad" ? "▼" : "=", c.cls) : ""}<span class="chev">${ic("chev")}</span></a>`; }).join("")}</div><p class="tiny muted">Soldaki sayı yaşa göre puan (50 ≈ ortalama). ▲/▼ yalnızca ölçüm hatasını aşan değişimde gösterilir.</p>` : empty("Henüz test yok.", "flask")}`;
}
ACT.testPick = el => {
  const a = getA(el.dataset.aid), sug = suggestTests(a), rec = new Set(sug.recommended.map(t => t.id)), age = ageAt(a.birthDate) || 12;
  sheet(`<h2>Hangi test?</h2><div class="list">${QUALITIES.map(q => `<div class="blockh">${q.n}</div>` + TESTS.filter(t => t.q === q.k).map(t => `<button class="li" style="width:100%;text-align:left" data-act="testEntry" data-aid="${a.id}" data-t="${t.id}"><div class="grow"><div class="t">${esc(t.n)} ${rec.has(t.id) ? pill("önerilen", "acc") : ""}${t.maxEff ? pill("maksimal efor", "warn") : ""}</div><div class="s">${esc(t.u)}${t.minAge > age ? " · " + t.minAge + "+ yaş için" : ""}</div></div></button>`).join("")).join("")}</div>`);
};
function testFields(t, prefix = "") { return t.bil ? `<div class="grid2">${field("Sol (" + t.u + ")", inp(prefix + "left", "", 'inputmode="decimal"'))}${field("Sağ (" + t.u + ")", inp(prefix + "right", "", 'inputmode="decimal"'))}</div>` : field("Sonuç (" + t.u + ")", inp(prefix + "value", "", 'inputmode="decimal"')); }
ACT.testEntry = el => {
  const a = getA(el.dataset.aid), t = TEST[el.dataset.t], h = holds(a.id), bad = t.tags.filter(x => restrictions(a.id).has(x));
  if (t.maxEff && h.length) { sheet(`<h2>${esc(t.n)}</h2>${alertBox("bad", "Uygulanamaz", "Maksimal efor testi tıbbi onay beklerken yapılamaz.")}<button class="btn block" data-act="closeSheet">Kapat</button>`); return; }
  sheet(`<h2>${esc(t.n)}</h2>${bad.length ? alertBox("warn", "Sağlık uyarısı", "Öğrencinin kısıtlaması var: " + bad.map(x => RTAGS[x]).join(", ")) : ""}<details class="acc"><summary class="small">Nasıl yapılır?</summary><div class="small">${esc(t.proto)}<br><span class="muted">Ekipman: ${esc(t.eq)}</span></div></details>
    <form data-form="testRes" data-aid="${a.id}" data-t="${t.id}">${field("Tarih", inp("date", todayISO(), 'type="date" required max="' + todayISO() + '"'))}${testFields(t)}${field("Not (koşullar)", inp("cond", "", 'placeholder="ör. kapalı salon, fotosel"'))}
    ${t.maxEff ? `<label class="check"><input type="checkbox" required><span class="small">Öğrenci sağlıklı ve maksimal efora hazırdı; test gözetimimde yapıldı.</span></label>` : ""}<button class="btn pri block" type="submit">Kaydet</button></form>`);
};
function saveTestResult(a, t, d, date, cond) {
  const r = {id: uid("t_"), testId: t.id, date, cond: cond || "", by: myName(), at: Date.now()};
  if (t.bil) { r.left = num(d.left); r.right = num(d.right); if (!isNum(r.left) && !isNum(r.right)) return null; } else { r.value = num(d.value); if (!isNum(r.value)) return null; }
  const v = testValue(r);
  if (v < 0 && !["sitreach", "shoulder"].includes(t.id)) throw new Error(t.n + ": negatif değer girilemez.");
  if (t.max && v > t.max) throw new Error(`${t.n}: en fazla ${t.max} ${t.u}.`);
  const nm = normFor(t, ageAt(a.birthDate, date), sexKey(a));
  if (nm && Math.abs(v - nm.mean) > 5 * nm.sd) throw new Error(`${t.n}: ${v} ${t.u} beklenenin çok dışında. Birimi kontrol edin.`);
  DB.tests.push(Object.assign(r, {athleteId: a.id}));
  (a.goals || []).filter(g => !g.done && g.testId === t.id && isNum(g.target)).forEach(g => { if (t.lb ? v <= g.target : v >= g.target) g.done = true; });
  return r;
}
FORM.testRes = (d, f) => { const a = getA(f.dataset.aid), t = TEST[f.dataset.t], n0 = DB.tests.length; try { if (!saveTestResult(a, t, d, d.date, d.cond)) throw new Error("Sonuç girin."); } catch (e) { DB.tests.length = n0; throw e; } saveAth(a.id, "coach"); closeSheet(); toast("Kaydedildi"); reRender(); };
ACT.batteryEntry = el => {
  const a = getA(el.dataset.aid), sug = suggestTests(a).recommended;
  sheet(`<h2>Test bataryası</h2><p class="tiny muted">Yaş, branş ve sağlık durumuna göre seçildi. Boş bırakılanlar kaydedilmez.</p><form data-form="battery" data-aid="${a.id}">${field("Tarih", inp("date", todayISO(), 'type="date" required'))}${sug.map(t => `<div class="card flat" style="padding:10px"><b class="small">${esc(t.n)}</b>${testFields(t, t.id + "__")}</div>`).join("")}<button class="btn pri block" type="submit">Tümünü kaydet</button></form>`);
};
FORM.battery = (d, f) => { const a = getA(f.dataset.aid), n0 = DB.tests.length; let n = 0; try { for (const t of suggestTests(a).recommended) { const sub = {}; ["value", "left", "right"].forEach(k => sub[k] = d[t.id + "__" + k]); if (saveTestResult(a, t, sub, d.date, "")) n++; } } catch (e) { DB.tests.length = n0; throw e; } if (!n) throw new Error("En az bir sonuç girin."); saveAth(a.id, "coach"); closeSheet(); toast(n + " sonuç kaydedildi"); reRender(); };
ACT.measAdd = el => {
  const a = getA(el.dataset.aid), last = anth(a.id);
  sheet(`<h2>Vücut ölçümü</h2><form data-form="meas" data-aid="${a.id}">${field("Tarih", inp("date", todayISO(), 'type="date" required'))}<div class="grid2">${AFIELDS.map(([k, n, u]) => field(`${n} (${u})`, inp(k, "", `inputmode="decimal" placeholder="${isNum(last[k]) ? "son: " + last[k] : ""}"`))).join("")}</div><p class="tiny muted">Oturma boyu, olgunlaşma (büyüme atağı) tahmini için gereklidir.</p><button class="btn pri block" type="submit">Kaydet</button></form>`);
};
FORM.meas = (d, f) => {
  const m = {id: uid("ms_"), date: d.date}; let n = 0;
  AFIELDS.forEach(([k]) => { const v = num(d[k]); if (v != null) { m[k] = v; n++; } });
  if (!n) throw new Error("En az bir ölçüm girin.");
  if (isNum(m.heightCm) && (m.heightCm < 80 || m.heightCm > 230)) throw new Error("Boy 80–230 cm olmalı.");
  if (isNum(m.weightKg) && (m.weightKg < 12 || m.weightKg > 180)) throw new Error("Kilo 12–180 kg olmalı.");
  if (isNum(m.sittingHeightCm) && isNum(m.heightCm) && m.sittingHeightCm >= m.heightCm) throw new Error("Oturma boyu boydan küçük olmalı.");
  DB.measurements.push(Object.assign(m, {athleteId: f.dataset.aid})); saveAth(f.dataset.aid, "coach"); closeSheet(); toast("Kaydedildi"); reRender();
};
route("/c/a/:aid/test/:tid", p => {
  const a = getA(p.aid), t = TEST[p.tid], rs = testsOf(a.id, t.id);
  const nm = rs.length ? normFor(t, ageAt(a.birthDate, rs[rs.length - 1].date), sexKey(a)) : null;
  return {title: t.n, html: `${rs.length > 1 ? `<div class="card">${lineChart([{color: COL.cur, points: rs.map(r => ({x: r.date, y: testValue(r)}))}], {dec: t.dec, labels: true})}<p class="tiny muted">${t.lb ? "Düşük değer daha iyi" : "Yüksek değer daha iyi"}${nm ? ` · yaş referansı ≈ ${fmtN(nm.mean, t.dec)} ${t.u}` : ""}</p></div>` : ""}
    <div class="card"><table class="tbl"><tr><th>Tarih</th><th class="r">Değer</th><th class="r">Puan</th><th></th></tr>${rs.slice().reverse().map(r => `<tr><td>${fmtD(r.date)}${r.cond ? `<div class="tiny muted">${esc(r.cond)}</div>` : ""}</td><td class="r">${t.bil && isNum(r.left) ? fmtN(r.left, t.dec) + " / " + fmtN(r.right, t.dec) : fmtN(testValue(r), t.dec)} ${t.u}</td><td class="r">${scoreResult(a, r) ?? "—"}</td><td><button class="btn sm ghost" data-act="testDel" data-aid="${a.id}" data-id="${r.id}">✕</button></td></tr>`).join("")}</table></div>
    ${rs.length > 1 ? (() => { const c = compareResults(t, rs[0], rs[rs.length - 1]); return alertBox(c.cls === "ok" ? "ok" : c.cls === "bad" ? "bad" : "info", c.verdict, `İlk → son: ${fmtN(c.v1, t.dec)} → ${fmtN(c.v2, t.dec)} ${t.u}. ${c.growthNote}`); })() : ""}
    <details class="acc"><summary>Test bilgisi</summary><div class="small">${esc(t.purpose)}<br><br>${esc(t.proto)}<br><span class="tiny muted">${esc(t.src)}</span></div></details>
    <button class="btn pri block" data-act="testEntry" data-aid="${a.id}" data-t="${t.id}">Yeni sonuç gir</button>`};
}, C);
ACT.testDel = async el => { if (!await confirmBox("Sonuç silinsin mi?", "Sil", true)) return; DB.tests = DB.tests.filter(x => x.id !== el.dataset.id); saveAth(el.dataset.aid, "coach"); reRender(); };
route("/c/a/:aid/maturity", p => {
  const a = getA(p.aid), ds = devStage(a), mat = ds.mat, gv = ds.gv;
  return {title: "Gelişim evresi", html: `<div class="card acc"><div class="tiny muted">Gelişim evresi</div><h2 style="margin:2px 0">${ds.stage}/6 · ${esc(ds.n)}</h2><p class="small">${esc(ds.focus)}</p><ul class="small" style="padding-left:18px">${ds.reasons.map(r => `<li>${esc(r)}</li>`).join("")}</ul></div>
    <div class="card"><h3>Biyolojik olgunlaşma (tahmini)</h3>${!mat ? `<p class="small muted">Boy ölçümü ve öğrencinin doğum tarihi gerekli.</p>` : mat.missing ? alertBox("warn", "", esc(mat.missing)) : kv([["Olgunlaşma ofseti", (mat.mo > 0 ? "+" : "") + fmtN(mat.mo, 2) + " yıl (±0,5)"], ["Durum", mat.status], ["Tahmini PHV yaşı", fmtN(mat.aphv, 1)], ["Zamanlama", mat.timing], ["Yöntem", mat.method]])}<p class="tiny muted">Tahmindir, tıbbi veri değildir. Yetişkin boyu tahmini yapılmaz.</p></div>
    <div class="card"><h3>Büyüme hızı</h3>${gv && !gv.insufficient ? `<b>${fmtN(gv.v, 1)} cm/yıl</b><p class="small">${esc(gv.note)}</p>` : `<p class="small muted">${gv ? esc(gv.note) : "En az iki boy ölçümü gerekli."}</p>`}</div>`};
}, C);

/* --- Program sekmesi --- */
function tabProgram(a) {
  const pr = activeProgram(a.id), others = programsOf(a.id).filter(x => x !== pr);
  if (!pr) return `${holds(a.id).length ? alertBox("bad", "Program oluşturulamaz", holds(a.id).map(esc).join("<br>")) : ""}${!a.infoDone ? alertBox("warn", "", "Öğrenci bilgilerini (doğum tarihi, cinsiyet, sağlık) doldurduktan sonra program kişiselleştirilir.") : ""}
    <a class="btn pri block" href="#/c/a/${a.id}/program/new">${ic("bolt")} Program oluştur</a>${others.length ? `<h3>Önceki programlar</h3><div class="list">${others.map(x => li(`#/c/a/${a.id}/program/${x.id}`, "doc", `${x.weeks} hafta · ${x.type === "focus" ? QN[x.focusQ] + " odaklı" : esc((sportById(x.sport) || {}).n || "")}`, fmtD(x.startDate))).join("")}</div>` : ""}`;
  const cw = clamp(currentWeek(pr), 1, pr.weeks), wk = pr.weeksData.find(w => w.w === cw), ad = adherence(a.id, pr.startDate, todayISO());
  return `<div class="card"><div class="row between"><div><b>${pr.weeks} haftalık program</b><div class="small muted">${fmtD(pr.startDate)} başladı · hafta ${cw}/${pr.weeks} · ${esc(wk ? wk.phase : "")}</div></div>${ringSVG(ad.pct, "devam")}</div><div class="bar mt"><i style="width:${cw / pr.weeks * 100}%"></i></div></div>
    <div class="grid2"><a class="btn" href="#/c/a/${a.id}/program/${pr.id}">Tüm haftalar / düzenle</a><a class="btn" href="#/c/a/${a.id}/optimize">Öneriler</a></div>
    <h3>Bu hafta</h3>${wk ? wk.sessions.map(s => sessionPlan(a, pr, wk, s, false)).join("") : ""}
    <a class="btn ghost block" href="#/c/a/${a.id}/program/new">Yeni program oluştur (mevcudun yerine)</a>`;
}
function sessionPlan(a, pr, wk, s, ed) {
  const l = logOf(pr.id, wk.w, s.d);
  return `<div class="card"><div class="row between"><div class="grow"><div class="tiny muted">${DOWL[s.dow]} · ${fmtD(s.date)}${s.test ? " · test günü" : ""}</div><b>${esc(s.title)}</b><div class="tiny muted">≈${s.estMin} dk</div></div>${l ? pill(l.status + (isNum(l.rpe) ? " · RPE " + l.rpe : ""), l.status === "tamamlandı" ? "ok" : "warn") : ""}</div>
    ${s.blocks.map((b, bi) => `<div class="blockh">${esc(b.n)}</div>${b.items.map((it, ii) => { const ex = exById(it.e); return `<div class="row" style="padding:5px 0;border-bottom:1px solid var(--line)"><div class="grow"><a href="#/ex/${it.e}" class="small" style="color:var(--ink);font-weight:650;text-decoration:none">${esc(ex ? ex.n : it.e)}</a>${it.mod ? " " + pill("düzenlendi", "info") : ""}<div class="tiny muted">${exDose(it)}</div>${it.note ? `<div class="tiny" style="color:var(--info)">${esc(it.note)}</div>` : ""}</div>${ed ? `<button class="btn sm ghost" data-act="itemEdit" data-pid="${pr.id}" data-w="${wk.w}" data-d="${s.d}" data-b="${bi}" data-i="${ii}" aria-label="Düzenle">✎</button>` : ""}</div>`; }).join("")}${ed ? `<button class="btn sm ghost" data-act="itemAdd" data-pid="${pr.id}" data-w="${wk.w}" data-d="${s.d}" data-b="${bi}">+ ekle</button>` : ""}`).join("")}</div>`;
}
const DURS = [[2, "2 hf"], [4, "4 hf"], [6, "6 hf"], [8, "8 hf"], [12, "12 hf"], [16, "16 hf"], [24, "24 hf"], [52, "1 yıl"]];
function nextMonday() { const t = todayISO(), m = mondayOf(t); return m === t ? t : addDays(m, 7); }
function envEqChips(env) { const s0 = new Set(ENVS[env].eq); return `<div class="chips" id="eqChips">${Object.entries(EQUIP).map(([k, v]) => `<label class="chip ${s0.has(k) ? "on" : ""}" data-toggle><input type="checkbox" name="eq" data-multi="1" value="${k}" ${s0.has(k) ? "checked" : ""}>${v}</label>`).join("")}</div>`; }
function wireEnv() { const s = $("#envSel"); if (!s) return; s.onchange = () => { const e = ENVS[s.value]; $$("#eqChips .chip").forEach(c => { const i = c.querySelector("input"), on = e.eq.includes(i.value); i.checked = on; c.classList.toggle("on", on); }); const sp = $("#spaceChk"); if (sp) sp.checked = e.space; }; }
route("/c/a/:aid/program/new", p => {
  const a = getA(p.aid), h = holds(a.id);
  afterRender.push(wireEnv);
  return {title: "Program oluştur", html: `${h.length ? alertBox("bad", "Beklemede", h.map(esc).join("<br>")) : ""}<form data-form="progGen" data-aid="${a.id}">
    <div class="card">${field("Program türü", sel("type", [["main", "Branşa özel ana program"], ["focus", "Tek özelliğe odaklı (zayıf yön)"]], "main", 'id="ptype"'))}
      <div id="mainOpts">${field("Branş", sel("sport", allSports().map(s => [s.id, s.n]), a.primarySport || a.wishSport || "basketball"))}</div>
      <div id="focusOpts" style="display:none">${field("Geliştirilecek özellik", sel("focusQ", QUALITIES.map(q => [q.k, q.n]), "bal"))}</div>
      ${field("Süre", `<div class="chips">${DURS.map(([w, n]) => `<label class="chip"><input type="radio" name="weeks" value="${w}" ${w === 8 ? "checked" : ""}>${n}</label>`).join("")}</div>`)}
      <div class="grid2">${field("Haftada", sel("spw", [["1", "1 gün"], ["2", "2 gün"], ["3", "3 gün"], ["4", "4 gün"]], "3"))}${field("Süre", sel("minutes", [["30", "30 dk"], ["45", "45 dk"], ["60", "60 dk"], ["75", "75 dk"]], "60"))}</div>
      ${field("Nerede?", sel("env", Object.entries(ENVS).map(([k, v]) => [k, v.n]), "school", 'id="envSel"'))}</div>
    <details class="acc"><summary>Gelişmiş ayarlar</summary><div>${field("Başlangıç", inp("startDate", nextMonday(), 'type="date" required'))}
      ${field("Günler", `<div class="chips">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label class="chip" data-toggle><input type="checkbox" name="days" data-multi="1" value="${d}">${DOW[d]}</label>`).join("")}</div>`, "Boşsa takım günleri dışında otomatik seçilir.")}
      <label class="check"><input type="checkbox" name="space" id="spaceChk" checked><span class="small">En az 20 m koşu alanı var</span></label>${field("Ekipman", envEqChips("school"))}
      ${field("Yeniden test aralığı", sel("testInterval", [["2", "2 haftada bir"], ["4", "4 haftada bir"], ["6", "6 haftada bir"], ["8", "8 haftada bir"]], "4"))}
      <label class="check"><input type="checkbox" name="includeExtra" checked><span class="small">Zayıf yönler için ek çalışmaları ekle (yük artırmadan)</span></label><label class="check"><input type="checkbox" name="seasonAware" checked><span class="small">Maç takvimini dikkate al</span></label></div></details>
    <button class="btn pri block" type="submit" ${h.length ? "disabled" : ""}>${ic("bolt")} Oluştur</button></form>`};
}, C);
document.addEventListener("change", e => { if (e.target.id === "ptype") { $("#mainOpts").style.display = e.target.value === "main" ? "" : "none"; $("#focusOpts").style.display = e.target.value === "focus" ? "" : "none"; } });
FORM.progGen = (d, f) => {
  const a = getA(f.dataset.aid);
  if (!a.birthDate) throw new Error("Öğrenci doğum tarihini henüz girmedi; program yaşa göre kişiselleştirilemez.");
  const opt = {type: d.type, focusQ: d.type === "focus" ? d.focusQ : null, sport: d.type === "focus" ? (a.primarySport || "athletics") : d.sport, pos: a.position || null, weeks: parseInt(d.weeks), spw: d.spw, minutes: parseInt(d.minutes), env: d.env, eq: d.eq || [], space: d.space, days: (d.days || []).map(Number), startDate: d.startDate, testInterval: d.testInterval, includeExtra: d.includeExtra, seasonAware: d.seasonAware};
  const r = generateProgram(a, opt);
  if (!r.ok) { sheet(`<h2>Oluşturulamadı</h2>${r.hold.map(x => alertBox("bad", "", esc(x))).join("")}<button class="btn block" data-act="closeSheet">Kapat</button>`); return; }
  if (opt.type === "main") DB.programs.filter(x => x.athleteId === a.id && x.type === "main" && x.status === "onaylı").forEach(x => x.status = "arşiv");
  if (opt.type === "main" && d.sport && !a.primarySport) a.primarySport = d.sport;
  DB.programs.push(Object.assign(r.program, {athleteId: a.id}));
  saveCoachDoc(); saveAth(a.id, "coach"); toast("Program hazır — öğrenci kendi telefonunda görecek"); go(`#/c/a/${a.id}/program/${r.program.id}`);
};
route("/c/a/:aid/program/:pid", p => {
  const a = getA(p.aid), pr = DB.programs.find(x => x.id === p.pid && x.athleteId === a.id); if (!pr) return {title: "Program", html: empty("Bulunamadı")};
  const cw = currentWeek(pr), w = clamp(parseInt(Q("w")) || clamp(cw, 1, pr.weeks), 1, pr.weeks), wk = pr.weeksData.find(x => x.w === w);
  return {title: "Program", html: `<div class="card"><b>${pr.weeks} haftalık ${pr.type === "focus" ? QN[pr.focusQ] + " odaklı program" : esc((sportById(pr.sport) || {}).n || "") + " programı"}</b> ${pill(pr.status === "arşiv" ? "eski" : "aktif", pr.status === "arşiv" ? "" : "ok")}<div class="small muted">${fmtD(pr.startDate)} – ${fmtD(addDays(pr.startDate, pr.weeks * 7 - 1))} · ${pr.spw} gün × ${pr.minutes} dk</div>
      <div class="mt">${pr.blocks.map(b => `<div class="small" style="padding:2px 0"><span class="pill ${b.key === "test" ? "info" : "acc"}">${b.from === b.to ? b.from : b.from + "–" + b.to}. hf</span> ${esc(b.name)}</div>`).join("")}</div></div>
    ${pr.warnings.map(x => alertBox("warn", "", esc(x))).join("")}
    <details class="acc"><summary>Neden bu program? (motorun gerekçesi)</summary><div><ul class="small" style="padding-left:18px">${pr.rationale.map(r => `<li>${esc(r)}</li>`).join("")}</ul></div></details>
    <div class="chips" style="max-height:120px;overflow:auto;margin:10px 0">${pr.weeksData.map(x => `<a class="chip ${x.w === w ? "on" : ""}" href="#/c/a/${a.id}/program/${pr.id}?w=${x.w}">${x.w}${x.w === cw ? "•" : ""}</a>`).join("")}</div>
    ${wk ? `<div class="small muted">Hafta ${wk.w} · ${esc(wk.phase)}${wk.notes.length ? " · " + wk.notes.map(esc).join(" ") : ""}</div>${wk.sessions.map(s => sessionPlan(a, pr, wk, s, pr.status !== "arşiv")).join("")}` : ""}
    ${pr.changes.length ? `<details class="acc"><summary>Değişiklik geçmişi (${pr.changes.length})</summary><div>${pr.changes.slice().reverse().map(c => `<div class="small" style="padding:4px 0"><span class="tiny muted">${fmtDT(c.at)}</span> ${esc(c.what)}${c.reason ? ` <span class="muted">— ${esc(c.reason)}</span>` : ""}</div>`).join("")}</div></details>` : ""}
    <button class="btn danger block mt" data-act="progDel" data-aid="${a.id}" data-pid="${pr.id}">Programı sil</button>`};
}, C);
ACT.progDel = async el => { if (!await confirmBox("Program silinsin mi?", "Sil", true)) return; DB.programs = DB.programs.filter(x => x.id !== el.dataset.pid); saveAth(el.dataset.aid, "coach"); go(`#/c/a/${el.dataset.aid}?t=program`); };
function itemTargets(pr, w, d, b, exId, scope) {
  const wk = pr.weeksData.find(x => x.w === w);
  const weeks = scope === "week" ? [wk] : pr.weeksData.filter(x => x.w >= w);
  const out = []; for (const W of weeks) { const s = W.sessions.find(x => x.d === d); if (!s || !s.blocks[b]) continue; s.blocks[b].items.forEach(it => { if (it.e === exId) out.push(it); }); } return out;
}
ACT.itemEdit = el => {
  const pr = DB.programs.find(x => x.id === el.dataset.pid), w = +el.dataset.w, d = +el.dataset.d, b = +el.dataset.b, i = +el.dataset.i;
  const s = pr.weeksData.find(x => x.w === w).sessions.find(x => x.d === d), it = s.blocks[b].items[i], ex = exById(it.e), a = getA(pr.athleteId);
  const ctx = buildCtx(a, {eq: pr.eq, space: pr.space, sport: pr.sport}), alts = allExercises().filter(e => e.c === ex.c && e.id !== ex.id && allowedEx(e, ctx, 6));
  sheet(`<h2>${esc(ex.n)}</h2><form data-form="itemSave" data-pid="${pr.id}" data-w="${w}" data-d="${d}" data-b="${b}" data-i="${i}">
    ${field("Değiştir", sel("swap", [["", "— aynı egzersiz —"]].concat(alts.map(e => [e.id, e.n]))))}
    <div class="grid3">${field("Set", inp("s", it.s, 'inputmode="numeric"'))}${field("Tekrar", inp("r", it.r ?? "", 'inputmode="numeric"'))}${field("Süre sn", inp("t", it.t ?? "", 'inputmode="numeric"'))}</div>
    ${field("Not (öğrenci görür)", inp("note", it.note || ""))}${field("Uygula", sel("scope", [["week", "Sadece bu hafta"], ["all", "Bu ve sonraki haftalar"]], "all"))}${field("Neden? (isteğe bağlı)", inp("reason", ""))}
    <div class="btns"><button type="button" class="btn danger" data-act="itemDelete" data-pid="${pr.id}" data-w="${w}" data-d="${d}" data-b="${b}" data-i="${i}">Sil</button><button class="btn pri" type="submit">Kaydet</button></div></form>`);
};
FORM.itemSave = (dd, f) => {
  const pr = DB.programs.find(x => x.id === f.dataset.pid), w = +f.dataset.w, d = +f.dataset.d, b = +f.dataset.b, i = +f.dataset.i;
  const it0 = pr.weeksData.find(x => x.w === w).sessions.find(x => x.d === d).blocks[b].items[i];
  const sN = num(dd.s); if (!isNum(sN) || sN < 1 || sN > 10) throw new Error("Set 1–10 olmalı.");
  const name0 = exById(it0.e).n, targets = itemTargets(pr, w, d, b, it0.e, dd.scope);
  if (dd.swap) { learnPref(it0.e, dd.swap); saveCoachDoc(); }
  targets.forEach(it => { if (dd.swap) it.e = dd.swap; it.s = sN; ["r", "t"].forEach(k => { const v = num(dd[k]); if (v == null) delete it[k]; else it[k] = v; }); it.note = dd.note; it.mod = 1; });
  pr.changes.push({at: Date.now(), by: myName(), what: `${name0}${dd.swap ? " → " + exById(dd.swap).n : ""}: ${sN} set${dd.r ? " × " + dd.r : ""} (${targets.length} seans)`, reason: dd.reason});
  saveAth(pr.athleteId, "coach"); closeSheet(); toast("Kaydedildi"); reRender();
};
ACT.itemDelete = el => { const pr = DB.programs.find(x => x.id === el.dataset.pid), s = pr.weeksData.find(x => x.w === +el.dataset.w).sessions.find(x => x.d === +el.dataset.d), it = s.blocks[+el.dataset.b].items[+el.dataset.i]; s.blocks[+el.dataset.b].items.splice(+el.dataset.i, 1); learnPref(it.e, null); saveCoachDoc(); pr.changes.push({at: Date.now(), by: myName(), what: `${exById(it.e).n} silindi (hafta ${el.dataset.w})`}); saveAth(pr.athleteId, "coach"); closeSheet(); reRender(); };
ACT.itemAdd = el => {
  const pr = DB.programs.find(x => x.id === el.dataset.pid), a = getA(pr.athleteId), ctx = buildCtx(a, {eq: pr.eq, space: pr.space, sport: pr.sport});
  sheet(`<h2>Egzersiz ekle</h2><form data-form="itemAddSave" data-pid="${pr.id}" data-w="${el.dataset.w}" data-d="${el.dataset.d}" data-b="${el.dataset.b}">${field("Egzersiz", sel("e", allExercises().filter(e => allowedEx(e, ctx, 6)).map(e => [e.id, CATS[e.c] + " — " + e.n])))}<div class="grid2">${field("Set", inp("s", 2, 'inputmode="numeric"'))}${field("Tekrar", inp("r", 8, 'inputmode="numeric"'))}</div><button class="btn pri block" type="submit">Ekle</button></form><p class="tiny muted">Liste sağlık kısıtlamaları ve ekipmana göre süzüldü.</p>`);
};
FORM.itemAddSave = (d, f) => { const pr = DB.programs.find(x => x.id === f.dataset.pid), s = pr.weeksData.find(x => x.w === +f.dataset.w).sessions.find(x => x.d === +f.dataset.d), ex = exById(d.e); const it = doseFor(ex, {stage: pr.stage || 3}, "str", 0, 1); it.s = num(d.s) || it.s; if (num(d.r)) it.r = num(d.r); it.mod = 1; s.blocks[+f.dataset.b].items.push(it); learnPref(null, ex.id); saveCoachDoc(); pr.changes.push({at: Date.now(), by: myName(), what: ex.n + " eklendi (hafta " + f.dataset.w + ")"}); saveAth(pr.athleteId, "coach"); closeSheet(); reRender(); };
route("/c/a/:aid/optimize", p => {
  const a = getA(p.aid), pr = activeProgram(a.id);
  if (!pr) return {title: "Öneriler", html: empty("Aktif program yok.")};
  const o = optimize(a, pr);
  return {title: "Program önerileri", html: `<p class="small muted">Test değişimleri, devamlılık, zorluk, ağrı ve yük verilerinden üretilir. Uygulamak sizin kararınız.</p>${o.items.map(s => `<div class="card"><div class="row between"><b>${esc(s.title)}</b>${pill({ok: "olumlu", warn: "dikkat", bad: "önemli", info: "bilgi"}[s.kind], s.kind)}</div><p class="small">${esc(s.why)}</p>${s.action.type !== "none" ? `<button class="btn sm pri" data-act="optApply" data-pid="${pr.id}" data-id="${s.id}">${esc(s.label || "Uygula")}</button>` : ""}</div>`).join("")}`};
}, C);
ACT.optApply = async el => { const pr = DB.programs.find(x => x.id === el.dataset.pid), a = getA(pr.athleteId), s = optimize(a, pr).items.find(x => x.id === el.dataset.id); if (!s || !await confirmBox(`“${s.label}” uygulansın mı?`, "Uygula")) return; if (applyOptimization(a, pr, s)) { toast("Uygulandı"); reRender(); } };

/* --- Takip sekmesi --- */
function tabTakip(a) {
  const ls = loadSummary(a), logs = DB.logs.filter(l => l.athleteId === a.id).sort((x, y) => x.date < y.date ? 1 : -1).slice(0, 14), pr = activeProgram(a.id), ad = pr ? adherence(a.id, pr.startDate, todayISO()) : null;
  const ext = DB.extLoads.filter(e => e.athleteId === a.id).sort((x, y) => x.date < y.date ? 1 : -1).slice(0, 6);
  return `${ad ? `<div class="card row">${ringSVG(ad.pct, "devam")}<div class="grow small"><b>${ad.done}/${ad.planned}</b> planlı antrenman tamamlandı.</div></div>` : ""}
    ${ls.flags.map(f => alertBox(f.lv, "", esc(f.t))).join("")}
    <h3>Son antrenmanlar (öğrencinin bildirdiği)</h3>${logs.length ? `<div class="list">${logs.map(l => { const rd = READY.find(x => x[0] === l.readiness); const reviewed = DB.painReviewed[l.id];
      return `<div class="li" style="cursor:default;flex-wrap:wrap"><div class="ic">${rd ? rd[1] : "•"}</div><div class="grow"><div class="t">${fmtD(l.date)} · ${esc(l.status)}</div><div class="s">${esc(l.readiness || "")}${isNum(l.rpe) ? ` · zorluk ${l.rpe}/10` : ""}${isNum(l.duration) ? ` · ${l.duration} dk` : ""}${l.painLevel ? ` · <span style="color:var(--bad)">ağrı ${l.painLevel}/10 ${esc(l.painArea || "")}</span>` : ""}${l.notes ? `<br>“${esc(l.notes)}”` : ""}</div></div>${l.painLevel && !reviewed ? `<button class="btn sm" data-act="painOk" data-aid="${a.id}" data-id="${l.id}">Değerlendirdim</button>` : reviewed ? pill("değerlendirildi", "ok") : ""}</div>`; }).join("")}</div>` : `<p class="small muted">Öğrenci henüz antrenman kaydı girmedi.</p>`}
    <div class="card mt"><h3>Haftalık yük</h3>${barChart(ls.weeks.map((w, i) => ({l: fmtD(w.to).slice(0, 5), v: w.load, c: i === ls.weeks.length - 1 ? COL.cur : COL.blue})))}
      <div class="grid3"><div class="stat"><b>${ls.acwr == null ? "—" : fmtN(ls.acwr, 2)}</b><span>Akut:kronik</span></div><div class="stat"><b>${ls.sleepAvg == null ? "—" : fmtN(ls.sleepAvg, 1)}</b><span>Uyku (sa)</span></div><div class="stat"><b>${fmtN(ls.hrsWeek, 1)}</b><span>Saat/hafta</span></div></div>
      <p class="tiny muted">Yük = zorluk (RPE) × süre. Oranlar tek başına sakatlık öngörmez; karar sizindir.</p></div>
    ${ext.length ? `<h3>Takım antrenmanı / maç (öğrenci bildirdi)</h3>${ext.map(e => `<div class="small">${fmtD(e.date)} · ${esc(e.type)} · ${e.duration} dk · RPE ${e.rpe}</div>`).join("")}` : ""}`;
}
ACT.painOk = async el => { if (!await confirmBox("Ağrı bildirimini değerlendirdiniz ve öğrenci antrenmana devam edebilir mi?", "Evet")) return; DB.painReviewed[el.dataset.id] = {by: myName(), at: Date.now()}; saveAth(el.dataset.aid, "coach"); reRender(); };

/* --- Video sekmesi --- */
function tabVideo(a) {
  const vs = DB.videos.filter(v => v.athleteId === a.id).sort((x, y) => y.at - x.at);
  return `<a class="btn pri block" href="#/video/new?aid=${a.id}">${ic("camera")} Hareket videosu çek ve analiz et</a>
    <p class="tiny muted">Yapay zekâ videodaki vücut noktalarını bulur; squat, sıçrama/iniş, sprint, denge, şınav, plank ve kalça menteşe hareketlerini yorumlar. Öğrenci de kendi antrenmanında egzersizlerini çekip analiz edebilir.</p>
    ${vs.length ? `<div class="list">${vs.map(v => videoCard(v, `#/video/${a.id}/${v.id}`)).join("")}</div>` : empty("Henüz analiz yok.", "camera")}`;
}

/* ---------- Branş analizi ---------- */
function fitTable(fit) { return `<table class="tbl"><tr><th>Özellik</th><th class="r">Ağırlık</th><th class="r">Puan</th></tr>${fit.rows.slice().sort((x, y) => y.w - x.w).map(r => `<tr><td>${esc(r.n)}</td><td class="r">%${r.wPct}</td><td class="r">${r.v == null ? '<span class="muted">yok</span>' : Math.round(r.v)}</td></tr>`).join("")}</table>`; }
route("/c/a/:aid/sport", p => {
  const a = getA(p.aid), ranked = rankSports(a);
  return {title: "Branş analizi", html: `${alertBox("info", "", "Puanlar yetenek göstergesi değildir; fiziksel verilerin branş gereksinimleriyle uyumunu ve çocuğun ilgisini (%20) gösterir.")}
    ${ranked.length ? `<div class="list">${ranked.slice(0, 8).map((x, i) => li(`#/c/a/${a.id}/sport/${x.sp.id}`, String(i + 1), esc(x.sp.n) + ` <span class="pill acc">${x.fit.score}</span>`, esc(x.fit.conf))).join("")}</div>` : empty("Test ve ölçüm girildikçe analiz oluşur.", "compass")}`};
}, C);
route("/c/a/:aid/sport/:sid", p => {
  const a = getA(p.aid), sp = sportById(p.sid), fit = sportFit(a, sp);
  const strong = fit.rows.filter(r => r.v != null && r.v >= 60 && r.wPct >= 8), weak = fit.rows.filter(r => r.v != null && r.v < 45 && r.wPct >= 8);
  return {title: sp.n, html: `<div class="card"><div class="grid3"><div class="stat"><b>${fit.score ?? "—"}</b><span>Uygunluk</span></div><div class="stat"><b>${fit.phys ?? "—"}</b><span>Fiziksel</span></div><div class="stat"><b>${fit.interest == null ? "—" : Math.round(fit.interest)}</b><span>İlgi</span></div></div><p class="small mt">${fit.phys == null ? "Veri yetersiz." : esc(adequacyText(fit.phys))}</p>${fit.flags.map(x => alertBox("bad", "", esc(x))).join("")}</div>
    <div class="card"><h3>Güçlü</h3>${strong.length ? strong.map(r => pill(r.n, "ok")).join(" ") : '<span class="small muted">—</span>'}<h3>Geliştirilecek</h3>${weak.length ? weak.map(r => pill(r.n, "warn")).join(" ") : '<span class="small muted">—</span>'}<h3>Gereksinimler</h3><p class="small">${esc(sp.demands)}</p><p class="small"><b>Ön koşul:</b> ${esc(sp.prereq)}</p></div>
    <details class="acc"><summary>Hesaplama ayrıntısı</summary><div>${fitTable(fit)}${fit.notes.map(n => `<p class="tiny muted">${esc(n)}</p>`).join("")}</div></details>
    ${sp.pos.length ? `<h3>Pozisyonlar</h3><div class="list">${sp.pos.map(ps => ({ps, f: sportFit(a, sp, ps)})).sort((x, y) => (y.f.phys ?? -1) - (x.f.phys ?? -1)).map(x => `<div class="li" style="cursor:default"><div class="grow"><div class="t">${esc(x.ps.n)}</div><div class="bar mt"><i style="width:${x.f.phys || 0}%"></i></div></div><b>${x.f.phys ?? "—"}</b><button class="btn sm ghost" data-act="setPos" data-aid="${a.id}" data-sid="${sp.id}" data-pid="${x.ps.id}">Seç</button></div>`).join("")}</div>` : ""}
    <button class="btn block mt" data-act="setPos" data-aid="${a.id}" data-sid="${sp.id}" data-pid="">Ana branş yap</button>`};
}, C);
ACT.setPos = el => { const a = getA(el.dataset.aid); a.primarySport = el.dataset.sid; a.position = el.dataset.pid; saveAth(a.id, "coach"); toast("Kaydedildi"); };
route("/c/a/:aid/radar", p => {
  const a = getA(p.aid), cur = qualityScores(a), tgt = targetScores(a, cur);
  return {title: "Hedef seviyeler", html: radarBlock(a) + `<form class="card" data-form="targets" data-aid="${a.id}"><h3>Hedef seviyeler (0–100)</h3><div class="grid3">${QUALITIES.map(q => field(q.n, inp(q.k, tgt[q.k] ?? "", 'inputmode="numeric"'))).join("")}</div><button class="btn sm pri" type="submit">Kaydet</button></form>`};
}, C);
FORM.targets = (d, f) => { const a = getA(f.dataset.aid); a.targets = {}; QUALITIES.forEach(q => { const v = num(d[q.k]); if (isNum(v)) a.targets[q.k] = clamp(Math.round(v), 0, 100); }); saveAth(a.id, "coach"); toast("Kaydedildi"); reRender(); };
route("/c/a/:aid/report", p => reportPage(getA(p.aid), "coach"), C);
route("/c/a/:aid/season", p => {
  const a = getA(p.aid), s = a.season || {phases: [], comps: []}, t = todayISO(), cur = seasonPhaseAt(a, t);
  return {title: "Sezon ve maçlar", html: `<div class="card acc"><div class="tiny muted">Şu anki dönem</div><b>${cur ? esc(SEASON_PHASES[cur].n) : "Tanımlı değil"}</b>${cur ? `<p class="small">${esc(SEASON_PHASES[cur].note)}</p>` : ""}</div>
    <h3>Maçlar / turnuvalar</h3>${(s.comps || []).slice().sort((x, y) => x.date < y.date ? -1 : 1).map(c => `<div class="li" style="cursor:default"><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${fmtD(c.date)} · önem: ${esc(c.imp)}</div></div><button class="btn sm ghost" data-act="seasonDel" data-aid="${a.id}" data-k="comps" data-id="${c.id}">✕</button></div>`).join("") || `<p class="small muted">Yok.</p>`}
    <form class="card mt" data-form="comp" data-aid="${a.id}"><div class="grid2">${field("Maç adı", inp("name", "", "required"))}${field("Tarih", inp("date", addDays(t, 14), 'type="date" required'))}</div>${field("Önem", sel("imp", ["yüksek", "orta", "düşük"], "orta"))}<button class="btn sm pri" type="submit">Maç ekle</button></form>
    <h3>Sezon dönemleri</h3>${(s.phases || []).map(ph => `<div class="li" style="cursor:default"><div class="grow"><div class="t">${esc(SEASON_PHASES[ph.type].n)}</div><div class="s">${fmtD(ph.start)} – ${fmtD(ph.end)}</div></div><button class="btn sm ghost" data-act="seasonDel" data-aid="${a.id}" data-k="phases" data-id="${ph.id}">✕</button></div>`).join("") || `<p class="small muted">Yok.</p>`}
    <form class="card mt" data-form="phase" data-aid="${a.id}">${field("Dönem", sel("type", Object.entries(SEASON_PHASES).map(([k, v]) => [k, v.n])))}<div class="grid2">${field("Başlangıç", inp("start", t, 'type="date" required'))}${field("Bitiş", inp("end", addDays(t, 60), 'type="date" required'))}</div><button class="btn sm pri" type="submit">Dönem ekle</button></form>
    <p class="tiny muted">Yeni program oluştururken maç haftalarında yük otomatik azaltılır.</p>`};
}, C);
FORM.comp = (d, f) => { const a = getA(f.dataset.aid); a.season = a.season || {phases: [], comps: []}; a.season.comps.push({id: uid("cp_"), name: d.name.trim(), date: d.date, imp: d.imp}); saveAth(a.id, "coach"); reRender(); };
FORM.phase = (d, f) => { if (d.end < d.start) throw new Error("Bitiş başlangıçtan önce olamaz."); const a = getA(f.dataset.aid); a.season = a.season || {phases: [], comps: []}; a.season.phases.push({id: uid("sp_"), type: d.type, start: d.start, end: d.end}); saveAth(a.id, "coach"); reRender(); };
ACT.seasonDel = el => { const a = getA(el.dataset.aid); a.season[el.dataset.k] = a.season[el.dataset.k].filter(x => x.id !== el.dataset.id); saveAth(a.id, "coach"); reRender(); };

/* ---------- Gruplar ---------- */
route("/c/groups", () => ({title: "Gruplar", html: `<form class="card" data-form="groupAdd"><h3>Yeni grup</h3>${field("Grup adı", inp("name", "", 'required placeholder="ör. U14 Basketbol"'))}${field("Öğrenciler", `<div class="chips">${DB.athletes.map(a => `<label class="chip" data-toggle><input type="checkbox" name="ids" data-multi="1" value="${a.id}">${esc(a.name)}</label>`).join("") || '<span class="small muted">Önce öğrenci ekleyin</span>'}</div>`)}<button class="btn pri sm" type="submit">Oluştur</button></form>
  ${DB.groups.length ? `<div class="list">${DB.groups.map(g => li("#/c/groups/" + g.id, "users", esc(g.name), g.athleteIds.filter(getA).length + " öğrenci")).join("")}</div>` : empty("Grup yok. Gruplar ile tüm takıma aynı anda test girebilir, grup antrenmanı ve program oluşturabilirsiniz.", "users")}`}), C);
FORM.groupAdd = d => { if (!(d.ids || []).length) throw new Error("En az bir öğrenci seçin."); DB.groups.push({id: uid("gr_"), name: d.name.trim(), athleteIds: d.ids, sessions: []}); saveCoachDoc(); reRender(); };
const GTABS = [["uyeler", "Durum"], ["test", "Toplu test"], ["antrenman", "Grup antrenmanı"], ["program", "Program ata"]];
route("/c/groups/:gid", p => {
  const g = DB.groups.find(x => x.id === p.gid); if (!g) return {title: "Grup", html: empty("Bulunamadı")};
  const as = g.athleteIds.map(getA).filter(Boolean), t = Q("t") || "uyeler", tq = Q("test") || "sp10";
  let body = "";
  if (t === "uyeler") {
    const ws = mondayOf(todayISO()), we = addDays(ws, 6), cols = [COL.cur, COL.tgt, COL.blue, COL.bad];
    body = `<div class="card"><table class="tbl"><tr><th>Öğrenci</th><th class="r">Bu hafta</th><th class="r">Son hazırlık</th><th></th></tr>${as.map(a => { const ad = adherence(a.id, ws, we), last = DB.logs.filter(l => l.athleteId === a.id).sort((x, y) => x.date < y.date ? 1 : -1)[0], al = alertsFor(a).filter(x => x.lv !== "info").length;
      return `<tr><td><a href="#/c/a/${a.id}">${esc(a.name)}</a></td><td class="r">${ad.done}/${ad.planned}</td><td class="r">${last ? (READY.find(x => x[0] === last.readiness) || [, ""])[1] + " " + fmtD(last.date).slice(0, 5) : "—"}</td><td>${al ? pill(al + "⚠", "warn") : ""}</td></tr>`; }).join("")}</table></div>
      <form class="card" data-form="groupEdit" data-gid="${g.id}"><h3>Üyeler</h3><div class="chips">${DB.athletes.map(a => `<label class="chip ${g.athleteIds.includes(a.id) ? "on" : ""}" data-toggle><input type="checkbox" name="ids" data-multi="1" value="${a.id}" ${g.athleteIds.includes(a.id) ? "checked" : ""}>${esc(a.name)}</label>`).join("")}</div><div class="btns"><button class="btn sm pri" type="submit">Kaydet</button><button type="button" class="btn sm danger" data-act="groupDel" data-gid="${g.id}">Grubu sil</button></div></form>`;
  } else if (t === "test") {
    const T = TEST[tq];
    body = `${field("Test", `<select class="in" id="gTest">${TESTS.map(x => `<option value="${x.id}" ${x.id === tq ? "selected" : ""}>${esc(x.n)}</option>`).join("")}</select>`)}
      <form class="card" data-form="groupTest" data-gid="${g.id}" data-t="${T.id}">${field("Tarih", inp("date", todayISO(), 'type="date" required'))}
      <table class="tbl"><tr><th>Öğrenci</th>${T.bil ? "<th>Sol</th><th>Sağ</th>" : `<th>Sonuç (${esc(T.u)})</th>`}</tr>${as.map(a => { const bad = T.tags.some(x => restrictions(a.id).has(x)) || (T.maxEff && holds(a.id).length); return `<tr><td class="small">${esc(a.name)}${bad ? `<br>${pill("uygun değil", "bad")}` : ""}</td>${T.bil ? `<td><input class="in" style="min-height:40px" name="${a.id}__left" inputmode="decimal" ${bad ? "disabled" : ""}></td><td><input class="in" style="min-height:40px" name="${a.id}__right" inputmode="decimal" ${bad ? "disabled" : ""}></td>` : `<td><input class="in" style="min-height:40px" name="${a.id}__value" inputmode="decimal" ${bad ? "disabled" : ""}></td>`}</tr>`; }).join("")}</table>
      ${T.maxEff ? `<label class="check"><input type="checkbox" required><span class="small">Maksimal efor testi gözetimimde, sağlıklı ve hazır öğrencilerle yapıldı.</span></label>` : ""}<button class="btn pri block mt" type="submit">Tümünü kaydet</button></form><p class="tiny muted">${esc(T.proto)}</p>`;
    afterRender.push(() => { const s = $("#gTest"); if (s) s.onchange = () => go(`#/c/groups/${g.id}?t=test&test=${s.value}`); });
  } else if (t === "antrenman") {
    afterRender.push(wireEnv);
    body = `<form class="card" data-form="groupSess" data-gid="${g.id}"><p class="small muted">Seans gruptaki herkesin sağlık kısıtlamalarına ve en düşük gelişim evresine göre güvenli oluşturulur.</p>
      <div class="grid2">${field("Branş", sel("sport", allSports().map(s => [s.id, s.n]), (as[0] || {}).primarySport || "basketball"))}${field("Süre", sel("minutes", [["45", "45 dk"], ["60", "60 dk"], ["75", "75 dk"]], "60"))}</div>
      ${field("Odak", sel("focus", [["", "Branş önceliği"]].concat(QUALITIES.map(q => [q.k, q.n]))))}${field("Tarih", inp("date", todayISO(), 'type="date"'))}${field("Nerede?", sel("env", Object.entries(ENVS).map(([k, v]) => [k, v.n]), "school", 'id="envSel"'))}
      <details class="acc"><summary class="small">Ekipman</summary><div><label class="check"><input type="checkbox" name="space" id="spaceChk" checked><span class="small">Koşu alanı var</span></label>${envEqChips("school")}</div></details><button class="btn pri block" type="submit">Seansı oluştur</button></form>
      ${(g.sessions || []).slice().reverse().map(s => `<div class="card"><div class="row between"><b>${fmtD(s.date)} · ${esc(s.title)}</b>${s.att ? pill(Object.values(s.att).filter(Boolean).length + " katıldı", "ok") : ""}</div>${s.notes.map(n => `<div class="tiny" style="color:var(--warn)">• ${esc(n)}</div>`).join("")}
        ${s.blocks.map(b => `<div class="blockh">${esc(b.n)}</div>${b.items.map(it => `<div class="small" style="padding:3px 0"><a href="#/ex/${it.e}">${esc(exById(it.e).n)}</a> <span class="muted tiny">${exDose(it)}</span></div>`).join("")}`).join("")}
        ${s.att ? "" : `<form data-form="groupAtt" data-gid="${g.id}" data-sid="${s.id}" class="mt"><div class="tiny muted">Katılım ve zorluk (RPE)</div>${as.filter(a => !holds(a.id).length).map(a => `<div class="row" style="padding:4px 0"><label class="check grow" style="padding:0"><input type="checkbox" name="att_${a.id}" checked><span class="small">${esc(a.name)}</span></label>${sel("rpe_" + a.id, Array.from({length: 11}, (_, i) => String(i)), "6", 'style="width:84px;min-height:40px;padding:6px 26px 6px 10px"')}</div>`).join("")}<button class="btn sm pri" type="submit">Katılımı kaydet</button></form>`}</div>`).join("")}`;
  } else {
    afterRender.push(wireEnv);
    body = `<form class="card" data-form="groupProg" data-gid="${g.id}"><p class="small muted">Her öğrenciye aynı ayarlarla, kendi yaşına, gelişim evresine ve sağlık durumuna göre kişiselleştirilmiş ayrı bir program oluşturulur.</p>
      ${field("Branş", sel("sport", allSports().map(s => [s.id, s.n]), (as[0] || {}).primarySport || "basketball"))}${field("Süre", `<div class="chips">${DURS.map(([w, n]) => `<label class="chip"><input type="radio" name="weeks" value="${w}" ${w === 8 ? "checked" : ""}>${n}</label>`).join("")}</div>`)}
      <div class="grid2">${field("Haftada", sel("spw", [["1", "1 gün"], ["2", "2 gün"], ["3", "3 gün"]], "2"))}${field("Süre", sel("minutes", [["45", "45 dk"], ["60", "60 dk"]], "60"))}</div>${field("Nerede?", sel("env", Object.entries(ENVS).map(([k, v]) => [k, v.n]), "school", 'id="envSel"'))}
      <details class="acc"><summary class="small">Ekipman</summary><div><label class="check"><input type="checkbox" name="space" id="spaceChk" checked><span class="small">Koşu alanı var</span></label>${envEqChips("school")}</div></details>
      <button class="btn pri block" type="submit">${as.length} öğrenciye program oluştur</button></form>`;
  }
  return {title: g.name, html: seg(GTABS, t, k => `#/c/groups/${g.id}?t=${k}`) + body};
}, C);
FORM.groupEdit = (d, f) => { const g = DB.groups.find(x => x.id === f.dataset.gid); g.athleteIds = d.ids || []; saveCoachDoc(); toast("Kaydedildi"); reRender(); };
ACT.groupDel = async el => { if (!await confirmBox("Grup silinsin mi? (Öğrenciler silinmez)", "Sil", true)) return; DB.groups = DB.groups.filter(x => x.id !== el.dataset.gid); saveCoachDoc(); go("#/c/groups"); };
FORM.groupTest = (d, f) => {
  const g = DB.groups.find(x => x.id === f.dataset.gid), T = TEST[f.dataset.t]; let n = 0; const errs = [];
  for (const id of g.athleteIds) { const a = getA(id); if (!a) continue; const sub = {value: d[id + "__value"], left: d[id + "__left"], right: d[id + "__right"]}; try { if (saveTestResult(a, T, sub, d.date, "Grup testi")) { n++; saveAth(id, "coach"); } } catch (e) { errs.push(a.name + ": " + e.message); } }
  if (errs.length) toast(errs[0], 4000); if (!n && !errs.length) throw new Error("En az bir sonuç girin."); toast(n + " öğrencinin sonucu kaydedildi"); reRender();
};
FORM.groupSess = (d, f) => {
  const g = DB.groups.find(x => x.id === f.dataset.gid), as = g.athleteIds.map(getA).filter(a => a && !holds(a.id).length);
  if (!as.length) throw new Error("Uygun öğrenci yok.");
  const restr = new Set(), notes = []; as.forEach(a => restrictions(a.id).forEach(t => restr.add(t)));
  const stages = as.map(a => devStage(a)), stage = Math.min(...stages.map(s => s.stage)), sp = sportById(d.sport);
  if (restr.size) notes.push("Grupta kaçınılan: " + [...restr].map(t => RTAGS[t]).join(", "));
  as.forEach((a, i) => { if (stages[i].gv && stages[i].gv.rapid) notes.push(`${a.name}: hızlı büyüme — sıçramaları yarıya indir.`); });
  const focus = d.focus ? [d.focus, relatedQ(d.focus)] : sp.focus.slice(0, 2);
  const s = buildSession({aid: g.id, stage, restr, eq: new Set(d.eq || []), space: !!d.space, growthRapid: stages.some(s => s.gv && s.gv.rapid), sport: sp, seed: d.date}, {minutes: +d.minutes, type: "main"}, {key: "spec", block: 0, wib: 0, mult: 1}, 0, focus, []);
  g.sessions = g.sessions || []; g.sessions.push(Object.assign({id: uid("gs_"), date: d.date, title: focus.map(q => QN[q]).join(" + "), notes}, s));
  saveCoachDoc(); reRender();
};
FORM.groupAtt = (d, f) => {
  const g = DB.groups.find(x => x.id === f.dataset.gid), s = g.sessions.find(x => x.id === f.dataset.sid); s.att = {};
  g.athleteIds.forEach(id => { if (d["att_" + id]) { s.att[id] = true; const rpe = num(d["rpe_" + id]); DB.extLoads.push({id: uid("x_"), athleteId: id, src: "coach", type: "Grup antrenmanı: " + g.name, date: s.date, duration: s.estMin, rpe, load: Math.round(rpe * s.estMin)}); saveAth(id, "coach"); } });
  saveCoachDoc(); toast("Katılım kaydedildi"); reRender();
};
FORM.groupProg = (d, f) => {
  const g = DB.groups.find(x => x.id === f.dataset.gid); let ok = 0; const skip = [];
  for (const id of g.athleteIds) {
    const a = getA(id); if (!a) continue;
    if (!a.birthDate) { skip.push(a.name + " (bilgi eksik)"); continue; }
    const r = generateProgram(a, {type: "main", sport: d.sport, pos: a.position || null, weeks: parseInt(d.weeks), spw: d.spw, minutes: parseInt(d.minutes), env: d.env, eq: d.eq || [], space: d.space, startDate: nextMonday(), testInterval: 4, includeExtra: true, seasonAware: true});
    if (!r.ok) { skip.push(a.name + " (sağlık onayı)"); continue; }
    DB.programs.filter(x => x.athleteId === id && x.type === "main" && x.status === "onaylı").forEach(x => x.status = "arşiv");
    DB.programs.push(Object.assign(r.program, {athleteId: id})); saveAth(id, "coach"); ok++;
  }
  sheet(`<h2>Programlar oluşturuldu</h2><p>${ok} öğrenciye program oluşturuldu.</p>${skip.length ? alertBox("warn", "Atlananlar", skip.map(esc).join("<br>")) : ""}<button class="btn pri block" data-act="closeSheet">Tamam</button>`);
};
