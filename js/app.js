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

  let activeFilter = "hepsi";
  let query = "";

  const ICONS = {
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-7v18L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M2 10h.01M22 14h-.01"/></svg>'
  };

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function matches(ilan) {
    if (activeFilter === "acik" && ilan.durum !== "acik") return false;
    if (["yapim", "hizmet", "mal"].includes(activeFilter) && ilan.tur !== activeFilter) return false;
    if (query) {
      const hay = (ilan.no + " " + ilan.baslik + " " + ilan.kurum).toLocaleLowerCase("tr");
      if (!hay.includes(query)) return false;
    }
    return true;
  }

  function render() {
    const visible = ILANLAR.filter(matches);
    countEl.textContent = visible.length + " ilan listeleniyor";
    emptyEl.hidden = visible.length > 0;

    listEl.innerHTML = visible.map(ilan => `
      <article class="ilan-card">
        <div class="kurum-logo" style="background:${ilan.logoRenk}">${escapeHtml(ilan.kurumKisa)}</div>
        <div class="ilan-body">
          <div class="badge-row">
            <span class="badge ${ilan.durum === "acik" ? "badge-acik" : "badge-kapali"}">
              ${ilan.durum === "acik" ? "Katılıma Açık" : "Sonuçlandı"}
            </span>
            <span class="badge badge-tur">${escapeHtml(ilan.turEtiket)}</span>
            <span class="badge badge-kategori">${escapeHtml(ilan.kategori)}</span>
          </div>
          <h2 class="ilan-title">
            <span class="ilan-no">${escapeHtml(ilan.no)}</span>
            <span>${escapeHtml(ilan.baslik)}</span>
          </h2>
          <p class="ilan-kurum">${escapeHtml(ilan.kurum)}</p>
        </div>
        <div class="ilan-side">
          <span class="ilan-tarih">${escapeHtml(ilan.sehir)}, ${escapeHtml(ilan.tarih)}</span>
          <div class="ilan-actions">
            <button class="ym-btn" data-ym="${ilan.id}" title="Yaklaşık maliyet dosyalarını görüntüle">
              ${ICONS.money} Yaklaşık Maliyet <span class="count">${ilan.dosyalar.length}</span>
            </button>
            <button class="icon-btn" title="Duyuru">${ICONS.megaphone}</button>
            <button class="icon-btn" title="Sabitle">${ICONS.pin}</button>
          </div>
        </div>
      </article>
    `).join("");
  }

  function openModal(ilan) {
    modalTitle.textContent = "Yaklaşık Maliyet Dosyaları";
    modalSubtitle.textContent = ilan.no + " — " + ilan.baslik;
    modalFiles.innerHTML = ilan.dosyalar.map(d => `
      <a class="file-row" href="${escapeHtml(d.url)}" ${d.url !== "#" ? "download" : ""}>
        <span class="file-icon ${d.tip}">${d.tip.toUpperCase()}</span>
        <span class="file-info">
          <span class="file-name">${escapeHtml(d.ad)}</span><br>
          <span class="file-meta">${escapeHtml(d.boyut)} · Yüklenme: ${escapeHtml(d.tarih)}</span>
        </span>
        <span class="file-dl">${ICONS.download}</span>
      </a>
    `).join("");
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  listEl.addEventListener("click", e => {
    const btn = e.target.closest("[data-ym]");
    if (!btn) return;
    const ilan = ILANLAR.find(i => i.id === Number(btn.dataset.ym));
    if (ilan) openModal(ilan);
  });

  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

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
