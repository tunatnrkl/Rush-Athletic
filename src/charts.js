/* =========================================================================
   GRAFİKLER — bağımlılıksız SVG (çevrimdışı çalışır)
   ========================================================================= */
const COL = {cur: "#22D3C5", prev: "#8391AB", tgt: "#FBBF24", blue: "#3B82F6", bad: "#F87171", ok: "#34D399"};
function radarSVG(axes, series, opt = {}) {
  const S0 = opt.size || 340, cx = S0 / 2, cy = S0 / 2 + 4, R = S0 / 2 - 62, n = axes.length;
  const ang = i => -Math.PI / 2 + i * 2 * Math.PI / n;
  const pt = (i, v) => [cx + Math.cos(ang(i)) * R * v / 100, cy + Math.sin(ang(i)) * R * v / 100];
  let g = "";
  for (const lv of [20, 40, 60, 80, 100]) g += `<polygon points="${axes.map((_, i) => pt(i, lv).map(x => x.toFixed(1)).join(",")).join(" ")}" style="fill:none;stroke:var(--line);stroke-width:1"/>`;
  axes.forEach((a, i) => { const [x, y] = pt(i, 100); g += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" style="stroke:var(--line);stroke-width:1"/>`; });
  for (const lv of [50, 100]) { const [x, y] = pt(0, lv); g += `<text x="${x + 4}" y="${y + 3}" style="font-size:9px;fill:var(--ink3)">${lv}</text>`; }
  for (const s of series) {
    const vals = axes.map(a => s.values[a.k]);
    const full = vals.every(isNum);
    const dash = s.dash ? `stroke-dasharray:${s.dash};` : "";
    if (full) g += `<polygon points="${vals.map((v, i) => pt(i, v).map(x => x.toFixed(1)).join(",")).join(" ")}" style="fill:${s.color};fill-opacity:${s.fill || 0};stroke:${s.color};stroke-width:2;${dash}"/>`;
    else for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (isNum(vals[i]) && isNum(vals[j])) { const [x1, y1] = pt(i, vals[i]), [x2, y2] = pt(j, vals[j]); g += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="stroke:${s.color};stroke-width:2;${dash}"/>`; } }
    vals.forEach((v, i) => { if (isNum(v)) { const [x, y] = pt(i, v); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.dot || 3.5}" style="fill:${s.color}"/>`; } });
  }
  const main = series[0];
  axes.forEach((a, i) => {
    const [x, y] = pt(i, 122); const c = Math.cos(ang(i)); const anchor = Math.abs(c) < .3 ? "middle" : c > 0 ? "start" : "end";
    const v = main ? main.values[a.k] : null;
    g += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" style="font-size:11px;font-weight:700;fill:var(--ink2)">${esc(a.n)}</text>`;
    g += `<text x="${x.toFixed(1)}" y="${(y + 13).toFixed(1)}" text-anchor="${anchor}" style="font-size:10.5px;${isNum(v) ? "fill:var(--acc);font-weight:700" : "fill:var(--ink3);font-style:italic"}">${isNum(v) ? v : "veri yok"}</text>`;
  });
  return `<svg class="chart" viewBox="-34 0 ${S0 + 68} ${S0 + 8}" role="img" aria-label="Atletik radar grafiği">${g}</svg>`;
}
function lineChart(series, opt = {}) {
  const W = 340, H = opt.h || 190, L = 40, Rm = 12, T = 14, B = 30;
  const pts = series.flatMap(s => s.points.concat(s.proj || []));
  if (!pts.length) return `<div class="empty small">Grafik için veri yok</div>`;
  const xs = pts.map(p => parseISO(p.x).getTime());
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x0 === x1) { x0 -= 15 * 864e5; x1 += 15 * 864e5; }
  const ys = pts.flatMap(p => [p.y, p.lo, p.hi].filter(isNum));
  let y0 = Math.min(...ys), y1 = Math.max(...ys); const padY = (y1 - y0) * 0.15 || Math.abs(y0) * 0.05 || 1; y0 -= padY; y1 += padY;
  const sx = t => L + (t - x0) / (x1 - x0) * (W - L - Rm), sy = v => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  let g = "";
  for (let i = 0; i <= 3; i++) { const v = y0 + (y1 - y0) * i / 3, y = sy(v); g += `<line x1="${L}" y1="${y.toFixed(1)}" x2="${W - Rm}" y2="${y.toFixed(1)}" style="stroke:var(--line)"/><text x="${L - 5}" y="${(y + 3).toFixed(1)}" text-anchor="end">${fmtN(v, opt.dec != null ? opt.dec : (Math.abs(y1 - y0) < 5 ? 2 : 0))}</text>`; }
  const dl = [x0, (x0 + x1) / 2, x1];
  dl.forEach((t, i) => { g += `<text x="${sx(t).toFixed(1)}" y="${H - 10}" text-anchor="${i === 0 ? "start" : i === 2 ? "end" : "middle"}">${fmtD(isoOf(new Date(t)))}</text>`; });
  for (const s of series) {
    if (s.proj && s.proj.length) {
      const band = s.proj.filter(p => isNum(p.lo));
      if (band.length) g += `<polygon points="${band.map(p => sx(parseISO(p.x).getTime()).toFixed(1) + "," + sy(p.hi).toFixed(1)).concat(band.slice().reverse().map(p => sx(parseISO(p.x).getTime()).toFixed(1) + "," + sy(p.lo).toFixed(1))).join(" ")}" style="fill:${s.color};fill-opacity:.12;stroke:none"/>`;
      g += `<polyline points="${s.proj.map(p => sx(parseISO(p.x).getTime()).toFixed(1) + "," + sy(p.y).toFixed(1)).join(" ")}" style="fill:none;stroke:${s.color};stroke-width:2;stroke-dasharray:5 4;opacity:.8"/>`;
    }
    const sp = s.points.slice().sort((a, b) => a.x < b.x ? -1 : 1);
    if (sp.length > 1) g += `<polyline points="${sp.map(p => sx(parseISO(p.x).getTime()).toFixed(1) + "," + sy(p.y).toFixed(1)).join(" ")}" style="fill:none;stroke:${s.color};stroke-width:2.4;${s.dash ? "stroke-dasharray:" + s.dash : ""}"/>`;
    sp.forEach(p => { g += `<circle cx="${sx(parseISO(p.x).getTime()).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="3.6" style="fill:${s.color}"/>`; });
    if (opt.labels && sp.length) { const p = sp[sp.length - 1]; g += `<text x="${Math.min(W - Rm, sx(parseISO(p.x).getTime())).toFixed(1)}" y="${(sy(p.y) - 7).toFixed(1)}" text-anchor="end" style="font-weight:700;fill:${s.color}">${fmtN(p.y, opt.dec != null ? opt.dec : 2)}</text>`; }
  }
  if (opt.ref != null && isNum(opt.ref) && opt.ref > y0 && opt.ref < y1) { const y = sy(opt.ref); g += `<line x1="${L}" y1="${y}" x2="${W - Rm}" y2="${y}" style="stroke:${COL.tgt};stroke-dasharray:4 4"/><text x="${W - Rm}" y="${y - 4}" text-anchor="end" style="fill:${COL.tgt}">${esc(opt.refLabel || "hedef")}</text>`; }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
}
function barChart(bars, opt = {}) {
  const W = 340, H = opt.h || 170, L = 34, B = 34, T = 12, n = bars.length || 1;
  const max = Math.max(1, ...bars.map(b => b.v || 0)) * 1.12;
  const bw = (W - L - 8) / n;
  let g = "";
  for (let i = 0; i <= 2; i++) { const v = max * i / 2, y = T + (1 - v / max) * (H - T - B); g += `<line x1="${L}" y1="${y}" x2="${W - 4}" y2="${y}" style="stroke:var(--line)"/><text x="${L - 4}" y="${y + 3}" text-anchor="end">${Math.round(v)}</text>`; }
  bars.forEach((b, i) => {
    const h = (b.v || 0) / max * (H - T - B), x = L + i * bw + bw * 0.18, y = H - B - h;
    g += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" rx="3" style="fill:${b.c || COL.cur}"/>`;
    g += `<text x="${(x + bw * 0.32).toFixed(1)}" y="${H - B + 13}" text-anchor="middle" style="font-size:9.5px">${esc(b.l)}</text>`;
    if (b.v) g += `<text x="${(x + bw * 0.32).toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="middle" style="font-size:9px;fill:var(--ink3)">${Math.round(b.v)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
}
function ringSVG(pct, label) {
  const r = 34, c = 2 * Math.PI * r, p = clamp(pct || 0, 0, 100);
  return `<svg class="ring" viewBox="0 0 84 84"><circle cx="42" cy="42" r="${r}" style="fill:none;stroke:var(--line);stroke-width:8"/><circle cx="42" cy="42" r="${r}" transform="rotate(-90 42 42)" style="fill:none;stroke:var(--acc);stroke-width:8;stroke-linecap:round;stroke-dasharray:${(c * p / 100).toFixed(1)} ${c.toFixed(1)}"/><text x="42" y="46" text-anchor="middle" style="font-size:15px;font-weight:800;fill:var(--ink)">${pct == null ? "—" : Math.round(p) + "%"}</text>${label ? `<text x="42" y="60" text-anchor="middle" style="font-size:8px;fill:var(--ink3)">${esc(label)}</text>` : ""}</svg>`;
}
const legend = items => `<div class="legend">${items.map(([c, n, dash]) => `<span><i style="background:${c};${dash ? "opacity:.7" : ""}"></i>${esc(n)}</span>`).join("")}</div>`;
