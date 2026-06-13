#!/usr/bin/env node
// Yaklaşık maliyet dosyalarını AES-GCM ile şifreler.
// Kullanım:  YM_SIFRE="parolaniz" node tools/encrypt.mjs
//
// - dosyalar/ altındaki tüm belgeleri (.enc olmayan) şifreler -> aynı ada .enc ekler
// - Her .enc dosyasi:  [12 bayt IV][sifreli veri]
// - js/lock.json dosyasina salt + dogrulama jetonu yazar
// Düz (şifresiz) orijinaller .gitignore ile depoya GÖNDERİLMEZ; sadece .enc gider.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOSYALAR = path.join(ROOT, "dosyalar");
const LOCK = path.join(ROOT, "js", "lock.json");
const ITER = 200000;
const subtle = globalThis.crypto.subtle;

const sifre = process.env.YM_SIFRE;
if (!sifre) {
  console.error('HATA: Parola verilmedi.  Örnek:  YM_SIFRE="parolaniz" node tools/encrypt.mjs');
  process.exit(1);
}

const b64 = (buf) => Buffer.from(buf).toString("base64");

async function deriveKey(password, salt) {
  const baseKey = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptBytes(key, bytes) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return Buffer.concat([Buffer.from(iv), Buffer.from(ct)]);
}

function walk(dir) {
  let out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) out = out.concat(walk(p));
    else if (st.isFile() && !name.endsWith(".enc") && !name.endsWith(".txt")) out.push(p);
  }
  return out;
}

const fromB64 = (s) => new Uint8Array(Buffer.from(s, "base64"));

async function decryptBytes(key, buf) {
  const bytes = new Uint8Array(buf);
  const iv = bytes.slice(0, 12);
  const ct = bytes.slice(12);
  return await subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
}

const main = async () => {
  // SABİT ANAHTAR: lock.json varsa onun salt'ını yeniden kullan; böylece her
  // çalıştırmada anahtar değişmez ve eski şifreli dosyalar (önbellekte kalmış
  // olsa bile) hep çözülebilir. Yeni salt sadece parola değiştirilince üretilir.
  const yeniIste = process.env.YM_YENI_SALT === "1";
  let salt, iterations = ITER, verifyB64, key;

  if (fs.existsSync(LOCK) && !yeniIste) {
    const lock = JSON.parse(fs.readFileSync(LOCK, "utf8"));
    salt = fromB64(lock.salt);
    iterations = lock.iterations || ITER;
    key = await deriveKey(sifre, salt);
    // Verilen parola mevcut kilidi açıyor mu? Açmıyorsa yanlış parolayla
    // her şeyi bozmamak için dur.
    try {
      const plain = await decryptBytes(key, fromB64(lock.verify));
      if (Buffer.from(plain).toString() !== "YM-VERIFY") throw new Error();
    } catch (_) {
      console.error("HATA: Verilen parola mevcut js/lock.json ile uyuşmuyor.");
      console.error("Parolayı DEĞİŞTİRMEK istiyorsan:  YM_YENI_SALT=1 YM_SIFRE=\"yeni\" node tools/encrypt.mjs");
      process.exit(1);
    }
    verifyB64 = lock.verify;
  } else {
    salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    key = await deriveKey(sifre, salt);
    verifyB64 = b64(await encryptBytes(key, new TextEncoder().encode("YM-VERIFY")));
  }

  let sayac = 0;
  if (fs.existsSync(DOSYALAR)) {
    for (const file of walk(DOSYALAR)) {
      const enc = await encryptBytes(key, fs.readFileSync(file));
      fs.writeFileSync(file + ".enc", enc);
      sayac++;
    }
  }

  fs.writeFileSync(
    LOCK,
    JSON.stringify({ v: 1, iterations, salt: b64(salt), verify: verifyB64 }, null, 2)
  );
  console.log(sayac + " dosya şifrelendi (sabit anahtar). js/lock.json korundu.");
  console.log("Not: Düz dosyalar .gitignore ile depoya gitmez; sadece .enc yüklenir.");
};
main();
