import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

import { ThemeProvider } from './components/ThemeProvider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <ThemeProvider defaultTheme="dark" storageKey="arialui-theme">
      <App />
    </ThemeProvider>
);
