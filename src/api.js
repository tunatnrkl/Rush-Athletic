/* =========================================================================
   VERİ KATMANI — aynı arayüzle iki mod:
   * CloudAPI : Supabase (config.js doluysa). Farklı telefonlar arasında kodla bağlanma.
   * LocalAPI : Deneme modu — tüm hesaplar bu cihazda. Kurulum gerektirmez.
   Yetki kuralları her iki modda da aynıdır (bulutta sunucu tarafında zorunludur).
   ========================================================================= */
const CFG = (typeof window !== "undefined" && window.RUSH_CONFIG) || {};
const CLOUD_ON = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const USER_DOMAIN = "kullanici.rushathletic.app";
function toEmail(u) { u = String(u || "").trim().toLowerCase(); if (u.includes("@")) return u; const s = u.replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9._-]/g, ""); if (s.length < 3) throw new Error("Kullanıcı adı en az 3 harf/rakam olmalı."); return s + "@" + USER_DOMAIN; }
const showLogin = email => String(email || "").endsWith("@" + USER_DOMAIN) ? email.split("@")[0] : email;
const CODE_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const normCode = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
function newCode() { const r = crypto.getRandomValues(new Uint8Array(6)); return Array.from(r, x => CODE_ALPHA[x % CODE_ALPHA.length]).join(""); }

/* ---------------- Yerel (deneme) mod ---------------- */
const LocalAPI = (() => {
  const KEY = "rush2.local", SKEY = "rush2.session";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } };
  let D = load() || {users: [], profiles: {}, athletes: [], links: [], coachDocs: {}};
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { throw new Error("Cihaz depolama alanı dolu."); } };
  let uid = null; try { uid = (JSON.parse(localStorage.getItem(SKEY)) || {}).uid || null; } catch (e) {}
  const me = () => D.users.find(u => u.id === uid) || null;
  const need = () => { if (!me()) throw new Error("Oturum gerekli."); return uid; };
  const role = () => (D.profiles[uid] || {}).role;
  async function hash(pw, salt) {
    const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
    const b = await crypto.subtle.deriveBits({name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 60000, hash: "SHA-256"}, k, 256);
    return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, "0")).join("");
  }
  const uniqCode = () => { let c; do { c = newCode(); } while (D.athletes.some(a => a.invite_code === c || a.parent_code === c)); return c; };
  const canRead = a => a.coach_id === uid || a.athlete_user_id === uid || D.links.some(l => l.athlete_id === a.id && l.parent_id === uid);
  const clone = o => JSON.parse(JSON.stringify(o));
  return {
    mode: "local", label: "Deneme modu (tek cihaz)",
    reload() { D = load() || D; },
    async restore() { this.reload(); return me() ? {id: uid, email: me().email} : null; },
    user() { return me() ? {id: uid, email: me().email} : null; },
    async signUp(email, pw) {
      this.reload(); email = email.toLowerCase();
      if (D.users.some(u => u.email === email)) throw new Error("Bu kullanıcı adı / e-posta zaten kayıtlı.");
      const salt = newCode() + Date.now(); const u = {id: crypto.randomUUID ? crypto.randomUUID() : uid4(), email, salt, hash: await hash(pw, salt)};
      D.users.push(u); persist(); uid = u.id; localStorage.setItem(SKEY, JSON.stringify({uid})); return {id: uid, email};
    },
    async signIn(email, pw) {
      this.reload(); email = email.toLowerCase(); const u = D.users.find(x => x.email === email);
      if (!u || (await hash(pw, u.salt)) !== u.hash) throw new Error("Kullanıcı adı/e-posta veya şifre hatalı.");
      uid = u.id; localStorage.setItem(SKEY, JSON.stringify({uid})); return {id: uid, email};
    },
    async signOut() { uid = null; localStorage.removeItem(SKEY); },
    async changePassword(pw) { need(); const u = me(); u.salt = newCode() + Date.now(); u.hash = await hash(pw, u.salt); persist(); },
    async profile() { this.reload(); const p = D.profiles[uid]; return p ? Object.assign({id: uid}, p) : null; },
    async setProfile(r, name) { need(); const p = D.profiles[uid]; if (p) { if (name) p.name = name; } else D.profiles[uid] = {role: r, name: name || ""}; persist(); return this.profile(); },
    async createInvite(note) {
      need(); if (role() !== "coach") throw new Error("Yalnızca antrenör öğrenci ekleyebilir.");
      const a = {id: crypto.randomUUID ? crypto.randomUUID() : uid4(), coach_id: uid, coach_name: D.profiles[uid].name, athlete_user_id: null, invite_code: uniqCode(), invite_note: (note || "").trim(), parent_code: null, info: {}, coach: {}, logs: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString()};
      D.athletes.push(a); persist(); return {athlete_id: a.id, code: a.invite_code};
    },
    async inviteInfo(code) { this.reload(); const a = D.athletes.find(x => x.invite_code === normCode(code) && !x.athlete_user_id); return a ? {coach_name: a.coach_name, note: a.invite_note} : null; },
    async redeemInvite(code) {
      need(); if (role() !== "athlete") throw new Error("Bu kod yalnızca öğrenci hesabıyla kullanılabilir.");
      if (D.athletes.some(a => a.athlete_user_id === uid)) throw new Error("Bu hesap zaten bir antrenöre bağlı.");
      const a = D.athletes.find(x => x.invite_code === normCode(code) && !x.athlete_user_id); if (!a) throw new Error("Kod geçersiz veya daha önce kullanılmış.");
      a.athlete_user_id = uid; a.invite_code = null; persist(); return a.id;
    },
    async createParentCode(aid) { need(); const a = D.athletes.find(x => x.id === aid && x.athlete_user_id === uid); if (!a) throw new Error("Veli kodunu yalnızca öğrenci oluşturabilir."); a.parent_code = uniqCode(); persist(); return a.parent_code; },
    async parentCodeInfo(code) { this.reload(); const a = D.athletes.find(x => x.parent_code === normCode(code)); return a ? {athlete_name: a.info.name || "", coach_name: a.coach_name} : null; },
    async redeemParentCode(code) {
      need(); if (role() !== "parent") throw new Error("Bu kod yalnızca veli hesabıyla kullanılabilir.");
      const a = D.athletes.find(x => x.parent_code === normCode(code)); if (!a) throw new Error("Veli kodu geçersiz.");
      if (!D.links.some(l => l.athlete_id === a.id && l.parent_id === uid)) D.links.push({athlete_id: a.id, parent_id: uid, parent_name: D.profiles[uid].name, created_at: new Date().toISOString()});
      persist(); return a.id;
    },
    async athleteParents(aid) { const a = D.athletes.find(x => x.id === aid && (x.athlete_user_id === uid || x.coach_id === uid)); if (!a) return []; return D.links.filter(l => l.athlete_id === aid).map(l => ({parent_id: l.parent_id, name: l.parent_name, created_at: l.created_at})); },
    async removeParent(aid, pid) { const a = D.athletes.find(x => x.id === aid && (x.athlete_user_id === uid || x.coach_id === uid)); if (!a) throw new Error("Yetki yok."); D.links = D.links.filter(l => !(l.athlete_id === aid && l.parent_id === pid)); persist(); },
    async listAthletes() { this.reload(); need(); return clone(D.athletes.filter(canRead)); },
    async saveInfo(aid, data) { need(); const a = D.athletes.find(x => x.id === aid && x.athlete_user_id === uid); if (!a) throw new Error("Kişisel bilgileri yalnızca öğrencinin kendisi değiştirebilir."); a.info = clone(data); a.updated_at = new Date().toISOString(); persist(); },
    async saveLogs(aid, data) { need(); const a = D.athletes.find(x => x.id === aid && x.athlete_user_id === uid); if (!a) throw new Error("Antrenman kayıtlarını yalnızca öğrenci girebilir."); a.logs = clone(data); a.updated_at = new Date().toISOString(); persist(); },
    async saveCoach(aid, data) { need(); const a = D.athletes.find(x => x.id === aid && x.coach_id === uid); if (!a) throw new Error("Ölçüm, test ve programları yalnızca antrenör girebilir."); a.coach = clone(data); a.updated_at = new Date().toISOString(); persist(); },
    async deleteAthlete(aid) { need(); const n = D.athletes.length; D.athletes = D.athletes.filter(x => !(x.id === aid && x.coach_id === uid)); if (n === D.athletes.length) throw new Error("Yetki yok."); D.links = D.links.filter(l => l.athlete_id !== aid); persist(); },
    async getCoachDoc() { need(); return clone(D.coachDocs[uid] || {}); },
    async saveCoachDoc(data) { need(); if (role() !== "coach") throw new Error("Yetki yok."); D.coachDocs[uid] = clone(data); persist(); },
    async deleteAccount() {
      need(); const id = uid;
      D.athletes = D.athletes.filter(a => a.coach_id !== id); D.athletes.forEach(a => { if (a.athlete_user_id === id) a.athlete_user_id = null; });
      D.links = D.links.filter(l => l.parent_id !== id && D.athletes.some(a => a.id === l.athlete_id));
      delete D.profiles[id]; delete D.coachDocs[id]; D.users = D.users.filter(u => u.id !== id); persist(); await this.signOut();
    },
    _wipe() { D = {users: [], profiles: {}, athletes: [], links: [], coachDocs: {}}; persist(); this.signOut(); },
    _raw() { return D; }
  };
})();
function uid4() { return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)); }

/* ---------------- Bulut (Supabase) mod ---------------- */
const CloudAPI = (() => {
  const URL0 = String(CFG.supabaseUrl || "").replace(/\/+$/, ""), KEY = CFG.supabaseAnonKey, SKEY = "rush2.cloudsession";
  let S = null; try { S = JSON.parse(localStorage.getItem(SKEY)); } catch (e) {}
  const setS = s => { S = s; if (s) localStorage.setItem(SKEY, JSON.stringify(s)); else localStorage.removeItem(SKEY); };
  const sessFrom = j => ({access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: {id: j.user.id, email: j.user.email}});
  async function req(path, opt = {}, auth = true) {
    const h = Object.assign({apikey: KEY, "Content-Type": "application/json"}, opt.headers || {});
    if (auth && S) { if (S.expires_at - 60 < Date.now() / 1000) await refresh(); h.Authorization = "Bearer " + S.access_token; } else h.Authorization = "Bearer " + KEY;
    let r;
    try { r = await fetch(URL0 + path, Object.assign({}, opt, {headers: h})); }
    catch (e) { throw new Error("Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin."); }
    const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) { j = txt; }
    if (!r.ok) { const m = (j && (j.message || j.msg || j.error_description || j.error)) || ("HTTP " + r.status); throw new Error(trMsg(m)); }
    return j;
  }
  function trMsg(m) {
    if (/Invalid login credentials/i.test(m)) return "Kullanıcı adı/e-posta veya şifre hatalı.";
    if (/already registered|already exists/i.test(m)) return "Bu kullanıcı adı / e-posta zaten kayıtlı.";
    if (/Password should be at least/i.test(m)) return "Şifre en az 6 karakter olmalı.";
    if (/Email not confirmed/i.test(m)) return "E-posta doğrulanmamış. Supabase'de 'Confirm email' ayarını kapatın veya e-postadaki bağlantıya tıklayın.";
    if (/JWT expired/i.test(m)) return "Oturum süresi doldu, tekrar giriş yapın.";
    return m;
  }
  async function refresh() {
    if (!S || !S.refresh_token) return;
    const r = await fetch(URL0 + "/auth/v1/token?grant_type=refresh_token", {method: "POST", headers: {apikey: KEY, "Content-Type": "application/json"}, body: JSON.stringify({refresh_token: S.refresh_token})});
    if (!r.ok) { setS(null); throw new Error("Oturum süresi doldu, tekrar giriş yapın."); }
    setS(sessFrom(await r.json()));
  }
  const rpc = (fn, args) => req("/rest/v1/rpc/" + fn, {method: "POST", body: JSON.stringify(args || {})});
  return {
    mode: "cloud", label: "Bulut (tüm cihazlarda)",
    reload() {},
    async restore() { if (!S) return null; try { if (S.expires_at - 60 < Date.now() / 1000) await refresh(); return S ? S.user : null; } catch (e) { return null; } },
    user() { return S ? S.user : null; },
    async signUp(email, pw) {
      const j = await req("/auth/v1/signup", {method: "POST", body: JSON.stringify({email, password: pw})}, false);
      if (!j || !j.access_token) throw new Error("Hesap oluşturuldu ancak e-posta doğrulaması gerekiyor. Supabase'de Authentication > Providers > Email > 'Confirm email' kapatılmalı.");
      setS(sessFrom(j)); return S.user;
    },
    async signIn(email, pw) { const j = await req("/auth/v1/token?grant_type=password", {method: "POST", body: JSON.stringify({email, password: pw})}, false); setS(sessFrom(j)); return S.user; },
    async signOut() { try { if (S) await req("/auth/v1/logout", {method: "POST"}); } catch (e) {} setS(null); },
    async changePassword(pw) { await req("/auth/v1/user", {method: "PUT", body: JSON.stringify({password: pw})}); },
    async profile() { const r = await req("/rest/v1/profiles?select=*&id=eq." + S.user.id); return r && r[0] || null; },
    async setProfile(role, name) { return rpc("set_profile", {p_role: role, p_name: name || ""}); },
    createInvite: note => rpc("create_invite", {p_note: note || ""}),
    inviteInfo: code => rpc("invite_info", {p_code: normCode(code)}),
    redeemInvite: code => rpc("redeem_invite", {p_code: normCode(code)}),
    createParentCode: aid => rpc("create_parent_code", {p_aid: aid}),
    parentCodeInfo: code => rpc("parent_code_info", {p_code: normCode(code)}),
    redeemParentCode: code => rpc("redeem_parent_code", {p_code: normCode(code)}),
    athleteParents: aid => rpc("athlete_parents", {p_aid: aid}),
    removeParent: (aid, pid) => rpc("remove_parent", {p_aid: aid, p_parent: pid}),
    listAthletes: () => req("/rest/v1/athletes?select=*&order=created_at.asc"),
    saveInfo: (aid, d) => rpc("save_info", {p_aid: aid, p_data: d}),
    saveLogs: (aid, d) => rpc("save_logs", {p_aid: aid, p_data: d}),
    saveCoach: (aid, d) => rpc("save_coach", {p_aid: aid, p_data: d}),
    deleteAthlete: aid => rpc("delete_athlete", {p_aid: aid}),
    async getCoachDoc() { const r = await req("/rest/v1/coach_docs?select=data&coach_id=eq." + S.user.id); return (r && r[0] && r[0].data) || {}; },
    async saveCoachDoc(data) { await req("/rest/v1/coach_docs", {method: "POST", headers: {Prefer: "resolution=merge-duplicates,return=minimal"}, body: JSON.stringify({coach_id: S.user.id, data})}); },
    async deleteAccount() { await rpc("delete_my_account", {}); setS(null); }
  };
})();
const API = CLOUD_ON ? CloudAPI : LocalAPI;
