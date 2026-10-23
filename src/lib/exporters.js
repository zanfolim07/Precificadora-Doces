import { CATEGORY_NAME, ingredientCost, lineItems, totals, extraCost } from './calc.js';
import { dateBR, dateISO, isoToBR, money, number, percent, slug } from './format.js';

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const pdfText = (s) => String(s).replace(/ | /g, ' ').replace(/−/g, '-');
const ACCENT = [91, 61, 245];
const INK = [17, 17, 20];
const MUTED = [110, 110, 110];

async function loadPdf() {
  const [{ jsPDF }, autoTable] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  return { jsPDF, autoTable: autoTable.default };
}

function pdfHeader(doc, title, subtitle, now) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text('PRECIFICA DOCE', 16, 18);
  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.text(pdfText(`Gerado em ${dateBR(now)}`), 194, 18, { align: 'right' });
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(pdfText(title), 16, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(pdfText(subtitle), 16, 37);
  doc.setDrawColor(230, 230, 230);
  doc.line(16, 42, 194, 42);
}

function pdfFooter(doc) {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('Precifica Doce · calculado na hora, nenhum dado armazenado', 16, 288);
    doc.text(`Página ${p} de ${pages}`, 194, 288, { align: 'right' });
  }
}

const tableStyle = {
  theme: 'plain',
  styles: { font: 'helvetica', fontSize: 9, cellPadding: { top: 2.4, bottom: 2.4, left: 2, right: 2 }, textColor: INK },
  headStyles: { fontStyle: 'bold', textColor: MUTED, fontSize: 8, fillColor: [249, 249, 249] },
  footStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: INK },
  margin: { left: 16, right: 16 },
};

export async function exportPricePdf(c, now = new Date()) {
  const { jsPDF, autoTable } = await loadPdf();
  const t = totals(c);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  pdfHeader(doc, 'Ficha técnica e preço', `${c.name || 'Produto'} · ${c.type} · rende ${number(t.yield)} unidades`, now);

  const boxes = [
    ['Preço sugerido por unidade', money(t.price), true],
    ['Custo por unidade', money(t.unit)],
    ['Lucro por unidade', money(t.profitU)],
    ['Margem sobre o custo', percent(c.margin)],
  ];
  boxes.forEach(([label, value, lead], i) => {
    const x = 16 + i * 45;
    if (lead) { doc.setFillColor(...INK); doc.roundedRect(x, 48, 42, 22, 3, 3, 'F'); }
    else { doc.setDrawColor(230, 230, 230); doc.roundedRect(x, 48, 42, 22, 3, 3, 'S'); }
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...(lead ? [255, 255, 255] : MUTED));
    doc.text(pdfText(label), x + 4, 55);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(lead ? [255, 255, 255] : INK));
    doc.text(pdfText(value), x + 4, 65);
  });

  const parts = [['Ingredientes', t.ing, [217, 209, 255]], ['Embalagem', t.emb, [169, 155, 255]], ['Mão de obra', t.mao, [17, 17, 20]], ['Custos fixos', t.fix, [201, 201, 209]], ['Lucro', t.luc, ACCENT]];
  let x = 16;
  parts.forEach(([, v, rgb]) => {
    const w = t.revenue > 0 ? (v / t.revenue) * 178 : 0;
    if (w > 0) { doc.setFillColor(...rgb); doc.rect(x, 78, w, 4, 'F'); }
    x += w;
  });

  autoTable(doc, {
    ...tableStyle,
    startY: 88,
    head: [['Categoria', 'Na receita', 'Por unidade', '% do preço']],
    body: parts.map(([n, v]) => [n, money(v), money(v / t.yield), percent(t.revenue ? (v / t.revenue) * 100 : 0)]).map((r) => r.map(pdfText)),
    foot: [['Preço de venda', money(t.revenue), money(t.price), '100%'].map(pdfText)],
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    didParseCell: (d) => { if (d.section === 'body' && d.row.index === 4) d.cell.styles.textColor = ACCENT; if (d.section !== 'body' && d.column.index > 0) d.cell.styles.halign = 'right'; },
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text('Itens de custo', 16, doc.lastAutoTable.finalY + 12);
  const items = lineItems(c);
  autoTable(doc, {
    ...tableStyle,
    startY: doc.lastAutoTable.finalY + 15,
    head: [['Item', 'Categoria', 'Base de cálculo', 'Custo', '% do custo']],
    body: items.map((i) => [i.name, CATEGORY_NAME[i.cat], i.basis, money(i.cost), percent(t.cost ? (i.cost / t.cost) * 100 : 0, 1)].map(pdfText)),
    foot: [['Custo total da receita', '', `${items.length} itens`, money(t.cost), '100%'].map(pdfText)],
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
    didParseCell: (d) => { if (d.section !== 'body' && d.column.index > 2) d.cell.styles.halign = 'right'; },
  });
  pdfFooter(doc);
  const filename = `precifica-doce_${slug(c.name)}_${dateISO(now)}.pdf`;
  download(doc.output('blob'), filename);
  return filename;
}

export async function exportBudgetPdf(b, bt, now = new Date()) {
  const { jsPDF, autoTable } = await loadPdf();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const sub = [b.client && `Cliente: ${b.client}`, b.date && `Entrega: ${isoToBR(b.date)}`, b.validity > 0 && `Válido por ${number(b.validity)} dias`].filter(Boolean).join(' · ');
  pdfHeader(doc, 'Orçamento', sub || 'Pedido', now);
  const rows = bt.lines.filter((l) => l.qty > 0);
  autoTable(doc, {
    ...tableStyle,
    startY: 50,
    head: [['Produto', 'Quantidade', 'Preço por unidade', 'Subtotal']],
    body: rows.map((l) => [l.name || 'Item', number(l.qty), money(l.unitPrice), money(l.subtotal)].map(pdfText)),
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    didParseCell: (d) => { if (d.section === 'head' && d.column.index > 0) d.cell.styles.halign = 'right'; },
  });
  const summary = [['Subtotal', money(bt.subtotal)]];
  if (bt.discount > 0) summary.push([`Desconto (${percent(b.discountPct)})`, `- ${money(bt.discount)}`]);
  if (b.delivery > 0) summary.push(['Taxa de entrega', money(b.delivery)]);
  summary.push(['Total do pedido', money(bt.total)]);
  if (bt.deposit > 0) { summary.push([`Sinal (${percent(b.depositPct)})`, money(bt.deposit)]); summary.push(['Restante na entrega', money(bt.remaining)]); }
  autoTable(doc, {
    ...tableStyle,
    startY: doc.lastAutoTable.finalY + 8,
    body: summary.map((r) => r.map(pdfText)),
    margin: { left: 110, right: 16 },
    columnStyles: { 1: { halign: 'right' } },
    didParseCell: (d) => { if (d.row.raw[0] === 'Total do pedido') { d.cell.styles.fontStyle = 'bold'; d.cell.styles.textColor = ACCENT; d.cell.styles.fontSize = 11; } },
  });
  pdfFooter(doc);
  const filename = `orcamento_${slug(b.client || 'pedido')}_${dateISO(now)}.pdf`;
  download(doc.output('blob'), filename);
  return filename;
}

export async function exportPriceXlsx(c, now = new Date()) {
  const ExcelJS = (await import('exceljs')).default;
  const t = totals(c);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Precifica Doce';
  wb.created = now;
  const BRL = '"R$" #,##0.00';
  const head = (row) => { row.font = { bold: true, color: { argb: 'FF6E6E6E' } }; row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } }; };

  const sr = wb.addWorksheet('Resumo');
  const si = wb.addWorksheet('Ingredientes', { views: [{ state: 'frozen', ySplit: 1 }] });
  si.columns = [{ header: 'Ingrediente', width: 30 }, { header: 'Preço do pacote', width: 16 }, { header: 'Tamanho do pacote', width: 18 }, { header: 'Unidade', width: 10 }, { header: 'Usado na receita', width: 17 }, { header: 'Custo na receita', width: 17 }];
  head(si.getRow(1));
  c.ingredients.forEach((i, idx) => {
    const r = idx + 2;
    si.addRow([i.name, i.price, i.size, i.unit, i.qty, { formula: `IF(C${r}=0,0,B${r}/C${r}*E${r})`, result: ingredientCost(i) }]);
  });
  const ingTotalRow = c.ingredients.length + 2;
  si.addRow(['Total', null, null, null, null, { formula: `SUM(F2:F${Math.max(2, ingTotalRow - 1)})`, result: t.ing }]).font = { bold: true };
  si.getColumn(2).numFmt = BRL; si.getColumn(6).numFmt = BRL;

  const se = wb.addWorksheet('Embalagem e extras', { views: [{ state: 'frozen', ySplit: 1 }] });
  se.columns = [{ header: 'Item', width: 32 }, { header: 'Custo por unidade', width: 18 }, { header: 'Quantidade', width: 12 }, { header: 'Total', width: 14 }];
  head(se.getRow(1));
  c.extras.forEach((e, idx) => { const r = idx + 2; se.addRow([e.name, e.cost, e.qty, { formula: `B${r}*C${r}`, result: extraCost(e) }]); });
  const extTotalRow = c.extras.length + 2;
  se.addRow(['Total', null, null, { formula: `SUM(D2:D${Math.max(2, extTotalRow - 1)})`, result: t.emb }]).font = { bold: true };
  se.getColumn(2).numFmt = BRL; se.getColumn(4).numFmt = BRL;

  const sm = wb.addWorksheet('Mão de obra e custos');
  sm.columns = [{ header: 'Item', width: 40 }, { header: 'Valor', width: 16 }];
  head(sm.getRow(1));
  sm.addRow(['Horas de preparo', c.hours]);
  sm.addRow(['Valor da hora', c.rate]).getCell(2).numFmt = BRL;
  sm.addRow(['Mão de obra na receita', { formula: 'B2*B3', result: t.mao }]).getCell(2).numFmt = BRL;
  sm.addRow([]);
  let fixCell;
  if (c.fixMode === 'valor') {
    sm.addRow(['Gás', c.gas]); sm.addRow(['Energia elétrica', c.energy]); sm.addRow(['Outros custos operacionais', c.other]);
    sm.addRow(['Custos fixos na receita', { formula: 'SUM(B6:B8)', result: t.fix }]);
    [6, 7, 8, 9].forEach((r) => (sm.getCell(`B${r}`).numFmt = BRL));
    fixCell = 'B9';
  } else {
    sm.addRow(['Percentual sobre ingredientes e embalagem', c.fixPct / 100]).getCell(2).numFmt = '0%';
    sm.addRow(['Base (ingredientes + embalagem)', { formula: `Ingredientes!F${ingTotalRow}+'Embalagem e extras'!D${extTotalRow}`, result: t.ing + t.emb }]).getCell(2).numFmt = BRL;
    sm.addRow(['Custos fixos na receita', { formula: 'B6*B7', result: t.fix }]).getCell(2).numFmt = BRL;
    fixCell = 'B8';
  }
  sm.getRow(4).font = { bold: true };

  sr.columns = [{ width: 30 }, { width: 18 }, { width: 16 }, { width: 14 }];
  sr.getCell('A1').value = 'Precifica Doce · Ficha técnica e preço';
  sr.getCell('A1').font = { bold: true, size: 14 };
  sr.getCell('A2').value = `Gerado em ${dateBR(now)}`;
  sr.getCell('A2').font = { color: { argb: 'FF6E6E6E' } };
  sr.addRow([]);
  sr.getCell('A4').value = 'Produto'; sr.getCell('B4').value = c.name || 'Produto';
  sr.getCell('A5').value = 'Tipo'; sr.getCell('B5').value = c.type;
  sr.getCell('A6').value = 'Rendimento (unidades)'; sr.getCell('B6').value = t.yield;
  sr.getCell('A7').value = 'Margem sobre o custo'; sr.getCell('B7').value = c.margin / 100; sr.getCell('B7').numFmt = '0%';
  const hr = sr.getRow(9); hr.values = ['Categoria', 'Na receita', 'Por unidade', '% do preço']; head(hr);
  const rows = [
    ['Ingredientes', `Ingredientes!F${ingTotalRow}`, t.ing],
    ['Embalagem e extras', `'Embalagem e extras'!D${extTotalRow}`, t.emb],
    ['Mão de obra', `'Mão de obra e custos'!B4`, t.mao],
    ['Custos fixos', `'Mão de obra e custos'!${fixCell}`, t.fix],
  ];
  rows.forEach(([n, f, v], i) => { sr.getRow(10 + i).values = [n, { formula: f, result: v }, { formula: `B${10 + i}/$B$6`, result: v / t.yield }, { formula: `B${10 + i}/$B$16`, result: t.revenue ? v / t.revenue : 0 }]; });
  sr.getRow(14).values = ['Custo total da receita', { formula: 'SUM(B10:B13)', result: t.cost }, { formula: 'B14/$B$6', result: t.unit }, { formula: 'B14/$B$16', result: t.revenue ? t.cost / t.revenue : 0 }];
  sr.getRow(15).values = ['Lucro', { formula: 'B14*$B$7', result: t.luc }, { formula: 'B15/$B$6', result: t.profitU }, { formula: 'B15/$B$16', result: t.revenue ? t.luc / t.revenue : 0 }];
  sr.getRow(16).values = ['Preço de venda', { formula: 'B14+B15', result: t.revenue }, { formula: 'B16/$B$6', result: t.price }, { formula: 'B16/$B$16', result: 1 }];
  [14, 16].forEach((r) => (sr.getRow(r).font = { bold: true }));
  sr.getRow(15).font = { color: { argb: 'FF5B3DF5' }, bold: true };
  for (let r = 10; r <= 16; r++) { sr.getCell(`B${r}`).numFmt = BRL; sr.getCell(`C${r}`).numFmt = BRL; sr.getCell(`D${r}`).numFmt = '0.0%'; }
  sr.getCell('A18').value = 'Preço sugerido por unidade';
  sr.getCell('B18').value = { formula: 'C16', result: t.price };
  sr.getCell('B18').numFmt = BRL;
  sr.getRow(18).font = { bold: true, size: 12 };

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `precifica-doce_${slug(c.name)}_${dateISO(now)}.xlsx`;
  download(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
  return filename;
}
