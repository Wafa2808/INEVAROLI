// ====================================================================
// INVERANOLI Joyería (@inveranoli2017)
// Datos Maestros de Contingencia y Ejecución Offline (Windows 7 / file:///)
// Sincronizado automáticamente con database/schema.sql
// ====================================================================

var CATEGORIAS_INICIALES = [
  {
    "id": 1,
    "nombre": "Anillos de Grado - Bachiller",
    "descripcion": "Anillos de promoción para bachilleres en ciencias y técnicos con piedra facetada"
  },
  {
    "id": 2,
    "nombre": "Anillos de Grado - Universitarios",
    "descripcion": "Anillos de grado para UC, UAM, UJAP, Medicina, Derecho, Ingeniería y Salud"
  },
  {
    "id": 3,
    "nombre": "Compromiso y Promesa",
    "descripcion": "Solitarios con circonias suizas de corte brillante, tiaras y anillos de promesa"
  },
  {
    "id": 4,
    "nombre": "Alianzas de Matrimonio",
    "descripcion": "Dúos y tríos matrimoniales en acero dorado 18K y plata 925 con grabado gratis"
  },
  {
    "id": 5,
    "nombre": "Cadenas y Gargantillas",
    "descripcion": "Cadenas de tejido cubano, figaro y veneciano en acero quirúrgico 316L"
  },
  {
    "id": 6,
    "nombre": "Dijes y Medallas",
    "descripcion": "Dijes de graduación con birrete, cruces facetadas y medalla de la Virgen del Socorro"
  },
  {
    "id": 7,
    "nombre": "Pulseras y Esclavas",
    "descripcion": "Esclavas grabables para graduandos, pulseras tenis de circonias y semanarios"
  },
  {
    "id": 8,
    "nombre": "Zarcillos y Aretes",
    "descripcion": "Abridores antialérgicos para bebés, huggies diamantados y aretes tipo botón"
  }
];

var PRODUCTOS_INICIALES = [
  {
    "id": 1,
    "nombre": "Anillo de Grado Bachiller en Ciencias",
    "presentacion": "Plata Ley 925 con Baño de Rodio",
    "precio": 35,
    "stock": 25,
    "categoria_id": 1,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "Anillo de graduación oficial para Bachiller en Ciencias. Elaborado en Plata Ley 925 con grabado lateral de promoción, año y nombre del graduando. Incluye estuche de terciopelo y grabado láser interno sin costo adicional.",
    "tallas": "Tallas 6 a la 11",
    "piedras": "Zafiro Azul Facetado",
    "imagenes": [
      "images/prod_1_grado_bachiller_ciencias.jpg"
    ]
  },
  {
    "id": 2,
    "nombre": "Anillo de Grado Bachiller Técnico / Comercial",
    "presentacion": "Acero Inoxidable Quirúrgico 316L Dorado 18K",
    "precio": 25,
    "stock": 30,
    "categoria_id": 1,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Diseño robusto e inalterable en acero quirúrgico 316L con triple baño de oro de 18 kilates. No pierde el brillo ni mancha la piel. Ideal para promociones de educación técnica y comercial.",
    "tallas": "Tallas 6 a la 12",
    "piedras": "Circonia Suiza Azul Zafiro",
    "imagenes": [
      "images/prod_2_grado_bachiller_tecnico.jpg"
    ]
  },
  {
    "id": 3,
    "nombre": "Anillo de Promoción Primaria / Sexto Grado",
    "presentacion": "Plata Ley 925 Pulida",
    "precio": 22,
    "stock": 20,
    "categoria_id": 1,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Modelo delicado diseñado ergonómicamente para graduandos de 6to grado de primaria. Acabado brillante hipoalergénico con grabado conmemorativo.",
    "tallas": "Tallas 4 a la 7",
    "piedras": "Piedra Circonia Cristal / Roja",
    "imagenes": [
      "images/prod_3_grado_primaria.jpg"
    ]
  },
  {
    "id": 4,
    "nombre": "Anillo de Grado UC - Medicina y Ciencias de la Salud",
    "presentacion": "Plata Ley 925 Maciza con Bisel Dorado",
    "precio": 65,
    "stock": 18,
    "categoria_id": 2,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "Emblemático anillo para egresados de la Universidad de Carabobo (UC) en Medicina, Bioanálisis y Enfermería. Escudo de la universidad y emblema de la serpiente de Asclepio en alto relieve. Grabado de promoción personalizado incluido.",
    "tallas": "Tallas 6 a la 12",
    "piedras": "Zafiro Imperial / Topacio Dorado",
    "imagenes": [
      "images/prod_4_grado_uc_medicina.jpg"
    ]
  },
  {
    "id": 5,
    "nombre": "Anillo de Grado UC - Odontología",
    "presentacion": "Plata Ley 925 con Baño de Rodio Blanco",
    "precio": 60,
    "stock": 14,
    "categoria_id": 2,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Joya conmemorativa para Odontólogos de la UC. Acabado diamantado con la piedra representativa de la facultad de odontología y detalles esculpidos en las alas laterales.",
    "tallas": "Tallas 5 a la 11",
    "piedras": "Amatista Lila / Circonia Púrpura",
    "imagenes": [
      "images/prod_5_grado_uc_odontologia.jpg"
    ]
  },
  {
    "id": 6,
    "nombre": "Anillo de Grado UAM - Derecho y Ciencias Jurídicas",
    "presentacion": "Plata Ley 925 / Acero Quirúrgico Bicolor",
    "precio": 55,
    "stock": 22,
    "categoria_id": 2,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "Especial para Abogados de la Universidad Arturo Michelena (UAM). Incorpora la balanza de la justicia y el código de leyes tallados a precisión milimétrica.",
    "tallas": "Tallas 6 a la 13",
    "piedras": "Rubí Rojo Imperial Facetado",
    "imagenes": [
      "images/prod_6_grado_uam_derecho.jpg"
    ]
  },
  {
    "id": 7,
    "nombre": "Anillo de Grado UJAP - Ingeniería y Arquitectura",
    "presentacion": "Acero Inoxidable 316L con PVD Dorado y Plata",
    "precio": 45,
    "stock": 16,
    "categoria_id": 2,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Diseño geométrico para egresados de Ingeniería de la Universidad José Antonio Páez (UJAP). Resistente al uso continuo en obras e industrias sin rayarse ni perder color.",
    "tallas": "Tallas 7 a la 13",
    "piedras": "Zafiro Azul Medianoche",
    "imagenes": [
      "images/prod_7_grado_ujap_ingenieria.jpg"
    ]
  },
  {
    "id": 8,
    "nombre": "Anillo de Grado - Administración y Contaduría",
    "presentacion": "Plata Ley 925 Maciza",
    "precio": 50,
    "stock": 19,
    "categoria_id": 2,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Dedicado a los graduandos en Ciencias Económicas, Administrativas y Contaduría Pública. Piedra verde facetada de alta refracción con grabados comerciales oficiales.",
    "tallas": "Tallas 6 a la 12",
    "piedras": "Esmeralda Verde Esmeralda Facetada",
    "imagenes": [
      "images/prod_8_grado_administracion.jpg"
    ]
  },
  {
    "id": 9,
    "nombre": "Anillo Solitario de Compromiso Clásico",
    "presentacion": "Plata Ley 925 con Baño de Rodio Platino",
    "precio": 40,
    "stock": 28,
    "categoria_id": 3,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "El anillo de compromiso por excelencia. Circonia central montada en 6 uñas de alta seguridad que capturan la luz desde cualquier ángulo. Incluye caja de presentación para propuesta de matrimonio.",
    "tallas": "Tallas 5 a la 9",
    "piedras": "Zirconia Cúbica Corte Brillante 1.5 ct",
    "imagenes": [
      "images/prod_9_solitario_clasico.jpg"
    ]
  },
  {
    "id": 10,
    "nombre": "Anillo Tiara / Corona Real de la Princesa",
    "presentacion": "Baño de Oro Rosa 18K sobre Plata 925",
    "precio": 38,
    "stock": 24,
    "categoria_id": 3,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "Diseño inspirado en coronas de la realeza. Silueta en ondas con micropavé brillante que resalta la elegancia de la mano femenina. Ideal para promesa o regalo especial.",
    "tallas": "Tallas 5 a la 8",
    "piedras": "Micro Pavé de Zirconias Suizas",
    "imagenes": [
      "images/prod_10_tiara_corona.jpg"
    ]
  },
  {
    "id": 11,
    "nombre": "Anillo de Promesa \"Infinito Amor\"",
    "presentacion": "Acero Inoxidable Quirúrgico 316L Pulido Espejo",
    "precio": 18,
    "stock": 35,
    "categoria_id": 3,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Símbolo del infinito entrelazado que representa la lealtad y el compromiso eterno. Inalterable al agua, perfumes o sudor.",
    "tallas": "Tallas 5 a la 10",
    "piedras": "Circonia Microengastada",
    "imagenes": [
      "images/prod_11_promesa_infinito.jpg"
    ]
  },
  {
    "id": 12,
    "nombre": "Anillo Solitario Halo Cuadrado Imperial",
    "presentacion": "Plata Ley 925 Maciza",
    "precio": 48,
    "stock": 15,
    "categoria_id": 3,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Corte cushion cuadrado rodeado de un halo brillante de gemas suizas. Ofrece el máximo destello y una presencia visual imponente en celebraciones de compromiso.",
    "tallas": "Tallas 5 a la 9",
    "piedras": "Gema Suiza Central con Orla de Brillantes",
    "imagenes": [
      "images/prod_12_halo_cuadrado.jpg"
    ]
  },
  {
    "id": 13,
    "nombre": "Trío Matrimonial Imperial (Par de Alianzas + Solitario)",
    "presentacion": "Plata Ley 925 Rodiada con Acentos en Oro 18K",
    "precio": 85,
    "stock": 12,
    "categoria_id": 4,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "El combo matrimonial más solicitado de INVERANOLI. Incluye la alianza del novio, la alianza de la novia y el anillo solitario de compromiso que encajan a la perfección. Grabado de nombres y fecha de boda de cortesía.",
    "tallas": "Tallas a medida para él y ella",
    "piedras": "Circonias Cúbicas AAA",
    "imagenes": [
      "images/prod_13_trio_matrimonial.jpg"
    ]
  },
  {
    "id": 14,
    "nombre": "Dúo de Alianzas Clásicas Media Caña 4mm",
    "presentacion": "Acero Inoxidable 316L Dorado 18K PVD",
    "precio": 28,
    "stock": 30,
    "categoria_id": 4,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "Par de alianzas de boda tradicionales con perfil abombado de 4 mm y tecnología confort interior para uso diario continuo. No se decoloran ni causan alergias.",
    "tallas": "Tallas 5 a la 13",
    "piedras": "Lisas sin piedras / Confort Fit",
    "imagenes": [
      "images/prod_14_duo_alianzas_oro.jpg"
    ]
  },
  {
    "id": 15,
    "nombre": "Dúo de Alianzas Diamantadas Bicolor",
    "presentacion": "Plata Ley 925 con Franja de Oro Amarillo",
    "precio": 70,
    "stock": 14,
    "categoria_id": 4,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Combinación elegante de plata y baño de oro con un grabado diamantado que brilla al contacto con la luz. La alianza de dama cuenta con 3 gemas empotradas.",
    "tallas": "Tallas 5 a la 12",
    "piedras": "Canal Satinado con 3 Circonias en la dama",
    "imagenes": [
      "images/prod_15_duo_diamantadas.jpg"
    ]
  },
  {
    "id": 16,
    "nombre": "Cadena Tejido Cubano (Cuban Link) 5mm x 55cm",
    "presentacion": "Acero Inoxidable Quirúrgico 316L Dorado",
    "precio": 20,
    "stock": 40,
    "categoria_id": 5,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "Tejido cubano de eslabones pulidos y aplanados. Pieza versátil y de máxima tendencia urbana para caballeros o damas.",
    "tallas": "55 cm de largo / 5 mm de ancho",
    "piedras": "Sin piedras / Cierre tipo langosta reforzado",
    "imagenes": [
      "images/prod_16_cadena_cubana.jpg"
    ]
  },
  {
    "id": 17,
    "nombre": "Collar Punto de Luz Solitario",
    "presentacion": "Plata Ley 925 Rodiada Cadena Veneciana 45cm",
    "precio": 24,
    "stock": 32,
    "categoria_id": 5,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "Gargantilla minimalista ultra elegante. La piedra parece flotar sobre el cuello, otorgando un toque de distinción en ocasiones especiales o uso cotidiano.",
    "tallas": "45 cm con extensión de 5 cm",
    "piedras": "Zirconia Cúbica 7mm Biselada",
    "imagenes": [
      "images/prod_17_punto_de_luz.jpg"
    ]
  },
  {
    "id": 18,
    "nombre": "Cadena Militar con Placa de Identificación Grabable",
    "presentacion": "Acero Quirúrgico 316L Plateado Mate",
    "precio": 16,
    "stock": 35,
    "categoria_id": 5,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Placa grabable de doble faz para inscripción de nombres, fechas especiales, grupo sanguíneo o mensajes de amor y graduación.",
    "tallas": "Cadena de 60 cm y placa de 4.5 cm",
    "piedras": "Sin piedras",
    "imagenes": [
      "images/prod_18_cadena_militar_placa.jpg"
    ]
  },
  {
    "id": 19,
    "nombre": "Dije de Graduación Birrete con Diploma 2026",
    "presentacion": "Plata Ley 925 Esmaltada con Circonias",
    "precio": 18,
    "stock": 38,
    "categoria_id": 6,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "Dije conmemorativo del logro académico. Representa el birrete y el pergamino de grado. Compatible con cadenas de hasta 4 mm y pulseras Pandora.",
    "tallas": "2.5 cm de alto",
    "piedras": "Microcirconias en borla del birrete",
    "imagenes": [
      "images/prod_19_dije_birrete_2026.jpg"
    ]
  },
  {
    "id": 20,
    "nombre": "Medalla Devocional Nuestra Señora del Socorro",
    "presentacion": "Plata Ley 925 Patrona de Valencia",
    "precio": 26,
    "stock": 20,
    "categoria_id": 6,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Hermosa imagen en relieve de la Virgen del Socorro, patrona canónica de Valencia, Carabobo. Reverso con la bendición papal.",
    "tallas": "Diámetro 22 mm",
    "piedras": "Borde tallado diamantado",
    "imagenes": [
      "images/prod_20_medalla_virgen_socorro.jpg"
    ]
  },
  {
    "id": 21,
    "nombre": "Dije de Cruz Facetada Tridimensional",
    "presentacion": "Acero Inoxidable 316L Dorado 18K",
    "precio": 15,
    "stock": 45,
    "categoria_id": 6,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Cruz clásica de corte elegante con diseño facetado que refleja la luz. Inmune a la oxidación y compatible con todo tipo de cadenas.",
    "tallas": "4.0 cm de altura",
    "piedras": "Sin piedras / Pulido bicelado",
    "imagenes": [
      "images/prod_21_cruz_facetada.jpg"
    ]
  },
  {
    "id": 22,
    "nombre": "Esclava de Grado para Caballero Eslabón Grumet",
    "presentacion": "Acero Inoxidable Quirúrgico 316L con Placa",
    "precio": 22,
    "stock": 25,
    "categoria_id": 7,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "Pulsera esclava maciza para caballeros. Placa central pulida para grabar el nombre del graduando y la mención de bachiller o universitario.",
    "tallas": "21 cm ajustable",
    "piedras": "Sin piedras / Placa lista para grabado",
    "imagenes": [
      "images/prod_22_esclava_caballero.jpg"
    ]
  },
  {
    "id": 23,
    "nombre": "Pulsera Tenis de Circonias Suizas",
    "presentacion": "Plata Ley 925 Rodiada con Doble Broche de Seguridad",
    "precio": 42,
    "stock": 18,
    "categoria_id": 7,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "La icónica pulsera de tenis que combina con vestidos de gala o looks ejecutivos. Cierre tipo caja con doble seguro lateral.",
    "tallas": "17 cm y 19 cm",
    "piedras": "Circonias Cúbicas Redondas de 3mm en Hilera Continua",
    "imagenes": [
      "images/prod_23_pulsera_tenis.jpg"
    ]
  },
  {
    "id": 24,
    "nombre": "Semanario 7 Días de la Buena Fortuna",
    "presentacion": "Acero Inoxidable Quirúrgico Dorado 18K",
    "precio": 24,
    "stock": 22,
    "categoria_id": 7,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Tradicional semanario de 7 aros independientes que simbolizan cada día de la semana para atraer prosperidad, salud y éxito profesional.",
    "tallas": "Diámetro 6.5 cm",
    "piedras": "7 Aros con diferentes texturas diamantadas",
    "imagenes": [
      "images/prod_24_semanario_7_dias.jpg"
    ]
  },
  {
    "id": 25,
    "nombre": "Zarcillos Abridores para Bebé / Niña",
    "presentacion": "Plata Ley 925 con Rosca Protectora Antiahogo",
    "precio": 16,
    "stock": 35,
    "categoria_id": 8,
    "activo": 1,
    "recomendado": 1,
    "descripcion": "Aretes hipoalergénicos ideales para la primera postura o regalo de nacimiento y bautizo. Su rosca de tope evita molestias detrás de la oreja.",
    "tallas": "Poste fino especial de 0.8 mm",
    "piedras": "Perla Cultivada o Circonia Rosa",
    "imagenes": [
      "images/prod_25_zarcillos_abridores.jpg"
    ]
  },
  {
    "id": 26,
    "nombre": "Aretes Huggies Diamantados con Circonias",
    "presentacion": "Acero Quirúrgico Dorado 18K con Cierre Click",
    "precio": 14,
    "stock": 40,
    "categoria_id": 8,
    "activo": 1,
    "recomendado": 0,
    "descripcion": "Argollas pequeñas que abrazan el lóbulo con comodidad total para dormir o bañarse sin riesgo de caída.",
    "tallas": "Diámetro 12 mm",
    "piedras": "Microcirconias incrustadas",
    "imagenes": [
      "images/prod_26_aretes_huggies.jpg"
    ]
  }
];
