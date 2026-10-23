import { useEffect, useRef, useState } from 'react';
import { Sidebar, Toasts, TopNav, ROUTES } from './components/Layout.jsx';
import Painel from './pages/Painel.jsx';
import Calculadora from './pages/Calculadora.jsx';
import Metas from './pages/Metas.jsx';
import Orcamento from './pages/Orcamento.jsx';
import Conversoes from './pages/Conversoes.jsx';
import Regras from './pages/Regras.jsx';

const PAGES = { painel: Painel, calculadora: Calculadora, metas: Metas, orcamento: Orcamento, conversoes: Conversoes, regras: Regras };

function parseHash() {
  const [route, arg] = window.location.hash.replace(/^#\/?/, '').split('/');
  return { route: PAGES[route] ? route : 'painel', arg };
}

export default function App() {
  const [{ route, arg }, setLocation] = useState(parseHash);
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    const onHash = () => { setLocation(parseHash()); setMenuOpen(false); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const label = ROUTES.find((r) => r.id === route)?.label;
    document.title = `${label} · Precifica Doce`;
    mainRef.current?.scrollTo?.(0, 0);
    window.scrollTo(0, 0);
  }, [route]);

  const Page = PAGES[route];
  const step = route === 'calculadora' ? Math.min(5, Math.max(1, parseInt(arg, 10) || 1)) : undefined;

  return (
    <div className="shell">
      <a className="skip-link" href="#conteudo" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Pular para o conteúdo</a>
      <Sidebar current={route} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="panel">
        <TopNav onMenu={() => setMenuOpen(true)} />
        <main key={route} id="conteudo" className="content" ref={mainRef} tabIndex={-1}>
          {route === 'calculadora' ? <Page key={`calc-${arg || 1}`} initialStep={step} /> : <Page />}
        </main>
      </div>
      <Toasts />
    </div>
  );
}
