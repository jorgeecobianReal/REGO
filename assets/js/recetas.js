/**
 * Rego dos Campos · recetario
 * ---------------------------------------------------------------
 * Cada receta es un bloque { ... }. Para añadir una, copia un bloque,
 * cambia el id (sin espacios ni tildes) y rellena los campos.
 *
 *  cat       Categoría: Desayunos, Para picar, Entrantes, Principales o Postres
 *  title     Título. Lo que va entre <em></em> sale en cursiva y color
 *  time      Tiempo tal como se muestra
 *  min       Tiempo total en minutos (para buscadores como Google)
 *  serves    Raciones
 *  level     Fácil, Media o Difícil
 *  variety   Variedad de aguacate recomendada
 */
window.REGO_RECETAS = [
  {
    id: 'tosta-huevo',
    cat: 'Desayunos',
    title: 'Tosta de aguacate <em>y huevo poché</em>',
    time: '15 min', min: 15, serves: 2, level: 'Media', variety: 'Hass',
    ingredients: [
      '2 rebanadas grandes de pan de masa madre',
      '1 aguacate maduro',
      '2 huevos muy frescos',
      'Un chorrito de vinagre',
      '½ limón',
      'Aceite de oliva virgen extra',
      'Sal en escamas y pimienta negra',
      'Sésamo o copos de guindilla'
    ],
    steps: [
      'Tuesta el pan en una sartén con un hilo de aceite.',
      'Aplasta el aguacate con el zumo de limón, sal y pimienta, y repártelo sobre el pan.',
      'Calienta agua con el vinagre sin que llegue a hervir con fuerza. Remueve para hacer un remolino y echa el huevo cascado en el centro.',
      'Cuécelo 3 minutos y sácalo con una espumadera.',
      'Coloca el huevo sobre la tosta y termina con sésamo, escamas de sal y un poco de aceite.'
    ],
    tip: 'Pasa el huevo por un colador fino antes de cocerlo: se va la clara más líquida y el poché queda redondo.'
  },
  {
    id: 'batido-verde',
    cat: 'Desayunos',
    title: 'Batido verde <em>de aguacate y plátano</em>',
    time: '5 min', min: 5, serves: 2, level: 'Fácil', variety: 'Bacon o Hass',
    ingredients: [
      '½ aguacate maduro',
      '1 plátano',
      'Un puñado de espinacas frescas',
      '300 ml de leche o bebida vegetal',
      '1 cucharadita de miel',
      'El zumo de ½ lima',
      'Unos cubitos de hielo'
    ],
    steps: [
      'Pela el plátano y saca la pulpa del aguacate.',
      'Ponlo todo en la batidora con la leche y las espinacas.',
      'Tritura hasta que quede liso, sin trozos.',
      'Prueba y ajusta con más miel o lima.',
      'Sirve enseguida, con hielo.'
    ],
    tip: 'Congela el plátano en rodajas la noche antes. El batido queda espeso y frío sin aguarlo con hielo.'
  },
  {
    id: 'guacamole',
    cat: 'Para picar',
    title: 'Guacamole <em>de la finca</em>',
    time: '10 min', min: 10, serves: 4, level: 'Fácil', variety: 'Hass',
    ingredients: [
      '3 aguacates maduros',
      '1 lima',
      '½ cebolleta',
      '1 tomate maduro',
      'Un puñado de cilantro',
      'Sal en escamas',
      'Guindilla, si te gusta el picante'
    ],
    steps: [
      'Abre los aguacates, retira el hueso y saca la pulpa con una cuchara a un bol.',
      'Aplástala con un tenedor. Deja algún trozo: un buen guacamole tiene textura.',
      'Añade enseguida el zumo de la lima y la sal, para que no se oxide.',
      'Pica fino la cebolleta, el tomate sin semillas y el cilantro.',
      'Mézclalo todo, prueba y ajusta de sal, lima o guindilla.'
    ],
    tip: 'Si sobra, tápalo con film pegado a la superficie. El aire es lo que lo oscurece.'
  },
  {
    id: 'tosta-sardina',
    cat: 'Para picar',
    title: 'Tosta de pan de Cea <em>con sardina</em>',
    time: '15 min', min: 15, serves: 4, level: 'Fácil', variety: 'Hass',
    ingredients: [
      '4 rebanadas de pan de Cea',
      '2 aguacates maduros',
      '1 lata de sardinas en aceite',
      '½ limón',
      'Aceite de oliva virgen extra',
      'Pimentón de la Vera',
      'Sal en escamas y cebollino'
    ],
    steps: [
      'Tuesta las rebanadas de pan en una sartén o plancha con un hilo de aceite.',
      'Aplasta el aguacate con el zumo de limón y una pizca de sal.',
      'Reparte el aguacate sobre el pan, sin miedo: es la base de todo.',
      'Coloca encima las sardinas en lomos, escurridas.',
      'Termina con pimentón, cebollino picado, escamas de sal y un poco de aceite.'
    ],
    tip: 'En temporada de sardina, ásala a la brasa y quítale la espina. Cambia la tosta por completo.'
  },
  {
    id: 'relleno-langostinos',
    cat: 'Para picar',
    title: 'Aguacate relleno <em>de langostinos</em>',
    time: '20 min', min: 20, serves: 4, level: 'Fácil', variety: 'Hass',
    ingredients: [
      '2 aguacates maduros',
      '250 g de langostinos cocidos y pelados',
      '3 cucharadas de mayonesa',
      '1 cucharada de kétchup',
      'Unas gotas de brandy o de zumo de naranja',
      '½ limón',
      'Cebollino',
      'Sal y pimienta'
    ],
    steps: [
      'Mezcla la mayonesa, el kétchup y el brandy para hacer la salsa rosa.',
      'Trocea los langostinos y reserva cuatro enteros para decorar.',
      'Abre los aguacates, quita el hueso y riégalos con limón.',
      'Mezcla los langostinos con la salsa y rellena el hueco de cada mitad.',
      'Corona cada mitad con un langostino entero y cebollino picado.'
    ],
    tip: 'Saca un poco de pulpa con una cuchara para agrandar el hueco y mézclala con el relleno. No se desperdicia nada.'
  },
  {
    id: 'tartar-salmon',
    cat: 'Entrantes',
    title: 'Tartar de salmón <em>y aguacate</em>',
    time: '20 min', min: 20, serves: 2, level: 'Media', variety: 'Hass',
    ingredients: [
      '200 g de salmón fresco, congelado previamente',
      '1 aguacate maduro',
      '½ chalota',
      '1 cucharada de salsa de soja',
      '1 cucharadita de aceite de sésamo',
      '½ lima',
      'Cebollino',
      'Sésamo tostado'
    ],
    steps: [
      'Corta el salmón en dados pequeños y regulares, y guárdalo en frío.',
      'Pica la chalota muy fina y mézclala con la soja, el aceite de sésamo y unas gotas de lima.',
      'Corta el aguacate en dados del mismo tamaño y alíñalo con lima y sal.',
      'Mezcla el salmón con el aliño justo antes de servir.',
      'Monta en un aro: abajo el aguacate, encima el salmón. Termina con sésamo y cebollino.'
    ],
    tip: 'El pescado que se come crudo debe congelarse antes al menos cinco días en el congelador de casa, como recomienda la Agencia Española de Seguridad Alimentaria.'
  },
  {
    id: 'crema-fria',
    cat: 'Entrantes',
    title: 'Crema fría <em>de aguacate y pepino</em>',
    time: '10 min + 30 min de nevera', min: 40, serves: 4, level: 'Fácil', variety: 'Bacon',
    ingredients: [
      '2 aguacates',
      '1 pepino',
      '1 yogur natural',
      '1 diente de ajo pequeño',
      '300 ml de agua fría',
      'El zumo de 1 lima',
      'Aceite de oliva virgen extra',
      'Sal y hojas de menta'
    ],
    steps: [
      'Pela el pepino y córtalo en trozos.',
      'Tritúralo con la pulpa del aguacate, el yogur, el ajo y el agua.',
      'Añade la lima, la sal y un chorro de aceite, y vuelve a triturar.',
      'Ajusta la textura con más agua si la quieres más ligera.',
      'Enfría media hora y sirve con menta y un hilo de aceite.'
    ],
    tip: 'Termina con unos dados de pepino y unos picatostes. El punto crujiente le sienta muy bien.'
  },
  {
    id: 'ceviche',
    cat: 'Entrantes',
    title: 'Ceviche de corvina <em>con aguacate</em>',
    time: '25 min + 15 min de marinado', min: 40, serves: 4, level: 'Media', variety: 'Hass',
    ingredients: [
      '500 g de corvina en lomos sin piel, congelada previamente',
      '1 aguacate',
      '1 cebolla morada',
      '6 limas',
      '1 guindilla o ají',
      'Cilantro fresco',
      'Maíz dulce o una mazorca cocida',
      'Sal'
    ],
    steps: [
      'Corta el pescado en dados de un centímetro y ponlo en un bol frío con sal.',
      'Corta la cebolla en pluma muy fina y lávala con agua fría.',
      'Cubre el pescado con el zumo de lima, añade la guindilla picada y deja reposar entre 10 y 15 minutos en frío.',
      'Incorpora la cebolla escurrida, el cilantro y el aguacate en dados.',
      'Sirve enseguida, con el maíz al lado.'
    ],
    tip: 'Como en el tartar, congela antes el pescado al menos cinco días. La lima lo "cocina" en apariencia, pero no sustituye a la congelación.'
  },
  {
    id: 'pulpo',
    cat: 'Principales',
    title: 'Pulpo <em>con aguacate</em>',
    time: '20 min', min: 20, serves: 4, level: 'Media', variety: 'Bacon',
    ingredients: [
      '400 g de pulpo cocido',
      '2 aguacates',
      '2 patatas cocidas',
      '½ cebolla morada',
      '1 limón',
      'Aceite de oliva y pimentón',
      'Sal gruesa'
    ],
    steps: [
      'Corta las patatas en rodajas gruesas y el pulpo en trozos, como para servir á feira.',
      'Pica la cebolla morada muy fina y déjala diez minutos en agua fría con limón.',
      'Corta el aguacate en dados y alíñalo con limón, aceite y sal.',
      'Monta en un plato: patata, pulpo, aguacate y la cebolla escurrida.',
      'Acaba con sal gruesa, pimentón y un buen chorro de aceite.'
    ],
    tip: 'Sirve el pulpo templado y el aguacate frío. El contraste es lo que hace el plato.'
  },
  {
    id: 'ensalada-tetilla',
    cat: 'Principales',
    title: 'Ensalada de aguacate <em>y queso de tetilla</em>',
    time: '15 min', min: 15, serves: 4, level: 'Fácil', variety: 'Bacon',
    ingredients: [
      '2 aguacates',
      '3 tomates maduros del país',
      '200 g de queso de tetilla',
      '½ cebolla morada',
      'Un puñado de nueces',
      'Aceite de oliva virgen extra',
      'Vinagre de Jerez',
      'Sal en escamas y albahaca'
    ],
    steps: [
      'Corta los tomates en gajos y sálalos ligeramente.',
      'Corta el queso en dados y el aguacate en láminas.',
      'Pica la cebolla en juliana fina.',
      'Monta la ensalada alternando tomate, aguacate y queso, y añade la cebolla y las nueces.',
      'Aliña con aceite, unas gotas de vinagre, escamas de sal y albahaca.'
    ],
    tip: 'Saca el queso de la nevera media hora antes. A temperatura ambiente se nota mucho más su sabor.'
  },
  {
    id: 'pasta-cremosa',
    cat: 'Principales',
    title: 'Pasta cremosa <em>de aguacate y albahaca</em>',
    time: '20 min', min: 20, serves: 4, level: 'Fácil', variety: 'Hass',
    ingredients: [
      '320 g de espaguetis',
      '2 aguacates maduros',
      'Un puñado grande de albahaca',
      '1 diente de ajo',
      '40 g de parmesano',
      'El zumo de 1 limón',
      '3 cucharadas de aceite de oliva',
      '50 g de piñones',
      'Sal y pimienta'
    ],
    steps: [
      'Cuece la pasta en agua con sal y guarda un vaso del agua de cocción.',
      'Tuesta los piñones en una sartén sin aceite.',
      'Tritura el aguacate con la albahaca, el ajo, el parmesano, el limón y el aceite.',
      'Escurre la pasta y mézclala con la crema fuera del fuego, añadiendo agua de cocción hasta que quede sedosa.',
      'Sirve con los piñones, pimienta y más parmesano.'
    ],
    tip: 'No calientes la salsa en el fuego: el aguacate cocinado amarga. El calor de la pasta es suficiente.'
  },
  {
    id: 'mousse-chocolate',
    cat: 'Postres',
    title: 'Mousse de chocolate <em>y aguacate</em>',
    time: '10 min + 1 h de nevera', min: 70, serves: 4, level: 'Fácil', variety: 'Hass',
    ingredients: [
      '2 aguacates muy maduros',
      '150 g de chocolate negro (70 %)',
      '3 cucharadas de cacao puro en polvo',
      '3 cucharadas de miel o sirope de arce',
      '100 ml de leche o bebida vegetal',
      '1 cucharadita de vainilla',
      'Una pizca de sal',
      'Frambuesas para servir'
    ],
    steps: [
      'Funde el chocolate al baño maría o en el microondas a golpes cortos.',
      'Tritura la pulpa del aguacate con el cacao, la miel, la leche, la vainilla y la sal.',
      'Añade el chocolate fundido y tritura hasta que no quede ni un grumo.',
      'Reparte en vasitos y enfría al menos una hora.',
      'Sirve con frambuesas y unas escamas de sal.'
    ],
    tip: 'Nadie adivina que lleva aguacate. Usa aguacates muy maduros: cuanto más cremosos, menos se nota.'
  },
  {
    id: 'polos-yogur',
    cat: 'Postres',
    title: 'Polos de aguacate, <em>yogur y miel</em>',
    time: '10 min + 6 h de congelador', min: 370, serves: 6, level: 'Fácil', variety: 'Hass',
    ingredients: [
      '2 aguacates maduros',
      '2 yogures griegos',
      '3 cucharadas de miel',
      'El zumo de 1 lima',
      '100 ml de leche',
      'Frutos rojos, si quieres'
    ],
    steps: [
      'Tritura la pulpa del aguacate con el yogur, la miel, la lima y la leche.',
      'Prueba y ajusta de miel: en frío se nota menos el dulce.',
      'Si usas frutos rojos, repártelos en el fondo de los moldes.',
      'Rellena los moldes, pon los palitos y congela al menos seis horas.',
      'Para desmoldar, pasa los moldes unos segundos por agua tibia.'
    ],
    tip: 'La lima mantiene el color verde vivo aunque pasen días en el congelador.'
  }
];
