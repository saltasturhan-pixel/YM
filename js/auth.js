// Parola kapısı ve AES-GCM çözücü. Şifre doğruysa uygulamayı açar,
// belge görüntüleyiciye çözme fonksiyonu sağlar (window.YMCrypto).
(function () {
  if (!window.YM_SECURE) return;

  const ITER_FALLBACK = 200000;
  const subtle = window.crypto && window.crypto.subtle;
  let key = null;          // ana anahtar (MK)

  const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  // Paroladan anahtar sarmalama anahtarı (KEK) türet
  async function deriveKEK(password, salt, iterations) {
    const baseKey = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    return subtle.deriveKey(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      baseKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
  }

  async function gcmDecrypt(k, buf) {
    const b = new Uint8Array(buf);
    return await subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, k, b.slice(12));
  }

  async function decryptBuffer(buf) {
    return await gcmDecrypt(key, buf);
  }
  window.YMCrypto = { decrypt: decryptBuffer, canDownload: false };

  // Parolayı tüm girişlere karşı dene; doğruysa ana anahtarı açar
  async function tryUnlock(password, entries) {
    for (const e of entries) {
      try {
        const kek = await deriveKEK(password, fromB64(e.salt), e.iter || ITER_FALLBACK);
        const mkRaw = await gcmDecrypt(kek, fromB64(e.wrapped));
        const mk = await subtle.importKey("raw", mkRaw, "AES-GCM", false, ["decrypt"]);
        return { mk, canDownload: !!e.canDownload };
      } catch (_) { /* sonraki parola */ }
    }
    return null;
  }

  function buildGate() {
    const gate = document.createElement("div");
    gate.className = "lock-gate";
    gate.innerHTML =
      '<div class="lock-box">' +
      '<div class="lock-logo">YM</div>' +
      "<h1>Yaklaşık Maliyet Portalı</h1>" +
      "<p>Bu portal şifrelidir. Görüntülemek için parolayı girin.</p>" +
      '<form id="lockForm">' +
      '<input type="password" id="lockInput" placeholder="Parola" autocomplete="current-password" autofocus>' +
      '<button type="submit">Giriş</button>' +
      "</form>" +
      '<div class="lock-error" id="lockError" hidden>Parola hatalı, tekrar deneyin.</div>' +
      "</div>";
    document.body.appendChild(gate);
    return gate;
  }

  async function start() {
    if (!subtle || !window.isSecureContext && location.protocol !== "http:" && location.hostname !== "localhost") {
      // çoğu durumda fetch+subtle çalışır; gerçek engel yalnızca file:// protokolüdür
    }
    document.body.classList.add("locked");
    const gate = buildGate();
    const form = gate.querySelector("#lockForm");
    const input = gate.querySelector("#lockInput");
    const err = gate.querySelector("#lockError");

    let cfg;
    try {
      cfg = await (await fetch("js/lock.json", { cache: "no-store" })).json();
    } catch (e) {
      err.textContent = "Kilit dosyası (lock.json) bulunamadı.";
      err.hidden = false;
      return;
    }
    const entries = cfg.entries || [];

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.hidden = true;
      const btn = form.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Kontrol ediliyor…";
      const res = await tryUnlock(input.value, entries);
      if (res) {
        key = res.mk;
        window.YMCrypto.canDownload = res.canDownload;
        gate.remove();
        document.body.classList.remove("locked");
        document.dispatchEvent(new CustomEvent("ym-unlocked", { detail: { canDownload: res.canDownload } }));
      } else {
        err.hidden = false;
        btn.disabled = false;
        btn.textContent = "Giriş";
        input.select();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
