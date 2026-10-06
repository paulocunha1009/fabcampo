from pathlib import Path

from PIL import Image
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "Folder_Campo_Digital_2026.pdf"
TMP = ROOT / "tmp" / "pdfs" / "folder-campo-digital"
TMP.mkdir(parents=True, exist_ok=True)
OUT.parent.mkdir(parents=True, exist_ok=True)

PORTAL_GREEN = colors.HexColor("#1F6F3B")
DEEP_GREEN = colors.HexColor("#0F3F25")
NAVY = colors.HexColor("#0B4B6B")
BLUE = colors.HexColor("#0B5DA8")
YELLOW = colors.HexColor("#F3B51B")
CREAM = colors.HexColor("#F4F8F0")
MINT = colors.HexColor("#EAF5EC")
INK = colors.HexColor("#1F2D25")
MUTED = colors.HexColor("#56665D")
BORDER = colors.HexColor("#D5E3D8")
WHITE = colors.white


def register_fonts():
    candidates = {
        "Portal": Path(r"C:\Windows\Fonts\segoeui.ttf"),
        "Portal-Semibold": Path(r"C:\Windows\Fonts\seguisb.ttf"),
        "Portal-Bold": Path(r"C:\Windows\Fonts\segoeuib.ttf"),
        "Portal-Italic": Path(r"C:\Windows\Fonts\segoeuii.ttf"),
    }
    fallback = {
        "Portal": "Helvetica",
        "Portal-Semibold": "Helvetica-Bold",
        "Portal-Bold": "Helvetica-Bold",
        "Portal-Italic": "Helvetica-Oblique",
    }
    resolved = {}
    for name, path in candidates.items():
        if path.exists():
            pdfmetrics.registerFont(TTFont(name, str(path)))
            resolved[name] = name
        else:
            resolved[name] = fallback[name]
    return resolved


FONTS = register_fonts()
W, H = landscape(A4)
PANEL = W / 3


def style(name, size, leading=None, color=INK, align=TA_LEFT, font="Portal"):
    return ParagraphStyle(
        name,
        fontName=FONTS[font],
        fontSize=size,
        leading=leading or size * 1.28,
        textColor=color,
        alignment=align,
        spaceAfter=0,
        spaceBefore=0,
    )


S_BODY = style("body", 8.35, 11.1)
S_SMALL = style("small", 7.1, 9.2, MUTED)
S_CAP = style("cap", 7, 8.5, PORTAL_GREEN, font="Portal-Bold")
S_PANEL_TITLE = style("panel-title", 18, 20.5, DEEP_GREEN, font="Portal-Bold")
S_WHITE = style("white", 8.5, 11.3, WHITE)
S_CENTER_SMALL = style("center-small", 7.2, 9.2, MUTED, TA_CENTER)


def para(c, text, x, y_top, width, st, height=200):
    p = Paragraph(text, st)
    _, h = p.wrap(width, height)
    p.drawOn(c, x, y_top - h)
    return h


def rounded(c, x, y, w, h, fill, stroke=None, radius=7, line=0.7):
    c.setLineWidth(line)
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1 if stroke else 0)


def fit_image(c, path, x, y, w, h, radius=0):
    img = Image.open(path).convert("RGB")
    iw, ih = img.size
    target = w / h
    source = iw / ih
    if source > target:
        nw = int(ih * target)
        left = (iw - nw) // 2
        img = img.crop((left, 0, left + nw, ih))
    else:
        nh = int(iw / target)
        top = (ih - nh) // 2
        img = img.crop((0, top, iw, top + nh))
    tmp = TMP / f"crop-{abs(hash((str(path), x, y, w, h))) % 1000000}.jpg"
    img.save(tmp, "JPEG", quality=92, optimize=True)
    if radius:
        c.saveState()
        clip = c.beginPath()
        clip.roundRect(x, y, w, h, radius)
        c.clipPath(clip, stroke=0, fill=0)
        c.drawImage(str(tmp), x, y, w, h, mask="auto")
        c.restoreState()
    else:
        c.drawImage(str(tmp), x, y, w, h, mask="auto")


def crop_school_logo(source):
    poster = Path(r"C:\Users\yolep\Downloads\BANNER CAMPO DIGITAL  - CC 2026.pptx (2).png")
    if poster.exists():
        img = Image.open(poster).convert("RGBA")
        # Clean emblem area from the supplied scientific-project banner.
        crop = img.crop((385, 90, 755, 430))
    else:
        img = Image.open(source).convert("RGBA")
        w, h = img.size
        crop = img.crop((int(w * 0.70), 0, int(w * 0.98), int(h * 0.52)))
    out = TMP / "school-logo.png"
    crop.save(out)
    return out


def tinted_cover(source, tint=(15, 63, 37), strength=.44):
    img = Image.open(source).convert("RGB")
    iw, ih = img.size
    target = PANEL / H
    source_ratio = iw / ih
    if source_ratio > target:
        nw = int(ih * target)
        left = (iw - nw) // 2
        img = img.crop((left, 0, left + nw, ih))
    else:
        nh = int(iw / target)
        top = (ih - nh) // 2
        img = img.crop((0, top, iw, top + nh))
    img = img.resize((900, 1900), Image.Resampling.LANCZOS)
    overlay = Image.new("RGB", img.size, tint)
    img = Image.blend(img, overlay, strength)
    out = TMP / "cover-students.jpg"
    img.save(out, "JPEG", quality=93, optimize=True)
    return out


def draw_qr(c, x, y, size):
    widget = qr.QrCodeWidget("https://www.fabcampo.com.br")
    bounds = widget.getBounds()
    bw = bounds[2] - bounds[0]
    bh = bounds[3] - bounds[1]
    drawing = Drawing(size, size, transform=[size / bw, 0, 0, size / bh, 0, 0])
    drawing.add(widget)
    renderPDF.draw(drawing, c, x, y)


def leaf(c, x, y, scale=1, color=PORTAL_GREEN, angle=0):
    c.saveState()
    c.translate(x, y)
    c.rotate(angle)
    c.setFillColor(color)
    p = c.beginPath()
    p.moveTo(0, 0)
    p.curveTo(6 * scale, 16 * scale, 24 * scale, 18 * scale, 30 * scale, 6 * scale)
    p.curveTo(20 * scale, -2 * scale, 8 * scale, -3 * scale, 0, 0)
    c.drawPath(p, fill=1, stroke=0)
    c.setStrokeColor(colors.Color(color.red * .75, color.green * .75, color.blue * .75))
    c.setLineWidth(max(.5, scale))
    c.line(3 * scale, 1 * scale, 26 * scale, 7 * scale)
    c.restoreState()


def fold_marks(c):
    c.saveState()
    c.setStrokeColor(colors.HexColor("#8EA49A"))
    c.setLineWidth(0.35)
    for x in (PANEL, PANEL * 2):
        c.line(x, H, x, H - 4 * mm)
        c.line(x, 0, x, 4 * mm)
    c.restoreState()


def section_label(c, text, x, y, color=PORTAL_GREEN):
    c.setFillColor(YELLOW)
    c.rect(x, y - 1, 14, 2, fill=1, stroke=0)
    c.setFillColor(color)
    c.setFont(FONTS["Portal-Bold"], 7.3)
    c.drawString(x + 20, y - 3, text.upper())


def panel_header(c, number, title, x, top):
    rounded(c, x, top - 23, 23, 23, PORTAL_GREEN, radius=11.5)
    c.setFillColor(WHITE)
    c.setFont(FONTS["Portal-Bold"], 10)
    c.drawCentredString(x + 11.5, top - 15.5, str(number))
    para(c, title, x + 32, top - 1, PANEL - 60, S_PANEL_TITLE, 40)


def card(c, x, y, w, h, title, text, accent=PORTAL_GREEN, icon=None):
    rounded(c, x, y, w, h, WHITE, BORDER, 8)
    c.setFillColor(accent)
    c.roundRect(x, y, 4, h, 2, fill=1, stroke=0)
    if icon:
        c.setFont(FONTS["Portal-Bold"], 10)
        c.drawString(x + 12, y + h - 17, icon)
        tx = x + 27
    else:
        tx = x + 12
    c.setFillColor(DEEP_GREEN)
    c.setFont(FONTS["Portal-Bold"], 8.2)
    c.drawString(tx, y + h - 17, title)
    para(c, text, x + 12, y + h - 25, w - 22, S_SMALL, h - 28)


def photo_caption(c, path, x, y, w, h, caption, accent=YELLOW):
    fit_image(c, path, x, y, w, h, 8)
    c.saveState()
    c.setFillAlpha(.84)
    c.setFillColor(DEEP_GREEN)
    c.roundRect(x, y, w, 27, 8, fill=1, stroke=0)
    c.restoreState()
    c.setFillColor(accent)
    c.rect(x + 10, y + 8, 13, 2, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONTS["Portal-Semibold"], 6.6)
    c.drawString(x + 28, y + 6.5, caption)


def build():
    banner = ROOT / "img" / "banner" / "campo-digital-banner-oficial.png"
    logo = ROOT / "img" / "logo" / "campo-digital-logo-header.png"
    symbol = ROOT / "img" / "logo" / "campo-digital-simbolo-watermark.png"
    school_logo = crop_school_logo(banner)

    c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
    c.setTitle("Folder Campo Digital 2026")
    c.setAuthor("EEMPC Francisco Araújo Barros")
    c.setSubject("Portal Digital da Comunidade - Ceará Científico 2026")

    # PAGE 1 - OUTSIDE: flap | back cover | front cover
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Left flap
    x0 = 0
    c.setFillColor(MINT)
    c.rect(x0, 0, PANEL, H, fill=1, stroke=0)
    leaf(c, 22, H - 35, .8, PORTAL_GREEN, -15)
    section_label(c, "Educação que transforma territórios", 24, H - 48)
    para(c, "Um portal feito<br/>com o território", 24, H - 68, PANEL - 48, S_PANEL_TITLE, 70)
    para(c,
         "O Campo Digital reúne <b>pesquisa escolar, memória, saberes do campo e tecnologia</b> em um acervo público construído com a comunidade.",
         24, H - 130, PANEL - 48, S_BODY, 100)
    fit_image(c, banner, 24, H - 313, PANEL - 48, 124, 10)
    y = H - 345
    labels = [("PESQUISA", BLUE), ("MEMÓRIA", PORTAL_GREEN), ("TERRITÓRIO", NAVY), ("INOVAÇÃO", YELLOW)]
    for i, (label, col) in enumerate(labels):
        col_x = 24 + (i % 2) * ((PANEL - 54) / 2 + 6)
        row_y = y - (i // 2) * 38
        rounded(c, col_x, row_y - 24, (PANEL - 54) / 2, 29, WHITE, BORDER, 7)
        c.setFillColor(col)
        c.circle(col_x + 13, row_y - 9.5, 3.2, fill=1, stroke=0)
        c.setFillColor(DEEP_GREEN)
        c.setFont(FONTS["Portal-Bold"], 7.4)
        c.drawString(col_x + 22, row_y - 12.5, label)
    rounded(c, 24, 42, PANEL - 48, 63, DEEP_GREEN, radius=8)
    para(c, "Conhecimento do campo<br/><b>também é tecnologia.</b>", 38, 89, PANEL - 76,
         style("quote", 11.8, 15, WHITE, font="Portal-Italic"), 50)

    # Center back cover
    x1 = PANEL
    c.setFillColor(WHITE)
    c.rect(x1, 0, PANEL, H, fill=1, stroke=0)
    c.drawImage(str(school_logo), x1 + 26, H - 130, 74, 74, preserveAspectRatio=True, mask="auto")
    c.drawImage(str(logo), x1 + 112, H - 112, PANEL - 138, 48, preserveAspectRatio=True, mask="auto")
    c.setStrokeColor(BORDER)
    c.line(x1 + 24, H - 143, x1 + PANEL - 24, H - 143)
    section_label(c, "Realização", x1 + 24, H - 170)
    para(c, "EEMPC Francisco Araújo Barros<br/><b>Itarema/CE - 2026</b>", x1 + 24, H - 189, PANEL - 48,
         style("school", 10, 13, DEEP_GREEN, font="Portal-Semibold"), 60)
    section_label(c, "Autores e orientação", x1 + 24, H - 250)
    para(c,
         "<b>Estudantes</b><br/>Kauemberg Azevedo de Sousa<br/>João Lucas da Silva Ferreira<br/><br/><b>Orientador</b><br/>Paulo Henrique Cordeiro",
         x1 + 24, H - 270, PANEL - 48, S_BODY, 130)
    rounded(c, x1 + 24, 48, PANEL - 48, 147, MINT, BORDER, 10)
    draw_qr(c, x1 + 35, 68, 103)
    para(c, "APONTE A CÂMERA", x1 + 150, 168, PANEL - 180, S_CAP, 20)
    para(c, "Acesse o portal, explore o acervo e converse com o SabIA.", x1 + 150, 150, PANEL - 180,
         style("qrtext", 8.4, 11, DEEP_GREEN, font="Portal-Semibold"), 70)
    c.setFillColor(PORTAL_GREEN)
    c.setFont(FONTS["Portal-Bold"], 8.2)
    c.drawString(x1 + 150, 77, "www.fabcampo.com.br")

    # Right front cover
    x2 = PANEL * 2
    c.setFillColor(DEEP_GREEN)
    c.rect(x2, 0, PANEL, H, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.circle(x2 + PANEL + 25, H - 55, 145, fill=1, stroke=0)
    c.setFillColor(colors.Color(1, 1, 1, alpha=.08))
    c.circle(x2 + PANEL - 24, H - 62, 91, fill=1, stroke=0)
    rounded(c, x2 + 25, H - 96, PANEL - 50, 64, WHITE, radius=10)
    c.drawImage(str(logo), x2 + 37, H - 87, PANEL - 74, 47, preserveAspectRatio=True, mask="auto")
    rounded(c, x2 + 25, H - 126, 126, 22, colors.HexColor("#315B38"), radius=11)
    c.setFillColor(YELLOW)
    c.setFont(FONTS["Portal-Bold"], 7.2)
    c.drawCentredString(x2 + 88, H - 118.5, "CEARÁ CIENTÍFICO 2026")
    para(c, "Portal Digital<br/>da Comunidade", x2 + 25, H - 153, PANEL - 50,
         style("cover-title", 25, 27, WHITE, font="Portal-Bold"), 90)
    para(c, "Tecnologia educacional para memória, saberes do campo e inclusão digital", x2 + 25, H - 235,
         PANEL - 50, style("cover-sub", 10.3, 13.2, WHITE, font="Portal-Semibold"), 70)
    fit_image(c, banner, x2 + 25, 92, PANEL - 50, 205, 11)
    c.setFillColor(YELLOW)
    c.rect(x2 + 25, 73, 52, 3, fill=1, stroke=0)
    para(c, "Desenvolvido por estudantes para valorizar saberes do campo e fortalecer a comunidade.",
         x2 + 25, 61, PANEL - 50, style("cover-foot", 7.9, 10.4, WHITE), 60)
    fold_marks(c)
    c.showPage()

    # PAGE 2 - INSIDE SPREAD
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(DEEP_GREEN)
    c.rect(0, H - 36, W, 36, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONTS["Portal-Semibold"], 7.4)
    c.drawString(24, H - 23, "CAMPO DIGITAL · PESQUISA · MEMÓRIA · TERRITÓRIO · INOVAÇÃO")
    c.setFillColor(YELLOW)
    c.rect(W - 118, H - 24, 94, 3, fill=1, stroke=0)

    # Inside left: problem and objective
    x = 0
    panel_header(c, 1, "Por que nasceu?", x + 24, H - 60)
    para(c,
         "O Assentamento Lagoa do Mineiro reúne uma história de luta pela terra, cultura, memória e saberes agrícolas e ambientais construídos ao longo de gerações.",
         x + 24, H - 110, PANEL - 48, S_BODY, 100)
    para(c,
         "Parte desse patrimônio permanecia apenas na oralidade e em documentos dispersos. Sem um registro organizado, aumentava o risco de perder memórias e raízes da comunidade.",
         x + 24, H - 188, PANEL - 48, S_BODY, 110)
    rounded(c, x + 24, H - 360, PANEL - 48, 112, WHITE, BORDER, 10)
    section_label(c, "Questão da pesquisa", x + 38, H - 271)
    para(c,
         "Como uma plataforma digital desenvolvida por estudantes pode <b>preservar memórias, valorizar saberes do campo e produzir conhecimento</b> sobre o território?",
         x + 38, H - 292, PANEL - 76,
         style("question", 10.1, 13.3, DEEP_GREEN, font="Portal-Semibold"), 75)
    rounded(c, x + 24, 48, PANEL - 48, 138, DEEP_GREEN, radius=10)
    para(c, "OBJETIVO", x + 38, 169, PANEL - 76,
         style("objcap", 7, 9, YELLOW, font="Portal-Bold"), 20)
    para(c,
         "Registrar, organizar e divulgar a história, a memória e os saberes do assentamento, fortalecendo a identidade da comunidade e sua presença na internet.",
         x + 38, 148, PANEL - 76, S_WHITE, 95)

    # Inside center: methodology
    x = PANEL
    panel_header(c, 2, "Como foi construído?", x + 24, H - 60)
    para(c, "A pesquisa foi organizada em seis etapas, unindo investigação, participação comunitária e desenvolvimento tecnológico.",
         x + 24, H - 111, PANEL - 48, S_BODY, 65)
    steps = [
        ("1", "Diagnóstico", "Identificação da ausência de registros digitais."),
        ("2", "Pesquisa de campo", "Arquivo histórico, entrevistas e COPAGLAM."),
        ("3", "Curadoria", "Conferência das informações com fontes primárias."),
        ("4", "Desenvolvimento", "HTML5, CSS3, JavaScript e dados em JSON."),
        ("5", "Publicação", "GitHub, domínio próprio e backend na Vercel."),
        ("6", "Validação", "Responsividade, acessibilidade e documentação."),
    ]
    cw = (PANEL - 58) / 2
    ch = 102
    y0 = H - 252
    for i, (num, title, text) in enumerate(steps):
        cx = x + 24 + (i % 2) * (cw + 10)
        cy = y0 - (i // 2) * (ch + 12)
        rounded(c, cx, cy, cw, ch, WHITE, BORDER, 8)
        rounded(c, cx + 10, cy + ch - 31, 21, 21, PORTAL_GREEN if i != 4 else BLUE, radius=10.5)
        c.setFillColor(WHITE)
        c.setFont(FONTS["Portal-Bold"], 8)
        c.drawCentredString(cx + 20.5, cy + ch - 24, num)
        c.setFillColor(DEEP_GREEN)
        c.setFont(FONTS["Portal-Bold"], 7.8)
        c.drawString(cx + 37, cy + ch - 24, title)
        para(c, text, cx + 10, cy + ch - 40, cw - 20, S_SMALL, 58)
    para(c, "Fonte: acervo próprio do projeto, registros fotográficos e capturas de tela produzidos durante a pesquisa.",
         x + 24, 38, PANEL - 48, style("source", 6.2, 7.8, MUTED), 30)

    # Inside right: portal contents and results
    x = PANEL * 2
    panel_header(c, 3, "O que você encontra?", x + 24, H - 60)
    items = [
        ("História e memória", "Marcos, personagens e relatos da comunidade."),
        ("Produção agrícola", "Práticas, clima e organização financeira rural."),
        ("Plantas do território", "Espécies nativas e conhecimentos medicinais."),
        ("Educação e tecnologia", "Reportagens, atividades e recursos de estudo."),
    ]
    yy = H - 151
    for i, (title, text) in enumerate(items):
        card(c, x + 24, yy - i * 62, PANEL - 48, 52, title, text,
             [PORTAL_GREEN, YELLOW, BLUE, NAVY][i])
    stats_y = 141
    stats = [("13", "páginas temáticas"), ("29", "espécies documentadas"), ("15", "marcos históricos")]
    sw = (PANEL - 58) / 3
    for i, (n, label) in enumerate(stats):
        sx = x + 24 + i * (sw + 5)
        rounded(c, sx, stats_y, sw, 58, WHITE, BORDER, 8)
        c.setFillColor(PORTAL_GREEN if i != 1 else BLUE)
        c.setFont(FONTS["Portal-Bold"], 17)
        c.drawCentredString(sx + sw / 2, stats_y + 32, n)
        para(c, label, sx + 4, stats_y + 20, sw - 8, S_CENTER_SMALL, 22)
    rounded(c, x + 24, 48, PANEL - 48, 76, DEEP_GREEN, radius=10)
    c.setFillColor(YELLOW)
    c.setFont(FONTS["Portal-Bold"], 13)
    c.drawString(x + 38, 97, "SabIA")
    c.setFillColor(WHITE)
    c.setFont(FONTS["Portal-Semibold"], 7.5)
    c.drawString(x + 82, 99, "Inteligência do Território")
    para(c, "Ajuda a aprender, pesquisar e descobrir os saberes do portal de forma simples e responsável.",
         x + 38, 88, PANEL - 76, style("sabia", 7.3, 9.2, WHITE), 38)
    fold_marks(c)
    c.save()


def build_rich():
    """Second proof: richer photographic narrative using only project assets."""
    banner = ROOT / "img" / "banner" / "campo-digital-banner-oficial.png"
    logo = ROOT / "img" / "logo" / "campo-digital-logo-header.png"
    school_logo = crop_school_logo(banner)
    extracted = ROOT / "tmp" / "pdfs" / "banner-images"
    photo_archive = extracted / "asset-014.png"
    photo_interview = extracted / "asset-008.png"
    photo_dev = extracted / "asset-011.png"
    photo_field = ROOT / "img" / "galeria" / "rolo-02.jpg"
    photo_presentation = ROOT / "img" / "galeria" / "educacao-projeto.jpg"
    site_mobile = extracted / "asset-022.png"

    c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
    c.setTitle("Folder Campo Digital 2026 - edição fotográfica")
    c.setAuthor("EEMPC Francisco Araújo Barros")
    c.setSubject("Portal Digital da Comunidade - Ceará Científico 2026")

    # PAGE 1 - OUTSIDE: flap | back cover | front cover
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Flap: territory and project identity
    x = 0
    c.setFillColor(MINT)
    c.rect(x, 0, PANEL, H, fill=1, stroke=0)
    photo_caption(c, photo_field, x + 20, H - 198, PANEL - 40, 166,
                  "PESQUISA DE CAMPO E TROCA DE SABERES")
    section_label(c, "Do campo para o digital", x + 20, H - 222)
    para(c, "Tecnologia com<br/>raízes no território", x + 20, H - 243, PANEL - 40,
         style("flap-title-rich", 19.5, 22, DEEP_GREEN, font="Portal-Bold"), 55)
    para(c,
         "O Campo Digital nasceu para reunir <b>história, memória, produção agrícola, biodiversidade e educação</b> em um acervo público feito com a comunidade.",
         x + 20, H - 304, PANEL - 40, style("flap-body-rich", 8.1, 10.5, INK), 84)
    chips = [("PESQUISA", BLUE), ("MEMÓRIA", PORTAL_GREEN), ("TERRITÓRIO", NAVY), ("INOVAÇÃO", YELLOW)]
    cy = 171
    for i, (label, col) in enumerate(chips):
        cx = x + 20 + (i % 2) * 122
        yy = cy - (i // 2) * 35
        rounded(c, cx, yy, 112, 27, WHITE, BORDER, 7)
        c.setFillColor(col)
        c.circle(cx + 13, yy + 13.5, 3.2, fill=1, stroke=0)
        c.setFillColor(DEEP_GREEN)
        c.setFont(FONTS["Portal-Bold"], 7.2)
        c.drawString(cx + 23, yy + 10, label)
    rounded(c, x + 20, 34, PANEL - 40, 85, DEEP_GREEN, radius=9)
    para(c, "“Conhecimento do campo<br/><b>também é tecnologia.</b>”", x + 35, 98, PANEL - 70,
         style("flap-quote-rich", 11.4, 14.2, WHITE, font="Portal-Italic"), 60)

    # Back cover: evidence, results and access
    x = PANEL
    c.setFillColor(WHITE)
    c.rect(x, 0, PANEL, H, fill=1, stroke=0)
    photo_caption(c, photo_presentation, x + 20, H - 171, PANEL - 40, 139,
                  "ESTUDANTES APRESENTANDO O CAMPO DIGITAL")
    c.drawImage(str(school_logo), x + 22, H - 239, 54, 54, preserveAspectRatio=True, mask="auto")
    c.drawImage(str(logo), x + 86, H - 229, PANEL - 108, 39, preserveAspectRatio=True, mask="auto")
    stats = [("13", "páginas"), ("29", "espécies"), ("15", "marcos")]
    sw = (PANEL - 52) / 3
    for i, (num, label) in enumerate(stats):
        sx = x + 20 + i * (sw + 6)
        rounded(c, sx, H - 304, sw, 52, MINT, BORDER, 8)
        c.setFillColor([PORTAL_GREEN, BLUE, NAVY][i])
        c.setFont(FONTS["Portal-Bold"], 14)
        c.drawCentredString(sx + sw / 2, H - 273, num)
        c.setFillColor(MUTED)
        c.setFont(FONTS["Portal-Semibold"], 6.5)
        c.drawCentredString(sx + sw / 2, H - 291, label)
    section_label(c, "Realização", x + 20, H - 331)
    para(c, "<b>EEMPC Francisco Araújo Barros</b> · Itarema/CE · 2026", x + 20, H - 350,
         PANEL - 40, style("school-rich", 8.4, 10.6, DEEP_GREEN), 28)
    para(c,
         "<b>Estudantes:</b> Kauemberg Azevedo de Sousa e João Lucas da Silva Ferreira<br/><b>Orientador:</b> Paulo Henrique Cordeiro",
         x + 20, H - 378, PANEL - 40, style("authors-rich", 7.2, 9.2, INK), 52)
    rounded(c, x + 20, 35, PANEL - 40, 144, DEEP_GREEN, radius=10)
    rounded(c, x + 29, 47, 111, 111, WHITE, radius=7)
    draw_qr(c, x + 34, 52, 101)
    para(c, "ACESSE O PORTAL", x + 148, 157, PANEL - 178,
         style("access-rich", 7.4, 9, YELLOW, font="Portal-Bold"), 18)
    para(c, "Explore o acervo, as reportagens, as atividades e converse com o SabIA.", x + 148, 136,
         PANEL - 178, style("access-body-rich", 7.7, 9.8, WHITE), 58)
    c.setFillColor(WHITE)
    c.setFont(FONTS["Portal-Bold"], 7.7)
    c.drawString(x + 148, 60, "fabcampo.com.br")

    # Front cover: full photographic composition with students developing the portal
    x = PANEL * 2
    cover_photo = tinted_cover(photo_dev)
    c.drawImage(str(cover_photo), x, 0, PANEL, H, mask="auto")
    c.saveState()
    c.setFillAlpha(.23)
    c.setFillColor(BLUE)
    c.circle(x + PANEL + 16, H - 75, 145, fill=1, stroke=0)
    c.restoreState()
    rounded(c, x + 22, H - 98, PANEL - 44, 62, WHITE, radius=10)
    c.drawImage(str(logo), x + 34, H - 88, PANEL - 68, 43, preserveAspectRatio=True, mask="auto")
    rounded(c, x + 22, H - 133, 126, 22, colors.HexColor("#315B38"), radius=11)
    c.setFillColor(YELLOW)
    c.setFont(FONTS["Portal-Bold"], 7.1)
    c.drawCentredString(x + 85, H - 125.5, "CEARÁ CIENTÍFICO 2026")
    para(c, "Portal Digital<br/>da Comunidade", x + 22, H - 166, PANEL - 44,
         style("cover-title-rich", 25, 27.5, WHITE, font="Portal-Bold"), 90)
    c.setFillColor(YELLOW)
    c.rect(x + 22, H - 265, 58, 3, fill=1, stroke=0)
    para(c, "Tecnologia educacional para memória, saberes do campo e inclusão digital", x + 22, H - 282,
         PANEL - 44, style("cover-sub-rich", 10.2, 13.1, WHITE, font="Portal-Semibold"), 72)
    rounded(c, x + 22, 42, PANEL - 44, 94, colors.Color(.03, .20, .12, alpha=.92), radius=9)
    para(c, "Desenvolvido por estudantes para <b>preservar memórias, valorizar saberes e fortalecer a comunidade.</b>",
         x + 37, 117, PANEL - 74, style("cover-note-rich", 8.5, 11.2, WHITE), 66)
    fold_marks(c)
    c.showPage()

    # PAGE 2 - INSIDE: evidence-led story
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(DEEP_GREEN)
    c.rect(0, H - 35, W, 35, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONTS["Portal-Semibold"], 7.2)
    c.drawString(22, H - 22, "UMA PESQUISA QUE NASCE DO TERRITÓRIO E RETORNA PARA A COMUNIDADE")
    c.setFillColor(YELLOW)
    c.rect(W - 109, H - 22, 87, 3, fill=1, stroke=0)

    # Panel 1: problem and listening
    x = 0
    panel_header(c, 1, "Escutar e preservar", x + 20, H - 56)
    photo_caption(c, photo_archive, x + 20, H - 229, 112, 116, "ACERVO HISTÓRICO")
    photo_caption(c, photo_interview, x + 141, H - 229, PANEL - 161, 116, "ENTREVISTA")
    para(c,
         "A história do Assentamento Lagoa do Mineiro é marcada pela luta pela terra e por saberes construídos ao longo de gerações. Parte desse patrimônio permanecia na oralidade e em documentos dispersos.",
         x + 20, H - 248, PANEL - 40, style("problem-rich", 7.8, 10.1, INK), 86)
    rounded(c, x + 20, H - 416, PANEL - 40, 92, WHITE, BORDER, 9)
    section_label(c, "Questão da pesquisa", x + 34, H - 348)
    para(c,
         "Como estudantes podem usar a tecnologia para <b>preservar memórias, valorizar saberes do campo e produzir conhecimento</b> sobre o território?",
         x + 34, H - 370, PANEL - 68, style("question-rich", 8.7, 11.3, DEEP_GREEN, font="Portal-Semibold"), 64)
    rounded(c, x + 20, 42, PANEL - 40, 106, DEEP_GREEN, radius=9)
    c.setFillColor(YELLOW)
    c.setFont(FONTS["Portal-Bold"], 7.3)
    c.drawString(x + 34, 127, "OBJETIVO")
    para(c, "Registrar, organizar e divulgar a história, a memória e os saberes do assentamento em um portal acessível e mantido pela escola.",
         x + 34, 111, PANEL - 68, style("objective-rich", 7.8, 10.3, WHITE), 60)

    # Panel 2: method as a clear timeline with evidence
    x = PANEL
    panel_header(c, 2, "Da pesquisa ao portal", x + 20, H - 56)
    photo_caption(c, photo_dev, x + 20, H - 231, PANEL - 40, 118, "DESENVOLVIMENTO PELOS ESTUDANTES")
    steps = [
        ("1", "Diagnóstico", "Ausência de registros digitais organizados."),
        ("2", "Pesquisa de campo", "Entrevistas, acervo histórico e COPAGLAM."),
        ("3", "Curadoria", "Conferência com fontes primárias e documentos."),
        ("4", "Desenvolvimento", "HTML5, CSS3, JavaScript, JSON e Node.js."),
        ("5", "Publicação", "GitHub, domínio próprio e backend na Vercel."),
        ("6", "Validação", "Celular, acessibilidade, segurança e documentação."),
    ]
    start_y = H - 258
    for i, (num, title, desc) in enumerate(steps):
        yy = start_y - i * 47
        c.setStrokeColor(BORDER)
        if i < len(steps) - 1:
            c.setLineWidth(1.2)
            c.line(x + 33, yy - 27, x + 33, yy - 47)
        rounded(c, x + 22, yy - 25, 22, 22, BLUE if i == 4 else PORTAL_GREEN, radius=11)
        c.setFillColor(WHITE)
        c.setFont(FONTS["Portal-Bold"], 7.5)
        c.drawCentredString(x + 33, yy - 18, num)
        c.setFillColor(DEEP_GREEN)
        c.setFont(FONTS["Portal-Bold"], 7.5)
        c.drawString(x + 52, yy - 13, title)
        c.setFillColor(MUTED)
        c.setFont(FONTS["Portal"], 6.5)
        c.drawString(x + 52, yy - 25, desc)
    para(c, "Metodologia baseada em registros próprios, participação comunitária e revisão das fontes.",
         x + 20, 31, PANEL - 40, style("method-source-rich", 6.2, 7.6, MUTED), 24)

    # Panel 3: portal, outcomes and pedagogical role
    x = PANEL * 2
    panel_header(c, 3, "Um acervo vivo e acessível", x + 20, H - 56)
    # Phone preview plus concise content map
    rounded(c, x + 20, H - 307, 103, 192, WHITE, BORDER, 9)
    fit_image(c, site_mobile, x + 27, H - 298, 89, 174, 6)
    para(c, "No portal", x + 137, H - 121, PANEL - 157,
         style("portal-cap-rich", 8, 10, PORTAL_GREEN, font="Portal-Bold"), 18)
    content_items = [
        "História e memória da comunidade",
        "Produção agrícola e mudanças climáticas",
        "Plantas nativas e medicinais",
        "Reportagens, atividades e materiais",
        "Expedição, catálogo e assistente SabIA",
    ]
    yy = H - 149
    for item in content_items:
        c.setFillColor(YELLOW)
        c.circle(x + 140, yy + 2, 2.1, fill=1, stroke=0)
        para(c, item, x + 148, yy + 7, PANEL - 168,
             style("portal-item-rich", 6.8, 8.5, INK), 26)
        yy -= 31
    stats_y = 188
    stats = [("13", "páginas"), ("29", "espécies"), ("15", "marcos"), ("1", "SabIA")]
    sw = (PANEL - 55) / 4
    for i, (num, label) in enumerate(stats):
        sx = x + 20 + i * (sw + 5)
        rounded(c, sx, stats_y, sw, 57, WHITE, BORDER, 8)
        c.setFillColor([PORTAL_GREEN, BLUE, NAVY, YELLOW][i])
        c.setFont(FONTS["Portal-Bold"], 14)
        c.drawCentredString(sx + sw / 2, stats_y + 32, num)
        c.setFillColor(MUTED)
        c.setFont(FONTS["Portal-Semibold"], 6)
        c.drawCentredString(sx + sw / 2, stats_y + 15, label)
    rounded(c, x + 20, 94, PANEL - 40, 76, DEEP_GREEN, radius=9)
    c.setFillColor(YELLOW)
    c.setFont(FONTS["Portal-Bold"], 13)
    c.drawString(x + 34, 143, "SabIA")
    c.setFillColor(WHITE)
    c.setFont(FONTS["Portal-Semibold"], 7.1)
    c.drawString(x + 78, 145, "Inteligência do Território")
    para(c, "Ajuda a aprender, pesquisar e descobrir os saberes do portal de forma simples, contextualizada e responsável.",
         x + 34, 133, PANEL - 68, style("sabia-rich", 6.9, 8.7, WHITE), 38)
    rounded(c, x + 20, 38, PANEL - 40, 42, MINT, BORDER, 8)
    para(c, "<b>Resultado:</b> a memória antes dispersa passou a integrar um acervo digital público, responsivo e mantido pela escola.",
         x + 32, 68, PANEL - 64, style("result-rich", 7.1, 8.8, DEEP_GREEN), 30)
    fold_marks(c)
    c.save()


if __name__ == "__main__":
    build_rich()
    print(OUT)
