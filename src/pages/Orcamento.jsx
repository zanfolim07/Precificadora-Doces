import { useApp } from '../AppState.jsx';
import { budgetTotals } from '../lib/calc.js';
import { money, number, percent } from '../lib/format.js';
import { budgetMessage, whatsappLink } from '../lib/messages.js';
import { exportBudgetPdf } from '../lib/exporters.js';
import { nextId } from '../lib/models.js';
import { Card, Field, NumberInput, PageHeader, Tag, TextInput } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

export default function Orcamento() {
  const { calc, t, model, budget, setBudget, notify } = useApp();
  const set = (patch) => setBudget((b) => ({ ...b, ...patch }));
  const addItem = () => setBudget((b) => ({ ...b, items: [...b.items, { id: nextId(), source: 'manual', name: '', qty: 1, price: 0 }] }));
  const setItem = (id, patch) => setBudget((b) => ({ ...b, items: b.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
  const named = {
    ...budget,
    items: budget.items
      .filter((it) => it.source !== 'calc' || t.hasCost)
      .map((it) => (it.source === 'calc' ? { ...it, name: calc.name || 'Produto da calculadora' } : it)),
  };
  const bt = budgetTotals(named, Math.round(t.price * 100) / 100);
  const message = budgetMessage(named, bt);
  const hasItems = bt.lines.some((l) => l.qty > 0 && l.unitPrice > 0);

  const copy = async () => {
    try { await navigator.clipboard.writeText(message); notify('success', 'Texto copiado. É só colar na conversa.'); }
    catch { notify('error', 'Não foi possível copiar. Selecione o texto da prévia e copie manualmente.'); }
  };
  const pdf = async () => {
    try { const f = await exportBudgetPdf(named, bt); notify('success', `PDF gerado: ${f}`); }
    catch (e) { console.error(e); notify('error', 'Não foi possível gerar o PDF. Tente novamente.'); }
  };

  return (
    <>
      <PageHeader
        title="Orçamento"
        description="Monte o orçamento de um pedido e envie para o cliente. Os itens não ficam salvos."
        actions={
          <>
            <button type="button" className="btn btn--secondary" onClick={pdf} disabled={!hasItems}>Exportar PDF</button>
            <a className={`btn btn--primary ${hasItems ? '' : 'is-disabled'}`} aria-disabled={!hasItems} href={hasItems ? whatsappLink(message) : undefined} target="_blank" rel="noopener noreferrer">
              Enviar orçamento pelo WhatsApp
            </a>
          </>
        }
      />

      <div className="grid grid--main-side">
        <div className="col">
          <Card title="Cliente, entrega e pagamento" description="Desconto e sinal são opcionais. O sinal é o valor pago na confirmação do pedido.">
            <div className="grid-fields grid-fields--3">
              <Field label="Nome do cliente">{({ id }) => <TextInput id={id} value={budget.client} placeholder="Ex.: Ana Souza" onChange={(e) => set({ client: e.target.value })} />}</Field>
              <Field label="Data de entrega">{({ id }) => <div className="input"><input id={id} type="date" value={budget.date} onChange={(e) => set({ date: e.target.value })} /></div>}</Field>
              <Field label="Taxa de entrega">{({ id }) => <NumberInput id={id} prefix="R$" decimals={2} value={budget.delivery} onChange={(v) => set({ delivery: v })} />}</Field>
              <Field label="Desconto">{({ id }) => <NumberInput id={id} suffix="%" value={budget.discountPct} onChange={(v) => set({ discountPct: Math.min(100, Math.max(0, v)) })} />}</Field>
              <Field label="Sinal">{({ id }) => <NumberInput id={id} suffix="% do total" value={budget.depositPct} onChange={(v) => set({ depositPct: Math.min(100, Math.max(0, v)) })} />}</Field>
              <Field label="Validade do orçamento">{({ id }) => <NumberInput id={id} suffix="dias" value={budget.validity} onChange={(v) => set({ validity: Math.max(0, Math.round(v)) })} />}</Field>
            </div>
          </Card>

          <Card title="Itens do pedido" description="O primeiro item vem da calculadora. Os demais são digitados só para este orçamento.">
            <div className="order">
              <div className="order__head" aria-hidden="true"><span>Produto</span><span>Quantidade</span><span>Preço por unidade</span><span className="num">Subtotal</span><span /></div>
              {bt.lines.map((l) => (
                <div className="order__row" key={l.id}>
                  <div className="order__product">
                    {l.source === 'calc' && model?.image ? <img src={model.image} alt="" width="48" height="48" /> : <span className="order__initial" aria-hidden="true">{(l.name || '?').charAt(0).toUpperCase()}</span>}
                    <div>
                      {l.source === 'calc' ? <p className="order__name">{l.name}</p> : <TextInput aria-label="Nome do produto" value={l.name} placeholder="Nome do produto" onChange={(e) => setItem(l.id, { name: e.target.value })} />}
                      {l.source === 'calc' && <Tag tone="accent">Da calculadora</Tag>}
                    </div>
                  </div>
                  <label className="order__cell"><span className="editor__label">Quantidade</span><NumberInput aria-label={`Quantidade de ${l.name}`} value={l.qty} onChange={(v) => setItem(l.id, { qty: Math.max(0, Math.round(v)) })} /></label>
                  <label className="order__cell"><span className="editor__label">Preço por unidade</span><NumberInput aria-label={`Preço de ${l.name}`} prefix="R$" decimals={2} value={l.unitPrice} onChange={(v) => setItem(l.id, { price: v })} /></label>
                  <p className="order__subtotal"><span className="editor__label">Subtotal</span>{money(l.subtotal)}</p>
                  <button type="button" className="icon-btn icon-btn--danger" aria-label={`Remover ${l.name || 'item'}`} onClick={() => setBudget((b) => ({ ...b, items: b.items.filter((it) => it.id !== l.id) }))}><Icon name="trash" size={18} /></button>
                </div>
              ))}
              {bt.lines.length > 0 && bt.lines.length < 4 && (
                <button type="button" className="order__add-hint" onClick={addItem}><Icon name="plus" size={16} />Adicionar outro produto ao pedido</button>
              )}
              {!bt.lines.length && (
                <p className="editor__empty">
                  Nenhum item no pedido. Adicione um item ou <a className="link" href="#/calculadora">faça um cálculo</a> para incluir o produto da calculadora.
                </p>
              )}
            </div>
            <div className="card__foot card__foot--row card__bottom">
              <div className="row-gap">
                <button type="button" className="btn btn--secondary" onClick={addItem}><Icon name="plus" size={16} />Adicionar item</button>
                {t.hasCost && !budget.items.some((i) => i.source === 'calc') && (
                  <button type="button" className="btn btn--ghost" onClick={() => setBudget((b) => ({ ...b, items: [{ id: nextId(), source: 'calc', name: '', qty: t.yield, price: null }, ...b.items] }))}>Incluir produto da calculadora</button>
                )}
              </div>
              <span className="muted">{number(bt.units)} unidades no pedido</span>
            </div>
          </Card>

        </div>

        <div className="col">
          <Card title="Resumo do orçamento">
            <dl className="lines">
              <div><dt>Subtotal</dt><dd>{money(bt.subtotal)}</dd></div>
              <div><dt>Desconto ({percent(budget.discountPct, budget.discountPct % 1 ? 1 : 0)})</dt><dd>− {money(bt.discount)}</dd></div>
              <div><dt>Taxa de entrega</dt><dd>{money(budget.delivery)}</dd></div>
            </dl>
            <div className="total-box"><span>Total do pedido</span><strong>{money(bt.total)}</strong></div>
            <dl className="lines">
              <div><dt>Sinal ({percent(budget.depositPct)})</dt><dd>{money(bt.deposit)}</dd></div>
              <div><dt>Restante na entrega</dt><dd>{money(bt.remaining)}</dd></div>
            </dl>
          </Card>
          <Card title="Prévia da mensagem" description="Abre no WhatsApp para você revisar e enviar.">
            <pre className="message">{message}</pre>
            <button type="button" className="btn btn--secondary btn--block" onClick={copy}><Icon name="copy" size={16} />Copiar texto</button>
          </Card>
        </div>
      </div>
    </>
  );
}
