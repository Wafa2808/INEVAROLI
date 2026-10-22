# INVERANOLI Joyería Fina & Accesorios (@inveranoli2017)

Sistema web comercial de alta gama especializado en **anillos de grado para bachillerato y universidades**, **alianzas de matrimonio**, **anillos de compromiso** y **joyería en acero quirúrgico 316L y plata ley 925**.

Inspirado directamente en la marca comercial física y virtual **Inversiones Anoli (@inveranoli2017)** de Valencia, Estado Carabobo, Venezuela.

Diseñado y optimizado para ejecutarse **100% de manera local y sin dependencias**, con un rendimiento ultra fluido en computadoras antiguas (incluyendo Windows 7 y navegadores ligeros). Se puede inspeccionar y editar directamente con **Bloc de notas**.

---

## 🚀 Cómo ejecutar el proyecto

### Opción 1: Servidor Integrado en Python (¡Recomendado para presentaciones!)
**100% libre de Node.js, npm o pip.** Funciona con cualquier versión de Python (Python 2.7 o Python 3.x) en **Windows 7, 8, 10 u 11** sin permisos de administrador:
1. Haz doble clic en el archivo: **`iniciar_servidor_python.bat`** (o ejecuta en terminal `python servidor_completo.py`).
2. Se levantará automáticamente:
   - 🌐 **Web:** `http://localhost:3000` (se abrirá en tu navegador de inmediato).
   - 🗄️ **Base de Datos:** `http://localhost:3001/api/database` vinculada en tiempo real con `database/schema.sql`.

### Opción 2: Sin servidores (Doble Clic Directo en HTML)
1. Navegar a la carpeta `INVERANOLI/public`.
2. Hacer **doble clic en `index.html`** (o clic derecho > *Abrir con* > Navegador).
3. **¡Listo!** No requiere instalar nada ni tener permisos especiales.

### Opción 3: Modo Node.js (Si está instalado)
Si en el equipo tienes Node.js, puedes hacer doble clic en `iniciar_servidor_bd.bat` o ejecutar:
```bash
npm start
```

---

## 🎨 Identidad Visual y Diseño de Joyería
- **Colores de Marca:** **Oro Imperial (`#D4AF37`)**, **Negro Obsidiana (`#0B0F19`)** y **Azul Terciopelo (`#161E2E`)**, con acentos en oro rosa y plata brillante.
- **Logotipo Oficial Integrado:** Emblema monocromático en alto relieve con diamante y anillo ubicado en `public/logo.png`.
- **Iconografía Oficial Limpia:** Iconos monocromáticos en alta definición (`public/icons/`) para pedidos, carrito, perfil, administración, cerrar sesión, ubicación, horario, búsqueda y WhatsApp.
- **Catálogo Especializado de @inveranoli2017:**
  - **Anillos de Grado - Bachiller:** Modelos en Ciencias y Técnicos con piedra facetada y grabado de promoción.
  - **Anillos de Grado - Universitarios:** Modelos oficiales para la Universidad de Carabobo (UC), Universidad Arturo Michelena (UAM), Universidad José Antonio Páez (UJAP), Medicina, Derecho, Ingeniería, Odontología y Administración.
  - **Compromiso & Promesa:** Solitarios clásicos con circonias suizas de corte brillante y coronas de tiara.
  - **Alianzas de Matrimonio:** Tríos matrimoniales completos (par de alianzas + solitario) y argollas de confort en acero dorado y plata.
  - **Cadenas, Dijes y Esclavas:** Tejido cubano, medalla de Nuestra Señora del Socorro (patrona de Valencia), dijes de birrete 2026 y esclavas grabables para graduandos.

---

## 🗄️ Motor de Base de Datos Relacional Puro (`MotorSQL`)
El proyecto cuenta con un motor de base de datos relacional puro en JavaScript (`public/js/motor-sql.js`), el cual implementa fielmente el esquema definido en `database/schema.sql`:

* **`usuarios`:** Clientes y administradores con contraseñas protegidas mediante Hash SHA-256 + Sal criptográfica.
* **`categorias`:** Clasificación por familias de joyas (8 categorías iniciales).
* **`productos`:** Catálogo de 26+ joyas con control de stock, precio en USD, materiales, piedras, tallas, descuentos y estado activo/pausado.
* **`ordenes`:** Registro maestro de pedidos de los clientes.
* **`detalle_ordenes`:** Desglose de cada joya comprada por orden con su grabado personalizado (relación 1 a N con `productos`).

### Características del Motor:
- **Operaciones CRUD completas:** `insertar`, `consultar`, `actualizar` y `eliminar`.
- **Consultas con JOIN:** Reconstrucción relacional de pedidos y joyas para el historial del usuario.
- **Transacciones Atómicas (ACID):** Validación simultánea de inventario, inserción de orden, detalle y descuento de stock atómico.

---

---

## 🔑 Cuentas Preconfiguradas para Pruebas (1-Clic en el Modal)

El sistema incluye dos usuarios precargados en la base de datos relacional (con contraseña cifrada en SHA-256 y sal única):

### 1. Usuario Administrador (`admin`):
* **Cédula:** `12345678`
* **Contraseña:** `Admin123*`
* **Nombre:** Alejandro Morales
* **Acceso:** Panel de Administración completo (botón **Admin** en la cabecera).
* **Funciones:** Gestión de inventario de joyas, alta de nuevas piezas, pausar/activar productos, eliminar piezas, gestión de categorías y seguimiento de órdenes de clientes con cambio de estados.

### 2. Usuario Cliente (`cliente`):
* **Cédula:** `20123456`
* **Contraseña:** `Cliente123*`
* **Nombre:** Mauricio Valencia
* **Teléfono:** 0414-1234567
* **Acceso:** Catálogo, agregar al pedido, lista de deseos/favoritos, carrito drawer, checkout multi-paso e historial de pedidos.

> **Acceso Inmediato en 1 Clic:** Al abrir el modal de autenticación (`Ingresar`), en la columna izquierda se encuentran los botones de acceso rápido `👔 Admin: 12345678` y `💎 Cliente: 20123456`. Al hacer clic en cualquiera de ellos, las credenciales se completan automáticamente en el formulario.

### ⚡ Reposición de Stock Inmediata (+ Stock):
Para agregar más unidades al inventario sin abrir la base de datos:
1. Inicia sesión con la cuenta de Administrador (`12345678` / `Admin123*`).
2. Haz clic en el botón **Admin** en la cabecera.
3. En la tabla de inventario, haz clic en el botón verde **`+ Stock`** junto a la joya deseada.
4. Aparecerá un cuadro de diálogo elegante integrado en la página (sin popups feos del navegador) solicitando la cantidad.
5. Ingresa la cantidad de unidades que llegaron (ejemplo: `5`, `10`, `25`).
6. El sistema sumará la cantidad automáticamente a la base de datos, notificará con un toast flotante y actualizará el inventario en tiempo real.

---

## 💎 Características Exclusivas de Joyería Implementadas

1. **Precios Oficiales de Joyería (Sin Promociones ni Descuentos):**
   - De acuerdo a las políticas de orfebrería de @inveranoli2017, las piezas se comercializan con sus precios estándar de taller orfebre, eliminando etiquetas de descuento o promociones engañosas.
2. **Imágenes Independientes para Cada Pieza (26 Joyas):**
   - Cada producto cuenta con su propia ilustración vectorial SVG en alta resolución en `public/images/` (`prod_1_...svg` hasta `prod_26_...svg`), representando con exactitud el anillo de grado por carrera (Ciencias, UC Medicina, Derecho, Odontología, UAM, UJAP), solitarios, alianzas diamantadas, cadenas cubanas o dijes de la Virgen del Socorro.
3. **Notificaciones y Cuadros de Diálogo en Página (Cero `alert()` nativos):**
   - Todos los mensajes de éxito, advertencia y error se muestran mediante **Toasts Flotantes** dorados/verdes/rojos (`public/js/notificaciones.js`).
   - Los diálogos de confirmación y solicitud de stock (`+ Stock`, eliminar, nueva categoría) se abren como modales integrados con fondo difuminado dentro de la estética oscura y dorada del sitio.
4. **Diseño Luxury Atelier del Modal de Acceso:**
   - Estructura split (panel doble) con monograma de la orfebrería, propuesta de valor de la tienda y botones de prueba en el lateral izquierdo, y pestañas de acceso y registro en el lateral derecho.
5. **Máximo Contraste y Legibilidad en el Panel de Administración:**
   - Nombres de joyas en blanco puro (`#ffffff`), especificaciones de orfebrería en dorado brillante (`#e5c158`) y precios destacados sobre fondo azul medianoche profundo, garantizando 100% de legibilidad sin textos oscuros ilegibles.

---

## 🛡️ Validaciones y Reglas de Negocio Estrictas

### 1. Acceso y Pedido de Joyería
* **Autenticación obligatoria:** Para agregar joyas al pedido, el usuario debe tener una sesión iniciada. Si no está autenticado, la acción se cancela y se abre el modal de ingreso.
* **Separación de roles:** Las cuentas de tipo `admin` están destinadas a la gestión y no pueden armar carritos de compras.
* **Límite de compra:** Máximo **5 unidades** por producto por orden.
* **Validación de stock en tiempo real:** Impide agregar más unidades de las disponibles en inventario.
* **Aislamiento de sesión:** Al presionar *Salir*, el carrito local se vacía para proteger la privacidad del cliente.

### 2. Formularios de Registro y Perfil (Estándar Venezolano)
* **Cédula de Identidad:** Restricción estricta de solo números con límite físico de **7 u 8 dígitos** (`maxlength="8"`).
* **Teléfono Móvil Nacional:** Selector de prefijos venezolanos (`0414`, `0424`, `0412`, `0416`, `0426` con `+58`) acompañado de un campo con límite estricto de **exactamente 7 dígitos numéricos** (`maxlength="7"`).
* **Nombres y Apellidos:** Campos separados, restringidos a solo letras y espacios, con longitud mínima de 2 caracteres y máxima de 35.
* **Correo Electrónico:** Formato con validación de estructura completa (`usuario@dominio.extensión`) y verificación de no duplicidad.
* **Contraseña Estricta:** Longitud de 8 a 16 caracteres (`maxlength="16"`), exigiendo mayúsculas, minúsculas, números y caracteres especiales, con medidor dinámico de seguridad.
* **Modificación de Perfil:** Requiere ingresar y comprobar la contraseña actual antes de autorizar cualquier cambio de clave, impidiendo reutilizar la misma clave.

### 3. Panel de Administración
* **Alta de Joyas:** Validación de nombre (mínimo 2 letras), precio mayor a `$0` y stock entero no negativo.
* **Reposición de Inventario:** Exige cantidades enteras positivas mayores a 0, evitando valores no válidos o corrupción de datos.
* **Bloqueo tras 5 intentos fallidos:** Suspensión temporal automática de la cuenta por 3 minutos con contador regresivo.
* **Expiración de Sesión:** Cierre automático por inactividad tras 15 minutos sin interacción.

---

## 🛒 Proceso de Compra (Checkout Multi-Paso)
1. **Paso 1 (Resumen):** Desglose detallado de joyas, cantidades, grabados personalizados y subtotal en USD y Bolívares (Tasa Oficial BCV).
2. **Paso 2 (Despacho / Retiro):** Selección entre Retiro en Tienda Física (CC Gran Bazar, Av. Lara, Valencia) o Envío Nacional (MRW, Zoom, Tealca) a cualquier estado de Venezuela.
3. **Paso 3 (Métodos de Pago):** Pago Móvil (Banesco/BDV), Transferencia Bancaria Nacional, Efectivo en Tienda (USD/Bs) y Zelle, con instrucciones y campo de referencia bancaria.
4. **Paso 4 (Confirmación & WhatsApp):** Resumen consolidado del pedido, guardado en base de datos, descuento de inventario, vaciado de carrito y apertura de WhatsApp con el mensaje estructurado para el asesor de INVERANOLI.

---

## ⚙️ Parámetros de Configuración (`config.js`)
Los datos comerciales principales se encuentran centralizados en `public/js/config.js` con marcadores limpios para que puedas ingresar el RIF y número de WhatsApp definitivo:

```javascript
var INVERANOLI_CONFIG = {
  nombre: 'INVERANOLI Joyería',
  instagram: '@inveranoli2017',
  whatsapp: '584247085796', // Editable
  rif: 'J-00000000-0',       // Editable
  direccion: 'Centro Comercial Gran Bazar, Av. Lara, Planta Baja, Valencia, Edo. Carabobo',
  ...
};
```

---

## 📁 Estructura del Proyecto

```text
INVERANOLI/
├── database/
│   └── schema.sql              # Esquema relacional formal en SQLite
├── public/
│   ├── index.html              # Estructura principal y semántica de la aplicación
│   ├── logo.png                # Logotipo oficial de INVERANOLI Joyería
│   ├── css/
│   │   ├── styles.css          # Estilos globales, paleta oro/negro y tarjetas
│   │   ├── modales.css         # Ventanas emergentes, carrusel y checkout
│   │   └── admin.css           # Panel de control de inventario y tablas
│   ├── icons/                  # Iconografía en alta definición
│   │   ├── admin.png
│   │   ├── cart.png
│   │   ├── clock.png
│   │   ├── location.png
│   │   ├── logout.png
│   │   ├── pedidos.png
│   │   ├── search.png
│   │   ├── user.png
│   │   └── whatsapp.png
│   ├── images/                 # Banners oficiales y fotos de productos
│   │   ├── banner_joyas.jpg
│   │   ├── banner_grado.jpg
│   │   ├── banner_bodas.jpg
│   │   ├── anillo_grado.jpg
│   │   └── anillo_compromiso.jpg
│   └── js/
│       ├── config.js           # Parámetros editables (WhatsApp, RIF, cuentas)
│       ├── productos.js        # Catálogo base ampliado de joyas y categorías
│       ├── api.js              # Capa de almacenamiento y persistencia
│       ├── seguridad.js        # Algoritmo SHA-256 + Sal y timeout de sesión
│       ├── validaciones.js     # Validaciones venezolanas y medidor de contraseña
│       ├── bloqueo.js          # Control de intentos fallidos (5 intentos / 3 min)
│       ├── motor-sql.js        # Motor relacional SQL en cliente (SQLite virtual)
│       ├── tasa-bcv.js         # Conversor de tasa oficial BCV en vivo
│       ├── favoritos.js        # Lista de joyas favoritas
│       ├── cart.js             # Lógica del carrito de compras y stock
│       ├── detalle-producto.js # Ficha técnica, carrusel y personalización de grabado
│       ├── carrusel-inicio.js  # Banners interactivos de inicio y promociones
│       ├── checkout.js         # Flujo de compra completo en 4 pasos
│       ├── pedidos.js          # Historial de pedidos con consultas JOIN
│       ├── auth.js             # Autenticación, registro y perfil de cliente
│       ├── admin.js            # Panel de inventario y reposición de stock (+ Stock)
│       └── main.js             # Inicialización de eventos e interfaz
├── package.json                # Servidor estático opcional sin dependencias
├── Adiciones_INVERANOLI.txt     # Matriz de requerimientos técnicos cumplidos
└── README.md                   # Documentación completa del proyecto
```
