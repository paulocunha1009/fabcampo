from pathlib import Path

from PIL import Image
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Santinhos_Campo_Digital_6_por_A4.pdf"
LOGO = ROOT / "img" / "logo" / "campo-digital-logo-header.png"
PHOTO = ROOT / "tmp" / "pdfs" / "banner-images" / "asset-011.png"
URL = "https://www.fabcampo.com.br"

GREEN = HexColor("#0F3F25")
GREEN_2 = HexColor("#1F6F3B")
BLUE = HexColor("#0B5DA8")
YELLOW = HexColor("#F3B51B")
CREAM = HexColor("#F4F8F0")
INK = HexColor("#143C29")
MUTED = HexColor("#52685B")
LINE = HexColor("#BBD2C1")


def register_fonts():
    font_dir = Path(r"C:\Windows\Fonts")
    fonts = {
        "Segoe": "segoeui.ttf",
        "Segoe-Semibold": "seguisb.ttf",
        "Segoe-Bold": "segoeuib.ttf",
    }
    for name, filename in fonts.items():
        path = font_dir / filename
        if path.exists():
            pdfmetrics.registerFont(TTFont(name, str(path)))


def cover_image(c, path, x, y, w, h):
    with Image.open(path) as im:
        iw, ih = im.size
    scale = max(w / iw, h / ih)
    dw, dh = iw * scale, ih * scale
    c.drawImage(str(path), x - (dw - w) / 2, y - (dh - h) / 2,
                width=dw, height=dh, mask="auto")


def draw_qr(c, value, x, y, size):
    widget = qr.QrCodeWidget(value)
    x1, y1, x2, y2 = widget.getBounds()
    width, height = x2 - x1, y2 - y1
    drawing = Drawing(size, size, transform=[size / width, 0, 0, size / height, 0, 0])
    drawing.add(widget)
    renderPDF.draw(drawing, c, x, y)


def draw_card(c, x, y, w, h):
    radius = 4 * mm
    c.saveState()
    card = c.beginPath()
    card.roundRect(x, y, w, h, radius)
    c.clipPath(card, stroke=0, fill=0)

    c.setFillColor(CREAM)
    c.rect(x, y, w, h, stroke=0, fill=1)

    photo_h = 29 * mm
    cover_image(c, PHOTO, x, y + h - photo_h, w, photo_h)
    c.setFillColor(HexColor("#062F20"))
    c.setFillAlpha(0.27)
    c.rect(x, y + h - photo_h, w, photo_h, stroke=0, fill=1)
    c.setFillAlpha(1)

    # Marca em uma faixa branca para manter a leitura do logo.
    logo_box_x = x + 5 * mm
    logo_box_y = y + h - 15 * mm
    logo_box_w = 37 * mm
    logo_box_h = 11 * mm
    c.setFillColor(white)
    c.roundRect(logo_box_x, logo_box_y, logo_box_w, logo_box_h, 2.2 * mm, stroke=0, fill=1)
    c.drawImage(str(LOGO), logo_box_x + 2 * mm, logo_box_y + 1.5 * mm,
                width=33 * mm, height=8 * mm, preserveAspectRatio=True, anchor="c", mask="auto")

    c.setFillColor(YELLOW)
    c.roundRect(x + w - 31 * mm, y + h - 12.5 * mm, 26 * mm, 6.7 * mm,
                3.2 * mm, stroke=0, fill=1)
    c.setFillColor(GREEN)
    c.setFont("Segoe-Bold", 6.7)
    c.drawCentredString(x + w - 18 * mm, y + h - 10.25 * mm, "CEARÁ CIENTÍFICO 2026")

    body_top = y + h - photo_h
    c.setFillColor(GREEN)
    c.rect(x, body_top - 1.6 * mm, w, 1.6 * mm, stroke=0, fill=1)

    q_size = 27 * mm
    qx = x + 5.5 * mm
    qy = y + 8 * mm
    c.setFillColor(white)
    c.roundRect(qx - 2.2 * mm, qy - 2.2 * mm, q_size + 4.4 * mm,
                q_size + 4.4 * mm, 2.5 * mm, stroke=0, fill=1)
    draw_qr(c, URL, qx, qy, q_size)

    tx = x + 40 * mm
    c.setFillColor(GREEN)
    c.setFont("Segoe-Bold", 12.5)
    c.drawString(tx, body_top - 8 * mm, "PORTAL DIGITAL")
    c.drawString(tx, body_top - 13.2 * mm, "DA COMUNIDADE")

    c.setFillColor(BLUE)
    c.setFont("Segoe-Semibold", 7.3)
    c.drawString(tx, body_top - 19 * mm, "Tecnologia, memória e território")

    c.setFillColor(MUTED)
    c.setFont("Segoe", 6.7)
    lines = [
        "Conheça a história, os saberes e as",
        "pesquisas do Assentamento Lagoa do Mineiro.",
    ]
    for i, line in enumerate(lines):
        c.drawString(tx, body_top - (24.5 + i * 3.4) * mm, line)

    c.setFillColor(GREEN_2)
    c.setFont("Segoe-Bold", 7.2)
    c.drawString(tx, y + 18.3 * mm, "APONTE A CÂMERA")
    c.setFillColor(INK)
    c.setFont("Segoe-Semibold", 6.7)
    c.drawString(tx, y + 14.4 * mm, "e visite fabcampo.com.br")

    c.setStrokeColor(LINE)
    c.setLineWidth(0.45)
    c.line(tx, y + 10.9 * mm, x + w - 5 * mm, y + 10.9 * mm)
    c.setFillColor(GREEN)
    c.setFont("Segoe-Bold", 5.6)
    c.drawString(tx, y + 7.4 * mm, "PESQUISA · MEMÓRIA · TERRITÓRIO · INOVAÇÃO")
    c.setFillColor(MUTED)
    c.setFont("Segoe", 5.2)
    c.drawString(tx, y + 4.3 * mm, "EEMPC Francisco Araújo Barros · Itarema/CE")

    c.restoreState()
    c.setStrokeColor(HexColor("#8CB79A"))
    c.setLineWidth(0.7)
    c.roundRect(x, y, w, h, radius, stroke=1, fill=0)


def draw_crop_marks(c, x, y, w, h):
    c.setStrokeColor(HexColor("#8B8B8B"))
    c.setLineWidth(0.35)
    gap, length = 1.2 * mm, 3.5 * mm
    for px in (x, x + w):
        c.line(px, y - gap, px, y - gap - length)
        c.line(px, y + h + gap, px, y + h + gap + length)
    for py in (y, y + h):
        c.line(x - gap, py, x - gap - length, py)
        c.line(x + w + gap, py, x + w + gap + length, py)


def build():
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    page_w, page_h = A4
    margin_x, margin_y = 7.5 * mm, 7.5 * mm
    gutter_x, gutter_y = 4 * mm, 4 * mm
    card_w = (page_w - 2 * margin_x - gutter_x) / 2
    card_h = (page_h - 2 * margin_y - 2 * gutter_y) / 3

    c.setTitle("Santinhos Campo Digital — 6 por folha A4")
    c.setAuthor("Campo Digital — EEMPC Francisco Araújo Barros")
    for row in range(3):
        for col in range(2):
            x = margin_x + col * (card_w + gutter_x)
            y = page_h - margin_y - (row + 1) * card_h - row * gutter_y
            draw_card(c, x, y, card_w, card_h)
            draw_crop_marks(c, x, y, card_w, card_h)
    c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
