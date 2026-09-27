from pathlib import Path
from datetime import date

from openpyxl import Workbook, load_workbook
from openpyxl.chart import BarChart, DoughnutChart, LineChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.chart.series import SeriesLabel
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Protection, Side
from openpyxl.worksheet.datavalidation import DataValidation
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "materiais" / "organizacao-financeira"
OUT.mkdir(parents=True, exist_ok=True)
XLSX = OUT / "Planilha_Organizacao_Financeira_Rural_Campo_Digital_2026.xlsx"
PDF = OUT / "Manual_Planilha_Organizacao_Financeira_Rural_Campo_Digital.pdf"

GREEN = "0B4D2A"
GREEN2 = "1F7A45"
BLUE = "0B5B89"
YELLOW = "F2B705"
CREAM = "F5F8F1"
PALE_GREEN = "E7F3EA"
PALE_BLUE = "E8F2F8"
PALE_YELLOW = "FFF6D8"
WHITE = "FFFFFF"
TEXT = "17352A"
MUTED = "5C6F66"
GRID = "CDDCD2"
INPUT = "FFF2CC"

thin = Side(style="thin", color=GRID)


def title(ws, text, subtitle=None, end_col=8):
    ws.sheet_view.showGridLines = False
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=end_col)
    c = ws.cell(1, 1, text)
    c.font = Font(name="Arial", size=18, bold=True, color=WHITE)
    c.fill = PatternFill("solid", fgColor=GREEN)
    c.alignment = Alignment(vertical="center")
    ws.row_dimensions[1].height = 34
    if subtitle:
        ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=end_col)
        c = ws.cell(2, 1, subtitle)
        c.font = Font(name="Arial", size=10, color=MUTED, italic=True)
        c.alignment = Alignment(wrap_text=True, vertical="center")
        ws.row_dimensions[2].height = 30


def section(ws, row, text, start=1, end=8, color=BLUE):
    ws.merge_cells(start_row=row, start_column=start, end_row=row, end_column=end)
    c = ws.cell(row, start, text)
    c.fill = PatternFill("solid", fgColor=color)
    c.font = Font(name="Arial", size=11, bold=True, color=WHITE)
    c.alignment = Alignment(vertical="center")
    ws.row_dimensions[row].height = 24


def style_table(ws, min_row, max_row, min_col, max_col):
    for row in ws.iter_rows(min_row=min_row, max_row=max_row, min_col=min_col, max_col=max_col):
        for c in row:
            c.font = Font(name="Arial", size=10, color=TEXT)
            c.alignment = Alignment(vertical="center", wrap_text=True)
            c.border = Border(bottom=thin)


wb = Workbook()
ws = wb.active
ws.title = "Comece aqui"
title(ws, "Organização Financeira Rural", "Ferramenta educativa do Campo Digital para registrar produção, custos, renda, impactos climáticos, reservas e metas.", 10)
ws.column_dimensions["A"].width = 3
for col, width in {"B": 25, "C": 22, "D": 22, "E": 22, "F": 22, "G": 22, "H": 22, "I": 22, "J": 3}.items():
    ws.column_dimensions[col].width = width

section(ws, 4, "1  Identifique seu controle", 2, 9)
labels = [(6, "Nome da família, grupo ou propriedade"), (8, "Comunidade"), (10, "Ano de referência")]
for row, label in labels:
    ws.cell(row, 2, label).font = Font(name="Arial", size=10, bold=True, color=TEXT)
    ws.merge_cells(start_row=row, start_column=4, end_row=row, end_column=8)
    inp = ws.cell(row, 4)
    inp.fill = PatternFill("solid", fgColor=INPUT)
    inp.border = Border(bottom=Side(style="medium", color=YELLOW))
    inp.font = Font(name="Arial", size=10, color=BLUE)
ws["D10"] = 2026
for coord in ("D6", "D8", "D10"):
    ws[coord].protection = Protection(locked=False)

section(ws, 13, "2  Como usar", 2, 9)
steps = [
    (15, "01", "Preencha sua identificação", "Use apenas um nome de grupo ou propriedade. Evite inserir CPF, conta bancária ou outras informações sensíveis."),
    (18, "02", "Registre as movimentações", "Na aba Lançamentos, informe receitas, despesas e valores destinados à reserva ou a uma meta."),
    (21, "03", "Acompanhe a produção", "Na aba Safra e clima, compare produção esperada e realizada e registre perdas causadas por seca, chuva, calor ou pragas."),
    (24, "04", "Consulte os resultados", "As abas Painel e Metas e reserva são calculadas automaticamente. Não apague as fórmulas."),
]
for row, num, head, body in steps:
    ws.cell(row, 2, num).font = Font(name="Arial", size=16, bold=True, color=BLUE)
    ws.cell(row, 3, head).font = Font(name="Arial", size=11, bold=True, color=GREEN)
    ws.merge_cells(start_row=row+1, start_column=3, end_row=row+1, end_column=9)
    ws.cell(row+1, 3, body).font = Font(name="Arial", size=10, color=TEXT)
    ws.cell(row+1, 3).alignment = Alignment(wrap_text=True, vertical="top")
    ws.row_dimensions[row+1].height = 32

section(ws, 28, "3  Legenda", 2, 9)
for row, fill, head, body in [
    (30, INPUT, "Campos amarelos", "Informações que você pode preencher."),
    (32, PALE_BLUE, "Campos azuis", "Resultados calculados automaticamente."),
    (34, PALE_GREEN, "Campos verdes", "Orientações, indicadores e informações do projeto."),
]:
    ws.cell(row, 2).fill = PatternFill("solid", fgColor=fill)
    ws.cell(row, 2).border = Border(left=thin, right=thin, top=thin, bottom=thin)
    ws.cell(row, 3, head).font = Font(name="Arial", size=10, bold=True, color=TEXT)
    ws.merge_cells(start_row=row, start_column=4, end_row=row, end_column=9)
    ws.cell(row, 4, body).font = Font(name="Arial", size=10, color=MUTED)

section(ws, 37, "Sobre esta ferramenta", 2, 9)
ws.merge_cells("B39:I43")
ws["B39"] = (
    "Material autoral do projeto Campo Digital, desenvolvido a partir das páginas Produção Agrícola e Mudanças Climáticas no Campo. "
    "A pesquisa registrou 15 famílias, oito cultivos, forte dependência da renda agrícola e ausência de orçamento formal em 13 das 15 famílias. "
    "A planilha é educativa e não substitui orientação contábil, bancária ou técnica agrícola."
)
ws["B39"].font = Font(name="Arial", size=10, color=TEXT)
ws["B39"].alignment = Alignment(wrap_text=True, vertical="top")
ws["B39"].fill = PatternFill("solid", fgColor=PALE_GREEN)
ws["B39"].border = Border(left=Side(style="medium", color=GREEN))
ws.row_dimensions[39].height = 80
ws.merge_cells("B45:I47")
ws["B45"] = "Fontes internas: Portal Campo Digital - páginas Produção Agrícola e Mudanças Climáticas no Campo; TCC Portal Digital da Comunidade CC2026."
ws["B45"].font = Font(name="Arial", size=9, italic=True, color=MUTED)
ws["B45"].alignment = Alignment(wrap_text=True, vertical="top")
ws.protection.sheet = True
ws.protection.selectUnlockedCells = True

# Lançamentos
lan = wb.create_sheet("Lançamentos")
title(lan, "Lançamentos", "Preencha apenas as células amarelas. Para um valor único, use quantidade 1.", 13)
headers = ["Data", "Movimento", "Categoria", "Cultura ou atividade", "Descrição", "Quantidade", "Unidade", "Valor unitário", "Valor total", "Pagamento", "Essencial?", "Relacionado ao clima?", "Observação"]
for i, h in enumerate(headers, 1):
    c = lan.cell(4, i, h); c.fill = PatternFill("solid", fgColor=GREEN); c.font = Font(name="Arial", size=9, bold=True, color=WHITE); c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
lan.row_dimensions[4].height = 34
widths = [12, 14, 24, 21, 29, 12, 12, 16, 16, 17, 13, 18, 34]
for i, w in enumerate(widths, 1): lan.column_dimensions[chr(64+i)].width = w
for row in range(5, 305):
    for col in range(1, 14):
        c = lan.cell(row, col); c.fill = PatternFill("solid", fgColor=INPUT if col != 9 else PALE_BLUE); c.font = Font(name="Arial", size=9, color=TEXT); c.border = Border(bottom=thin); c.alignment = Alignment(vertical="center", wrap_text=(col in (5, 13)))
        c.protection = Protection(locked=(col == 9))
    lan.cell(row, 9, f'=IF(OR(B{row}="",F{row}="",H{row}=""),"",F{row}*H{row})')
    lan.cell(row, 1).number_format = "dd/mm/yyyy"
    for col in (8, 9): lan.cell(row, col).number_format = 'R$ #,##0.00;[Red]-R$ #,##0.00'
lan.freeze_panes = "A5"
lan.auto_filter.ref = "A4:M304"
validations = [
    ("B5:B304", '"Receita,Despesa,Reserva"'),
    ("C5:C304", '"Venda da produção,Compra de sementes,Insumos e adubo,Irrigação e água,Energia,Transporte,Mão de obra,Alimentação animal,Manutenção,Pragas e doenças,Perda climática,Despesa familiar,Reserva de emergência,Meta,Outros"'),
    ("G5:G304", '"unidade,kg,saca,litro,caixa,dúzia,animal,dia,serviço"'),
    ("J5:J304", '"Dinheiro,Pix,Débito,Crédito,Transferência,Outro"'),
    ("K5:K304", '"Sim,Não"'), ("L5:L304", '"Sim,Não"')]
for rng, formula in validations:
    dv = DataValidation(type="list", formula1=formula, allow_blank=True); lan.add_data_validation(dv); dv.add(rng)
lan.protection.sheet = True
lan.protection.selectUnlockedCells = True
lan.protection.selectLockedCells = True

# Safra e clima
saf = wb.create_sheet("Safra e clima")
title(saf, "Safra e clima", "Compare o planejado com o realizado. Receitas e custos vêm automaticamente da aba Lançamentos.", 11)
headers = ["Cultura ou atividade", "Área planejada (ha)", "Produção esperada", "Produção realizada", "Perda climática", "Perda (%)", "Receita", "Custo", "Resultado", "Impacto principal", "Observação"]
for i,h in enumerate(headers,1):
    c=saf.cell(5,i,h); c.fill=PatternFill("solid",fgColor=GREEN); c.font=Font(name="Arial",size=9,bold=True,color=WHITE); c.alignment=Alignment(horizontal="center",vertical="center",wrap_text=True)
crops=["Milho","Feijão","Mandioca","Hortaliças","Coco","Caju","Jerimum","Galinhas caipiras"]
for r in range(6,26):
    if r-6 < len(crops): saf.cell(r,1,crops[r-6])
    for c in range(1,12):
        cell=saf.cell(r,c); cell.fill=PatternFill("solid",fgColor=INPUT if c in (1,2,3,4,5,10,11) else PALE_BLUE); cell.font=Font(name="Arial",size=9,color=TEXT); cell.border=Border(bottom=thin); cell.alignment=Alignment(vertical="center",wrap_text=True); cell.protection=Protection(locked=c not in (1,2,3,4,5,10,11))
    saf.cell(r,6,f'=IF(OR(C{r}="",E{r}=""),"",IF(C{r}=0,0,E{r}/C{r}))')
    saf.cell(r,7,f'=IF(A{r}="","",SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Receita",\'Lançamentos\'!$D$5:$D$304,A{r}))')
    saf.cell(r,8,f'=IF(A{r}="","",SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Despesa",\'Lançamentos\'!$D$5:$D$304,A{r}))')
    saf.cell(r,9,f'=IF(A{r}="","",G{r}-H{r})')
    saf.cell(r,6).number_format="0.0%"
    for c in (7,8,9): saf.cell(r,c).number_format='R$ #,##0.00;[Red]-R$ #,##0.00'
for i,w in enumerate([22,17,17,17,16,12,15,15,15,22,34],1): saf.column_dimensions[chr(64+i)].width=w
dv=DataValidation(type="list",formula1='"Seca,Chuva irregular,Calor extremo,Pragas e doenças,Queimada,Outro,Sem impacto"',allow_blank=True); saf.add_data_validation(dv); dv.add("J6:J25")
saf.freeze_panes="A6"; saf.protection.sheet=True

# Painel
pan = wb.create_sheet("Painel", 1)
title(pan, "Painel financeiro", "Resultados automáticos. Escolha o ano e o mês para analisar.", 12)
pan.column_dimensions["A"].width=3
for col in "BCDEFHIJKL": pan.column_dimensions[col].width=15
pan.column_dimensions["G"].width=22
pan["B4"]="Ano"; pan["C4"]="='Comece aqui'!D10"; pan["E4"]="Mês (1 a 12)"; pan["F4"]=1
pan["C4"].fill=PatternFill("solid",fgColor=PALE_BLUE); pan["C4"].font=Font(name="Arial",size=11,bold=True,color=BLUE); pan["C4"].alignment=Alignment(horizontal="center")
pan["F4"].fill=PatternFill("solid",fgColor=INPUT); pan["F4"].font=Font(name="Arial",size=11,bold=True,color=BLUE); pan["F4"].alignment=Alignment(horizontal="center"); pan["F4"].protection=Protection(locked=False)
dv=DataValidation(type="whole",operator="between",formula1="1",formula2="12"); pan.add_data_validation(dv); dv.add(pan["F4"])
cards=[("B7","Entradas do mês",'=SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Receita",\'Lançamentos\'!$A$5:$A$304,">="&DATE($C$4,$F$4,1),\'Lançamentos\'!$A$5:$A$304,"<"&EDATE(DATE($C$4,$F$4,1),1))'),("E7","Despesas do mês",'=SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Despesa",\'Lançamentos\'!$A$5:$A$304,">="&DATE($C$4,$F$4,1),\'Lançamentos\'!$A$5:$A$304,"<"&EDATE(DATE($C$4,$F$4,1),1))'),("H7","Saldo do mês","=B8-E8"),("K7","Reservado no mês",'=SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Reserva",\'Lançamentos\'!$A$5:$A$304,">="&DATE($C$4,$F$4,1),\'Lançamentos\'!$A$5:$A$304,"<"&EDATE(DATE($C$4,$F$4,1),1))')]
for pos,label,formula in cards:
    col=pan[pos].column; row=pan[pos].row
    pan.merge_cells(start_row=row,start_column=col,end_row=row,end_column=col+1); pan.cell(row,col,label)
    pan.merge_cells(start_row=row+1,start_column=col,end_row=row+2,end_column=col+1); pan.cell(row+1,col,formula)
    for rr in range(row,row+3):
        for cc in range(col,col+2): pan.cell(rr,cc).fill=PatternFill("solid",fgColor=PALE_BLUE); pan.cell(rr,cc).border=Border(left=thin,right=thin,top=thin,bottom=thin)
    pan.cell(row,col).font=Font(name="Arial",size=10,bold=True,color=GREEN); pan.cell(row+1,col).font=Font(name="Arial",size=16,bold=True,color=BLUE); pan.cell(row+1,col).alignment=Alignment(horizontal="center",vertical="center"); pan.cell(row+1,col).number_format='R$ #,##0.00;[Red]-R$ #,##0.00'
section(pan, 13, "Resumo anual", 2, 12)
pan.append([])
for i,h in enumerate(["Mês","Entradas","Despesas","Reservas","Saldo","Despesas ligadas ao clima"],2):
    c=pan.cell(15,i,h); c.fill=PatternFill("solid",fgColor=GREEN); c.font=Font(name="Arial",size=9,bold=True,color=WHITE); c.alignment=Alignment(horizontal="center")
months=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
for idx,m in enumerate(months,1):
    r=15+idx; pan.cell(r,2,m)
    pan.cell(r,3,f'=SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Receita",\'Lançamentos\'!$A$5:$A$304,">="&DATE($C$4,{idx},1),\'Lançamentos\'!$A$5:$A$304,"<"&EDATE(DATE($C$4,{idx},1),1))')
    pan.cell(r,4,f'=SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Despesa",\'Lançamentos\'!$A$5:$A$304,">="&DATE($C$4,{idx},1),\'Lançamentos\'!$A$5:$A$304,"<"&EDATE(DATE($C$4,{idx},1),1))')
    pan.cell(r,5,f'=SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Reserva",\'Lançamentos\'!$A$5:$A$304,">="&DATE($C$4,{idx},1),\'Lançamentos\'!$A$5:$A$304,"<"&EDATE(DATE($C$4,{idx},1),1))')
    pan.cell(r,6,f'=C{r}-D{r}')
    pan.cell(r,7,f'=SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Despesa",\'Lançamentos\'!$L$5:$L$304,"Sim",\'Lançamentos\'!$A$5:$A$304,">="&DATE($C$4,{idx},1),\'Lançamentos\'!$A$5:$A$304,"<"&EDATE(DATE($C$4,{idx},1),1))')
    for c in range(2,8): pan.cell(r,c).border=Border(bottom=thin); pan.cell(r,c).font=Font(name="Arial",size=9,color=TEXT)
    for c in range(3,8): pan.cell(r,c).number_format='R$ #,##0.00;[Red]-R$ #,##0.00'
chart=BarChart(); chart.type="col"; chart.style=10; chart.title="Entradas e despesas por mês"; chart.y_axis.title="Valor (R$)"; chart.x_axis.title="Mês"; chart.add_data(Reference(pan,min_col=3,max_col=4,min_row=15,max_row=27),titles_from_data=True); chart.set_categories(Reference(pan,min_col=2,min_row=16,max_row=27)); chart.height=8; chart.width=14; pan.add_chart(chart,"I15")
pan.conditional_formatting.add("F16:F27",CellIsRule(operator="lessThan",formula=["0"],fill=PatternFill("solid",fgColor="FCE8E6"),font=Font(color="B91C1C")))
pan.freeze_panes="B15"
pan.protection.sheet=True
pan.protection.selectUnlockedCells=True

# Painel visual complementar: os gráficos são nativos e se atualizam com os lançamentos.
section(pan, 30, "Custos do mês por categoria", 2, 7)
categories=["Compra de sementes","Insumos e adubo","Irrigação e água","Energia","Transporte","Mão de obra","Alimentação animal","Manutenção","Pragas e doenças","Perda climática","Despesa familiar","Outros"]
pan["B31"]="Categoria"; pan["C31"]="Valor"
for c in (pan["B31"],pan["C31"]):
    c.fill=PatternFill("solid",fgColor=GREEN); c.font=Font(name="Arial",size=9,bold=True,color=WHITE); c.alignment=Alignment(horizontal="center")
for i,cat in enumerate(categories,32):
    pan.cell(i,2,cat)
    pan.cell(i,3,f'=SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Despesa",\'Lançamentos\'!$C$5:$C$304,B{i},\'Lançamentos\'!$A$5:$A$304,">="&DATE($C$4,$F$4,1),\'Lançamentos\'!$A$5:$A$304,"<"&EDATE(DATE($C$4,$F$4,1),1))')
    pan.cell(i,2).font=Font(name="Arial",size=9,color=TEXT); pan.cell(i,3).font=Font(name="Arial",size=9,color=TEXT); pan.cell(i,3).number_format='R$ #,##0.00;[Red]-R$ #,##0.00'; pan.cell(i,2).border=Border(bottom=thin); pan.cell(i,3).border=Border(bottom=thin)

# Reposiciona e estiliza o gráfico principal criado acima.
chart.title="Entradas e despesas por mês (R$)"
chart.legend.position="t"
chart.y_axis.majorGridlines = None
chart.series[0].graphicalProperties.solidFill=GREEN2
chart.series[1].graphicalProperties.solidFill=BLUE
chart.series[0].tx=SeriesLabel(v="Entradas")
chart.series[1].tx=SeriesLabel(v="Despesas")

trend=LineChart(); trend.title="Saldo e reservas ao longo do ano (R$)"; trend.style=13; trend.height=8; trend.width=14; trend.legend.position="t"; trend.y_axis.majorGridlines=None
trend.add_data(Reference(pan,min_col=5,max_col=6,min_row=15,max_row=27),titles_from_data=True); trend.set_categories(Reference(pan,min_col=2,min_row=16,max_row=27))
trend.series[0].graphicalProperties.line.solidFill=YELLOW; trend.series[0].graphicalProperties.line.width=25000
trend.series[1].graphicalProperties.line.solidFill=GREEN2; trend.series[1].graphicalProperties.line.width=25000
trend.series[0].tx=SeriesLabel(v="Reservas")
trend.series[1].tx=SeriesLabel(v="Saldo")
pan.add_chart(trend,"I31")

donut=DoughnutChart(); donut.title="Distribuição dos custos no mês"; donut.holeSize=55; donut.height=8; donut.width=14; donut.legend.position="r"
donut.add_data(Reference(pan,min_col=3,min_row=31,max_row=43),titles_from_data=True); donut.set_categories(Reference(pan,min_col=2,min_row=32,max_row=43)); donut.dataLabels=DataLabelList(); donut.dataLabels.showPercent=True; donut.dataLabels.showLeaderLines=True
donut.series[0].tx=SeriesLabel(v="Custos")
pan.add_chart(donut,"E31")

section(pan, 47, "Produção planejada e realizada", 2, 7)
prod=BarChart(); prod.type="bar"; prod.style=10; prod.title="Produção por cultura"; prod.height=9; prod.width=18; prod.legend.position="t"; prod.x_axis.title="Quantidade"; prod.y_axis.title="Cultura"; prod.x_axis.majorGridlines=None
prod.add_data(Reference(saf,min_col=3,max_col=4,min_row=5,max_row=13),titles_from_data=True); prod.set_categories(Reference(saf,min_col=1,min_row=6,max_row=13)); prod.series[0].graphicalProperties.solidFill=BLUE; prod.series[1].graphicalProperties.solidFill=GREEN2
prod.series[0].tx=SeriesLabel(v="Produção esperada")
prod.series[1].tx=SeriesLabel(v="Produção realizada")
pan.add_chart(prod,"B49")

pan.merge_cells("B67:L69")
pan["B67"]="Os gráficos são ligados às fórmulas da planilha: ao registrar receitas, despesas, reservas ou dados da safra, eles são atualizados automaticamente. Para analisar outro mês, altere o seletor amarelo no topo."
pan["B67"].fill=PatternFill("solid",fgColor=PALE_GREEN); pan["B67"].border=Border(left=Side(style="medium",color=GREEN)); pan["B67"].font=Font(name="Arial",size=10,color=TEXT); pan["B67"].alignment=Alignment(wrap_text=True,vertical="center")

# Metas
met=wb.create_sheet("Metas e reserva")
title(met,"Metas e reserva","Planeje uma reserva para períodos difíceis e acompanhe uma meta da família ou da produção.",8)
for col,w in {"A":3,"B":30,"C":20,"D":20,"E":20,"F":20,"G":20,"H":3}.items(): met.column_dimensions[col].width=w
section(met,4,"Reserva de emergência",2,7)
rows=[(6,"Meses desejados de proteção",3,True),(8,"Média mensal de despesas essenciais",'=SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Despesa",\'Lançamentos\'!$K$5:$K$304,"Sim")/12',False),(10,"Meta da reserva","=C8*C6",False),(12,"Valor já reservado",'=SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Reserva",\'Lançamentos\'!$C$5:$C$304,"Reserva de emergência")',False),(14,"Quanto falta","=MAX(0,C10-C12)",False)]
for r,label,val,edit in rows:
    met.cell(r,2,label).font=Font(name="Arial",size=10,bold=True,color=TEXT); met.cell(r,3,val); met.merge_cells(start_row=r,start_column=3,end_row=r,end_column=5); met.cell(r,3).fill=PatternFill("solid",fgColor=INPUT if edit else PALE_BLUE); met.cell(r,3).font=Font(name="Arial",size=11,bold=True,color=BLUE); met.cell(r,3).alignment=Alignment(horizontal="center"); met.cell(r,3).number_format='R$ #,##0.00;[Red]-R$ #,##0.00' if r!=6 else '0'
section(met,17,"Meta da família ou da produção",2,7)
rows=[(19,"Nome da meta","",True),(21,"Valor necessário","",True),(23,"Valor já guardado",'=SUMIFS(\'Lançamentos\'!$I$5:$I$304,\'Lançamentos\'!$B$5:$B$304,"Reserva",\'Lançamentos\'!$C$5:$C$304,"Meta")',False),(25,"Quanto falta","=MAX(0,C21-C23)",False),(27,"Percentual alcançado",'=IF(C21=0,0,C23/C21)',False)]
for r,label,val,edit in rows:
    met.cell(r,2,label).font=Font(name="Arial",size=10,bold=True,color=TEXT); met.cell(r,3,val); met.merge_cells(start_row=r,start_column=3,end_row=r,end_column=5); met.cell(r,3).fill=PatternFill("solid",fgColor=INPUT if edit else PALE_BLUE); met.cell(r,3).font=Font(name="Arial",size=11,bold=True,color=BLUE); met.cell(r,3).alignment=Alignment(horizontal="center"); met.cell(r,3).number_format='0.0%' if r==27 else ('R$ #,##0.00;[Red]-R$ #,##0.00' if r in (21,23,25) else '@')
met.merge_cells("B30:G33"); met["B30"]="Sugestões de metas: sementes para a próxima safra, manutenção da bomba de irrigação, compra de ferramentas, alimentação animal ou reserva para estiagem."; met["B30"].fill=PatternFill("solid",fgColor=PALE_GREEN); met["B30"].font=Font(name="Arial",size=10,color=TEXT); met["B30"].alignment=Alignment(wrap_text=True,vertical="center")
for coord in ("C6", "C19", "C21"):
    met[coord].protection=Protection(locked=False)
met.protection.sheet=True
met.protection.selectUnlockedCells=True

# Proveniência e compatibilidade
src=wb.create_sheet("Sobre o projeto")
title(src,"Sobre o projeto","Origem, finalidade e limites de uso da ferramenta.",8)
for col,w in {"A":3,"B":25,"C":24,"D":24,"E":24,"F":24,"G":24,"H":3}.items(): src.column_dimensions[col].width=w
section(src,4,"Finalidade",2,7)
src.merge_cells("B6:G10"); src["B6"]="A planilha apoia a educação matemática e financeira ligada à agricultura familiar. Ela permite registrar receitas, custos reais, resultados da safra, perdas associadas ao clima, reserva de emergência e metas. Os valores devem ser preenchidos pelo próprio usuário; os dados da pesquisa aparecem apenas como contexto e não como orçamento de uma família específica."; src["B6"].alignment=Alignment(wrap_text=True,vertical="top"); src["B6"].font=Font(name="Arial",size=10,color=TEXT)
section(src,12,"Dados de contexto utilizados",2,7)
context=[("Famílias pesquisadas","15"),("Sem orçamento familiar formal","13 de 15"),("Renda associada à agricultura","50%"),("Cultivos citados","Milho, feijão, mandioca, hortaliças, coco, caju, jerimum e galinhas caipiras"),("Período informado na reportagem","Abril a outubro de 2025")]
for r,(k,v) in enumerate(context,14): src.cell(r,2,k); src.merge_cells(start_row=r,start_column=3,end_row=r,end_column=7); src.cell(r,3,v)
style_table(src,14,18,2,7)
section(src,21,"Fontes do projeto",2,7)
sources=["Portal Campo Digital - Produção Agrícola","Portal Campo Digital - Mudanças Climáticas no Campo","TCC Portal Digital da Comunidade CC2026"]
for r,t in enumerate(sources,23): src.merge_cells(start_row=r,start_column=2,end_row=r,end_column=7); src.cell(r,2,t); src.cell(r,2).font=Font(name="Arial",size=10,color=TEXT)
section(src,28,"Compatibilidade",2,7)
src.merge_cells("B30:G34"); src["B30"]="Criada em formato .xlsx com fórmulas comuns (SUMIFS, IF, MAX, DATE e EDATE), validações e gráficos compatíveis com Microsoft Excel e importáveis pelo Google Planilhas. Ao importar, confira as permissões de edição e o formato de moeda. Não publique uma cópia preenchida com dados pessoais."; src["B30"].alignment=Alignment(wrap_text=True,vertical="top"); src["B30"].font=Font(name="Arial",size=10,color=TEXT)

for wsx in wb.worksheets:
    wsx.sheet_properties.pageSetUpPr.fitToPage=True
    wsx.page_setup.fitToWidth=1; wsx.page_setup.fitToHeight=0
    wsx.sheet_properties.tabColor = GREEN if wsx.title in ("Comece aqui","Painel") else BLUE

# O painel é a primeira tela, como na referência visual enviada.
wb.move_sheet(pan, offset=-1)
wb.active = 0

wb.calculation.fullCalcOnLoad = True
wb.calculation.forceFullCalc = True
wb.calculation.calcMode = "auto"
wb.save(XLSX)

# Reopen verification
check=load_workbook(XLSX,data_only=False)
assert check.sheetnames == ["Painel","Comece aqui","Lançamentos","Safra e clima","Metas e reserva","Sobre o projeto"]
assert check["Lançamentos"]["I5"].value.startswith("=IF")
assert check["Safra e clima"]["G6"].value.startswith("=IF")

# PDF manual
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle",parent=styles["Title"],fontName="Helvetica-Bold",fontSize=25,leading=30,textColor=colors.HexColor("#0B4D2A"),alignment=TA_LEFT,spaceAfter=14))
styles.add(ParagraphStyle(name="CoverSub",parent=styles["BodyText"],fontName="Helvetica",fontSize=12,leading=18,textColor=colors.HexColor("#355B49"),spaceAfter=16))
styles.add(ParagraphStyle(name="H1x",parent=styles["Heading1"],fontName="Helvetica-Bold",fontSize=18,leading=22,textColor=colors.black,spaceBefore=6,spaceAfter=10))
styles.add(ParagraphStyle(name="H2x",parent=styles["Heading2"],fontName="Helvetica-Bold",fontSize=13,leading=16,textColor=colors.black,spaceBefore=10,spaceAfter=6))
styles.add(ParagraphStyle(name="Bodyx",parent=styles["BodyText"],fontName="Helvetica",fontSize=10.5,leading=16,textColor=colors.HexColor("#17352A"),spaceAfter=8))
styles.add(ParagraphStyle(name="Smallx",parent=styles["BodyText"],fontName="Helvetica",fontSize=8.5,leading=12,textColor=colors.HexColor("#5C6F66"),spaceAfter=6))
styles.add(ParagraphStyle(name="StepNum",parent=styles["BodyText"],fontName="Helvetica-Bold",fontSize=12,textColor=colors.white,alignment=TA_CENTER))

def header_footer(canvas, doc):
    canvas.saveState(); canvas.setStrokeColor(colors.HexColor("#D7E5DB")); canvas.line(1.8*cm,1.45*cm,A4[0]-1.8*cm,1.45*cm); canvas.setFont("Helvetica",8); canvas.setFillColor(colors.HexColor("#5C6F66")); canvas.drawString(1.8*cm,1.05*cm,"Campo Digital | Organização Financeira Rural"); canvas.drawRightString(A4[0]-1.8*cm,1.05*cm,f"Página {doc.page}"); canvas.restoreState()

def step_table(n, heading, body):
    t=Table([[Paragraph(str(n),styles["StepNum"]),Paragraph(f"<b>{heading}</b><br/>{body}",styles["Bodyx"])]],colWidths=[1.05*cm,14.7*cm])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(0,0),colors.HexColor("#0B5B89")),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("BOX",(0,0),(-1,-1),0.5,colors.HexColor("#D7E5DB")),("INNERGRID",(0,0),(-1,-1),0.5,colors.HexColor("#D7E5DB")),("LEFTPADDING",(1,0),(1,0),10),("RIGHTPADDING",(1,0),(1,0),10),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)])); return t

story=[]
story += [Spacer(1,2.0*cm),Paragraph("Manual da Planilha de Organização Financeira Rural",styles["CoverTitle"]),Paragraph("Guia passo a passo para baixar, preencher e acompanhar receitas, despesas, produção, impactos climáticos, reservas e metas.",styles["CoverSub"]),Spacer(1,0.7*cm)]
cover=Table([["CAMPO DIGITAL"],["Laboratório de Tecnologia, Memória e Território"],["EEMPC Francisco Araújo Barros | 2026"]],colWidths=[16*cm])
cover.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#0B4D2A")),("TEXTCOLOR",(0,0),(-1,0),colors.white),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,0),16),("BACKGROUND",(0,1),(-1,-1),colors.HexColor("#E7F3EA")),("TEXTCOLOR",(0,1),(-1,-1),colors.HexColor("#17352A")),("FONTNAME",(0,1),(-1,-1),"Helvetica"),("FONTSIZE",(0,1),(-1,-1),10),("ALIGN",(0,0),(-1,-1),"LEFT"),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),12),("BOTTOMPADDING",(0,0),(-1,-1),12)])); story.append(cover)
story += [Spacer(1,0.8*cm),Paragraph("Finalidade",styles["H2x"]),Paragraph("Esta ferramenta foi criada para apoiar famílias, estudantes e produtores na organização do dinheiro ligado à produção rural. Ela é educativa e não substitui orientação contábil ou técnica.",styles["Bodyx"]),Paragraph("Privacidade: não registre CPF, senha, número de conta ou dados bancários. Não publique uma planilha já preenchida com informações particulares.",styles["Smallx"]),PageBreak()]

story += [Paragraph("1  Como baixar e guardar",styles["H1x"]),step_table(1,"Baixe pelo portal","Clique em Baixar planilha e aguarde o arquivo .xlsx terminar de baixar."),Spacer(1,0.3*cm),step_table(2,"Guarde uma cópia original","Mantenha uma cópia vazia. Faça outra cópia para cada família, grupo, turma ou ano."),Spacer(1,0.3*cm),step_table(3,"Renomeie o arquivo","Use um nome simples, como Organizacao Financeira Grupo 2026. Evite colocar CPF ou dados bancários no nome."),Spacer(1,0.5*cm),Paragraph("No Microsoft Excel",styles["H2x"]),Paragraph("Abra o arquivo baixado. Se aparecer o aviso de modo protegido, confirme a edição somente se o arquivo tiver sido baixado do portal oficial fabcampo.com.br.",styles["Bodyx"]),Paragraph("As células amarelas podem ser preenchidas. As células azuis contêm cálculos e devem permanecer intactas.",styles["Bodyx"]),PageBreak()]

story += [Paragraph("2  Como usar no Google Planilhas",styles["H1x"]),step_table(1,"Abra o Google Drive","Entre em drive.google.com com sua conta."),Spacer(1,0.25*cm),step_table(2,"Envie o arquivo","Clique em Novo, depois Upload de arquivo, e selecione a planilha .xlsx."),Spacer(1,0.25*cm),step_table(3,"Abra com Google Planilhas","Depois do envio, clique com o botão direito no arquivo e escolha Abrir com Google Planilhas."),Spacer(1,0.25*cm),step_table(4,"Crie uma cópia nativa","No menu Arquivo, escolha Salvar como Google Planilhas. Preserve também o arquivo .xlsx original."),Spacer(1,0.5*cm),Paragraph("Após a conversão",styles["H2x"]),Paragraph("Confira se os menus de seleção, os valores em reais e o gráfico do Painel aparecem corretamente. As fórmulas utilizadas foram escolhidas para funcionar tanto no Excel quanto no Google Planilhas.",styles["Bodyx"]),PageBreak()]

story += [Paragraph("3  Primeiros passos",styles["H1x"]),Paragraph("Comece na aba Comece aqui.",styles["Bodyx"]),step_table(1,"Identificação","Informe o nome da família, grupo ou propriedade, a comunidade e o ano de referência."),Spacer(1,0.25*cm),step_table(2,"Defina o período","Na aba Painel, escolha o ano e o número do mês. Janeiro é 1 e dezembro é 12."),Spacer(1,0.25*cm),step_table(3,"Planeje uma reserva","Na aba Metas e reserva, informe por quantos meses deseja formar proteção financeira."),Spacer(1,0.25*cm),step_table(4,"Defina uma meta","Escolha uma meta concreta, como sementes, bomba de irrigação, ferramentas ou alimentação animal."),Spacer(1,0.5*cm),Paragraph("O que não preencher",styles["H2x"]),Paragraph("Não altere células azuis, títulos ou fórmulas. Caso uma fórmula seja apagada, volte à cópia original e copie novamente o arquivo.",styles["Bodyx"]),PageBreak()]

story += [Paragraph("4  Como registrar receitas e despesas",styles["H1x"]),Paragraph("Use a aba Lançamentos para registrar cada entrada ou saída de dinheiro. Faça um lançamento por linha.",styles["Bodyx"])]
data=[["Campo","Como preencher"],["Data","Dia em que o dinheiro entrou, saiu ou foi reservado."],["Movimento","Receita, Despesa ou Reserva."],["Categoria","Escolha venda, sementes, irrigação, transporte, mão de obra, reserva, meta ou outra opção."],["Cultura ou atividade","Informe milho, feijão, mandioca, criação de animais ou outra atividade."],["Quantidade","Informe a quantidade. Para um valor único, use 1."],["Valor unitário","Informe o valor de uma unidade. O total será calculado."],["Essencial?","Marque Sim quando o gasto não puder ser adiado."],["Relacionado ao clima?","Marque Sim para custos ou perdas ligados a seca, calor, chuva irregular, pragas ou queimadas."]]
t=Table([[Paragraph(f"<b>{c}</b>" if r==0 else c,styles["Smallx"]) for c in row] for r,row in enumerate(data)],colWidths=[4.3*cm,11.5*cm],repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#0B4D2A")),("TEXTCOLOR",(0,0),(-1,0),colors.white),("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#D9D9D9")),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("BACKGROUND",(0,1),(-1,-1),colors.white),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor("#F3F7F4")]),("LEFTPADDING",(0,0),(-1,-1),7),("RIGHTPADDING",(0,0),(-1,-1),7),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)])); story += [t,Spacer(1,0.4*cm),Paragraph("Exemplo: venda de 10 sacas de milho a R$ 90 cada. Movimento Receita, categoria Venda da produção, quantidade 10, unidade saca e valor unitário R$ 90.",styles["Bodyx"]),PageBreak()]

story += [Paragraph("5  Como acompanhar a safra e o clima",styles["H1x"]),Paragraph("A aba Safra e clima ajuda a comparar o que se esperava produzir com o que foi realmente obtido.",styles["Bodyx"]),step_table(1,"Escolha a cultura","As oito atividades citadas na pesquisa já aparecem como referência. Você pode substituir ou acrescentar outras."),Spacer(1,0.25*cm),step_table(2,"Informe o planejamento","Preencha área planejada e produção esperada."),Spacer(1,0.25*cm),step_table(3,"Registre o resultado","Informe produção realizada e perda climática."),Spacer(1,0.25*cm),step_table(4,"Explique o impacto","Selecione seca, chuva irregular, calor, pragas, queimadas ou outro impacto."),Spacer(1,0.25*cm),step_table(5,"Leia o resultado","Receita e custo são somados a partir dos lançamentos que usam exatamente o mesmo nome da cultura."),Spacer(1,0.5*cm),Paragraph("Importante",styles["H2x"]),Paragraph("Para que os valores sejam somados corretamente, escreva o nome da cultura da mesma forma nas abas Lançamentos e Safra e clima.",styles["Bodyx"]),PageBreak()]

story += [Paragraph("6  Como usar o painel e os gráficos",styles["H1x"]),Paragraph("O Painel é a primeira aba da planilha. Ele reúne os resultados principais e quatro gráficos que se atualizam quando os lançamentos e os dados da safra são preenchidos.",styles["Bodyx"]),Paragraph("Se os gráficos aparecerem vazios no primeiro acesso, isso está correto: a planilha oficial não contém valores inventados. Eles serão formados com os dados registrados pelo usuário.",styles["Bodyx"]),Paragraph("Seleção do período",styles["H2x"]),Paragraph("O ano vem da aba Comece aqui. No campo amarelo Mês (1 a 12), escolha o número do mês que deseja analisar. Janeiro é 1, fevereiro é 2 e dezembro é 12. Ao mudar esse número, os cartões e a distribuição dos custos são atualizados.",styles["Bodyx"])]
charts_help=[["Elemento","Como interpretar"],["Cartões superiores","Mostram entradas, despesas, saldo e valor reservado no mês selecionado."],["Entradas e despesas por mês","Compara quanto entrou e quanto foi gasto em cada mês do ano."],["Distribuição dos custos","Mostra em quais categorias o dinheiro foi gasto no mês selecionado, como sementes, água, energia, transporte e mão de obra."],["Saldo e reservas","Apresenta a evolução do saldo financeiro e dos valores guardados durante o ano."],["Produção por cultura","Compara a produção esperada com a realizada para milho, feijão, mandioca e demais atividades registradas."],["Resumo anual","Exibe os valores mensais e separa despesas identificadas como relacionadas ao clima."]]
t=Table([[Paragraph(f"<b>{c}</b>" if r==0 else c,styles["Smallx"]) for c in row] for r,row in enumerate(charts_help)],colWidths=[4.5*cm,11.3*cm],repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#0B5B89")),("TEXTCOLOR",(0,0),(-1,0),colors.white),("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#D9D9D9")),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor("#E8F2F8")]),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),7),("RIGHTPADDING",(0,0),(-1,-1),7),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)])); story += [t,Spacer(1,0.35*cm),Paragraph("Para atualizar os gráficos no Excel, salve o arquivo após preencher os dados. No Google Planilhas, a atualização acontece automaticamente após a importação e o recálculo das fórmulas.",styles["Bodyx"]),PageBreak()]

story += [Paragraph("7  Reserva, metas e revisão mensal",styles["H1x"]),Paragraph("Na aba Metas e reserva, a meta da reserva é calculada com base na média mensal de despesas essenciais registrada durante o ano. O valor guardado é somado a partir dos lançamentos classificados como Reserva de emergência.",styles["Bodyx"]),Paragraph("Para uma meta específica, registre os valores guardados como movimento Reserva e categoria Meta. A planilha calcula quanto falta e o percentual alcançado.",styles["Bodyx"]),Paragraph("Revisão mensal sugerida",styles["H2x"])]
checks=[["Verificação","Pergunta"],["Receitas","Todas as vendas e outras entradas foram registradas?"],["Custos","Sementes, insumos, água, energia, transporte e mão de obra estão completos?"],["Clima","Os gastos e perdas ligados ao clima foram identificados?"],["Saldo","O saldo do mês ficou positivo ou negativo?"],["Reserva","Foi possível guardar algum valor?"],["Safra","A produção realizada ficou próxima da esperada?"]]
t=Table([[Paragraph(f"<b>{c}</b>" if r==0 else c,styles["Smallx"]) for c in row] for r,row in enumerate(checks)],colWidths=[4*cm,11.8*cm],repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#0B5B89")),("TEXTCOLOR",(0,0),(-1,0),colors.white),("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#D9D9D9")),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor("#E8F2F8")]),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),7),("RIGHTPADDING",(0,0),(-1,-1),7),("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7)])); story += [t,PageBreak()]

story += [Paragraph("8  Cuidados e solução de problemas",styles["H1x"]),Paragraph("Faça uma cópia de segurança ao final de cada mês. No Google Drive, o histórico de versões também ajuda a recuperar alterações.",styles["Bodyx"]),Paragraph("Se um total ficar vazio, confira se data, movimento, quantidade e valor unitário foram preenchidos. Para uma despesa única, use quantidade 1.",styles["Bodyx"]),Paragraph("Se receita ou custo não aparecer na aba Safra e clima, confira se o nome da cultura é idêntico nas duas abas.",styles["Bodyx"]),Paragraph("Se um gráfico não mudar após o preenchimento, confirme se as datas pertencem ao ano selecionado, se o mês está correto e se as categorias foram escolhidas nos menus da planilha.",styles["Bodyx"]),Paragraph("Se o arquivo abrir sem fórmulas no celular, use o aplicativo oficial Microsoft Excel ou Google Planilhas. Evite aplicativos desconhecidos que possam alterar o arquivo.",styles["Bodyx"]),Paragraph("Não compartilhe publicamente uma planilha preenchida. Se os dados forem usados em atividade escolar ou pesquisa, retire nomes e qualquer informação capaz de identificar as famílias.",styles["Bodyx"]),Spacer(1,0.6*cm),Paragraph("Base do material",styles["H2x"]),Paragraph("O modelo foi elaborado a partir do conteúdo do Portal Campo Digital, especialmente das páginas Produção Agrícola e Mudanças Climáticas no Campo, e do TCC Portal Digital da Comunidade CC2026.",styles["Bodyx"]),Paragraph("Versão 1.1 | 2026",styles["Smallx"])]

doc=SimpleDocTemplate(str(PDF),pagesize=A4,rightMargin=1.8*cm,leftMargin=1.8*cm,topMargin=1.7*cm,bottomMargin=1.8*cm,title="Manual da Planilha de Organização Financeira Rural",author="Campo Digital")
doc.build(story,onFirstPage=header_footer,onLaterPages=header_footer)

from pypdf import PdfReader
reader=PdfReader(str(PDF))
assert len(reader.pages) >= 7
assert "Organização Financeira Rural" in "".join((p.extract_text() or "") for p in reader.pages)

print(XLSX)
print(PDF)
