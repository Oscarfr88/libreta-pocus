import { useRuta } from './hooks/useRuta';
import { InicioView } from './components/inicio/InicioView';
import { NuevaLibretaView } from './components/inicio/NuevaLibretaView';
import { LibretaView } from './components/libreta/LibretaView';
import { AjustesView } from './components/ajustes/AjustesView';
import { PresentarView } from './components/revision/PresentarView';

export default function App() {
  const [ruta, navegar] = useRuta();

  switch (ruta.nombre) {
    case 'nueva':
      return <NuevaLibretaView navegar={navegar} />;
    case 'libreta':
      return <LibretaView id={ruta.id} navegar={navegar} />;
    case 'presentar':
      return <PresentarView id={ruta.id} navegar={navegar} />;
    case 'ajustes':
      return <AjustesView seccion={ruta.seccion} navegar={navegar} />;
    case 'inicio':
      return <InicioView navegar={navegar} />;
  }
}
