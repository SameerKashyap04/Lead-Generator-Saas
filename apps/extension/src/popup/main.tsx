import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup';
import '@/styles/globals.css';

const root = document.getElementById('root');
if (root) {
  // Apply dark mode by default
  document.documentElement.classList.add('dark');
  createRoot(root).render(<Popup />);
}
