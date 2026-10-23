import { useApp } from '../AppState.jsx';
import { goalPlan, marginOnPrice } from '../lib/calc.js';
import { money, number, percent } from '../lib/format.js';
import { Card, PageHeader } from '../components/ui.jsx';

export default function Regras() {
  const { calc, t, goal } = useApp();
  const first = calc.ingredients[0];
  const firstExtra = calc.extras[0];
  const plan = goalPlan(calc, { ...goal, kind: 'lucro' });

  const rawRules = [
    ['Custo do ingrediente', 'Proporcional ao que a receita usa do pacote.', 'preço do pacote ÷ tamanho do pacote × quantidade usada',
      first ? `${money(first.price)} ÷ ${number(first.size)} ${first.unit} × ${number(first.qty)} ${first.unit} = ${money(first.size ? (first.price / first.size) * first.qty : 0)}` : '—'],
    ['Embalagem e extras', 'Cada item pelo custo unitário.', 'custo unitário × quantidade',
      firstExtra ? `${number(firstExtra.qty)} × ${money(firstExtra.cost)} = ${money(firstExtra.cost * firstExtra.qty)}` : '—'],
    ['Mão de obra', 'O seu tempo de trabalho na receita.', 'horas de preparo × valor da hora', `${number(calc.hours)} h × ${money(calc.rate)} = ${money(t.mao)}`],
    ['Custos fixos', 'Valor informado ou percentual.', 'gás + energia + outros  ou  % × (ingredientes + embalagem)', money(t.fix)],
    ['Custo da receita', 'Soma de todas as categorias.', 'ingredientes + embalagem + mão de obra + custos fixos', money(t.cost)],
    ['Custo por unidade', 'Dividido pelo rendimento.', 'custo da receita ÷ rendimento', `${money(t.cost)} ÷ ${number(t.yield)} = ${money(t.unit)}`],
    ['Preço sugerido', 'A margem é aplicada sobre o custo.', 'custo por unidade × (1 + margem)', `${money(t.unit)} × ${number(1 + calc.margin / 100, 2)} = ${money(t.price)}`],
    ['Unidades para a meta', 'Arredondado para cima.', 'meta de lucro ÷ lucro por unidade', plan ? `${money(goal.value)} ÷ ${money(t.profitU)} = ${number(plan.units)}` : '—'],
    ['Total do orçamento', 'Com desconto e entrega.', 'subtotal − desconto + taxa de entrega', 'Calculado na tela Orçamento'],
  ];
  const rules = t.hasCost ? rawRules : rawRules.map((r, i) => (i === rawRules.length - 1 ? r : [r[0], r[1], r[2], '—']));

  return (
    <>
      <PageHeader title="Regras de cálculo" description="Como cada número é calculado. As mesmas regras valem no painel, nas metas, no orçamento e nos arquivos." />

      <section className="card intro">
        <img src="/images/confeitaria.jpg" alt="Ingredientes de confeitaria sobre a mesa: farinha, ovos, mel e uma tigela com massa" width="300" height="168" />
        <div>
          <p className="intro__eyebrow">Como funciona</p>
          <h2 className="intro__title">Preço justo, explicado item por item</h2>
          <p>Você informa os custos da receita e a margem desejada. O Precifica Doce soma tudo, divide pelo rendimento e mostra o preço por unidade com a origem de cada centavo. Nada é enviado ou armazenado.</p>
        </div>
      </section>

      <Card title="Fórmulas" description={t.hasCost ? 'Na ordem em que o cálculo acontece. Os exemplos usam o cálculo atual.' : 'Na ordem em que o cálculo acontece. Os exemplos aparecem depois que você fizer um cálculo.'}>
        <ol className="rules">
          {rules.map(([name, desc, formula, example], i) => (
            <li key={name} className="rule">
              <span className="rule__n">{i + 1}</span>
              <div className="rule__name"><strong>{name}</strong><small>{desc}</small></div>
              <code className="rule__formula">{formula}</code>
              <span className="rule__example">{example}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid grid--half">
        <Card title="Margem sobre o custo">
          <p className="body">
            Uma margem de {percent(calc.margin)} sobre o custo equivale a {percent(marginOnPrice(calc.margin), 1)} do preço de venda
            {t.hasCost ? <>: de cada {money(t.price)} cobrados, {money(t.profitU)} é lucro.</> : '.'}
          </p>
        </Card>
        <Card title="Arredondamento">
          <p className="body">Os cálculos usam os valores completos. Só a exibição é arredondada para centavos, por isso a soma das linhas pode diferir em R$ 0,01.</p>
        </Card>
      </div>
    </>
  );
}
