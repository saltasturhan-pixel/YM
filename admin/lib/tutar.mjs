// Yüklenen dosyadan yaklaşık maliyet tutarını otomatik bulmaya çalışır.
// Excel (.xlsx/.xls) ve Word (.docx) desteklenir; bulunan en büyük makul tutar
// (>= 100.000) döner, yoksa null. PDF bu sürümde otomatik okunmaz (elle girilir).
import { createRequire } from "module";
const require = createRequire(import.meta.url);

let XLSX = null, JSZip = null;
try { XLSX = require("../../vendor/xlsx.full.min.js"); } catch {}
try { JSZip = require("../../vendor/jszip.min.js"); } catch {}

const ESIK = 100000; // 100 bin altı sayıları tutar sayma

function trSayilariBul(metin) {
  // 1.272.175.240,51 veya 245.757.672 gibi binlik ayraçlı sayılar
  const out = [];
  const re = /\d{1,3}(?:\.\d{3})+(?:,\d+)?/g;
  let m;
  while ((m = re.exec(metin))) {
    const n = parseFloat(m[0].replace(/\./g, "").replace(",", "."));
    if (!isNaN(n)) out.push(n);
  }
  return out;
}

async function fromXlsx(bytes) {
  if (!XLSX) return null;
  const wb = XLSX.read(bytes, { type: "buffer" });
  let max = 0;
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    for (const k in ws) {
      if (k[0] === "!") continue;
      const c = ws[k];
      if (typeof c.v === "number" && isFinite(c.v) && c.v > max) max = c.v;
    }
  }
  return max >= ESIK ? Math.round(max) : null;
}

async function fromDocx(bytes) {
  if (!JSZip) return null;
  const zip = await JSZip.loadAsync(bytes);
  const f = zip.file("word/document.xml");
  if (!f) return null;
  const xml = await f.async("string");
  const metin = xml.replace(/<[^>]+>/g, " ");
  const sayilar = trSayilariBul(metin).filter((n) => n >= ESIK);
  return sayilar.length ? Math.round(Math.max(...sayilar)) : null;
}

export async function tutarBul(dosyaAdi, bytes) {
  const tip = (dosyaAdi.split(".").pop() || "").toLowerCase();
  try {
    if (tip === "xlsx" || tip === "xls") return await fromXlsx(bytes);
    if (tip === "docx") return await fromDocx(bytes);
  } catch { /* sessizce geç */ }
  return null;
}
