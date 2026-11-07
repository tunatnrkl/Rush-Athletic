/* =========================================================================
   VELİ ARAYÜZÜ — yalnızca izleme (hiçbir veriyi değiştiremez)
   ========================================================================= */
const PR = ["parent"];
function child() {
  const id = lsGet("rush2.pchild"); let a = DB.athletes.find(x => x.id === id) || DB.athletes[0] || null;
  if (a && a.id !== id) lsSet("rush2.pchild", a.id);
  return a;
}
const childPicker = a => DB.athletes.length > 1 ? `<div class="chips" style="margin-bottom:12px">${DB.athletes.map(x => `<button class="chip ${x.id === a.id ? "on" : ""}" data-act="pickChild" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div>` : "";
ACT.pickChild = el => { lsSet("rush2.pchild", el.dataset.id); reRender(); };
const noChild = () => ({title: "Veli", html: empty("Bağlı öğrenci yok.", "users") + `<a class="btn pri block" href="#/p/add">Veli kodu gir</a>`});
route("/p", () => {
  const a = child(); if (!a) return noChild();
  const t = todayISO(), ws = mondayOf(t), we = addDays(ws, 6), wk = plannedSessions(a.id, ws, we), ad4 = adherence(a.id, addDays(t, -27), t);
  const cms = DB.comments.filter(c => c.athleteId === a.id && (c.vis || []).includes("parent")).sort((x, y) => y.at - x.at).slice(0, 3);
  const vids = DB.videos.filter(v => v.athleteId === a.id && v.score != null).sort((x, y) => y.at - x.at).slice(0, 2);
  const goals = (a.goals || []).filter(g => !g.done), last = DB.logs.filter(l => l.athleteId === a.id).sort((x, y) => x.date < y.date ? 1 : -1)[0];
  return {title: "Özet", html: childPicker(a) + athleteHead(a, ringSVG(ad4.pct, "4 hafta")) + `
    ${holds(a.id).length ? alertBox("warn", "Antrenmana ara verildi", "Çocuğunuz ağrı bildirdi veya doktor onayı bekleniyor. Antrenörle iletişime geçin.") : ""}
    <div class="card"><h3>Bu hafta</h3>${wk.length ? wk.map(x => { const l = logOf(x.p.id, x.wk.w, x.s.d); return `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="small grow">${DOWL[x.s.dow]} · ${esc(x.s.title)}</span>${l ? pill(l.status, l.status === "tamamlandı" ? "ok" : "warn") : x.s.date < t ? pill("yapılmadı", "bad") : pill("planlı")}</div>`; }).join("") : `<p class="small muted">Bu hafta planlı antrenman yok.</p>`}
      ${last ? `<p class="tiny muted mt">Son antrenman: ${fmtD(last.date)} · ${esc(last.readiness || "")}${isNum(last.rpe) ? " · zorluk " + last.rpe + "/10" : ""}</p>` : ""}</div>
    ${cms.length ? `<h3>Antrenör notları</h3>${cms.map(c => `<div class="card flat" style="padding:11px"><div class="tiny muted">${fmtD(isoOf(new Date(c.at)))}</div>${esc(c.text)}</div>`).join("")}` : ""}
    ${goals.length ? `<h3>Hedefleri</h3>${goals.map(g => goalRow(a, g)).join("")}` : ""}
    ${vids.length ? `<h3>Son hareket analizleri</h3><div class="list">${vids.map(v => videoCard(v, `#/video/${a.id}/${v.id}`)).join("")}</div>` : ""}
    <h3>Son test sonuçları</h3>${improvementList(a, 5)}<a class="btn block mt" href="#/p/progress">Tüm gelişimi gör</a>
    <p class="tiny muted mt">Veli hesabı yalnızca izleme içindir; değişiklikleri öğrenci ve antrenör yapar.</p>`};
}, PR);
route("/p/calendar", () => { const a = child(); if (!a) return noChild(); return {title: "Takvim", html: childPicker(a) + weekCalendar(a, parseInt(Q("o")) || 0, "#/p/calendar", false)}; }, PR);
route("/p/progress", () => { const a = child(); if (!a) return noChild(); const ds = devStage(a); return {title: "Gelişim", html: childPicker(a) + radarBlock(a) + `<h3>Testler</h3>${improvementList(a)}<div class="card mt"><h3>Gelişim evresi</h3><b>${ds.stage}/6 · ${esc(ds.n)}</b><p class="small">${esc(ds.focus)}</p></div>`}; }, PR);
route("/p/report", () => { const a = child(); if (!a) return noChild(); return reportPage(a, "parent"); }, PR);
route("/p/add", () => ({title: "Çocuk ekle", html: `<form class="card" data-form="addChild"><h3>Veli kodu</h3><p class="small muted">Çocuğunuz kodu uygulamadaki Profilim → Veli kodu bölümünden oluşturur.</p><input class="in codein" name="code" required maxlength="7" autocapitalize="characters" autocomplete="off" placeholder="ABC-123"><button class="btn pri block mt" type="submit">Ekle</button></form>`}), PR);
FORM.addChild = async d => { const aid = await API.redeemParentCode(d.code); await loadAll(); lsSet("rush2.pchild", aid); toast("Eklendi"); go("#/p"); };
