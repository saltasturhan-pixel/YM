# Yaklaşık Maliyet Portalı

İhale ve yarışma ilanlarını kart görünümünde listeleyen, her ilanın yanındaki
**"Yaklaşık Maliyet"** butonuna basıldığında o ilana ait yaklaşık maliyet
dosyalarını (PDF, Excel, ZIP vb.) indirilebilir şekilde gösteren statik bir web sitesi.

## Çalıştırma

Hiçbir kurulum gerekmez — `index.html` dosyasını tarayıcıda açmanız yeterli.
İsterseniz basit bir sunucuyla da açabilirsiniz:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Yeni ilan ve dosya ekleme

1. Yaklaşık maliyet dosyalarını `dosyalar/` klasörüne koyun.
2. `js/data.js` içindeki `ILANLAR` listesine yeni bir kayıt ekleyin:

```js
{
  id: 5,
  no: "2026/123456",
  baslik: "İlanın başlığı",
  kurum: "KURUM ADI (BÜYÜK HARF)",
  kurumKisa: "KISA AD",        // logo dairesinde görünür
  logoRenk: "#2e7d4f",
  sehir: "MUĞLA",
  tarih: "01.09.2026 17:00",
  durum: "acik",               // "acik" veya "kapali"
  tur: "yapim",                // "yapim" | "hizmet" | "mal"
  turEtiket: "Yapım",
  kategori: "Açık İhale",
  dosyalar: [
    { ad: "Yaklaşık Maliyet İcmali", tip: "pdf", boyut: "1 MB",
      tarih: "01.08.2026", url: "dosyalar/icmal.pdf" }
  ]
}
```

Desteklenen dosya tipi rozetleri: `pdf`, `xlsx`, `docx`, `zip`.

## Dosya yapısı

```
index.html      Ana sayfa (ilan listesi + yaklaşık maliyet penceresi)
css/style.css   Tüm görünüm
js/data.js      İlan ve dosya verileri (içeriği buradan yönetirsiniz)
js/app.js       Listeleme, arama, filtre ve pencere mantığı
dosyalar/       Yaklaşık maliyet dosyalarını buraya koyun
```
