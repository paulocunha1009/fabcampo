/* Auditoria de cores calculadas no DOM inteiro; imagens e gradientes exigem revisão visual. */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const args=process.argv.slice(2),get=(key,fallback)=>{const at=args.indexOf(key);return at<0?fallback:args[at+1]};
const root=path.resolve(get('--root','.')),output=path.resolve(get('--output','tmp/auditoria-20261116'));
const live=args.includes('--publicado'),base=live?'https://fabcampo.com.br':'https://portal.test';
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const pages=[...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decodeURIComponent(new URL(m[1]).pathname)).concat(['/pages/caravana-afro.html','/pages/caravana-afro-mural.html','/painel/index.html']))];
function inspectContrast(){
 const color=s=>{const m=s.match(/^rgba?\(([^)]+)\)/);if(!m)return null;const a=m[1].split(/[,\s/]+/).filter(Boolean).map(Number);return [a[0],a[1],a[2],a[3]??1]};
 const over=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3])).concat(1);
 const luminance=c=>c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 const key=el=>el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+[...el.classList].slice(0,3).map(c=>'.'+c).join('');
 const issues=[],review=[],seen=new Set();let checked=0;
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode,text=node.textContent.replace(/\s+/g,' ').trim(),el=node.parentElement;
  if(!text||!/[\p{L}\p{N}]/u.test(text)||!el||el.closest('script,style,noscript,[aria-hidden=true],.sr-only,.tema-sr,button:disabled,[hidden]'))continue;
  const range=document.createRange();range.selectNode(node);const rects=[...range.getClientRects()];if(!rects.some(r=>r.width>1&&r.height>1))continue;
  const cs=getComputedStyle(el);if(cs.visibility!=='visible'||cs.display==='none')continue;
  let fg=color(cs.color);if(!fg)continue;
  // O título do mural é pintado sobre uma faixa em ::before recortada; requer captura visual.
  const chain=[];let current=el,uncertain=Boolean(el.closest('.mural-titulo h1')),opacity=1;
  while(current){const st=getComputedStyle(current);opacity*=Number(st.opacity);const bg=color(st.backgroundColor);const image=st.backgroundImage;if(image.includes('url('))uncertain=true;const stops=image==='none'?[]:[...image.matchAll(/rgba?\([^)]+\)/g)].map(m=>color(m[0])).filter(Boolean);chain.push({bg,stops});if(bg&&bg[3]===1)break;current=current.parentElement;}
  if(opacity<.05)continue;
  let candidates=[[255,255,255,1]];for(const layer of chain.reverse()){if(layer.bg)candidates=candidates.map(bg=>over(layer.bg,bg));if(layer.stops.length)candidates=candidates.flatMap(bg=>layer.stops.map(stop=>over(stop,bg))).slice(0,16);}
  const samples=candidates.map(bg=>({bg,ratio:ratio(over([fg[0],fg[1],fg[2],fg[3]*opacity],bg),bg)})).sort((a,b)=>a.ratio-b.ratio);const bg=samples[0].bg,r=samples[0].ratio,threshold=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.666&&Number(cs.fontWeight)>=700)?3:4.5;
  checked++;
  if(r+0.001>=threshold)continue;
  const signature=key(el)+'|'+cs.color+'|'+bg.join(',');if(seen.has(signature))continue;seen.add(signature);
  const item={element:key(el),parent:key(el.parentElement),text:text.slice(0,95),ratio:+r.toFixed(3),minimum:threshold,color:cs.color,background:bg.slice(0,3),y:Math.round(rects[0].top+scrollY)};
  if(uncertain)review.push(item);else issues.push(item);
 }
 return {checked,issues,review};
}
(async()=>{
 fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 if(!live)await page.route('**/*',async route=>{
  const url=new URL(route.request().url());if(!['portal.test','fabcampo.com.br','www.fabcampo.com.br'].includes(url.hostname))return route.abort();
  const relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);const file=path.resolve(root,'.'+relative);
  if(!file.startsWith(root+path.sep)||!/\.(html|js|mjs|css|json|jpg|jpeg|png|webp|svg|woff2?|mp4|pdf)$/i.test(file))return route.abort();
  try{await route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'})}catch{await route.fulfill({status:404,body:''})}
 });
 const results=[];
 for(const target of pages){
  await page.setViewportSize({width:1440,height:1000});const response=await page.goto(base+target,{waitUntil:'domcontentloaded',timeout:30000});
  for(const theme of ['claro','escuro']){
   if(await page.locator('.tema-ajustes').count()){await page.locator('.tema-ajustes').click();await page.locator(`[data-tema-opcao=${theme}]`).click()}
   await page.waitForTimeout(120);
   // Abre somente blocos informativos, sem acionar envios, câmera ou ações privadas.
   await page.locator('main article details,main .artigo-corpo details').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
   for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});const dimensions=await page.evaluate(()=>{
      const items=[...document.querySelectorAll('.cabecalho .logo,.controle-tema,.busca-global__abrir,.botao-menu,#menu-principal>ul>li>a,#menu-principal>ul>li>button')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(el).visibility==='visible'}).map(el=>({label:el.getAttribute('aria-label')||el.textContent.trim().slice(0,40),rect:el.getBoundingClientRect()}));
      const overlaps=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i].rect,b=items[j].rect;if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)overlaps.push([items[i].label,items[j].label]);}
      return {viewport:innerWidth,content:document.documentElement.scrollWidth,headerOverlaps:overlaps};
    });
    const contrast=await page.evaluate(inspectContrast);
    const effectiveTheme=await page.locator('html').getAttribute('data-tema')||'identidade própria';
    results.push({page:target,theme,effectiveTheme,width,status:response.status(),...dimensions,...contrast});
   }
   await page.setViewportSize({width:1440,height:1000});
  }
  console.log(target+' auditado');fs.writeFileSync(path.join(output,'contraste.json'),JSON.stringify(results,null,2));
 }
 await browser.close();console.log(JSON.stringify({pages:pages.length,views:results.length,solidIssues:results.reduce((n,r)=>n+(r.issues?.length||0),0),visualReview:results.reduce((n,r)=>n+(r.review?.length||0),0),overflow:results.filter(r=>r.content>r.viewport+1).length,headerOverlaps:results.filter(r=>r.headerOverlaps.length).length}));
})().catch(error=>{console.error(error);process.exit(1)});
