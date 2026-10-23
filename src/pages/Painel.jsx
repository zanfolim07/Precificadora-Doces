import { useState } from 'react';
import { useApp } from '../AppState.jsx';
import { CATEGORIES, health, lineItems } from '../lib/calc.js';
import { money, percent } from '../lib/format.js';
import { priceSummary, whatsappLink } from '../lib/messages.js';
import { exportPricePdf, exportPriceXlsx } from '../lib/exporters.js';
import { Card, Donut, Field, NumberInput, PageHeader } from '../components/ui.jsx';
import ExportMenu from '../components/ExportMenu.jsx';
import ModelPicker from '../components/ModelPicker.jsx';
import Icon from '../components/Icon.jsx';

export default function Painel() {
  const { calc, t, model, modelId, isExample, dismissExample, updateCalc, applyModel, newCalculation } = useApp();
  const [testPrice, setTestPrice] = useState(null);

  if (!t.hasCost) {
    return (
      <>
        <PageHeader title="Painel" description="O resultado aparece aqui assim que você fizer um cálculo." />
        <section className="card start">
          <h2 className="start__title">Comece um novo cálculo</h2>
          <p className="card__desc">Escolha um modelo pronto para editar ou comece do zero. Nada fica salvo: ao recarregar a página, o painel volta a ficar vazio.</p>
          <ModelPicker
            selected={modelId}
            title="Modelos prontos"
            description="Os valores são uma referência e podem ser alterados na calculadora."
            onPick={(id) => { applyModel(id); window.location.hash = '#/calculadora'; }}
          />
        </section>
      </>
    );
  }

  const startNew = () => {
    if (!window.confirm('Começar um novo cálculo? O cálculo e o orçamento atuais serão descartados.')) return;
    newCalculation();
    window.location.hash = '#/calculadora';
  };

  const values = { ing: t.ing, emb: t.emb, mao: t.mao, fix: t.fix, luc: t.luc };
  const h = health(calc.margin);
  const top = [...lineItems(calc)].sort((a, b) => b.cost - a.cost);
  const tp = testPrice ?? Math.floor(t.price);
  const tProfit = tp - t.unit;
  const tMargin = t.unit > 0 ? (tProfit / t.unit) * 100 : 0;

  return (
    <>
      <PageHeader
        media={model?.image && <img className="page-head__photo" src={model.image} alt="" width="64" height="64" />}
        title={calc.name || 'Produto sem nome'}
        description={`${calc.type} · receita rende ${t.yield} unidades`}
        actions={
          <>
            <button type="button" className="btn btn--secondary" onClick={startNew}>Novo cálculo</button>
            <ExportMenu
              options={[
                { id: 'pdf', icon: 'file', label: 'PDF', hint: 'Ficha técnica para imprimir ou enviar', done: 'PDF gerado', run: () => exportPricePdf(calc) },
                { id: 'xlsx', icon: 'sheet', label: 'Planilha Excel', hint: 'Abas por categoria, com fórmulas', done: 'Planilha gerada', run: () => exportPriceXlsx(calc) },
              ]}
            />
            <a className="btn btn--primary" href={whatsappLink(priceSummary(calc))} target="_blank" rel="noopener noreferrer">
              Enviar resumo pelo WhatsApp
            </a>
          </>
        }
      />

      {isExample && (
        <aside className="example-bar" aria-label="Aviso de exemplo">
          <div>
            <strong>Você está vendo um exemplo.</strong>
            <p>Experimente mudar a margem no card "Preço de venda" ou abra a calculadora para trocar preços e adicionar ingredientes. Os números se atualizam na hora.</p>
          </div>
          <div className="example-bar__actions">
            <a className="btn btn--secondary" href="#/calculadora/2">Editar na calculadora</a>
            <button type="button" className="icon-btn" aria-label="Fechar aviso" onClick={dismissExample}><Icon name="close" size={18} /></button>
          </div>
        </aside>
      )}

      <div className="kpis">
        <div className="kpi kpi--lead">
          <span className="kpi__label">Preço sugerido por unidade</span>
          <strong className="kpi__value kpi__value--lg">{money(t.price)}</strong>
          <span className="kpi__note">Custo de {money(t.unit)} + margem de {percent(calc.margin)}</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Custo por unidade</span>
          <strong className="kpi__value">{money(t.unit)}</strong>
          <span className="kpi__note">{money(t.cost)} por receita ÷ {t.yield} unidades</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Lucro por unidade</span>
          <strong className="kpi__value">{money(t.profitU)}</strong>
          <span className="kpi__note">{money(t.luc)} de lucro por receita</span>
        </div>
      </div>

      <div className="grid grid--main-side">
        <Card title="Composição do preço" description="Quanto de cada real cobrado cobre cada custo e quanto sobra como lucro.">
          <div className="composition">
            <Donut segments={CATEGORIES.map((c) => ({ name: c.name, value: values[c.key], color: c.color }))} label="Preço" value={money(t.price)} />
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th scope="col">Categoria</th><th scope="col" className="num hide-sm">Na receita</th><th scope="col" className="num">Por unidade</th><th scope="col" className="num">% do preço</th></tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((c) => (
                    <tr key={c.key} className={c.key === 'luc' ? 'row-accent' : ''}>
                      <td><span className="swatch" style={{ background: c.color }} />{c.name}</td>
                      <td className="num hide-sm">{money(values[c.key])}</td>
                      <td className="num">{money(values[c.key] / t.yield)}</td>
                      <td className="num muted">{percent((values[c.key] / t.revenue) * 100)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td>Preço de venda</td><td className="num hide-sm">{money(t.revenue)}</td><td className="num">{money(t.price)}</td><td className="num">100%</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
          <dl className="recipe-facts card__bottom">
            <div><dt>Custo da receita</dt><dd>{money(t.cost)}</dd></div>
            <div><dt>Faturamento da receita</dt><dd>{money(t.revenue)}</dd></div>
            <div><dt>Lucro da receita</dt><dd className="accent">{money(t.luc)}</dd></div>
            <div><dt>De cada R$ 1,00 cobrado</dt><dd>{money(t.luc / t.revenue)} é lucro</dd></div>
          </dl>
        </Card>

        <Card title="Preço de venda" description="Ajuste a margem ou teste um valor redondo.">
          <MarginControl margin={calc.margin} onChange={(m) => updateCalc({ margin: m })} note={h.text} />
          <hr className="divider" />
          <Field label="Testar preço por unidade">
            {({ id }) => <NumberInput id={id} prefix="R$" decimals={2} value={tp} onChange={setTestPrice} />}
          </Field>
          <div className={`result-box ${tProfit < 0 ? 'result-box--loss' : ''}`} aria-live="polite">
            <p className="result-box__title">
              {tp <= 0 ? 'Digite um preço para testar' : tProfit < 0 ? 'Esse preço dá prejuízo' : 'Esse preço cobre seus custos'}
            </p>
            {tp > 0 && (
              <>
                <dl className="pair">
                  <div><dt>{tProfit < 0 ? 'Prejuízo' : 'Lucro'} por unidade</dt><dd>{money(Math.abs(tProfit))}</dd></div>
                  <div><dt>{tProfit < 0 ? 'Prejuízo' : 'Lucro'} na receita</dt><dd>{money(Math.abs(tProfit * t.yield))}</dd></div>
                </dl>
                <p className="result-box__note">
                  {tProfit < 0 ? `O mínimo para não ter prejuízo é ${money(t.unit)} por unidade.` : `Margem de ${percent(tMargin)} sobre o custo de cada unidade.`}
                </p>
              </>
            )}
          </div>
        </Card>
      </div>

      <Card title="Maiores custos" description="Os cinco itens que mais pesam no custo da receita.">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Item</th><th scope="col" className="num">Custo na receita</th><th scope="col" className="num">% do custo</th></tr></thead>
            <tbody>
              {top.slice(0, 5).map((i) => (
                <tr key={i.name + i.cat}><td>{i.name}</td><td className="num">{money(i.cost)}</td><td className="num muted">{percent((i.cost / t.cost) * 100, 1)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card__foot"><a className="link" href="#/calculadora/2">Ver os {top.length} itens na calculadora</a></div>
      </Card>
    </>
  );
}

export function MarginControl({ margin, onChange, note, large }) {
  const fill = ((margin - 10) / 190) * 100;
  return (
    <div className="margin">
      <div className="margin__row">
        <label htmlFor={large ? 'margin-lg' : 'margin'} className="field__label">Margem de lucro sobre o custo</label>
        <output htmlFor={large ? 'margin-lg' : 'margin'} className={large ? 'margin__value margin__value--lg' : 'margin__value'}>{percent(margin)}</output>
      </div>
      <input id={large ? 'margin-lg' : 'margin'} className="range" type="range" min="10" max="200" step="5" value={margin} style={{ '--fill': `${fill}%` }} onChange={(e) => onChange(+e.target.value)} aria-valuetext={`${margin}%`} />
      <div className="chips" role="group" aria-label="Margens comuns">
        {[30, 60, 100].map((m) => (
          <button key={m} type="button" className="chip" aria-pressed={margin === m} onClick={() => onChange(m)}>{m}%</button>
        ))}
      </div>
      {note && <p className="margin__note">{note}</p>}
    </div>
  );
}
