const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const money = (n) => brl.format(Number.isFinite(n) ? n : 0);

export const number = (n, digits) => {
  const v = Number.isFinite(n) ? n : 0;
  const opts = digits === undefined ? { maximumFractionDigits: 2 } : { minimumFractionDigits: digits, maximumFractionDigits: digits };
  return new Intl.NumberFormat('pt-BR', opts).format(v);
};

export const percent = (n, digits = 0) => `${number(n, digits)}%`;

export const parseNumber = (text) => {
  if (typeof text === 'number') return text;
  const clean = String(text ?? '').trim().replace(/\s/g, '');
  if (!clean) return 0;
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
};

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const pad = (n) => String(n).padStart(2, '0');

export const longDate = (d) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
export const time = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const dateBR = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
export const dateISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const isoToBR = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};

export function greeting(d) {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'Bom dia!';
  if (h >= 12 && h < 18) return 'Boa tarde!';
  return 'Boa noite!';
}

export const slug = (s) =>
  String(s || 'produto')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'produto';
