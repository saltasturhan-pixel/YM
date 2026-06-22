#!/usr/bin/env node
// İçerik üreticisi: inspects/*.txt (EKAP kart) + js/icerik.json (pasif + dosya
// listesi) -> js/data.js. Hem admin paneli hem elle çalıştırma bunu kullanır.
// Çalıştırma: node tools/build.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INSPECTS = path.join(ROOT, "inspects");
const ICERIK = path.join(ROOT, "js", "icerik.json");
const OUT = path.join(ROOT, "js", "data.js");

const TUR_MAP = {
  "yapım": ["yapim", "Yapım"],
  "hizmet": ["hizmet", "Hizmet"],
  "mal": ["mal", "Mal"],
  "danışmanlık": ["danismanlik", "Danışmanlık"],
};

function unescapeHtml(s) {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function spanText(htm, cls) {
  const m = htm.match(new RegExp('class="' + cls + '"[^>]*>([\\s\\S]*?)</span>'));
  return m ? unescapeHtml(m[1]).trim() : "";
}

export function parseInspect(htm) {
  const badges = [];
  const re = /class="badge badge[^"]*">\s*([^<]*?)\s*<\/span>/g;
  let m;
  while ((m = re.exec(htm))) badges.push(unescapeHtml(m[1]).trim());

  let logo = "";
  const lm = htm.match(/background-image:\s*url\((?:&quot;|'|")?(https?:\/\/[^"')&]+)/);
  if (lm) logo = lm[1];

  const durumTxt = badges[0] || "";
  const turTxt = badges[1] || "";
  const usulTxt = badges[2] || "";
  const [tur, turEtiket] = TUR_MAP[turTxt.toLocaleLowerCase("tr")] || ["hizmet", turTxt || "Hizmet"];

  const ilSaat = spanText(htm, "il-saat");
  let sehir = "", tarih = ilSaat;
  if (ilSaat.includes(",")) {
    const i = ilSaat.indexOf(",");
    sehir = ilSaat.slice(0, i).trim();
    tarih = ilSaat.slice(i + 1).trim();
  }

  return {
    no: spanText(htm, "ikn"),
    baslik: spanText(htm, "ihale").replace(/^"|"$/g, "").trim(),
    kurum: spanText(htm, "idare"),
    logoUrl: logo,
    sehir, tarih,
    durum: durumTxt.toLocaleLowerCase("tr").includes("açık") ? "acik" : "kapali",
    durumEtiket: durumTxt,
    tur, turEtiket,
    kategori: usulTxt,
  };
}

export function kurumKisa(kurum) {
  const kel = String(kurum).split(/\s+/).filter((k) => k.length > 2).slice(0, 3);
  return kel.map((k) => k[0]).join("").toLocaleUpperCase("tr") || "?";
}

function tarihKey(t) {
  const m = String(t).match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return 8.64e15; // geçersiz -> en sona
  return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]).getTime();
}

export function icerikOku() {
  try { return JSON.parse(fs.readFileSync(ICERIK, "utf8")); } catch { return {}; }
}
export function icerikYaz(obj) {
  fs.writeFileSync(ICERIK, JSON.stringify(obj, null, 2));
}

export function buildData() {
  const icerik = icerikOku();
  const ilanlar = {};
  for (const f of fs.readdirSync(INSPECTS).filter((x) => x.endsWith(".txt")).sort()) {
    const ilan = parseInspect(fs.readFileSync(path.join(INSPECTS, f), "utf8"));
    if (!ilan.no) continue;
    ilanlar[ilan.no] = ilan; // İKN ile tekille
  }

  const sirali = Object.values(ilanlar).sort((a, b) => tarihKey(a.tarih) - tarihKey(b.tarih));
  sirali.forEach((ilan, i) => {
    const ic = icerik[ilan.no] || {};
    ilan.id = i + 1;
    ilan.kurumKisa = kurumKisa(ilan.kurum);
    ilan.pasif = !!ic.pasif;
    ilan.tutar = (typeof ic.tutar === "number") ? ic.tutar : null;
    ilan.paraBirimi = ic.paraBirimi || "TL";
    const klasor = ilan.no.replace("/", "-");
    ilan.dosyalar = (ic.dosyalar || []).map((d) => ({
      ad: d.ad, tip: d.tip, boyut: d.boyut, tarih: d.tarih,
      url: "dosyalar/" + klasor + "/" + d.ad + "." + d.tip,
    }));
  });

  const js = "// Bu dosya tools/build.mjs (veya admin paneli) tarafından üretilir, elle düzenlemeyin.\n" +
             "const ILANLAR = " + JSON.stringify(sirali, null, 2) + ";\n";
  fs.writeFileSync(OUT, js);
  return sirali;
}

if (import.meta.url === "file://" + process.argv[1]) {
  const list = buildData();
  console.log(list.length + " ilan yazıldı -> js/data.js");
}
