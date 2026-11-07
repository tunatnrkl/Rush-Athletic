/* =========================================================================
   ORTAK BİLEŞENLER — üç rolün kullandığı görünümler
   ========================================================================= */
const READY = [["Çok iyi", "😄"], ["İyi", "🙂"], ["Normal", "😐"], ["Yorgun", "😮‍💨"], ["Çok yorgun", "😫"]];
const RPE_D = ["Dinlenme", "Çok çok hafif", "Çok hafif", "Hafif", "Orta", "Biraz zor", "Zor", "Zor+", "Çok zor", "Çok çok zor", "Maksimal"];
const ageTxt = a => isNum(ageAt(a.birthDate)) ? Math.floor(ageAt(a.birthDate)) + " yaş" : "";
const sportTxt = a => { const sp = sportById(a.primarySport); if (!sp) return "Branş seçilmedi"; const p = sp.pos.find(x => x.id === a.position); return sp.n + (p ? " · " + p.n : ""); };
function exDose(it) {
  const p = [it.s + " set"];
  if (it.r) p.push(it.r + (it.d ? " × " + it.d + " m" : " tekrar") + (it.ps ? "/taraf" : "")); else if (it.d) p.push(it.d + " m");
  if (it.t) p.push(it.t >= 120 ? Math.round(it.t / 60) + " dk" : it.t + " sn" + (it.ps ? "/taraf" : ""));
  if (it.rest) p.push("dinlenme " + (it.rest >= 60 ? (it.rest / 60).toFixed(it.rest % 60 ? 1 : 0).replace(".", ",") + " dk" : it.rest + " sn"));
  return p.join(" · ");
}
function athleteHead(a, right = "") {
  return `<div class="card acc"><div class="row"><div class="avatar">${esc(initials(a.name))}</div><div class="grow"><h2 style="margin:0">${esc(a.name)}</h2><div class="small muted">${[ageTxt(a), sportTxt(a)].filter(Boolean).join(" · ")}</div>${a.coachName && role() !== "coach" ? `<div class="tiny muted">Antrenör: ${esc(a.coachName)}</div>` : ""}</div>${right}</div></div>`;
}
/* Dikkat gerektiren durumlar (antrenör ana sayfası ve öğrenci özeti) */
function alertsFor(a) {
  const out = [], A = "#/c/a/" + a.id, t = todayISO();
  if (!a.linked) out.push({lv: "info", t: "Kod henüz kullanılmadı", s: "Kodu öğrenciyle paylaşın: " + (a.inviteCode || ""), href: "#/c/code/" + a.id});
  else if (!a.infoDone) out.push({lv: "info", t: "Öğrenci bilgilerini henüz doldurmadı", s: "Öğrenci giriş yaptığında kendi bilgilerini girer.", href: A});
  holds(a.id).forEach(h => out.push({lv: "bad", t: "Program/antrenman beklemede", s: h, href: A + "?t=ozet"}));
  DB.logs.filter(l => l.athleteId === a.id && l.painLevel > 0 && daysBetween(l.date, t) <= 7 && !DB.painReviewed[l.id] && l.painLevel < 4).forEach(l => out.push({lv: "warn", t: `Ağrı bildirdi (${l.painLevel}/10)`, s: `${fmtD(l.date)} · ${l.painArea || "bölge belirtilmedi"}`, href: A + "?t=takip"}));
  DB.logs.filter(l => l.athleteId === a.id && l.date === t && l.readiness === "Çok yorgun").forEach(() => out.push({lv: "warn", t: "Bugün çok yorgun olduğunu bildirdi", s: "Seans hafifletildi.", href: A + "?t=takip"}));
  { const p2 = activeProgram(a.id); if (p2) { const left = daysBetween(t, addDays(p2.startDate, p2.weeks * 7 - 1)); if (left >= 0 && left <= 7) out.push({lv: "warn", t: `Program ${left === 0 ? "bugün" : left + " gün içinde"} bitiyor`, s: "Yeni program veya yeniden test planlayın.", href: A + "?t=program"}); } }
  if (a.linked && a.infoDone && !activeProgram(a.id)) out.push({lv: "info", t: "Aktif program yok", s: "Program oluşturun.", href: A + "?t=program"});
  const p = activeProgram(a.id); if (p) { const cw = currentWeek(p), wk = p.weeksData.find(w => w.w === cw); if (wk && p.testWeeks.includes(cw) && !testsOf(a.id).some(r => r.date >= wk.start)) out.push({lv: "info", t: `Test haftası (hafta ${cw})`, s: "Ölçüm sekmesinden test sonuçlarını girin.", href: A + "?t=olcum"}); }
  if (DB.logs.some(l => l.athleteId === a.id)) loadSummary(a).flags.filter(f => f.lv !== "info").slice(0, 2).forEach(f => out.push({lv: f.lv, t: "Yük / toparlanma", s: f.t, href: A + "?t=takip"}));
  return out;
}
const alertItem = x => `<a class="li" href="${x.href}" style="border-color:${x.lv === "bad" ? "var(--bad)" : x.lv === "warn" ? "rgba(251,191,36,.5)" : "var(--line)"}"><div class="ic" style="${x.lv === "bad" ? "background:var(--badBg);color:var(--bad)" : x.lv === "warn" ? "background:var(--warnBg);color:var(--warn)" : ""}">${x.lv === "bad" ? "!" : x.lv === "warn" ? "⚠︎" : "i"}</div><div class="grow"><div class="t">${esc(x.t)}</div><div class="s">${esc(x.s)}</div></div><span class="chev">${ic("chev")}</span></a>`;

/* Radar + puanlar */
function radarBlock(a, opt = {}) {
  const cur = qualityScores(a), prev = qualityScores(a, "previous"), tgt = targetScores(a, cur);
  const val = o => Object.fromEntries(QUALITIES.map(q => [q.k, o[q.k].score]));
  const has = QUALITIES.some(q => cur[q.k].hasData);
  if (!has) return `<div class="card"><h3>Atletik profil</h3>${empty(role() === "coach" ? "Henüz test sonucu yok. Ölçüm sekmesinden test girin." : "Antrenörün test yaptıkça atletik profilin burada oluşacak.", "radar")}</div>`;
  const series = [{name: "Şimdi", color: COL.cur, values: val(cur), fill: .18}];
  if (!opt.simple) series.push({name: "Önceki", color: COL.prev, values: val(prev), dash: "5 4", dot: 2.5}, {name: "Hedef", color: COL.tgt, values: tgt, dash: "2 4", dot: 2});
  const missing = QUALITIES.filter(q => !cur[q.k].hasData).map(q => q.n);
  return `<div class="card"><h3>Atletik profil</h3>${radarSVG(QUALITIES, series)}${opt.simple ? legend([[COL.cur, "Şu anki seviyen"]]) : legend([[COL.cur, "Şimdi"], [COL.prev, "Önceki"], [COL.tgt, "Hedef"]])}
    ${missing.length ? `<p class="tiny muted">Henüz ölçülmedi: ${missing.join(", ")}</p>` : ""}<p class="tiny muted">50 ≈ yaşıtlarının ortalaması (yaklaşık referans).</p></div>`;
}
/* Test gelişim listesi (basit dil) */
function improvementList(a, max = 99) {
  const rows = TESTS.map(t => { const rs = testsOf(a.id, t.id); if (!rs.length) return null; const l = rs[rs.length - 1], c = rs.length > 1 ? compareResults(t, rs[0], l) : null; return {t, l, c}; }).filter(Boolean);
  if (!rows.length) return `<p class="small muted">Henüz test sonucu yok.</p>`;
  return `<div class="list">${rows.slice(0, max).map(({t, l, c}) => `<div class="li" style="cursor:default"><div class="ic" style="${c && c.cls === "ok" ? "background:var(--okBg);color:var(--ok)" : ""}">${c ? (c.cls === "ok" ? "▲" : c.cls === "bad" ? "▼" : "•") : "•"}</div><div class="grow"><div class="t">${esc(t.n)}</div><div class="s">${c ? `${fmtN(c.v1, t.dec)} → <b>${fmtN(c.v2, t.dec)}</b> ${t.u}${c.pct != null ? ` (${c.pct >= 0 ? "▲ " : "▼ "}${fmtN(Math.abs(c.pct), 1)}%)` : ""}` : `${fmtN(testValue(l), t.dec)} ${t.u}`} · ${fmtD(l.date)}</div></div>${c ? pill(c.cls === "ok" ? "gelişti" : c.cls === "bad" ? "geriledi" : c.ratio < 1 ? "değişim yok" : "olası", c.cls === "ok" ? "ok" : c.cls === "bad" ? "bad" : "") : ""}</div>`).join("")}</div>`;
}
function goalRow(a, g) {
  const t = g.testId ? TEST[g.testId] : null; let prog = null, cur = null;
  if (t) { const rs = testsOf(a.id, t.id); if (rs.length) { cur = testValue(rs[rs.length - 1]); const base = isNum(g.base) ? g.base : testValue(rs[0]); const span = g.target - base; prog = span ? clamp((cur - base) / span * 100, 0, 100) : (cur === g.target ? 100 : 0); } }
  return `<div class="card flat" style="padding:11px"><div class="row between"><div class="grow"><b>${esc(g.text)}</b><div class="tiny muted">${t && isNum(cur) ? `Şu an ${fmtN(cur, t.dec)} ${t.u} → hedef ${fmtN(g.target, t.dec)} ${t.u}` : ""}${g.date ? " · " + fmtD(g.date) : ""}</div></div>${g.done ? pill("✓ tamamlandı", "ok") : ""}</div>${prog != null && !g.done ? `<div class="bar mt"><i style="width:${prog}%"></i></div>` : ""}</div>`;
}
/* Haftalık takvim (öğrenci + veli, salt okunur) */
function weekCalendar(a, off, hrefBase, canOpen) {
  const ws = addDays(mondayOf(todayISO()), off * 7), we = addDays(ws, 6), t = todayISO();
  const pl = plannedSessions(a.id, ws, we), comps = compsBetween(a, ws, we), team = (a.teamDays || []).map(Number);
  const days = Array.from({length: 7}, (_, i) => addDays(ws, i));
  return `<div class="row between"><a class="btn sm" href="${hrefBase}?o=${off - 1}">‹</a><b class="small">${fmtD(ws)} – ${fmtD(we)}</b><a class="btn sm" href="${hrefBase}?o=${off + 1}">›</a></div>
    <div class="week mt">${days.map(d => { const dow = parseISO(d).getDay(), ss = pl.filter(x => x.s.date === d); return `<div class="day ${d === t ? "today" : ""}"><span class="muted">${DOW[dow]}</span><b>${parseISO(d).getDate()}</b>${ss.map(x => { const l = logOf(x.p.id, x.wk.w, x.s.d); return `<span class="ev ${l && l.status === "tamamlandı" ? "d" : "s"}">${l && l.status === "tamamlandı" ? "✓" : "Antr."}</span>`; }).join("")}${team.includes(dow) ? '<span class="ev t">Takım</span>' : ""}${comps.filter(c => c.date === d).map(() => '<span class="ev c">Maç</span>').join("")}</div>`; }).join("")}</div>
    <h3>Bu haftanın antrenmanları</h3>${pl.length ? `<div class="list">${pl.map(x => { const l = logOf(x.p.id, x.wk.w, x.s.d); const st = l ? pill(l.status, l.status === "tamamlandı" ? "ok" : "warn") : x.s.date < t ? pill("yapılmadı", "bad") : x.s.date === t ? pill("bugün", "acc") : ""; return canOpen ? li(`#/s/session/${x.p.id}/${x.wk.w}/${x.s.d}`, "bolt", `${DOWL[x.s.dow]} — ${esc(x.s.title)}`, `≈${x.s.estMin} dk`, st) : `<div class="li" style="cursor:default"><div class="ic">${ic("bolt")}</div><div class="grow"><div class="t">${DOWL[x.s.dow]} — ${esc(x.s.title)}</div><div class="s">≈${x.s.estMin} dk${l && isNum(l.rpe) ? ` · zorluk ${l.rpe}/10` : ""}</div></div>${st}</div>`; }).join("")}</div>` : `<p class="small muted">Bu hafta planlı antrenman yok.</p>`}`;
}
function videoCard(v, href) {
  return `<a class="li" href="${href}">${v.thumb ? `<img src="${v.thumb}" alt="" style="width:54px;height:54px;object-fit:cover;border-radius:10px;flex:0 0 54px">` : `<div class="ic">${ic("camera")}</div>`}<div class="grow"><div class="t">${esc(v.exId && exById(v.exId) ? exById(v.exId).n : v.typeName)}</div><div class="s">${fmtD(isoOf(new Date(v.at)))} · ${v.src === "coach" ? "antrenör çekti" : "öğrenci çekti"}${v.score != null ? "" : " · analiz edilemedi"}</div></div>${v.score != null ? pill(v.score + " · " + v.level, v.score >= 85 ? "ok" : v.score >= 70 ? "acc" : "warn") : ""}<span class="chev">${ic("chev")}</span></a>`;
}

/* ---------------- Bildirimler (veriden hesaplanır) ---------------- */
function computeNotifs() {
  const out = [], t = todayISO(), r = role();
  for (const a of DB.athletes) {
    if (r === "coach") { alertsFor(a).filter(x => x.lv !== "info" || /Test haftası/.test(x.t)).forEach(x => out.push({at: Date.now(), t: a.name + ": " + x.t, s: x.s, href: x.href}));
      DB.videos.filter(v => v.athleteId === a.id && v.src === "athlete").forEach(v => out.push({at: v.at, t: `${a.name} hareket videosu analiz etti`, s: `${v.typeName}: ${v.score ?? "—"} puan`, href: `#/video/${a.id}/${v.id}`})); }
    if (r === "athlete" || r === "parent") {
      const pre = r === "parent" ? a.name + ": " : "";
      plannedSessions(a.id, t, t).forEach(x => { if (!logOf(x.p.id, x.wk.w, x.s.d)) out.push({at: Date.now(), t: pre + "Bugün antrenman var 💪", s: x.s.title, href: r === "athlete" ? `#/s/session/${x.p.id}/${x.wk.w}/${x.s.d}` : "#/p/calendar"}); });
      DB.comments.filter(c => c.athleteId === a.id && (c.vis || []).includes(r)).forEach(c => out.push({at: c.at, t: pre + "Antrenör notu", s: c.text, href: r === "athlete" ? "#/s" : "#/p"}));
      programsOf(a.id).filter(p => p.status === "onaylı").forEach(p => out.push({at: p.createdAt, t: pre + "Yeni program hazır", s: `${p.weeks} haftalık program ${fmtD(p.startDate)} tarihinde başlıyor`, href: r === "athlete" ? "#/s/program" : "#/p/calendar"}));
      testsOf(a.id).slice(-6).forEach(x => out.push({at: x.at || parseISO(x.date).getTime(), t: pre + "Yeni test sonucu", s: `${TEST[x.testId] ? TEST[x.testId].n : x.testId}: ${fmtN(testValue(x), TEST[x.testId] ? TEST[x.testId].dec : 1)} ${TEST[x.testId] ? TEST[x.testId].u : ""}`, href: r === "athlete" ? "#/s/progress" : "#/p/progress"}));
    }
  }
  return out.sort((x, y) => y.at - x.at).slice(0, 60);
}
const seenKey = () => "rush2.seen." + myId();
function notifCount() { const seen = lsGet(seenKey()) || 0; return computeNotifs().filter(n => n.at > seen).length; }
route("/notifs", () => {
  const ns = computeNotifs(), seen = lsGet(seenKey()) || 0;
  afterRender.push(() => lsSet(seenKey(), Date.now()));
  return {title: "Bildirimler", html: ns.length ? `<div class="list">${ns.map(n => `<a class="li" href="${n.href}"><div class="ic">${ic("bell")}</div><div class="grow"><div class="t" style="${n.at > seen ? "color:var(--acc)" : ""}">${esc(n.t)}</div><div class="s">${esc(n.s)}</div></div></a>`).join("")}</div>` : empty("Yeni bildirim yok.", "bell")};
});

/* ---------------- Egzersiz detayı / kütüphane ---------------- */
route("/ex/:id", p => {
  const e = exById(p.id); if (!e) return {title: "Egzersiz", html: empty("Egzersiz bulunamadı")};
  const vid = DB.exVideos[e.id], vt = vtypeOfEx(e.id), alt = exById(e.alt);
  afterRender.push(async () => { if (vid) { const r = await idbGet(vid).catch(() => null); const v = $("#exVid"); if (v && r) v.src = URL.createObjectURL(r); } });
  return {title: e.n, html: `<div class="card acc"><div class="tiny muted">${esc(CATS[e.c])}</div><h2 style="margin:2px 0">${esc(e.n)}</h2><p class="small">${esc(e.p)}</p><div class="chips">${e.q.map(q => pill(QN[q], "acc")).join("")}</div></div>
    ${role() === "athlete" && vt ? `<a class="btn pri block" href="#/video/new?ex=${e.id}">${ic("camera")} Yapay zekâ ile hareketimi kontrol et</a><div class="hr"></div>` : ""}
    ${vid ? `<video id="exVid" controls playsinline style="width:100%;border-radius:14px;background:#000;margin-bottom:12px"></video>` : ""}
    <div class="card"><h3>Nasıl yapılır?</h3><p class="small">${esc(e.tech)}</p><h3>Dikkat et</h3><ul class="small" style="padding-left:18px">${e.cues.map(c => `<li>${esc(c)}</li>`).join("")}</ul><h3>Sık yapılan hata</h3><ul class="small" style="padding-left:18px">${e.mis.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div>
    <div class="grid2"><div class="card flat"><div class="tiny muted">Daha kolay</div><div class="small">${esc(e.easy)}</div></div><div class="card flat"><div class="tiny muted">Daha zor</div><div class="small">${esc(e.hard)}</div></div></div>
    ${role() === "coach" ? `<details class="acc"><summary>Antrenör bilgisi</summary><div>${kv([["Hedef kaslar", e.m], ["Varsayılan doz", exDose(doseFor(e, {stage: 4}, "str", 0, 1))], ["Ekipman", e.eq.length ? e.eq.map(x => x.split("|").map(y => EQUIP[y]).join(" veya ")).join(", ") : "Gerekmez"], ["Hareket türü", e.tg.map(t => RTAGS[t]).join(", ") || "—"], ["En düşük gelişim evresi", e.lv + "/6"], ["Video AI", vt ? VTYPES[vt].n : "—"]])}
      <label class="btn sm mt">${vid ? "Demo videoyu değiştir" : "Bu telefona demo video ekle"}<input type="file" accept="video/*" data-exvid="${e.id}" style="display:none"></label></div></details>` : ""}
    ${alt ? li("#/ex/" + alt.id, "bolt", "Alternatif: " + esc(alt.n), esc(CATS[alt.c])) : ""}
    <a class="btn ghost block mt" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.n + " egzersiz tekniği")}" target="_blank" rel="noopener">YouTube'da örnek ara ↗</a>`};
});
document.addEventListener("change", async e => {
  const el = e.target; if (!el.dataset || !el.dataset.exvid || !el.files[0]) return;
  const f = el.files[0]; if (f.size > 80 * 1048576) { toast("Video 80 MB'tan küçük olmalı"); return; }
  const key = "ex_" + el.dataset.exvid; await idbPut(key, f); DB.exVideos[el.dataset.exvid] = key; saveExVideos(); toast("Demo video bu telefona kaydedildi"); reRender();
});
let LIBF = {q: "", c: ""};
route("/library", () => {
  const list = allExercises().filter(e => (!LIBF.c || e.c === LIBF.c) && (!LIBF.q || (e.n + " " + e.p).toLocaleLowerCase("tr-TR").includes(LIBF.q.toLocaleLowerCase("tr-TR"))));
  afterRender.push(() => { const s = $("#libQ"); if (s) s.oninput = () => { LIBF.q = s.value; clearTimeout(s._t); s._t = setTimeout(() => { reRender(); const n = $("#libQ"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); }; });
  return {title: "Egzersizler", html: `<input class="in" id="libQ" placeholder="Egzersiz ara…" value="${esc(LIBF.q)}" type="search">
    <div class="chips mt" style="margin-bottom:12px"><button class="chip ${!LIBF.c ? "on" : ""}" data-act="libC" data-c="">Tümü</button>${Object.entries(CATS).map(([k, v]) => `<button class="chip ${LIBF.c === k ? "on" : ""}" data-act="libC" data-c="${k}">${v}</button>`).join("")}</div>
    <div class="list">${list.map(e => li("#/ex/" + e.id, vtypeOfEx(e.id) ? "camera" : "bolt", esc(e.n), esc(CATS[e.c]) + (vtypeOfEx(e.id) ? " · Video AI" : ""))).join("")}</div>`};
});
ACT.libC = el => { LIBF.c = el.dataset.c; reRender(); };

/* ---------------- Ayarlar ---------------- */
function applyPrefs() { const p = lsGet("rush2.prefs") || {}; document.documentElement.dataset.theme = p.theme === "light" ? "light" : "dark"; document.documentElement.dataset.text = p.text === "large" ? "large" : "normal"; }
let INSTALL_EVT = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); INSTALL_EVT = e; });
route("/settings", () => {
  const p = lsGet("rush2.prefs") || {}, standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  return {title: "Ayarlar", html: `<div class="card row"><div class="avatar">${esc(initials(myName()))}</div><div class="grow"><b>${esc(myName() || "—")}</b><div class="small muted">${ROLE_N[role()]} · ${esc(showLogin(ST.user.email))}</div></div></div>
    ${role() === "parent" ? `<a class="btn block" href="#/p/add">${ic("plus")} Başka çocuk ekle (veli kodu)</a><div class="hr"></div>` : ""}
    <form class="card" data-form="prefs"><h3>Görünüm</h3><div class="grid2">${field("Tema", sel("theme", [["dark", "Koyu"], ["light", "Açık"]], p.theme || "dark"))}${field("Yazı boyutu", sel("text", [["normal", "Normal"], ["large", "Büyük"]], p.text || "normal"))}</div><button class="btn sm pri" type="submit">Kaydet</button></form>
    <form class="card" data-form="pw"><h3>Şifre değiştir</h3>${field("Yeni şifre", inp("n1", "", 'type="password" minlength="6" required autocomplete="new-password"'))}${field("Yeni şifre (tekrar)", inp("n2", "", 'type="password" minlength="6" required autocomplete="new-password"'))}<button class="btn sm" type="submit">Değiştir</button></form>
    <div class="card"><h3>Telefona yükle</h3>${standalone ? `<p class="small">${pill("Yüklü", "ok")} Uygulama ana ekrandan çalışıyor.</p>` : `<p class="small"><b>iPhone:</b> Safari → Paylaş → Ana Ekrana Ekle<br><b>Android:</b> Chrome → ⋮ → Uygulamayı yükle</p>${INSTALL_EVT ? `<button class="btn pri sm" data-act="install">Şimdi yükle</button>` : ""}`}</div>
    <div class="card"><h3>Gizlilik</h3><p class="small">Veriler yalnızca sporcu gelişimi için kullanılır; reklam veya pazarlama amacıyla kullanılmaz. Antrenör yalnızca kendi öğrencilerini, veli yalnızca kendi çocuğunu görür. Hareket videoları telefondan çıkmaz; yalnızca yapay zekâ analiz sonucu kaydedilir.</p><p class="tiny muted">Çalışma modu: ${esc(API.label)} · Sürüm ${APP_VERSION}</p><a class="small" href="#/science">Bilimsel kaynaklar</a></div>
    <button class="btn danger block" data-act="logout">${ic("lock")} Çıkış yap</button><button class="btn ghost block mt" data-act="delAccount">Hesabımı sil</button>`};
});
FORM.prefs = d => { lsSet("rush2.prefs", {theme: d.theme, text: d.text}); applyPrefs(); toast("Kaydedildi"); reRender(); };
FORM.pw = async d => { if (d.n1 !== d.n2) throw new Error("Şifreler aynı değil."); await API.changePassword(d.n1); toast("Şifre değiştirildi"); reRender(); };
ACT.install = async () => { if (!INSTALL_EVT) return; INSTALL_EVT.prompt(); await INSTALL_EVT.userChoice; INSTALL_EVT = null; reRender(); };
ACT.delAccount = async () => {
  const msg = role() === "coach" ? "Hesabınız ve TÜM öğrencilerinizin verileri kalıcı olarak silinecek." : role() === "athlete" ? "Hesabınız silinecek. Antrenörünüzdeki kayıtlarınız antrenör silene kadar kalır." : "Veli hesabınız silinecek.";
  if (!await confirmBox(msg + " Bu işlem geri alınamaz.", "Hesabı sil", true)) return;
  await API.deleteAccount(); ST.user = ST.profile = null; ST.rows = []; buildDB(); go("#/welcome");
};
route("/science", () => ({title: "Bilimsel kaynaklar", html: `<div class="card">${REFS.map(([t, r]) => `<div style="padding:7px 0;border-bottom:1px solid var(--line)"><b class="small">${esc(t)}</b><div class="small muted">${esc(r)}</div></div>`).join("")}<div style="padding:7px 0"><b class="small">Görsel yapay zekâ</b><div class="small muted">Bazarevsky V ve ark. (2020) BlazePose: On-device real-time body pose tracking (MediaPipe). Uçuş süresiyle sıçrama: Bosco C ve ark. (1983); Balsalobre-Fernández C ve ark. (2015) My Jump geçerliliği.</div></div></div>`}));

/* ---------------- Görsel yapay zekâ ekranı ---------------- */
let VA = null;
route("/video/new", () => {
  const r = role(), aid = r === "athlete" ? (myAthlete() || {}).id : Q("aid"), exId = Q("ex");
  if (!aid || !canView(aid)) return {title: "Video AI", html: alertBox("warn", "", "Önce bir öğrenci seçin.")};
  if (!VA || VA.aid !== aid || VA.exId !== exId) VA = {aid, exId, type: Q("type") || vtypeOfEx(exId) || "squat", file: null, url: null, res: null, busy: false};
  const vt = VTYPES[VA.type], ex = exId ? exById(exId) : null;
  afterRender.push(wireVA);
  return {title: "Yapay zekâ hareket analizi", keepScroll: true, html: `
    <div class="card acc"><div class="row"><div class="ic" style="width:44px;height:44px;border-radius:12px;background:var(--accBg);color:var(--acc);display:flex;align-items:center;justify-content:center">${ic("camera")}</div><div class="grow"><b>${esc(ex ? ex.n : vt.n)}</b><div class="small muted">${esc(getA(aid).name)}</div></div></div>
      <p class="small mt" style="margin-bottom:0">📱 ${esc(vt.tip)}</p></div>
    ${ex ? "" : field("Hareket türü", sel("vt", Object.entries(VTYPES).map(([k, v]) => [k, v.n]), VA.type, 'id="vaType"'))}
    ${VA.res ? "" : `<div class="grid2"><label class="btn pri">${ic("camera")} Kamerayla çek<input type="file" accept="video/*" capture="environment" class="vaFile" style="display:none"></label><label class="btn">${ic("play")} Galeriden seç<input type="file" accept="video/*" class="vaFile" style="display:none"></label></div>`}
    ${VA.url ? `<div class="vwrap mt"><video id="vaVid" src="${VA.url}" playsinline muted preload="auto" ${VA.res ? "controls" : ""}></video></div>` : ""}
    ${VA.url && !VA.res ? `<button class="btn blue block mt" data-act="vaRun" ${VA.busy ? "disabled" : ""}>${VA.busy ? "Analiz ediliyor…" : "Yapay zekâ ile analiz et"}</button><div id="vaProg" class="mt"></div>` : ""}
    ${VA.res ? aiResult(VA.res, VA.aid) + `<div class="btns"><button class="btn" data-act="vaAgain">Yeni video</button>${VA.res.score != null ? `<button class="btn pri" data-act="vaSave">Sonucu kaydet</button>` : `<button class="btn pri" data-act="vaAgain">Tekrar çek</button>`}</div>` : ""}
    <p class="tiny muted mt">Video telefonunuzdan çıkmaz. Yapay zekâ (MediaPipe) vücut noktalarını cihazda bulur; yorumlar spor bilimi kurallarına göre üretilir. Teşhis değildir; antrenör değerlendirmesinin yerini tutmaz.</p>`};
});
function wireVA() {
  $$(".vaFile").forEach(f => f.onchange = () => { const file = f.files[0]; if (!file) return; if (file.size > 300 * 1048576) { toast("Video çok büyük (en fazla 300 MB)"); return; } if (VA.url) URL.revokeObjectURL(VA.url); VA.file = file; VA.url = URL.createObjectURL(file); VA.res = null; reRender(); });
  const t = $("#vaType"); if (t) t.onchange = () => { VA.type = t.value; VA.res = null; reRender(); };
}
ACT.vaRun = async () => {
  const v = $("#vaVid"); if (!v) return; VA.busy = true;
  const b = $("[data-act=vaRun]"); if (b) { b.disabled = true; b.textContent = "Analiz ediliyor…"; }
  const pr = $("#vaProg"); const prog = x => { if (pr) pr.innerHTML = `<div class="bar"><i style="width:${Math.round(x * 100)}%"></i></div><p class="tiny muted">Kareler işleniyor… %${Math.round(x * 100)}</p>`; };
  prog(0); if (pr) pr.innerHTML += `<p class="tiny muted">İlk kullanımda yapay zekâ modeli yüklenir (birkaç saniye).</p>`;
  try {
    if (v.readyState < 1) await new Promise(r => { v.onloadedmetadata = r; setTimeout(r, 4000); });
    VA.res = await analyzeVideo(v, VA.type, VA.exId, prog);
  } catch (e) { console.warn(e); toast("Analiz yapılamadı: " + (e.message || e), 4000); VA.busy = false; reRender(); return; }
  VA.busy = false; reRender();
};
ACT.vaAgain = () => { if (VA.url) URL.revokeObjectURL(VA.url); VA.url = null; VA.file = null; VA.res = null; reRender(); };
ACT.vaSave = () => {
  if (VA.res.score == null) { toast("Bu video kaydedilemez; tekrar çekin."); return; }
  const rec = Object.assign({id: uid("v_")}, VA.res), aid = VA.aid;
  rec.by = myName();
  DB.videos.push(Object.assign(rec, {athleteId: aid, src: role() === "coach" ? "coach" : "athlete"}));
  saveAth(aid, role() === "coach" ? "coach" : "logs");
  if (VA.url) URL.revokeObjectURL(VA.url); VA = null; toast("Analiz kaydedildi"); go(`#/video/${aid}/${rec.id}`);
};
function aiResult(r, aiAid) {
  const col = r.score == null ? "var(--ink3)" : r.score >= 85 ? "var(--ok)" : r.score >= 70 ? "var(--acc)" : r.score >= 50 ? "var(--warn)" : "var(--bad)";
  return `<div class="card mt" style="border-color:${col}"><div class="row">${r.score != null ? `<div style="width:76px;height:76px;border-radius:50%;border:5px solid ${col};display:flex;flex-direction:column;align-items:center;justify-content:center;flex:0 0 76px"><b style="font-size:1.4rem">${r.score}</b><span class="tiny muted">/100</span></div>` : ""}<div class="grow"><div class="tiny muted">Yapay zekâ yorumu · ${esc(r.viewName)} çekim · güvenilirlik ${esc(r.reliability)}</div><b style="color:${col}">${esc(r.level)}</b><p class="small" style="margin:4px 0 0">${esc(r.summary)}</p></div></div>
    ${r.thumb ? `<img src="${r.thumb}" alt="Anahtar kare" style="width:100%;border-radius:12px;margin-top:10px">` : ""}
    ${r.positives.length ? `<h3>👍 İyi yaptıkların</h3><ul class="small" style="padding-left:18px">${r.positives.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${r.fixes.length ? `<h3>🛠 Düzeltmen gerekenler</h3>${r.fixes.map(x => `<div class="card flat" style="padding:10px;margin-bottom:8px"><b class="small">${esc(x.t)}</b><div class="small" style="color:var(--acc)">İpucu: ${esc(x.cue)}</div></div>`).join("")}` : ""}
    ${r.type === "jump" && r.metrics.some(m => /sıçrama yüksekliği/i.test(m.n)) && role() === "coach" && aiAid ? `<button class="btn sm blue mt" data-act="vaToCMJ" data-aid="${aiAid}" data-h="${r.metrics.find(m => /sıçrama yüksekliği/i.test(m.n)).v}">Yüksekliği CMJ testine yaz</button>` : ""}
    ${r.metrics.length ? `<details class="acc"><summary class="small">Ölçümler</summary><div><table class="tbl">${r.metrics.map(m => `<tr><td>${esc(m.n)}</td><td class="r"><b>${esc(String(m.v))}</b> ${esc(m.u)}</td><td>${m.ok === true ? "✅" : m.ok === false ? "⚠️" : ""}</td></tr>`).join("")}</table></div></details>` : ""}
    ${r.drills.length ? `<h3>Önerilen çalışmalar</h3><div class="list">${r.drills.map(id => li("#/ex/" + id, "bolt", esc(exById(id).n), esc(CATS[exById(id).c]))).join("")}</div>` : ""}
    ${r.notes.length ? `<p class="tiny muted mt">${r.notes.map(esc).join(" ")}</p>` : ""}</div>`;
}
route("/video/:aid/:vid", p => {
  const v = DB.videos.find(x => x.id === p.vid && x.athleteId === p.aid); if (!v) return {title: "Analiz", html: empty("Analiz bulunamadı")};
  const canDel = (role() === "coach" && v.src === "coach") || (role() === "athlete" && v.src === "athlete");
  return {title: "Hareket analizi", html: `<div class="small muted">${esc(getA(p.aid).name)} · ${fmtDT(v.at)} · ${v.src === "coach" ? "antrenör çekti" : "öğrenci çekti"}</div>${aiResult(v, p.aid)}
    ${role() === "athlete" && v.exId ? `<a class="btn block" href="#/video/new?ex=${v.exId}">Tekrar dene</a>` : ""}${canDel ? `<button class="btn danger block mt" data-act="vidDel" data-aid="${p.aid}" data-id="${v.id}">Analizi sil</button>` : ""}`};
});
ACT.vidDel = async el => { if (!await confirmBox("Analiz silinsin mi?", "Sil", true)) return; const v = DB.videos.find(x => x.id === el.dataset.id); DB.videos = DB.videos.filter(x => x !== v); saveAth(el.dataset.aid, v.src === "coach" ? "coach" : "logs"); back(); };

/* ---------------- Rapor ---------------- */
function reportHTML(a, aud, note) {
  const an = anth(a.id), ds = devStage(a), qs = qualityScores(a), prev = qualityScores(a, "previous"), tgt = targetScores(a, qs), sp = sportById(a.primarySport);
  const pr = activeProgram(a.id) || programsOf(a.id)[0], ad = pr ? adherence(a.id, pr.startDate, todayISO()) : null;
  const tst = TESTS.filter(t => testsOf(a.id, t.id).length).map(t => { const rs = testsOf(a.id, t.id); return {t, f: rs[0], l: rs[rs.length - 1], c: rs.length > 1 ? compareResults(t, rs[0], rs[rs.length - 1]) : null, rs}; });
  const strengths = QUALITIES.filter(q => isNum(qs[q.k].score) && qs[q.k].score >= 60), devs = QUALITIES.filter(q => isNum(qs[q.k].score) && qs[q.k].score < 45);
  const cms = DB.comments.filter(c => c.athleteId === a.id && (aud === "coach" || (c.vis || []).includes(aud))).sort((x, y) => y.at - x.at).slice(0, 3);
  const vids = DB.videos.filter(v => v.athleteId === a.id && v.score != null).sort((x, y) => y.at - x.at).slice(0, 3);
  const Hh = t => `<h2 style="font-size:15px;margin:16px 0 6px;color:#0B1426;border-bottom:2px solid #22D3C5;padding-bottom:3px">${t}</h2>`;
  const tb = `style="width:100%;border-collapse:collapse;font-size:12px"`, td = `style="border-bottom:1px solid #dde;padding:4px"`;
  const radar = radarSVG(QUALITIES, [{color: "#0E9F94", values: Object.fromEntries(QUALITIES.map(q => [q.k, qs[q.k].score])), fill: .15}, {color: "#8391AB", values: Object.fromEntries(QUALITIES.map(q => [q.k, prev[q.k].score])), dash: "5 4", dot: 2}, {color: "#D97706", values: tgt, dash: "2 4", dot: 2}], {size: 320}).replace(/var\(--line\)/g, "#ccd").replace(/var\(--ink2\)/g, "#333").replace(/var\(--ink3\)/g, "#777").replace(/var\(--acc\)/g, "#0E9F94");
  const goals = (a.goals || []).filter(g => !g.done);
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111">
    <div style="font-size:11px;color:#667">RUSH ATHLETIC · ${{coach: "Antrenör", parent: "Veli", athlete: "Sporcu"}[aud]} raporu · ${fmtD(todayISO())}</div><h1 style="font-size:20px;margin:2px 0">${esc(a.name)}</h1><div style="font-size:12px;color:#445">${[ageTxt(a), sportTxt(a), a.coachName ? "Antrenör: " + a.coachName : ""].filter(Boolean).join(" · ")}</div>
    ${Hh("Fiziksel özellikler")}<table ${tb}>${[["Boy", an.heightCm, "cm"], ["Kilo", an.weightKg, "kg"], ["Kol açıklığı", an.armSpanCm, "cm"], ["Gelişim evresi", null, ds.stage + "/6 — " + ds.n]].map(([k, v, u]) => `<tr><td ${td}>${k}</td><td ${td}>${v == null ? esc(u) : fmtN(v, 1) + " " + u}</td></tr>`).join("")}</table>
    ${Hh("Atletik profil")}<div style="max-width:330px;margin:0 auto">${radar}</div><div style="font-size:11px;color:#556;text-align:center">Turkuaz: şimdi · gri: önceki · turuncu: hedef</div>
    ${Hh("Test sonuçları")}<table ${tb}><tr><th ${td}>Test</th><th ${td}>İlk</th><th ${td}>Son</th><th ${td}>Değişim</th></tr>${tst.map(x => `<tr><td ${td}>${esc(x.t.n)} (${x.t.u})</td><td ${td}>${fmtN(testValue(x.f), x.t.dec)}</td><td ${td}><b>${fmtN(testValue(x.l), x.t.dec)}</b></td><td ${td} style="font-size:11px">${x.c ? (x.c.pct != null ? (x.c.pct > 0 ? "+" : "") + fmtN(x.c.pct, 1) + "% · " : "") + esc(x.c.verdict) : "tek ölçüm"}</td></tr>`).join("") || `<tr><td ${td}>Henüz test yok</td></tr>`}</table>
    ${tst.filter(x => x.rs.length >= 2).slice(0, 2).map(x => `<div style="margin-top:6px"><div style="font-size:12px;font-weight:700">${esc(x.t.n)}</div>${lineChart([{color: "#0E9F94", points: x.rs.map(r => ({x: r.date, y: testValue(r)}))}], {dec: x.t.dec, labels: true, h: 150}).replace(/var\(--line\)/g, "#dde")}</div>`).join("")}
    ${Hh("Güçlü yönler ve gelişim alanları")}<div style="font-size:12.5px"><b>Güçlü:</b> ${strengths.map(q => q.n).join(", ") || "—"}<br><b>Geliştirilecek:</b> ${devs.map(q => q.n).join(", ") || "—"}</div>
    ${vids.length ? Hh("Yapay zekâ hareket analizleri") + `<table ${tb}>${vids.map(v => `<tr><td ${td}>${fmtD(isoOf(new Date(v.at)))}</td><td ${td}>${esc(v.exId && exById(v.exId) ? exById(v.exId).n : v.typeName)}</td><td ${td}><b>${v.score}</b>/100</td><td ${td} style="font-size:11px">${esc(v.summary)}</td></tr>`).join("")}</table>` : ""}
    ${pr ? Hh("Program ve devamlılık") + `<div style="font-size:12.5px">${pr.weeks} haftalık program · ${fmtD(pr.startDate)} başlangıç · ${ad.done}/${ad.planned} antrenman tamamlandı (%${ad.pct ?? "—"})</div>` : ""}
    ${Hh("Hedefler")}${goals.length ? `<ul style="font-size:12.5px;padding-left:18px">${goals.map(g => `<li>${esc(g.text)}${g.date ? " (" + fmtD(g.date) + ")" : ""}</li>`).join("")}</ul>` : `<div style="font-size:12.5px">Hedefler antrenörle belirlenecek.</div>`}
    ${aud !== "athlete" && healthOf(a.id).length ? Hh("Sağlık notları (gizli)") + `<div style="font-size:12px">${healthOf(a.id).filter(h => h.status !== "geçmiş").map(h => "• " + esc(h.title)).join("<br>") || "Aktif kayıt yok."}<br>Kısıtlamalar: ${[...restrictions(a.id)].map(t => RTAGS[t]).join(", ") || "yok"}</div>` : ""}
    ${Hh("Antrenör değerlendirmesi")}<div style="font-size:12.5px">${note ? esc(note) + "<br>" : ""}${cms.map(c => `“${esc(c.text)}” — ${fmtD(isoOf(new Date(c.at)))}`).join("<br>") || (note ? "" : "—")}</div>
    <div style="font-size:10px;color:#778;margin-top:14px;border-top:1px solid #dde;padding-top:6px">Referans değerler yaklaşıktır. Bu rapor tıbbi teşhis içermez.</div></div>`;
}
function reportPage(a, aud) {
  return {title: "Rapor", html: `${role() === "coach" ? field("Antrenör değerlendirmesi (rapora eklenir)", `<textarea class="in" id="repNote"></textarea>`) : ""}
    <div class="btns" style="margin-top:0;margin-bottom:12px"><button class="btn pri" data-act="repPrint" data-aid="${a.id}" data-aud="${aud}">${ic("doc")} PDF kaydet / yazdır</button></div>
    <p class="tiny muted">Açılan yazdırma ekranında “PDF olarak kaydet”i seçin.</p><div class="card" style="background:#fff;color:#111"><div id="repPrev" style="font-size:13px">${reportHTML(a, aud, "")}</div></div>`};
}
ACT.repPrint = el => { const a = getA(el.dataset.aid), n = $("#repNote"); $("#printArea").innerHTML = reportHTML(a, el.dataset.aud, n ? n.value : ""); const t = document.title; document.title = `Rush-Athletic-${a.name.replace(/\s+/g, "-")}-${todayISO()}`; setTimeout(() => { window.print(); document.title = t; }, 60); };

/* Videodan çıkan sıçrama yüksekliğini CMJ testine aktar (yalnızca antrenör; onay gerekir) */
ACT.vaToCMJ = async el => {
  const a = getA(el.dataset.aid), h = num(el.dataset.h); if (!isNum(h)) return;
  if (!await confirmBox(`Videodan ölçülen ${fmtN(h, 1)} cm, ${a.name} için CMJ testi olarak kaydedilsin mi? (Video tahmini ±4 cm; resmi test değildir.)`, "Kaydet")) return;
  saveTestResult(a, TEST.cmj, {value: h}, todayISO(), "Video AI tahmini (±4 cm)"); saveAth(a.id, "coach"); toast("CMJ testine kaydedildi"); reRender();
};
