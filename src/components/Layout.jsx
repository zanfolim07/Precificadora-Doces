import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { greeting, longDate, time } from '../lib/format.js';
import { useApp } from '../AppState.jsx';
import Icon from './Icon.jsx';

export const ROUTES = [
  { id: 'painel', label: 'Painel', icon: 'painel', href: '#/painel' },
  { id: 'calculadora', label: 'Calculadora', icon: 'calculadora', href: '#/calculadora' },
  { id: 'metas', label: 'Metas', icon: 'metas', href: '#/metas' },
  { id: 'orcamento', label: 'Orçamento', icon: 'orcamento', href: '#/orcamento' },
  { id: 'conversoes', label: 'Conversões', icon: 'conversoes', href: '#/conversoes' },
  { id: 'regras', label: 'Regras de cálculo', icon: 'regras', href: '#/regras' },
];

function useIndicator(current) {
  const navRef = useRef(null);
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = navRef.current?.querySelector('[aria-current="page"]');
      if (el) setPos({ top: el.offsetTop, height: el.offsetHeight });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [current]);
  return [navRef, pos];
}

export function Sidebar({ current, open, onClose }) {
  const [navRef, pos] = useIndicator(current);
  return (
    <>
      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Navegação principal">
        <div className="sidebar__top">
          <a className="brand" href="#/painel" onClick={onClose}>Precifica Doce</a>
          <button className="icon-btn sidebar__close" type="button" onClick={onClose} aria-label="Fechar menu"><Icon name="close" /></button>
        </div>
        <nav className="nav" ref={navRef}>
          {pos && <span className="nav__indicator" style={{ transform: `translateY(${pos.top}px)`, height: pos.height }} aria-hidden="true" />}
          {ROUTES.map((r) => (
            <a key={r.id} href={r.href} className="nav__item" aria-current={current === r.id ? 'page' : undefined} onClick={onClose}>
              <Icon name={r.icon} />
              {r.label}
            </a>
          ))}
        </nav>
        <p className="sidebar__note">Nenhum dado é armazenado. Tudo é calculado na hora.</p>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
    </>
  );
}

export function TopNav({ onMenu }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <header className="topnav">
      <button className="icon-btn topnav__menu" type="button" onClick={onMenu} aria-label="Abrir menu"><Icon name="menu" /></button>
      <p className="topnav__greeting">{greeting(now)}</p>
      <p className="topnav__date">
        <span className="topnav__day">{longDate(now)}</span>
        <time className="topnav__time" dateTime={now.toISOString()}>{time(now)}</time>
      </p>
    </header>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
          <Icon name={t.type === 'error' ? 'alert' : 'check'} size={18} />
          {t.text}
        </div>
      ))}
    </div>
  );
}
