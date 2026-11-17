// Conferência somente de leitura/interações locais na versão pública; não opera contas nem câmera.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{fs.mkdirSync('tmp/auditoria-responsividade',{recursive:true});const b=await chromium.launch({headless:true,channel:'chrome'});const p=await b.newPage();
const pages=['index.html','pages/historia.html','pages/memoria.html','pages/reportagem-educacao.html','pages/reportagem-clima.html','pages/materia_ia_educacao_v2.html','pages/catalogo.html','pages/agricola.html','pages/mudas.html','pages/Plantas-Medicinaisv2.html','pages/Plantação-Nativa.html','pages/expedicao.html','pages/caravana-afro.html','contato.html','privacidade.html'];const results=[];
for(const file of pages){
 await p.setViewportSize({width:1440,height:950});await p.goto('https://fabcampo.com.br/'+file);await p.locator('.controle-tema').waitFor();
 await p.locator('.tema-ajustes').click();await p.locator('[data-tema-opcao=escuro]').click();
 for(const width of file==='index.html'?[1920,1440,1280,1180,1024,768,390,360,320]:[1440,390,320]){
  await p.setViewportSize({width,height:950});await p.waitForTimeout(40);const result=await p.evaluate(()=>({width:innerWidth,content:document.documentElement.scrollWidth}));if(result.content>result.width+1)throw Error('Overflow '+file+' '+width);results.push({file,...result});if(file==='index.html'){await p.locator('.tema-ajustes').click();const r=await p.locator('.tema-opcoes').boundingBox();if(r.x<0||r.x+r.width>width+1)throw Error('Menu de temas fora da tela '+width);await p.keyboard.press('Escape')}
 }
 if(['index.html','pages/reportagem-educacao.html','pages/catalogo.html','pages/caravana-afro.html'].includes(file)){
  await p.setViewportSize({width:1440,height:1000});if(file!=='index.html')await p.evaluate(()=>scrollTo({top:500,behavior:'instant'}));await p.screenshot({path:'tmp/auditoria-responsividade/'+path.basename(file)+'.png'});
 }
 console.log('OK '+file);
}
await p.goto('https://fabcampo.com.br/index.html');await p.locator('.controle-tema').waitFor();if(await p.locator('html').getAttribute('data-tema')!=='escuro')throw Error('Persistência entre páginas falhou');
await p.locator('.tema-alternar').click();await p.reload();if(await p.locator('html').getAttribute('data-tema')!=='claro')throw Error('Persistência claro falhou');await p.locator('.tema-alternar').click();
await p.locator('.busca-global__abrir').click();await p.locator('#busca-portal').fill('Guajiru');await p.locator('.busca-global__resultado').filter({hasText:'Guajiru'}).first().waitFor();await p.locator('.busca-global__fechar').click();
await p.locator('#alternar-contraste').click();if(await p.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor)!=='rgb(0, 0, 0)')throw Error('Prioridade alto contraste falhou');await p.locator('#alternar-contraste').click();
await p.setViewportSize({width:390,height:950});await p.locator('.botao-menu').click();if(await p.locator('.botao-menu').getAttribute('aria-expanded')!=='true')throw Error('Menu falhou');await p.locator('.botao-menu').click();await p.locator('.tema-ajustes').click();await p.keyboard.press('Escape');if(!await p.locator('.tema-opcoes').evaluate(e=>e.hidden))throw Error('Escape falhou');
await p.emulateMedia({colorScheme:'dark'});await p.locator('.tema-ajustes').click();await p.locator('[data-tema-opcao=sistema]').click();await p.waitForFunction(()=>document.documentElement.dataset.tema==='escuro');await p.emulateMedia({colorScheme:'light'});await p.waitForFunction(()=>document.documentElement.dataset.tema==='claro');
fs.writeFileSync('tmp/auditoria-responsividade/resultados.json',JSON.stringify(results,null,2));await b.close();console.log('OK total '+results.length+' visualizações; preferências, busca, menu, acessibilidade, Escape e Sistema.');})().catch(e=>{console.error(e);process.exit(1)});


