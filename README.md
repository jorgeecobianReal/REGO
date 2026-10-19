# Rego dos Campos · web

Web de **Rego dos Campos**, finca de aguacates en Galicia.
La finca no vende aguacates: la web cuenta el día a día de la finca, explica el aguacate gallego y reúne un recetario.
Web estática de una sola página. Se sube tal cual a cualquier hosting: no necesita servidor ni instalación.

## Qué tiene

| Sección | Qué hace |
|---|---|
| Hero | Aguacate 3D real (modelo GLB hiperrealista) con hojas, lluvia y reacción al ratón. Titular editorial con cursiva. |
| Ábrelo | Al hacer scroll el aguacate entero se funde con el modelo partido: las dos mitades reales giran y se abren hasta mostrar el hueso y el hueco con sus fibras. |
| O nome | Qué significa *rego* en gallego. Un trazo de agua se dibuja al llegar y el texto se ilumina palabra a palabra. |
| En cifras | Cuatro datos con contador animado: lluvia, meses en el árbol, kilómetros que no recorre y días de maduración. |
| La finca | Paisaje gallego generado en tiempo real: colinas, hileras de árboles en terrazas, bruma, lluvia y un *rego* que serpentea en primer plano. |
| Aguacate de aquí | Reportaje con letra capital, cita destacada y ficha lateral fija sobre el aguacate en Galicia. |
| Proceso | Cinco pasos del árbol a la mesa en recorrido horizontal, con iconos que se dibujan solos. |
| Variedades | Fichas de Hass y Bacon con fotos de producto renderizadas desde el 3D, que se inclinan con el ratón. |
| Temporada | Calendario de cosecha por variedad con el mes actual marcado y una frase calculada según el mes ("Ahora mismo es temporada de…" o "La próxima cosecha empieza en…"). |
| Guía | Control interactivo de madurez y consejos para saber si un aguacate está en su punto. |
| Recetario | 13 recetas con filtros por categoría, buscador por ingrediente y ficha completa en ventana, con ingredientes que se pueden marcar y paso a la receta anterior o siguiente. |
| Nutrición | Etiqueta nutricional por 100 g con datos de USDA FoodData Central y tres ideas clave. |
| Pequeno dicionario | Ocho palabras gallegas del campo con su definición y traducción. |
| Síguenos | Usuario de TikTok a gran tamaño, botones y tres tarjetas con los lemas de la finca. |
| Preguntas | Ocho preguntas frecuentes sobre el aguacate, incluida la aclaración de que la finca no vende. |
| Pie | Logotipo grande animado y enlaces. |

El fondo alterna con suavidad entre dos verdes muy oscuros, noche y musgo, sin saltos bruscos de color.
En pantallas grandes, un índice de capítulos fijo a la derecha marca la sección actual y permite saltar a cualquier parte.
La temporada del calendario, el texto del hero y las fichas de variedades se calculan desde `config.js` y el mes actual.

## Tecnología

| Pieza | Uso |
|---|---|
| [three.js 0.186](https://threejs.org) | Escena 3D: carga los modelos GLB (GLTFLoader con descompresión meshopt), luces, lluvia y la apertura del aguacate |
| [GSAP 3.15](https://gsap.com) + ScrollTrigger, SplitText, DrawSVG | Historia de scroll, titulares por líneas, recorrido horizontal, trazos que se dibujan |
| [Lenis 1.3](https://lenis.darkroom.engineering) | Scroll suave sincronizado con ScrollTrigger |
| Canvas 2D | Paisaje y lluvia de la sección La finca |

Todas las librerías van dentro del proyecto, sin CDN. GSAP y sus plugins son gratuitos para uso comercial desde la 3.13. Licencias en `assets/vendor/LICENSES.md`.

Si el navegador no tiene WebGL, el hero muestra dos imágenes renderizadas desde los modelos (`assets/img/avocado-closed.webp` y `avocado-open.webp`, unos 45 KB cada una). Solo se descargan cuando hacen falta. Las fotos de las variedades y la imagen para redes salen también de los modelos.
Con la opción del sistema "reducir movimiento" no hay scroll suave ni animaciones, el aguacate queda quieto y "Ábrelo" se muestra como sección estática.
El 3D baja su resolución solo si el dispositivo no llega a buen ritmo, y se pausa cuando sale de pantalla.

## Modelos 3D

| Archivo | Contenido | Peso |
|---|---|---|
| `assets/models/aguacate.glb` | Aguacate entero con tallo y dos hojas | 1,5 MB |
| `assets/models/aguacate-partido.glb` | Las dos mitades: pulpa, hueso, hueco con fibras y borde de piel | 1,7 MB |

Los originales pesaban 15,8 MB y 17,5 MB. Se optimizaron con los scripts de `tools/`: malla simplificada, normales suaves sin costuras, materiales sin metal para tallo y nervios, texturas WebP y geometría comprimida con meshopt.
El modelo entero se carga primero; el partido se descarga en segundo plano. Mientras llega, la apertura corta el modelo entero en dos con planos de recorte y dibuja la pulpa con la forma real de la sección. Si WebGL no está disponible o los modelos fallan, la web usa el aguacate generado por código.

Para regenerar los modelos desde los originales, se copian a una carpeta `originales/` (no se sube al repositorio) y se ejecuta:

```bash
npm install
npm run build:modelo-entero
npm run build:modelo-partido
```

La textura trasera del modelo entero tiene una costura. Por eso el aguacate de la portada se balancea solo por su cara buena.

## Cambiar datos de contacto, redes y temporada

Todo está en `assets/js/config.js`:

```js
window.REGO_CONFIG = {
  tiktok: 'regodoscampos2',
  instagram: 'regodoscampos',   // confirmar
  tiktokVideos: [],             // enlaces de vídeos para incrustar
  temporada: { Hass: [12, 1, 2, 3, 4, 5], Bacon: [10, 11, 12, 1] }
};
```

- Si se añaden enlaces en `tiktokVideos`, la web los incrusta debajo del bloque de TikTok.
- `temporada` admite cualquier variedad y cualquier lista de meses.

## Añadir o cambiar recetas

Las recetas están en `assets/js/recetas.js`. Cada receta es un bloque con categoría, título, tiempo, raciones, dificultad, variedad, ingredientes, pasos y un consejo. Para añadir una, se copia un bloque, se cambia el `id` y se rellenan los campos. Los filtros, el contador y la ficha se actualizan solos.

Las categorías disponibles son Desayunos, Para picar, Entrantes, Principales y Postres. Si se usa una nueva, aparece sola como filtro.
Las recetas se publican también como datos estructurados de Google (schema.org Recipe), lo que ayuda a que aparezcan en búsquedas.

## Verla en local

```bash
python3 -m http.server 8000
# y abrir http://localhost:8000
```

Abrir `index.html` directamente desde el disco también funciona.

## Tocar la escena 3D

La escena está escrita en `src/scene.js` y se compila a `assets/js/scene.js` con esbuild. Solo hace falta si se cambia algo del 3D:

```bash
npm install
npm run build:scene
```

Para regenerar las imágenes de respaldo del aguacate y la imagen para redes, cualquier navegador sirve: la escena expone `window.REGO_SCENE` con `setProgress`, `setCentered`, `setRain`, `setPose` y `render`, y el canvas se puede exportar con `toDataURL`.

## Publicar

- **GitHub Pages**: *Settings → Pages → Deploy from a branch*, rama `main`, carpeta `/ (root)`.
- **Netlify o Vercel**: arrastrar la carpeta del proyecto, sin configuración de build.
- Con dominio propio, poner la URL completa en `og:image` y añadir `og:url` en `index.html`.

## Pendiente de confirmar con la finca

Desde el entorno de trabajo no se pudo abrir TikTok ni Instagram, así que estos puntos se redactaron con información general sobre el aguacate gallego y deben revisarse:

1. **Usuario de Instagram.** Está puesto `@regodoscampos`, sin verificar.
3. **Variedades y meses de cosecha.** El calendario usa Hass y Bacon con fechas orientativas.
4. **Afirmaciones sobre la forma de trabajar**: recogida a mano, riego solo en verano, plantones injertados y cosecha decidida mirando el árbol.
5. **Recetas**: son propuestas de la web; conviene revisarlas o sustituirlas por las que la finca enseñe en sus vídeos.
6. **Fotos reales.** Las tarjetas de la sección Síguenos admiten fotos de fondo de la finca si se quiere.

## Estructura

```
index.html              Página
assets/css/styles.css   Estilos, paleta y tipografías
assets/js/config.js     Redes y temporada
assets/js/recetas.js    Recetario
assets/js/main.js       Interacción, scroll y animaciones
assets/js/scene.js      Escena 3D compilada
src/scene.js            Escena 3D (fuente)
assets/models/          Modelos GLB optimizados
tools/                  Scripts de optimización de los modelos
assets/vendor/          GSAP, plugins y Lenis
assets/img/             Favicon, imágenes de respaldo del aguacate (WebP) e imagen para redes
```

Tipografías de Google Fonts: Instrument Serif para titulares, Instrument Sans para texto y DM Mono para etiquetas.
