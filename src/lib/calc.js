export const CATEGORIES = [
  { key: 'ing', name: 'Ingredientes', color: 'var(--c-ing)', hex: '#D9D1FF' },
  { key: 'emb', name: 'Embalagem', color: 'var(--c-emb)', hex: '#A99BFF' },
  { key: 'mao', name: 'Mão de obra', color: 'var(--c-mao)', hex: '#111114' },
  { key: 'fix', name: 'Custos fixos', color: 'var(--c-fix)', hex: '#C9C9D1' },
  { key: 'luc', name: 'Lucro', color: 'var(--c-luc)', hex: '#5B3DF5' },
];

export const CATEGORY_NAME = { ing: 'Ingredientes', emb: 'Embalagem e extras', mao: 'Mão de obra', fix: 'Custos fixos' };

export const ingredientCost = (i) => (i.size > 0 ? (i.price / i.size) * i.qty : 0);
export const extraCost = (e) => e.cost * e.qty;

export function totals(c) {
  const ing = c.ingredients.reduce((s, i) => s + ingredientCost(i), 0);
  const emb = c.extras.reduce((s, e) => s + extraCost(e), 0);
  const mao = c.hours * c.rate;
  const fix = c.fixMode === 'valor' ? c.gas + c.energy + c.other : (ing + emb) * (c.fixPct / 100);
  const cost = ing + emb + mao + fix;
  const yieldN = Math.max(1, Math.round(c.yield) || 0);
  const luc = cost * (c.margin / 100);
  const revenue = cost + luc;
  return {
    ing, emb, mao, fix, luc, cost, revenue,
    yield: yieldN,
    unit: cost / yieldN,
    price: revenue / yieldN,
    profitU: luc / yieldN,
    margin: c.margin,
    hasCost: cost > 0,
  };
}

export const marginOnPrice = (m) => (m / (100 + m)) * 100;

export function health(margin) {
  if (margin < 30) return { level: 'risk', label: 'Arriscada', text: 'Margem arriscada: perdas e imprevistos podem consumir todo o lucro.' };
  if (margin < 50) return { level: 'fair', label: 'Razoável', text: 'Margem razoável. Um pouco mais de folga protege contra aumentos de preço.' };
  return { level: 'good', label: 'Saudável', text: 'Margem saudável: os custos estão cobertos com folga.' };
}

const UNIT = { g: 'g', ml: 'ml', un: 'un' };
const fmt = (n) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n);
const brl = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export function lineItems(c) {
  const t = totals(c);
  const items = [];
  c.ingredients.forEach((i) =>
    items.push({ cat: 'ing', name: i.name || 'Ingrediente sem nome', basis: `${fmt(i.qty)} ${UNIT[i.unit]} de ${fmt(i.size)} ${UNIT[i.unit]} a ${brl(i.price)}`, cost: ingredientCost(i) }),
  );
  c.extras.forEach((e) => items.push({ cat: 'emb', name: e.name || 'Item sem nome', basis: `${fmt(e.qty)} × ${brl(e.cost)}`, cost: extraCost(e) }));
  if (t.mao > 0) items.push({ cat: 'mao', name: 'Mão de obra', basis: `${fmt(c.hours)} h × ${brl(c.rate)}/h`, cost: t.mao });
  if (c.fixMode === 'valor') {
    [['Gás', c.gas], ['Energia elétrica', c.energy], ['Outros custos operacionais', c.other]]
      .filter(([, v]) => v > 0)
      .forEach(([name, v]) => items.push({ cat: 'fix', name, basis: 'Valor por receita', cost: v }));
  } else if (t.fix > 0) {
    items.push({ cat: 'fix', name: 'Custos operacionais', basis: `${fmt(c.fixPct)}% de ingredientes e embalagem`, cost: t.fix });
  }
  return items;
}

export function goalPlan(c, { kind, value, weeks, days }) {
  const t = totals(c);
  const perUnit = kind === 'lucro' ? t.profitU : t.price;
  if (!(perUnit > 0) || !(value > 0)) return null;
  const units = Math.ceil(value / perUnit - 1e-9);
  const w = Math.max(1, weeks || 1);
  const d = Math.max(1, days || 1);
  return {
    units,
    recipes: units / t.yield,
    perWeek: Math.ceil(units / w),
    recipesPerWeek: units / t.yield / w,
    perDay: Math.ceil(units / (w * d)),
    recipesPerDay: units / t.yield / (w * d),
    revenue: units * t.price,
    cost: units * t.unit,
    profit: units * t.profitU,
  };
}

export function marginScenarios(c, kind, value, margins = [30, 60, 100]) {
  const t = totals(c);
  const list = [...new Set([...margins, c.margin])].sort((a, b) => a - b);
  return list.map((m) => {
    const price = t.unit * (1 + m / 100);
    const profitU = t.unit * (m / 100);
    const perUnit = kind === 'lucro' ? profitU : price;
    const units = perUnit > 0 && value > 0 ? Math.ceil(value / perUnit - 1e-9) : 0;
    return { margin: m, price, profitU, units, recipes: Math.ceil(units / t.yield), current: m === c.margin };
  });
}

export function budgetTotals(b, calcPrice) {
  const lines = b.items.map((it) => {
    const price = it.source === 'calc' && it.price === null ? calcPrice : it.price || 0;
    return { ...it, unitPrice: price, subtotal: price * (it.qty || 0) };
  });
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const discount = subtotal * (Math.min(100, Math.max(0, b.discountPct)) / 100);
  const total = Math.max(0, subtotal - discount + (b.delivery || 0));
  const deposit = total * (Math.min(100, Math.max(0, b.depositPct)) / 100);
  const units = lines.reduce((s, l) => s + (l.qty || 0), 0);
  return { lines, subtotal, discount, total, deposit, remaining: total - deposit, units };
}
