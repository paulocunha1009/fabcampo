from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
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
OUT = ROOT / "output" / "pdf" / "Guia_Atualizacao_Caderno_de_Campo_Campo_Digital.pdf"
LOGO = ROOT / "img" / "logo" / "campo-digital-logo-header.png"

GREEN = HexColor("#0F3F25")
GREEN_2 = HexColor("#1F6F3B")
BLUE = HexColor("#0B5DA8")
YELLOW = HexColor("#F3B51B")
CREAM = HexColor("#F4F8F0")
MINT = HexColor("#EAF5EC")
PALE_BLUE = HexColor("#EAF3FA")
INK = HexColor("#173C2A")
MUTED = HexColor("#52685B")
LINE = HexColor("#C6D9CB")
WHITE = colors.white


def register_fonts():
    base = Path(r"C:\Windows\Fonts")
    for name, file in {
        "Segoe": "segoeui.ttf",
        "Segoe-Semibold": "seguisb.ttf",
        "Segoe-Bold": "segoeuib.ttf",
        "Segoe-Italic": "segoeuii.ttf",
    }.items():
        path = base / file
        if path.exists():
            pdfmetrics.registerFont(TTFont(name, str(path)))


register_fonts()
styles = getSampleStyleSheet()

BODY = ParagraphStyle(
    "Body", fontName="Segoe", fontSize=9.2, leading=13.2,
    textColor=INK, spaceAfter=5, allowWidows=0, allowOrphans=0,
)
SMALL = ParagraphStyle(
    "Small", parent=BODY, fontSize=7.8, leading=10.5, textColor=MUTED,
)
H1 = ParagraphStyle(
    "H1", fontName="Segoe-Bold", fontSize=23, leading=26,
    textColor=GREEN, spaceAfter=7,
)
H2 = ParagraphStyle(
    "H2", fontName="Segoe-Bold", fontSize=15, leading=18,
    textColor=GREEN, spaceBefore=7, spaceAfter=7,
)
H3 = ParagraphStyle(
    "H3", fontName="Segoe-Bold", fontSize=10.5, leading=13,
    textColor=GREEN, spaceAfter=4,
)
LABEL = ParagraphStyle(
    "Label", fontName="Segoe-Bold", fontSize=7.5, leading=9,
    textColor=BLUE, spaceAfter=2,
)
WHITE_TITLE = ParagraphStyle(
    "WhiteTitle", fontName="Segoe-Bold", fontSize=22, leading=25,
    textColor=WHITE, alignment=TA_LEFT,
)
WHITE_BODY = ParagraphStyle(
    "WhiteBody", fontName="Segoe", fontSize=10, leading=14,
    textColor=WHITE,
)
CENTER = ParagraphStyle(
    "Center", parent=BODY, alignment=TA_CENTER,
)


def P(text, style=BODY):
    return Paragraph(text, style)


def bullet(text):
    return P(f"<font color='#F3B51B'>●</font> {text}", BODY)


def info_card(title, body, color=MINT):
    data = [[P(title, H3)], [P(body, BODY)]]
    t = Table(data, colWidths=[174 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("LINEBEFORE", (0, 0), (0, -1), 3, YELLOW),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 9),
    ]))
    return t


def week_card(week, dates, known, complete):
    header = Table(
        [[P(f"SEMANA {week}", ParagraphStyle("wk", parent=LABEL, textColor=WHITE)),
          P(dates, ParagraphStyle("dt", parent=SMALL, textColor=WHITE, alignment=TA_LEFT))]],
        colWidths=[31 * mm, 137 * mm],
    )
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    body = Table([
        [P("O QUE JÁ ESTÁ REGISTRADO", LABEL)],
        [P(known, BODY)],
        [P("O QUE OS ALUNOS DEVEM COMPLETAR", LABEL)],
        [P(complete, BODY)],
    ], colWidths=[168 * mm])
    body.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return KeepTogether([header, body, Spacer(1, 5 * mm)])


def lined_box(label, height=18 * mm):
    rows = [[P(label, LABEL)]]
    for _ in range(max(2, int(height / (7 * mm)))):
        rows.append([P("________________________________________________________________________________", SMALL)])
    t = Table(rows, colWidths=[174 * mm])
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.65, LINE),
        ("BACKGROUND", (0, 0), (-1, 0), MINT),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def page_header_footer(c, doc):
    page_w, page_h = A4
    c.saveState()
    c.setFillColor(GREEN)
    c.rect(0, page_h - 17 * mm, page_w, 17 * mm, stroke=0, fill=1)
    c.drawImage(str(LOGO), 17 * mm, page_h - 14 * mm, width=43 * mm,
                height=10 * mm, preserveAspectRatio=True, mask="auto")
    c.setFillColor(WHITE)
    c.setFont("Segoe-Semibold", 7.5)
    c.drawRightString(page_w - 17 * mm, page_h - 10.5 * mm,
                      "GUIA DE ATUALIZAÇÃO DO CADERNO DE CAMPO")
    c.setStrokeColor(YELLOW)
    c.setLineWidth(1.2)
    c.line(17 * mm, 13 * mm, page_w - 17 * mm, 13 * mm)
    c.setFillColor(MUTED)
    c.setFont("Segoe", 7)
    c.drawString(17 * mm, 8.5 * mm, "Campo Digital · EEMPC Francisco Araújo Barros · Itarema/CE · 2026")
    c.drawRightString(page_w - 17 * mm, 8.5 * mm, f"{doc.page}")
    c.restoreState()


def build_story():
    story = []

    # Capa
    hero = Table([
        [Image(str(LOGO), width=57 * mm, height=14 * mm)],
        [Spacer(1, 8 * mm)],
        [P("GUIA DE ATUALIZAÇÃO", ParagraphStyle("eyebrow", parent=LABEL, textColor=YELLOW, fontSize=9))],
        [P("Caderno de Campo", WHITE_TITLE)],
        [P("Semanas 28 a 33 · preparação para a fase estadual", WHITE_BODY)],
        [Spacer(1, 8 * mm)],
        [P("Um material simples para ajudar cada estudante a registrar o que fez, o que observou, o que aprendeu e quais decisões a equipe tomou.", WHITE_BODY)],
    ], colWidths=[174 * mm], rowHeights=[18 * mm, 8 * mm, None, None, None, 8 * mm, None])
    hero.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 14 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14 * mm),
        ("TOPPADDING", (0, 0), (-1, 0), 11 * mm),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 13 * mm),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story += [Spacer(1, 13 * mm), hero, Spacer(1, 10 * mm)]
    story.append(info_card(
        "ANTES DE COMEÇAR",
        "Este guia não substitui o caderno original. Ele serve para organizar a memória da equipe e facilitar a escrita. <b>Não copie uma atividade que você não realizou.</b> Confira datas, horários, nomes e resultados antes de passar o texto para o caderno.",
        PALE_BLUE,
    ))
    story += [Spacer(1, 8 * mm), P("Como usar", H2)]
    for text in [
        "Leia o resumo de cada semana.",
        "Converse com a equipe e recupere fotos, mensagens, arquivos e lembranças.",
        "Complete quem participou, o que cada pessoa fez e quais dificuldades apareceram.",
        "Registre o resultado real, inclusive quando algo não funcionou.",
        "Cole ou identifique as evidências: fotos, capturas de tela, tabelas, testes e links.",
    ]:
        story.append(bullet(text))
    story.append(PageBreak())

    # Regras do edital
    story += [P("O que o avaliador precisa encontrar", H1)]
    story.append(P("O Anexo IX do edital valoriza registros cronológicos, claros e acompanhados por evidências. Cada anotação deve permitir que outra pessoa compreenda como a pesquisa foi desenvolvida.", BODY))
    grid = []
    items = [
        ("1 · Data e horário", "Quando a atividade aconteceu."),
        ("2 · Local", "Onde a equipe trabalhou ou realizou a observação."),
        ("3 · Participantes", "Quem esteve presente e o que cada estudante fez."),
        ("4 · Objetivo", "O que a equipe pretendia descobrir, produzir ou testar."),
        ("5 · Procedimento", "Como a atividade foi feita, com quais ferramentas e fontes."),
        ("6 · Resultado", "O que funcionou, o que não funcionou e quais dados foram obtidos."),
        ("7 · Reflexão", "O que o resultado significa e qual decisão veio depois."),
        ("8 · Evidência", "Foto, desenho, tabela, captura de tela, link ou documento."),
    ]
    for i in range(0, len(items), 2):
        row = []
        for title, body in items[i:i+2]:
            row.append(Table([[P(title, H3)], [P(body, SMALL)]], colWidths=[80 * mm], style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), CREAM),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ])))
        grid.append(row)
    table = Table(grid, colWidths=[84 * mm, 84 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 4), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    story += [Spacer(1, 3 * mm), table, Spacer(1, 5 * mm)]
    story.append(info_card(
        "LINGUAGEM RECOMENDADA",
        "Escreva frases simples e específicas. Em vez de “mexemos no site”, prefira: “Testamos a página inicial em dois celulares, percebemos que três imagens demoravam para abrir e reduzimos o tamanho dos arquivos”.",
        MINT,
    ))
    story.append(PageBreak())

    # Semanas 28 e 29
    story += [P("Roteiro de atualização · parte 1", H1)]
    story.append(P("Use os resumos abaixo apenas como ponto de partida. Acrescente os acontecimentos reais lembrados pela equipe.", BODY))
    story.append(week_card(
        "28", "31/08 a 06/09/2026",
        "Fase escolar realizada em 1º de setembro e complementação do acervo visual do portal com imagens que estavam faltando.",
        "Data, horário e local da apresentação; quem apresentou cada parte; perguntas recebidas; sugestões da banca; dificuldades percebidas; avaliação da própria equipe; fotos da apresentação e decisão tomada após a fase escolar.",
    ))
    story.append(week_card(
        "29", "07 a 13/09/2026",
        "Criação da Expedição e do Catálogo do Território; ajustes para celular; correção de imagens; vídeo e legendas na página de memória; melhorias no assistente, no formulário de contato e nos testes do portal.",
        "Quem pesquisou e organizou os marcos históricos; como os desafios foram escolhidos; quais celulares foram usados nos testes; quais erros apareceram; como a equipe conferiu as correções; capturas de tela antes e depois; resultado do teste com vários acessos.",
    ))
    story.append(PageBreak())

    # Semanas 30 e 31
    story += [P("Roteiro de atualização · parte 2", H1)]
    story.append(week_card(
        "30", "14 a 20/09/2026",
        "Renovação da identidade visual; padronização das páginas; reorganização dos cartões; fotografias; contraste; menu; adaptação para celular; busca global; banner; Analytics e Search Console.",
        "Por que o visual anterior precisava mudar; referências usadas; páginas comparadas; problemas de leitura encontrados; testes de contraste e celular; participação de cada estudante; diferença entre configurar acompanhamento e já possuir resultados de público; evidências visuais.",
    ))
    story.append(week_card(
        "31", "21 a 27/09/2026",
        "Publicação da Planilha de Organização Financeira Rural e do manual; integração com a pesquisa sobre mudanças climáticas; criação da identidade SabIA e dos modos Perguntar, Aprender, Quiz e Explorar; testes e documentação.",
        "Problema das famílias produtoras que motivou a planilha; dados e conhecimentos usados; fórmulas ou indicadores testados; teste pelo celular e Google Planilhas; proteção de células; perguntas usadas para validar a SabIA; respostas inadequadas encontradas e correções realizadas.",
    ))
    story.append(PageBreak())

    # Semanas 32 e 33
    story += [P("Roteiro de atualização · parte 3", H1)]
    story.append(week_card(
        "32", "28/09 a 04/10/2026",
        "Preparação do folder A4 frente e verso e dos cartões de divulgação com seis unidades por folha A4, usando a identidade do projeto, fotografias reais e QR Code.",
        "Completar as atividades feitas entre 1º e 4 de outubro; indicar quem selecionou textos e imagens; registrar as versões rejeitadas e por quê; teste do QR Code; celulares usados; resultado da impressão ou visualização; ajustes de contraste, corte e legibilidade.",
    ))
    story.append(week_card(
        "33", "05 a 11/10/2026 · preencher conforme acontecer",
        "Início da atualização do caderno para a fase estadual e planejamento do vídeo exigido pelo edital.",
        "Registrar separadamente cada reunião, leitura do edital, escolha das cenas, divisão das falas, ensaio, gravação, edição, conferência com o resumo, postagem não listada no YouTube e envio do link. Anotar problemas de áudio, iluminação ou duração e as soluções adotadas.",
    ))
    story.append(info_card(
        "ATENÇÃO À SEMANA 33",
        "O texto acima é um roteiro para atividades futuras. Só transforme um item em registro depois que ele realmente acontecer, com data, horário, local, participantes e resultado.",
        PALE_BLUE,
    ))
    story.append(PageBreak())

    # Ficha reproduzível
    story += [P("Ficha de registro de atividade", H1)]
    story.append(P("Use uma ficha para cada atividade importante. Ela pode ser preenchida primeiro a lápis e depois transcrita para o caderno oficial.", BODY))
    meta = Table([
        [P("DATA", LABEL), P("HORÁRIO", LABEL), P("LOCAL", LABEL)],
        [P("____/____/2026", BODY), P("____:____", BODY), P("________________________________", BODY)],
    ], colWidths=[48 * mm, 43 * mm, 83 * mm])
    meta.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
        ("BACKGROUND", (0, 0), (-1, 0), MINT),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story += [meta, Spacer(1, 4 * mm)]
    for label, height in [
        ("PARTICIPANTES E O QUE CADA PESSOA FEZ", 22 * mm),
        ("OBJETIVO DA ATIVIDADE", 16 * mm),
        ("COMO A ATIVIDADE FOI REALIZADA", 25 * mm),
        ("OBSERVAÇÕES, DADOS E RESULTADOS", 27 * mm),
        ("DIFICULDADES ENCONTRADAS E COMO FORAM RESOLVIDAS", 22 * mm),
        ("REFLEXÃO DA EQUIPE E PRÓXIMO PASSO", 22 * mm),
    ]:
        story += [lined_box(label, height), Spacer(1, 3 * mm)]
    story.append(PageBreak())

    # Evidências e checagem
    story += [P("Evidências e conferência final", H1)]
    story.append(P("A evidência deve ajudar o avaliador a entender o processo. Não coloque uma imagem apenas para decorar.", BODY))
    evidence_rows = [[P("TIPO DE EVIDÊNCIA", LABEL), P("O QUE PRECISA APARECER", LABEL), P("LEGENDA", LABEL)]]
    for a, b, c in [
        ("Fotografia", "Equipe realizando a atividade, entrevista, visita ou teste.", "Data, local, pessoas e ação."),
        ("Captura de tela", "Página, planilha, erro, correção ou resultado do portal.", "O que estava sendo verificado."),
        ("Tabela ou gráfico", "Dados coletados ou comparação dos resultados.", "Fonte, período e significado."),
        ("Documento ou fonte", "Trecho realmente usado na pesquisa.", "Título, autor/instituição e acesso."),
        ("Teste", "Aparelho, procedimento e resultado obtido.", "O que funcionou ou precisou mudar."),
    ]:
        evidence_rows.append([P(a, SMALL), P(b, SMALL), P(c, SMALL)])
    ev = Table(evidence_rows, colWidths=[31 * mm, 83 * mm, 60 * mm], repeatRows=1)
    ev.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.55, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, CREAM]),
    ]))
    story += [Spacer(1, 3 * mm), ev, Spacer(1, 7 * mm), P("Checklist antes de entregar", H2)]
    for text in [
        "Todos os registros estão em ordem cronológica.",
        "Cada atividade possui data, horário e local.",
        "A participação dos estudantes está descrita com clareza.",
        "Os resultados correspondem ao que realmente aconteceu.",
        "As dificuldades e mudanças de direção também foram registradas.",
        "As fotos e capturas possuem legendas explicativas.",
        "As fontes externas estão identificadas.",
        "O texto está legível, sem rasuras que impeçam a leitura.",
        "O caderno mostra a relação entre problema, metodologia, resultados e conclusão.",
        "Os estudantes conseguem explicar oralmente tudo o que foi registrado.",
    ]:
        story.append(P(f"☐ {text}", BODY))
    story += [Spacer(1, 5 * mm), info_card(
        "REGRA DE OURO",
        "O melhor caderno não é o que parece perfeito. É o que mostra, com sinceridade e evidências, como a equipe pesquisou, aprendeu, errou, corrigiu e chegou aos resultados apresentados.",
        MINT,
    )]
    return story


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=23 * mm, bottomMargin=18 * mm,
        title="Guia de Atualização do Caderno de Campo - Campo Digital",
        author="Projeto Campo Digital",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=page_header_footer)])
    doc.build(build_story())
    print(OUT)


if __name__ == "__main__":
    build()
