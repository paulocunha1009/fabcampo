import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createEditorSession} from '../../painel/editor-session.js';
test('acesso editorial em memória expira antes do token Google e respeita dez minutos',()=>{
  let now=1000000;
  const session=createEditorSession({clock:()=>now});
  session.remember('test-only',now+3600000);assert.equal(session.get(),'test-only');
  now+=600000;assert.equal(session.get(),undefined);
  session.remember('test-only',now+30000);now+=20000;assert.equal(session.get(),undefined);
  session.clear();
});
test('sair remove a credencial e uma validade ausente nunca cria sessão',()=>{
  const session=createEditorSession();
  session.remember('test-only',Date.now()+60000);session.clear();assert.equal(session.get(),undefined);
  session.remember('test-only',undefined);assert.equal(session.get(),undefined);
});
