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

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const campos = ['nome', 'email', 'assunto', 'mensagem', 'link-arquivos', 'autorizacao'];
    const resultados = campos.map((campo) => validarCampo(formulario, campo));
    const valido = resultados.every(Boolean);

    if (!valido) {
      const primeiroInvalido = formulario.querySelector('[aria-invalid="true"]');
      primeiroInvalido?.focus();
      return;
    }

    const botao = formulario.querySelector('[type="submit"]');
    const textoOriginal = botao?.textContent;

    if (botao) {
      botao.disabled = true;
      botao.textContent = 'Enviando...';
    }

    try {
      await enviarParaGoogleForms(formulario);
      formulario.reset();
      formulario.classList.add('oculto');
      document.querySelector('#mensagemSucesso')?.classList.remove('oculto');
    } catch {
      const destino = formulario.dataset.googleFormEndpoint?.replace('/formResponse', '/viewform');
      if (destino) window.open(destino, '_blank', 'noopener,noreferrer');
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
  const linkValido = id !== 'link-arquivos' || !valor || /^https?:\/\/\S+\.\S+/.test(String(valor));
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
  const telefoneValido = texto.replace(/\D/g, '').length >= 10;
  return emailValido || telefoneValido;
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
    body: dados
  });
}
