/* =========================================================================
   GİRİŞ VE KODLA KATILIM
   Antrenör serbestçe hesap açar. Öğrenci yalnızca antrenörün verdiği kodla,
   veli yalnızca öğrencinin verdiği kodla hesap açabilir.
   ========================================================================= */
function authFrame(inner) {
  return `<div class="lock"><div class="center" style="margin-bottom:18px">${LOGO_SVG}<div class="brand" style="margin-top:8px">RUSH <em>ATHLETIC</em></div><div class="muted small">Sporcu gelişim platformu</div></div>${inner}
    <p class="tiny muted center mt">${esc(API.label)}${API.mode === "local" ? " · tüm hesaplar bu telefonda tutulur" : ""}</p></div>`;
}
const pwFields = () => `${field("Şifre", inp("password", "", 'type="password" required minlength="6" autocomplete="new-password"'), "En az 6 karakter")}${field("Şifre (tekrar)", inp("password2", "", 'type="password" required minlength="6" autocomplete="new-password"'))}`;
const userField = (hint = "Kullanıcı adı veya e-posta") => field(hint, inp("user", "", 'required autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"'), "E-postanız yoksa sadece bir kullanıcı adı yazın (ör. ahmet.yilmaz)");
const codeInp = () => `<input class="in codein" name="code" required maxlength="7" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="ABC-123">`;
function checkPw(d) { if (d.password.length < 6) throw new Error("Şifre en az 6 karakter olmalı."); if (d.password !== d.password2) throw new Error("Şifreler aynı değil."); }
async function afterAuth() { ST.user = API.user(); ST.profile = await API.profile(); if (ST.profile) { await loadAll(); applyPrefs(); } }

route("/welcome", () => ({bare: true, html: authFrame(`
  <a class="btn pri block" href="#/login">Giriş yap</a>
  <div class="hr"></div><p class="small muted center" style="margin-bottom:10px">İlk kez mi kullanıyorsun?</p>
  <div class="list">
    <a class="li" href="#/join/student"><div class="ic">${ic("user")}</div><div class="grow"><div class="t">Öğrenciyim</div><div class="s">Antrenörümün verdiği kod var</div></div><span class="chev">${ic("chev")}</span></a>
    <a class="li" href="#/join/parent"><div class="ic">${ic("heart")}</div><div class="grow"><div class="t">Veliyim</div><div class="s">Çocuğumun verdiği veli kodu var</div></div><span class="chev">${ic("chev")}</span></a>
    <a class="li" href="#/signup/coach"><div class="ic">${ic("layers")}</div><div class="grow"><div class="t">Antrenörüm</div><div class="s">Yeni antrenör hesabı oluştur</div></div><span class="chev">${ic("chev")}</span></a>
  </div>
  ${API.mode === "local" ? `<div class="card flat mt"><b class="small">Hızlıca denemek ister misin?</b><p class="tiny muted">Örnek bir antrenör, öğrenci ve veli hesabı oluşturur.</p><button class="btn blue block" data-act="demo">Örnek verilerle dene</button></div>` : ""}`)}));

route("/login", () => ({bare: true, html: authFrame(`<div class="card"><h2>Giriş yap</h2><form data-form="login">
  ${field("Kullanıcı adı veya e-posta", inp("user", "", 'required autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"'))}
  ${field("Şifre", inp("password", "", 'type="password" required autocomplete="current-password"'))}
  <button class="btn pri block" type="submit">Giriş yap</button></form></div><a class="btn ghost block" href="#/welcome">Geri</a>`)}));
FORM.login = async d => { await API.signIn(toEmail(d.user), d.password); await afterAuth(); toast("Hoş geldin " + (myName() || "")); go(ST.profile ? homeOf() : "#/finish"); };

route("/signup/coach", () => ({bare: true, html: authFrame(`<div class="card"><h2>Antrenör hesabı</h2><form data-form="signupCoach">
  ${field("Ad soyad", inp("name", "", 'required autocomplete="name"'))}${userField()}${pwFields()}
  <label class="check"><input type="checkbox" required><span class="small">Öğrenci verilerini yalnızca sporcu gelişimi için kullanacağımı, reklam/pazarlama amacıyla kullanmayacağımı kabul ediyorum (KVKK).</span></label>
  <button class="btn pri block" type="submit">Hesabı oluştur</button></form></div><a class="btn ghost block" href="#/welcome">Geri</a>`)}));
FORM.signupCoach = async d => { checkPw(d); await API.signUp(toEmail(d.user), d.password); await API.setProfile("coach", d.name.trim()); await afterAuth(); go("#/c"); };

/* --- Öğrenci: antrenör kodu ile --- */
let JOIN = {};
route("/join/student", () => {
  const step2 = JOIN.kind === "student" && JOIN.info;
  return {bare: true, html: authFrame(step2 ? `<div class="card"><div class="tiny muted">Kod: ${esc(JOIN.code)}</div><h2 style="margin:4px 0">Antrenörün: ${esc(JOIN.info.coach_name || "")}</h2><p class="small muted">Şimdi kendine bir hesap oluştur. Sonraki adımda kendi bilgilerini dolduracaksın.</p>
    <form data-form="joinStudent">${userField()}${pwFields()}
    <label class="check"><input type="checkbox" required><span class="small">Bilgilerimin antrenörümle ve velimle paylaşılmasını kabul ediyorum. 18 yaşından küçüksem velim de bunu biliyor ve onaylıyor.</span></label>
    <button class="btn pri block" type="submit">Hesabımı oluştur</button></form></div><button class="btn ghost block" data-act="joinReset">Farklı kod gir</button>`
    : `<div class="card"><h2>Antrenör kodunu gir</h2><p class="small muted">Bu uygulamayı yalnızca antrenörünün verdiği 6 haneli kodla kullanabilirsin.</p>
    <form data-form="checkCode" data-kind="student">${codeInp()}<button class="btn pri block mt" type="submit">Devam</button></form></div><a class="btn ghost block" href="#/welcome">Geri</a>`)};
});
route("/join/parent", () => {
  const step2 = JOIN.kind === "parent" && JOIN.info;
  return {bare: true, html: authFrame(step2 ? `<div class="card"><div class="tiny muted">Veli kodu: ${esc(JOIN.code)}</div><h2 style="margin:4px 0">${esc(JOIN.info.athlete_name || "Öğrenci")}</h2><p class="small muted">Antrenör: ${esc(JOIN.info.coach_name || "")}. Veli hesabıyla çocuğunun gelişimini, programını ve hedeflerini görürsün; değişiklik yapamazsın.</p>
    <form data-form="joinParent">${field("Ad soyad", inp("name", "", 'required autocomplete="name"'))}${userField()}${pwFields()}<button class="btn pri block" type="submit">Veli hesabını oluştur</button></form></div><button class="btn ghost block" data-act="joinReset">Farklı kod gir</button>`
    : `<div class="card"><h2>Veli kodunu gir</h2><p class="small muted">Kodu çocuğun uygulamadaki <b>Profilim → Veli kodu</b> bölümünden oluşturup sana verir.</p>
    <form data-form="checkCode" data-kind="parent">${codeInp()}<button class="btn pri block mt" type="submit">Devam</button></form></div>
    <p class="small muted center">Zaten veli hesabın var mı? <a href="#/login">Giriş yap</a>, sonra Ayarlar'dan başka çocuk ekle.</p><a class="btn ghost block" href="#/welcome">Geri</a>`)};
});
FORM.checkCode = async (d, f) => {
  const code = normCode(d.code); if (code.length !== 6) throw new Error("Kod 6 karakter olmalı.");
  const kind = f.dataset.kind, info = kind === "student" ? await API.inviteInfo(code) : await API.parentCodeInfo(code);
  if (!info) throw new Error(API.mode === "local" ? "Bu kod bu telefonda bulunamadı. Deneme modunda kodlar yalnızca oluşturuldukları telefonda çalışır; farklı telefondan kullanmak için bulut kurulumu gerekir." : (kind === "student" ? "Kod bulunamadı veya daha önce kullanılmış. Antrenörüne sor." : "Veli kodu bulunamadı. Çocuğundan yeni kod iste."));
  JOIN = {kind, code, info}; render();
};
ACT.joinReset = () => { JOIN = {}; render(); };
FORM.joinStudent = async d => {
  checkPw(d);
  await API.signUp(toEmail(d.user), d.password);
  await API.setProfile("athlete", JOIN.info.note || "");
  await API.redeemInvite(JOIN.code);
  JOIN = {}; await afterAuth(); toast("Hoş geldin! Önce kendi bilgilerini doldur.", 3500); go("#/s/me/edit?first=1");
};
FORM.joinParent = async d => {
  checkPw(d);
  await API.signUp(toEmail(d.user), d.password);
  await API.setProfile("parent", d.name.trim());
  const aid = await API.redeemParentCode(JOIN.code);
  JOIN = {}; await afterAuth(); lsSet("rush2.pchild", aid); go("#/p");
};
/* Hesap açılmış ama tamamlanmamışsa (ör. bağlantı koptu) */
route("/finish", () => {
  if (!ST.user) { go("#/welcome"); return null; }
  return {title: "Hesabı tamamla", back: false, html: `${alertBox("warn", "Hesabın tamamlanmamış", "Hesabın oluştu ama bir kodla bağlanmadı. Devam etmek için seç:")}
    <form class="card" data-form="finishCode"><h3>Öğrenciysen: antrenör kodu</h3>${codeInp()}<input type="hidden" name="kind" value="student"><button class="btn pri block mt" type="submit">Bağlan</button></form>
    <form class="card" data-form="finishCode"><h3>Veliysen: veli kodu</h3>${field("Ad soyad", inp("name", "", "required"))}${codeInp()}<input type="hidden" name="kind" value="parent"><button class="btn pri block mt" type="submit">Bağlan</button></form>
    <button class="btn danger block" data-act="logout">Çıkış yap</button>`};
});
FORM.finishCode = async d => {
  if (d.kind === "student") { await API.setProfile("athlete", ""); await API.redeemInvite(d.code); await afterAuth(); go("#/s/me/edit?first=1"); }
  else { await API.setProfile("parent", d.name); const aid = await API.redeemParentCode(d.code); await afterAuth(); lsSet("rush2.pchild", aid); go("#/p"); }
};
ACT.logout = async () => { if (!await confirmBox("Çıkış yapılsın mı?", "Çıkış yap")) return; await flush(); await API.signOut(); ST.user = ST.profile = null; ST.rows = []; buildDB(); go("#/welcome"); };
