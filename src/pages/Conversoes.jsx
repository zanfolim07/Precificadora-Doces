import { useState } from 'react';
import { useApp } from '../AppState.jsx';
import { HOUSEHOLD, MEASURES } from '../lib/conversions.js';
import { money, number } from '../lib/format.js';
import { Card, Field, NumberInput, PageHeader, Select, Tag } from '../components/ui.jsx';

export default function Conversoes() {
  return (
    <>
      <PageHeader title="Conversões" description="Ferramentas rápidas para medidas caseiras, comparação de embalagens e ajuste de receitas." />
      <div className="grid grid--half">
        <Household />
        <ComparePackages />
      </div>
      <ScaleRecipe />
    </>
  );
}

function Household() {
  const [item, setItem] = useState('acucar');
  const [qty, setQty] = useState(2);
  const [measure, setMeasure] = useState('xicara');
  const ing = HOUSEHOLD.find((h) => h.id === item);
  const m = MEASURES.find((x) => x.id === measure);
  const result = qty * ing[measure];
  return (
    <Card title="Medidas caseiras" description="Converta xícaras e colheres em gramas ou mililitros.">
      <div className="grid-fields grid-fields--3">
        <Field label="Ingrediente">{({ id }) => <Select id={id} value={item} onChange={(e) => setItem(e.target.value)}>{HOUSEHOLD.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}</Select>}</Field>
        <Field label="Quantidade">{({ id }) => <NumberInput id={id} value={qty} onChange={setQty} />}</Field>
        <Field label="Medida">{({ id }) => <Select id={id} value={measure} onChange={(e) => setMeasure(e.target.value)}>{MEASURES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</Select>}</Field>
      </div>
      <div className="result-solid" aria-live="polite">
        <span>{number(qty)} {qty === 1 ? m.label : m.plural} de {ing.label.toLowerCase()}</span>
        <strong>{number(result)} {ing.unit}</strong>
      </div>
      <div className="table-wrap">
        <table className="table table--compact">
          <thead><tr><th scope="col">Medida</th><th scope="col" className="num">Açúcar</th><th scope="col" className="num">Farinha</th><th scope="col" className="num">Líquidos</th></tr></thead>
          <tbody>
            {MEASURES.map((x) => (
              <tr key={x.id}><td>1 {x.label}</td><td className="num">{number(HOUSEHOLD[0][x.id])} g</td><td className="num">{number(HOUSEHOLD[1][x.id])} g</td><td className="num">{number(HOUSEHOLD[5][x.id])} ml</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ComparePackages() {
  const [a, setA] = useState({ name: 'Lata 395 g', price: 7.49, size: 395 });
  const [b, setB] = useState({ name: 'Caixa 1 kg', price: 16.9, size: 1000 });
  const per = (p) => (p.size > 0 ? (p.price / p.size) * 100 : 0);
  const pa = per(a), pb = per(b);
  const valid = pa > 0 && pb > 0;
  const best = valid && pa !== pb ? (pa < pb ? 'a' : 'b') : null;
  const saving = valid && best ? (1 - Math.min(pa, pb) / Math.max(pa, pb)) * 100 : 0;
  const [used, setUsed] = useState(790);
  const costA = (pa / 100) * used, costB = (pb / 100) * used;
  return (
    <Card title="Comparar embalagens" description="Descubra qual tamanho sai mais barato por grama.">
      <div className="packages">
        <PackageOption label="Opção A" p={a} onChange={setA} perHundred={pa} best={best === 'a'} />
        <PackageOption label="Opção B" p={b} onChange={setB} perHundred={pb} best={best === 'b'} />
      </div>
      <p className="muted" aria-live="polite">
        {!valid ? 'Informe preço e tamanho das duas opções.' : best ? `A opção ${best.toUpperCase()} sai ${number(saving, 0)}% mais barata por grama.` : 'As duas opções custam o mesmo por grama.'}
      </p>
      <div className="usage card__bottom">
        <Field label="Quanto você usa por receita">{({ id }) => <NumberInput id={id} suffix="g" value={used} onChange={(v) => setUsed(Math.max(0, v))} />}</Field>
        <dl className="usage__list" aria-live="polite">
          <div><dt>Custo com a opção A</dt><dd>{money(costA)}</dd></div>
          <div><dt>Custo com a opção B</dt><dd>{money(costB)}</dd></div>
          <div className="usage__total"><dt>Economia por receita</dt><dd>{valid && best ? money(Math.abs(costA - costB)) : '—'}</dd></div>
        </dl>
      </div>
    </Card>
  );
}

function PackageOption({ label, p, onChange, perHundred, best }) {
  return (
    <div className={`package ${best ? 'package--best' : ''}`}>
      <div className="package__head">
        <strong>{label}</strong>
        {best && <Tag tone="light">Mais econômica</Tag>}
      </div>
      <div className="grid-fields grid-fields--2">
        <Field label="Preço">{({ id }) => <NumberInput id={id} prefix="R$" decimals={2} value={p.price} onChange={(v) => onChange({ ...p, price: v })} />}</Field>
        <Field label="Tamanho">{({ id }) => <NumberInput id={id} suffix="g" value={p.size} onChange={(v) => onChange({ ...p, size: v })} />}</Field>
      </div>
      <p className="package__value">{money(perHundred)}</p>
      <p className="package__unit">por 100 g</p>
    </div>
  );
}

function ScaleRecipe() {
  const { calc } = useApp();
  const [want, setWant] = useState(50);
  const base = Math.max(1, calc.yield);
  const factor = want > 0 ? want / base : 0;
  return (
    <Card title="Ajustar receita" description="Recalcule as quantidades da receita da calculadora para outro rendimento.">
      <div className="scale">
        <div className="grid-fields grid-fields--2">
          <div className="static-field"><span className="field__label">A receita rende</span><p>{number(base)} unidades</p></div>
          <Field label="Quero produzir">{({ id }) => <NumberInput id={id} suffix="unidades" value={want} onChange={(v) => setWant(Math.max(0, Math.round(v)))} />}</Field>
        </div>
        <div className="field factor">
          <span className="field__label">Fator</span>
          <output className="factor__value">× {number(factor, 2)}</output>
        </div>
      </div>
      {calc.ingredients.length ? (
        <div className="table-wrap">
          <table className="table table--compact">
            <thead><tr><th scope="col">Ingrediente</th><th scope="col" className="num">Original</th><th scope="col" className="num">Ajustado</th></tr></thead>
            <tbody>
              {calc.ingredients.map((i) => (
                <tr key={i.id}><td>{i.name || 'Ingrediente sem nome'}</td><td className="num">{number(i.qty)} {i.unit}</td><td className="num">{number(i.unit === 'un' ? Math.ceil(i.qty * factor) : Math.round(i.qty * factor))} {i.unit}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">Adicione ingredientes na calculadora para ajustar a receita.</p>
      )}
    </Card>
  );
}
