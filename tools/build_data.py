#!/usr/bin/env python3
"""EKAP kart inspect'lerinden js/data.js dosyasını üretir.

Kullanım:
  1. EKAP'tan kopyalanan kart inspect'ini (HTML) inspects/ klasörüne .txt olarak koyun.
  2. Varsa yaklaşık maliyet dosyalarını dosyalar/<ikn>/ klasörüne koyun
     (örn. dosyalar/2026-963707/icmal.pdf — İKN'deki "/" yerine "-" kullanılır).
  3. python3 tools/build_data.py
"""
import html
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INSPECTS = ROOT / "inspects"
DOSYALAR = ROOT / "dosyalar"
LOGOS = ROOT / "logos"
OUT = ROOT / "js" / "data.js"

TUR_MAP = {
    "yapım": ("yapim", "Yapım"),
    "hizmet": ("hizmet", "Hizmet"),
    "mal": ("mal", "Mal"),
    "danışmanlık": ("danismanlik", "Danışmanlık"),
}


def span(cls, htm):
    m = re.search(r'class="%s"[^>]*>(.*?)</span>' % cls, htm, re.S)
    return html.unescape(m.group(1)).strip() if m else ""


def parse_inspect(htm):
    badges = [html.unescape(b).strip() for b in re.findall(r'class="badge badge[^"]*">\s*([^<]*?)\s*</span>', htm, re.S)]
    logo = ""
    m = re.search(r'background-image:\s*url\((?:&quot;|\'|")?(https?://[^"\')&]+)', htm)
    if m:
        logo = m.group(1)
        # logos/ klasöründe aynı adla yerel kopya varsa onu kullan
        yerel = LOGOS / logo.rsplit("/", 1)[-1]
        if yerel.is_file():
            logo = "logos/" + yerel.name

    durum_txt = badges[0] if badges else ""
    tur_txt = badges[1] if len(badges) > 1 else ""
    usul_txt = badges[2] if len(badges) > 2 else ""

    tur, tur_etiket = TUR_MAP.get(tur_txt.lower(), ("hizmet", tur_txt or "Hizmet"))

    il_saat = span("il-saat", htm)
    sehir, tarih = "", il_saat
    if "," in il_saat:
        sehir, tarih = [p.strip() for p in il_saat.split(",", 1)]

    return {
        "no": span("ikn", htm),
        "baslik": span("ihale", htm).strip('"').strip(),
        "kurum": span("idare", htm),
        "logoUrl": logo,
        "sehir": sehir,
        "tarih": tarih,
        "durum": "acik" if "açık" in durum_txt.lower() else "kapali",
        "durumEtiket": durum_txt,
        "tur": tur,
        "turEtiket": tur_etiket,
        "kategori": usul_txt,
    }


def kurum_kisa(kurum):
    kelimeler = [k for k in kurum.split() if len(k) > 2][:3]
    return "".join(k[0] for k in kelimeler).upper() or "?"


def boyut_str(n):
    if n >= 1024 * 1024:
        return ("%.1f MB" % (n / 1024 / 1024)).replace(".", ",")
    return "%d KB" % max(1, n // 1024)


def dosya_listesi(ikn):
    klasor = DOSYALAR / ikn.replace("/", "-")
    if not klasor.is_dir():
        return []
    sonuc = []
    for f in sorted(klasor.iterdir()):
        if not f.is_file():
            continue
        # Şifreli kopyaları (.enc) ve yer tutucu .txt'leri listeleme; yalnızca asıl belgeler
        if f.suffix.lower() in (".enc", ".txt"):
            continue
        st = f.stat()
        sonuc.append({
            "ad": f.stem,
            "tip": f.suffix.lstrip(".").lower() or "dosya",
            "boyut": boyut_str(st.st_size),
            "tarih": datetime.fromtimestamp(st.st_mtime).strftime("%d.%m.%Y"),
            "url": "dosyalar/%s/%s" % (klasor.name, f.name),
        })
    return sonuc


def tarih_anahtari(ilan):
    try:
        return datetime.strptime(ilan["tarih"], "%d.%m.%Y %H:%M")
    except ValueError:
        return datetime.max


def main():
    ilanlar = {}
    for txt in sorted(INSPECTS.glob("*.txt")):
        ilan = parse_inspect(txt.read_text(encoding="utf-8"))
        if not ilan["no"]:
            print("UYARI: %s içinde İKN bulunamadı, atlandı" % txt.name)
            continue
        ilanlar[ilan["no"]] = ilan  # aynı İKN'den geleni tekille

    sirali = sorted(ilanlar.values(), key=tarih_anahtari)
    for i, ilan in enumerate(sirali, 1):
        ilan["id"] = i
        ilan["kurumKisa"] = kurum_kisa(ilan["kurum"])
        ilan["dosyalar"] = dosya_listesi(ilan["no"])

    js = ("// Bu dosya tools/build_data.py tarafından üretilir, elle düzenlemeyin.\n"
          "// İlan eklemek için inspects/ klasörüne EKAP kart inspect'ini koyup script'i çalıştırın.\n"
          "const ILANLAR = %s;\n" % json.dumps(sirali, ensure_ascii=False, indent=2))
    OUT.write_text(js, encoding="utf-8")
    print("%d ilan yazıldı -> %s" % (len(sirali), OUT.relative_to(ROOT)))


if __name__ == "__main__":
    main()
