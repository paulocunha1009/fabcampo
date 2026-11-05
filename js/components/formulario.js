const mensagens = {
  nome: 'Informe seu nome.',
  email: 'Informe um e-mail ou telefone válido.',
  assunto: 'Escolha um assunto.',
  mensagem: 'Escreva uma mensagem.',
  'link-arquivos': 'Informe um link válido ou deixe este campo em branco.',
  autorizacao: 'Confirme a autorização para enviar sua contribuição.'
};

export function iniciarFormularioContato() {
  const formulario = document.querySelector('#formContato');
  if (!formulario) return;
  const status = document.querySelector('#estado-envio');
  let enviando = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if(enviando) return;

    const campos = ['nome', 'email', 'assunto', 'mensagem', 'link-arquivos', 'autorizacao'];
    const resultados = campos.map((campo) => validarCampo(formulario, campo));
    const valido = resultados.every(Boolean);

    if (!valido) {
      if(status) status.textContent = 'Revise os campos indicados antes de enviar.';
      const primeiroInvalido = formulario.querySelector('[aria-invalid="true"]');
      primeiroInvalido?.focus();
      return;
    }

    const botao = formulario.querySelector('[type="submit"]');
    const textoOriginal = botao?.textContent;
    enviando = true;
    formulario.setAttribute('aria-busy', 'true');
    if(status) status.textContent = 'Enviando sua contribuição. Aguarde.';

    if (botao) {
      botao.disabled = true;
      botao.textContent = 'Enviando...';
    }

    try {
      await enviarParaGoogleForms(formulario);
      if(status) status.textContent = 'Tentativa de envio realizada. O portal não consegue confirmar o recebimento pelo Google Forms. Seus campos foram mantidos; você pode usar o formulário oficial abaixo para enviar diretamente.';
    } catch {
      if(status) status.textContent = 'Não foi possível confirmar o envio. Seus campos foram mantidos. Confira a conexão ou use o formulário oficial abaixo para enviar diretamente.';
    } finally {
      enviando = false;
      formulario.setAttribute('aria-busy', 'false');
      if (botao) {
        botao.disabled = false;
        botao.textContent = textoOriginal;
      }
    }
  });

  formulario.querySelectorAll('input, select, textarea').forEach((campo) => {
    campo.addEventListener('blur', () => validarCampo(formulario, campo.id));
    campo.addEventListener('input', () => limparErro(campo));
  });
}

function validarCampo(formulario, id) {
  const campo = formulario.querySelector(`#${id}`);
  if (!campo) return true;

  const valor = campo.type === 'checkbox' ? campo.checked : campo.value.trim();
  const obrigatorio = campo.required;
  const preenchido = campo.type === 'checkbox' ? campo.checked : Boolean(valor);
  const emailOuTelefoneValido = id !== 'email' || validarEmailOuTelefone(String(valor));
  const linkValido = id !== 'link-arquivos' || !valor || validarLink(String(valor));
  const valido = (!obrigatorio || preenchido) && emailOuTelefoneValido && linkValido;

  campo.setAttribute('aria-invalid', String(!valido));
  campo.setAttribute('aria-describedby', `erro-${id}`);

  const erro = formulario.querySelector(`#erro-${id}`);
  if (erro) erro.textContent = valido ? '' : mensagens[id];

  return valido;
}

function validarEmailOuTelefone(valor) {
  const texto = valor.trim();
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
  const digitos = texto.replace(/\D/g, '');
  const telefoneValido = /^\+?[\d\s().-]+$/.test(texto) && digitos.length >= 10 && digitos.length <= 13;
  return emailValido || telefoneValido;
}

function validarLink(valor){
  try {
    const url = new URL(valor);
    const partes = url.hostname.split('.');
    const dominioValido = partes.length > 1 && partes.every(parte => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(parte));
    return ['http:', 'https:'].includes(url.protocol) && dominioValido && !url.username && !url.password;
  } catch { return false; }
}

function limparErro(campo) {
  campo.removeAttribute('aria-invalid');
  const erro = document.querySelector(`#erro-${campo.id}`);
  if (erro) erro.textContent = '';
}

function enviarParaGoogleForms(formulario) {
  const endpoint = formulario.dataset.googleFormEndpoint;
  if (!endpoint) return Promise.reject(new Error('Endpoint do Google Forms não configurado.'));

  const dados = new FormData(formulario);
  return fetch(endpoint, {
    method: 'POST',
    mode: 'no-cors',
    body: dados,
    signal: AbortSignal.timeout(15000)
  });
}
