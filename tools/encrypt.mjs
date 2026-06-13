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

const main = async () => {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(sifre, salt);

  // Doğrulama jetonu: parolanin doğru olup olmadığını anlamak için
  const verifyCt = await encryptBytes(key, new TextEncoder().encode("YM-VERIFY"));

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
    JSON.stringify({ v: 1, iterations: ITER, salt: b64(salt), verify: b64(verifyCt) }, null, 2)
  );
  console.log(sayac + " dosya şifrelendi. js/lock.json güncellendi.");
  console.log("Not: Düz dosyalar .gitignore ile depoya gitmez; sadece .enc yüklenir.");
};
main();
