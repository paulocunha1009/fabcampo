from pathlib import Path
from shutil import copy2

from PIL import Image as PILImage, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Image, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "materiais" / "organizacao-financeira"
PUBLIC = ROOT / "downloads" / "organizacao-financeira"
ASSETS = ROOT / "tmp" / "manual-v3-assets"
PREVIEWS = ROOT / "tmp" / "finance-workbook-preview"
PDF = OUT / "Manual_Planilha_Organizacao_Financeira_Rural_Campo_Digital.pdf"
PUBLIC_PDF = PUBLIC / PDF.name
LOGO = ROOT / "img" / "logo" / "campo-digital-logo-header.png"
MARK = ROOT / "img" / "logo" / "campo-digital-simbolo-watermark.png"

for folder in (OUT, PUBLIC, ASSETS):
    folder.mkdir(parents=True, exist_ok=True)

GREEN = colors.HexColor("#0B4D2A")
GREEN2 = colors.HexColor("#18723D")
BLUE = colors.HexColor("#0B5B89")
BLUE2 = colors.HexColor("#1677B8")
YELLOW = colors.HexColor("#EAB51E")
INK = colors.HexColor("#153D2B")
MUTED = colors.HexColor("#52655B")
PALE = colors.HexColor("#F4F8F1")
BORDER = colors.HexColor("#D6E4D8")
PAGE_W, PAGE_H = A4

base = getSampleStyleSheet()
styles = {
    "cover_title": ParagraphStyle("cover_title", parent=base["Title"], fontName="Helvetica-Bold", fontSize=27, leading=31, textColor=colors.white, alignment=TA_LEFT, spaceAfter=10),
    "cover_sub": ParagraphStyle("cover_sub", parent=base["BodyText"], fontName="Helvetica", fontSize=12, leading=17, textColor=colors.HexColor("#EAF7EF")),
    "h1": ParagraphStyle("h1", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=20, leading=23, textColor=GREEN, spaceAfter=7),
    "body": ParagraphStyle("body", parent=base["BodyText"], fontName="Helvetica", fontSize=10.5, leading=14.5, textColor=INK, spaceAfter=6),
    "small": ParagraphStyle("small", parent=base["BodyText"], fontName="Helvetica", fontSize=8.4, leading=11.5, textColor=MUTED),
    "card_body": ParagraphStyle("card_body", parent=base["BodyText"], fontName="Helvetica", fontSize=9.4, leading=13, textColor=INK),
    "chip": ParagraphStyle("chip", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=7.8, leading=9, textColor=BLUE, alignment=TA_CENTER),
}


def font(size, bold=False):
    path = Path("C:/Windows/Fonts") / ("arialbd.ttf" if bold else "arial.ttf")
    return ImageFont.truetype(str(path), size) if path.exists() else ImageFont.load_default()


def rounded(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def multiline(draw, xy, text, fnt, fill, width_chars=30, spacing=7):
    words, lines, current = text.split(), [], ""
    for word in words:
        test = (current + " " + word).strip()
        if len(test) > width_chars and current:
            lines.append(current)
            current = word
        else:
            current = test
    if current:
        lines.append(current)
    draw.multiline_text(xy, "\n".join(lines), font=fnt, fill=fill, spacing=spacing)


def make_phone(name, title, subtitle, steps, app_screen=False):
    img = PILImage.new("RGB", (820, 1420), "#EEF4EE")
    d = ImageDraw.Draw(img)
    rounded(d, (120, 35, 700, 1385), 58, "#14251D")
    rounded(d, (142, 80, 678, 1340), 42, "#FFFFFF")
    rounded(d, (325, 52, 495, 73), 12, "#33443C")
    d.rectangle((142, 80, 678, 205), fill="#0B4D2A")
    d.text((178, 118), title, font=font(35, True), fill="white")
    d.text((178, 166), subtitle, font=font(20), fill="#DDEBE2")
    y = 245
    if app_screen:
        rounded(d, (180, y, 640, y + 270), 28, "#F7FAF7", "#CADBCF", 3)
        d.polygon([(230, y+55), (285, y+55), (315, y+85), (315, y+175), (230, y+175)], fill="#188038")
        for yy in (y+95, y+118, y+141):
            d.rectangle((245, yy, 300, yy+7), fill="white")
        d.text((345, y+62), "Google Planilhas", font=font(28, True), fill="#17352A")
        d.text((345, y+107), "Google LLC", font=font(20), fill="#5C6F66")
        rounded(d, (345, y+155, 545, y+215), 25, "#188038")
        d.text((395, y+172), "Instalar", font=font(23, True), fill="white")
        y += 315
    for number, heading, body in steps:
        rounded(d, (180, y, 640, y + 185), 26, "#F7FAF7", "#D6E4D8", 3)
        d.ellipse((205, y+34, 275, y+104), fill="#0B5B89")
        d.text((230, y+49), str(number), font=font(28, True), fill="white")
        d.text((300, y+35), heading, font=font(25, True), fill="#0B4D2A")
        multiline(d, (205, y+116), body, font(20), "#344E40", 38, 5)
        y += 210
    d.text((178, 1290), "Tela ilustrativa. Os nomes dos botões podem mudar.", font=font(16), fill="#687A70")
    path = ASSETS / f"{name}.png"
    img.save(path, optimize=True)
    return path


def crop_preview(source_name, crop, output_name):
    src = PILImage.open(PREVIEWS / source_name).convert("RGB")
    cut = src.crop(crop)
    canvas = PILImage.new("RGB", (1500, 720), "#EEF4EE")
    scale = min(1420 / cut.width, 640 / cut.height)
    cut = cut.resize((int(cut.width * scale), int(cut.height * scale)), PILImage.Resampling.LANCZOS)
    x, y = (1500-cut.width)//2, (720-cut.height)//2
    d = ImageDraw.Draw(canvas)
    rounded(d, (20, 20, 1480, 700), 28, "#FFFFFF", "#CBDDCF", 4)
    canvas.paste(cut, (x, y))
    path = ASSETS / output_name
    canvas.save(path, optimize=True)
    return path


phone_install = make_phone("01-instalar", "Google Planilhas", "Primeiro acesso no celular", [(1, "Abra a loja", "No Android, abra a Play Store."), (2, "Procure o app", "Digite Google Planilhas na busca."), (3, "Instale", "Confirme que o aplicativo é do Google.")], True)
phone_download = make_phone("02-baixar", "Campo Digital", "Baixar pelo portal", [(1, "Abra a página", "Entre na pesquisa Mudanças Climáticas no Campo."), (2, "Ache a ferramenta", "Desça até Organização Financeira Rural."), (3, "Toque em baixar", "Escolha Baixar a planilha e espere terminar.")])
phone_open = make_phone("03-abrir", "Arquivos", "Abrir a planilha", [(1, "Abra Downloads", "Procure o arquivo terminado em .xlsx."), (2, "Escolha Planilhas", "Toque em Abrir com Google Planilhas."), (3, "Guarde uma cópia", "Salve uma cópia antes de começar a preencher.")])
phone_edit = make_phone("04-editar", "Google Planilhas", "Preencher uma célula", [(1, "Toque duas vezes", "Escolha uma célula amarela."), (2, "Digite o valor", "Use o teclado do celular."), (3, "Confirme", "Toque no sinal de certo para salvar.")])
shot_start = crop_preview("comece-aqui.png", (40, 20, 1490, 390), "05-comece-aqui.png")
shot_entries = crop_preview("lancamentos.png", (40, 20, 1940, 500), "06-lancamentos.png")
shot_crop = crop_preview("safra-e-clima.png", (40, 20, 1650, 560), "07-safra.png")
shot_panel = crop_preview("painel.png", (40, 20, 1500, 760), "08-painel.png")
shot_goals = crop_preview("metas-e-reserva.png", (40, 20, 1120, 740), "09-metas.png")


def pic(path, width=15.8*cm, max_height=10.3*cm):
    im = PILImage.open(path)
    ratio = min(width / im.width, max_height / im.height)
    obj = Image(str(path), width=im.width*ratio, height=im.height*ratio)
    obj.hAlign = "CENTER"
    return obj


def step_card(number, title, body, accent=GREEN2):
    num = Paragraph(f"<b>{number}</b>", ParagraphStyle("num"+str(number), parent=styles["body"], textColor=colors.white, alignment=TA_CENTER))
    text = Paragraph(f"<b>{title}</b><br/>{body}", styles["card_body"])
    t = Table([[num, text]], colWidths=[1.0*cm, 6.5*cm])
    t.setStyle(TableStyle([("BACKGROUND", (0,0), (0,0), accent), ("BACKGROUND", (1,0), (1,0), colors.white), ("BOX", (0,0), (-1,-1), .6, BORDER), ("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("LEFTPADDING", (0,0), (-1,-1), 8), ("RIGHTPADDING", (0,0), (-1,-1), 8), ("TOPPADDING", (0,0), (-1,-1), 9), ("BOTTOMPADDING", (0,0), (-1,-1), 9)]))
    return t


def two_cards(a, b):
    t = Table([[step_card(*a), step_card(*b)]], colWidths=[7.75*cm, 7.75*cm])
    t.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 8)]))
    return t


def notice(title, body, color=YELLOW, fill="#FFF8DC"):
    t = Table([[Paragraph(f"<b>{title}</b><br/>{body}", styles["body"])]], colWidths=[15.8*cm])
    t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), colors.HexColor(fill)), ("LINEBEFORE", (0,0), (0,-1), 4, color), ("BOX", (0,0), (-1,-1), .6, BORDER), ("LEFTPADDING", (0,0), (-1,-1), 12), ("RIGHTPADDING", (0,0), (-1,-1), 12), ("TOPPADDING", (0,0), (-1,-1), 9), ("BOTTOMPADDING", (0,0), (-1,-1), 9)]))
    return t


def section(number, title, intro):
    chip = Table([[Paragraph(f"PASSO {number}", styles["chip"])]], colWidths=[1.85*cm])
    chip.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#E1F2FF")), ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5)]))
    return [chip, Spacer(1,.18*cm), Paragraph(title, styles["h1"]), Paragraph(intro, styles["body"])]


def page_background(canvas, doc):
    canvas.saveState()
    if doc.page == 1:
        canvas.setFillColor(GREEN); canvas.rect(0,0,PAGE_W,PAGE_H,fill=1,stroke=0)
        canvas.setFillColor(BLUE); canvas.rect(PAGE_W*.72,0,PAGE_W*.28,PAGE_H,fill=1,stroke=0)
        canvas.setStrokeColor(YELLOW); canvas.setLineWidth(3); canvas.line(1.7*cm,2.0*cm,PAGE_W-1.7*cm,2.0*cm)
    else:
        canvas.setFillColor(PALE); canvas.rect(0,0,PAGE_W,PAGE_H,fill=1,stroke=0)
        canvas.setFillColor(GREEN); canvas.rect(0,PAGE_H-1.42*cm,PAGE_W,1.42*cm,fill=1,stroke=0)
        canvas.setFillColor(BLUE); canvas.rect(PAGE_W*.78,PAGE_H-1.42*cm,PAGE_W*.22,1.42*cm,fill=1,stroke=0)
        if LOGO.exists(): canvas.drawImage(str(LOGO),1.7*cm,PAGE_H-1.15*cm,width=3.25*cm,height=.82*cm,preserveAspectRatio=True,mask="auto")
        if MARK.exists():
            canvas.saveState(); canvas.setFillAlpha(.045); canvas.drawImage(str(MARK),PAGE_W-4.4*cm,1.9*cm,width=3.1*cm,height=3.1*cm,preserveAspectRatio=True,mask="auto"); canvas.restoreState()
        canvas.setStrokeColor(BORDER); canvas.line(1.7*cm,1.30*cm,PAGE_W-1.7*cm,1.30*cm)
        canvas.setFillColor(MUTED); canvas.setFont("Helvetica",7.7)
        canvas.drawString(1.7*cm,.88*cm,"Campo Digital | Manual para uso no celular")
        canvas.drawRightString(PAGE_W-1.7*cm,.88*cm,f"Página {doc.page} | Versão 3.0 - 2026")
    canvas.restoreState()


story=[]
if LOGO.exists(): story += [Spacer(1,.8*cm), pic(LOGO,5.4*cm,1.4*cm), Spacer(1,2.0*cm)]
story += [Paragraph("MANUAL VISUAL",ParagraphStyle("cover_chip",parent=styles["chip"],textColor=colors.white,backColor=BLUE2,borderPadding=6,alignment=TA_LEFT)),Spacer(1,.4*cm),Paragraph("Organização<br/>Financeira Rural",styles["cover_title"]),Paragraph("Aprenda no celular, passo a passo, usando o Google Planilhas.",styles["cover_sub"]),Spacer(1,.75*cm),two_cards(("1","LINGUAGEM SIMPLES","Pouco texto e ações diretas.",GREEN2),("2","PRINTS PRÁTICOS","Telas da própria planilha.",BLUE2)),Spacer(1,.35*cm),two_cards(("3","CAMPOS PROTEGIDOS","Fórmulas bloqueadas no Excel.",YELLOW),("4","FEITO PARA CELULAR","Google Planilhas como caminho principal.",GREEN2)),Spacer(1,.8*cm),Paragraph("Campo Digital | EEMPC Francisco Araújo Barros<br/>Ceará Científico 2026",ParagraphStyle("cover_footer",parent=styles["small"],textColor=colors.white,leading=14)),PageBreak()]

story += section(0,"O caminho completo","Siga esta ordem. Não é preciso fazer curso nem conhecer fórmulas.")
story += [two_cards(("1","Instalar","Baixe o Google Planilhas.",GREEN2),("2","Baixar","Pegue o arquivo no portal.",BLUE2)),Spacer(1,.3*cm),two_cards(("3","Abrir","Abra o .xlsx no aplicativo.",YELLOW),("4","Preencher","Digite somente nos campos amarelos.",GREEN2)),Spacer(1,.3*cm),two_cards(("5","Conferir","Veja o Painel e os gráficos.",BLUE2),("6","Guardar","Salve uma cópia todo mês.",YELLOW)),Spacer(1,.5*cm),notice("Antes de começar","Tenha uma conta Google e espaço livre no celular. Não coloque CPF, senha bancária, número de conta ou dados que identifiquem a família."),PageBreak()]
story += section(1,"Instalar o Google Planilhas","No Android, use a Play Store. No iPhone, use a App Store.")
story += [pic(phone_install,8.8*cm,16.0*cm),Spacer(1,.25*cm),notice("Confira o aplicativo","Instale o aplicativo oficial do Google. O nome é Google Planilhas. Depois, abra o aplicativo e entre com sua conta Google.",BLUE2,"#EAF4FB"),PageBreak()]
story += section(2,"Baixar a planilha no portal","Use o navegador do celular, como Chrome, e abra a página da pesquisa.")
story += [pic(phone_download,8.8*cm,16.0*cm),Spacer(1,.25*cm),notice("Espere o download","O arquivo termina com .xlsx. Não feche o navegador antes do download terminar."),PageBreak()]
story += section(3,"Abrir e guardar uma cópia","Abra o arquivo baixado com o aplicativo Google Planilhas.")
story += [pic(phone_open,8.8*cm,16.0*cm),Spacer(1,.25*cm),notice("Guarde o original vazio","Faça uma cópia antes de preencher. Use um nome simples, como Organizacao Financeira Familia 2026. Não use CPF no nome."),PageBreak()]
story += section(4,"Entender cores e abas","A cor mostra o que você pode ou não pode mudar.")
story += [pic(shot_start,15.8*cm,8.3*cm),Spacer(1,.3*cm),two_cards(("AMARELO","VOCÊ PREENCHE","Toque e digite a informação.",YELLOW),("AZUL","A PLANILHA CALCULA","Não apague nem escreva por cima.",BLUE2)),Spacer(1,.3*cm),two_cards(("VERDE","ORIENTAÇÃO","Leia os títulos e avisos.",GREEN2),("ABAS","PARTE DE BAIXO","Deslize para encontrar cada página.",BLUE2)),Spacer(1,.35*cm),notice("Regra principal","Se a célula não estiver amarela, não altere. Isso evita erros nos cálculos."),PageBreak()]
story += section(5,"Preencher pelo celular","Para escrever, toque duas vezes na célula amarela.")
story += [pic(phone_edit,8.8*cm,16.0*cm),Spacer(1,.2*cm),notice("Se o teclado cobrir a tela","Gire o celular de lado ou feche o teclado depois de confirmar o valor. Use dois dedos para aumentar e diminuir a tela.",BLUE2,"#EAF4FB"),PageBreak()]
story += section(6,"Registrar dinheiro que entrou ou saiu","Na aba Lançamentos, use uma linha para cada venda, gasto ou valor guardado.")
story += [pic(shot_entries,15.8*cm,7.0*cm),Spacer(1,.3*cm),two_cards(("1","Escolha o movimento","Receita, Despesa ou Reserva.",GREEN2),("2","Escolha a categoria","Venda, sementes, água, energia, transporte e outras.",BLUE2)),Spacer(1,.3*cm),two_cards(("3","Informe quantidade","Para um gasto único, digite 1.",YELLOW),("4","Informe o valor","A planilha calcula o total sozinha.",GREEN2)),Spacer(1,.35*cm),notice("Exemplo simples","Venda de 10 sacas de milho por R$ 90 cada: Movimento = Receita; Quantidade = 10; Unidade = saca; Valor unitário = 90."),PageBreak()]
story += section(7,"Registrar a safra e o clima","Na aba Safra e clima, compare o que esperava produzir com o que conseguiu produzir.")
story += [pic(shot_crop,15.8*cm,7.5*cm),Spacer(1,.3*cm),two_cards(("1","Planejado","Preencha área e produção esperada.",GREEN2),("2","Realizado","Digite a produção conseguida.",BLUE2)),Spacer(1,.3*cm),two_cards(("3","Perda","Informe a quantidade perdida.",YELLOW),("4","Impacto","Escolha seca, chuva, calor, pragas ou outro.",GREEN2)),Spacer(1,.35*cm),notice("Use o mesmo nome","Milho deve estar escrito do mesmo jeito nas abas Lançamentos e Safra e clima. Assim a receita e o custo aparecem corretamente."),PageBreak()]
story += section(8,"Ler o Painel e os gráficos","O Painel mostra quanto entrou, quanto saiu, o saldo e o valor guardado.")
story += [pic(shot_panel,15.8*cm,10.1*cm),Spacer(1,.3*cm),two_cards(("MÊS","ESCOLHA DE 1 A 12","Janeiro é 1. Dezembro é 12.",GREEN2),("GRÁFICOS","ATUALIZAÇÃO AUTOMÁTICA","Eles aparecem quando existem dados.",BLUE2)),Spacer(1,.35*cm),notice("Gráfico vazio não é erro","A planilha começa sem valores inventados. Depois dos lançamentos, os gráficos passam a mostrar seus dados.",BLUE2,"#EAF4FB"),PageBreak()]
story += section(9,"Criar reserva e meta","Na aba Metas e reserva, planeje dinheiro para períodos difíceis e para uma compra importante.")
story += [pic(shot_goals,15.8*cm,9.7*cm),Spacer(1,.3*cm),two_cards(("RESERVA","MESES DE PROTEÇÃO","Digite quantos meses deseja cobrir.",GREEN2),("META","OBJETIVO CONCRETO","Exemplo: sementes, bomba ou ferramenta.",BLUE2)),Spacer(1,.35*cm),notice("Como registrar o valor guardado","Na aba Lançamentos, escolha Movimento = Reserva. Depois escolha Reserva de emergência ou Meta na categoria."),PageBreak()]
story += section(10,"Proteção, cópia e ajuda","A planilha foi protegida para reduzir erros, mas ainda precisa de cuidado.")
story += [two_cards(("XLSX","CÉLULAS PROTEGIDAS","Fórmulas e campos críticos estão bloqueados. Só os campos de preenchimento ficam livres.",GREEN2),("GOOGLE","PROTEÇÃO DA PLANILHA","A equipe responsável configura quais células o usuário pode alterar.",BLUE2)),Spacer(1,.35*cm),notice("Por que alguns campos estão bloqueados?","Para evitar que uma fórmula seja apagada ou modificada sem querer. Isso mantém os cálculos, o Painel e os gráficos funcionando corretamente.",YELLOW,"#FFF8DC"),Spacer(1,.35*cm),two_cards(("CÓPIA","FAÇA UMA CÓPIA TODO MÊS","Use Fazer uma cópia e coloque o mês no nome.",GREEN2),("ERRO","VOLTE AO ORIGINAL","Não tente consertar fórmula pelo celular.",BLUE2)),Spacer(1,.35*cm),notice("Preencha somente os campos amarelos","Se uma célula estiver bloqueada, não é preciso desbloquear. Procure o campo amarelo indicado para aquela informação."),Spacer(1,.4*cm),Paragraph("Fontes de orientação: Ajuda oficial do Google Planilhas para Android e páginas do Portal Campo Digital. Material educativo; não substitui orientação contábil ou técnica.",styles["small"]),Spacer(1,.15*cm),Paragraph("Versão 3.0 | Campo Digital | Ceará Científico 2026",styles["small"])]

doc = SimpleDocTemplate(str(PDF),pagesize=A4,rightMargin=1.7*cm,leftMargin=1.7*cm,topMargin=1.85*cm,bottomMargin=1.65*cm,title="Manual visual da Planilha de Organização Financeira Rural",author="Campo Digital")
doc.build(story,onFirstPage=page_background,onLaterPages=page_background)
copy2(PDF,PUBLIC_PDF)
reader=PdfReader(str(PDF))
text="".join((p.extract_text() or "") for p in reader.pages)
assert len(reader.pages)==12,len(reader.pages)
assert "Google Planilhas" in text and "CÉLULAS PROTEGIDAS" in text
assert PDF.read_bytes()==PUBLIC_PDF.read_bytes()
print(PDF)
print(PUBLIC_PDF)
