# Rego dos Campos · web

Web de **Rego dos Campos**, finca de aguacates en Galicia.
La finca no vende aguacates: la web cuenta el día a día de la finca, explica el aguacate gallego y reúne un recetario.
Web estática de una sola página. Para publicarla se sube tal cual a cualquier hosting: no necesita servidor, instalación ni compilación. Para cambiar textos o láminas, ver [Cómo se genera index.html](#cómo-se-genera-indexhtml).

## Diseño

Sobrio y editorial, pensado como un cuaderno de campo:

- **Paleta** tomada del propio aguacate y del clima: fondo color niebla (*brétema*), tinta verde muy oscura como la piel del Hass, el agua del rego en verde azulado, el marrón del hueso para el punto del mes actual del calendario y el verde de la pulpa solo en la lámina del corte.
- **Modo oscuro** automático según el sistema del visitante, con los mismos tonos en versión noche.
- **Tipografías**: Spectral (titulares y textos largos) y Hanken Grotesk (texto de apoyo y rótulos de datos). Van dentro del proyecto, sin peticiones a Google Fonts.
- **Ilustraciones** de línea como láminas botánicas numeradas: el aguacate en su rama, la ladera con socalcos y el rego, el corte longitudinal con sus partes y las dos variedades. Son SVG ligeros; el punteado de grabado y el paisaje se generan al cargar.
- **Postales con fotos de la finca**: nueve postales rectangulares con borde de papel y sombra suave, rectas o un poco giradas, colocadas en los huecos de la izquierda de las secciones y en Síguenos. Cada una lleva una foto de la finca y un pie corto en gallego; al bajar se posan con un pequeño giro.
- **Rejilla de 12 columnas**: titulares y textos arrancan en la cuarta columna y dejan un margen amplio a la izquierda. Sin etiquetas pequeñas en mayúsculas sobre las secciones ni sobre los títulos; solo quedan en mayúsculas los rótulos de datos (clima, cifras, meses, número de lámina).
- **Marca**: junto al nombre, en la cabecera, va el árbol del logo de la finca redibujado en silueta limpia: copa ancha de pino piñonero, un piso más pequeño a la derecha y tronco alto y fino. El icono de la pestaña lo usa en crema sobre el verde oliva del logo.

## Animaciones

Discretas. Las entradas ocurren una sola vez; el viento de la portada, el agua de los regos y las hojas que bajan flotando se mueven en bucle suave, solo mientras están a la vista. Nada secuestra el scroll ni se queda fijo en pantalla.

| Dónde | Qué pasa |
|---|---|
| Portada | El titular aparece línea a línea, la lámina del aguacate se dibuja trazo a trazo y el punteado aparece después; luego la rama se mece como con viento, y el fruto y las hojas responden al pasar el ratón |
| O nome | Sobre la definición, un regato con poldras se dibuja de orilla a orilla, el agua llena el cauce y bajan dos hojas flotando |
| Titulares de sección | Suben línea a línea desde una máscara al entrar en pantalla |
| Textos y bloques | Suben unos píxeles y aparecen, con un pequeño escalonado en las listas |
| Láminas e iconos | Se dibujan al llegar; en el corte, después del trazo entran la pulpa, la piel, el hueso y las llamadas numeradas |
| La finca | Las curvas de nivel se trazan de izquierda a derecha y se pliegan en «V» donde las cruza el rego, como en un mapa. Brotan los aguacateros a los dos lados, del agua hacia fuera, late un pequeño manantial y el rego baja la ladera ensanchándose. Después el agua sigue corriendo con destellos mientras la lámina está a la vista |
| Postales | Se posan girando un poco, como al dejarlas sobre la mesa |
| Cifras y calendario | Los números cuentan hasta su valor y las barras de cosecha crecen mes a mes |
| Interacción | Botones que se rellenan, filas de recetas que se desplazan al pasar el ratón, acordeón de preguntas, ventana de receta y menú móvil con transición suave |

- Bajo la lámina de la portada hay un botón **Pausar movimiento** que para el viento, el agua y las hojas en toda la página. La elección se recuerda en ese navegador.
- Con la opción del sistema «reducir movimiento» no hay ninguna animación y todo se ve desde el principio.
- Lo que queda lejos de la primera pantalla se prepara al acercarse o en los ratos libres del navegador, para que la portada aparezca antes en móviles.
- Sin JavaScript se ve todo el contenido salvo el recetario, el calendario (queda la frase de temporada) y la lámina de la finca; en móvil el botón de menú se cambia por un enlace al índice del pie.
- Los bloques que aparecen al hacer scroll siguen disponibles para lectores de pantalla y teclado aunque aún no se hayan animado, y los textos en gallego van marcados como tales.
- Al imprimir, todo sale en su estado final. Con una receta abierta, se imprime solo la receta.

## Secciones

| Sección | Contenido |
|---|---|
| Portada | Titular, presentación, enlaces al recetario y a Instagram, lámina del aguacate en su rama y cuatro datos rápidos (clima, variedades, temporada actual, cosecha) |
| O nome | Qué significa *rego* en gallego, con el regato dibujado, su entrada de diccionario y la foto del cartel de la finca |
| La finca | Clima, agua, suelo, viento, flores y trabajo a mano, con la ladera de socalcos y el rego dibujados (Lám. II) |
| Aguacate de aquí | Reportaje con letra capital, cita destacada, dos postales y ficha lateral |
| En cifras | Lluvia, años hasta la primera cosecha, flores que llegan a fruto, meses en el árbol, días de maduración y kilómetros que no recorre |
| Cinco pasos | Plantar, crecer, esperar, cosechar y madurar, con iconos de línea |
| Por dentro | Lámina del aguacate abierto (Lám. III) con piel, pulpa y hueso explicados |
| Variedades | Hass y Bacon con su lámina (Lám. IV y V) y su ficha, y dos notas sobre la flor y otras variedades |
| Temporada | Calendario de cosecha por variedad con el mes actual marcado, una frase calculada según el mes y tres datos sobre la cosecha |
| Guía | Control de madurez y consejos para saber si un aguacate está en su punto y cómo abrirlo |
| Recetario | 13 recetas con filtros, buscador por ingrediente y ficha completa en ventana; cada receta tiene su enlace |
| Nutrición | Cinco ideas clave y etiqueta nutricional por 100 g (USDA FoodData Central) |
| Pequeno dicionario | Doce palabras gallegas del campo (*socalco*, *brétema*, *orballo*, *chuvia*, *leira*, *enxerto*, *colleita*, *sachar*, *eido*, *lentura*, *esterco* y *xeada*) |
| Síguenos | Enlaces a Instagram (la cuenta principal, más destacada) y TikTok, con tres fotos de la finca en postales |
| Preguntas | Doce preguntas frecuentes, empezando por la aclaración de que la finca no vende |

## Tecnología

| Pieza | Uso |
|---|---|
| [GSAP 3.15](https://gsap.com) + ScrollTrigger, SplitText y DrawSVG | Animaciones de entrada, titulares por líneas y trazos que se dibujan |
| HTML, CSS y JavaScript sin dependencias | Todo lo demás |
| Python 3 (solo para editar) | Generar `index.html` desde la plantilla de `tools/` |

GSAP y sus plugins van en `assets/vendor/` y son gratuitos para uso comercial. Licencias de librerías y tipografías en `assets/vendor/LICENSES.md`.

## Cómo se genera index.html

`index.html` se genera: no se edita a mano, porque el siguiente build lo sobrescribe.

- Los textos y la estructura están en `tools/index.tpl`. Las láminas aparecen ahí como marcadores (`{{HERO}}`, `{{PC_REGO}}`…).
- Las láminas salen de tres generadores: `tools/art.py` (aguacate, corte, variedades y guía), `tools/rego_band.py` (el regato de O nome) y `tools/pc_art.py` (dibujos de relleno para postales sin foto). Cada uno escribe su `.json` en `tools/`.

```bash
python3 tools/build.py              # tras cambiar textos en tools/index.tpl
python3 tools/rego_band.py && python3 tools/build.py   # tras cambiar una lámina
```

Solo usa la biblioteca estándar de Python. La imagen para redes (`assets/img/og-image.png`) sale de `tools/og.html` con `tools/og.js` (Playwright).

## Cambiar redes y temporada

Todo está en `assets/js/config.js`:

```js
window.REGO_CONFIG = {
  tiktok: 'regodoscampos2',
  instagram: 'regodoscampos',
  tiktokVideos: [],             // enlaces de vídeos para incrustar
  fotos: { cartel: '', ... },   // cambiar fotos de las postales (ver abajo)
  temporada: { Hass: [12, 1, 2, 3, 4, 5], Bacon: [10, 11, 12, 1] }
};
```

- Si se añaden enlaces en `tiktokVideos`, la web los incrusta debajo de los enlaces de Síguenos.
- `temporada` admite cualquier variedad y cualquier lista de meses. El calendario, la frase de temporada, el dato «Ahora» de la portada y las fichas de variedades se actualizan solos.
- Si `config.js` tiene un error (una coma o unas comillas de menos), la web no se rompe: el calendario se oculta, quedan los textos de temporada escritos en la página y la consola del navegador avisa.

## Fotos de las postales

Las nueve postales llevan fotos de la finca, recortadas al formato de cada una y guardadas en WebP en `assets/img/fotos/` (de 30 a 120 KB cada una; se cargan al acercarse).

| Archivo | Clave en `config.js` | Dónde | Pie | Formato |
|---|---|---|---|---|
| `cartel.webp` | `cartel` | O nome | *O noso nome* | Apaisada |
| `balsa.webp` | `balsa` | La finca | *A balsa* | Vertical |
| `colleita.webp` | `colleita` | Aguacate de aquí | *Antes da colleita* | Vertical |
| `flor.webp` | `flor` | Aguacate de aquí | *En flor* | Apaisada |
| `punto.webp` | `punto` | Guía | *Aínda na póla* | Vertical |
| `cocina.webp` | `cocina` | Recetario | *Da póla á cociña* | Apaisada |
| `orballo.webp` | `orballo` | Síguenos | *Orballo na finca* | Apaisada |
| `campos.webp` | `campos` | Síguenos | *Os nosos campos* | Apaisada |
| `aguacateiros.webp` | `aguacateiro` | Síguenos | *Os aguacateiros* | Apaisada |

Para cambiar una foto:

- **Lo más sencillo**: sustituir el archivo por otro con el mismo nombre (mejor ya recortado: 800 × 600 px las apaisadas, 600 × 750 px las verticales).
- **O bien**, en `assets/js/config.js`, escribir la ruta de la nueva en su clave: `orballo: 'assets/img/fotos/lluvia.jpg'` o `{ src: '…', alt: 'descripción' }`. Si la ruta falla, vuelve la foto anterior.
- El pie y la descripción para lectores de pantalla están en `tools/index.tpl`; si la foto nueva muestra otra cosa, conviene cambiarlos allí y volver a generar la página.

La foto se recorta sola para llenar la postal. Para una postal nueva sin foto, `tools/pc_art.py` genera dibujos de relleno del mismo estilo que las láminas (marcador `{{PC_<CLAVE>}}` en la plantilla).

## Añadir o cambiar recetas

Las recetas están en `assets/js/recetas.js`. Cada receta es un bloque con categoría, título, tiempo, raciones, dificultad, variedad, ingredientes, pasos y un consejo. Para añadir una, se copia un bloque, se cambia el `id` y se rellenan los campos. Los filtros y la ficha se actualizan solos. Si a una receta le falta el título, la categoría, los ingredientes o los pasos, se omite y la consola del navegador lo avisa; el resto del recetario sigue funcionando.

Las categorías disponibles son Desayunos, Para picar, Entrantes, Principales y Postres. Si se usa una nueva, aparece sola como filtro.

Cada receta se puede enlazar directamente (por ejemplo, desde la bio o una historia de Instagram) con `#receta-` más su `id`: `…/#receta-guacamole`, `…/#receta-pulpo`. Con una receta abierta, el botón Atrás del móvil la cierra.

Las recetas no se publican como datos estructurados de Google: para salir como ficha de receta Google exige una foto de cada plato. Cuando haya fotos reales, se pueden añadir.

## Verla en local

```bash
python3 -m http.server 8000
# y abrir http://localhost:8000
```

Abrir `index.html` directamente desde el disco también funciona.

## Publicar

- **GitHub Pages**: *Settings → Pages → Deploy from a branch*, rama `main`, carpeta `/ (root)`.
- **Netlify o Vercel**: arrastrar la carpeta del proyecto, sin configuración de build.
- En cuanto se conozca la dirección pública (también en GitHub Pages), escríbela en `SITE_URL`, al principio de `tools/build.py`, y vuelve a generar la página. Así se añaden la URL canónica, `og:url`, la imagen para redes con dirección completa (WhatsApp, LinkedIn o X no muestran la vista previa con rutas relativas) y la `url` de los datos estructurados.
- `robots.txt` deja fuera de los buscadores la carpeta `tools/`.

## Pendiente de confirmar con la finca

Desde el entorno de trabajo no se pudo abrir TikTok ni Instagram, así que estos puntos se redactaron con información general sobre el aguacate gallego y deben revisarse:

1. **Variedades y meses de cosecha.** El calendario usa Hass y Bacon con fechas orientativas.
2. **Afirmaciones sobre la forma de trabajar**: recogida a mano, riego solo en verano, plantones injertados y cosecha decidida mirando el árbol.
3. **Recetas**: son propuestas de la web; conviene revisarlas o sustituirlas por las que la finca enseñe en sus vídeos.
4. **Lo que se ve en las redes** (Síguenos y pie): la recogida a mano, cómo se decide la cosecha, los días de brétema y las recetas.

## Estructura

```
index.html              Página generada (incluye las láminas SVG)
tools/                  Plantilla, generadores de láminas e imagen para redes
assets/css/styles.css   Estilos, paleta, tipografías y modo oscuro
assets/js/config.js     Redes, cambios de fotos y temporada
assets/js/recetas.js    Recetario
assets/js/main.js       Interacción, punteado, paisaje y animaciones
assets/fonts/           Spectral y Hanken Grotesk (WOFF2) con sus licencias
assets/vendor/          GSAP y plugins
assets/img/             Favicon e imagen para redes
assets/img/fotos/       Fotos de las postales
```

La versión anterior, con el aguacate 3D, queda guardada en el historial de git (commit «Escena 3D: última versión de la apertura antes de retirarla»).
