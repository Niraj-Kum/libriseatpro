
import React from 'react';

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const SLATE_PALETTE = {
  primary: '#4f46e5', // indigo-600
  sidebar: '#0f172a', // slate-900
  accent: '#6366f1',  // indigo-500
  background: '#f8fafc' // slate-50
};
