# Yaklaşık Maliyet Portalı

EKAP ihale kartlarını birebir görünümle listeleyen ve her ihale için
**"Yaklaşık Maliyet"** dosyalarını (PDF, Excel, ZIP...) indirilebilir şekilde
sunan statik web sitesi. İlanlar, EKAP'tan kopyalanan kart inspect'lerinden
otomatik üretilir.

## Çalıştırma

Kurulum gerekmez — `index.html` dosyasını tarayıcıda açmanız yeterli.

```bash
python3 -m http.server 8000   # istenirse: http://localhost:8000
```

## Yeni ihale ekleme (EKAP inspect ile)

1. EKAP'ta ihale kartının inspect'ini (HTML) kopyalayıp `inspects/` klasörüne
   `.txt` olarak kaydedin (örn. `inspects/963707.txt`).
2. Yaklaşık maliyet dosyalarını İKN ile adlandırılmış klasöre koyun
   (İKN'deki `/` yerine `-`):

   ```
   dosyalar/2026-963707/yaklasik-maliyet-icmali.pdf
   dosyalar/2026-963707/hesap-cetveli.xlsx
   ```

3. Üreticiyi çalıştırın:

   ```bash
   python3 tools/build_data.py
   ```

Script inspect'ten İKN, başlık, idare, il/tarih, rozetleri (durum, tür, usul)
ve kurum logosunun EKAP adresini çıkarır; `dosyalar/<ikn>/` içindeki dosyaları
boyut ve tarihleriyle birlikte karta bağlar ve `js/data.js`'i baştan yazar.
Aynı İKN'ye ait birden fazla inspect varsa tekilleştirilir; liste ihale
tarihine göre sıralanır.

## Dosya yapısı

```
index.html           Ana sayfa
css/style.css        Görünüm
js/app.js            Listeleme, arama, filtre, yaklaşık maliyet penceresi
js/data.js           ÜRETİLİR — elle düzenlemeyin
tools/build_data.py  inspect → data.js dönüştürücü
inspects/            EKAP kart inspect'leri (.txt)
dosyalar/<ikn>/      İhale başına yaklaşık maliyet dosyaları
```

## Notlar

- Kurum logoları doğrudan EKAP'tan (`ekapv2.kik.gov.tr`) yüklenir; logo
  yüklenemezse kurum adının baş harfleri gösterilir.
- Kart inspect'inde ihale detay bağlantısı bulunmadığından megafon (İlan Gör)
  butonu şimdilik EKAP ana sayfasına gider.
