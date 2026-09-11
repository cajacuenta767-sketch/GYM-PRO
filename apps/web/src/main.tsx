import React from 'react';
import ReactDOM from 'react-dom/client';
import { Providers } from '@/app/providers';
import { AppRouter } from '@/app/router';
import { applyTheme, useUiStore } from '@/stores/ui.store';
import '@/styles/globals.css';

applyTheme(useUiStore.getState().theme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <AppRouter />
    </Providers>
  </React.StrictMode>,
);
