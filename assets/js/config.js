/**
 * Rego dos Campos · configuración editable
 * ---------------------------------------------------------------
 * Cambia aquí las redes sociales, las fotos de las postales y la temporada.
 * Con JavaScript, la web actualiza sola los enlaces, los datos para
 * buscadores, las postales y el calendario.
 * Los enlaces escritos en index.html son el respaldo sin JavaScript:
 * si cambia un usuario, conviene cambiarlo también allí.
 */
window.REGO_CONFIG = {
  // Usuario de TikTok, sin la @
  tiktok: 'regodoscampos2',

  // Usuario de Instagram, sin la @
  instagram: 'regodoscampos',

  // Vídeos de TikTok para mostrar en la web. Pega enlaces completos, por ejemplo:
  // 'https://www.tiktok.com/@regodoscampos2/video/7300000000000000000'
  tiktokVideos: [],

  // Fotos de las postales. Las nueve ya están puestas (assets/img/fotos/).
  // Para cambiar una, lo más sencillo es sustituir su archivo por otro con el mismo nombre.
  // También se puede escribir aquí la ruta de otra foto: la ruta sola o
  // { src: 'ruta', alt: 'descripción de la foto' }. Vacío = se queda la foto actual.
  fotos: {
    cartel: '',        // O nome: el cartel de la finca (cartel.webp)
    balsa: '',         // La finca: la balsa con el pino (balsa.webp, vertical)
    colleita: '',      // Aguacate de aquí: dos Hass en la rama (colleita.webp, vertical)
    flor: '',          // Aguacate de aquí: la flor (flor.webp)
    punto: '',         // Guía: un Hass en la rama (punto.webp, vertical)
    cocina: '',        // Recetario: rama cargada de fruta (cocina.webp)
    orballo: '',       // Síguenos: aguacates con llovizna (orballo.webp)
    campos: '',        // Síguenos: filas de árboles y el pino (campos.webp)
    aguacateiro: ''    // Síguenos: fila de aguacateros (aguacateiros.webp)
  },

  // Calendario orientativo de cosecha: variedad -> meses (1 = enero ... 12 = diciembre)
  temporada: {
    Hass: [12, 1, 2, 3, 4, 5],
    Bacon: [10, 11, 12, 1]
  }
};
