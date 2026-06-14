import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@/styles/globals.css';

const root = document.getElementById('root');
if (root) {
  document.documentElement.classList.add('dark');
  createRoot(root).render(<App />);
}
