# Rego dos Campos · web

Web de **Rego dos Campos**, finca de aguacates en Galicia.
La finca no vende aguacates: la web cuenta el día a día de la finca, explica el aguacate gallego y reúne un recetario.
Web estática de una sola página. Se sube tal cual a cualquier hosting: no necesita servidor, instalación ni compilación.

## Diseño

Sobrio y editorial, pensado como un cuaderno de campo:

- **Paleta** tomada del propio aguacate y del clima: fondo color niebla (*brétema*), tinta verde muy oscura como la piel del Hass, el marrón del hueso para los pequeños puntos de las etiquetas y el verde de la pulpa solo en la lámina del corte.
- **Modo oscuro** automático según el sistema del visitante, con los mismos tonos en versión noche.
- **Tipografías**: Spectral (titulares y textos largos) y Hanken Grotesk (texto de apoyo y etiquetas). Van dentro del proyecto, sin peticiones a Google Fonts.
- **Ilustraciones** de línea como láminas botánicas numeradas: el aguacate en su rama, el corte longitudinal con sus partes, las dos variedades, la ladera con socalcos y el rego. Son SVG ligeros; el punteado de grabado y el paisaje se generan al cargar.
- **Rejilla de 12 columnas**: titulares y textos arrancan en la cuarta columna y dejan un margen amplio a la izquierda; sin etiquetas pequeñas sobre las secciones.
- **Marca**: junto al nombre, en la cabecera, va el árbol del logo de la finca redibujado en silueta limpia: copa ancha de pino piñonero, un piso más pequeño a la derecha y tronco alto y fino. El icono de la pestaña lo usa en crema sobre el verde oliva del logo.

## Animaciones

Discretas y de una sola vez. Nada secuestra el scroll ni se queda fijo en pantalla.

| Dónde | Qué pasa |
|---|---|
| Portada | El titular aparece línea a línea, la lámina del aguacate se dibuja trazo a trazo y el punteado aparece después |
| Titulares de sección | Suben línea a línea desde una máscara al entrar en pantalla |
| Textos y bloques | Suben unos píxeles y aparecen, con un pequeño escalonado en las listas |
| Láminas e iconos | Se dibujan al llegar; en el corte, después del trazo entran la pulpa, la piel, el hueso y las llamadas numeradas |
| La finca | Las curvas de nivel se trazan de izquierda a derecha y se pliegan en «V» donde las cruza el rego, como en un mapa. Aparecen los árboles, late un pequeño manantial y el rego baja la ladera ensanchándose. Después el agua sigue corriendo con destellos mientras la lámina está a la vista |
| Cifras y calendario | Los números cuentan hasta su valor y las barras de cosecha crecen mes a mes |
| Interacción | Botones que se rellenan, filas de recetas que se desplazan al pasar el ratón, acordeón de preguntas, ventana de receta y menú móvil con transición suave |

Con la opción del sistema "reducir movimiento" no hay ninguna animación y todo se ve desde el principio. Sin JavaScript también se ve todo el contenido salvo el recetario, y en móvil el botón de menú se cambia por un enlace al índice del pie.
Los bloques que aparecen al hacer scroll siguen disponibles para lectores de pantalla y teclado aunque aún no se hayan animado, y los textos en gallego van marcados como tales.

## Secciones

| Sección | Contenido |
|---|---|
| Portada | Titular, presentación, lámina del aguacate en su rama y cuatro datos rápidos (clima, variedades, temporada actual, cosecha) |
| O nome | Qué significa *rego* en gallego, con su entrada de diccionario |
| Anatomía | Lámina del aguacate abierto con piel, pulpa y hueso explicados |
| En cifras | Lluvia, meses en el árbol, kilómetros que no recorre y días de maduración |
| La finca | Clima, agua, suelo, viento, flores y trabajo a mano, con la ladera de socalcos y el rego dibujados |
| Aguacate de aquí | Reportaje con letra capital, cita destacada y ficha lateral |
| Del árbol al plato | Cinco pasos con iconos de línea |
| Variedades | Hass y Bacon con su lámina y su ficha |
| Temporada | Calendario de cosecha por variedad con el mes actual marcado y una frase calculada según el mes |
| Guía | Control de madurez y consejos para saber si un aguacate está en su punto |
| Recetario | 13 recetas con filtros, buscador por ingrediente y ficha completa en ventana |
| Nutrición | Tres ideas clave y etiqueta nutricional por 100 g (USDA FoodData Central) |
| Pequeno dicionario | Ocho palabras gallegas del campo (*brétema*, *orballo*, *chuvia*, *leira*, *enxerto*, *colleita*, *sachar* y *socalco*) |
| Síguenos | Enlaces a TikTok e Instagram |
| Preguntas | Ocho preguntas frecuentes, incluida la aclaración de que la finca no vende |

## Tecnología

| Pieza | Uso |
|---|---|
| [GSAP 3.15](https://gsap.com) + ScrollTrigger, SplitText y DrawSVG | Animaciones de entrada, titulares por líneas y trazos que se dibujan |
| HTML, CSS y JavaScript sin dependencias de compilación | Todo lo demás |

GSAP y sus plugins van en `assets/vendor/` y son gratuitos para uso comercial. Licencias de librerías y tipografías en `assets/vendor/LICENSES.md`.

## Cambiar redes y temporada

Todo está en `assets/js/config.js`:

```js
window.REGO_CONFIG = {
  tiktok: 'regodoscampos2',
  instagram: 'regodoscampos',
  tiktokVideos: [],             // enlaces de vídeos para incrustar
  temporada: { Hass: [12, 1, 2, 3, 4, 5], Bacon: [10, 11, 12, 1] }
};
```

- Si se añaden enlaces en `tiktokVideos`, la web los incrusta debajo de los enlaces de Síguenos.
- `temporada` admite cualquier variedad y cualquier lista de meses. El calendario, la frase de temporada, el dato "Ahora" de la portada y las fichas de variedades se actualizan solos.

## Añadir o cambiar recetas

Las recetas están en `assets/js/recetas.js`. Cada receta es un bloque con categoría, título, tiempo, raciones, dificultad, variedad, ingredientes, pasos y un consejo. Para añadir una, se copia un bloque, se cambia el `id` y se rellenan los campos. Los filtros y la ficha se actualizan solos.

Las categorías disponibles son Desayunos, Para picar, Entrantes, Principales y Postres. Si se usa una nueva, aparece sola como filtro.
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
- Con dominio propio, poner la URL completa en `og:image` y añadir `og:url` en `index.html`.

## Pendiente de confirmar con la finca

Desde el entorno de trabajo no se pudo abrir TikTok ni Instagram, así que estos puntos se redactaron con información general sobre el aguacate gallego y deben revisarse:

1. **Variedades y meses de cosecha.** El calendario usa Hass y Bacon con fechas orientativas.
2. **Afirmaciones sobre la forma de trabajar**: recogida a mano, riego solo en verano, plantones injertados y cosecha decidida mirando el árbol.
3. **Recetas**: son propuestas de la web; conviene revisarlas o sustituirlas por las que la finca enseñe en sus vídeos.

## Estructura

```
index.html              Página (incluye las láminas SVG)
assets/css/styles.css   Estilos, paleta, tipografías y modo oscuro
assets/js/config.js     Redes y temporada
assets/js/recetas.js    Recetario
assets/js/main.js       Interacción, punteado, paisaje y animaciones
assets/fonts/           Spectral y Hanken Grotesk (WOFF2) con sus licencias
assets/vendor/          GSAP y plugins
assets/img/             Favicon e imagen para redes
```

La versión anterior, con el aguacate 3D, queda guardada en el historial de git (commit «Escena 3D: última versión de la apertura antes de retirarla»).
