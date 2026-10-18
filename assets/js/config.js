/**
 * Rego dos Campos · configuración editable
 * ---------------------------------------------------------------
 * Cambia aquí los datos de contacto, redes y temporada.
 * No hace falta tocar nada más para actualizar la web.
 */
window.REGO_CONFIG = {
  // Usuario de TikTok, sin la @
  tiktok: 'regodoscampos2',

  // Usuario de Instagram, sin la @. CONFIRMAR: no se pudo verificar desde aquí.
  instagram: 'regodoscampos',

  // WhatsApp con prefijo de país y sin espacios ni "+", por ejemplo '34600111222'.
  // Si se deja vacío, el botón de WhatsApp no aparece.
  whatsapp: '',

  // Email de pedidos. Si se deja vacío, el botón de email no aparece.
  email: '',

  // Vídeos de TikTok para mostrar en la web. Pega enlaces completos, por ejemplo:
  // 'https://www.tiktok.com/@regodoscampos2/video/7300000000000000000'
  tiktokVideos: [],

  // Calendario orientativo de cosecha: variedad -> meses (1 = enero ... 12 = diciembre)
  temporada: {
    Hass: [12, 1, 2, 3, 4, 5],
    Bacon: [10, 11, 12, 1]
  }
};
