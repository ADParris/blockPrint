// src/main.tsx (or src/index.tsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 🎯 Import the provider
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 🎯 Wrap the entire application so Router context is globally available */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
