import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useNotificar } from '../context/NotificacionesContext';

/**
 * Registra el service worker (la app queda guardada para usarse sin conexión y se actualiza sola)
 * y pide al navegador que no borre los datos del dispositivo por falta de espacio.
 */
export function SinConexion() {
  const notificar = useNotificar();
  useEffect(() => {
    registerSW({
      immediate: true,
      onOfflineReady: () => notificar('La app quedó lista para usarse sin conexión.'),
    });
    navigator.storage?.persist?.().catch(() => {});
  }, [notificar]);
  return null;
}
