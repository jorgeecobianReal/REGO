# Rego dos Campos · web

Web de **Rego dos Campos**, finca de aguacates en Galicia.
Web estática de una sola página. Se sube tal cual a cualquier hosting: no necesita servidor ni instalación.

## Qué tiene

| Sección | Qué hace |
|---|---|
| Hero | Aguacate en 3D real (WebGL) con piel rugosa de Hass, hojas, lluvia y reacción al ratón. Titular editorial con cursiva. |
| Ábrelo | Al hacer scroll el aguacate se parte en dos mitades y aparecen pulpa, hueso y sus explicaciones. |
| O nome | Qué significa *rego* en gallego. Un trazo de agua se dibuja al llegar y el texto se ilumina palabra a palabra. |
| La finca | Paisaje gallego generado en tiempo real: colinas, hileras de árboles en terrazas, bruma, lluvia y un *rego* que serpentea en primer plano. |
| Proceso | Cinco pasos del árbol a la mesa en recorrido horizontal, con iconos que se dibujan solos. |
| Temporada | Calendario de cosecha por variedad con el mes actual marcado y una frase calculada según el mes ("Ahora mismo es temporada de…" o "La próxima cosecha empieza en…"). |
| Guía | Control interactivo de madurez y consejos para saber si un aguacate está en su punto. |
| Síguenos | Usuario de TikTok a gran tamaño, botones y tres tarjetas con los lemas de la finca. |
| Pedidos | Formulario que prepara el mensaje del pedido para WhatsApp, email o mensaje directo. En móvil, un botón fijo "Pedir aguacates" acompaña durante el scroll. |
| Pie | Logotipo grande animado y enlaces. |

El fondo cambia de tono por secciones al hacer scroll: noche, musgo y crema.

## Tecnología

| Pieza | Uso |
|---|---|
| [three.js 0.186](https://threejs.org) | Aguacate 3D generado por código: geometría por revolución, piel con relieve procedural, pulpa, hueso, hojas y lluvia |
| [GSAP 3.15](https://gsap.com) + ScrollTrigger, SplitText, DrawSVG | Historia de scroll, titulares por líneas, recorrido horizontal, trazos que se dibujan |
| [Lenis 1.3](https://lenis.darkroom.engineering) | Scroll suave sincronizado con ScrollTrigger |
| Canvas 2D | Paisaje y lluvia de la sección La finca |

Todas las librerías van dentro del proyecto, sin CDN. GSAP y sus plugins son gratuitos para uso comercial desde la 3.13. Licencias en `assets/vendor/LICENSES.md`.

Si el navegador no tiene WebGL, el hero muestra dos imágenes del mismo aguacate (`assets/img/avocado-closed.webp` y `avocado-open.webp`, unos 45 KB cada una). Solo se descargan cuando hacen falta.
Con la opción del sistema "reducir movimiento" no hay scroll suave ni animaciones, el aguacate queda quieto y "Ábrelo" se muestra como sección estática.
El 3D baja su resolución solo si el dispositivo no llega a buen ritmo, y se pausa cuando sale de pantalla.

## Cambiar datos de contacto, redes y temporada

Todo está en `assets/js/config.js`:

```js
window.REGO_CONFIG = {
  tiktok: 'regodoscampos2',
  instagram: 'regodoscampos',   // confirmar
  whatsapp: '',                 // ej. '34600111222'
  email: '',                    // ej. 'pedidos@regodoscampos.com'
  tiktokVideos: [],             // enlaces de vídeos para incrustar
  temporada: { Hass: [12, 1, 2, 3, 4, 5], Bacon: [10, 11, 12, 1] }
};
```

- Si se rellena `whatsapp` o `email`, aparecen en la sección de pedidos y en el formulario.
- Si se añaden enlaces en `tiktokVideos`, la web los incrusta debajo del bloque de TikTok.
- `temporada` admite cualquier variedad y cualquier lista de meses.

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
2. **WhatsApp y email de pedidos.** Están vacíos.
3. **Variedades y meses de cosecha.** El calendario usa Hass y Bacon con fechas orientativas.
4. **Afirmaciones sobre la forma de trabajar**: recogida a mano, riego solo en verano, plantones injertados y cosecha cercana al pedido.
5. **Cantidades del formulario**: 2, 5 y 10 kg y hostelería.
6. **Fotos reales.** Las tarjetas de la sección Síguenos admiten fotos de fondo de la finca si se quiere.

## Estructura

```
index.html              Página
assets/css/styles.css   Estilos, paleta y tipografías
assets/js/config.js     Datos editables
assets/js/main.js       Interacción, scroll y animaciones
assets/js/scene.js      Escena 3D compilada
src/scene.js            Escena 3D (fuente)
assets/vendor/          GSAP, plugins y Lenis
assets/img/             Favicon, imágenes de respaldo del aguacate (WebP) e imagen para redes
```

Tipografías de Google Fonts: Instrument Serif para titulares, Instrument Sans para texto y DM Mono para etiquetas.
