from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "materiais" / "organizacao-financeira" / "tutorial"
SCENES = OUT / "cenas"
AUDIO = OUT / "audio"
SCENES.mkdir(parents=True, exist_ok=True)
AUDIO.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
GREEN = "#0B4D2A"
GREEN2 = "#1F7A45"
BLUE = "#0B5B89"
YELLOW = "#F2B705"
CREAM = "#F4F7F0"
TEXT = "#17352A"
MUTED = "#587064"
WHITE = "#FFFFFF"
FONT = Path(r"C:\Windows\Fonts\arial.ttf")
BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")

def font(size, bold=False):
    return ImageFont.truetype(str(BOLD if bold else FONT), size)

def wrap(draw, text, fnt, width):
    words = text.split()
    lines, current = [], ""
    for word in words:
        trial = (current + " " + word).strip()
        if draw.textbbox((0,0), trial, font=fnt)[2] <= width:
            current = trial
        else:
            if current: lines.append(current)
            current = word
    if current: lines.append(current)
    return lines

def add_text(draw, xy, text, fnt, fill, max_width, spacing=10):
    x,y=xy
    for line in wrap(draw,text,fnt,max_width):
        draw.text((x,y),line,font=fnt,fill=fill)
        y += fnt.size + spacing
    return y

def rounded_card(img, box, fill=WHITE, radius=28, outline="#D3E2D7"):
    d=ImageDraw.Draw(img)
    d.rounded_rectangle(box,radius=radius,fill=fill,outline=outline,width=2)

def screenshot(name):
    p=ROOT/"tmp"/"finance-workbook-preview"/name
    return Image.open(p).convert("RGB") if p.exists() else None

scenes = [
  {"title":"Organização Financeira Rural","subtitle":"Tutorial da planilha do Campo Digital","bullets":["Produção, custos e renda","Safra e impactos climáticos","Reservas, metas e gráficos"],"image":"painel.png","narration":"Olá! Neste tutorial vamos aprender a utilizar a Planilha de Organização Financeira Rural do Campo Digital. Ela foi criada para estudantes, famílias e produtores registrarem receitas, despesas, custos da produção, impactos climáticos, reservas e metas. A planilha é educativa, simples de preencher e foi desenvolvida para funcionar no Microsoft Excel e no Google Planilhas."},
  {"title":"Baixe e guarde uma cópia","subtitle":"Comece sempre pelo arquivo oficial","bullets":["Baixe o arquivo ponto xis xis xis","Mantenha uma cópia vazia","Crie uma cópia para cada ano ou grupo"],"image":"comece-aqui.png","narration":"No portal, clique no botão Baixar planilha e aguarde o arquivo em formato Excel. Antes de preencher, guarde uma cópia vazia como segurança. Depois faça uma nova cópia para cada família, grupo, turma ou ano. Use um nome simples no arquivo e nunca coloque CPF, número de conta ou outras informações bancárias."},
  {"title":"Excel ou Google Planilhas","subtitle":"Escolha onde deseja preencher","bullets":["Excel: abra e permita a edição","Google Drive: faça upload do arquivo","Abra com Google Planilhas e salve uma cópia"],"image":"comece-aqui.png","narration":"No Microsoft Excel, abra o arquivo e permita a edição somente se ele tiver sido baixado do portal oficial. Para usar no Google Planilhas, entre no Google Drive, clique em Novo, escolha Upload de arquivo e envie a planilha. Depois clique com o botão direito, abra com Google Planilhas e salve uma cópia no formato do Google."},
  {"title":"Preencha somente o amarelo","subtitle":"As cores orientam o uso","bullets":["Amarelo: campos para preencher","Azul: cálculos automáticos","Verde: orientações e indicadores"],"image":"comece-aqui.png","narration":"Na aba Comece aqui, informe o nome do grupo ou propriedade, a comunidade e o ano de referência. As cores ajudam: campos amarelos podem ser preenchidos; campos azuis são resultados calculados automaticamente; e áreas verdes apresentam orientações. Evite apagar fórmulas ou alterar células protegidas."},
  {"title":"Registre cada movimentação","subtitle":"Uma receita, despesa ou reserva por linha","bullets":["Escolha data, movimento e categoria","Informe cultura, quantidade e valor","O valor total é calculado automaticamente"],"image":"lancamentos.png","narration":"Na aba Lançamentos, registre uma movimentação por linha. Escolha a data, o tipo de movimento e a categoria. Depois informe a cultura ou atividade, uma descrição, a quantidade, a unidade e o valor unitário. Para um gasto ou recebimento único, use quantidade um. A planilha calcula o valor total automaticamente."},
  {"title":"Identifique custos e clima","subtitle":"Detalhes melhoram a análise","bullets":["Marque gastos essenciais","Informe a forma de pagamento","Sinalize despesas ligadas ao clima"],"image":"lancamentos.png","narration":"Complete também a forma de pagamento e informe se a despesa é essencial. Quando um gasto estiver relacionado à seca, chuva irregular, calor, pragas, doenças ou queimadas, marque Sim na coluna Relacionado ao clima. Essa informação aparece separadamente no painel e ajuda a compreender quanto os eventos climáticos afetam o orçamento."},
  {"title":"Acompanhe a safra","subtitle":"Compare o planejado com o realizado","bullets":["Informe produção esperada e realizada","Registre as perdas climáticas","Receitas e custos vêm dos lançamentos"],"image":"safra-e-clima.png","narration":"Na aba Safra e clima, informe a área planejada, a produção esperada, a produção realizada e a perda climática de cada cultura. Escolha também o principal impacto observado. As receitas e os custos são somados a partir da aba Lançamentos. Por isso, escreva o nome da cultura exatamente da mesma forma nas duas abas."},
  {"title":"Leia os indicadores","subtitle":"Escolha o mês no campo amarelo","bullets":["Entradas e despesas","Saldo do mês","Valor destinado à reserva"],"image":"painel.png","narration":"O Painel é a primeira aba da planilha. Escolha o número do mês no campo amarelo: janeiro é um e dezembro é doze. Os cartões superiores mostram as entradas, as despesas, o saldo e o valor reservado no período escolhido. O resumo anual apresenta todos os meses e destaca as despesas relacionadas ao clima."},
  {"title":"Gráficos que se atualizam","subtitle":"Os dados aparecem conforme o preenchimento","bullets":["Entradas e despesas por mês","Distribuição dos custos","Saldo, reservas e produção por cultura"],"image":"painel.png","narration":"A planilha possui quatro gráficos. O primeiro compara entradas e despesas ao longo do ano. O segundo mostra a distribuição dos custos no mês escolhido. O terceiro acompanha saldo e reservas. O quarto compara a produção esperada com a realizada. No primeiro acesso eles aparecem vazios, porque a planilha oficial não contém valores inventados. Eles são preenchidos automaticamente com os seus registros."},
  {"title":"Crie reserva e metas","subtitle":"Planeje períodos difíceis e investimentos","bullets":["Defina meses de proteção","Acompanhe a reserva de emergência","Planeje sementes, ferramentas ou irrigação"],"image":"metas-e-reserva.png","narration":"Na aba Metas e reserva, escolha quantos meses de proteção financeira deseja formar. A planilha calcula uma referência usando as despesas essenciais registradas. Você também pode criar uma meta para comprar sementes, fazer manutenção na bomba de irrigação, adquirir ferramentas ou enfrentar períodos de estiagem. Registre os valores guardados como Reserva e escolha a categoria correta."},
  {"title":"Faça uma revisão mensal","subtitle":"Transforme registros em decisões","bullets":["Confira receitas e todos os custos","Observe perdas e despesas climáticas","Salve uma cópia de segurança"],"image":"sobre-o-projeto.png","narration":"Ao final de cada mês, confira se todas as vendas e despesas foram registradas. Verifique os custos de sementes, água, energia, transporte e mão de obra. Observe se a produção ficou próxima da esperada e se foi possível guardar algum valor. Salve uma cópia de segurança. No Google Drive, o histórico de versões também ajuda a recuperar alterações."},
  {"title":"Proteja as informações","subtitle":"Use a ferramenta com responsabilidade","bullets":["Não registre senhas ou dados bancários","Não publique uma cópia preenchida","Consulte o manual sempre que precisar"],"image":"sobre-o-projeto.png","narration":"Não registre senhas, CPF, dados bancários ou informações desnecessárias. Uma planilha preenchida pertence à família ou ao grupo e não deve ser publicada. Para atividades escolares ou pesquisas, retire nomes e qualquer dado que identifique participantes. Se tiver dúvidas, consulte o manual disponível no portal. Campo Digital: tecnologia, memória e território a serviço da educação do campo."},
]

for idx, scene in enumerate(scenes, 1):
    img=Image.new("RGB",(W,H),CREAM)
    d=ImageDraw.Draw(img)
    d.rectangle((0,0,W,105),fill=GREEN)
    d.text((70,30),"CAMPO DIGITAL",font=font(36,True),fill=WHITE)
    d.text((W-520,38),f"TUTORIAL  {idx:02d}/{len(scenes):02d}",font=font(25,True),fill="#DCEEE2")
    d.text((80,150),scene["title"],font=font(54,True),fill=GREEN)
    d.text((82,220),scene["subtitle"],font=font(29),fill=MUTED)
    rounded_card(img,(70,290,755,945),fill=WHITE)
    y=345
    for bullet in scene["bullets"]:
        d.ellipse((110,y+8,134,y+32),fill=YELLOW)
        y=add_text(d,(158,y),bullet,font(31,True),TEXT,535,10)+37
    ss=screenshot(scene["image"])
    if ss:
        maxw,maxh=1030,650
        scale=min(maxw/ss.width,maxh/ss.height)
        ss=ss.resize((int(ss.width*scale),int(ss.height*scale)),Image.Resampling.LANCZOS)
        canvas=Image.new("RGB",(maxw+30,maxh+30),WHITE)
        x=(canvas.width-ss.width)//2; y2=(canvas.height-ss.height)//2
        canvas.paste(ss,(x,y2))
        canvas=canvas.filter(ImageFilter.UnsharpMask(radius=1,percent=110,threshold=3))
        rounded_card(img,(810,280,1880,960),fill=WHITE)
        img.paste(canvas,(825,295))
    d.rectangle((0,H-65,W,H),fill=BLUE)
    d.text((70,H-48),"fabcampo.com.br  |  Organização Financeira Rural",font=font(24),fill=WHITE)
    img.save(SCENES/f"cena-{idx:02d}.png",quality=95)

(OUT/"roteiro.json").write_text(json.dumps(scenes,ensure_ascii=False,indent=2),encoding="utf-8")
(OUT/"roteiro-narracao.txt").write_text("\n\n".join(f"CENA {i:02d} - {s['title']}\n{s['narration']}" for i,s in enumerate(scenes,1)),encoding="utf-8")
print(OUT)
