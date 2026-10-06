from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether, HRFlowable
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "Plano_Video_e_Cronograma_Estadual_Campo_Digital_2026.pdf"
LOGO = ROOT / "img" / "logo" / "campo-digital-logo-header.png"
PHOTO = ROOT / "tmp" / "pdfs" / "banner-images" / "asset-011.png"

GREEN = colors.HexColor("#0F3F25")
GREEN2 = colors.HexColor("#1F6F3B")
BLUE = colors.HexColor("#0B5DA8")
YELLOW = colors.HexColor("#F3B51B")
CREAM = colors.HexColor("#F4F8F0")
MINT = colors.HexColor("#EAF5EC")
INK = colors.HexColor("#17352A")
GRAY = colors.HexColor("#5B6D65")
LINE = colors.HexColor("#C9DACE")
WHITE = colors.white


def register_fonts():
    candidates = [
        ("C:/Windows/Fonts/aptos.ttf", "C:/Windows/Fonts/aptosbd.ttf"),
        ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/arialbd.ttf"),
    ]
    for regular, bold in candidates:
        if Path(regular).exists() and Path(bold).exists():
            pdfmetrics.registerFont(TTFont("Portal", regular))
            pdfmetrics.registerFont(TTFont("Portal-Bold", bold))
            return


register_fonts()
FONT = "Portal" if "Portal" in pdfmetrics.getRegisteredFontNames() else "Helvetica"
BOLD = "Portal-Bold" if "Portal-Bold" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold"


def P(text, style="body", **kw):
    return Paragraph(text, ParagraphStyle(f"{style}-inline", parent=ST[style], **kw) if kw else ST[style])


styles = getSampleStyleSheet()
ST = {
    "body": ParagraphStyle("body", fontName=FONT, fontSize=9.2, leading=13.1, textColor=INK, spaceAfter=5),
    "small": ParagraphStyle("small", fontName=FONT, fontSize=7.6, leading=10.1, textColor=INK),
    "tiny": ParagraphStyle("tiny", fontName=FONT, fontSize=6.6, leading=8.4, textColor=INK),
    "title": ParagraphStyle("title", fontName=BOLD, fontSize=26, leading=29, textColor=GREEN),
    "h1": ParagraphStyle("h1", fontName=BOLD, fontSize=18, leading=21, textColor=GREEN, spaceAfter=8),
    "h2": ParagraphStyle("h2", fontName=BOLD, fontSize=12.2, leading=15, textColor=GREEN, spaceBefore=5, spaceAfter=5),
    "h3": ParagraphStyle("h3", fontName=BOLD, fontSize=9.5, leading=12, textColor=GREEN),
    "white": ParagraphStyle("white", fontName=FONT, fontSize=9, leading=13, textColor=WHITE),
    "whitebold": ParagraphStyle("whitebold", fontName=BOLD, fontSize=12, leading=15, textColor=WHITE),
    "center": ParagraphStyle("center", fontName=BOLD, fontSize=9, leading=12, alignment=TA_CENTER, textColor=GREEN),
}


def footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(GREEN)
    canvas.rect(0, 0, w, 0.52*cm, fill=1, stroke=0)
    canvas.setFont(FONT, 7)
    canvas.setFillColor(WHITE)
    canvas.drawString(1.45*cm, 0.19*cm, "CAMPO DIGITAL  |  Etapa Estadual 2026")
    canvas.drawRightString(w-1.45*cm, 0.19*cm, f"{doc.page}")
    canvas.restoreState()


def table(data, widths, header=True, font=7.4, row_bgs=None):
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    cmds = [
        ("FONTNAME", (0,0), (-1,-1), FONT),
        ("FONTSIZE", (0,0), (-1,-1), font),
        ("LEADING", (0,0), (-1,-1), font+2.7),
        ("TEXTCOLOR", (0,0), (-1,-1), INK),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("GRID", (0,0), (-1,-1), 0.35, LINE),
        ("LEFTPADDING", (0,0), (-1,-1), 5),
        ("RIGHTPADDING", (0,0), (-1,-1), 5),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]
    if header:
        cmds += [("BACKGROUND", (0,0), (-1,0), GREEN), ("TEXTCOLOR", (0,0), (-1,0), WHITE), ("FONTNAME", (0,0), (-1,0), BOLD)]
    for i in range(1 if header else 0, len(data)):
        if i % 2 == 0:
            cmds.append(("BACKGROUND", (0,i), (-1,i), CREAM))
    if row_bgs:
        for r, c in row_bgs.items(): cmds.append(("BACKGROUND", (0,r), (-1,r), c))
    t.setStyle(TableStyle(cmds))
    return t


def bullet(text, color=GREEN2):
    return Table([["•", P(text, "body")]], colWidths=[0.32*cm, 16.0*cm], style=TableStyle([
        ("FONTNAME", (0,0), (0,0), BOLD), ("FONTSIZE", (0,0), (0,0), 13), ("TEXTCOLOR", (0,0), (0,0), color),
        ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 2), ("TOPPADDING", (0,0), (-1,-1), 0), ("BOTTOMPADDING", (0,0), (-1,-1), 1),
    ]))


def section_title(kicker, title, desc=None):
    parts = [P(kicker.upper(), "small", textColor=YELLOW, fontName=BOLD, spaceAfter=3), P(title, "h1"), HRFlowable(width="100%", thickness=1.2, color=LINE, spaceAfter=8)]
    if desc: parts.append(P(desc, "body"))
    return parts


class Doc(BaseDocTemplate):
    pass


OUT.parent.mkdir(parents=True, exist_ok=True)
doc = Doc(str(OUT), pagesize=A4, leftMargin=1.45*cm, rightMargin=1.45*cm, topMargin=1.2*cm, bottomMargin=0.9*cm,
          title="Plano de vídeo e cronograma de melhorias — Campo Digital", author="Campo Digital")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])

story = []

# CAPA
if LOGO.exists():
    story.append(Image(str(LOGO), width=5.2*cm, height=1.55*cm, hAlign="LEFT"))
story += [Spacer(1, 0.35*cm), P("PLANO PARA A ETAPA ESTADUAL", "small", textColor=YELLOW, fontName=BOLD, spaceAfter=5),
          P("Vídeo, evidências e<br/>próximas melhorias", "title"), Spacer(1, 0.15*cm),
          P("Campo Digital: tecnologia educacional para memória, saberes do campo e inclusão digital", "h2"),
          P("Material de trabalho para Kauemberg, João Lucas e equipe • Ceará Científico 2026", "body", textColor=GRAY)]
if PHOTO.exists():
    im = Image(str(PHOTO), width=17.0*cm, height=8.2*cm)
    im.hAlign = "CENTER"
    story += [Spacer(1, 0.35*cm), im]
story += [Spacer(1, 0.4*cm), Table([[P("OBJETIVO", "whitebold"), P("Chegar à etapa estadual com uma narrativa clara, provas organizadas e participação equilibrada dos estudantes.", "white")]], colWidths=[3.0*cm, 13.7*cm], style=TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), GREEN), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 12), ("RIGHTPADDING", (0,0), (-1,-1), 12),
    ("TOPPADDING", (0,0), (-1,-1), 12), ("BOTTOMPADDING", (0,0), (-1,-1), 12),
]))]
story.append(PageBreak())

# CRITÉRIOS
story += section_title("1. Nosso mapa de preparação", "O que será avaliado", "As melhorias foram priorizadas pelos pesos do edital. O vídeo precisa ser bonito, mas principalmente coerente com a pesquisa e sustentado por evidências.")
virt = [
    [P("Avaliação virtual", "small"), P("Peso", "small"), P("Como responder", "small")],
    ["Conhecimento científico e problema", "20%", "Explicar o problema local, fontes consultadas e limites do que sabemos."],
    ["Materiais e métodos", "20%", "Mostrar diagnóstico, pesquisa de campo, curadoria, desenvolvimento, publicação e validação."],
    ["Clareza e objetividade", "15%", "Roteiro simples, frases curtas, ritmo seguro e vídeo com menos de 4 minutos."],
    ["Criatividade e inovação", "10%", "Apresentar a integração entre memória, território e tecnologia para uma necessidade real."],
    ["Relevância", "10%", "Relacionar o portal à preservação dos saberes e à visibilidade da comunidade."],
    ["Impacto coletivo", "10%", "Separar resultados comprovados de impactos que ainda serão medidos."],
    ["Mídia", "10%", "Imagem horizontal, som limpo, boa luz, legendas e publicação como não listado."],
    ["Processo participativo", "5%", "Dividir a fala e evidenciar estudantes, moradores, escola e parceiros."],
]
story.append(table(virt, [5.1*cm, 1.3*cm, 10.3*cm], font=7.1))
story += [Spacer(1, 0.35*cm), P("Na apresentação presencial", "h2"), P("Além dos itens acima, o banner e o caderno de campo valem <b>10% cada</b>. Por isso, o vídeo, o portal, o banner e o caderno devem contar a mesma história e usar os mesmos dados.", "body")]
story.append(Table([[P("REGRA DE OURO", "whitebold"), P("Não confundir quantidade de páginas e registros com impacto social. Impacto precisa de depoimento, formulário, dado de acesso ou outra evidência verificável.", "white")]], colWidths=[3.2*cm, 13.5*cm], style=TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), BLUE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 10), ("RIGHTPADDING", (0,0), (-1,-1), 10),
    ("TOPPADDING", (0,0), (-1,-1), 9), ("BOTTOMPADDING", (0,0), (-1,-1), 9),
])))
story.append(PageBreak())

# APRENDIZADOS
story += section_title("2. Depois da regional", "O que precisa ficar mais forte", "A regional confirmou a força do projeto. Agora a equipe deve trocar afirmações genéricas por explicações curtas acompanhadas de prova.")
for text in [
    "<b>Produto x resultado:</b> o portal é o produto; o acervo organizado, as páginas publicadas e os recursos funcionais são resultados documentados.",
    "<b>Resultado x impacto:</b> aprendizagem, alcance e mudança na comunidade só devem ser afirmados quando houver registro da avaliação.",
    "<b>Números consistentes:</b> confirmar os totais de páginas, marcos históricos e espécies; verificar sobreposição entre plantas nativas e medicinais antes de somar.",
    "<b>Créditos claros:</b> pesquisas sobre mudanças climáticas, produção agrícola e Cultivando Vida são trabalhos estudantis hospedados no portal e precisam ser apresentados com autoria correta.",
    "<b>Participação demonstrável:</b> dizer quem pesquisou, quem forneceu dados, quem revisou e como cada contribuição aparece no portal.",
    "<b>Inovação contextual:</b> não afirmar que é o primeiro portal; explicar por que essa combinação de pesquisa territorial, acervo e tecnologia responde a uma necessidade local.",
]: story.append(bullet(text))
story += [Spacer(1, 0.2*cm), P("Perguntas que todos devem conseguir responder", "h2")]
qs = [
    ["1", "Onde está a ciência no projeto?"], ["2", "Qual foi sua contribuição pessoal?"],
    ["3", "O que já é resultado e o que ainda é expectativa?"], ["4", "Como resolveram dados divergentes?"],
    ["5", "Por que esta solução é inovadora para o território?"], ["6", "O que foi testado com moradores e estudantes?"],
    ["7", "O que acontece se a internet falhar?"], ["8", "Como o portal atende pessoas com diferentes necessidades?"],
]
story.append(Table([[P(f"{n}", "center"), P(q, "body")] for n,q in qs], colWidths=[1.0*cm, 15.7*cm], style=TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), MINT), ("BOX", (0,0), (-1,-1), 0.6, LINE),
    ("INNERGRID", (0,0), (-1,-1), 0.35, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6),
])))
story.append(PageBreak())

# VIDEO PARTE 1
story += section_title("3. Roteiro do vídeo", "Duração-alvo: 3min40s", "Formato horizontal. Falas naturais, alternadas e gravadas em ambiente silencioso. O edital aceita de 1 a 4 minutos; deixamos margem de segurança.")
video1 = [
    ["Tempo", "Cena", "Responsável", "Mensagem principal"],
    ["0:00–0:12", "Imagens do território, escola e portal", "Voz de ambos", "‘Em nosso território, muitas memórias e saberes ainda dependiam da oralidade e de documentos dispersos.’"],
    ["0:12–0:30", "Estudantes em quadro; nomes na tela", "Kauemberg / João Lucas", "Apresentar escola, estudantes, orientador, título e área: Robótica, Automação e Aplicação das TIC."],
    ["0:30–0:55", "Documentos, entrevistas e comunidade", "Kauemberg", "Explicar o risco de perda e a invisibilidade digital do acervo comunitário."],
    ["0:55–1:12", "Página inicial do portal", "João Lucas", "Objetivo: registrar, organizar e divulgar história, memória e saberes do Assentamento Lagoa do Mineiro."],
    ["1:12–1:32", "Fotos do diagnóstico e da pesquisa", "Kauemberg", "Etapas 1–3: diagnóstico, pesquisa de campo e curadoria das fontes."],
    ["1:32–1:52", "Código, testes e publicação", "João Lucas", "Etapas 4–6: desenvolvimento, publicação e validação; citar HTML, CSS, JavaScript e infraestrutura sem alongar."],
]
story.append(table([[P(str(c), "small") for c in row] for row in video1], [2.0*cm, 4.0*cm, 3.0*cm, 7.7*cm], font=6.8))
story += [Spacer(1, 0.35*cm), P("Orientação de gravação", "h2")]
for t in ["Olhar para a lente, não para a tela.", "Gravar cada fala duas vezes e escolher a mais natural.", "Capturar 5 a 8 segundos de cada imagem de apoio, sem movimentos rápidos.", "Evitar ler parágrafos; entender a ideia e falar com palavras próprias."]:
    story.append(bullet(t))
story.append(PageBreak())

# VIDEO PARTE 2
story += section_title("3. Roteiro do vídeo", "Resultados, impacto e fechamento")
video2 = [
    ["Tempo", "Cena", "Responsável", "Mensagem principal"],
    ["1:52–2:18", "Navegação pelo acervo", "Kauemberg", "Mostrar resultados confirmados: páginas temáticas, linha do tempo, catálogo de plantas e recursos educacionais. Usar somente totais já revisados."],
    ["2:18–2:38", "SabIA e materiais práticos", "João Lucas", "Apresentar recursos tecnológicos como apoio à pesquisa e à aprendizagem, sem dizer que substituem professores ou fontes."],
    ["2:38–3:02", "Testes e caderno de campo", "Ambos", "Explicar validação técnica já realizada e reconhecer que a avaliação sistemática com moradores será a próxima etapa."],
    ["3:02–3:25", "Território + estudantes trabalhando", "Kauemberg", "Inovação e relevância: estudantes transformaram pesquisa local em acervo público, pesquisável e mantido pela escola."],
    ["3:25–3:43", "Dupla diante da escola; endereço na tela", "João Lucas / ambos", "Conclusão e frase final: ‘Quando a escola valoriza o lugar onde vive, a tecnologia deixa de ser distância e passa a ser ponte.’"],
]
story.append(table([[P(str(c), "small") for c in row] for row in video2], [2.0*cm, 4.0*cm, 3.0*cm, 7.7*cm], font=6.9))
story += [Spacer(1, 0.35*cm), P("Checklist obrigatório do edital", "h2")]
checks = [
    ["□", "Vídeo entre 1 e 4 minutos"], ["□", "Formato horizontal e boa iluminação"],
    ["□", "Som claro e música apenas se não competir com a voz"], ["□", "Identificação completa do projeto e da equipe"],
    ["□", "Problema, objetivo, metodologia, resultados e conclusão"], ["□", "Falas coerentes com o resumo inscrito"],
    ["□", "Legendas revisadas"], ["□", "YouTube como ‘Não listado’; link testado em outro celular"],
]
story.append(Table([[P(a,"center"), P(b,"body")] for a,b in checks], colWidths=[0.9*cm, 7.3*cm]*1, style=TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), CREAM), ("GRID", (0,0), (-1,-1), 0.4, LINE),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
])))
story.append(PageBreak())

# CRONOGRAMA IMEDIATO
story += section_title("4. Cronograma imediato", "Do roteiro à avaliação virtual", "Datas organizadas a partir de 5 de outubro de 2026. Se alguma etapa atrasar, preservar primeiro: coerência científica, áudio compreensível e prazo de envio.")
schedule = [
    ["Data", "Entrega", "Ações", "Critério fortalecido"],
    ["05–06 out", "Base científica fechada", "Revisar resumo inscrito, totais, fontes, créditos e caderno mestre.", "Fundamentação; métodos"],
    ["06–07 out", "Roteiro final", "Adaptar as falas, dividir tempo e conferir coerência com a inscrição.", "Clareza; relevância"],
    ["07–08 out", "Pasta de evidências", "Separar fotos, telas, documentos, autorizações e legendas.", "Participação; impacto"],
    ["08–09 out", "Ensaios 1 e 2", "Cronometrar, ajustar dicção e verificar a migração do projeto até 9/10.", "Mídia; clareza"],
    ["09–10 out", "Gravação", "Gravar falas e imagens de apoio em horizontal; salvar duas cópias.", "Mídia; participação"],
    ["10–12 out", "Primeiro corte", "Editar, limpar áudio, inserir identificação e legendas.", "Mídia; objetividade"],
    ["13 out", "Banca interna", "Aplicar a rubrica virtual e registrar correções obrigatórias.", "Todos"],
    ["14 out", "Versão final", "Corrigir, exportar e assistir do início ao fim em celular e computador.", "Mídia; clareza"],
    ["15 out", "Envio seguro", "Publicar como não listado; testar link e manter arquivo reserva.", "Conformidade"],
    ["16–30 out", "Avaliação virtual", "Manter evidências, resumo e contatos organizados.", "Etapa oficial"],
    ["04 nov", "Resultado virtual", "Ler devolutivas e abrir plano de correções para a presencial.", "Aprendizado"],
    ["01–03 dez", "Etapa presencial", "Apresentar portal, banner, caderno e evidências alinhados.", "Quadro 04"],
]
story.append(table([[P(str(c), "small") for c in row] for row in schedule], [2.0*cm, 3.1*cm, 7.3*cm, 4.3*cm], font=6.8))
story.append(PageBreak())

# ROADMAP
story += section_title("5. Futuras melhorias", "O que fazer e em que ordem", "O portal já existe e funciona. Agora o foco é medir, validar e ampliar com responsabilidade — sem tentar desenvolver tudo antes do vídeo.")
road = [
    ["Fase", "Melhoria", "Evidência de conclusão", "Critério"],
    ["ANTES DA VIRTUAL", "Matriz de fontes, números e créditos", "Planilha revisada pela equipe e orientador", "Fundamentação"],
    ["ANTES DA VIRTUAL", "Validação estudantil do caderno reconstruído", "Assinaturas/registro de leitura e correções", "Caderno; participação"],
    ["ANTES DA VIRTUAL", "Teste dos caminhos críticos do portal", "Checklist em celular, computador e internet lenta", "Métodos; mídia"],
    ["NOVEMBRO", "Escuta estruturada com moradores e escola", "Formulário curto, consentimento e síntese das respostas", "Impacto; participação"],
    ["NOVEMBRO", "Linha de base de acesso com privacidade", "Relatório simples: acessos, páginas e dispositivos", "Impacto"],
    ["NOVEMBRO", "Banner orientado por evidências", "Versão com menos texto, mais provas visuais e QR testado", "Banner; clareza"],
    ["NOVEMBRO", "Treino de banca e contingência offline", "Simulação gravada, respostas avaliadas e cópia local", "Clareza; métodos"],
    ["CONTINUIDADE", "Banco de entrevistas com autorização", "Termos, áudios, transcrições e créditos", "Participação; memória"],
    ["CONTINUIDADE", "Mapa comunitário interativo", "Pontos de memória, agricultura e biodiversidade revisados", "Inovação; ciência"],
    ["CONTINUIDADE", "Observatório rural escolar", "Indicadores simples de clima, produção e território", "Ciência; impacto"],
    ["CONTINUIDADE", "SabIA com base revisada e fallback", "Fontes rastreáveis, testes e aviso de limites", "Inovação; segurança"],
    ["CONTINUIDADE", "Acesso offline e governança editorial", "Protótipo PWA + protocolo de revisão e publicação", "Acessibilidade; continuidade"],
]
story.append(table([[P(str(c), "small") for c in row] for row in road], [2.6*cm, 5.1*cm, 5.7*cm, 3.3*cm], font=6.65))
story += [Spacer(1, 0.3*cm), P("Já concluído — não deve aparecer como melhoria futura", "h2")]
story.append(P("Portal com domínio próprio; páginas temáticas; layout responsivo; SabIA; planilha e manual de organização financeira; catálogo, expedição, materiais de divulgação e caderno de campo mestre. Esses itens entram como <b>resultados</b> e podem receber aperfeiçoamentos.", "body"))
story.append(PageBreak())

# MATRIZ E RESPONSABILIDADES
story += section_title("6. Organização da equipe", "Cada tarefa precisa de dono e prova")
owners = [
    ["Frente", "Responsável principal", "Apoio", "Arquivo ou prova"],
    ["Conferência científica", "Kauemberg", "Orientador", "Matriz de fontes e números"],
    ["Roteiro e fala", "João Lucas", "Kauemberg", "Roteiro cronometrado"],
    ["Seleção de imagens", "Kauemberg", "Equipe escolar", "Pasta com nomes e créditos"],
    ["Gravação", "Ambos", "Orientador", "Arquivos brutos em duas cópias"],
    ["Edição e legendas", "João Lucas", "Kauemberg", "Versão 1 + lista de correções"],
    ["Validação final", "Equipe completa", "Professor convidado", "Rubrica preenchida"],
    ["Envio e backup", "Orientador", "Estudantes", "Link não listado + arquivo original"],
]
story.append(table([[P(str(c), "small") for c in row] for row in owners], [4.2*cm, 4.0*cm, 3.7*cm, 4.8*cm], font=7))
story += [Spacer(1, 0.4*cm), P("Semáforo de prontidão (0–1–2)", "h2"),
          P("Cada estudante responde sem ler. A equipe só avança quando todos os itens essenciais alcançarem 2.", "body")]
ready = [
    ["Nota", "Significado", "Ação"],
    ["0", "Não consigo explicar", "Rever o conteúdo e observar a evidência."],
    ["1", "Explico com ajuda", "Treinar com perguntas e reduzir a fala à ideia central."],
    ["2", "Explico e mostro a prova", "Pronto; ajudar o colega a chegar ao mesmo nível."],
]
story.append(table([[P(str(c), "small") for c in row] for row in ready], [1.6*cm, 5.2*cm, 9.9*cm], font=7.4))
story += [Spacer(1, 0.35*cm), P("Itens para pontuar", "h2")]
for t in ["Problema e relevância", "Objetivo", "Metodologia", "Resultados comprovados", "Inovação local", "Impacto e seus limites", "Participação comunitária", "Contribuição individual", "Funcionamento do portal", "Plano futuro"]:
    story.append(bullet(t))
story.append(PageBreak())

# FECHAMENTO
story += section_title("7. Reunião com os estudantes", "Pauta sugerida: 45 minutos")
meeting = [
    ["Tempo", "Atividade", "Resultado"],
    ["5 min", "Relembrar a conquista da regional e o objetivo da estadual", "Equipe situada"],
    ["8 min", "Ler os critérios e destacar os pesos maiores", "Prioridades compreendidas"],
    ["12 min", "Distribuir e ensaiar o roteiro do vídeo", "Primeira marcação de tempo"],
    ["8 min", "Conferir números, créditos e evidências", "Pendências registradas"],
    ["7 min", "Definir responsáveis e prazos", "Quadro de tarefas preenchido"],
    ["5 min", "Aplicar o semáforo 0–1–2", "Plano individual de estudo"],
]
story.append(table([[P(str(c), "small") for c in row] for row in meeting], [2.0*cm, 8.0*cm, 6.7*cm], font=7.3))
story += [Spacer(1, 0.5*cm), Table([[P("DECISÃO DA EQUIPE", "whitebold"), P("Primeiro consolidamos as provas e o vídeo. Depois da avaliação virtual, usamos o retorno da banca para orientar as melhorias de novembro e preparar a apresentação presencial.", "white")]], colWidths=[4.0*cm, 12.7*cm], style=TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), GREEN), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 12), ("RIGHTPADDING", (0,0), (-1,-1), 12),
    ("TOPPADDING", (0,0), (-1,-1), 14), ("BOTTOMPADDING", (0,0), (-1,-1), 14),
])), Spacer(1, 1.0*cm), P("“Quando a escola valoriza o lugar onde vive, a tecnologia deixa de ser distância e passa a ser ponte.”", "h1", alignment=TA_CENTER),
          Spacer(1, 0.4*cm), P("www.fabcampo.com.br", "center", fontSize=12, textColor=BLUE)]

doc.build(story)
print(OUT)
