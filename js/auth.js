// Parola kapısı ve AES-GCM çözücü + oturum hatırlama (localStorage).
// Giriş yapılınca (yenileme/sekme/tarayıcı kapansa bile) içerde kalır; yalnız "Çıkış" ile temizlenir.
(function () {
  if (!window.YM_SECURE) return;

  const ITER_FALLBACK = 200000;
  const subtle = window.crypto && window.crypto.subtle;
  const STORE = window.localStorage;   // sekme/tarayıcı kapansa da kalır; yalnız "Çıkış" ile temizlenir
  const STORE_KEY = "ym_session_v1";
  let key = null; // ana anahtar (MK)

  const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const toB64 = (bytes) => btoa(String.fromCharCode.apply(null, new Uint8Array(bytes)));

  async function deriveKEK(password, salt, iterations) {
    const baseKey = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    return subtle.deriveKey({ name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      baseKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  }
  async function gcmDecrypt(k, buf) {
    const b = new Uint8Array(buf);
    return await subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, k, b.slice(12));
  }
  async function decryptBuffer(buf) { return await gcmDecrypt(key, buf); }
  window.YMCrypto = { decrypt: decryptBuffer, canDownload: false };

  async function importMK(mkRaw) { return await subtle.importKey("raw", mkRaw, "AES-GCM", false, ["decrypt"]); }

  async function tryUnlock(password, entries) {
    for (const e of entries) {
      try {
        const kek = await deriveKEK(password, fromB64(e.salt), e.iter || ITER_FALLBACK);
        const mkRaw = await gcmDecrypt(kek, fromB64(e.wrapped));
        const mk = await importMK(mkRaw);
        return { mk, mkRaw: new Uint8Array(mkRaw), canDownload: !!e.canDownload };
      } catch (_) { /* sonraki parola */ }
    }
    return null;
  }

  function saveSession(mkRaw, canDownload) {
    try { STORE.setItem(STORE_KEY, JSON.stringify({ mk: toB64(mkRaw), d: !!canDownload })); } catch (_) {}
  }
  function clearSession() { try { STORE.removeItem(STORE_KEY); } catch (_) {} }
  async function restoreSession() {
    try {
      const raw = STORE.getItem(STORE_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      return { mk: await importMK(fromB64(o.mk)), canDownload: !!o.d };
    } catch (_) { return null; }
  }

  function addLogoutButton() {
    if (document.getElementById("ymLogout")) return;
    const b = document.createElement("button");
    b.id = "ymLogout"; b.textContent = "Çıkış";
    b.style.cssText = "position:fixed;top:10px;right:12px;z-index:9999;border:0;border-radius:8px;padding:7px 13px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;background:#c0392b;color:#fff;opacity:.92";
    b.addEventListener("click", () => { clearSession(); location.reload(); });
    document.body.appendChild(b);
  }
  window.YMLogout = () => { clearSession(); location.reload(); };

  function enter(mk, canDownload) {
    key = mk;
    window.YMCrypto.canDownload = canDownload;
    document.body.classList.remove("locked");
    addLogoutButton();
    document.dispatchEvent(new CustomEvent("ym-unlocked", { detail: { canDownload } }));
  }

  function buildGate() {
    const gate = document.createElement("div");
    gate.className = "lock-gate";
    gate.innerHTML =
      '<div class="lock-box"><div class="lock-logo">YM</div>' +
      "<h1>Yaklaşık Maliyet Portalı</h1>" +
      "<p>Bu portal şifrelidir. Görüntülemek için parolayı girin.</p>" +
      '<form id="lockForm"><input type="password" id="lockInput" placeholder="Parola" autocomplete="current-password" autofocus>' +
      '<button type="submit">Giriş</button></form>' +
      '<div class="lock-error" id="lockError" hidden>Parola hatalı, tekrar deneyin.</div></div>';
    document.body.appendChild(gate);
    return gate;
  }

  async function start() {
    const restored = await restoreSession();
    if (restored) { enter(restored.mk, restored.canDownload); return; }

    document.body.classList.add("locked");
    const gate = buildGate();
    const form = gate.querySelector("#lockForm");
    const input = gate.querySelector("#lockInput");
    const err = gate.querySelector("#lockError");

    let cfg;
    try { cfg = await (await fetch("js/lock.json", { cache: "no-store" })).json(); }
    catch (e) { err.textContent = "Kilit dosyası (lock.json) bulunamadı."; err.hidden = false; return; }
    const entries = cfg.entries || [];

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.hidden = true;
      const btn = form.querySelector("button");
      btn.disabled = true; btn.textContent = "Kontrol ediliyor…";
      const res = await tryUnlock(input.value, entries);
      if (res) { saveSession(res.mkRaw, res.canDownload); gate.remove(); enter(res.mk, res.canDownload); }
      else { err.hidden = false; btn.disabled = false; btn.textContent = "Giriş"; input.select(); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
