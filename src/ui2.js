/* =========================================================================
   SPORCU PROFİLİ, SAĞLIK, ANTROPOMETRİ, OLGUNLAŞMA, İZİNLER, HEDEFLER, ÜYELER
   ========================================================================= */
const CONSENT_N = {data: "Kişisel veri işleme (KVKK)", health: "Sağlık verisi işleme", video: "Video kaydı ve analizi", photo: "Fotoğraf kullanımı", shareCoach: "Sağlık detaylarını antrenörle paylaşma", childAssent: "Çocuğun kendi onayı (yaşa uygun)"};
const ACTIVITY = [["1", "Çok düşük (çoğunlukla oturarak)"], ["2", "Düşük"], ["3", "Orta (günde ~60 dk aktif)"], ["4", "Yüksek"], ["5", "Çok yüksek"]];
const DOMS = [["sağ", "Sağ"], ["sol", "Sol"], ["iki", "İki taraf"]];

route("/athletes", () => {
  const as = visibleAthletes();
  return {title: role() === "parent" ? "Çocuklarım" : "Sporcular", html: `${role() !== "athlete" ? `<a class="btn pri block" href="#/athlete/new">${ic("plus")} ${role() === "parent" ? "Çocuk profili oluştur" : "Sporcu ekle"}</a><div class="hr"></div>` : ""}
    ${as.length ? `<div class="list">${as.map(a => { const p = activeProgram(a.id); const h = holds(a.id); return athleteCard(a, h.length ? pill("onay gerekli", "bad") : p ? pill(p.status, p.status === "onaylı" ? "ok" : "warn") : ""); }).join("")}</div>` : empty("Kayıtlı sporcu yok.", "users")}`};
});

/* ---------- Sporcu oluşturma / düzenleme ---------- */
function athleteForm(a, isNew, self) {
  a = a || {}; const an = isNew ? {} : anth(a.id);
  const sp = sportById(a.primarySport);
  const teamDays = (a.teamDays || []).map(String);
  return `<form data-form="athlete" data-id="${a.id || ""}" data-self="${self ? 1 : 0}">
    <h3>Kişisel bilgiler</h3>
    ${field("Ad soyad *", inp("name", a.name, "required"))}
    <div class="grid2">${field("Doğum tarihi *", inp("birthDate", a.birthDate, 'type="date" required max="' + todayISO() + '"'))}${field("Cinsiyet *", sel("sex", [["E", "Erkek"], ["K", "Kız"]], a.sex || "E"), "Yalnızca fizyolojik referanslar için")}</div>
    ${isNew ? `<h3>İlk ölçümler</h3><div class="grid2">${field("Boy (cm)", inp("heightCm", an.heightCm, 'inputmode="decimal"'))}${field("Kilo (kg)", inp("weightKg", an.weightKg, 'inputmode="decimal"'))}${field("Oturma boyu (cm)", inp("sittingHeightCm", an.sittingHeightCm, 'inputmode="decimal"'), "Olgunlaşma tahmini için")}${field("Kol açıklığı (cm)", inp("armSpanCm", an.armSpanCm, 'inputmode="decimal"'))}</div>` : ""}
    <div class="grid2">${field("Baskın el", sel("dominantHand", DOMS, a.dominantHand || "sağ"))}${field("Baskın ayak", sel("dominantFoot", DOMS, a.dominantFoot || "sağ"))}</div>
    ${field("Günlük fiziksel aktivite düzeyi", sel("activityLevel", ACTIVITY, a.activityLevel || "3"))}
    <h3>Spor geçmişi</h3>
    ${field("Önceki spor deneyimleri", `<textarea class="in" name="sportsHistory" placeholder="ör. Yüzme 1 yıl, Futbol 6 ay">${esc(a.sportsHistory || "")}</textarea>`)}
    <div class="grid2">${field("Spor geçmişi süresi (yıl)", inp("trainingYears", a.trainingYears, 'inputmode="decimal"'))}${field("Takım antrenmanı / hafta", inp("weeklySessions", a.weeklySessions, 'inputmode="numeric"'))}</div>
    <div class="grid2">${field("Takım seansı süresi (dk)", inp("teamSessionMin", a.teamSessionMin || 90, 'inputmode="numeric"'))}${field("Günlük uyku (saat)", inp("sleepHours", a.sleepHours, 'inputmode="decimal"'))}</div>
    ${field("Takım antrenman günleri", `<div class="chips">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label class="chip ${teamDays.includes(String(d)) ? "on" : ""}" data-toggle><input type="checkbox" name="teamDays" data-multi="1" value="${d}" ${teamDays.includes(String(d)) ? "checked" : ""}>${DOW[d]}</label>`).join("")}</div>`)}
    <div class="grid2">${field("Mevcut kulüp", inp("club", a.club))}${field("Mevcut antrenör", inp("coachName", a.coachName))}</div>
    ${field("Ana branş", sel("primarySport", [["", "Henüz seçilmedi"]].concat(allSports().map(s => [s.id, s.n])), a.primarySport || ""))}
    ${sp && sp.pos.length ? field("Pozisyon / disiplin", sel("position", [["", "Belirtilmedi"]].concat(sp.pos.map(p => [p.id, p.n])), a.position || "")) : `<input type="hidden" name="position" value="${esc(a.position || "")}">`}
    ${field("Seviye", sel("level", ["Başlangıç", "Başlangıç-orta", "Orta", "İleri"], a.level || "Başlangıç"))}
    ${role() === "coach" ? field("Teknik yeterlilik (antrenör değerlendirmesi)", sel("competency", [["1", "1 — temel hareketlerde zorlanıyor"], ["2", "2 — gelişmekte"], ["3", "3 — temel paternler yeterli"], ["4", "4 — iyi teknik, yük alabilir"], ["5", "5 — ileri teknik yeterlilik"]], a.competency || "2"), "Gelişim evresi hesabında kullanılır") : ""}
    ${field("Kişisel hedefler", `<textarea class="in" name="personalGoals">${esc(a.personalGoals || "")}</textarea>`)}
    ${isNew ? `<h3>İzinler ve onaylar</h3><p class="small muted">Çocuk verileri reklam, pazarlama veya izinsiz profil oluşturma amacıyla kullanılmaz.</p>
      <label class="check"><input type="checkbox" name="c_data" required><span class="small"><b>${CONSENT_N.data}</b> — ${role() === "coach" ? "Veli/yasal vasiden yazılı onay alındı." : self ? "18 yaş altıysan velinin onayı gerekir; veli hesabı eklendiğinde onay güncellenir." : "Veli/yasal vasi olarak onaylıyorum."} *</span></label>
      <label class="check"><input type="checkbox" name="c_health"><span class="small">${CONSENT_N.health}</span></label>
      <label class="check"><input type="checkbox" name="c_shareCoach"><span class="small">${CONSENT_N.shareCoach}</span></label>
      <label class="check"><input type="checkbox" name="c_video"><span class="small">${CONSENT_N.video}</span></label>
      <label class="check"><input type="checkbox" name="c_photo"><span class="small">${CONSENT_N.photo}</span></label>
      <label class="check"><input type="checkbox" name="c_childAssent"><span class="small">${CONSENT_N.childAssent} — çocuğa yaşına uygun dille anlatıldı ve kabul etti.</span></label>` : ""}
    <button class="btn pri block" type="submit">${isNew ? "Sporcuyu oluştur" : "Kaydet"}</button></form>`;
}
route("/athlete/new", p => {
  if (role() === "athlete" && myAthlete()) { go("#/home"); return null; }
  const self = role() === "athlete";
  return {title: self ? "Profilimi oluştur" : "Sporcu oluştur", html: athleteForm(null, true, self)};
});
route("/a/:aid/edit", p => {
  if (!canEditProfile(p.aid)) return {title: "Profil", html: alertBox("warn", "Yetki yok", "Profil bilgilerini yalnızca antrenör veya veli düzenleyebilir.")};
  return {title: "Profili düzenle", html: athleteForm(getA(p.aid), false)};
});
const NUMF = ["trainingYears", "weeklySessions", "teamSessionMin", "sleepHours"];
FORM.athlete = (d, f) => {
  const id = f.dataset.id, isNew = !id;
  const rec = {name: d.name.trim(), birthDate: d.birthDate, sex: d.sex, dominantHand: d.dominantHand, dominantFoot: d.dominantFoot, activityLevel: d.activityLevel, sportsHistory: d.sportsHistory, club: d.club, coachName: d.coachName, primarySport: d.primarySport, position: d.position, level: d.level, personalGoals: d.personalGoals, teamDays: (d.teamDays || []).map(Number)};
  NUMF.forEach(k => rec[k] = num(d[k]));
  if (d.competency) rec.competency = num(d.competency);
  if (!rec.name || !rec.birthDate) throw new Error("Ad ve doğum tarihi zorunlu.");
  const age = ageAt(rec.birthDate); if (age < 4 || age > 25) throw new Error("Doğum tarihi 4–25 yaş aralığında olmalı.");
  if (isNew) {
    const a = Object.assign({id: uid("a_"), createdAt: Date.now(), createdBy: S.me.id, goals: [], interests: {}, targets: {}, season: {phases: [], comps: []}, competency: rec.competency || 2}, rec);
    DB.athletes.push(a); S.me.athleteIds = (S.me.athleteIds || []).concat(a.id);
    const m = {id: uid("m_"), athleteId: a.id, date: todayISO()}; let any = false;
    ["heightCm", "weightKg", "sittingHeightCm", "armSpanCm"].forEach(k => { const v = num(d[k]); if (v != null) { m[k] = v; any = true; } });
    if (any) DB.measurements.push(m);
    Object.keys(CONSENT_N).forEach(t => DB.consents.push({athleteId: a.id, type: t, granted: !!d["c_" + t], by: S.me.name + " (" + ROLE_N[role()] + ")", at: Date.now()}));
    audit("Sporcu profili oluşturuldu", a.id, a.name); save(); toast("Profil oluşturuldu"); go("#/a/" + a.id);
  } else {
    Object.assign(getA(id), rec); audit("Profil güncellendi", id, ""); save(); toast("Kaydedildi"); go("#/a/" + id);
  }
};

/* ---------- Sporcu profili ---------- */
route("/a/:aid", p => {
  const a = getA(p.aid), age = ageAt(a.birthDate), an = anth(a.id), ds = devStage(a), sp = sportById(a.primarySport), h = holds(a.id);
  const qs = qualityScores(a), pr = activeProgram(a.id), r = role();
  const comments = DB.comments.filter(c => c.athleteId === a.id && (r === "coach" || (c.vis || []).includes(r))).sort((x, y) => y.at - x.at);
  const A = "#/a/" + a.id;
  const nav = [
    [A + "/physical", "user", "Fiziksel özellikler", "Baskın taraf, aktivite, spor geçmişi"],
    [A + "/health", "heart", "Sağlık bilgileri", canSeeHealth(a.id) ? `${healthOf(a.id).length} kayıt` : "Ayrıntılar yalnızca yetkili kişilere"],
    [A + "/anthro", "ruler", "Antropometrik ölçümler", `${measOf(a.id).length} ölçüm`],
    [A + "/maturity", "grow", "Biyolojik gelişim analizi", ds.n],
    [A + "/tests", "flask", "Performans test merkezi", `${testsOf(a.id).length} sonuç`],
    [A + "/results", "chart", "Test sonuçları ve karşılaştırma", ""],
    [A + "/radar", "radar", "Atletik radar grafiği", ""],
    [A + "/discover", "compass", "Branş keşfi", "Uygunluk analizi ve pozisyonlar"],
    [A + "/programs", "doc", "Programlar", pr ? `${pr.weeks} hafta · ${pr.status}` : "Aktif program yok"],
    [A + "/calendar", "cal", "Haftalık takvim", ""],
    [A + "/video", "video", "Video hareket analizi", `${DB.videos.filter(v => v.athleteId === a.id).length} analiz`],
    [A + "/load", "chart", "Sakatlık riski ve yük takibi", ""],
    [A + "/extra", "plus", "Ek gelişim önerileri", ""],
    [A + "/focus", "target", "Zayıf yön geliştirme", ""],
    [A + "/season", "cal", "Sezon yönetimi", ""],
    [A + "/progress", "trend", "Gelişim takibi", ""],
    [A + "/longterm", "grow", "Uzun vadeli gelişim", ""],
    [A + "/optimize", "bolt", "Program optimizasyonu", ""],
    [A + "/goals", "target", "Hedefler", `${(a.goals || []).filter(g => !g.done).length} aktif`],
    [A + "/consents", "shield", "İzinler ve onaylar", ""],
    [A + "/report", "doc", "PDF raporları", ""]
  ].filter(x => !(r === "athlete" && ["/focus", "/optimize"].some(s => x[0].endsWith(s))));
  return {title: a.name, html: `
    <div class="card acc"><div class="row"><div class="avatar">${esc(initials(a.name))}</div><div class="grow"><h2 style="margin:0">${esc(a.name)}</h2>
      <div class="small muted">${fmtN(age, 1)} yaş · ${a.sex === "K" ? "Kız" : "Erkek"} · ${esc(a.level || "")}</div>
      <div class="small">${sp ? esc(sp.n) + (a.position ? " · " + esc((sp.pos.find(x => x.id === a.position) || {}).n || "") : "") : "Branş seçilmedi"}</div></div>
      ${canEditProfile(a.id) ? `<a class="btn sm" href="${A}/edit">Düzenle</a>` : ""}</div>
      <div class="grid3 mt"><div class="stat"><b>${fmtN(an.heightCm, 1)}</b><span>Boy (cm)</span></div><div class="stat"><b>${fmtN(an.weightKg, 1)}</b><span>Kilo (kg)</span></div><div class="stat"><b>${ds.stage}/6</b><span>Gelişim evresi</span></div></div></div>
    ${h.map(x => alertBox("bad", "Program oluşturma beklemede", esc(x))).join("")}
    <div class="card"><div class="row between"><h3 style="margin:0">Atletik profil</h3><a class="small" href="${A}/radar">Radar →</a></div>
      ${QUALITIES.map(q => scoreBar(q.n, qs[q.k].score)).join("")}<p class="tiny muted">Puanlar yaş ve cinsiyete göre yaklaşık referanslardan hesaplanır (0–100, 50 ≈ ortalama). “—” = test yapılmadı.</p></div>
    <h3>Antrenör yorumları</h3>
    ${r === "coach" ? `<form data-form="comment" data-aid="${a.id}" class="card flat"><textarea class="in" name="text" placeholder="Sporcu ve veli için yorum yazın" required></textarea><div class="row wrap mt"><label class="check"><input type="checkbox" name="vAthlete" checked><span class="small">Sporcu görsün</span></label><label class="check"><input type="checkbox" name="vParent" checked><span class="small">Veli görsün</span></label></div><button class="btn sm pri" type="submit">Yorum ekle</button></form>` : ""}
    ${comments.length ? comments.slice(0, 5).map(c => `<div class="card flat" style="padding:11px"><div class="tiny muted">${esc(c.byName)} · ${fmtDT(c.at)}</div><div>${esc(c.text)}</div></div>`).join("") : `<p class="small muted">Henüz yorum yok.</p>`}
    <h3>Modüller</h3><div class="list">${nav.map(n => li(n[0], n[1], n[2], esc(n[3]))).join("")}</div>
    ${canEditProfile(a.id) && r !== "athlete" ? `<button class="btn danger block mt" data-act="delAthlete" data-aid="${a.id}">Sporcu profilini ve tüm verilerini sil</button>` : ""}`};
});
FORM.comment = (d, f) => {
  const aid = f.dataset.aid, a = getA(aid), vis = []; if (d.vAthlete) vis.push("athlete"); if (d.vParent) vis.push("parent");
  DB.comments.push({id: uid("c_"), athleteId: aid, at: Date.now(), by: S.me.id, byName: S.me.name, text: d.text.trim(), vis});
  notify({key: "cm:" + Date.now(), athleteId: aid, type: "comment", title: "Yeni antrenör yorumu", body: `${a.name}: ${d.text.trim().slice(0, 90)}`, roles: vis});
  audit("Antrenör yorumu eklendi", aid, ""); save(); toast("Yorum eklendi"); reRender();
};
ACT.delAthlete = async el => {
  const aid = el.dataset.aid, a = getA(aid);
  if (!await confirmBox(`${a.name} profilini ve tüm ilişkili verileri (testler, programlar, sağlık, videolar) kalıcı olarak silmek istiyor musunuz?`, "Kalıcı olarak sil", true)) return;
  for (const v of DB.videos.filter(v => v.athleteId === aid && v.blob)) await idbDel(v.blob);
  ["measurements", "health", "tests", "programs", "logs", "extLoads", "videos", "comments", "consents", "notifs"].forEach(k => DB[k] = DB[k].filter(x => x.athleteId !== aid));
  DB.athletes = DB.athletes.filter(x => x.id !== aid); DB.members.forEach(m => m.athleteIds = (m.athleteIds || []).filter(x => x !== aid));
  DB.groups.forEach(g => g.athleteIds = g.athleteIds.filter(x => x !== aid));
  audit("Sporcu profili silindi (veri silme talebi)", null, a.name); save(); toast("Silindi"); go("#/athletes");
};

/* ---------- Fiziksel özellikler ---------- */
route("/a/:aid/physical", p => {
  const a = getA(p.aid), sp = sportById(a.primarySport);
  const kv = [["Doğum tarihi", fmtD(a.birthDate)], ["Yaş", fmtN(ageAt(a.birthDate), 1)], ["Cinsiyet", a.sex === "K" ? "Kız" : "Erkek"], ["Baskın el", a.dominantHand], ["Baskın ayak", a.dominantFoot], ["Aktivite düzeyi", (ACTIVITY.find(x => x[0] == a.activityLevel) || [, "—"])[1]],
    ["Spor geçmişi", a.sportsHistory || "—"], ["Spor geçmişi süresi", isNum(a.trainingYears) ? a.trainingYears + " yıl" : "—"], ["Takım antrenmanı", isNum(a.weeklySessions) ? a.weeklySessions + " / hafta × " + (a.teamSessionMin || 90) + " dk" : "—"], ["Takım günleri", (a.teamDays || []).map(d => DOW[d]).join(", ") || "—"],
    ["Uyku", isNum(a.sleepHours) ? a.sleepHours + " saat" : "—"], ["Kulüp", a.club || "—"], ["Antrenör", a.coachName || "—"], ["Branş", sp ? sp.n : "—"], ["Seviye", a.level || "—"], ["Teknik yeterlilik", (a.competency || "—") + "/5"], ["Kişisel hedefler", a.personalGoals || "—"]];
  const an = anth(a.id);
  return {title: "Fiziksel özellikler", html: `<div class="card"><dl class="kv">${kv.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>
    <div class="card"><h3>Son antropometrik değerler</h3><dl class="kv">${[["Boy", an.heightCm, "cm"], ["Kilo", an.weightKg, "kg"], ["Oturma boyu", an.sittingHeightCm, "cm"], ["Bacak uzunluğu", an.legLengthCm, "cm"], ["Kol açıklığı", an.armSpanCm, "cm"], ["Kol açıklığı / boy", isNum(an.armSpanCm) && isNum(an.heightCm) ? an.armSpanCm / an.heightCm : null, ""]].map(([k, v, u]) => `<dt>${k}</dt><dd>${isNum(v) ? fmtN(v, u ? 1 : 3) + " " + u : "—"}</dd>`).join("")}</dl><a class="btn sm mt" href="#/a/${a.id}/anthro">Ölçümler</a></div>
    ${canEditProfile(a.id) ? `<a class="btn pri block" href="#/a/${a.id}/edit">Bilgileri düzenle</a>` : `<p class="small muted">Bu bilgileri antrenörün veya velin güncelleyebilir.</p>`}`};
});

/* ---------- Sağlık ---------- */
const HSTAT = [["aktif", "Aktif"], ["takipte", "Takipte"], ["geçmiş", "Geçmiş / iyileşti"]];
route("/a/:aid/health", p => {
  const a = getA(p.aid), restr = restrictions(a.id), h = holds(a.id);
  const top = alertBox("info", "Önemli", "Bu uygulama hastalık teşhisi koymaz ve tedavi önermez. Kayıtlar yalnızca güvenli program oluşturmak için kullanılır. Tıbbi onay gereken durumlarda program oluşturma beklemeye alınır.");
  const restrBox = `<div class="card"><h3>Program filtresine yansıyan kısıtlamalar</h3>${restr.size ? `<div class="chips">${[...restr].map(t => pill(RTAGS[t], "warn")).join("")}</div>` : `<p class="small muted">Kayıtlı hareket kısıtlaması yok.</p>`}${h.length ? h.map(x => alertBox("bad", "", esc(x))).join("") : ""}</div>`;
  if (!canSeeHealth(a.id)) return {title: "Sağlık bilgileri", html: top + alertBox("warn", "Ayrıntılar gizli", "Veli, sağlık ayrıntılarını antrenörle paylaşma izni vermediği için yalnızca güvenlik açısından gerekli kısıtlama özetini görebilirsiniz.") + restrBox};
  const items = healthOf(a.id).sort((x, y) => (x.status === "geçmiş") - (y.status === "geçmiş") || (y.date || "").localeCompare(x.date || ""));
  const canEd = canEditHealth(a.id), hc = consent(a.id, "health");
  audit("Sağlık verisi görüntülendi", a.id, "");
  return {title: "Sağlık bilgileri", html: top + restrBox +
    (!hc ? alertBox("warn", "Sağlık verisi izni yok", `Sağlık kaydı eklemek için velinin “${CONSENT_N.health}” iznini vermesi gerekir. <a href="#/a/${a.id}/consents">İzinler</a>`) : "") +
    (canEd && hc ? `<button class="btn pri block" data-act="healthEdit" data-aid="${a.id}">${ic("plus")} Sağlık kaydı ekle</button><div class="hr"></div>` : "") +
    (items.length ? items.map(x => `<div class="card"><div class="row between"><div class="grow"><div class="tiny muted">${esc(HCAT[x.cat] ? HCAT[x.cat].n : x.cat)} · ${fmtD(x.date)}</div><b>${esc(x.title)}</b></div>${pill(x.status, x.status === "aktif" ? "bad" : x.status === "takipte" ? "warn" : "ok")}</div>
      ${x.desc ? `<p class="small">${esc(x.desc)}</p>` : ""}
      ${x.requiresClearance ? `<p class="small">${x.clearanceGiven ? pill("Uzman onayı var", "ok") + ` <span class="muted">${esc(x.clearedBy || "")} ${fmtD(x.clearanceDate)}</span>` : pill("Uzman onayı bekleniyor", "bad")}</p>` : ""}
      ${(x.tags || []).length ? `<div class="chips">${x.tags.map(t => pill(RTAGS[t], "warn")).join("")}</div>` : ""}
      ${x.specialistNote ? `<p class="small"><b>Uzman kısıtlaması:</b> ${esc(x.specialistNote)}</p>` : ""}
      ${x.cat === "medication" && x.med ? `<p class="small"><b>İlaç:</b> ${esc(x.med)}</p>` : ""}
      ${canEd ? `<div class="btns"><button class="btn sm" data-act="healthEdit" data-aid="${a.id}" data-id="${x.id}">Düzenle</button><button class="btn sm danger" data-act="healthDel" data-id="${x.id}">Sil</button></div>` : ""}</div>`).join("") : empty("Sağlık kaydı yok.", "heart")) +
    (healthAdvice(a.id).length ? `<div class="card flat"><h3>Uygulama notları</h3><ul class="small" style="padding-left:18px">${healthAdvice(a.id).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "")};
});
ACT.healthEdit = el => {
  const aid = el.dataset.aid, x = el.dataset.id ? DB.health.find(h => h.id === el.dataset.id) : {cat: "injury", status: "aktif", date: todayISO(), tags: []};
  sheet(`<h2>${el.dataset.id ? "Sağlık kaydını düzenle" : "Sağlık kaydı ekle"}</h2><form data-form="health" data-aid="${aid}" data-id="${el.dataset.id || ""}">
    ${field("Kategori", sel("cat", HEALTH_CATS.map(c => [c.k, c.n]), x.cat, 'id="hcat"'))}
    ${field("Başlık *", inp("title", x.title, 'required placeholder="ör. Sağ ayak bileği burkulması"'))}
    ${field("Açıklama", `<textarea class="in" name="desc">${esc(x.desc || "")}</textarea>`)}
    <div class="grid2">${field("Tarih", inp("date", x.date, 'type="date"'))}${field("Mevcut durum", sel("status", HSTAT, x.status))}</div>
    <label class="check"><input type="checkbox" name="permanent" ${x.permanent ? "checked" : ""}><span class="small">Kısıtlamalar durum “geçmiş” olsa da geçerli kalsın</span></label>
    <label class="check"><input type="checkbox" name="requiresClearance" id="hclr" ${x.requiresClearance ? "checked" : ""}><span class="small"><b>Tıbbi/uzman onayı gerekli</b> (onay verilene kadar program oluşturma bekletilir)</span></label>
    <label class="check"><input type="checkbox" name="clearanceGiven" ${x.clearanceGiven ? "checked" : ""}><span class="small">Uzman onayı alındı</span></label>
    <div class="grid2">${field("Onay veren uzman", inp("clearedBy", x.clearedBy))}${field("Onay tarihi", inp("clearanceDate", x.clearanceDate, 'type="date"'))}</div>
    ${field("Yasaklanan / kısıtlanan hareketler", `<div class="chips" id="htags">${Object.entries(RTAGS).map(([k, v]) => `<label class="chip ${(x.tags || []).includes(k) ? "on" : ""}" data-toggle><input type="checkbox" name="tags" data-multi="1" value="${k}" ${(x.tags || []).includes(k) ? "checked" : ""}>${v}</label>`).join("")}</div>`, "Seçilen hareket türleri program ve testlerden otomatik çıkarılır.")}
    ${field("Uzman tarafından belirlenen kısıtlama notu", `<textarea class="in" name="specialistNote">${esc(x.specialistNote || "")}</textarea>`)}
    ${field("İlaç (yalnızca ilaç kategorisi; yetkili kişiler görür)", inp("med", x.med))}
    <div class="btns"><button type="button" class="btn" data-act="closeSheet">Vazgeç</button><button class="btn pri" type="submit">Kaydet</button></div></form>`);
  $("#hcat").onchange = e => { const c = HCAT[e.target.value]; $("#hclr").checked = c.clear; $$("#htags .chip").forEach(ch => { const i = ch.querySelector("input"); if (c.tags.includes(i.value)) { i.checked = true; ch.classList.add("on"); } }); };
};
FORM.health = (d, f) => {
  const aid = f.dataset.aid, id = f.dataset.id;
  const rec = {cat: d.cat, title: d.title.trim(), desc: d.desc, date: d.date, status: d.status, permanent: d.permanent, requiresClearance: d.requiresClearance, clearanceGiven: d.clearanceGiven, clearedBy: d.clearedBy, clearanceDate: d.clearanceDate, tags: d.tags || [], specialistNote: d.specialistNote, med: d.med};
  if (id) Object.assign(DB.health.find(h => h.id === id), rec); else DB.health.push(Object.assign({id: uid("h_"), athleteId: aid, createdAt: Date.now(), by: S.me.name}, rec));
  if (rec.requiresClearance && !rec.clearanceGiven && rec.status !== "geçmiş") notify({key: "hold:" + aid + ":" + Date.now(), athleteId: aid, type: "health", title: "Tıbbi onay bekleniyor", body: `${getA(aid).name}: “${rec.title}” için uzman onayı gerekli; program oluşturma beklemede.`, roles: ["coach", "parent"]});
  audit(id ? "Sağlık kaydı güncellendi" : "Sağlık kaydı eklendi", aid, HCAT[rec.cat].n); save(); closeSheet(); toast("Kaydedildi"); reRender();
};
ACT.healthDel = async el => { if (!await confirmBox("Bu sağlık kaydı silinsin mi?", "Sil", true)) return; const h = DB.health.find(x => x.id === el.dataset.id); DB.health = DB.health.filter(x => x !== h); audit("Sağlık kaydı silindi", h.athleteId, ""); save(); reRender(); };

/* ---------- Antropometri ---------- */
const AFIELDS = [["heightCm", "Boy", "cm"], ["weightKg", "Kilo", "kg"], ["sittingHeightCm", "Oturma boyu", "cm"], ["armSpanCm", "Kol açıklığı", "cm"], ["legLengthCm", "Bacak uzunluğu", "cm"], ["trunkLengthCm", "Gövde uzunluğu", "cm"], ["shoulderWidthCm", "Omuz genişliği", "cm"], ["hipCircCm", "Kalça çevresi", "cm"], ["waistCircCm", "Bel çevresi", "cm"], ["bodyFatPct", "Yağ oranı", "%"], ["muscleMassKg", "Kas kütlesi", "kg"]];
const LRFIELDS = [["armCirc", "Üst kol çevresi", "cm"], ["thighCirc", "Uyluk çevresi", "cm"], ["calfCirc", "Baldır çevresi", "cm"], ["romHipFlex", "Kalça fleksiyonu", "°"], ["romAnkleDF", "Ayak bileği dorsifleksiyonu", "°"], ["romShoulderFlex", "Omuz fleksiyonu", "°"]];
const POSTURE = ["Baş önde", "Omuz asimetrisi", "Kifoz artışı", "Lordoz artışı", "Pelvik öne tilt", "Diz valgus", "Diz varus", "Düz taban görünümü", "Skolyoz şüphesi (uzmana yönlendir)"];
route("/a/:aid/anthro", p => {
  const a = getA(p.aid), ms = measOf(a.id).slice().reverse(), ed = canEditProfile(a.id);
  const pts = k => measOf(a.id).filter(m => isNum(m[k])).map(m => ({x: m.date, y: m[k]}));
  return {title: "Antropometrik ölçümler", html: `
    ${ed ? `<button class="btn pri block" data-act="measAdd" data-aid="${a.id}">${ic("plus")} Yeni ölçüm ekle</button><div class="hr"></div>` : ""}
    <div class="card"><h3>Boy gelişimi</h3>${lineChart([{color: COL.cur, points: pts("heightCm")}], {dec: 0})}</div>
    <div class="card"><h3>Kilo gelişimi</h3>${lineChart([{color: COL.blue, points: pts("weightKg")}], {dec: 0})}</div>
    <h3>Ölçüm geçmişi</h3>${ms.length ? ms.map(m => `<details class="acc"><summary>${fmtD(m.date)} <span class="muted small">${isNum(m.heightCm) ? m.heightCm + " cm" : ""} ${isNum(m.weightKg) ? "· " + m.weightKg + " kg" : ""}</span></summary><div>
      <dl class="kv">${AFIELDS.filter(([k]) => isNum(m[k])).map(([k, n, u]) => `<dt>${n}</dt><dd>${fmtN(m[k], 1)} ${u}</dd>`).join("")}
      ${LRFIELDS.filter(([k]) => isNum(m[k + "L"]) || isNum(m[k + "R"])).map(([k, n, u]) => `<dt>${n} (S/Sğ)</dt><dd>${fmtN(m[k + "L"], 1)} / ${fmtN(m[k + "R"], 1)} ${u}</dd>`).join("")}
      ${m.bodyCompMethod ? `<dt>Kompozisyon yöntemi</dt><dd>${esc(m.bodyCompMethod)}</dd>` : ""}</dl>
      ${(m.posture || []).length ? `<p class="small"><b>Postür:</b> ${m.posture.map(esc).join(", ")}</p>` : ""}${m.note ? `<p class="small">${esc(m.note)}</p>` : ""}
      ${ed ? `<button class="btn sm danger" data-act="measDel" data-id="${m.id}">Ölçümü sil</button>` : ""}</div></details>`).join("") : empty("Ölçüm yok.", "ruler")}
    <p class="tiny muted">Vücut kompozisyonu ve postür değerlendirmesi uzman tarafından yapılmalıdır; çocuklarda kilo/yağ oranı hedefi verilmez.</p>`};
});
ACT.measAdd = el => {
  const aid = el.dataset.aid, last = anth(aid);
  sheet(`<h2>Yeni ölçüm</h2><form data-form="meas" data-aid="${aid}">${field("Ölçüm tarihi", inp("date", todayISO(), 'type="date" required'))}
    <div class="grid2">${AFIELDS.map(([k, n, u]) => field(`${n} (${u})`, inp(k, "", `inputmode="decimal" placeholder="${isNum(last[k]) ? "son: " + last[k] : ""}"`))).join("")}</div>
    ${field("Vücut kompozisyonu ölçüm yöntemi", inp("bodyCompMethod", "", 'placeholder="ör. biyoelektrik empedans, deri kıvrımı"'))}
    <h3>Sağ / sol ölçümler</h3>${LRFIELDS.map(([k, n, u]) => `<div class="grid2">${field(`${n} — Sol (${u})`, inp(k + "L", "", 'inputmode="decimal"'))}${field(`Sağ (${u})`, inp(k + "R", "", 'inputmode="decimal"'))}</div>`).join("")}
    ${field("Postür değerlendirmesi", `<div class="chips">${POSTURE.map(x => `<label class="chip" data-toggle><input type="checkbox" name="posture" data-multi="1" value="${esc(x)}">${esc(x)}</label>`).join("")}</div>`)}
    ${field("Not", `<textarea class="in" name="note"></textarea>`)}
    <div class="btns"><button type="button" class="btn" data-act="closeSheet">Vazgeç</button><button class="btn pri" type="submit">Kaydet</button></div></form>`);
};
FORM.meas = (d, f) => {
  const m = {id: uid("ms_"), athleteId: f.dataset.aid, date: d.date, posture: d.posture || [], note: d.note, bodyCompMethod: d.bodyCompMethod};
  let n = 0;
  AFIELDS.forEach(([k]) => { const v = num(d[k]); if (v != null) { m[k] = v; n++; } });
  LRFIELDS.forEach(([k]) => ["L", "R"].forEach(s => { const v = num(d[k + s]); if (v != null) { m[k + s] = v; n++; } }));
  if (!n && !m.posture.length) throw new Error("En az bir ölçüm girin.");
  if (isNum(m.heightCm) && (m.heightCm < 80 || m.heightCm > 230)) throw new Error("Boy 80–230 cm aralığında olmalı.");
  if (isNum(m.sittingHeightCm) && isNum(m.heightCm) && m.sittingHeightCm >= m.heightCm) throw new Error("Oturma boyu boydan küçük olmalı.");
  if (isNum(m.weightKg) && (m.weightKg < 12 || m.weightKg > 180)) throw new Error("Kilo 12–180 kg aralığında olmalı.");
  DB.measurements.push(m); audit("Antropometrik ölçüm eklendi", m.athleteId, fmtD(m.date)); save(); closeSheet(); toast("Ölçüm kaydedildi"); reRender();
};
ACT.measDel = async el => { if (!await confirmBox("Ölçüm silinsin mi?", "Sil", true)) return; DB.measurements = DB.measurements.filter(m => m.id !== el.dataset.id); save(); reRender(); };

/* ---------- Biyolojik gelişim ---------- */
route("/a/:aid/maturity", p => {
  const a = getA(p.aid), ds = devStage(a), mat = ds.mat, gv = ds.gv;
  const hp = measOf(a.id).filter(m => isNum(m.heightCm));
  const vel = []; for (let i = 1; i < hp.length; i++) { const d = daysBetween(hp[i - 1].date, hp[i].date); if (d >= 60) vel.push({l: fmtD(hp[i].date).slice(0, 5) + "." + hp[i].date.slice(2, 4), v: round((hp[i].heightCm - hp[i - 1].heightCm) / d * 365.25, 1), c: (hp[i].heightCm - hp[i - 1].heightCm) / d * 365.25 >= 7.5 ? COL.tgt : COL.cur}); }
  let moBar = "";
  if (mat && isNum(mat.mo)) { const pos = v => clamp((v + 4) / 8 * 100, 0, 100); moBar = `<div style="position:relative;height:38px;margin:14px 0 4px"><div class="bar" style="position:absolute;top:14px;left:0;right:0;height:10px;background:linear-gradient(90deg,#3B82F6 0%,#3B82F6 37.5%,#FBBF24 37.5%,#FBBF24 62.5%,#34D399 62.5%)"></div><div style="position:absolute;top:10px;left:calc(${pos(mat.mo - 0.55)}%);width:${(1.1 / 8 * 100).toFixed(1)}%;height:18px;border:2px solid var(--ink);border-radius:6px"></div><div style="position:absolute;top:0;left:calc(${pos(mat.mo)}% - 6px);font-size:12px">▼</div></div><div class="row between tiny muted"><span>−4 yıl</span><span>PHV</span><span>+4 yıl</span></div>`; }
  return {title: "Biyolojik gelişim", html: `
    ${alertBox("info", "", "Tahmini biyolojik olgunlaşma <b>kesin tıbbi veri değildir</b>. Yetişkin boyu veya gelecekteki performans tahmini yapılmaz.")}
    <div class="card acc"><div class="tiny muted">Gelişim evresi</div><h2 style="margin:2px 0">${ds.stage}/6 · ${esc(ds.n)}</h2><p class="small">${esc(ds.focus)}</p><ul class="small" style="padding-left:18px;margin:6px 0">${ds.reasons.map(r => `<li>${esc(r)}</li>`).join("")}</ul></div>
    <div class="card"><h3>Olgunlaşma ofseti (PHV'ye uzaklık)</h3>
      ${!mat ? `<p class="small muted">Doğum tarihi ve boy ölçümü gerekli.</p>` : mat.missing ? alertBox("warn", "", esc(mat.missing)) : `
      <div class="grid2"><div class="stat"><b>${mat.mo > 0 ? "+" : ""}${fmtN(mat.mo, 2)} yıl</b><span>Tahmini ofset (±0,5)</span></div><div class="stat"><b>${fmtN(mat.aphv, 1)}</b><span>Tahmini PHV yaşı</span></div></div>${moBar}
      <dl class="kv mt"><dt>Durum</dt><dd>${esc(mat.status)}</dd><dt>Zamanlama</dt><dd>${esc(mat.timing)}</dd><dt>Yöntem</dt><dd>${esc(mat.method)}</dd>${isNum(mat.mir) ? `<dt>Mirwald (2002) karşılaştırma</dt><dd>${fmtN(mat.mir, 2)} yıl</dd>` : ""}<dt>Ölçüm tarihi / yaş</dt><dd>${fmtD(mat.date)} · ${fmtN(mat.age, 2)}</dd></dl>
      <ul class="tiny muted" style="padding-left:18px">${mat.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>`}</div>
    <div class="card"><h3>Büyüme hızı</h3>${gv ? gv.insufficient ? `<p class="small muted">${esc(gv.note)}</p>` : `<div class="stat"><b>${fmtN(gv.v, 1)} cm/yıl</b><span>${fmtD(gv.from)} – ${fmtD(gv.to)}</span></div><p class="small">${esc(gv.note)}</p>` : `<p class="small muted">En az iki boy ölçümü gerekli.</p>`}
      ${vel.length ? barChart(vel) + `<p class="tiny muted">Turuncu: ≥7,5 cm/yıl (hızlı büyüme göstergesi).</p>` : ""}</div>
    <div class="card"><h3>Gelişim dönemleri</h3><p class="tiny muted">Dönemler katı yaş sınırlarına bağlı değildir; biyolojik gelişim, teknik yeterlilik ve bireysel özellikler birlikte değerlendirilir (Lloyd & Oliver 2012; NSCA 2016).</p>
      ${STAGES.slice(1).map((s, i) => `<div class="row" style="padding:7px 0;border-bottom:1px solid var(--line)"><span class="pill ${i + 1 === ds.stage ? "acc" : ""}">${i + 1}</span><div class="grow small"><b>${esc(s.n)}</b><div class="muted tiny">${esc(s.focus)}</div></div></div>`).join("")}</div>
    ${role() === "coach" ? `<form class="card" data-form="stageIn" data-aid="${a.id}"><h3>Değerlendirme girdileri</h3><div class="grid2">${field("Antrenman yaşı (yıl)", inp("trainingYears", a.trainingYears, 'inputmode="decimal"'))}${field("Teknik yeterlilik (1–5)", sel("competency", ["1", "2", "3", "4", "5"], String(a.competency || 2)))}</div><button class="btn sm pri" type="submit">Güncelle</button></form>` : ""}
    <a class="btn block" href="#/a/${a.id}/anthro">Ölçüm ekle</a>`};
});
FORM.stageIn = (d, f) => { const a = getA(f.dataset.aid); a.trainingYears = num(d.trainingYears); a.competency = num(d.competency); audit("Gelişim girdileri güncellendi", a.id, ""); save(); toast("Güncellendi"); reRender(); };

/* ---------- İzinler ---------- */
route("/a/:aid/consents", p => {
  const a = getA(p.aid), r = role(), canSet = r === "parent" || (r === "coach" && !DB.members.some(m => m.role === "parent" && (m.admin || (m.athleteIds || []).includes(a.id))));
  const hist = DB.consents.filter(c => c.athleteId === a.id).sort((x, y) => y.at - x.at);
  return {title: "İzinler ve onaylar", html: `${alertBox("info", "", "İzinler KVKK kapsamında kayıt altına alınır. Çocuk verileri reklam, pazarlama veya izinsiz profil oluşturma amacıyla kullanılmaz. İzin geri çekildiğinde ilgili özellik devre dışı kalır.")}
    ${!canSet && r !== "athlete" ? alertBox("warn", "", "İzinleri veli yönetir. Antrenör yalnızca görüntüleyebilir.") : ""}
    <div class="card">${Object.entries(CONSENT_N).map(([k, n]) => { const on = consent(a.id, k); const can = canSet || (r === "athlete" && k === "childAssent"); return `<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="grow small"><b>${n}</b></div>${can ? `<button class="btn sm ${on ? "pri" : ""}" data-act="consent" data-aid="${a.id}" data-k="${k}">${on ? "Verildi ✓" : "Verilmedi"}</button>` : pill(on ? "Verildi" : "Verilmedi", on ? "ok" : "warn")}</div>`; }).join("")}</div>
    <h3>İzin geçmişi</h3><div class="card"><table class="tbl"><tr><th>İzin</th><th>Durum</th><th>Kim / ne zaman</th></tr>${hist.map(c => `<tr><td>${CONSENT_N[c.type] || c.type}</td><td>${c.granted ? pill("verildi", "ok") : pill("yok", "warn")}</td><td class="tiny">${esc(c.by)}<br>${fmtDT(c.at)}</td></tr>`).join("")}</table></div>`};
});
ACT.consent = async el => {
  const aid = el.dataset.aid, k = el.dataset.k, now = consent(aid, k);
  if (now && !await confirmBox(`“${CONSENT_N[k]}” izni geri çekilsin mi? İlgili özellikler devre dışı kalır.`, "Geri çek", true)) return;
  DB.consents.push({athleteId: aid, type: k, granted: !now, by: S.me.name + " (" + ROLE_N[role()] + ")", at: Date.now()});
  audit(`İzin ${now ? "geri çekildi" : "verildi"}: ${CONSENT_N[k]}`, aid, ""); save(); reRender();
};

/* ---------- Hedefler ---------- */
route("/a/:aid/goals", p => {
  const a = getA(p.aid), gs = a.goals || [];
  return {title: "Hedefler", html: `<form class="card" data-form="goal" data-aid="${a.id}"><h3>Yeni hedef</h3>${field("Hedef", inp("text", "", 'required placeholder="ör. 10 m sprintte 2,25 sn altı"'))}
    <div class="grid2">${field("Bağlı test (opsiyonel)", sel("testId", [["", "—"]].concat(TESTS.map(t => [t.id, t.n]))))}${field("Hedef değer", inp("target", "", 'inputmode="decimal"'))}</div>${field("Hedef tarihi", inp("date", addDays(todayISO(), 56), 'type="date"'))}
    <button class="btn pri sm" type="submit">Ekle</button></form>
    ${gs.length ? gs.map(g => `${goalRow(a, g)}<div class="btns" style="margin:-4px 0 12px"><button class="btn sm" data-act="goalDone" data-aid="${a.id}" data-id="${g.id}">${g.done ? "Aktif yap" : "Tamamlandı"}</button><button class="btn sm danger" data-act="goalDel" data-aid="${a.id}" data-id="${g.id}">Sil</button></div>`).join("") : empty("Hedef yok.", "target")}
    <p class="tiny muted">Hedefler başkalarıyla karşılaştırma için değil, sporcunun kendi gelişimini izlemek içindir.</p>`};
});
FORM.goal = (d, f) => {
  const a = getA(f.dataset.aid); a.goals = a.goals || [];
  const g = {id: uid("g_"), text: d.text.trim(), testId: d.testId || null, target: num(d.target), date: d.date, done: false, at: Date.now()};
  if (g.testId) { if (!isNum(g.target)) throw new Error("Bağlı test için hedef değer girin."); const rs = testsOf(a.id, g.testId); if (rs.length) g.base = testValue(rs[rs.length - 1]); }
  a.goals.push(g); notify({key: "goal:" + g.id, athleteId: a.id, type: "goal", title: "Yeni hedef", body: `${a.name}: ${g.text}`, roles: ["athlete", "parent", "coach"]});
  audit("Hedef eklendi", a.id, g.text); save(); reRender();
};
ACT.goalDone = el => { const a = getA(el.dataset.aid), g = a.goals.find(x => x.id === el.dataset.id); g.done = !g.done; if (g.done) notify({key: "goaldone:" + g.id, athleteId: a.id, type: "milestone", title: "Hedef tamamlandı 🎉", body: `${a.name}: ${g.text}`}); save(); reRender(); };
ACT.goalDel = el => { const a = getA(el.dataset.aid); a.goals = a.goals.filter(x => x.id !== el.dataset.id); save(); reRender(); };

/* ---------- Üyeler ---------- */
route("/members", () => {
  if (!S.me.admin) return {title: "Üyeler", html: alertBox("warn", "Yetki yok", "Üyeleri yalnızca çalışma alanı yöneticisi yönetebilir.")};
  return {title: "Üyeler ve erişim", html: `${alertBox("info", "", "Her üye bu cihazda kendi e-posta ve şifresiyle giriş yapar; veri anahtarı her üye için ayrı şifrelenir. Antrenör/veli/sporcu yalnızca bağlandığı sporcuları görür. Cihazlar arası paylaşım için sunucu altyapısı gerekir (henüz yok).")}
    <div class="list">${DB.members.map(m => `<div class="li" style="cursor:default"><div class="avatar sm">${esc(initials(m.name))}</div><div class="grow"><div class="t">${esc(m.name)} ${m.admin ? pill("yönetici", "acc") : ""}</div><div class="s">${ROLE_N[m.role]} · ${esc(m.email)}<br>${m.admin && m.role !== "athlete" ? "Tüm sporcular" : (m.athleteIds || []).map(id => getA(id) ? esc(getA(id).name) : "").filter(Boolean).join(", ") || "Bağlı sporcu yok"}</div></div>${m.id !== S.me.id ? `<button class="btn sm" data-act="memberEdit" data-id="${m.id}">Düzenle</button>` : ""}</div>`).join("")}</div>
    <form class="card mt" data-form="member"><h3>Üye ekle</h3>${field("Ad soyad", inp("name", "", "required"))}${field("E-posta", inp("email", "", 'type="email" required'))}
      ${field("Rol", sel("role", [["coach", "Antrenör"], ["parent", "Veli"], ["athlete", "Sporcu"]], "parent"))}
      ${field("Geçici şifre", inp("password", "", 'type="password" minlength="8" required autocomplete="new-password"'), "Üyeye güvenli bir kanaldan iletin; ilk girişte Ayarlar'dan değiştirebilir.")}
      ${field("Erişebileceği sporcular", `<div class="chips">${DB.athletes.map(a => `<label class="chip" data-toggle><input type="checkbox" name="athleteIds" data-multi="1" value="${a.id}">${esc(a.name)}</label>`).join("") || '<span class="small muted">Önce sporcu oluşturun</span>'}</div>`)}
      <button class="btn pri block" type="submit">Üyeyi ekle</button></form>`};
});
FORM.member = async d => {
  if (d.password.length < 8) throw new Error("Şifre en az 8 karakter olmalı.");
  if (d.role === "athlete" && (d.athleteIds || []).length !== 1) throw new Error("Sporcu hesabı tam olarak bir sporcu profiline bağlanmalı.");
  const m = {id: uid("m_"), name: d.name.trim(), email: d.email.toLowerCase().trim(), role: d.role, admin: false, athleteIds: d.athleteIds || [], createdAt: Date.now()};
  await addMemberLogin(m, d.password); DB.members.push(m); audit("Üye eklendi", null, `${m.name} (${ROLE_N[m.role]})`); save(); toast("Üye eklendi"); reRender();
};
ACT.memberEdit = el => {
  const m = DB.members.find(x => x.id === el.dataset.id);
  sheet(`<h2>${esc(m.name)}</h2><form data-form="memberUpd" data-id="${m.id}">${field("Erişebileceği sporcular", `<div class="chips">${DB.athletes.map(a => `<label class="chip ${(m.athleteIds || []).includes(a.id) ? "on" : ""}" data-toggle><input type="checkbox" name="athleteIds" data-multi="1" value="${a.id}" ${(m.athleteIds || []).includes(a.id) ? "checked" : ""}>${esc(a.name)}</label>`).join("")}</div>`)}
    <div class="btns"><button class="btn pri" type="submit">Kaydet</button></div></form><button class="btn danger block mt" data-act="memberDel" data-id="${m.id}">Üyeyi kaldır (giriş yetkisini sil)</button>`);
};
FORM.memberUpd = (d, f) => { const m = DB.members.find(x => x.id === f.dataset.id); m.athleteIds = d.athleteIds || []; audit("Üye erişimi güncellendi", null, m.name); save(); closeSheet(); reRender(); };
ACT.memberDel = async el => { const m = DB.members.find(x => x.id === el.dataset.id); closeSheet(); if (!await confirmBox(`${m.name} kaldırılsın mı?`, "Kaldır", true)) return; removeMemberLogin(m.id); DB.members = DB.members.filter(x => x !== m); audit("Üye kaldırıldı", null, m.name); save(); reRender(); };
