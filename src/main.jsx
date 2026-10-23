import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './AppState.jsx';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
