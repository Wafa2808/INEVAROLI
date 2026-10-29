// ====================================================================
// INVERANOLI Joyería (@inveranoli2017)
// Arquitectura 100% Externa y Dependiente de Base de Datos
// 
// Los productos y categorías no se guardan en el frontend.
// Dependen 100% de la carga desde database/schema.sql a través del
// Servidor de Base de Datos (Python o Node.js).
// Si el servidor no se inicia, la página muestra 0 productos.
// ====================================================================

var CATEGORIAS_INICIALES = [];
var PRODUCTOS_INICIALES = [];
