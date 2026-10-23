import { CATEGORY_NAME, lineItems, totals } from './calc.js';
import { dateBR, isoToBR, money, number, percent } from './format.js';

export const whatsappLink = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export function priceSummary(c, now = new Date()) {
  const t = totals(c);
  const top = [...lineItems(c)].sort((a, b) => b.cost - a.cost).slice(0, 5);
  return [
    `*${c.name || 'Produto'}*${c.type ? ` (${c.type})` : ''}`,
    `Rende ${number(t.yield)} unidades`,
    '',
    '*Preço por unidade*',
    `• Preço sugerido: ${money(t.price)}`,
    `• Custo: ${money(t.unit)}`,
    `• Lucro: ${money(t.profitU)} (margem de ${percent(c.margin)} sobre o custo)`,
    '',
    '*Custo da receita*',
    `• Ingredientes: ${money(t.ing)}`,
    `• Embalagem e extras: ${money(t.emb)}`,
    `• Mão de obra: ${money(t.mao)}`,
    `• Custos fixos: ${money(t.fix)}`,
    `• Total: ${money(t.cost)}`,
    '',
    '*Maiores custos*',
    ...top.map((i) => `• ${i.name}: ${money(i.cost)}`),
    '',
    `_Calculado no Precifica Doce em ${dateBR(now)}_`,
  ].join('\n');
}

export function budgetMessage(b, bt) {
  const lines = [`*Orçamento${b.client ? ` para ${b.client}` : ''}*`];
  if (b.date) lines.push(`Entrega: ${isoToBR(b.date)}`);
  lines.push('');
  bt.lines.filter((l) => l.qty > 0).forEach((l) => lines.push(`• ${number(l.qty)} × ${l.name || 'Item'}: ${money(l.subtotal)}`));
  lines.push('', `Subtotal: ${money(bt.subtotal)}`);
  if (bt.discount > 0) lines.push(`Desconto (${percent(b.discountPct, b.discountPct % 1 ? 1 : 0)}): − ${money(bt.discount)}`);
  if (b.delivery > 0) lines.push(`Entrega: ${money(b.delivery)}`);
  lines.push(`*Total: ${money(bt.total)}*`);
  if (bt.deposit > 0) lines.push('', `Sinal para confirmar (${percent(b.depositPct)}): ${money(bt.deposit)}`);
  if (b.validity > 0) lines.push(`Orçamento válido por ${number(b.validity)} dias.`);
  return lines.join('\n');
}

export { CATEGORY_NAME };
