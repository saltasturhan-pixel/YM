#!/usr/bin/env node
// Dosyaları AES-GCM ile şifreler. "Ana anahtar (MK) + çok parola" yapısı:
//  - Dosyalar tek bir ana anahtarla (MK) şifrelenir.
//  - Her parola, MK'yi kendi türetilmiş anahtarıyla "sarmalar" (wrap) ve kendi
//    yetkisini taşır (canDownload = indirme izni).
//  - Parola eklemek/çıkarmak/değiştirmek dosyaları YENİDEN şifrelemez (bkz. parola.mjs).
//
// Kullanım:
//   İlk kurulum / sıfırdan:   YM_YENI=1 YM_SIFRE="parola" [YM_INDIR=1] node tools/encrypt.mjs
//   Dosya ekledikten sonra:   YM_SIFRE="mevcut-parola" node tools/encrypt.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOSYALAR = path.join(ROOT, "dosyalar");
const LOCK = path.join(ROOT, "js", "lock.json");
const ITER = 200000;
const subtle = globalThis.crypto.subtle;

const sifre = process.env.YM_SIFRE;
const yeni = process.env.YM_YENI === "1";
const indir = process.env.YM_INDIR === "1";
const etiket = process.env.YM_ETIKET || "genel";
if (!sifre) {
  console.error('HATA: YM_SIFRE gerekli. Örn: YM_YENI=1 YM_SIFRE="parola" node tools/encrypt.mjs');
  process.exit(1);
}

const b64 = (b) => Buffer.from(b).toString("base64");
const fromB64 = (s) => new Uint8Array(Buffer.from(s, "base64"));
const rnd = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

async function deriveKEK(pw, salt, iter) {
  const base = await subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function gcmEnc(key, bytes) {
  const iv = rnd(12);
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return Buffer.concat([Buffer.from(iv), Buffer.from(ct)]);
}
async function gcmDec(key, buf) {
  const b = new Uint8Array(buf);
  return new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, key, b.slice(12)));
}
async function makeEntry(pw, mkRaw, canDownload, label) {
  const salt = rnd(16);
  const kek = await deriveKEK(pw, salt, ITER);
  const wrapped = await gcmEnc(kek, mkRaw);
  return { label, salt: b64(salt), iter: ITER, wrapped: b64(wrapped), canDownload: !!canDownload };
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
  let lock = null;
  if (fs.existsSync(LOCK)) { try { lock = JSON.parse(fs.readFileSync(LOCK, "utf8")); } catch { lock = null; } }

  let mkRaw, entries;
  if (lock && lock.v === 2 && !yeni) {
    // Mevcut ana anahtarı, verilen parolayla aç
    entries = lock.entries;
    mkRaw = null;
    for (const e of entries) {
      try {
        const kek = await deriveKEK(sifre, fromB64(e.salt), e.iter || ITER);
        mkRaw = await gcmDec(kek, fromB64(e.wrapped));
        break;
      } catch { /* sonraki parola */ }
    }
    if (!mkRaw) {
      console.error("HATA: Verilen parola mevcut kilidi açmıyor.");
      console.error('Yeni kilit kurmak için: YM_YENI=1 YM_SIFRE="parola" node tools/encrypt.mjs');
      process.exit(1);
    }
  } else {
    // Sıfırdan: yeni ana anahtar + tek parola
    mkRaw = rnd(32);
    entries = [await makeEntry(sifre, mkRaw, indir, etiket)];
  }

  const mkKey = await subtle.importKey("raw", mkRaw, "AES-GCM", false, ["encrypt", "decrypt"]);
  let sayac = 0;
  if (fs.existsSync(DOSYALAR)) {
    for (const file of walk(DOSYALAR)) {
      fs.writeFileSync(file + ".enc", await gcmEnc(mkKey, fs.readFileSync(file)));
      sayac++;
    }
  }
  fs.writeFileSync(LOCK, JSON.stringify({ v: 2, entries }, null, 2));
  console.log(`${sayac} dosya şifrelendi. Parola sayısı: ${entries.length}.`);
  for (const e of entries) console.log(`  - ${e.label}  (indirme: ${e.canDownload ? "AÇIK" : "kapalı"})`);
};
main();
