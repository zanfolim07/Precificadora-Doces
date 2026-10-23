import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { modelById, nextId } from './lib/models.js';
import { totals } from './lib/calc.js';

const AppContext = createContext(null);

const initialBudget = (yieldN) => ({
  client: '',
  date: '',
  delivery: 0,
  discountPct: 0,
  depositPct: 50,
  validity: 7,
  items: [{ id: nextId(), source: 'calc', name: '', qty: yieldN, price: null }],
});

const emptyCalc = () => modelById('blank').build();
const EXAMPLE_MODEL = 'brigadeiro';

export function AppProvider({ children }) {
  const [calc, setCalc] = useState(() => modelById(EXAMPLE_MODEL).build());
  const [modelId, setModelId] = useState(EXAMPLE_MODEL);
  const [isExample, setIsExample] = useState(true);
  const [budget, setBudget] = useState(() => initialBudget(modelById(EXAMPLE_MODEL).build().yield));
  const [goal, setGoal] = useState({ kind: 'lucro', value: 2000, weeks: 4, days: 5 });
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const updateCalc = useCallback((patch) => {
    setIsExample(false);
    setCalc((c) => ({ ...c, ...(typeof patch === 'function' ? patch(c) : patch) }));
  }, []);

  const applyModel = useCallback((id) => {
    const m = modelById(id);
    const data = m.build();
    setCalc(data);
    setModelId(id);
    setIsExample(false);
    setBudget((b) => ({ ...b, items: b.items.map((it) => (it.source === 'calc' ? { ...it, price: null, qty: Math.max(1, data.yield) } : it)) }));
  }, []);

  const newCalculation = useCallback(() => {
    setCalc(emptyCalc());
    setModelId(null);
    setIsExample(false);
    setBudget(initialBudget(1));
  }, []);

  const notify = useCallback((type, text) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const value = useMemo(() => {
    const t = totals(calc);
    const model = modelById(modelId);
    return { calc, t, updateCalc, modelId, model, isExample, dismissExample: () => setIsExample(false), applyModel, newCalculation, budget, setBudget, goal, setGoal, toasts, notify };
  }, [calc, modelId, isExample, budget, goal, toasts, updateCalc, applyModel, newCalculation, notify]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
