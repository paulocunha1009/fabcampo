export function prepararImagens() {
  document.querySelectorAll('img[data-fallback-hidden]').forEach((imagem) => {
    const suporte=imagem.closest('[data-image-placeholder]');
    if(suporte) suporte.dataset.imagePlaceholder='Carregando imagem…';
    const marcarCarregada = () => {
      imagem.hidden=false;
      imagem.closest('[data-image-placeholder]')?.classList.add('imagem-carregada');
    };
    const marcarPendente = () => {
      const bloco = imagem.closest('[data-image-placeholder]');
      if(bloco){
        bloco.classList.remove('imagem-carregada');
        if(!bloco.dataset.arquivoPendente) bloco.dataset.arquivoPendente=imagem.getAttribute('src')||'';
        bloco.dataset.imagePlaceholder='Registro fotográfico em documentação';
      }
      // Preserva legenda e contexto; o caminho técnico não vira texto para o visitante.
      imagem.hidden=true;
    };

    if (imagem.complete && imagem.naturalWidth > 0) {
      marcarCarregada();
    } else if(imagem.complete && imagem.getAttribute('src')) {
      marcarPendente();
    } else {
      imagem.addEventListener('load', marcarCarregada, { once: true });
    }

    imagem.addEventListener('error', marcarPendente);
  });
}
