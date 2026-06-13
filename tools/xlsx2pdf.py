#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Excel (.xlsx) -> PDF: tüm satır/sütun/içerik korunur, metin kıvrılır,
başlık her sayfada tekrar eder, birleşik hücreler (SPAN) ve Türkçe karakterler
doğru çıkar. LibreOffice gerektirmez.

Kullanım: python3 tools/xlsx2pdf.py girdi.xlsx cikti.pdf
Varsayım: 1. satır genel başlık, 2. satır sütun başlıkları, 3.+ veri.
"""
import sys
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, LongTable, TableStyle, Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
pdfmetrics.registerFont(TTFont("DV", FONT))
pdfmetrics.registerFont(TTFont("DVB", FONT_B))

# Sütun ağırlıkları (No, Kalem Kodu, İş Kalemi, Birim, Miktar, B.Fiyat, Tutar, Kesinlik, Açıklama)
WEIGHTS = [3, 8, 22, 5, 6, 9, 10, 6, 31]
RIGHT_COLS = {4, 5, 6}   # sayısal sütunlar sağa yaslı
CENTER_COLS = {0, 3, 7}


def tr_num(v, decimals):
    if decimals is None:
        decimals = 0 if float(v).is_integer() else 2
    s = f"{v:,.{decimals}f}"
    return s.replace(",", "\x00").replace(".", ",").replace("\x00", ".")


def cell_text(v, col, is_data):
    if v is None:
        return ""
    if is_data and isinstance(v, (int, float)) and col in RIGHT_COLS:
        return tr_num(v, None if col == 4 else 2)
    return str(v)


def main(src, out):
    wb = load_workbook(src, data_only=True)
    ws = wb.active
    ncol = ws.max_column
    nrow = ws.max_row

    weights = WEIGHTS if ncol == len(WEIGHTS) else [1] * ncol
    page = landscape(A4)
    usable = page[0] - 16 * mm
    tot = sum(weights)
    col_w = [usable * w / tot for w in weights]

    base = ParagraphStyle("b", fontName="DV", fontSize=6.4, leading=7.8)
    styles = {}
    for key, align, bold in [("L", 0, 0), ("R", 2, 0), ("C", 1, 0), ("H", 1, 1)]:
        styles[key] = ParagraphStyle("s" + key, parent=base, alignment=align,
                                     fontName="DVB" if bold else "DV",
                                     fontSize=7 if bold else 6.4,
                                     textColor=colors.white if bold else colors.black)

    def style_for(col, is_header):
        if is_header:
            return styles["H"]
        if col in RIGHT_COLS:
            return styles["R"]
        if col in CENTER_COLS:
            return styles["C"]
        return styles["L"]

    title_text = str(ws.cell(1, 1).value or "").strip()

    # Tablo gövdesi: 2. satır (başlık) -> tablo satır 0; veri 3.+ -> 1..
    data = []
    for r in range(2, nrow + 1):
        is_header = (r == 2)
        is_data = (r >= 3)
        row = []
        for c in range(1, ncol + 1):
            txt = cell_text(ws.cell(r, c).value, c - 1, is_data)
            txt = txt.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            row.append(Paragraph(txt or "&nbsp;", style_for(c - 1, is_header)))
        data.append(row)

    # Birleşik hücreler -> SPAN (2. satırdan itibaren olanlar; tablo satırı = excel - 2)
    spans = []
    for mr in ws.merged_cells.ranges:
        if mr.min_row < 2:
            continue
        spans.append(("SPAN", (mr.min_col - 1, mr.min_row - 2),
                      (mr.max_col - 1, mr.max_row - 2)))

    ts = TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#b8bdc7")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f4e79")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 1.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#eef2f7")]),
    ] + spans)

    tbl = LongTable(data, colWidths=col_w, repeatRows=1)
    tbl.setStyle(ts)

    doc = SimpleDocTemplate(out, pagesize=page,
                            leftMargin=8 * mm, rightMargin=8 * mm,
                            topMargin=8 * mm, bottomMargin=8 * mm,
                            title="Yaklaşık Maliyet Cetveli")
    head = ParagraphStyle("head", fontName="DVB", fontSize=9, leading=11,
                          spaceAfter=4, textColor=colors.HexColor("#1f4e79"))
    story = []
    if title_text:
        story.append(Paragraph(title_text.replace("&", "&amp;"), head))
    story.append(tbl)
    doc.build(story)
    print("PDF üretildi:", out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
