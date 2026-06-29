import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress React DevTools suggestion message in browser console
try {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('__suggest_react_devtools__', 'false');
  }
} catch (e) {}

// Silence specific Recharts warnings about width/height being 0
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('The width(0) and height(0) of chart should be greater than 0') ||
     args[0].includes('should be greater than 0, please check the style of container'))
  ) {
    return;
  }
  originalWarn(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
