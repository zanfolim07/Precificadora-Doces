import { MODELS } from '../lib/models.js';
import Icon from './Icon.jsx';

export default function ModelPicker({ selected, onPick, title = 'Comece por um modelo', description = 'Clique para preencher a calculadora com valores de referência. Depois, ajuste o que quiser.' }) {
  return (
    <section className="models" aria-labelledby="models-title">
      <div className="models__head">
        <h2 id="models-title" className="card__title">{title}</h2>
        <p className="card__desc">{description}</p>
      </div>
      <div className="models__list">
        {MODELS.map((m) => (
          <button key={m.id} type="button" className="model" aria-pressed={selected === m.id} onClick={() => onPick(m.id)}>
            {m.image ? <img src={m.image} alt="" width="44" height="44" /> : <span className="model__blank"><Icon name="plus" size={18} /></span>}
            <span className="model__text">
              <strong>{m.label}</strong>
              <small>{m.id === 'blank' ? 'Começar do zero' : `${m.build().yield} unidades`}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
