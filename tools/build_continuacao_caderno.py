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
OUT = ROOT / "output" / "pdf" / "Caderno_de_Campo_Continuacao_30-09_a_05-10-2026.pdf"
LOGO = ROOT / "img" / "logo" / "campo-digital-logo-header.png"
SANTINHOS = ROOT / "tmp" / "pdfs" / "santinhos-render" / "page-1.png"

GREEN = HexColor("#0F3F25")
GREEN_2 = HexColor("#1F6F3B")
BLUE = HexColor("#0B5DA8")
YELLOW = HexColor("#F3B51B")
CREAM = HexColor("#F4F8F0")
MINT = HexColor("#EAF5EC")
PALE_BLUE = HexColor("#EAF3FA")
INK = HexColor("#173C2A")
MUTED = HexColor("#56695D")
LINE = HexColor("#BED3C3")
WHITE = colors.white


def fonts():
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


fonts()

TITLE = ParagraphStyle("Title", fontName="Segoe-Bold", fontSize=22, leading=25,
                       textColor=GREEN, spaceAfter=4)
SUB = ParagraphStyle("Sub", fontName="Segoe-Semibold", fontSize=10, leading=13,
                     textColor=BLUE, spaceAfter=8)
H2 = ParagraphStyle("H2", fontName="Segoe-Bold", fontSize=14, leading=17,
                    textColor=GREEN, spaceBefore=6, spaceAfter=5)
H3 = ParagraphStyle("H3", fontName="Segoe-Bold", fontSize=9, leading=11,
                    textColor=BLUE, spaceBefore=3, spaceAfter=2)
BODY = ParagraphStyle("Body", fontName="Segoe", fontSize=8.9, leading=12.4,
                      textColor=INK, spaceAfter=6, allowWidows=0, allowOrphans=0)
SMALL = ParagraphStyle("Small", fontName="Segoe", fontSize=7.7, leading=10,
                       textColor=MUTED)
NOTE = ParagraphStyle("Note", fontName="Segoe-Italic", fontSize=8.2, leading=11.5,
                      textColor=MUTED)


def p(text, style=BODY):
    return Paragraph(text, style)


def field(label, text, background=colors.white):
    t = Table([[p(label, H3)], [p(text, BODY)]], colWidths=[174 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.65, LINE),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, YELLOW),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return t


def meta(date, time, local, participants):
    data = [
        [p("DATA", H3), p("HORÁRIO", H3), p("LOCAL", H3)],
        [p(date, BODY), p(time, BODY), p(local, BODY)],
        [p("PARTICIPANTES", H3), "", ""],
        [p(participants, BODY), "", ""],
    ]
    t = Table(data, colWidths=[48 * mm, 35 * mm, 91 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), MINT),
        ("BACKGROUND", (0, 2), (-1, 2), MINT),
        ("GRID", (0, 0), (-1, 1), 0.55, LINE),
        ("BOX", (0, 2), (-1, 3), 0.55, LINE),
        ("SPAN", (0, 2), (-1, 2)),
        ("SPAN", (0, 3), (-1, 3)),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def header_footer(c, doc):
    w, h = A4
    c.saveState()
    c.setFillColor(GREEN)
    c.rect(0, h - 17 * mm, w, 17 * mm, fill=1, stroke=0)
    c.drawImage(str(LOGO), 17 * mm, h - 14 * mm, 43 * mm, 10 * mm,
                preserveAspectRatio=True, mask="auto")
    c.setFillColor(WHITE)
    c.setFont("Segoe-Semibold", 7.5)
    c.drawRightString(w - 17 * mm, h - 10.5 * mm, "CADERNO DE CAMPO · CONTINUAÇÃO")
    c.setStrokeColor(YELLOW)
    c.setLineWidth(1.1)
    c.line(17 * mm, 13 * mm, w - 17 * mm, 13 * mm)
    c.setFillColor(MUTED)
    c.setFont("Segoe", 7)
    c.drawString(17 * mm, 8.5 * mm, "Campo Digital · EEMPC Francisco Araújo Barros · Itarema/CE · 2026")
    c.drawRightString(w - 17 * mm, 8.5 * mm, str(doc.page))
    c.restoreState()


def build_story():
    s = [
        p("Caderno de Campo", TITLE),
        p("CONTINUAÇÃO · Semana 32 e início da Semana 33", SUB),
        p("Este documento dá continuidade aos registros encerrados em 30 de setembro de 2026. Os textos descrevem atividades efetivamente documentadas no desenvolvimento do projeto.", NOTE),
        Spacer(1, 4 * mm),
        p("Semana 32 · conclusão dos materiais de divulgação", H2),
        meta("30/09/2026", "Durante o período de trabalho", "Laboratório de Informática / ambiente de desenvolvimento do projeto", "Equipe do projeto Campo Digital, com orientação do professor Paulo Henrique Cordeiro."),
        Spacer(1, 4 * mm),
        field("OBJETIVO", "Concluir o cartão de divulgação do Campo Digital em formato adequado para impressão, permitindo que visitantes acessem o portal por meio de um QR Code."),
        Spacer(1, 3 * mm),
        field("ATIVIDADE REALIZADA", "Finalizamos a composição de uma folha A4 com seis cartões de divulgação. Utilizamos a identidade visual do portal, a logomarca do Campo Digital, uma fotografia real dos estudantes trabalhando e o endereço fabcampo.com.br. Também acrescentamos linhas de corte para facilitar a separação dos cartões depois da impressão."),
        Spacer(1, 3 * mm),
        field("TESTE E OBSERVAÇÕES", "Renderizamos a folha para verificar o resultado real da impressão. Conferimos o tamanho dos seis cartões, a nitidez dos elementos, o contraste, as margens e a leitura do QR Code. A análise mostrou que o QR Code precisava permanecer sobre fundo branco e com espaço livre ao redor para ser reconhecido com segurança pela câmera do celular."),
        Spacer(1, 3 * mm),
        field("RESULTADO E DECISÃO", "O arquivo foi concluído em uma página A4 com seis unidades iguais. Mantivemos a fotografia dos estudantes porque ela mostra que o portal foi produzido por jovens da própria escola. Também preservamos as palavras pesquisa, memória, território e inovação, que resumem os principais eixos do projeto.", MINT),
        Spacer(1, 4 * mm),
    ]

    if SANTINHOS.exists():
        evidence = Image(str(SANTINHOS), width=52 * mm, height=74 * mm)
        caption = Table([
            [p("EVIDÊNCIA DO REGISTRO", H3)],
            [p("Folha A4 com seis cartões do Campo Digital, contendo fotografia dos estudantes, identidade visual do projeto, endereço do portal e QR Code.", SMALL)],
            [p("Reflexão: além de apresentar o projeto, o material precisava ser pequeno, legível, fácil de recortar e simples de usar pelo celular.", NOTE)],
        ], colWidths=[111 * mm])
        caption.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CREAM),
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        ev = Table([[evidence, caption]], colWidths=[58 * mm, 116 * mm])
        ev.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 4)]))
        s.append(KeepTogether([ev]))

    s += [Spacer(1, 6 * mm),
          p("Semana 33 · preparação para a fase estadual", H2),
          meta("05/10/2026", "Período de planejamento", "Ambiente de organização e desenvolvimento do projeto", "Professor orientador e equipe do projeto Campo Digital. Os estudantes participarão da conferência e da preparação dos próximos registros."),
          Spacer(1, 4 * mm),
          field("OBJETIVO", "Revisar o caderno de campo e compreender as exigências do edital para a apresentação em vídeo da fase estadual do Ceará Científico 2026."),
          Spacer(1, 3 * mm),
          field("ATIVIDADE REALIZADA", "Analisamos a continuação do caderno referente às semanas 28 a 32 e comparamos o documento com as orientações do Anexo IX do edital. Identificamos que os registros semanais descrevem a evolução do portal, mas precisam evidenciar melhor datas, locais, participação dos estudantes, procedimentos, dificuldades, resultados, reflexões e materiais comprobatórios."),
          Spacer(1, 3 * mm),
          field("ANÁLISE DO EDITAL", "Também estudamos os Anexos VII, XII e XIII. Confirmamos que o vídeo da pesquisa deve ter entre um e quatro minutos, ser gravado na posição horizontal, apresentar boa qualidade de imagem e som e ser publicado no YouTube como não listado. O conteúdo precisa mostrar escola, estudantes, professor orientador, título, área, objetivo, metodologia, resultados e conclusão, sem contrariar o resumo inscrito."),
          Spacer(1, 3 * mm)]

    decisions = Table([
        [p("DECISÃO", H3), p("MOTIVO", H3)],
        [p("Atualizar o caderno antes da gravação.", BODY), p("Os registros ajudarão os estudantes a recuperar a sequência real da pesquisa e explicar o processo com segurança.", BODY)],
        [p("Dividir a apresentação entre os dois estudantes.", BODY), p("O edital avalia a participação compartilhada e o entrosamento da equipe.", BODY)],
        [p("Usar imagens reais do território e do desenvolvimento.", BODY), p("As evidências tornam a metodologia e os resultados mais fáceis de compreender.", BODY)],
        [p("Manter o vídeo abaixo de quatro minutos.", BODY), p("Esse é o limite máximo definido no edital para a mídia da pesquisa.", BODY)],
    ], colWidths=[63 * mm, 111 * mm], repeatRows=1)
    decisions.setStyle(TableStyle([
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
    s += [decisions, Spacer(1, 4 * mm),
          field("RESULTADO E PRÓXIMOS PASSOS", "Definimos que a atualização do caderno deve ser concluída com a participação dos estudantes, utilizando fotografias, capturas de tela e relatos pessoais. Depois dessa conferência, será produzido o roteiro do vídeo, realizada a divisão das falas, escolhidas as cenas de apoio e iniciados os ensaios. Cada uma dessas ações deverá receber um novo registro no caderno quando realmente acontecer.", MINT),
          Spacer(1, 4 * mm),
          p("Observação de continuidade", H3),
          p("Não foram localizados registros documentais suficientes para descrever atividades específicas entre 1º e 4 de outubro. Por isso, nenhum acontecimento foi acrescentado a esses dias. Caso a equipe possua fotografias, mensagens, arquivos ou anotações desse período, os registros poderão ser complementados posteriormente.", NOTE)]
    return s


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=23 * mm, bottomMargin=18 * mm,
        title="Campo Digital - Continuação do Caderno de Campo",
        author="Projeto Campo Digital",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body")
    doc.addPageTemplates([PageTemplate(id="normal", frames=[frame], onPage=header_footer)])
    doc.build(build_story())
    print(OUT)


if __name__ == "__main__":
    build()
