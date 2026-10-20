import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import './index.css';
import App from './App';
import { ConfigProvider } from './context/ConfigContext';
import { LibretasProvider } from './context/LibretasContext';
import { NotificacionesProvider } from './context/NotificacionesContext';
import { SinConexion } from './components/SinConexion';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider>
      <LibretasProvider>
        <NotificacionesProvider>
          <SinConexion />
          <App />
        </NotificacionesProvider>
      </LibretasProvider>
    </ConfigProvider>
  </React.StrictMode>,
);
