/**
 * Rego dos Campos · configuración editable
 * ---------------------------------------------------------------
 * Cambia aquí las redes sociales y la temporada. Con JavaScript, la web
 * actualiza sola los enlaces, los datos para buscadores y el calendario.
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

  // Calendario orientativo de cosecha: variedad -> meses (1 = enero ... 12 = diciembre)
  temporada: {
    Hass: [12, 1, 2, 3, 4, 5],
    Bacon: [10, 11, 12, 1]
  }
};
