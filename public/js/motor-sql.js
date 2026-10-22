/**
 * motor-sql.js — Motor de Base de Datos Relacional SQL Puro en Cliente
 * Compatible 100% con Windows 7, file:/// y computadoras de bajos recursos.
 * Implementa el esquema relacional formal para INVERANOLI Joyería (@inveranoli2017).
 * 
 * Tablas:
 * - usuarios (id, nombre, apellido, cedula, telefono, email, password_hash, sal, rol)
 * - categorias (id, nombre, descripcion)
 * - productos (id, nombre, presentacion, precio, stock, categoria_id, activo, descuento, recomendado, descripcion, tallas, piedras, imagenes)
 * - ordenes (id, usuario_id, fecha, total, metodo_pago, despacho, estado)
 * - detalle_ordenes (id, orden_id, producto_id, cantidad, precio_unitario, personalizacion)
 */

var MotorSQL = (function () {
  'use strict';

  var TABLAS = ['usuarios', 'categorias', 'productos', 'ordenes', 'detalle_ordenes'];

  // Cache en memoria por si el navegador opera en modo estricto de file:///
  if (typeof window !== 'undefined' && !window._INVERANOLI_DB_STORE) {
    window._INVERANOLI_DB_STORE = {};
  }

  function claveTabla(nombre) {
    return 'db_inveranoli_' + nombre;
  }

  // Obtiene los registros de una tabla
  function obtenerTabla(nombre) {
    var clave = claveTabla(nombre);
    
    // Regla estricta: productos y categorías NO se leen de almacenamiento local persistente
    // Dependen 100% de la conexión con el servidor de base de datos (puerto 3001)
    if (nombre === 'productos' || nombre === 'categorias') {
      if (typeof window !== 'undefined' && window._INVERANOLI_DB_STORE && Array.isArray(window._INVERANOLI_DB_STORE[clave])) {
        return window._INVERANOLI_DB_STORE[clave];
      }
      return [];
    }

    // 1. Usar Api si está disponible
    if (typeof Api !== 'undefined' && Api && typeof Api.leer === 'function') {
      var datosApi = Api.leer(clave, null);
      if (datosApi && Array.isArray(datosApi)) {
        if (typeof window !== 'undefined' && window._INVERANOLI_DB_STORE) {
          window._INVERANOLI_DB_STORE[clave] = datosApi;
        }
        return datosApi;
      }
    }

    // 2. Intentar localStorage directamente
    try {
      if (typeof localStorage !== 'undefined') {
        var raw = localStorage.getItem(clave);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            if (typeof window !== 'undefined' && window._INVERANOLI_DB_STORE) {
              window._INVERANOLI_DB_STORE[clave] = parsed;
            }
            return parsed;
          }
        }
      }
    } catch (e) {}

    // 3. Fallback en memoria de ventana
    if (typeof window !== 'undefined' && window._INVERANOLI_DB_STORE && Array.isArray(window._INVERANOLI_DB_STORE[clave])) {
      return window._INVERANOLI_DB_STORE[clave];
    }

    return [];
  }

  // Persiste la tabla en almacenamiento
  function persistirTabla(nombre, filas) {
    var clave = claveTabla(nombre);
    
    if (typeof window !== 'undefined' && window._INVERANOLI_DB_STORE) {
      window._INVERANOLI_DB_STORE[clave] = filas;
    }

    // Regla estricta: productos y categorías NO se guardan en almacenamiento local persistente
    // Dependen 100% de la conexión con el servidor de base de datos (puerto 3001)
    if (nombre === 'productos' || nombre === 'categorias') {
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(clave);
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(clave);
      } catch (e) {}
      return;
    }

    if (typeof Api !== 'undefined' && Api && typeof Api.guardar === 'function') {
      try {
        Api.guardar(clave, filas);
      } catch (e) {}
    } else {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(clave, JSON.stringify(filas));
        }
      } catch (e) {}
    }
  }

  // Generador de ID autoincremental
  function siguienteId(nombre) {
    var filas = obtenerTabla(nombre);
    if (!filas.length) return 1;
    var max = 0;
    for (var i = 0; i < filas.length; i++) {
      if (typeof filas[i].id === 'number' && filas[i].id > max) {
        max = filas[i].id;
      }
    }
    return max + 1;
  }

  // INSERT INTO <table> VALUES (...)
  function insertar(tabla, registro) {
    if (TABLAS.indexOf(tabla) === -1) {
      throw new Error('Tabla inexistente: ' + tabla);
    }
    var filas = obtenerTabla(tabla);
    if (registro.id === undefined || registro.id === null) {
      registro.id = siguienteId(tabla);
    }
    filas.push(registro);
    persistirTabla(tabla, filas);
    return registro;
  }

  // SELECT * FROM <table> WHERE <filtro>
  function consultar(tabla, filtro) {
    if (TABLAS.indexOf(tabla) === -1) {
      throw new Error('Tabla inexistente: ' + tabla);
    }
    var filas = obtenerTabla(tabla);
    if (typeof filtro === 'function') {
      return filas.filter(filtro);
    }
    return filas.slice(); // Retorna copia
  }

  // UPDATE <table> SET <cambios> WHERE <filtro>
  function actualizar(tabla, filtro, cambios) {
    if (TABLAS.indexOf(tabla) === -1) {
      throw new Error('Tabla inexistente: ' + tabla);
    }
    var filas = obtenerTabla(tabla);
    var modificados = 0;
    for (var i = 0; i < filas.length; i++) {
      var match = false;
      if (typeof filtro === 'function') {
        match = filtro(filas[i]);
      } else if (typeof filtro === 'object' && filtro !== null) {
        match = true;
        for (var k in filtro) {
          if (filtro.hasOwnProperty(k) && filas[i][k] !== filtro[k]) {
            match = false;
            break;
          }
        }
      }
      if (match) {
        for (var prop in cambios) {
          if (cambios.hasOwnProperty(prop)) {
            filas[i][prop] = cambios[prop];
          }
        }
        modificados++;
      }
    }
    if (modificados > 0) {
      persistirTabla(tabla, filas);
    }
    return modificados;
  }

  // DELETE FROM <table> WHERE <filtro>
  function eliminar(tabla, filtro) {
    if (TABLAS.indexOf(tabla) === -1) {
      throw new Error('Tabla inexistente: ' + tabla);
    }
    var filas = obtenerTabla(tabla);
    var longitudInicial = filas.length;
    var filtradas;
    if (typeof filtro === 'function') {
      filtradas = filas.filter(function (reg) {
        return !filtro(reg);
      });
    } else if (typeof filtro === 'object' && filtro !== null) {
      filtradas = filas.filter(function (reg) {
        for (var k in filtro) {
          if (filtro.hasOwnProperty(k) && reg[k] === filtro[k]) {
            return false;
          }
        }
        return true;
      });
    } else {
      filtradas = [];
    }
    var eliminados = longitudInicial - filtradas.length;
    if (eliminados > 0) {
      persistirTabla(tabla, filtradas);
    }
    return eliminados;
  }

  // Consulta JOIN relacional para reconstruir pedidos con productos
  function consultarOrdenesConDetalle(usuarioId) {
    var ordenes = consultar('ordenes', function (o) {
      return usuarioId ? o.usuario_id === usuarioId : true;
    });
    var detalles = consultar('detalle_ordenes');
    var productos = consultar('productos');

    // Mapear productos por id para búsqueda instantánea O(1)
    var prodMap = {};
    for (var i = 0; i < productos.length; i++) {
      prodMap[productos[i].id] = productos[i];
    }

    return ordenes.map(function (orden) {
      var itemsOrden = detalles.filter(function (d) {
        return d.orden_id === orden.id;
      }).map(function (d) {
        var prod = prodMap[d.producto_id] || { nombre: 'Joya no disponible', presentacion: '' };
        return {
          id: d.id,
          orden_id: d.orden_id,
          producto_id: d.producto_id,
          nombre: prod.nombre,
          presentacion: prod.presentacion,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          personalizacion: d.personalizacion || '',
          subtotal: d.cantidad * d.precio_unitario
        };
      });

      return {
        id: orden.id,
        usuario_id: orden.usuario_id,
        fecha: orden.fecha,
        total: orden.total,
        metodo_pago: orden.metodo_pago,
        despacho: orden.despacho,
        estado: orden.estado || 'recibido',
        detalles: itemsOrden
      };
    });
  }

  // Inicializa la base de datos (100% no local)
  function inicializarDatosMaestros(forzar) {
    // Categorías y Productos: 100% dependientes del servidor de base de datos.
    // Si el servidor de BD está apagado, el usuario no verá productos.
    if (forzar) {
      persistirTabla('productos', []);
      persistirTabla('categorias', []);
    }
  }

  // Vaciar una tabla específica
  function vaciarTabla(nombre) {
    if (TABLAS.indexOf(nombre) !== -1) {
      persistirTabla(nombre, []);
      if (nombre === 'productos') {
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('inveranoli_catalogo_vaciado', '1'); } catch (e) {}
      }
    }
  }

  // Vaciar toda la base de datos (desaparece productos y categorías)
  function vaciarBD() {
    TABLAS.forEach(function (t) {
      persistirTabla(t, []);
    });
    try { if (typeof localStorage !== 'undefined') localStorage.setItem('inveranoli_catalogo_vaciado', '1'); } catch (e) {}
  }

  // Carga e interpreta sentencias SQL tipo INSERT INTO para levantar o restaurar datos desde un archivo .sql
  function cargarDesdeSQL(contenidoSQL) {
    if (!contenidoSQL || typeof contenidoSQL !== 'string') return { exito: false, mensaje: 'Contenido SQL vacío' };

    var lineas = contenidoSQL.split('\n');
    var totalProds = 0;
    var totalCats = 0;
    var prods = [];
    var cats = [];

    lineas.forEach(function (linea) {
      var l = linea.trim();
      if (!l || l.indexOf('--') === 0) return;

      // Parsear INSERT INTO categorias ...
      var mCat = l.match(/INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+categorias\s*\(([^)]+)\)\s*VALUES\s*\((.*)\);?/i);
      if (mCat) {
        var colsC = mCat[1].split(',').map(function (c) { return c.trim(); });
        var valsC = parsearValoresSQL(mCat[2]);
        var regC = {};
        colsC.forEach(function (col, idx) { regC[col] = valsC[idx]; });
        if (regC.id && regC.nombre) {
          cats.push(regC);
          totalCats++;
        }
      }

      // Parsear INSERT INTO productos ...
      var mProd = l.match(/INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+productos\s*\(([^)]+)\)\s*VALUES\s*\((.*)\);?/i);
      if (mProd) {
        var colsP = mProd[1].split(',').map(function (c) { return c.trim(); });
        var valsP = parsearValoresSQL(mProd[2]);
        var regP = {};
        colsP.forEach(function (col, idx) {
          var val = valsP[idx];
          if (col === 'imagenes' && typeof val === 'string') {
            try { val = JSON.parse(val); } catch (e) { val = [val]; }
          }
          regP[col] = val;
        });
        if (regP.id && regP.nombre) {
          prods.push(regP);
          totalProds++;
        }
      }
    });

    if (cats.length) persistirTabla('categorias', cats);
    if (prods.length) {
      persistirTabla('productos', prods);
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem('inveranoli_catalogo_vaciado');
      } catch (e) {}
    }

    return {
      exito: true,
      productos: totalProds,
      categorias: totalCats
    };
  }

  // Parser auxiliar de valores SQL separados por comas respetando comillas
  function parsearValoresSQL(cadenaValores) {
    var valores = [];
    var actual = '';
    var enComillas = false;
    var charEscape = false;

    for (var i = 0; i < cadenaValores.length; i++) {
      var c = cadenaValores[i];

      if (c === "'" && !charEscape) {
        if (enComillas && cadenaValores[i + 1] === "'") {
          actual += "'";
          i++; // Saltear escape de comilla doble ''
        } else {
          enComillas = !enComillas;
        }
      } else if (c === ',' && !enComillas) {
        valores.push(limpiarValorSQL(actual));
        actual = '';
      } else {
        actual += c;
      }
    }
    if (actual.trim().length > 0 || valores.length > 0) {
      valores.push(limpiarValorSQL(actual));
    }

    return valores;
  }

  function limpiarValorSQL(val) {
    var v = val.trim();
    if ((v.charAt(0) === "'" && v.charAt(v.length - 1) === "'") ||
        (v.charAt(0) === '"' && v.charAt(v.length - 1) === '"')) {
      v = v.substring(1, v.length - 1).replace(/''/g, "'");
    }
    if (v.toUpperCase() === 'NULL') return null;
    if (v.toUpperCase() === 'TRUE') return 1;
    if (v.toUpperCase() === 'FALSE') return 0;
    if (/^-?\d+$/.test(v)) return parseInt(v, 10);
    if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
    return v;
  }

  // Auto-inicialización
  try {
    inicializarDatosMaestros(false);
  } catch (e) {}

  // Sincroniza productos y categorías directamente desde el Servidor de Base de Datos (puerto 3001)
  async function sincronizarDesdeServidorBD(urlServidor) {
    var url = urlServidor || 'http://localhost:3001/api/database';
    try {
      var resp = await fetch(url + '?t=' + Date.now(), { cache: 'no-store' });
      if (!resp.ok) {
        throw new Error('Servidor de base de datos respondió con código ' + resp.status);
      }
      var datos = await resp.json();
      if (datos && datos.disponible && Array.isArray(datos.productos)) {
        persistirTabla('categorias', datos.categorias || []);
        persistirTabla('productos', datos.productos || []);
        return {
          conectado: true,
          productos: datos.productos.length,
          categorias: (datos.categorias || []).length
        };
      } else {
        // Servidor respondió pero sin datos o archivo no disponible
        persistirTabla('categorias', []);
        persistirTabla('productos', []);
        return {
          conectado: false,
          productos: 0,
          categorias: 0,
          mensaje: datos && datos.mensaje ? datos.mensaje : 'Base de datos vacía o no disponible'
        };
      }
    } catch (err) {
      // Servidor de base de datos no está levantado
      persistirTabla('categorias', []);
      persistirTabla('productos', []);
      return {
        conectado: false,
        productos: 0,
        categorias: 0,
        error: err.message
      };
    }
  }

  return {
    insertar: insertar,
    consultar: consultar,
    actualizar: actualizar,
    eliminar: eliminar,
    consultarOrdenesConDetalle: consultarOrdenesConDetalle,
    inicializarDatosMaestros: inicializarDatosMaestros,
    obtenerTabla: obtenerTabla,
    vaciarTabla: vaciarTabla,
    vaciarBD: vaciarBD,
    cargarDesdeSQL: cargarDesdeSQL,
    sincronizarDesdeServidorBD: sincronizarDesdeServidorBD
  };
})();
