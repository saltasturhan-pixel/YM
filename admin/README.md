# YM Yönetim Paneli (yerel)

İhale kartlarını ve dosyaları kod yazmadan, görsel olarak yönetmek için.

## Çalıştırma
Bilgisayarında **Node.js** kurulu olmalı (başka bir şey gerekmez).

```bash
node admin/server.mjs
```

Sonra tarayıcıda aç: **http://localhost:5151**
- Site parolanla giriş yap (indirme yetkisi olan parola önerilir; parolanı güvenli bir yerde sakla, dokümana yazma).

## Yapabildiklerin (v1)
- **Yeni ihale kartı:** EKAP kart "inspect"ini (HTML) kutuya yapıştır → "Kart oluştur".
- **Dosya ekle / çıkar:** Her ihalenin altından dosya seç → "Dosya ekle". Dosya
  otomatik **şifrelenir** (.enc) ve karta bağlanır. "Çıkar" ile silinir.
- **Pasife al / Aktif yap:** İhaleyi siteden gizler / geri açar.
- **Sil:** İhaleyi ve tüm dosyalarını kaldırır.
- **Yayınla:** Değişiklikleri GitHub'a (canlı siteye) gönderir.

## Notlar
- Değişiklikler `js/icerik.json` (pasif + dosya listesi) ve `inspects/*.txt`
  (kart bilgisi) üzerinde tutulur; site `js/data.js` bunlardan **tools/build.mjs**
  ile üretilir (panel bunu otomatik yapar).
- Excel'i otomatik PDF'e çevirme bu sürümde yok (sonra eklenebilir); şimdilik
  PDF/Excel/Word dosyalarını olduğu gibi ekleyebilirsin.
- Parola/yetki yönetimi için: `tools/parola.mjs` (ekle/sil/indirme izni).
