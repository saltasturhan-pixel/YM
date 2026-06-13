// Parola kapısı ve AES-GCM çözücü. Şifre doğruysa uygulamayı açar,
// belge görüntüleyiciye çözme fonksiyonu sağlar (window.YMCrypto).
(function () {
  if (!window.YM_SECURE) return;

  const ITER_FALLBACK = 200000;
  const subtle = window.crypto && window.crypto.subtle;
  let key = null;

  const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function deriveKey(password, salt, iterations) {
    const baseKey = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    return subtle.deriveKey(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  }

  async function decryptBuffer(buf) {
    const bytes = new Uint8Array(buf);
    const iv = bytes.slice(0, 12);
    const ct = bytes.slice(12);
    return await subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  }
  window.YMCrypto = { decrypt: decryptBuffer };

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
    const salt = fromB64(cfg.salt);
    const verify = fromB64(cfg.verify);
    const iterations = cfg.iterations || ITER_FALLBACK;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.hidden = true;
      const btn = form.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Kontrol ediliyor…";
      try {
        const k = await deriveKey(input.value, salt, iterations);
        // doğrulama jetonunu çöz
        const iv = verify.slice(0, 12);
        const ct = verify.slice(12);
        const plain = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, k, ct);
        if (new TextDecoder().decode(plain) !== "YM-VERIFY") throw new Error("bad");
        key = k;
        gate.remove();
        document.body.classList.remove("locked");
      } catch (_) {
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
