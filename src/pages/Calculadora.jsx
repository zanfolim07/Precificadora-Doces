import { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppState.jsx';
import { extraCost, health, ingredientCost } from '../lib/calc.js';
import { COMMON_INGREDIENTS, PRODUCT_TYPES, nextId } from '../lib/models.js';
import { money, number, percent } from '../lib/format.js';
import { Field, NumberInput, PageHeader, Segmented, Select, TextInput } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import ModelPicker from '../components/ModelPicker.jsx';
import { MarginControl } from './Painel.jsx';

const STEPS = ['Produto', 'Ingredientes', 'Embalagem e extras', 'Mão de obra e custos fixos', 'Margem de lucro'];

export default function Calculadora({ initialStep = 1 }) {
  const { calc, t, updateCalc, modelId, applyModel } = useApp();
  const [step, setStep] = useState(initialStep);
  const [errors, setErrors] = useState({});
  const titleRef = useRef(null);
  const first = useRef(true);

  useEffect(() => setStep(initialStep), [initialStep]);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    titleRef.current?.focus({ preventScroll: true });
  }, [step]);

  const stepValue = [
    `${number(t.yield)} unidades`,
    `${money(t.ing)} · ${calc.ingredients.length} itens`,
    `${money(t.emb)} · ${calc.extras.length} itens`,
    money(t.mao + t.fix),
    percent(calc.margin),
  ];

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (calc.name.trim().length < 2) e.name = 'Dê um nome ao produto.';
      if (!(calc.yield >= 1)) e.yield = 'O rendimento precisa ser de pelo menos 1 unidade.';
    }
    if (s === 2) {
      if (!calc.ingredients.length) e.ingList = 'Adicione pelo menos um ingrediente.';
      calc.ingredients.forEach((i) => {
        if (!i.name.trim()) e[`${i.id}-name`] = true;
        if (!(i.price > 0)) e[`${i.id}-price`] = true;
        if (!(i.size > 0)) e[`${i.id}-size`] = true;
        if (!(i.qty > 0)) e[`${i.id}-qty`] = true;
      });
      if (!e.ingList && Object.keys(e).length) e.ingList = 'Preencha os campos destacados para calcular o custo.';
    }
    if (s === 3) {
      calc.extras.forEach((x) => {
        if (!x.name.trim()) e[`${x.id}-name`] = true;
        if (!(x.qty > 0)) e[`${x.id}-qty`] = true;
      });
      if (Object.keys(e).length) e.extList = 'Preencha os campos destacados ou remova o item.';
    }
    if (s === 4) {
      if (!(calc.hours > 0)) e.hours = 'Informe o tempo de preparo.';
      if (!(calc.rate > 0)) e.rate = 'Informe quanto vale a sua hora.';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = (e) => {
    e.preventDefault();
    if (!validate(step)) return;
    if (step === 5) { window.location.hash = '#/painel'; return; }
    setStep(step + 1);
  };
  const goTo = (s) => { if (s < step || validate(step)) { setErrors({}); setStep(s); } };

  const setIng = (id, patch) => updateCalc((c) => ({ ingredients: c.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const setExt = (id, patch) => updateCalc((c) => ({ extras: c.extras.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));

  return (
    <>
      <PageHeader title="Calculadora" description="Preencha as cinco etapas. O painel, as metas e o orçamento usam estes valores na hora." />

      <ModelPicker selected={modelId} onPick={(id) => { applyModel(id); setErrors({}); setStep(1); }} />

      <div className="calc">
        <nav className="card steps" aria-label="Etapas do cálculo">
          <ol>
            {STEPS.map((name, i) => {
              const n = i + 1;
              const state = n === step ? 'current' : n < step ? 'done' : 'todo';
              return (
                <li key={name}>
                  <button type="button" className={`step step--${state}`} aria-current={n === step ? 'step' : undefined} onClick={() => goTo(n)}>
                    <span className="step__n">{state === 'done' ? <Icon name="check" size={14} /> : n}</span>
                    <span className="step__text"><strong>{name}</strong><small>{stepValue[i]}</small></span>
                  </button>
                </li>
              );
            })}
          </ol>
          <dl className="steps__total">
            <div><dt>Custo por unidade</dt><dd>{money(t.unit)}</dd></div>
            <div><dt>Preço sugerido</dt><dd className="accent">{money(t.price)}</dd></div>
          </dl>
        </nav>

        <form className="card form" onSubmit={next} noValidate>
          <div className="form__body">
            <header className="form__head">
              <h2 className="form__title" tabIndex={-1} ref={titleRef}>{STEPS[step - 1]}</h2>
              <p className="card__desc">
                {[
                  'O que você está precificando e quantas unidades a receita rende.',
                  'Informe o preço do pacote, o tamanho dele e quanto você usa na receita. O custo é proporcional ao uso.',
                  'Embalagens, etiquetas, forminhas, fitas e outros materiais usados em uma receita.',
                  'O seu tempo de trabalho e a parte do gás e da energia que a receita consome.',
                  'Quanto você quer ganhar além de cobrir todos os custos.',
                ][step - 1]}
              </p>
            </header>

            {step === 1 && (
              <>
                <div className="grid-fields grid-fields--3">
                  <Field label="Nome do produto" error={errors.name}>
                    {({ id }) => <TextInput id={id} value={calc.name} placeholder="Ex.: Brigadeiro gourmet" invalid={!!errors.name} onChange={(e) => updateCalc({ name: e.target.value })} />}
                  </Field>
                  <Field label="Tipo de produto">
                    {({ id }) => <Select id={id} value={calc.type} onChange={(e) => updateCalc({ type: e.target.value })}>{PRODUCT_TYPES.map((p) => <option key={p}>{p}</option>)}</Select>}
                  </Field>
                  <Field label="Rendimento da receita" help="Unidades prontas para venda." error={errors.yield}>
                    {({ id, describedBy }) => <NumberInput id={id} aria-describedby={describedBy} suffix="unidades" value={calc.yield} invalid={!!errors.yield} onChange={(v) => updateCalc({ yield: Math.round(v) })} />}
                  </Field>
                </div>
                <aside className="note-box">
                  <strong>Por que o rendimento importa</strong>
                  <p>O custo total da receita é dividido pelo rendimento. Se a receita rende 30 brigadeiros e você informa 25, cada unidade parece mais cara e o preço final fica errado.</p>
                </aside>
              </>
            )}

            {step === 2 && (
              <>
                <div className="editor editor--ing">
                  <div className="editor__head" aria-hidden="true"><span>Ingrediente</span><span>Preço do pacote</span><span>Tamanho do pacote</span><span>Usado na receita</span><span className="num">Custo</span><span /></div>
                  {calc.ingredients.map((i) => (
                    <div className="editor__row" key={i.id}>
                      <label className="editor__cell"><span className="editor__label">Ingrediente</span>
                        <TextInput value={i.name} placeholder="Ex.: Leite condensado" invalid={!!errors[`${i.id}-name`]} onChange={(e) => setIng(i.id, { name: e.target.value })} />
                      </label>
                      <label className="editor__cell"><span className="editor__label">Preço do pacote</span>
                        <NumberInput prefix="R$" decimals={2} value={i.price} invalid={!!errors[`${i.id}-price`]} onChange={(v) => setIng(i.id, { price: v })} />
                      </label>
                      <div className="editor__cell"><span className="editor__label">Tamanho do pacote</span>
                        <div className="input-pair">
                          <NumberInput value={i.size} aria-label={`Tamanho do pacote de ${i.name || 'ingrediente'}`} invalid={!!errors[`${i.id}-size`]} onChange={(v) => setIng(i.id, { size: v })} />
                          <Select value={i.unit} aria-label="Unidade de medida" onChange={(e) => setIng(i.id, { unit: e.target.value })}>
                            <option value="g">g</option><option value="ml">ml</option><option value="un">un</option>
                          </Select>
                        </div>
                      </div>
                      <label className="editor__cell"><span className="editor__label">Usado na receita</span>
                        <NumberInput suffix={i.unit} value={i.qty} invalid={!!errors[`${i.id}-qty`]} onChange={(v) => setIng(i.id, { qty: v })} />
                      </label>
                      <p className="editor__cost"><span className="editor__label">Custo na receita</span>{money(ingredientCost(i))}</p>
                      <button type="button" className="icon-btn icon-btn--danger" aria-label={`Remover ${i.name || 'ingrediente'}`} onClick={() => updateCalc((c) => ({ ingredients: c.ingredients.filter((x) => x.id !== i.id) }))}><Icon name="trash" size={18} /></button>
                    </div>
                  ))}
                  {!calc.ingredients.length && <p className="editor__empty">Nenhum ingrediente ainda. Adicione abaixo ou escolha um modelo pronto.</p>}
                </div>
                {errors.ingList && <p className="field__error field__error--block" role="alert"><Icon name="alert" size={14} />{errors.ingList}</p>}
                <div className="editor__foot">
                  <div className="editor__add">
                    <button type="button" className="btn btn--secondary" onClick={() => updateCalc((c) => ({ ingredients: [...c.ingredients, { id: nextId(), name: '', price: 0, size: 0, unit: 'g', qty: 0 }] }))}>
                      <Icon name="plus" size={16} />Adicionar ingrediente
                    </button>
                    <Select aria-label="Inserir ingrediente comum" value="" onChange={(e) => { const s = COMMON_INGREDIENTS.find((x) => x.name === e.target.value); if (s) updateCalc((c) => ({ ingredients: [...c.ingredients, { id: nextId(), ...s, qty: 0 }] })); }}>
                      <option value="">Inserir ingrediente comum</option>
                      {COMMON_INGREDIENTS.map((s) => <option key={s.name}>{s.name}</option>)}
                    </Select>
                  </div>
                  <p className="subtotal">Subtotal de ingredientes <strong>{money(t.ing)}</strong></p>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="editor editor--ext">
                  <div className="editor__head" aria-hidden="true"><span>Item</span><span>Custo por unidade</span><span>Quantidade na receita</span><span className="num">Total</span><span /></div>
                  {calc.extras.map((x) => (
                    <div className="editor__row" key={x.id}>
                      <label className="editor__cell"><span className="editor__label">Item</span>
                        <TextInput value={x.name} placeholder="Ex.: Caixa kraft" invalid={!!errors[`${x.id}-name`]} onChange={(e) => setExt(x.id, { name: e.target.value })} />
                      </label>
                      <label className="editor__cell"><span className="editor__label">Custo por unidade</span>
                        <NumberInput prefix="R$" decimals={2} value={x.cost} onChange={(v) => setExt(x.id, { cost: v })} />
                      </label>
                      <label className="editor__cell"><span className="editor__label">Quantidade na receita</span>
                        <NumberInput value={x.qty} invalid={!!errors[`${x.id}-qty`]} onChange={(v) => setExt(x.id, { qty: v })} />
                      </label>
                      <p className="editor__cost"><span className="editor__label">Total</span>{money(extraCost(x))}</p>
                      <button type="button" className="icon-btn icon-btn--danger" aria-label={`Remover ${x.name || 'item'}`} onClick={() => updateCalc((c) => ({ extras: c.extras.filter((y) => y.id !== x.id) }))}><Icon name="trash" size={18} /></button>
                    </div>
                  ))}
                  {!calc.extras.length && <p className="editor__empty">Nenhum item. Se o doce não leva embalagem, pode continuar.</p>}
                </div>
                {errors.extList && <p className="field__error field__error--block" role="alert"><Icon name="alert" size={14} />{errors.extList}</p>}
                <div className="editor__foot">
                  <button type="button" className="btn btn--secondary" onClick={() => updateCalc((c) => ({ extras: [...c.extras, { id: nextId(), name: '', cost: 0, qty: 1 }] }))}>
                    <Icon name="plus" size={16} />Adicionar item
                  </button>
                  <p className="subtotal">Subtotal de embalagem e extras <strong>{money(t.emb)}</strong></p>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <fieldset className="group">
                  <legend className="sr-only">Mão de obra</legend>
                  <div className="group__row"><h3 className="group__title" aria-hidden="true">Mão de obra</h3></div>
                  <div className="grid-fields grid-fields--3">
                    <Field label="Tempo de preparo" error={errors.hours}>
                      {({ id }) => <NumberInput id={id} suffix="horas" value={calc.hours} invalid={!!errors.hours} onChange={(v) => updateCalc({ hours: v })} />}
                    </Field>
                    <Field label="Valor da sua hora" error={errors.rate}>
                      {({ id }) => <NumberInput id={id} prefix="R$" decimals={2} value={calc.rate} invalid={!!errors.rate} onChange={(v) => updateCalc({ rate: v })} />}
                    </Field>
                    <div className="field">
                      <span className="field__label">Mão de obra na receita</span>
                      <output className="readout" aria-live="polite">{money(t.mao)}</output>
                    </div>
                  </div>
                </fieldset>
                <fieldset className="group">
                  <legend className="sr-only">Custos operacionais</legend>
                  <div className="group__row">
                    <h3 className="group__title" aria-hidden="true">Custos operacionais</h3>
                    <Segmented label="Forma de informar" value={calc.fixMode} onChange={(v) => updateCalc({ fixMode: v })} options={[{ value: 'valor', label: 'Valor em R$' }, { value: 'pct', label: 'Percentual' }]} />
                  </div>
                  {calc.fixMode === 'valor' ? (
                    <div className="grid-fields grid-fields--3">
                      <Field label="Gás">{({ id }) => <NumberInput id={id} prefix="R$" decimals={2} value={calc.gas} onChange={(v) => updateCalc({ gas: v })} />}</Field>
                      <Field label="Energia elétrica">{({ id }) => <NumberInput id={id} prefix="R$" decimals={2} value={calc.energy} onChange={(v) => updateCalc({ energy: v })} />}</Field>
                      <Field label="Outros (água, internet)">{({ id }) => <NumberInput id={id} prefix="R$" decimals={2} value={calc.other} onChange={(v) => updateCalc({ other: v })} />}</Field>
                    </div>
                  ) : (
                    <div className="grid-fields grid-fields--3">
                      <Field label="Percentual" help="Aplicado sobre ingredientes e embalagem. É comum usar entre 10% e 20%.">
                        {({ id, describedBy }) => <NumberInput id={id} aria-describedby={describedBy} suffix="%" value={calc.fixPct} onChange={(v) => updateCalc({ fixPct: v })} />}
                      </Field>
                    </div>
                  )}
                  <p className="subtotal subtotal--left">Custos fixos na receita <strong>{money(t.fix)}</strong></p>
                </fieldset>
              </>
            )}

            {step === 5 && (
              <>
                <MarginControl large margin={calc.margin} onChange={(m) => updateCalc({ margin: m })} note={health(calc.margin).text} />
                <dl className="summary-row">
                  <div className="summary-row__lead"><dt>Preço sugerido por unidade</dt><dd>{money(t.price)}</dd></div>
                  <div><dt>Custo por unidade</dt><dd>{money(t.unit)}</dd></div>
                  <div><dt>Lucro por unidade</dt><dd>{money(t.profitU)}</dd></div>
                </dl>
              </>
            )}
          </div>

          <footer className="form__foot">
            <button type="button" className="btn btn--secondary" disabled={step === 1} onClick={() => { setErrors({}); setStep(step - 1); }}>Voltar</button>
            <button type="submit" className="btn btn--primary">{step === 5 ? 'Ver painel' : 'Continuar'}</button>
          </footer>
        </form>
      </div>
    </>
  );
}
