import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { useApp } from '../AppState.jsx';

export default function ExportMenu({ label = 'Exportar PDF ou planilha', options, disabled }) {
  const { notify } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const close = (returnFocus) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const onMenuKey = (e) => {
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close(false);
  };

  const run = async (opt) => {
    setOpen(false);
    setBusy(opt.id);
    try {
      const filename = await opt.run();
      notify('success', `${opt.done}: ${filename}`);
    } catch (err) {
      console.error(err);
      notify('error', `Não foi possível gerar o arquivo. Tente novamente.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="menu-wrap" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        className="btn btn--secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled || !!busy}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); } }}
      >
        {busy ? 'Gerando arquivo…' : label}
        <Icon name="chevronDown" size={16} />
      </button>
      {open && (
        <div className="menu" role="menu" ref={menuRef} onKeyDown={onMenuKey}>
          {options.map((o) => (
            <button key={o.id} type="button" role="menuitem" tabIndex={-1} className="menu__item" onClick={() => run(o)}>
              <Icon name={o.icon} size={18} />
              <span><strong>{o.label}</strong><small>{o.hint}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
