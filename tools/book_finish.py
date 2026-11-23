"""Tahap akhir buku PDF (dipanggil oleh tools/build-book.mjs).

Menambahkan header berjalan, nomor halaman, tab tepi berwarna per Bagian,
label halaman (romawi/arab), bookmark, metadata, lalu menggabungkan sampul
dan mengompres hasil. Argumen: path plan.json.
"""
import json
import shutil
import sys

import fitz

plan = json.load(open(sys.argv[1], encoding="utf-8"))
MM = 72 / 25.4


def rgb(hex_color):
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def roman(n):
    table = [(1000, "m"), (900, "cm"), (500, "d"), (400, "cd"), (100, "c"), (90, "xc"),
             (50, "l"), (40, "xl"), (10, "x"), (9, "ix"), (5, "v"), (4, "iv"), (1, "i")]
    out = ""
    for v, r in table:
        while n >= v:
            out += r
            n -= v
    return out


doc = fitz.open(plan["interior"])
main_start = plan["mainStart"]
no_decor = set(plan["noDecor"])

# Halaman pertama daftar isi = halaman pertama yang memuat tautan internal.
toc_start = next(p.number for p in doc if any(l.get("nameddest") for l in p.get_links()))
regions = plan["regions"] + [[toc_start, "Daftar Isi", "Daftar Isi", "#1565c0", -1]]
regions.sort(key=lambda r: r[0])

font = fitz.Font(fontfile=plan["font"])
font_bold = fitz.Font(fontfile=plan["fontBold"])
GRAY = rgb("#6b7686")
LINE = rgb("#d5dbe4")


def region_for(idx):
    cur = None
    for r in regions:
        if r[0] <= idx:
            cur = r
        else:
            break
    return cur


def fit(text, f, size, width):
    if f.text_length(text, fontsize=size) <= width:
        return text
    while text and f.text_length(text + "…", fontsize=size) > width:
        text = text[:-1]
    return text.rstrip(" ·") + "…"


def page_label(idx):
    return str(idx - main_start + 1) if idx >= main_start else roman(idx + 1)


def is_blank(page):
    # Halaman kosong sisipan (agar bab dimulai di halaman kanan) tidak diberi header/footer.
    return not page.get_text("text").strip() and not page.get_images()


W, H = doc[0].rect.width, doc[0].rect.height
for page in doc:
    idx = page.number
    if idx in no_decor or is_blank(page):
        continue
    reg = region_for(idx)
    if reg is None:
        continue
    start, left_text, right_text, color, tab = reg
    recto = idx % 2 == 0  # halaman isi pertama adalah halaman kanan
    inner, outer = (20 * MM, 14 * MM) if recto else (14 * MM, 20 * MM)
    x0, x1 = (inner, W - outer) if recto else (outer, W - inner)
    accent = rgb(color)

    page.insert_font(fontname="pjsm", fontbuffer=font.buffer)
    page.insert_font(fontname="pjsb", fontbuffer=font_bold.buffer)

    # Header berjalan: kiri = bab, kanan = subbab. Halaman pembuka wilayah tidak diberi header.
    if idx != start:
        text = right_text if recto else left_text
        size = 6.8
        text = fit(text, font, size, (x1 - x0) * 0.86)
        tw = font.text_length(text, fontsize=size)
        y = 12.5 * MM
        tx = x1 - tw if recto else x0
        page.insert_text((tx, y), text, fontname="pjsm", fontsize=size, color=GRAY)
        page.draw_line((x0, y + 2.6 * MM), (x1, y + 2.6 * MM), color=LINE, width=0.45)
        # penanda warna kecil di ujung luar garis header
        bar_x = x1 - 9 * MM if recto else x0
        page.draw_line((bar_x, y + 2.6 * MM), (bar_x + 9 * MM, y + 2.6 * MM), color=accent, width=1.3)

    # Nomor halaman di sudut luar bawah
    num = page_label(idx)
    size = 8.2
    nw = font_bold.text_length(num, fontsize=size)
    ny = H - 11 * MM
    nx = x1 - nw if recto else x0
    page.insert_text((nx, ny), num, fontname="pjsb", fontsize=size, color=accent)
    title = fit(plan["title"], font, 6.3, (x1 - x0) * 0.6)
    tw = font.text_length(title, fontsize=6.3)
    tx = x0 if recto else x1 - tw
    page.insert_text((tx, ny), title, fontname="pjsm", fontsize=6.3, color=GRAY)

    # Tab tepi (thumb index) per Bagian untuk halaman bab
    if tab >= 0:
        tab_h = 17 * MM
        top = 34 * MM + tab * (tab_h + 2.5 * MM)
        rect = fitz.Rect(W - 3.2 * MM, top, W, top + tab_h) if recto else fitz.Rect(0, top, 3.2 * MM, top + tab_h)
        page.draw_rect(rect, color=None, fill=accent, width=0)

# Label halaman agar penampil PDF menampilkan nomor yang sama dengan cetakan.
interior_labels = [
    {"startpage": 0, "prefix": "", "style": "r", "firstpagenum": 1},
    {"startpage": main_start, "prefix": "", "style": "D", "firstpagenum": 1},
]
doc.set_page_labels(interior_labels)

outline = []
for lvl, title, pg in plan["outline"]:
    if pg is None:
        pg = toc_start
    outline.append([lvl, title, pg + 1])
doc.set_toc(outline)

meta = {
    "title": plan["title"],
    "author": plan["author"],
    "subject": plan["subject"],
    "keywords": "Flutter, Dart, GetX, MVC, REST API, SQLite, Hive, Supabase, pemrograman mobile",
    "creator": "tools/build-book.mjs",
    "producer": "Google Chrome + PyMuPDF",
}
doc.set_metadata(meta)


# Catatan: jangan memakai rewrite_images()/subset_fonts() PyMuPDF di sini, keduanya
# merusak font hasil Chrome (teks menjadi acak). Kompresi biasa sudah cukup.
def save(d, path):
    tmp = path + ".tmp"
    d.save(tmp, garbage=1, deflate=True, use_objstms=1)  # garbage=3 butuh >30 menit untuk ±1.600 halaman
    shutil.move(tmp, path)


save(doc, plan["out"]["interior"])

# Buku lengkap = sampul depan + isi + sampul belakang
cover = fitz.open(plan["cover"])
save(cover, plan["out"]["cover"])

interior = fitz.open(plan["out"]["interior"])
full = fitz.open()
full.insert_pdf(cover, from_page=0, to_page=0)
full.insert_pdf(interior)
full.insert_pdf(cover, from_page=1, to_page=1)
n = full.page_count
full.set_page_labels([
    {"startpage": 0, "prefix": "Sampul", "style": "", "firstpagenum": 1},
    {"startpage": 1, "prefix": "", "style": "r", "firstpagenum": 1},
    {"startpage": 1 + main_start, "prefix": "", "style": "D", "firstpagenum": 1},
    {"startpage": n - 1, "prefix": "Sampul Belakang", "style": "", "firstpagenum": 1},
])
full_toc = [[1, "Sampul", 1]] + [[lvl, t, p + 1] for lvl, t, p in outline] + [[1, "Sampul Belakang", n]]
full.set_toc(full_toc)
full.set_metadata(meta)
save(full, plan["out"]["full"])
print(json.dumps({"interiorPages": interior.page_count, "fullPages": n, "tocStart": toc_start}))
