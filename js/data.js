// Bu dosya tools/build.mjs (veya admin paneli) tarafından üretilir, elle düzenlemeyin.
const ILANLAR = [
  {
    "no": "2026/952800",
    "baslik": "Valilik Bölgesi Köprülü Kavşak Yapımı (Çankırı)",
    "kurum": "ÇANKIRI BELEDİYESİ FEN İŞLERİ MÜDÜRLÜĞÜ",
    "logoUrl": "",
    "sehir": "ÇANKIRI",
    "tarih": "18.06.2026 10:00",
    "durum": "acik",
    "durumEtiket": "Katılıma Açık",
    "tur": "yapim",
    "turEtiket": "Yapım",
    "kategori": "Açık",
    "id": 1,
    "kurumKisa": "ÇBF",
    "pasif": false,
    "dosyalar": [
      {
        "ad": "01_Yaklasik_Maliyet_Ozeti",
        "tip": "pdf",
        "boyut": "49 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-952800/01_Yaklasik_Maliyet_Ozeti.pdf"
      },
      {
        "ad": "02_FDU_Dogrulama",
        "tip": "pdf",
        "boyut": "40 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-952800/02_FDU_Dogrulama.pdf"
      },
      {
        "ad": "03_Yaklasik_Maliyet_Cetveli",
        "tip": "pdf",
        "boyut": "65 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-952800/03_Yaklasik_Maliyet_Cetveli.pdf"
      },
      {
        "ad": "04_Bilesim_Detaylari",
        "tip": "pdf",
        "boyut": "85 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-952800/04_Bilesim_Detaylari.pdf"
      }
    ]
  },
  {
    "no": "2026/970908",
    "baslik": "MERSİN İLİ MEZİTLİ İLÇESİ MUHİTTİN DEVELİ 24 DERSLİKLİ ORTAOKULU YAPIM İŞİ",
    "kurum": "MERSİN İL MİLLİ EĞİTİM MÜDÜRLÜĞÜ",
    "logoUrl": "https://ekapv2.kik.gov.tr/b_idare/assets/detsislogos/01243a543d29eb959501e1823c476c157f6025ae1bafbb304d8bdb177d4252b7.png",
    "sehir": "MERSİN",
    "tarih": "07.07.2026 10:00",
    "durum": "acik",
    "durumEtiket": "Katılıma Açık",
    "tur": "yapim",
    "turEtiket": "Yapım",
    "kategori": "Açık",
    "id": 2,
    "kurumKisa": "MME",
    "pasif": false,
    "dosyalar": []
  },
  {
    "no": "2026/958487",
    "baslik": "Develi İlçesi Kapalı Katlı Otopark Yapım İşi",
    "kurum": "KAYSERİ BÜYÜKŞEHİR BELEDİYE BAŞKANLIĞI ETÜT VE PROJELER DAİRESİ BAŞKANLIĞI",
    "logoUrl": "https://ekapv2.kik.gov.tr/b_idare/assets/detsislogos/891e8c148dd1abecd0bbbd8f07c26a8467f3d651e6883eca40a2af0092c3aa4d.png",
    "sehir": "KAYSERİ",
    "tarih": "07.07.2026 10:30",
    "durum": "acik",
    "durumEtiket": "Katılıma Açık",
    "tur": "yapim",
    "turEtiket": "Yapım",
    "kategori": "Açık",
    "id": 3,
    "kurumKisa": "KBB",
    "pasif": false,
    "dosyalar": []
  },
  {
    "no": "2026/930385",
    "baslik": "Sincan Su ve Kanalizasyon İşletme Müdürlüğü Sorumluluk Sahasında İçme Suyu ve Kanalizasyon Hatları Arıza Onarımı, Yenileme ve Yeni İmalat Yapım İşi",
    "kurum": "İŞLETMELER 2. BÖLGE DAİRESİ BAŞKANLIĞI",
    "logoUrl": "https://ekapv2.kik.gov.tr/b_idare/assets/detsislogos/edf7cd5c33b99abe557621c1d4af37c14e632fc941559f5cdcf9b84805d2eb8d.png",
    "sehir": "ANKARA",
    "tarih": "08.07.2026 10:30",
    "durum": "acik",
    "durumEtiket": "Katılıma Açık",
    "tur": "yapim",
    "turEtiket": "Yapım",
    "kategori": "Açık",
    "id": 4,
    "kurumKisa": "İBD",
    "pasif": false,
    "dosyalar": []
  },
  {
    "no": "2026/857468",
    "baslik": "Kahramanmaraş İli Afşin İlçesi Defterdarlık Binası Yapım İşi",
    "kurum": "KAHRAMANMARAŞ YATIRIM İZLEME VE KOORDİNASYON BAŞKANLIĞI YATIRIM İZLEME MÜDÜRLÜĞÜ",
    "logoUrl": "https://ekapv2.kik.gov.tr/b_idare/assets/detsislogos/77f35c6c9a0256417fd1b42c95f4a0b63ab54da311eac34c801d1161e0ba835c.png",
    "sehir": "KAHRAMANMARAŞ",
    "tarih": "09.07.2026 10:00",
    "durum": "acik",
    "durumEtiket": "Katılıma Açık",
    "tur": "yapim",
    "turEtiket": "Yapım",
    "kategori": "Açık",
    "id": 5,
    "kurumKisa": "KYİ",
    "pasif": false,
    "dosyalar": []
  },
  {
    "no": "2026/845639",
    "baslik": "İzmir  Bergama, Kınık ve Dikili İlçeleri AT ve TİGH Yapım İşi",
    "kurum": "DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ DSİ 2. BÖLGE MÜDÜRLÜĞÜ",
    "logoUrl": "https://ekapv2.kik.gov.tr/b_idare/assets/detsislogos/c7adfb437cdd9050ad64b4fc07f7eb1db013cdf4cd527f9524a23c3c0e05603e.png",
    "sehir": "İZMİR",
    "tarih": "09.07.2026 10:30",
    "durum": "acik",
    "durumEtiket": "Katılıma Açık",
    "tur": "yapim",
    "turEtiket": "Yapım",
    "kategori": "Açık",
    "id": 6,
    "kurumKisa": "DİG",
    "pasif": false,
    "dosyalar": []
  },
  {
    "no": "2026/963707",
    "baslik": "KARAYOLLARI 5.(MERSİN) BÖLGE MÜDÜRLÜĞÜNE BAĞLI 54.(GAZİANTEP) ŞUBE ŞEFLİĞİ TESİSLERİNİN YAPILMASI İŞİ",
    "kurum": "KARAYOLLARI GENEL MÜDÜRLÜĞÜ KARAYOLLARI 5. BÖLGE MÜDÜRLÜĞÜ",
    "logoUrl": "https://ekapv2.kik.gov.tr/b_idare/assets/detsislogos/d53af0f7d577ca7218761bcfa808c9796eef871a9f38bacf22547ef0789bdcab.png",
    "sehir": "MERSİN",
    "tarih": "10.07.2026 10:00",
    "durum": "acik",
    "durumEtiket": "Katılıma Açık",
    "tur": "yapim",
    "turEtiket": "Yapım",
    "kategori": "Açık",
    "id": 7,
    "kurumKisa": "KGM",
    "pasif": false,
    "dosyalar": [
      {
        "ad": "Yaklasik-Maliyet-Aciklama-Raporu",
        "tip": "docx",
        "boyut": "8 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-963707/Yaklasik-Maliyet-Aciklama-Raporu.docx"
      },
      {
        "ad": "Yaklasik-Maliyet-Hesap-Cetveli",
        "tip": "xlsx",
        "boyut": "17 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-963707/Yaklasik-Maliyet-Hesap-Cetveli.xlsx"
      },
      {
        "ad": "Yaklasik-Maliyet-Icmali",
        "tip": "pdf",
        "boyut": "1 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-963707/Yaklasik-Maliyet-Icmali.pdf"
      }
    ]
  },
  {
    "no": "2026/909878",
    "baslik": "Hakkari Merkez Gazi Mahallesi 252 Ada 6 Parsel Üzerinde Kamp Eğitim Merkezi Yapım İşi",
    "kurum": "HAKKARİ İL ÖZEL İDARESİ MALİ HİZMETLER MÜDÜRLÜĞÜ",
    "logoUrl": "https://ekapv2.kik.gov.tr/b_idare/assets/detsislogos/f0b7fbfa07af9c67e06eb2479af4900071dff8d5c7e6274a653ecaea827f6a2e.png",
    "sehir": "HAKKARİ",
    "tarih": "13.07.2026 10:00",
    "durum": "acik",
    "durumEtiket": "Katılıma Açık",
    "tur": "yapim",
    "turEtiket": "Yapım",
    "kategori": "Açık",
    "id": 8,
    "kurumKisa": "HÖİ",
    "pasif": false,
    "dosyalar": []
  },
  {
    "no": "2026/1032774",
    "baslik": "0-25 mm Temel Malzeme Temini ve Nakli",
    "kurum": "MERAM BELEDİYE BAŞKANLIĞI FEN İŞLERİ MÜDÜRLÜĞÜ",
    "logoUrl": "https://ekapv2.kik.gov.tr/b_idare/assets/detsislogos/11a8c7bdb004bcfbde1b3c975810bd32f3d7c9ddada37d9373e612d9780d428c.png",
    "sehir": "KONYA",
    "tarih": "14.07.2026 10:00",
    "durum": "acik",
    "durumEtiket": "Katılıma Açık",
    "tur": "mal",
    "turEtiket": "Mal",
    "kategori": "Açık",
    "id": 9,
    "kurumKisa": "MBB",
    "pasif": false,
    "dosyalar": []
  },
  {
    "no": "2026/965289",
    "baslik": "Sivas (Merkez) Kanalizasyon, Yağmursuyu ve İçmesuyu İnşaatı Yapım İşi",
    "kurum": "İLLER BANKASI ANONİM ŞİRKETİ GENEL MÜDÜRLÜĞÜ YATIRIM KOORDİNASYON DAİRESİ BAŞKANLIĞI",
    "logoUrl": "https://ekapv2.kik.gov.tr/b_idare/assets/detsislogos/486b23363466c8781eefaef948ae1aa02d0ba7df55b8de2174ccb936791143a9.png",
    "sehir": "ANKARA",
    "tarih": "14.07.2026 10:30",
    "durum": "acik",
    "durumEtiket": "Katılıma Açık",
    "tur": "yapim",
    "turEtiket": "Yapım",
    "kategori": "Açık",
    "id": 10,
    "kurumKisa": "İBA",
    "pasif": false,
    "dosyalar": [
      {
        "ad": "00_Idareye_Sorulacak_Hususlar",
        "tip": "pdf",
        "boyut": "38 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-965289/00_Idareye_Sorulacak_Hususlar.pdf"
      },
      {
        "ad": "01_Yaklasik_Maliyet_Ozeti",
        "tip": "pdf",
        "boyut": "86 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-965289/01_Yaklasik_Maliyet_Ozeti.pdf"
      },
      {
        "ad": "02_FDU_Dogrulama",
        "tip": "pdf",
        "boyut": "97 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-965289/02_FDU_Dogrulama.pdf"
      },
      {
        "ad": "03_Yaklasik_Maliyet_Cetveli",
        "tip": "pdf",
        "boyut": "283 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-965289/03_Yaklasik_Maliyet_Cetveli.pdf"
      },
      {
        "ad": "04_Bilesim_Detaylari",
        "tip": "pdf",
        "boyut": "641 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-965289/04_Bilesim_Detaylari.pdf"
      }
    ]
  },
  {
    "no": "2026/996955",
    "baslik": "Şanlıurfa Suruç Ovası 2 Kısım Tarla İçi Kapalı Drenaj ve TİGH Projesi",
    "kurum": "DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ ARAZİ TOPLULAŞTIRMA VE TARLA İÇİ GELİŞTİRME HİZMETLERİ DAİRESİ BAŞKANLIĞI",
    "logoUrl": "https://ekapv2.kik.gov.tr/b_idare/assets/detsislogos/1cbce49d937ed5d26e49cd944a97cc7b9b74c3d8d9e320a669dd1d94630c3f13.png",
    "sehir": "ANKARA",
    "tarih": "14.07.2026 10:30",
    "durum": "acik",
    "durumEtiket": "Katılıma Açık",
    "tur": "yapim",
    "turEtiket": "Yapım",
    "kategori": "Açık",
    "id": 11,
    "kurumKisa": "DİG",
    "pasif": false,
    "dosyalar": [
      {
        "ad": "01_Yaklasik_Maliyet_Ozeti",
        "tip": "pdf",
        "boyut": "41 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-996955/01_Yaklasik_Maliyet_Ozeti.pdf"
      },
      {
        "ad": "02_FDU_Dogrulama",
        "tip": "pdf",
        "boyut": "39 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-996955/02_FDU_Dogrulama.pdf"
      },
      {
        "ad": "03_Yaklasik_Maliyet_Cetveli",
        "tip": "pdf",
        "boyut": "246 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-996955/03_Yaklasik_Maliyet_Cetveli.pdf"
      },
      {
        "ad": "04_Bilesim_Detaylari",
        "tip": "pdf",
        "boyut": "201 KB",
        "tarih": "13.06.2026",
        "url": "dosyalar/2026-996955/04_Bilesim_Detaylari.pdf"
      }
    ]
  },
  {
    "no": "2026/621765",
    "baslik": "Polatlı - Haymana Devlet Yolu Etüt ve Proje Danışmanlık Hizmeti Alımı İşi",
    "kurum": "KARAYOLLARI GENEL MÜDÜRLÜĞÜ PROGRAM VE İZLEME DAİRESİ BAŞKANLIĞI",
    "logoUrl": "https://ekapv2.kik.gov.tr/b_idare/assets/detsislogos/c11e9f3a422997b6fb280b7143833209861d8a80c65df6c90ee3671384c629ff.png",
    "sehir": "ANKARA",
    "tarih": "22.07.2026 11:00",
    "durum": "acik",
    "durumEtiket": "Katılıma Açık",
    "tur": "danismanlik",
    "turEtiket": "Danışmanlık",
    "kategori": "Belli İstekliler Arasında",
    "id": 12,
    "kurumKisa": "KGM",
    "pasif": false,
    "dosyalar": []
  }
];
