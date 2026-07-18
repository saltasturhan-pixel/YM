#!/usr/bin/env node
// Parola yönetimi (dosyaları YENİDEN şifrelemeden). Ana anahtarı mevcut bir
// parolayla açar, üstünde değişiklik yapar.
//
//   node tools/parola.mjs liste                         YM_SIFRE=mevcut
//   node tools/parola.mjs ekle <yeni-parola> [indir]    YM_SIFRE=mevcut  (indir -> indirme izni açık)
//   node tools/parola.mjs sil <etiket>
//   node tools/parola.mjs indir <etiket> <ac|kapa>
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCK = path.join(ROOT, "js", "lock.json");
const ITER = 200000;
const subtle = globalThis.crypto.subtle;
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
function load() {
  const lock = JSON.parse(fs.readFileSync(LOCK, "utf8"));
  if (lock.v !== 2) throw new Error("lock.json v2 değil; önce encrypt.mjs ile kurun.");
  return lock;
}
function save(lock) { fs.writeFileSync(LOCK, JSON.stringify(lock, null, 2)); }

async function openMK(lock, sifre) {
  for (const e of lock.entries) {
    try { return await gcmDec(await deriveKEK(sifre, fromB64(e.salt), e.iter || ITER), fromB64(e.wrapped)); }
    catch { /* dene */ }
  }
  throw new Error("YM_SIFRE mevcut parolalardan birini açmıyor.");
}

const [cmd, a, b] = process.argv.slice(2);
const lock = load();

if (cmd === "liste") {
  for (const e of lock.entries) console.log(`${e.label}\tindirme: ${e.canDownload ? "AÇIK" : "kapalı"}`);
} else if (cmd === "ekle") {
  const mk = await openMK(lock, process.env.YM_SIFRE || "");
  const salt = rnd(16);
  const wrapped = await gcmEnc(await deriveKEK(a, salt, ITER), mk);
  lock.entries.push({ label: process.env.YM_ETIKET || a.slice(0, 6), salt: b64(salt), iter: ITER, wrapped: b64(wrapped), canDownload: b === "indir" });
  save(lock);
  console.log(`Eklendi: parola='${a}' indirme=${b === "indir" ? "AÇIK" : "kapalı"}`);
} else if (cmd === "sil") {
  const n = lock.entries.length;
  lock.entries = lock.entries.filter((e) => e.label !== a);
  if (lock.entries.length === n) console.log("Etiket bulunamadı:", a);
  else { save(lock); console.log("Silindi:", a); }
} else if (cmd === "indir") {
  const e = lock.entries.find((x) => x.label === a);
  if (!e) console.log("Etiket bulunamadı:", a);
  else { e.canDownload = (b === "ac"); save(lock); console.log(`${a} indirme: ${e.canDownload ? "AÇIK" : "kapalı"}`); }
} else {
  console.log("Komutlar: liste | ekle <parola> [indir] | sil <etiket> | indir <etiket> <ac|kapa>");
}
