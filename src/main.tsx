import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { I18nProvider } from './lib/i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  // Permanently unregister any ghost service workers that were aggressively caching the old UI.
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(
        function(boolean) {
          console.log('Ghost cache cleared. SW unregistered.', boolean);
        }
      );
    }
  });
}
