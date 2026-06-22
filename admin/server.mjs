#!/usr/bin/env node
// YM Yönetim Paneli (yerel). Çalıştırma:  node admin/server.mjs
// Sonra tarayıcıda:  http://localhost:5151
//
// Yapabildikleri (v1): ihale kartı ekle/sil, aktif/pasif yap, dosya ekle/sil,
// "Yayınla" ile GitHub'a gönder. Şifreleme ve parola-yetki sistemi korunur.
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { buildData, icerikOku, icerikYaz, parseInspect } from "../tools/build.mjs";
import { tutarBul } from "./lib/tutar.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INSPECTS = path.join(ROOT, "inspects");
const DOSYALAR = path.join(ROOT, "dosyalar");
const LOCK = path.join(ROOT, "js", "lock.json");
const PORT = process.env.PORT || 5151;
const subtle = globalThis.crypto.subtle;

let MK = null; // ana anahtar (giriş yapınca bellekte tutulur)

const b64 = (b) => Buffer.from(b).toString("base64");
const fromB64 = (s) => new Uint8Array(Buffer.from(s, "base64"));
const rnd = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

async function deriveKEK(pw, salt, iter) {
  const base = await subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function gcmEnc(keyRaw, bytes) {
  const key = await subtle.importKey("raw", keyRaw, "AES-GCM", false, ["encrypt"]);
  const iv = rnd(12);
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return Buffer.concat([Buffer.from(iv), Buffer.from(ct)]);
}
async function unwrapMK(pw) {
  const lock = JSON.parse(fs.readFileSync(LOCK, "utf8"));
  for (const e of lock.entries || []) {
    try {
      const kek = await deriveKEK(pw, fromB64(e.salt), e.iter || 200000);
      const buf = fromB64(e.wrapped);
      const raw = await subtle.decrypt({ name: "AES-GCM", iv: buf.slice(0, 12) }, kek, buf.slice(12));
      return new Uint8Array(raw);
    } catch { /* dene */ }
  }
  return null;
}

function boyutStr(n) {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1).replace(".", ",") + " MB";
  return Math.max(1, Math.round(n / 1024)) + " KB";
}
function bugun() {
  const d = new Date();
  const p = (x) => String(x).padStart(2, "0");
  return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear();
}
function klasorAdi(ikn) { return ikn.replace("/", "-"); }

function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}
function body(req) {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => { try { resolve(JSON.parse(d || "{}")); } catch { resolve({}); } });
  });
}
function gitCalistir(args) {
  return new Promise((resolve) => {
    execFile("git", args, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 }, (err, so, se) =>
      resolve({ ok: !err, out: (so || "") + (se || "") }));
  });
}

const ROUTES = {
  async "POST /api/giris"(req, res) {
    const { parola } = await body(req);
    const mk = await unwrapMK(parola || "");
    if (!mk) return json(res, 401, { ok: false, hata: "Parola hatalı" });
    MK = mk;
    json(res, 200, { ok: true });
  },
  async "GET /api/liste"(req, res) {
    json(res, 200, { ok: true, girisli: !!MK, ihaleler: buildData() });
  },
  async "POST /api/ihale-ekle"(req, res) {
    if (!MK) return json(res, 401, { ok: false, hata: "Önce giriş yapın" });
    const { inspect } = await body(req);
    const p = parseInspect(inspect || "");
    if (!p.no) return json(res, 400, { ok: false, hata: "Inspect içinde İKN bulunamadı" });
    const dosyaAdi = (p.no.split("/")[1] || p.no.replace(/\D/g, "")) + ".txt";
    fs.writeFileSync(path.join(INSPECTS, dosyaAdi), inspect.trim() + "\n");
    const ic = icerikOku();
    if (!ic[p.no]) ic[p.no] = { pasif: false, dosyalar: [] };
    icerikYaz(ic);
    json(res, 200, { ok: true, ihaleler: buildData(), eklenen: p.no });
  },
  async "POST /api/ihale-sil"(req, res) {
    if (!MK) return json(res, 401, { ok: false, hata: "Önce giriş yapın" });
    const { ikn } = await body(req);
    const insp = path.join(INSPECTS, ikn.split("/")[1] + ".txt");
    if (fs.existsSync(insp)) fs.rmSync(insp);
    const klas = path.join(DOSYALAR, klasorAdi(ikn));
    if (fs.existsSync(klas)) fs.rmSync(klas, { recursive: true, force: true });
    const ic = icerikOku(); delete ic[ikn]; icerikYaz(ic);
    json(res, 200, { ok: true, ihaleler: buildData() });
  },
  async "POST /api/ihale-durum"(req, res) {
    if (!MK) return json(res, 401, { ok: false, hata: "Önce giriş yapın" });
    const { ikn, pasif } = await body(req);
    const ic = icerikOku();
    if (!ic[ikn]) ic[ikn] = { pasif: false, dosyalar: [] };
    ic[ikn].pasif = !!pasif;
    icerikYaz(ic);
    json(res, 200, { ok: true, ihaleler: buildData() });
  },
  async "POST /api/dosya-ekle"(req, res) {
    if (!MK) return json(res, 401, { ok: false, hata: "Önce giriş yapın" });
    const { ikn, dosyaAdi, veri } = await body(req); // veri: base64 (ham dosya)
    const raw = Buffer.from((veri || "").split(",").pop(), "base64");
    const nokta = dosyaAdi.lastIndexOf(".");
    const ad = (nokta > 0 ? dosyaAdi.slice(0, nokta) : dosyaAdi).replace(/[^\wçğıöşüÇĞİÖŞÜ.\- ]/g, "_");
    const tip = (nokta > 0 ? dosyaAdi.slice(nokta + 1) : "dosya").toLowerCase();
    const klas = path.join(DOSYALAR, klasorAdi(ikn));
    fs.mkdirSync(klas, { recursive: true });
    const enc = await gcmEnc(MK, raw);
    fs.writeFileSync(path.join(klas, ad + "." + tip + ".enc"), enc);
    const ic = icerikOku();
    if (!ic[ikn]) ic[ikn] = { pasif: false, dosyalar: [] };
    ic[ikn].dosyalar = (ic[ikn].dosyalar || []).filter((d) => !(d.ad === ad && d.tip === tip));
    ic[ikn].dosyalar.push({ ad, tip, boyut: boyutStr(raw.length), tarih: bugun() });
    // Tutar boşsa belgeden otomatik bulmaya çalış (Excel/Word)
    let otomatik = null;
    if (ic[ikn].tutar == null) {
      otomatik = await tutarBul(dosyaAdi, raw);
      if (otomatik) { ic[ikn].tutar = otomatik; if (!ic[ikn].paraBirimi) ic[ikn].paraBirimi = "TL"; }
    }
    icerikYaz(ic);
    json(res, 200, { ok: true, ihaleler: buildData(), otomatikTutar: otomatik });
  },
  async "POST /api/ihale-tutar"(req, res) {
    if (!MK) return json(res, 401, { ok: false, hata: "Önce giriş yapın" });
    const { ikn, tutar, paraBirimi } = await body(req);
    const ic = icerikOku();
    if (!ic[ikn]) ic[ikn] = { pasif: false, dosyalar: [] };
    const temiz = String(tutar == null ? "" : tutar).replace(/[^\d]/g, "");
    ic[ikn].tutar = temiz === "" ? null : Number(temiz);
    ic[ikn].paraBirimi = paraBirimi || "TL";
    icerikYaz(ic);
    json(res, 200, { ok: true, ihaleler: buildData() });
  },
  async "POST /api/dosya-sil"(req, res) {
    if (!MK) return json(res, 401, { ok: false, hata: "Önce giriş yapın" });
    const { ikn, ad, tip } = await body(req);
    const f = path.join(DOSYALAR, klasorAdi(ikn), ad + "." + tip + ".enc");
    if (fs.existsSync(f)) fs.rmSync(f);
    const ic = icerikOku();
    if (ic[ikn]) ic[ikn].dosyalar = (ic[ikn].dosyalar || []).filter((d) => !(d.ad === ad && d.tip === tip));
    icerikYaz(ic);
    json(res, 200, { ok: true, ihaleler: buildData() });
  },
  async "POST /api/yayinla"(req, res) {
    if (!MK) return json(res, 401, { ok: false, hata: "Önce giriş yapın" });
    let log = "";
    let r = await gitCalistir(["add", "-A"]); log += r.out;
    r = await gitCalistir(["commit", "-m", "Admin panelinden güncelleme"]); log += r.out + "\n";
    // Hangi dalda olursak olalım, canlı siteyi (main) güncelle
    r = await gitCalistir(["push", "origin", "HEAD:main"]); log += r.out;
    json(res, 200, { ok: r.ok, log: log.trim() || "Gönderilecek değişiklik yok." });
  },
};

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  const key = req.method + " " + u.pathname;
  if (ROUTES[key]) { try { await ROUTES[key](req, res); } catch (e) { json(res, 500, { ok: false, hata: String(e) }); } return; }
  // statik: admin arayüzü
  if (req.method === "GET" && (u.pathname === "/" || u.pathname === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(fs.readFileSync(path.join(ROOT, "admin", "index.html")));
  }
  res.writeHead(404); res.end("yok");
});
server.listen(PORT, () => console.log("Admin paneli:  http://localhost:" + PORT + "   (kapatmak için Ctrl+C)"));
