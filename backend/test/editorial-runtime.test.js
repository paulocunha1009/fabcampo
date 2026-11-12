import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,mkdir,copyFile,writeFile,rm} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

test('módulos de pesquisa iniciam com somente os arquivos da raiz do backend',async()=>{
  const base=resolve(fileURLToPath(new URL('../tmp/',import.meta.url)));await mkdir(base,{recursive:true});
  const directory=await mkdtemp(join(base,'editorial-runtime-'));
  assert.ok(directory.startsWith(base+sep));
  try{
    await mkdir(join(directory,'lib'));
    await writeFile(join(directory,'package.json'),'{"type":"module"}');
    for(const name of ['editorial-report.js','editorial-drafts.js','editorial-research-file.js','editorial-publication.js','editorial-events.js','editorial-page.mjs','editorial-photo-layout.mjs','editorial-chrome.mjs','editorial-acervo.js','editorial-acervo-opcoes.mjs','editorial-blocks.mjs'])
      await copyFile(new URL('../lib/'+name,import.meta.url),join(directory,'lib',name));
    const report=await import(pathToFileURL(join(directory,'lib','editorial-report.js')).href);
    const drafts=await import(pathToFileURL(join(directory,'lib','editorial-drafts.js')).href);
    const publication=await import(pathToFileURL(join(directory,'lib','editorial-publication.js')).href);
    assert.equal(typeof report.createReportRouter,'function');
    assert.equal(typeof drafts.createDraftRouter,'function');
    assert.equal(typeof publication.createPublicationRouter,'function');
  }finally{if(directory.startsWith(base+sep))await rm(directory,{recursive:true,force:true});}
});
