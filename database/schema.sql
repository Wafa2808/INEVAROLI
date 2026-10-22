-- ====================================================================
-- Base de Datos Relacional SQLite Pura para INVERANOLI Joyería (@inveranoli2017)
-- Compatible con SQLite 3+, Windows 7 y ejecución 100% local sin dependencias.
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. Tabla de Categorías de Joyería
CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

-- 2. Tabla de Usuarios (Clientes y Administrador)
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  cedula TEXT NOT NULL UNIQUE CHECK (cedula GLOB '[0-9]*'),
  telefono TEXT NOT NULL CHECK (telefono GLOB '[0-9]*'),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  sal TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente','admin'))
);

-- 3. Tabla de Productos (Joyas, Anillos de Grado, Compromiso, Cadenas, etc.)
CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  presentacion TEXT,
  precio REAL NOT NULL CHECK (precio >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  recomendado INTEGER DEFAULT 0,
  descripcion TEXT,
  tallas TEXT,
  piedras TEXT,
  imagenes TEXT
);

-- 4. Tabla de Órdenes / Pedidos
CREATE TABLE IF NOT EXISTS ordenes (
  id TEXT PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  fecha TEXT NOT NULL,
  total REAL NOT NULL,
  metodo_pago TEXT NOT NULL,
  despacho TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'recibido' CHECK (estado IN ('recibido','preparacion','camino','entregado'))
);

-- 5. Tabla de Detalle de Órdenes
CREATE TABLE IF NOT EXISTS detalle_ordenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id TEXT NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario REAL NOT NULL,
  personalizacion TEXT
);

-- ====================================================================
-- CATEGORÍAS INICIALES DE INVERANOLI (@inveranoli2017)
-- ====================================================================
INSERT OR IGNORE INTO categorias (id, nombre, descripcion) VALUES (1, 'Anillos de Grado - Bachiller', 'Anillos de promoción para bachilleres en ciencias y técnicos con piedra facetada');
INSERT OR IGNORE INTO categorias (id, nombre, descripcion) VALUES (2, 'Anillos de Grado - Universitarios', 'Anillos de grado para UC, UAM, UJAP, Medicina, Derecho, Ingeniería y Salud');
INSERT OR IGNORE INTO categorias (id, nombre, descripcion) VALUES (3, 'Compromiso y Promesa', 'Solitarios con circonias suizas de corte brillante, tiaras y anillos de promesa');
INSERT OR IGNORE INTO categorias (id, nombre, descripcion) VALUES (4, 'Alianzas de Matrimonio', 'Dúos y tríos matrimoniales en acero dorado 18K y plata 925 con grabado gratis');
INSERT OR IGNORE INTO categorias (id, nombre, descripcion) VALUES (5, 'Cadenas y Gargantillas', 'Cadenas de tejido cubano, figaro y veneciano en acero quirúrgico 316L');
INSERT OR IGNORE INTO categorias (id, nombre, descripcion) VALUES (6, 'Dijes y Medallas', 'Dijes de graduación con birrete, cruces facetadas y medalla de la Virgen del Socorro');
INSERT OR IGNORE INTO categorias (id, nombre, descripcion) VALUES (7, 'Pulseras y Esclavas', 'Esclavas grabables para graduandos, pulseras tenis de circonias y semanarios');
INSERT OR IGNORE INTO categorias (id, nombre, descripcion) VALUES (8, 'Zarcillos y Aretes', 'Abridores antialérgicos para bebés, huggies diamantados y aretes tipo botón');

-- ====================================================================
-- PRODUCTOS DEL CATÁLOGO OFICIAL INVERANOLI
-- ====================================================================
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (1, 'Anillo de Grado Bachiller en Ciencias', 'Plata Ley 925 con Baño de Rodio', 35, 25, 1, 1, 1, 'Anillo de graduación oficial para Bachiller en Ciencias. Elaborado en Plata Ley 925 con grabado lateral de promoción, año y nombre del graduando. Incluye estuche de terciopelo y grabado láser interno sin costo adicional.', 'Tallas 6 a la 11', 'Zafiro Azul Facetado', '["images/prod_1_grado_bachiller_ciencias.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (2, 'Anillo de Grado Bachiller Técnico / Comercial', 'Acero Inoxidable Quirúrgico 316L Dorado 18K', 25, 30, 1, 1, 0, 'Diseño robusto e inalterable en acero quirúrgico 316L con triple baño de oro de 18 kilates. No pierde el brillo ni mancha la piel. Ideal para promociones de educación técnica y comercial.', 'Tallas 6 a la 12', 'Circonia Suiza Azul Zafiro', '["images/prod_2_grado_bachiller_tecnico.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (3, 'Anillo de Promoción Primaria / Sexto Grado', 'Plata Ley 925 Pulida', 22, 20, 1, 1, 0, 'Modelo delicado diseñado ergonómicamente para graduandos de 6to grado de primaria. Acabado brillante hipoalergénico con grabado conmemorativo.', 'Tallas 4 a la 7', 'Piedra Circonia Cristal / Roja', '["images/prod_3_grado_primaria.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (4, 'Anillo de Grado UC - Medicina y Ciencias de la Salud', 'Plata Ley 925 Maciza con Bisel Dorado', 65, 18, 2, 1, 1, 'Emblemático anillo para egresados de la Universidad de Carabobo (UC) en Medicina, Bioanálisis y Enfermería. Escudo de la universidad y emblema de la serpiente de Asclepio en alto relieve. Grabado de promoción personalizado incluido.', 'Tallas 6 a la 12', 'Zafiro Imperial / Topacio Dorado', '["images/prod_4_grado_uc_medicina.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (5, 'Anillo de Grado UC - Odontología', 'Plata Ley 925 con Baño de Rodio Blanco', 60, 14, 2, 1, 0, 'Joya conmemorativa para Odontólogos de la UC. Acabado diamantado con la piedra representativa de la facultad de odontología y detalles esculpidos en las alas laterales.', 'Tallas 5 a la 11', 'Amatista Lila / Circonia Púrpura', '["images/prod_5_grado_uc_odontologia.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (6, 'Anillo de Grado UAM - Derecho y Ciencias Jurídicas', 'Plata Ley 925 / Acero Quirúrgico Bicolor', 55, 22, 2, 1, 1, 'Especial para Abogados de la Universidad Arturo Michelena (UAM). Incorpora la balanza de la justicia y el código de leyes tallados a precisión milimétrica.', 'Tallas 6 a la 13', 'Rubí Rojo Imperial Facetado', '["images/prod_6_grado_uam_derecho.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (7, 'Anillo de Grado UJAP - Ingeniería y Arquitectura', 'Acero Inoxidable 316L con PVD Dorado y Plata', 45, 16, 2, 1, 0, 'Diseño geométrico para egresados de Ingeniería de la Universidad José Antonio Páez (UJAP). Resistente al uso continuo en obras e industrias sin rayarse ni perder color.', 'Tallas 7 a la 13', 'Zafiro Azul Medianoche', '["images/prod_7_grado_ujap_ingenieria.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (8, 'Anillo de Grado - Administración y Contaduría', 'Plata Ley 925 Maciza', 50, 19, 2, 1, 0, 'Dedicado a los graduandos en Ciencias Económicas, Administrativas y Contaduría Pública. Piedra verde facetada de alta refracción con grabados comerciales oficiales.', 'Tallas 6 a la 12', 'Esmeralda Verde Esmeralda Facetada', '["images/prod_8_grado_administracion.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (9, 'Anillo Solitario de Compromiso Clásico', 'Plata Ley 925 con Baño de Rodio Platino', 40, 28, 3, 1, 1, 'El anillo de compromiso por excelencia. Circonia central montada en 6 uñas de alta seguridad que capturan la luz desde cualquier ángulo. Incluye caja de presentación para propuesta de matrimonio.', 'Tallas 5 a la 9', 'Zirconia Cúbica Corte Brillante 1.5 ct', '["images/prod_9_solitario_clasico.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (10, 'Anillo Tiara / Corona Real de la Princesa', 'Baño de Oro Rosa 18K sobre Plata 925', 38, 24, 3, 1, 1, 'Diseño inspirado en coronas de la realeza. Silueta en ondas con micropavé brillante que resalta la elegancia de la mano femenina. Ideal para promesa o regalo especial.', 'Tallas 5 a la 8', 'Micro Pavé de Zirconias Suizas', '["images/prod_10_tiara_corona.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (11, 'Anillo de Promesa "Infinito Amor"', 'Acero Inoxidable Quirúrgico 316L Pulido Espejo', 18, 35, 3, 1, 0, 'Símbolo del infinito entrelazado que representa la lealtad y el compromiso eterno. Inalterable al agua, perfumes o sudor.', 'Tallas 5 a la 10', 'Circonia Microengastada', '["images/prod_11_promesa_infinito.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (12, 'Anillo Solitario Halo Cuadrado Imperial', 'Plata Ley 925 Maciza', 48, 15, 3, 1, 0, 'Corte cushion cuadrado rodeado de un halo brillante de gemas suizas. Ofrece el máximo destello y una presencia visual imponente en celebraciones de compromiso.', 'Tallas 5 a la 9', 'Gema Suiza Central con Orla de Brillantes', '["images/prod_12_halo_cuadrado.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (13, 'Trío Matrimonial Imperial (Par de Alianzas + Solitario)', 'Plata Ley 925 Rodiada con Acentos en Oro 18K', 85, 12, 4, 1, 1, 'El combo matrimonial más solicitado de INVERANOLI. Incluye la alianza del novio, la alianza de la novia y el anillo solitario de compromiso que encajan a la perfección. Grabado de nombres y fecha de boda de cortesía.', 'Tallas a medida para él y ella', 'Circonias Cúbicas AAA', '["images/prod_13_trio_matrimonial.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (14, 'Dúo de Alianzas Clásicas Media Caña 4mm', 'Acero Inoxidable 316L Dorado 18K PVD', 28, 30, 4, 1, 1, 'Par de alianzas de boda tradicionales con perfil abombado de 4 mm y tecnología confort interior para uso diario continuo. No se decoloran ni causan alergias.', 'Tallas 5 a la 13', 'Lisas sin piedras / Confort Fit', '["images/prod_14_duo_alianzas_oro.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (15, 'Dúo de Alianzas Diamantadas Bicolor', 'Plata Ley 925 con Franja de Oro Amarillo', 70, 14, 4, 1, 0, 'Combinación elegante de plata y baño de oro con un grabado diamantado que brilla al contacto con la luz. La alianza de dama cuenta con 3 gemas empotradas.', 'Tallas 5 a la 12', 'Canal Satinado con 3 Circonias en la dama', '["images/prod_15_duo_diamantadas.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (16, 'Cadena Tejido Cubano (Cuban Link) 5mm x 55cm', 'Acero Inoxidable Quirúrgico 316L Dorado', 20, 40, 5, 1, 1, 'Tejido cubano de eslabones pulidos y aplanados. Pieza versátil y de máxima tendencia urbana para caballeros o damas.', '55 cm de largo / 5 mm de ancho', 'Sin piedras / Cierre tipo langosta reforzado', '["images/prod_16_cadena_cubana.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (17, 'Collar Punto de Luz Solitario', 'Plata Ley 925 Rodiada Cadena Veneciana 45cm', 24, 32, 5, 1, 1, 'Gargantilla minimalista ultra elegante. La piedra parece flotar sobre el cuello, otorgando un toque de distinción en ocasiones especiales o uso cotidiano.', '45 cm con extensión de 5 cm', 'Zirconia Cúbica 7mm Biselada', '["images/prod_17_punto_de_luz.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (18, 'Cadena Militar con Placa de Identificación Grabable', 'Acero Quirúrgico 316L Plateado Mate', 16, 35, 5, 1, 0, 'Placa grabable de doble faz para inscripción de nombres, fechas especiales, grupo sanguíneo o mensajes de amor y graduación.', 'Cadena de 60 cm y placa de 4.5 cm', 'Sin piedras', '["images/prod_18_cadena_militar_placa.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (19, 'Dije de Graduación Birrete con Diploma 2026', 'Plata Ley 925 Esmaltada con Circonias', 18, 38, 6, 1, 1, 'Dije conmemorativo del logro académico. Representa el birrete y el pergamino de grado. Compatible con cadenas de hasta 4 mm y pulseras Pandora.', '2.5 cm de alto', 'Microcirconias en borla del birrete', '["images/prod_19_dije_birrete_2026.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (20, 'Medalla Devocional Nuestra Señora del Socorro', 'Plata Ley 925 Patrona de Valencia', 26, 20, 6, 1, 0, 'Hermosa imagen en relieve de la Virgen del Socorro, patrona canónica de Valencia, Carabobo. Reverso con la bendición papal.', 'Diámetro 22 mm', 'Borde tallado diamantado', '["images/prod_20_medalla_virgen_socorro.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (21, 'Dije de Cruz Facetada Tridimensional', 'Acero Inoxidable 316L Dorado 18K', 15, 45, 6, 1, 0, 'Cruz clásica de corte elegante con diseño facetado que refleja la luz. Inmune a la oxidación y compatible con todo tipo de cadenas.', '4.0 cm de altura', 'Sin piedras / Pulido bicelado', '["images/prod_21_cruz_facetada.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (22, 'Esclava de Grado para Caballero Eslabón Grumet', 'Acero Inoxidable Quirúrgico 316L con Placa', 22, 25, 7, 1, 1, 'Pulsera esclava maciza para caballeros. Placa central pulida para grabar el nombre del graduando y la mención de bachiller o universitario.', '21 cm ajustable', 'Sin piedras / Placa lista para grabado', '["images/prod_22_esclava_caballero.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (23, 'Pulsera Tenis de Circonias Suizas', 'Plata Ley 925 Rodiada con Doble Broche de Seguridad', 42, 18, 7, 1, 1, 'La icónica pulsera de tenis que combina con vestidos de gala o looks ejecutivos. Cierre tipo caja con doble seguro lateral.', '17 cm y 19 cm', 'Circonias Cúbicas Redondas de 3mm en Hilera Continua', '["images/prod_23_pulsera_tenis.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (24, 'Semanario 7 Días de la Buena Fortuna', 'Acero Inoxidable Quirúrgico Dorado 18K', 24, 22, 7, 1, 0, 'Tradicional semanario de 7 aros independientes que simbolizan cada día de la semana para atraer prosperidad, salud y éxito profesional.', 'Diámetro 6.5 cm', '7 Aros con diferentes texturas diamantadas', '["images/prod_24_semanario_7_dias.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (25, 'Zarcillos Abridores para Bebé / Niña', 'Plata Ley 925 con Rosca Protectora Antiahogo', 16, 35, 8, 1, 1, 'Aretes hipoalergénicos ideales para la primera postura o regalo de nacimiento y bautizo. Su rosca de tope evita molestias detrás de la oreja.', 'Poste fino especial de 0.8 mm', 'Perla Cultivada o Circonia Rosa', '["images/prod_25_zarcillos_abridores.jpg"]');
INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (26, 'Aretes Huggies Diamantados con Circonias', 'Acero Quirúrgico Dorado 18K con Cierre Click', 14, 40, 8, 1, 0, 'Argollas pequeñas que abrazan el lóbulo con comodidad total para dormir o bañarse sin riesgo de caída.', 'Diámetro 12 mm', 'Microcirconias incrustadas', '["images/prod_26_aretes_huggies.jpg"]');

-- ====================================================================
-- USUARIO ADMINISTRADOR POR DEFECTO (Cédula: 12345678 | Clave: Admin123*)
-- ====================================================================
INSERT OR IGNORE INTO usuarios (id, nombre, apellido, cedula, telefono, email, password_hash, sal, rol) VALUES (1, 'Administrador', 'INVERANOLI', '12345678', '04125006377', 'admin@inveranoli.com', 'fd15ea42992d9435e0bfbb556f21bafba0a313209eb9328c4cdc4f7e5d299ba6', 'sal_admin_inveranoli_2026', 'admin');
