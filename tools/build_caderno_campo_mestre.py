import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "caderno_campo.json"
OUT = ROOT / "output" / "pdf" / "Caderno_de_Campo_Mestre_Campo_Digital_2026.pdf"
LOGO = ROOT / "img" / "logo" / "campo-digital-logo-header.png"
BANNER = ROOT / "img" / "banner" / "campo-digital-banner-1280.webp"

GREEN = HexColor("#0F3F25")
GREEN_2 = HexColor("#1F6F3B")
BLUE = HexColor("#0B5DA8")
YELLOW = HexColor("#F3B51B")
CREAM = HexColor("#F4F8F0")
MINT = HexColor("#EAF5EC")
PALE_BLUE = HexColor("#EAF3FA")
INK = HexColor("#173C2A")
MUTED = HexColor("#52685B")
LINE = HexColor("#BED3C3")
WHITE = colors.white


def register_fonts():
    base = Path(r"C:\Windows\Fonts")
    for name, filename in {
        "Segoe": "segoeui.ttf",
        "Segoe-Semibold": "seguisb.ttf",
        "Segoe-Bold": "segoeuib.ttf",
        "Segoe-Italic": "segoeuii.ttf",
    }.items():
        path = base / filename
        if path.exists():
            pdfmetrics.registerFont(TTFont(name, str(path)))


register_fonts()
TITLE = ParagraphStyle("Title", fontName="Segoe-Bold", fontSize=27, leading=30, textColor=WHITE)
SUBWHITE = ParagraphStyle("Subwhite", fontName="Segoe-Semibold", fontSize=11, leading=15, textColor=WHITE)
H1 = ParagraphStyle("H1", fontName="Segoe-Bold", fontSize=21, leading=24, textColor=GREEN, spaceAfter=7)
H2 = ParagraphStyle("H2", fontName="Segoe-Bold", fontSize=14, leading=17, textColor=GREEN, spaceAfter=5)
H3 = ParagraphStyle("H3", fontName="Segoe-Bold", fontSize=9, leading=11, textColor=BLUE, spaceAfter=2)
BODY = ParagraphStyle("Body", fontName="Segoe", fontSize=8.9, leading=12.4, textColor=INK, spaceAfter=5)
SMALL = ParagraphStyle("Small", fontName="Segoe", fontSize=7.4, leading=9.8, textColor=MUTED)
NOTE = ParagraphStyle("Note", fontName="Segoe-Italic", fontSize=8, leading=11.2, textColor=MUTED)
WHITE_SMALL = ParagraphStyle("WhiteSmall", fontName="Segoe", fontSize=8, leading=11, textColor=WHITE)


def p(text, style=BODY):
    return Paragraph(text, style)


def header_footer(c, doc):
    w, h = A4
    c.saveState()
    c.setFillColor(GREEN)
    c.rect(0, h - 17 * mm, w, 17 * mm, fill=1, stroke=0)
    c.drawImage(str(LOGO), 17 * mm, h - 14 * mm, 43 * mm, 10 * mm,
                preserveAspectRatio=True, mask="auto")
    c.setFillColor(WHITE)
    c.setFont("Segoe-Semibold", 7.5)
    c.drawRightString(w - 17 * mm, h - 10.5 * mm, "CADERNO DE CAMPO MESTRE · 2026")
    c.setStrokeColor(YELLOW)
    c.setLineWidth(1.1)
    c.line(17 * mm, 13 * mm, w - 17 * mm, 13 * mm)
    c.setFillColor(MUTED)
    c.setFont("Segoe", 7)
    c.drawString(17 * mm, 8.5 * mm, "Campo Digital · EEMPC Francisco Araújo Barros · Itarema/CE")
    c.drawRightString(w - 17 * mm, 8.5 * mm, str(doc.page))
    c.restoreState()


def info_box(title, body, bg=MINT):
    t = Table([[p(title, H3)], [p(body, BODY)]], colWidths=[174 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.65, LINE),
        ("LINEBEFORE", (0, 0), (0, -1), 2.8, YELLOW),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def week_card(item):
    n = item["numero"]
    reconstructed = n <= 15 or n in (17, 19, 20, 21, 22, 24, 26, 27)
    label = "REGISTRO RECONSTRUÍDO" if reconstructed else "REGISTRO DOCUMENTADO"
    label_bg = YELLOW if reconstructed else GREEN_2
    label_fg = GREEN if reconstructed else WHITE
    head = Table([
        [p(f"SEMANA {n:02d}", ParagraphStyle("wk", parent=H3, textColor=WHITE)),
         p(item["periodo"], ParagraphStyle("period", parent=SMALL, textColor=WHITE)),
         p(item["fase"].upper(), ParagraphStyle("phase", parent=SMALL, textColor=WHITE))]
    ], colWidths=[28 * mm, 58 * mm, 88 * mm])
    head.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    body = Table([
        [p(label, ParagraphStyle("tag", parent=H3, textColor=label_fg))],
        [p("ATIVIDADE DA SEMANA", H3)],
        [p(item["atividade"], BODY)],
        [p("RESULTADO E REFLEXÃO", H3)],
        [p(item["resultado"], BODY)],
        [p("BASE DO REGISTRO", H3)],
        [p(item["fonte"], SMALL)],
    ], colWidths=[174 * mm])
    body.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), label_bg),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.65, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return KeepTogether([head, body])


def recent_update_card(item):
    head = Table([
        [p(item["data"], ParagraphStyle("recent_date", parent=H3, textColor=WHITE)),
         p(item["titulo"].upper(), ParagraphStyle("recent_title", parent=SMALL, textColor=WHITE))]
    ], colWidths=[34 * mm, 140 * mm])
    head.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    body = Table([
        [p(item["descricao"], BODY)],
        [p("EVIDÊNCIA", H3)],
        [p(item["evidencia"], SMALL)],
    ], colWidths=[174 * mm])
    body.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.65, LINE),
        ("LINEBEFORE", (0, 0), (0, -1), 2.6, YELLOW),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return KeepTogether([head, body])


def build_story(data):
    s = []
    hero_rows = []
    if BANNER.exists():
        hero_rows.append([Image(str(BANNER), width=174 * mm, height=87 * mm)])
    hero_rows += [
        [p("CADERNO DE CAMPO MESTRE", TITLE)],
        [p("Todas as semanas do projeto · 23 de fevereiro a 5 de outubro de 2026", SUBWHITE)],
        [p("Documento vivo para registro permanente da pesquisa, do desenvolvimento tecnológico e da preparação para o Ceará Científico.", WHITE_SMALL)],
    ]
    hero = Table(hero_rows, colWidths=[174 * mm])
    hero.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 12 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12 * mm),
        ("TOPPADDING", (0, 1), (-1, -1), 7),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 12 * mm),
    ]))
    s += [Spacer(1, 10 * mm), hero, Spacer(1, 8 * mm)]
    ident = Table([
        [p("PROJETO", H3), p(data["projeto"], BODY)],
        [p("ESCOLA", H3), p(data["escola"], BODY)],
        [p("ORIENTADOR", H3), p(data["orientador"], BODY)],
        [p("ATUALIZAÇÃO", H3), p(data["atualizado_em"], BODY)],
    ], colWidths=[37 * mm, 137 * mm])
    ident.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.55, LINE),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [CREAM, WHITE]),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    s += [ident, PageBreak(), p("Como este caderno foi consolidado", H1)]
    s.append(p("Este arquivo reúne, em ordem cronológica, todas as 33 semanas do Campo Digital até 5 de outubro de 2026. Ele substitui os PDFs separados de continuação e passa a ser o documento mestre do projeto.", BODY))
    s.append(info_box("REGISTROS RECONSTRUÍDOS", "As semanas sem uma anotação diária preservada foram reconstruídas com base no TCC, na documentação técnica, nas páginas do portal, nos materiais de pesquisa e na sequência metodológica. Elas precisam ser conferidas pelos estudantes e pelo orientador. Nenhuma data ou participação individual foi inventada.", PALE_BLUE))
    s += [Spacer(1, 5 * mm), info_box("REGISTROS DOCUMENTADOS", "Quando existe uma data verificável no histórico do repositório, em PDFs produzidos ou na conversa de desenvolvimento, a base documental aparece ao final da semana.", MINT), Spacer(1, 7 * mm)]
    s.append(p("Fontes utilizadas", H2))
    for text in [
        "TCC e banner do Campo Digital, incluindo problema, objetivos, metodologia e resultados.",
        "DOCUMENTACAO.md, README.md, arquivos de implantação, segurança e operação.",
        "Histórico do repositório entre 14 de junho e 27 de setembro de 2026.",
        "Caderno das semanas 28 a 32 e continuação de 30 de setembro a 5 de outubro.",
        "Folder, cartões com QR Code, planilha financeira, manual e materiais publicados no portal.",
        "Regulamento do Ceará Científico 2026, especialmente os Anexos VII, IX, XII e XIII.",
    ]:
        s.append(p(f"<font color='#F3B51B'>●</font> {text}", BODY))
    s += [Spacer(1, 6 * mm), info_box("MANUTENÇÃO", "Para atualizar este caderno, acrescente a nova semana no arquivo data/caderno_campo.json e gere novamente o PDF. O mesmo nome de arquivo será mantido, garantindo uma única versão oficial em evolução.", CREAM), PageBreak()]

    weeks = data["semanas"]
    for idx, item in enumerate(weeks):
        if idx % 2 == 0:
            last_number = min(item["numero"] + 1, len(weeks))
            timeline_title = (
                f"Linha do tempo · Semana {item['numero']:02d}"
                if last_number == item["numero"]
                else f"Linha do tempo · Semanas {item['numero']:02d} a {last_number:02d}"
            )
            s.append(p(timeline_title, H1))
        s.append(week_card(item))
        if idx % 2 == 0 and idx + 1 < len(weeks):
            s.append(Spacer(1, 7 * mm))
        if idx % 2 == 1 or idx == len(weeks) - 1:
            s.append(PageBreak())

    s += [p("Atualizações mais recentes", H1),
          p("Os registros abaixo detalham as últimas ações realizadas e complementam as Semanas 32 e 33.", BODY)]
    for i, update in enumerate(data.get("atualizacoes_recentes", [])):
        s.append(recent_update_card(update))
        if i < len(data.get("atualizacoes_recentes", [])) - 1:
            s.append(Spacer(1, 5 * mm))
        if i == 1:
            s.append(PageBreak())
            s.append(p("Atualizações mais recentes · continuação", H1))
    s += [PageBreak(), p("Síntese da trajetória", H1)]
    phases = [
        ("DIAGNÓSTICO E PLANEJAMENTO", "Semanas 1 a 6", "Problema, público, questão de pesquisa, objetivos, metodologia e fontes."),
        ("PESQUISA E CURADORIA", "Semanas 7 a 11", "História, memória, agricultura, biodiversidade e conferência das informações."),
        ("ARQUITETURA E DESENVOLVIMENTO", "Semanas 12 a 18", "Estrutura do portal, identidade, programação, conteúdo e primeiras versões."),
        ("PUBLICAÇÃO E VALIDAÇÃO", "Semanas 19 a 27", "Acessibilidade, modularização, segurança, domínio oficial e preparação escolar."),
        ("APERFEIÇOAMENTO E APLICAÇÃO", "Semanas 28 a 32", "Fase escolar, Expedição, Catálogo, identidade, planilha, SabIA e divulgação."),
        ("FASE ESTADUAL", "Semana 33 em diante", "Caderno mestre, roteiro, ensaio, gravação, postagem e apresentação."),
    ]
    rows = [[p("FASE", H3), p("PERÍODO", H3), p("PRINCIPAL RESULTADO", H3)]]
    for a, b, c in phases:
        rows.append([p(a, SMALL), p(b, SMALL), p(c, SMALL)])
    table = Table(rows, colWidths=[52 * mm, 40 * mm, 82 * mm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.55, LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, CREAM]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    s += [table, Spacer(1, 8 * mm), info_box("PRÓXIMA ATUALIZAÇÃO", "A Semana 33 deverá receber novos registros quando ocorrerem a conferência com os estudantes, a divisão das falas, os ensaios, a gravação, a edição, a postagem não listada no YouTube e o envio do link. Cada ação deve incluir data, local, participantes, resultado e evidência.", MINT)]
    return s


def build():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=23 * mm, bottomMargin=18 * mm,
        title="Caderno de Campo Mestre - Campo Digital 2026",
        author="Projeto Campo Digital",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body")
    doc.addPageTemplates([PageTemplate(id="normal", frames=[frame], onPage=header_footer)])
    doc.build(build_story(data))
    print(OUT)


if __name__ == "__main__":
    build()
