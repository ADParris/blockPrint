// src/main.tsx (or src/index.tsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 🎯 Import the provider
import App from './App';
import './index.css';

// Filter out noisy, unfixable extension errors in Vite dev mode
if (import.meta.env.DEV) {
  const originalConsoleError = console.error;

  console.error = (...args) => {
    const errorMessage = args.map((arg) => arg?.toString() || '').join(' ');

    if (
      errorMessage.includes('A listener indicated an asynchronous response') ||
      errorMessage.includes(
        'message channel closed before a response was received',
      )
    ) {
      return;
    }

    originalConsoleError(...args);
  };

  // Catch the unhandled promise rejection variant specifically
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || '';
    if (
      msg.includes('A listener indicated an asynchronous response') ||
      msg.includes('message channel closed before a response was received')
    ) {
      event.preventDefault();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 🎯 Wrap the entire application so Router context is globally available */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
