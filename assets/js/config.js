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

  // Fotos de las postales. Copia cada foto en assets/img/fotos/ y escribe aquí su ruta.
  // Mientras una postal no tenga foto, muestra un dibujo de relleno.
  // Admite la ruta sola o { src: 'ruta', alt: 'descripción de la foto' }.
  fotos: {
    rego: '',          // O nome: el rego entre los campos
    socalcos: '',      // La finca: las terrazas con los árboles (vertical)
    colleita: '',      // Reportaje: aguacates en la rama o la cosecha (vertical)
    bretema: '',       // Reportaje: la finca con niebla
    punto: '',         // Guía: un aguacate maduro (vertical)
    cocina: '',        // Recetario: el aguacate en la cocina
    orballo: '',       // Síguenos: la finca bajo la lluvia
    costa: '',         // Síguenos: el mar o la costa cercana
    aguacateiro: ''    // Síguenos: un aguacatero con fruta
  },

  // Calendario orientativo de cosecha: variedad -> meses (1 = enero ... 12 = diciembre)
  temporada: {
    Hass: [12, 1, 2, 3, 4, 5],
    Bacon: [10, 11, 12, 1]
  }
};
