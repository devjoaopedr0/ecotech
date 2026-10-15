import { useEffect, useState } from 'react';

// O navegador do Apple Watch se identifica como iPhone no user agent, então a
// detecção é feita pela largura da tela: o maior modelo (Ultra / Series 10) tem
// ~208px, bem abaixo de qualquer celular. Depende da meta tag
// "disabled-adaptations=watch" no index.html, sem ela o relógio reporta 320px.
// A segunda condição cobre simuladores que usam a resolução em pixels do relógio
// (ex.: Series 6 = 324x394 e 368x448): tela estreita e baixa demais para ser um
// celular. Usa device-height para não disparar quando o teclado encolhe a janela.
const WATCH_QUERY = '(max-width: 230px), (max-device-width: 400px) and (max-device-height: 460px)';

function detectar() {
  return window.matchMedia(WATCH_QUERY).matches || /watch/i.test(navigator.userAgent);
}

export function useIsWatch() {
  const [isWatch, setIsWatch] = useState(detectar);

  useEffect(() => {
    const mq = window.matchMedia(WATCH_QUERY);
    const onChange = () => setIsWatch(detectar());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isWatch;
}
