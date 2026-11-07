/* =========================================================================
   DEMO (deneme modu) VE BAŞLATMA
   Demo hesapları gerçek akışla oluşturulur: antrenör kod üretir, öğrenci kodla katılıp
   kendi bilgisini girer, veli öğrencinin kodunu kullanır, antrenör ölçüm/test/program girer.
   ========================================================================= */
const DEMO_PW = "demo1234";
ACT.demo = async el => {
  el.disabled = true; el.textContent = "Hazırlanıyor…";
  try {
    const exists = LocalAPI._raw().users.some(u => u.email === toEmail("antrenor"));
    if (!exists) await seedDemo();
    await API.signIn(toEmail("antrenor"), DEMO_PW); await afterAuth();
    go("#/c"); await new Promise(r => setTimeout(r, 150));
    sheet(`<h2>Örnek hesaplar hazır</h2><p class="small">Aynı telefonda üç rolü deneyebilirsiniz (Ayarlar → Çıkış yap → başka hesapla giriş):</p><table class="tbl"><tr><th>Rol</th><th>Kullanıcı adı</th><th>Şifre</th></tr><tr><td>Antrenör</td><td><b>antrenor</b></td><td>${DEMO_PW}</td></tr><tr><td>Öğrenci</td><td><b>deniz</b></td><td>${DEMO_PW}</td></tr><tr><td>Veli</td><td><b>veli</b></td><td>${DEMO_PW}</td></tr></table><p class="tiny muted">“Mert Can” için oluşturulmuş bir kod da henüz kullanılmamış olarak duruyor; Öğrenciyim → kod ile katılmayı deneyebilirsiniz.</p><button class="btn pri block" data-act="closeSheet">Başla (antrenör olarak)</button>`);
  } catch (e) { console.error(e); el.disabled = false; el.textContent = "Örnek verilerle dene"; toast("Demo oluşturulamadı: " + e.message, 4000); }
};
async function seedDemo() {
  const T = todayISO(), start = addDays(mondayOf(T), -77);
  await API.signUp(toEmail("antrenor"), DEMO_PW); await API.setProfile("coach", "Demo Antrenör");
  const inv1 = await API.createInvite("Deniz Yılmaz"), inv2 = await API.createInvite("Ece Kaya"); await API.createInvite("Mert Can");
  await API.signOut();
  // Öğrenci 1 — kendi bilgisini kendisi girer
  await API.signUp(toEmail("deniz"), DEMO_PW); await API.setProfile("athlete", "Deniz Yılmaz"); await API.redeemInvite(inv1.code);
  await API.saveInfo(inv1.athlete_id, {name: "Deniz Yılmaz", birthDate: addDays(T, -Math.round(13.48 * 365.25)), sex: "E", dominantHand: "sağ", dominantFoot: "sağ", school: "Demo Ortaokulu", club: "Demo Akademi U14", sportsHistory: "Basketbol 2 yıl, yüzme 1 yıl", trainingYears: 2, wishSport: "basketball", weeklySessions: 2, teamSessionMin: 90, teamDays: [2, 4], sleepHours: 8.5, activityLevel: "4", personalGoals: "Daha hızlı ilk adım ve daha yükseğe sıçramak", interests: {basketball: 5, volleyball: 4, athletics: 3}, consentAt: Date.now(),
    health: [{id: uid("h_"), cat: "asthma", title: "Egzersize bağlı astım", desc: "İnhaler kullanıyorum, kontrol altında.", date: addDays(start, -400), status: "takipte", requiresClearance: true, clearanceGiven: true, tags: []}, {id: uid("h_"), cat: "injury", title: "Sağ ayak bileği burkulması", desc: "İyileşti.", date: addDays(start, -520), status: "geçmiş", requiresClearance: false, tags: []}]});
  const pcode = await API.createParentCode(inv1.athlete_id);
  await API.signOut();
  await API.signUp(toEmail("ece"), DEMO_PW); await API.setProfile("athlete", "Ece Kaya"); await API.redeemInvite(inv2.code);
  await API.saveInfo(inv2.athlete_id, {name: "Ece Kaya", birthDate: addDays(T, -Math.round(12.2 * 365.25)), sex: "K", dominantHand: "sağ", dominantFoot: "sol", sportsHistory: "Voleybol 1 yıl", trainingYears: 1, wishSport: "volleyball", weeklySessions: 2, teamSessionMin: 75, teamDays: [1, 3], sleepHours: 9, activityLevel: "3", personalGoals: "Smaç vurmak", healthNone: true, health: []});
  await API.signOut();
  await API.signUp(toEmail("veli"), DEMO_PW); await API.setProfile("parent", "Demo Veli"); await API.redeemParentCode(pcode);
  await API.signOut();
  // Antrenör ölçüm, test, program girer
  await API.signIn(toEmail("antrenor"), DEMO_PW); ST.user = API.user(); ST.profile = await API.profile(); await loadAll();
  const a = getA(inv1.athlete_id), b = getA(inv2.athlete_id);
  Object.assign(a, {primarySport: "basketball", position: "sf", level: "Başlangıç-orta", competency: 3});
  Object.assign(b, {primarySport: "volleyball", level: "Başlangıç", competency: 2});
  a.season = {phases: [{id: uid("sp_"), type: "pre", start, end: addDays(start, 41)}, {id: uid("sp_"), type: "in", start: addDays(start, 42), end: addDays(start, 230)}], comps: [{id: uid("cp_"), name: "Okul ligi maçı", date: addDays(T, 4), imp: "orta"}, {id: uid("cp_"), name: "Bölge turnuvası", date: addDays(T, 15), imp: "yüksek"}]};
  [[-290, 158.0, 47.0, 81.5, null], [-110, 161.5, 49.5, 83.2, null], [-5, 165.0, 52.0, 85.3, 168]].forEach(([d, h, w, sh, as]) => DB.measurements.push({id: uid("ms_"), athleteId: a.id, date: addDays(start, d), heightCm: h, weightKg: w, sittingHeightCm: sh, armSpanCm: as}));
  DB.measurements.push({id: uid("ms_"), athleteId: b.id, date: addDays(T, -20), heightCm: 154, weightKg: 42, sittingHeightCm: 79, armSpanCm: 156});
  const R = (aid, tid, d, v, l, r) => DB.tests.push(Object.assign({id: uid("t_"), athleteId: aid, testId: tid, date: d, cond: "Kapalı salon, fotosel", by: "Demo Antrenör", at: parseISO(d).getTime()}, l != null ? {left: l, right: r} : {value: v}));
  const d0 = addDays(start, -4), d4 = addDays(start, 21), d8 = addDays(start, 49), d12 = mondayOf(T), dS = addDays(start, -150);
  [["sp10", 2.46], ["sbj", 166], ["cmj", 28.5]].forEach(([t, v]) => R(a.id, t, dS, v));
  [["sp5", 1.35], ["sp10", 2.40], ["sp20", 4.05], ["cmj", 30.0], ["sbj", 172], ["ttest", 12.4], ["sitreach", -3], ["walltoss", 22], ["react", 330], ["ktk", 48], ["pushup", 12], ["plank", 55]].forEach(([t, v]) => R(a.id, t, d0, v));
  R(a.id, "grip", d0, null, 21, 24); R(a.id, "t505", d0, null, 2.95, 2.85); R(a.id, "sls", d0, null, 10, 14); R(a.id, "ybal", d0, null, 86, 90); R(a.id, "ankle", d0, null, 9, 11);
  R(a.id, "sp10", d4, 2.32); R(a.id, "cmj", d4, 31); R(a.id, "sls", d4, null, 12, 15);
  R(a.id, "sp10", d8, 2.25); R(a.id, "cmj", d8, 32.5); R(a.id, "react", d8, 318);
  [["sp5", 1.31], ["sp10", 2.21], ["sp20", 3.95], ["cmj", 33.5], ["sbj", 180], ["ttest", 12.0], ["sitreach", -1], ["walltoss", 25], ["react", 312], ["ktk", 53], ["pushup", 15], ["plank", 70]].forEach(([t, v]) => R(a.id, t, d12, v));
  R(a.id, "grip", d12, null, 23, 26); R(a.id, "t505", d12, null, 2.84, 2.76); R(a.id, "sls", d12, null, 15, 18); R(a.id, "ybal", d12, null, 90, 93); R(a.id, "ankle", d12, null, 10, 11);
  [["sbj", 140], ["cmj", 24], ["sp10", 2.30], ["walltoss", 21], ["sitreach", 8]].forEach(([t, v]) => R(b.id, t, addDays(T, -19), v)); R(b.id, "sls", addDays(T, -19), null, 14, 12);
  a.goals = [{id: uid("g_"), text: "10 m sprint 2,25 sn altı", testId: "sp10", target: 2.25, base: 2.40, date: addDays(start, 84), done: true}, {id: uid("g_"), text: "Dikey sıçrama 35 cm", testId: "cmj", target: 35, base: 30, date: addDays(T, 60), done: false}, {id: uid("g_"), text: "Tek ayak denge 18 sn", testId: "sls", target: 18, base: 12, date: addDays(T, 45), done: false}];
  const gen = generateProgram(a, {sport: "basketball", pos: "sf", weeks: 12, spw: 3, minutes: 60, env: "club", eq: ENVS.club.eq, space: true, startDate: start, testInterval: 4, includeExtra: true, seasonAware: true, type: "main"});
  if (!gen.ok) throw new Error(gen.hold.join(" "));
  gen.program.createdAt = parseISO(start).getTime() - 864e5 * 3; DB.programs.push(Object.assign(gen.program, {athleteId: a.id}));
  DB.comments.push({id: uid("c_"), athleteId: a.id, at: Date.now() - 864e5 * 3, by: "Demo Antrenör", byName: "Demo Antrenör", text: "12. hafta testlerinde 10 m sprint 2,40 → 2,21 sn. Harika bir dönem! Turnuva öncesi yüklenmeyi azaltacağız.", vis: ["athlete", "parent"]});
  DB.videos.push({id: uid("v_"), athleteId: a.id, src: "coach", type: "jump", typeName: VTYPES.jump.n, exId: "v1", view: "front", viewName: "önden", reliability: "İyi", frames: 90, detected: 96, duration: 3, fps: 30, at: Date.now() - 864e5 * 60, score: 73, level: "İyi", summary: "İyi. İnişte darbe dizler ve kalçayla emiliyor. Öncelikli düzeltme: inişte dizler hafif içe kaçıyor.", metrics: [{n: "Tahmini sıçrama yüksekliği", v: 29, u: "cm (±4)"}, {n: "İnişte diz/ayak bileği aralık oranı", v: 0.82, u: "", ok: false}], positives: ["İnişte darbe dizler ve kalçayla emiliyor."], fixes: [{t: "İnişte dizler hafif içe kaçıyor.", cue: "İnişte dizleri ayak hizasında tut."}], drills: ["v1", "a2"], notes: [], flags: ["landing"], by: "Demo Antrenör"});
  await API.saveCoach(a.id, docCoach(a.id)); await API.saveCoach(b.id, docCoach(b.id));
  await API.saveCoachDoc({groups: [{id: uid("gr_"), name: "U14 Karma Grup", athleteIds: [a.id, b.id, DB.athletes.find(x => !x.linked).id], sessions: []}], prefs: {avoid: {}, prefer: {}}});
  await API.signOut();
  // Öğrenci antrenman kayıtlarını kendisi girer
  await API.signIn(toEmail("deniz"), DEMO_PW); ST.user = API.user(); ST.profile = await API.profile(); await loadAll();
  const me0 = DB.athletes[0], pr = DB.programs.find(p => p.athleteId === me0.id), rng = seeded("demo"); let k = 0;
  for (const wk of pr.weeksData) for (const s of wk.sessions) {
    if (s.date >= T) continue; k++; if (k % 9 === 0) continue;
    const pain = wk.w === 6 && s.d === 1 ? 2 : 0, rd = pain ? "Normal" : ["Çok iyi", "İyi", "İyi", "Normal", "Normal", "Yorgun"][Math.floor(rng() * 6)];
    const log = {id: uid("l_"), key: logKey(pr.id, wk.w, s.d), athleteId: me0.id, programId: pr.id, w: wk.w, d: s.d, date: s.date, readiness: rd, sleep: round(8 + rng() * 1.5, 1), painLevel: pain, painArea: pain ? "sağ diz önü" : "", startedAt: parseISO(s.date).getTime() + 17 * 36e5, done: {}, mod: pain ? "ağrı" : rd === "Yorgun" ? "yorgun" : "normal"};
    adaptedItems(s, log).forEach(x => { if (!x.skip) log.done[x.key] = x.sets; });
    Object.assign(log, {duration: s.estMin + Math.round(rng() * 8 - 4), rpe: clamp(Math.round(5 + rng() * 2.4), 3, 8), fatigue: 3, completion: 100, status: "tamamlandı"}); log.load = log.rpe * log.duration; log.endedAt = log.startedAt + log.duration * 6e4;
    DB.logs.push(log);
  }
  for (let d = addDays(start, -28); d < T; d = addDays(d, 1)) { const dow = parseISO(d).getDay(); if (dow === 2 || dow === 4) DB.extLoads.push({id: uid("x_"), athleteId: me0.id, src: "athlete", type: "Takım antrenmanı", date: d, duration: 90, rpe: 6, load: 540}); }
  DB.videos.push({id: uid("v_"), athleteId: me0.id, src: "athlete", type: "squat", typeName: VTYPES.squat.n, exId: "st1", view: "side", viewName: "yandan", reliability: "İyi", frames: 120, detected: 94, duration: 8, fps: 15, at: Date.now() - 864e5 * 2, score: 82, level: "İyi", summary: "İyi. Derinlik çok iyi (dizler ~94°). Öncelikli düzeltme: iniş çok hızlı.", metrics: [{n: "Tekrar sayısı", v: 5, u: ""}, {n: "Ortalama derinlik (diz açısı)", v: 94, u: "°", ok: true}, {n: "Gövde eğimi (en alt)", v: 38, u: "°", ok: true}, {n: "İniş süresi", v: 0.5, u: "sn", ok: false}], positives: ["Derinlik çok iyi (dizler ~94°).", "Gövde açısı kontrollü."], fixes: [{t: "İniş çok hızlı.", cue: "Aşağı inerken 2'ye kadar say, kontrollü in."}], drills: ["st1"], notes: [], flags: [], by: "Deniz Yılmaz"});
  await API.saveLogs(me0.id, docLogs(me0.id));
  await API.signOut(); ST.user = ST.profile = null;
}

/* ---------------- Başlatma ---------------- */
async function boot() {
  applyPrefs();
  if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(() => {});
  try { ST.user = await API.restore(); if (ST.user) { ST.profile = await API.profile(); if (ST.profile) await loadAll(); } }
  catch (e) { console.warn(e); toast(e.message, 4000); }
  window.addEventListener("hashchange", render);
  render();
  setTimeout(() => { const sp = $("#splash"); if (sp) { sp.classList.add("hide"); setTimeout(() => sp.remove(), 500); } }, 700);
}
document.addEventListener("visibilitychange", async () => {
  if (document.hidden) { flush(); return; }
  if (ST.user && ST.profile && !Object.keys(ST.pending).length && Date.now() - (ST.loadedAt || 0) > 60000 && !document.querySelector(".sheetbg") && !(VA && VA.url)) {
    try { await loadAll(); reRender(); } catch (e) {}
  }
});
window.addEventListener("pagehide", () => flush());
boot();
