import { useApp } from '../AppState.jsx';
import { goalPlan, marginScenarios } from '../lib/calc.js';
import { money, number, percent } from '../lib/format.js';
import { Card, Field, NoCalculation, NumberInput, PageHeader, Segmented } from '../components/ui.jsx';

export default function Metas() {
  const { calc, t, model, goal, setGoal } = useApp();
  const set = (patch) => setGoal((g) => ({ ...g, ...patch }));
  const plan = goalPlan(calc, goal);
  const scenarios = marginScenarios(calc, goal.kind, goal.value);
  const kindLabel = goal.kind === 'lucro' ? 'lucrar' : 'faturar';

  if (!t.hasCost) {
    return (
      <>
        <PageHeader title="Metas" description="Descubra quanto precisa vender para atingir um objetivo de lucro ou de faturamento." />
        <NoCalculation>A meta usa o preço e o lucro por unidade da calculadora. Faça um cálculo primeiro.</NoCalculation>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Metas" description="Descubra quanto precisa vender para atingir um objetivo de lucro ou de faturamento." />

      <div className="grid grid--side-main">
        <Card title="Defina sua meta" description="O resultado é recalculado na hora.">
          <div className="stack">
            <div className="field">
              <span className="field__label" id="goal-kind">Tipo de meta</span>
              <Segmented block label="Tipo de meta" value={goal.kind} onChange={(v) => set({ kind: v })} options={[{ value: 'lucro', label: 'Lucro' }, { value: 'faturamento', label: 'Faturamento' }]} />
            </div>
            <Field label="Valor da meta">{({ id }) => <NumberInput id={id} prefix="R$" decimals={2} value={goal.value} onChange={(v) => set({ value: v })} />}</Field>
            <div className="static-field">
              <span className="field__label">Produto</span>
              <p>{calc.name || 'Produto sem nome'} · {money(goal.kind === 'lucro' ? t.profitU : t.price)} de {goal.kind === 'lucro' ? 'lucro' : 'preço'} por unidade</p>
            </div>
            <div className="grid-fields grid-fields--2">
              <Field label="Prazo">{({ id }) => <NumberInput id={id} suffix="semanas" value={goal.weeks} onChange={(v) => set({ weeks: Math.max(1, Math.round(v)) })} />}</Field>
              <Field label="Dias de produção">{({ id }) => <NumberInput id={id} suffix="por semana" value={goal.days} onChange={(v) => set({ days: Math.min(7, Math.max(1, Math.round(v))) })} />}</Field>
            </div>
          </div>
          <div className="card__bottom">
          <p className="facts__title">Base do cálculo</p>
          <dl className="facts">
            <div><dt>Preço por unidade</dt><dd>{money(t.price)}</dd></div>
            <div><dt>Lucro por unidade</dt><dd>{money(t.profitU)}</dd></div>
            <div><dt>Margem sobre o custo</dt><dd>{percent(calc.margin)}</dd></div>
            <div><dt>Rendimento da receita</dt><dd>{number(t.yield)} unidades</dd></div>
          </dl>
          </div>
        </Card>

        <div className="col">
          {plan ? (
            <>
              <section className="hero-result" aria-live="polite">
                <div>
                  <p className="hero-result__label">Para {kindLabel} {money(goal.value)} em {number(goal.weeks)} {goal.weeks === 1 ? 'semana' : 'semanas'}</p>
                  <p className="hero-result__value">{number(plan.units)} unidades</p>
                  <p className="hero-result__note">Cerca de {number(Math.ceil(plan.recipes))} receitas de {(calc.name || 'produto').toLowerCase()}, com faturamento de {money(plan.revenue)}.</p>
                </div>
                {model?.image && <img src={model.image} alt="" width="132" height="132" />}
              </section>
              <div className="mini-cards">
                <div className="mini-card"><span>Por semana</span><strong>{number(plan.perWeek)} unidades</strong><small>Cerca de {number(plan.recipesPerWeek, 1)} receitas</small></div>
                <div className="mini-card"><span>Por dia de produção</span><strong>{number(plan.perDay)} unidades</strong><small>Cerca de {number(plan.recipesPerDay, 1)} receita</small></div>
                <div className="mini-card"><span>Faturamento total</span><strong>{money(plan.revenue)}</strong><small>{number(plan.units)} × {money(t.price)}</small></div>
                <div className="mini-card"><span>Custos totais</span><strong>{money(plan.cost)}</strong><small>{number(plan.units)} × {money(t.unit)}</small></div>
              </div>
            </>
          ) : (
            <div className="empty">
              <h2>Faltam dados para calcular</h2>
              <p>Informe um valor de meta maior que zero e preencha os custos na calculadora.</p>
              <a className="btn btn--secondary" href="#/calculadora">Abrir calculadora</a>
            </div>
          )}

          <Card title="Comparativo de margens" description="Com uma margem maior, você precisa vender menos para chegar à mesma meta. Em destaque, a margem atual.">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th scope="col">Margem</th><th scope="col" className="num">Preço por unidade</th><th scope="col" className="num">Lucro por unidade</th><th scope="col" className="num">Unidades para a meta</th><th scope="col" className="num">Receitas</th></tr></thead>
                <tbody>
                  {scenarios.map((s) => (
                    <tr key={s.margin} className={s.current ? 'row-accent' : ''} aria-current={s.current || undefined}>
                      <td>{percent(s.margin)}{s.current && <span className="sr-only"> (margem atual)</span>}</td>
                      <td className="num">{money(s.price)}</td>
                      <td className="num">{money(s.profitU)}</td>
                      <td className="num">{s.units ? number(s.units) : '—'}</td>
                      <td className="num">{s.units ? number(s.recipes) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
