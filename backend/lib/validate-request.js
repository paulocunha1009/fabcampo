// Validação antes da cota: solicitações inválidas não devem consumir uso da IA.
export function validateRequest(kind) {
  return (req, res, next) => {
    const body = req.body;
    const reject = error => res.status(400).json({ error, code: 'INVALID_REQUEST' });
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return reject('Envie um objeto JSON com os campos da solicitação.');
    }
    const max = kind === 'activity' ? 16000 : 2000;
    if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > max) {
      return reject(`Mensagem deve ter entre 1 e ${max} caracteres.`);
    }
    if (kind === 'activity') {
      if (typeof body.system !== 'string' || !body.system.trim() || body.system.length > 5000) {
        return reject('Campo "system" obrigatório (máximo de 5.000 caracteres).');
      }
    } else {
      const history = body.history === undefined ? [] : body.history;
      if (!Array.isArray(history) || history.some(item =>
        !item || typeof item !== 'object' || !['user', 'assistant'].includes(item.role) ||
        typeof item.content !== 'string' || !item.content.trim() || item.content.length > 4000
      )) {
        return reject('Histórico deve conter mensagens de usuário ou assistente com texto de até 4.000 caracteres.');
      }
    }
    next();
  };
}
