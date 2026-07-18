#!/usr/bin/env node
// Bir ihalenin şifreli (.enc) belgelerini GEÇİCİ olarak çözüp
// dosyalar/<ikn>/_kaynak/ altına düz haliyle yazar. Amaç: rapor (idareye
// sorulacak hususlar, can alıcı noktalar, YM eksikleri) üretmek için belgeleri
// okunur kılmak. _kaynak/ .gitignore'dadır; commit'lenmez.
//
// Kullanım:
//   YM_SIFRE="parola" node tools/rapor-kaynak.mjs 2026/1172672
//   (veya klasör adıyla)  node tools/rapor-kaynak.mjs 2026-1172672
//
// Çıktı: çözülen dosyaların yolları. PDF'ler pdftotext ile .txt'e de dökülür
// (varsa), xlsx'ler openpyxl ile .csv'ye (varsa) — okuması kolay olsun diye.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOSYALAR = path.join(ROOT, "dosyalar");
const LOCK = path.join(ROOT, "js", "lock.json");
const subtle = globalThis.crypto.subtle;

const sifre = process.env.YM_SIFRE;
const arg = process.argv[2];
if (!sifre) { console.error("HATA: YM_SIFRE ortam değişkeni gerekli."); process.exit(1); }
if (!arg) { console.error("HATA: İKN verin. Örn: node tools/rapor-kaynak.mjs 2026/1172672"); process.exit(1); }

const klasorAdi = arg.replace("/", "-");
const klas = path.join(DOSYALAR, klasorAdi);
if (!fs.existsSync(klas)) { console.error("HATA: klasör yok: " + klas); process.exit(1); }

const fromB64 = (s) => new Uint8Array(Buffer.from(s, "base64"));

async function deriveKEK(pw, salt, iter) {
  const base = await subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
}
async function gcmDecrypt(keyRaw, buf) {
  const key = await subtle.importKey("raw", keyRaw, "AES-GCM", false, ["decrypt"]);
  const b = new Uint8Array(buf);
  return new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, key, b.slice(12)));
}
async function unwrapMK(pw) {
  const lock = JSON.parse(fs.readFileSync(LOCK, "utf8"));
  for (const e of lock.entries || []) {
    try {
      const kek = await deriveKEK(pw, fromB64(e.salt), e.iter || 200000);
      const buf = fromB64(e.wrapped);
      return new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: buf.slice(0, 12) }, kek, buf.slice(12)));
    } catch { /* sonraki parola */ }
  }
  return null;
}

const MK = await unwrapMK(sifre);
if (!MK) { console.error("HATA: Parola hatalı (hiçbir giriş açılamadı)."); process.exit(1); }

const cikti = path.join(klas, "_kaynak");
fs.mkdirSync(cikti, { recursive: true });

const encler = fs.readdirSync(klas).filter((f) => f.endsWith(".enc"));
if (!encler.length) { console.error("Bu klasörde .enc dosyası yok."); process.exit(0); }

const yazilan = [];
for (const enc of encler) {
  const raw = fs.readFileSync(path.join(klas, enc));
  const duz = await gcmDecrypt(MK, raw);
  const ad = enc.replace(/\.enc$/, ""); // örn 00_Idareye_Sorulacak_Hususlar.pdf
  const hedef = path.join(cikti, ad);
  fs.writeFileSync(hedef, Buffer.from(duz));
  yazilan.push(hedef);

  // Kolay okunsun diye metne dök
  try {
    if (ad.toLowerCase().endsWith(".pdf")) {
      const txt = hedef.replace(/\.pdf$/i, ".txt");
      execFileSync("pdftotext", ["-layout", hedef, txt]);
      yazilan.push(txt);
    } else if (/\.xlsx?$/i.test(ad)) {
      const csv = hedef.replace(/\.xlsx?$/i, ".csv");
      execFileSync("python3", ["-c",
        "import sys,csv,openpyxl\n" +
        "wb=openpyxl.load_workbook(sys.argv[1],data_only=True)\n" +
        "w=csv.writer(open(sys.argv[2],'w',newline=''))\n" +
        "for ws in wb.worksheets:\n" +
        "  w.writerow(['### SAYFA: '+ws.title])\n" +
        "  [w.writerow(['' if c is None else c for c in r]) for r in ws.iter_rows(values_only=True)]\n",
        hedef, csv]);
      yazilan.push(csv);
    }
  } catch (e) {
    console.error("  (metne dökülemedi: " + ad + " — " + (e.message || e) + ")");
  }
}

console.log("\nÇözülen kaynaklar (" + klasorAdi + "):");
for (const y of yazilan) console.log("  " + path.relative(ROOT, y));
console.log("\nBu klasör .gitignore'da; commit'lenmez. Rapor üretilince silebilirsin:");
console.log("  rm -rf " + path.relative(ROOT, cikti));
