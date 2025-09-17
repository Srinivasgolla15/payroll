import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ThemeProvider } from './src/contexts/ThemeContext';
import './src/index.css';

// Initialize theme before React renders
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Apply theme class to HTML element
const applyTheme = (theme: string) => {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
};

// Check for saved theme or system preference
const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
applyTheme(initialTheme);

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!savedTheme) { // Only change if user hasn't set a preference
    applyTheme(e.matches ? 'dark' : 'light');
  }
});

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);