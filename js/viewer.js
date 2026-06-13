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
  filesNav.querySelectorAll(".vfile").forEach((x, i) => x.classList.toggle("active", i === index));
  el("viewerFileName").textContent = file.ad + (file.tip ? "." + file.tip : "");
  const dl = el("viewerDownload");
  dl.href = file.url;
  dl.setAttribute("download", "");

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

function buildFileNav(ilan) {
  filesNav.innerHTML = files
    .map(
      (f, i) =>
        '<button class="vfile" data-i="' + i + '">' +
        '<span class="vfile-ic ' + escapeHtml(f.tip || ext(f.url)) + '">' +
        escapeHtml((f.tip || ext(f.url)).toUpperCase()) + "</span>" +
        '<span class="vfile-ad">' + escapeHtml(f.ad) + "</span></button>"
    )
    .join("");
}

function open(ilan) {
  files = ilan.dosyalar || [];
  el("viewerIhaleNo").textContent = ilan.no;
  viewer.hidden = false;
  document.body.style.overflow = "hidden";
  if (!files.length) {
    filesNav.innerHTML = "";
    el("viewerFileName").textContent = "";
    stage.innerHTML =
      '<div class="viewer-info">Bu ihale için henüz yaklaşık maliyet dosyası eklenmedi.</div>';
    return;
  }
  buildFileNav(ilan);
  loadFile(0);
}

function close() {
  viewer.hidden = true;
  document.body.style.overflow = "";
  stage.innerHTML = "";
}

filesNav.addEventListener("click", (e) => {
  const b = e.target.closest(".vfile");
  if (b) loadFile(Number(b.dataset.i));
});
el("viewerClose").addEventListener("click", close);
el("viewerZoomIn").addEventListener("click", () => { zoom = Math.min(3, zoom + 0.2); applyZoom(); });
el("viewerZoomOut").addEventListener("click", () => { zoom = Math.max(0.5, zoom - 0.2); applyZoom(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !viewer.hidden) close(); });

window.YMViewer = { open };
