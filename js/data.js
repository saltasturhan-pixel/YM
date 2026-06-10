// İlan verileri. Yeni ilan eklemek için bu listeye yeni bir kayıt ekleyin.
// Yaklaşık maliyet dosyalarını "dosyalar/" klasörüne koyup url alanına yolunu yazın.
const ILANLAR = [
  {
    id: 1,
    no: "2026/859200",
    baslik: "Sosyal, Kültürel ve İdari Hizmetler Binası Mimari Proje Yarışması",
    kurum: "MUĞLA BÜYÜKŞEHİR BELEDİYE BAŞKANLIĞI ETÜT VE PROJELER DAİRESİ BAŞKANLIĞI",
    kurumKisa: "MUĞLA BŞB",
    logoRenk: "#2e7d4f",
    sehir: "MUĞLA",
    tarih: "12.08.2026 17:00",
    durum: "acik",            // acik | kapali
    tur: "hizmet",            // yapim | hizmet | mal
    turEtiket: "Hizmet",
    kategori: "Tasarım Yarışması",
    dosyalar: [
      { ad: "Yaklaşık Maliyet İcmal Tablosu", tip: "pdf",  boyut: "1,2 MB", tarih: "01.06.2026", url: "dosyalar/ornek-icmal.pdf" },
      { ad: "Yaklaşık Maliyet Hesap Cetveli", tip: "xlsx", boyut: "486 KB", tarih: "01.06.2026", url: "dosyalar/ornek-cetvel.xlsx" },
      { ad: "Birim Fiyat Analizleri", tip: "pdf", boyut: "3,8 MB", tarih: "01.06.2026", url: "dosyalar/ornek-analiz.pdf" }
    ]
  },
  {
    id: 2,
    no: "2026/771435",
    baslik: "Atatürk Caddesi Üstyapı Yenileme ve Yağmursuyu Hattı Yapım İşi",
    kurum: "MENTEŞE BELEDİYE BAŞKANLIĞI FEN İŞLERİ MÜDÜRLÜĞÜ",
    kurumKisa: "MENTEŞE BLD",
    logoRenk: "#1d4ed8",
    sehir: "MUĞLA",
    tarih: "24.07.2026 10:30",
    durum: "acik",
    tur: "yapim",
    turEtiket: "Yapım",
    kategori: "Açık İhale",
    dosyalar: [
      { ad: "Yaklaşık Maliyet İcmali", tip: "pdf", boyut: "940 KB", tarih: "28.05.2026", url: "#" },
      { ad: "Metraj ve Keşif Özeti", tip: "xlsx", boyut: "1,1 MB", tarih: "28.05.2026", url: "#" }
    ]
  },
  {
    id: 3,
    no: "2026/689012",
    baslik: "12 Derslikli İlkokul Binası İkmal İnşaatı",
    kurum: "MUĞLA İL ÖZEL İDARESİ YATIRIM VE İNŞAAT MÜDÜRLÜĞÜ",
    kurumKisa: "İL ÖZEL İD.",
    logoRenk: "#b3541e",
    sehir: "MUĞLA",
    tarih: "30.06.2026 14:00",
    durum: "acik",
    tur: "yapim",
    turEtiket: "Yapım",
    kategori: "Açık İhale",
    dosyalar: [
      { ad: "Yaklaşık Maliyet Dosyası (Tümü)", tip: "zip", boyut: "12,4 MB", tarih: "20.05.2026", url: "#" }
    ]
  },
  {
    id: 4,
    no: "2026/602387",
    baslik: "Kent Müzesi Teşhir-Tanzim Uygulamaları Mal Alımı",
    kurum: "BODRUM BELEDİYE BAŞKANLIĞI KÜLTÜR İŞLERİ MÜDÜRLÜĞÜ",
    kurumKisa: "BODRUM BLD",
    logoRenk: "#0e7490",
    sehir: "MUĞLA",
    tarih: "15.05.2026 11:00",
    durum: "kapali",
    tur: "mal",
    turEtiket: "Mal Alımı",
    kategori: "Pazarlık Usulü",
    dosyalar: [
      { ad: "Yaklaşık Maliyet Cetveli", tip: "xlsx", boyut: "230 KB", tarih: "02.04.2026", url: "#" },
      { ad: "Piyasa Fiyat Araştırma Tutanağı", tip: "pdf", boyut: "640 KB", tarih: "02.04.2026", url: "#" }
    ]
  }
];
