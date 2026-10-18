# Rego dos Campos · web

Web de **Rego dos Campos**, finca de aguacates en Galicia.
Es una web estática de una sola página. No necesita instalación ni compilación: se sube tal cual a cualquier hosting.

## Secciones

| Sección | Qué hace |
|---|---|
| Hero | Titular animado, aguacate ilustrado que flota y sigue al ratón, lluvia de fondo |
| Ábrelo | Al hacer scroll el aguacate se abre por la mitad y aparecen piel, pulpa y hueso |
| O nome | Qué significa *rego* en gallego, con el texto iluminándose palabra a palabra |
| La finca | Paisaje gallego generado en tiempo real: colinas, filas de árboles, bruma y lluvia |
| Proceso | Cinco pasos del árbol a la mesa en recorrido horizontal, con iconos que se dibujan |
| Temporada | Calendario de cosecha por variedad con el mes actual marcado |
| Guía | Control interactivo de madurez y consejos para saber si un aguacate está en su punto |
| Síguenos | Bloque de TikTok e Instagram, con opción de incrustar vídeos reales |
| Pedidos | Formulario que prepara el mensaje del pedido para WhatsApp, email o mensaje directo |
| Pie | Logotipo grande animado y enlaces |

El color de fondo cambia por secciones al hacer scroll, como un corte del terreno y del fruto: bruma, piel, hoja y pulpa.

## Animación

| Librería | Uso |
|---|---|
| [GSAP 3.15](https://gsap.com) | Motor de animación y líneas de tiempo |
| ScrollTrigger | Animaciones ligadas al scroll, secciones fijadas y recorrido horizontal |
| SplitText | Titulares que entran por líneas y texto que se ilumina por palabras |
| DrawSVG | Iconos del proceso y logotipo del cargador que se dibujan solos |
| [Lenis 1.3](https://lenis.darkroom.engineering) | Scroll suave sincronizado con ScrollTrigger |
| Canvas 2D | Lluvia y paisaje generados por código, sin imágenes |

Todas las librerías están dentro de `assets/vendor/`, así que la web no depende de ninguna CDN.
GSAP y todos sus plugins son gratuitos para uso comercial desde la versión 3.13. Las licencias están en `assets/vendor/LICENSES.md`.

La web respeta la opción del sistema "reducir movimiento": sin scroll suave, sin animaciones y con el aguacate ya abierto.
Los lienzos animados se pausan cuando no están en pantalla.

## Cambiar datos de contacto, redes y temporada

Todo está en un único archivo: `assets/js/config.js`.

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
- Si se añaden enlaces en `tiktokVideos`, la web los muestra incrustados debajo del bloque de TikTok.
- `temporada` admite cualquier variedad y cualquier lista de meses.

## Verla en local

Abrir `index.html` en el navegador ya funciona. Para probarla como en un servidor real:

```bash
python3 -m http.server 8000
# y abrir http://localhost:8000
```

## Publicar

- **GitHub Pages**: en el repositorio, *Settings → Pages → Deploy from a branch*, rama `main` y carpeta `/ (root)`.
- **Netlify o Vercel**: arrastrar la carpeta del proyecto a su panel, sin configuración de build.
- Cuando haya dominio propio, poner la URL completa en `og:image` y añadir `og:url` en `index.html` para que la vista previa en WhatsApp y redes salga siempre.

## Pendiente de confirmar con la finca

Desde el entorno de trabajo no se pudo abrir TikTok ni Instagram, así que estos puntos se redactaron con información general sobre el aguacate gallego y deben revisarse:

1. **Usuario de Instagram.** Está puesto `@regodoscampos`, sin verificar.
2. **WhatsApp y email de pedidos.** Están vacíos.
3. **Variedades y meses de cosecha.** El calendario usa Hass y Bacon con fechas orientativas.
4. **Afirmaciones sobre la forma de trabajar**: recogida a mano, riego solo en verano, plantones injertados y cosecha cercana al pedido.
5. **Cantidades del formulario**: 2, 5 y 10 kg y hostelería.
6. **Fotos reales.** La web usa ilustraciones propias. Se pueden sustituir o completar con fotos de la finca.

## Estructura

```
index.html              Página
assets/css/styles.css   Estilos, paleta y tipografías
assets/js/config.js     Datos editables
assets/js/main.js       Interacción y animaciones
assets/vendor/          GSAP, plugins y Lenis
assets/img/             Favicon e imagen para compartir en redes
```

Tipografías de Google Fonts: Gloock para titulares, Hanken Grotesk para texto y Spline Sans Mono para etiquetas.
