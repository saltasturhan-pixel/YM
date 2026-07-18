// Tam ekran gömülü belge görüntüleyici: PDF, Excel (xlsx/xls), Word (docx)
import * as pdfjsLib from "../vendor/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("../vendor/pdf.worker.min.mjs", import.meta.url).href;

const el = (id) => document.getElementById(id);
const viewer = el("viewer");
const stage = el("viewerStage");
const filesNav = el("viewerFiles");

let files = [];
let activeIndex = 0;
let zoom = 1;
let current = null; // açık olan ihale (rapor ekranı için)

function ext(name) {
  return (String(name).split(".").pop() || "").toLowerCase();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function applyZoom() {
  const c = stage.querySelector(".viewer-content");
  if (c) c.style.zoom = zoom;
}

async function fetchBuffer(url) {
  const secure = window.YM_SECURE && window.YMCrypto;
  const realUrl = secure ? url + ".enc" : url;
  const res = await fetch(realUrl, { cache: "no-cache" });
  if (!res.ok) throw new Error("Dosya bulunamadı (" + res.status + ")");
  const buf = await res.arrayBuffer();
  return secure ? await window.YMCrypto.decrypt(buf) : buf;
}

async function renderPdf(buf, container) {
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const dpr = window.devicePixelRatio || 1;
  const maxW = Math.min(container.clientWidth || 900, 1000);
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const fit = Math.min(2, maxW / base.width);
    const viewport = page.getViewport({ scale: fit * dpr });
    const canvas = document.createElement("canvas");
    canvas.className = "pdf-page";
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = viewport.width / dpr + "px";
    canvas.style.height = viewport.height / dpr + "px";
    container.appendChild(canvas);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  }
}

function renderXlsx(buf, container) {
  const wb = XLSX.read(buf, { type: "array" });
  const tabs = document.createElement("div");
  tabs.className = "sheet-tabs";
  const wrap = document.createElement("div");
  wrap.className = "sheet-wrap";

  function show(name) {
    wrap.innerHTML = XLSX.utils.sheet_to_html(wb.Sheets[name], { editable: false });
  }
  wb.SheetNames.forEach((name, i) => {
    const b = document.createElement("button");
    b.className = "sheet-tab" + (i === 0 ? " active" : "");
    b.textContent = name;
    b.addEventListener("click", () => {
      tabs.querySelectorAll(".sheet-tab").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      show(name);
    });
    tabs.appendChild(b);
  });
  if (wb.SheetNames.length > 1) container.appendChild(tabs);
  container.appendChild(wrap);
  show(wb.SheetNames[0]);
}

async function renderDocx(buf, container) {
  // docx-preview global: window.docx
  await window.docx.renderAsync(new Blob([buf]), container, null, {
    className: "docx",
    inWrapper: true,
    ignoreWidth: false,
    breakPages: true
  });
}

async function loadFile(index) {
  activeIndex = index;
  zoom = 1;
  const file = files[index];
  filesNav.querySelectorAll(".vfile").forEach((x) => x.classList.toggle("active", x.dataset.i === String(index)));
  const dl = el("viewerDownload");
  const canDl = !window.YM_SECURE || (window.YMCrypto && window.YMCrypto.canDownload);
  dl.style.display = canDl ? "" : "none";
  dl.href = canDl ? file.url : "#";
  if (canDl) dl.setAttribute("download", "");

  stage.innerHTML = '<div class="viewer-info">Yükleniyor…</div>';
  const type = (file.tip || ext(file.url)).toLowerCase();
  try {
    const buf = await fetchBuffer(file.url);
    stage.innerHTML = "";
    const content = document.createElement("div");
    content.className = "viewer-content type-" + type;
    stage.appendChild(content);
    if (type === "pdf") await renderPdf(buf, content);
    else if (type === "xlsx" || type === "xls") renderXlsx(buf, content);
    else if (type === "docx") await renderDocx(buf, content);
    else {
      content.innerHTML =
        '<div class="viewer-info">Bu dosya türü önizlenemiyor (' +
        escapeHtml(type) +
        '). <br><a href="' + escapeHtml(file.url) + '" download>Dosyayı indirin</a>.</div>';
    }
    applyZoom();
    stage.scrollTop = 0;
  } catch (e) {
    stage.innerHTML =
      '<div class="viewer-info error">Belge açılamadı.<br><small>' +
      escapeHtml(e.message || String(e)) +
      '</small><br><a href="' + escapeHtml(file.url) + '" download>Dosyayı indirip açın</a></div>';
  }
}

function buildNav() {
  const rapor =
    '<button class="vfile vfile-rapor" data-i="rapor">' +
    '<span class="vfile-ic rapor">ÖZET</span>' +
    '<span class="vfile-ad">Rapor</span></button>';
  const fileBtns = files
    .map(
      (f, i) =>
        '<button class="vfile" data-i="' + i + '">' +
        '<span class="vfile-ic ' + escapeHtml(f.tip || ext(f.url)) + '">' +
        escapeHtml((f.tip || ext(f.url)).toUpperCase()) + "</span>" +
        '<span class="vfile-ad">' + escapeHtml(f.ad) + "</span></button>"
    )
    .join("");
  filesNav.innerHTML = rapor + fileBtns;
}

function fmtTutar(n) {
  return Math.round(Number(n)).toLocaleString("tr-TR");
}

function raporListe(baslik, arr, cls, altbaslik) {
  if (!Array.isArray(arr) || !arr.length) return "";
  return (
    '<section class="rapor-blok ' + cls + '">' +
    "<h3>" + escapeHtml(baslik) + "</h3>" +
    (altbaslik ? '<p class="rapor-blok-alt">' + escapeHtml(altbaslik) + "</p>" : "") +
    "<ol>" +
    arr.map((x) => "<li>" + escapeHtml(x) + "</li>").join("") +
    "</ol></section>"
  );
}

function renderReportHtml(ilan) {
  const r = ilan.rapor || {};
  const kunyeSatir = (t, v) =>
    v ? '<div class="rapor-kunye-satir"><span>' + escapeHtml(t) + "</span><strong>" + escapeHtml(v) + "</strong></div>" : "";
  const tutar =
    ilan.tutar != null
      ? '<div class="rapor-tutar' + (ilan.paraBirimi === "USD" || ilan.paraBirimi === "EUR" ? " doviz" : "") + '">' +
        '<span class="etk">Yaklaşık Maliyet</span>' +
        '<span class="deg">' + fmtTutar(ilan.tutar) + " <small>" + escapeHtml(ilan.paraBirimi || "TL") + "</small></span></div>"
      : "";
  const dolu = r.ozet || (r.hususlar && r.hususlar.length) || (r.canAlici && r.canAlici.length) || (r.tavsiyeler && r.tavsiyeler.length);
  return (
    '<div class="rapor">' +
    '<div class="rapor-head">' +
    '<div class="rapor-no">' + escapeHtml(ilan.no) + "</div>" +
    '<h2 class="rapor-baslik">' + escapeHtml(ilan.baslik) + "</h2>" +
    '<div class="rapor-kurum">' + escapeHtml(ilan.kurum) + "</div>" +
    "</div>" +
    tutar +
    (r.ozet ? '<p class="rapor-ozet">' + escapeHtml(r.ozet) + "</p>" : "") +
    raporListe("Yaklaşık Maliyeti Değiştirebilecek Kalemler", r.hususlar, "blok-husus", "İdareye sorulması önerilir") +
    raporListe("Dikkat!", r.canAlici, "blok-can") +
    raporListe("Tavsiyeler", r.tavsiyeler, "blok-ym") +
    '<div class="rapor-kunye">' +
    kunyeSatir("İhale Türü", ilan.turEtiket) +
    kunyeSatir("İhale Usulü", ilan.kategori) +
    kunyeSatir("Durum", ilan.durumEtiket) +
    kunyeSatir("Yer / Tarih", (ilan.sehir ? ilan.sehir + " · " : "") + (ilan.tarih || "")) +
    "</div>" +
    (dolu ? "" : '<p class="rapor-bos">Bu ihale için özet rapor henüz hazırlanmadı. Aşağıdan belgeleri inceleyebilirsiniz.</p>') +
    (files.length
      ? '<button class="rapor-belgeler-btn" data-rapor-belgeler>Belgeleri İncele — ' + files.length + " dosya →</button>"
      : '<p class="rapor-bos">Bu ihale için yüklenmiş belge yok.</p>') +
    "</div>"
  );
}

function showReport() {
  filesNav.querySelectorAll(".vfile").forEach((x) => x.classList.toggle("active", x.dataset.i === "rapor"));
  el("viewerDownload").style.display = "none";
  stage.innerHTML = renderReportHtml(current);
  stage.scrollTop = 0;
  const cta = stage.querySelector("[data-rapor-belgeler]");
  if (cta) cta.addEventListener("click", () => { if (files.length) loadFile(0); });
}

function open(ilan) {
  current = ilan;
  files = ilan.dosyalar || [];
  el("viewerIhaleNo").textContent = ilan.no;
  viewer.hidden = false;
  document.body.style.overflow = "hidden";
  buildNav();
  showReport();
}

function close() {
  viewer.hidden = true;
  document.body.style.overflow = "";
  stage.innerHTML = "";
}

filesNav.addEventListener("click", (e) => {
  const b = e.target.closest(".vfile");
  if (!b) return;
  if (b.dataset.i === "rapor") showReport();
  else loadFile(Number(b.dataset.i));
});
el("viewerClose").addEventListener("click", close);
el("viewerZoomIn").addEventListener("click", () => { zoom = Math.min(3, zoom + 0.2); applyZoom(); });
el("viewerZoomOut").addEventListener("click", () => { zoom = Math.max(0.5, zoom - 0.2); applyZoom(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !viewer.hidden) close(); });

window.YMViewer = { open };
