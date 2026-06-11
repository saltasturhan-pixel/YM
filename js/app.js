(function () {
  const listEl = document.getElementById("ilanList");
  const searchEl = document.getElementById("searchInput");
  const filtersEl = document.getElementById("filters");
  const countEl = document.getElementById("resultCount");
  const emptyEl = document.getElementById("emptyState");

  const modal = document.getElementById("ymModal");
  const modalTitle = document.getElementById("ymModalTitle");
  const modalSubtitle = document.getElementById("ymModalSubtitle");
  const modalFiles = document.getElementById("ymFileList");
  const modalClose = document.getElementById("ymModalClose");

  const detayModal = document.getElementById("detayModal");
  const detaySubtitle = document.getElementById("detayModalSubtitle");
  const detayBody = document.getElementById("detayBody");
  const detayClose = document.getElementById("detayModalClose");

  let activeFilter = "hepsi";
  let query = "";

  const ICONS = {
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M2 10h.01M22 14h-.01"/></svg>'
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function matches(ilan) {
    if (activeFilter === "acik" && ilan.durum !== "acik") return false;
    if (["yapim", "hizmet", "mal", "danismanlik"].includes(activeFilter) && ilan.tur !== activeFilter) return false;
    if (query) {
      const hay = (ilan.no + " " + ilan.baslik + " " + ilan.kurum + " " + ilan.sehir).toLocaleLowerCase("tr");
      if (!hay.includes(query)) return false;
    }
    return true;
  }

  function logoHtml(ilan) {
    const fallback = '<span class="kurum-initials">' + escapeHtml(ilan.kurumKisa) + "</span>";
    if (!ilan.logoUrl) return '<div class="kurum-logo">' + fallback + "</div>";
    return '<div class="kurum-logo">' +
      '<img src="' + escapeHtml(ilan.logoUrl) + '" alt="" loading="lazy" ' +
      "onerror=\"this.style.display='none';this.nextElementSibling.style.display='grid'\">" +
      '<span class="kurum-initials" style="display:none">' + escapeHtml(ilan.kurumKisa) + "</span></div>";
  }

  function render() {
    const visible = ILANLAR.filter(matches);
    countEl.textContent = visible.length + " ilan listeleniyor";
    emptyEl.hidden = visible.length > 0;

    listEl.innerHTML = visible.map(ilan => `
      <article class="ilan-card">
        ${logoHtml(ilan)}
        <div class="ilan-body">
          <div class="first-row">
            <div class="badge-row">
              <span class="badge ${ilan.durum === "acik" ? "badge-acik" : "badge-kapali"}">${escapeHtml(ilan.durumEtiket || (ilan.durum === "acik" ? "Katılıma Açık" : "Sonuçlandı"))}</span>
              <span class="badge badge-${escapeHtml(ilan.tur)}">${escapeHtml(ilan.turEtiket)}</span>
              ${ilan.kategori ? '<span class="badge badge-kategori">' + escapeHtml(ilan.kategori) + "</span>" : ""}
            </div>
            <div class="ilan-meta">
              <span class="ilan-tarih">${escapeHtml(ilan.sehir)}, ${escapeHtml(ilan.tarih)}</span>
              <button class="ym-btn" data-ym="${ilan.id}" title="Yaklaşık maliyet dosyalarını görüntüle">
                ${ICONS.money} Yaklaşık Maliyet <span class="count">${ilan.dosyalar.length}</span>
              </button>
            </div>
          </div>
          <h2 class="ilan-title">
            <span class="ilan-no">${escapeHtml(ilan.no)}</span>
            <span class="ilan-baslik" data-detay="${ilan.id}" title="${escapeHtml(ilan.baslik)}">${escapeHtml(ilan.baslik)}</span>
          </h2>
          <p class="ilan-kurum">${escapeHtml(ilan.kurum)}</p>
        </div>
      </article>
    `).join("");
  }

  function openModal(ilan) {
    modalTitle.textContent = "Yaklaşık Maliyet Dosyaları";
    modalSubtitle.textContent = ilan.no + " — " + ilan.baslik;
    if (ilan.dosyalar.length === 0) {
      modalFiles.innerHTML = '<p class="no-files">Bu ihale için henüz yaklaşık maliyet dosyası eklenmedi.</p>';
    } else {
      modalFiles.innerHTML = ilan.dosyalar.map(d => `
        <a class="file-row" href="${escapeHtml(d.url)}" download>
          <span class="file-icon ${escapeHtml(d.tip)}">${escapeHtml(d.tip.toUpperCase())}</span>
          <span class="file-info">
            <span class="file-name">${escapeHtml(d.ad)}</span><br>
            <span class="file-meta">${escapeHtml(d.boyut)} · Yüklenme: ${escapeHtml(d.tarih)}</span>
          </span>
          <span class="file-dl">${ICONS.download}</span>
        </a>
      `).join("");
    }
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  function openDetay(ilan) {
    detaySubtitle.textContent = ilan.no + " — " + ilan.baslik;
    const satirlar = [
      ["İhale Kayıt Numarası (İKN)", ilan.no],
      ["İhale Adı", ilan.baslik],
      ["İhaleyi Yapan İdare", ilan.kurum],
      ["İhale Türü", ilan.turEtiket],
      ["İhale Usulü", ilan.kategori],
      ["İhale Durumu", ilan.durumEtiket],
      ["İhale Yeri", ilan.sehir],
      ["İhale Tarih - Saati", ilan.tarih],
      ["Yaklaşık Maliyet Dosyası", ilan.dosyalar.length + " adet"]
    ];
    detayBody.innerHTML = '<table class="detay-table">' +
      satirlar.filter(s => s[1]).map(s =>
        "<tr><th>" + escapeHtml(s[0]) + "</th><td>" + escapeHtml(s[1]) + "</td></tr>"
      ).join("") + "</table>" +
      '<p class="detay-note">Ayrıntılı ilan metni için EKAP üzerinden İKN ile sorgulama yapabilirsiniz.</p>';
    detayModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeDetay() {
    detayModal.hidden = true;
    document.body.style.overflow = "";
  }

  listEl.addEventListener("click", e => {
    const ymBtn = e.target.closest("[data-ym]");
    if (ymBtn) {
      const ilan = ILANLAR.find(i => i.id === Number(ymBtn.dataset.ym));
      if (ilan) openModal(ilan);
      return;
    }
    const baslik = e.target.closest("[data-detay]");
    if (baslik) {
      const ilan = ILANLAR.find(i => i.id === Number(baslik.dataset.detay));
      if (ilan) openDetay(ilan);
    }
  });

  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  detayClose.addEventListener("click", closeDetay);
  detayModal.addEventListener("click", e => { if (e.target === detayModal) closeDetay(); });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (!modal.hidden) closeModal();
    if (!detayModal.hidden) closeDetay();
  });

  searchEl.addEventListener("input", () => {
    query = searchEl.value.trim().toLocaleLowerCase("tr");
    render();
  });

  filtersEl.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    filtersEl.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.filter;
    render();
  });

  render();
})();
