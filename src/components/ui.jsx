import { useEffect, useId, useRef, useState } from 'react';
import { number, parseNumber } from '../lib/format.js';
import Icon from './Icon.jsx';

export function NumberInput({ value, onChange, prefix, suffix, decimals, invalid, className = '', ...rest }) {
  const show = (v) => (v === 0 || v ? (decimals !== undefined ? number(v, decimals) : number(v)) : '');
  const [text, setText] = useState(show(value));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setText(show(value)); }, [value]);
  return (
    <div className={`input ${invalid ? 'is-invalid' : ''} ${className}`}>
      {prefix && <span className="input__affix">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        aria-invalid={invalid || undefined}
        onFocus={() => (focused.current = true)}
        onBlur={() => { focused.current = false; setText(show(value)); }}
        onChange={(e) => { const raw = e.target.value.replace(/[^\d.,-]/g, ''); setText(raw); onChange(parseNumber(raw)); }}
        {...rest}
      />
      {suffix && <span className="input__affix">{suffix}</span>}
    </div>
  );
}

export function TextInput({ invalid, className = '', ...rest }) {
  return (
    <div className={`input ${invalid ? 'is-invalid' : ''} ${className}`}>
      <input type="text" autoComplete="off" aria-invalid={invalid || undefined} {...rest} />
    </div>
  );
}

export function Select({ children, className = '', ...rest }) {
  return (
    <div className={`input input--select ${className}`}>
      <select {...rest}>{children}</select>
      <Icon name="chevronDown" size={16} className="input__chevron" />
    </div>
  );
}

export function Field({ label, help, error, children, className = '' }) {
  const id = useId();
  const describedBy = [help && `${id}-help`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>{label}</label>
      {typeof children === 'function' ? children({ id, describedBy }) : children}
      {help && <p className="field__help" id={`${id}-help`}>{help}</p>}
      {error && <p className="field__error" id={`${id}-err`} role="alert"><Icon name="alert" size={14} />{error}</p>}
    </div>
  );
}

export function Segmented({ options, value, onChange, label, block }) {
  return (
    <div className={`segmented ${block ? 'segmented--block' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className="segmented__item" onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Card({ title, description, actions, children, className = '', as: Tag = 'section', ...rest }) {
  return (
    <Tag className={`card ${className}`} {...rest}>
      {(title || actions) && (
        <header className="card__head">
          <div>
            {title && <h2 className="card__title">{title}</h2>}
            {description && <p className="card__desc">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </Tag>
  );
}

export function PageHeader({ title, description, actions, media }) {
  return (
    <header className="page-head">
      <div className="page-head__main">
        {media}
        <div>
          <h1 className="page-head__title">{title}</h1>
          {description && <p className="page-head__desc">{description}</p>}
        </div>
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  );
}

export function NoCalculation({ children }) {
  return (
    <div className="empty">
      <h2>Ainda não há cálculo</h2>
      <p>{children}</p>
      <a className="btn btn--primary" href="#/calculadora">Fazer um cálculo</a>
    </div>
  );
}

export function Tag({ children, tone = 'neutral' }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}

export function Donut({ segments, size = 176, label, value }) {
  const r = 70, C = 2 * Math.PI * r, gap = 2.5;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 180 180" width={size} height={size} role="img" aria-label={segments.map((s) => `${s.name} ${Math.round((s.value / total) * 100)}%`).join(', ')}>
        <g transform="rotate(-90 90 90)">
          {segments.map((s) => {
            const len = Math.max(0, (s.value / total) * C - gap);
            const el = <circle key={s.name} cx="90" cy="90" r={r} fill="none" stroke={s.color} strokeWidth="24" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />;
            offset += (s.value / total) * C;
            return el;
          })}
        </g>
      </svg>
      <div className="donut__center"><small>{label}</small><strong>{value}</strong></div>
    </div>
  );
}
