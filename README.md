# Libreta digital de competencias POCUS

App web instalable (PWA) en la que los alumnos de los cursos de ultrasonografía clínica (POCUS I, II y III) registran las fechas de sus prácticas supervisadas. Al terminar, un instructor valida la libreta con su firma. Es la versión digital de la libreta en papel.

- Funciona en el celular y en la computadora. Una vez instalada, anda sin conexión.
- Todo se guarda **en el dispositivo**: no hay servidor ni cuentas de usuario.
- Solo se registran datos del alumno y del instructor. **No se cargan datos de pacientes.**

---

## Para el alumno

1. Abrí la app y, si la coordinación te pasó un **archivo de configuración** (`.json`), importalo en **Ajustes → Archivo de configuración**. Ese archivo trae el logo, los cursos y la lista de instructores.
2. Tocá **Nueva libreta**, elegí tu curso y completá nombre, apellido y año. Podés tener varias libretas en el mismo dispositivo (por ejemplo, POCUS I terminada y POCUS II en curso).
3. En cada competencia tocá **Práctica 1, 2 y 3** para cargar la fecha de cada práctica supervisada.
   - No se aceptan fechas futuras.
   - Si una práctica tiene una fecha anterior a la de otra previa, la app te avisa, pero no lo impide.
   - Usá el buscador y el filtro **Solo pendientes** para encontrar lo que te falta.
4. Todo se guarda solo. Igualmente, de vez en cuando hacé un respaldo con **⋮ → Exportar respaldo** y guardá el archivo `.json` en un lugar seguro. Para pasar la libreta a otro dispositivo, usá **Importar respaldo** en la pantalla de inicio.
5. Cuando completes todo, tocá **Presentar al instructor** y entregale el teléfono.
6. Con **PDF** descargás la libreta en cualquier momento. Si todavía no está validada, sale marcada como *EN CURSO*.

> **Recomendación:** instalá la app en la pantalla de inicio del teléfono (en Safari: Compartir → *Agregar a inicio*; en Chrome: menú → *Instalar app*). Algunos navegadores borran los datos de las páginas web que no se usan durante un tiempo; las apps instaladas están protegidas.

## Para el instructor

1. El alumno te muestra la pantalla **Presentación al instructor**: arriba ves el resumen por bloque, y tocando cada bloque ves las fechas. Si hace falta, podés **corregir fechas** ahí mismo.
2. La firma se habilita solo cuando **todas las competencias tienen sus 3 prácticas**.
3. Elegí tu nombre en la lista, firmá en el recuadro con el dedo o el mouse (**Borrar** si querés repetirla) y tocá **Confirmar y firmar**.
4. La libreta queda **validada y bloqueada** (solo lectura). Se registran tu nombre, tu firma y la fecha.
5. Si hay que corregir algo después, usá **Reabrir libreta**. Hay que confirmarlo explícitamente, porque **se borra la firma** y hay que volver a firmar.

Si tu nombre no aparece en la lista, la coordinación tiene que cargarlo (ver abajo).

## Para la coordinación del curso

Todo se configura en **Ajustes** (ícono de engranaje en la pantalla de inicio).

### Membrete y textos
- **Membrete**: logo (PNG o JPG; se recomienda PNG con fondo transparente), nombre de la institución, subtítulo, color principal y pie de página. Se usan en la app y en el PDF. La app no trae ningún logo por defecto.
- **Textos**: instrucciones (aparecen en el PDF) y texto de la validación final. En este último, `{curso}` se reemplaza por el curso de cada libreta.

### Cursos y competencias
- Se pueden agregar, renombrar y eliminar cursos. Un curso **sin competencias cargadas** aparece deshabilitado y no permite crear libretas.
- POCUS I y POCUS II traen su catálogo precargado (transcripto de las libretas en papel). POCUS III se completa importando una planilla.
- **Formato de la planilla de competencias** (`.xlsx` o `.csv`): primera fila con los títulos **Bloque** y **Competencia**, y una fila por competencia, en el orden en que deben aparecer:

  | Bloque | Competencia |
  |---|---|
  | FÍSICA Y KNOBOLOGÍA | Cuidados del equipo |
  | FÍSICA Y KNOBOLOGÍA | Uso del modo M |
  | ULTRASONIDO PULMONAR | Protocolo BLUE |

  Si la celda del bloque queda vacía, se toma el bloque de la fila anterior (sirve para celdas combinadas). Antes de guardar se muestra una vista previa. En **Planilla modelo** se descarga una planilla vacía, y con el botón **Excel** de cada curso se exporta su lista actual para editarla.
- Las libretas ya creadas **conservan la lista de competencias con la que se crearon**: modificar o eliminar un curso no altera las libretas existentes.

### Instructores
- **Formato de la planilla de instructores** (`.xlsx` o `.csv`, con o sin fila de títulos). Sirve cualquiera de estas dos variantes:
  - una columna **Nombre y apellido**, o
  - dos columnas **Nombre** y **Apellido**.
- Se quitan los espacios sobrantes y los nombres repetidos, y la lista se ordena alfabéticamente. Se puede reemplazar la lista o agregar a la actual, y también agregar o quitar nombres a mano.
- Los `.csv` guardados desde Excel en español (separados por `;`) se leen sin problemas, con tildes y ñ.

### Distribuir la configuración a los alumnos
1. Configurá el membrete, los cursos y los instructores en tu dispositivo.
2. En **Ajustes → Archivo de configuración → Exportar configuración** se descarga un `.json`.
3. Compartí ese archivo con los alumnos (correo, WhatsApp, aula virtual). Cada alumno lo importa en **Ajustes → Archivo de configuración → Importar**. Importarlo reemplaza la configuración del dispositivo, pero **no modifica las libretas**.

---

## Desarrollo

Requiere Node 20 o superior.

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

- Stack: React 18 + TypeScript + Vite + Tailwind, `vite-plugin-pwa` (instalable y sin conexión), jsPDF + jspdf-autotable (PDF en el dispositivo) y SheetJS (planillas; se instala desde `cdn.sheetjs.com` porque el paquete `xlsx` de npm está desactualizado).
- **Catálogos precargados**: `src/data/catalogo-pocus-i.json` y `src/data/catalogo-pocus-ii.json`, editables. Los cursos y textos por defecto están en `src/data/configuracionInicial.ts`. Si un dispositivo tiene guardado un curso predefinido sin competencias, al abrir la app se completa con el catálogo precargado (nunca se pisa uno ya cargado).
- **Cantidad de prácticas por competencia**: constante `PRACTICAS_REQUERIDAS` en `src/config.ts` (hoy, 3). Cada libreta guarda la cantidad con la que se creó.
- **PDF de muestra** para revisar el diseño: `PDF_SALIDA=/carpeta/de/salida npx vitest run scripts/muestras-pdf.test.ts`.
- **Íconos**: se generan desde `src/assets/icon.svg` con `npm run icons`.
- Datos en el navegador (`localStorage`): `libreta-pocus:config:v1` (configuración) y `libreta-pocus:libretas:v1` (libretas).

## Despliegue en GitHub Pages

El repositorio incluye `.github/workflows/deploy.yml`, que en cada push a `main` corre las pruebas, compila y publica en GitHub Pages.

1. Creá el repositorio en GitHub y subí el código a la rama `main`. En el plan gratuito de GitHub, Pages requiere que el repositorio sea público.
2. En el repositorio, andá a **Settings → Pages → Build and deployment → Source** y elegí **GitHub Actions**.
3. Cada push a `main` publica la app en `https://<usuario>.github.io/libreta-pocus/`.

Si el repositorio tiene otro nombre, cambiá `base`, `scope`, `start_url` y `navigateFallback` en `vite.config.ts` para que coincidan con `/<nombre-del-repo>/`.
