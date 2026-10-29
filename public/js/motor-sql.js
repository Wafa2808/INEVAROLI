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

  var TABLAS = ['usuarios', 'categorias', 'productos', 'ordenes', 'detalle_ordenes', 'fabricas', 'pedidos_entrada'];

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

    // 1. Usar memoria de ventana si ya tiene datos
    if (typeof window !== 'undefined' && window._INVERANOLI_DB_STORE && Array.isArray(window._INVERANOLI_DB_STORE[clave]) && window._INVERANOLI_DB_STORE[clave].length > 0) {
      return window._INVERANOLI_DB_STORE[clave];
    }

    // 2. Usar Api si está disponible
    if (typeof Api !== 'undefined' && Api && typeof Api.leer === 'function') {
      var datosApi = Api.leer(clave, null);
      if (datosApi && Array.isArray(datosApi)) {
        if (typeof window !== 'undefined' && window._INVERANOLI_DB_STORE) {
          window._INVERANOLI_DB_STORE[clave] = datosApi;
        }
        return datosApi;
      }
    }

    // 3. Intentar localStorage directamente
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

    // 4. Fallback en memoria de ventana
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

    // Persistencia hacia el archivo schema.sql si es usuario, producto o fábrica
    if (tabla === 'usuarios' || tabla === 'productos' || tabla === 'fabricas') {
      sincronizarSentenciaSQLConServidor(tabla, 'INSERT', registro);
    }

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
    var registrosEliminados = [];

    if (typeof filtro === 'function') {
      filtradas = filas.filter(function (reg) {
        var excluir = filtro(reg);
        if (excluir) registrosEliminados.push(reg);
        return !excluir;
      });
    } else if (typeof filtro === 'object' && filtro !== null) {
      filtradas = filas.filter(function (reg) {
        var match = true;
        for (var k in filtro) {
          if (filtro.hasOwnProperty(k) && reg[k] !== filtro[k]) {
            match = false;
            break;
          }
        }
        if (match) registrosEliminados.push(reg);
        return !match;
      });
    } else {
      filtradas = [];
      registrosEliminados = filas.slice();
    }
    var eliminados = longitudInicial - filtradas.length;
    if (eliminados > 0) {
      persistirTabla(tabla, filtradas);

      // Si se eliminan productos, recordar sus IDs para no resucitarlos al sincronizar con el servidor
      if (tabla === 'productos') {
        try {
          var listaDel = [];
          if (typeof localStorage !== 'undefined') {
            var rawDel = localStorage.getItem('db_inveranoli_productos_eliminados');
            if (rawDel) listaDel = JSON.parse(rawDel) || [];
          }
          registrosEliminados.forEach(function (r) {
            if (r && r.id && listaDel.indexOf(r.id) === -1) {
              listaDel.push(r.id);
            }
          });
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('db_inveranoli_productos_eliminados', JSON.stringify(listaDel));
          }
        } catch (e) {}
      }
    }
    return eliminados;
  }

  // Gestión formal de stock segmentado por tallas para joyería
  function extraerListaTallas(tallasStr) {
    var raw = tallasStr || '';
    var m = raw.match(/Tallas?\s+(\d+)\s+a\s+la\s+(\d+)/i);
    if (m) {
      var min = parseInt(m[1], 10);
      var max = parseInt(m[2], 10);
      var list = [];
      for (var i = min; i <= max; i++) list.push(String(i));
      return list;
    } else if (/para él y ella/i.test(raw)) {
      return ['Talla 6', 'Talla 7', 'Talla 8', 'Talla 9', 'Talla 10', 'Talla 11'];
    } else if (/17 cm y 19 cm/i.test(raw)) {
      return ['17 cm', '19 cm'];
    } else if (/ajustable/i.test(raw)) {
      return ['19 cm', '21 cm'];
    } else if (raw.indexOf(',') !== -1) {
      return raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    }
    return ['Estándar'];
  }

  function obtenerStockTallas(producto) {
    if (!producto) return {};
    if (producto.stock_tallas && typeof producto.stock_tallas === 'object') {
      return producto.stock_tallas;
    }
    if (typeof producto.stock_tallas === 'string') {
      try {
        var parseado = JSON.parse(producto.stock_tallas);
        if (parseado && typeof parseado === 'object') {
          producto.stock_tallas = parseado;
          return parseado;
        }
      } catch (e) {}
    }

    var tallasList = extraerListaTallas(producto.tallas);
    var res = {};
    var baseStockPorTalla = 5;
    tallasList.forEach(function (t) {
      res[t] = baseStockPorTalla;
    });

    // Calcular el stock total sumando todas las tallas
    var totalSuma = 0;
    for (var k in res) {
      if (res.hasOwnProperty(k)) totalSuma += Number(res[k]) || 0;
    }
    producto.stock_tallas = res;
    producto.stock = totalSuma;

    // Actualizar producto en la base de datos
    actualizar('productos', function (p) { return p.id === producto.id; }, {
      stock_tallas: res,
      stock: totalSuma
    });

    return res;
  }

  function guardarStockTallas(productoId, stockTallasObj) {
    var prod = consultar('productos', function (p) { return p.id === Number(productoId); })[0];
    if (!prod) return null;

    var totalSuma = 0;
    for (var k in stockTallasObj) {
      if (stockTallasObj.hasOwnProperty(k)) {
        var cant = Math.max(0, parseInt(stockTallasObj[k], 10) || 0);
        stockTallasObj[k] = cant;
        totalSuma += cant;
      }
    }

    prod.stock_tallas = stockTallasObj;
    prod.stock = totalSuma;

    actualizar('productos', function (p) { return p.id === prod.id; }, {
      stock_tallas: stockTallasObj,
      stock: totalSuma
    });

    return { stock_tallas: stockTallasObj, stock: totalSuma };
  }

  function actualizarStockTalla(productoId, talla, delta) {
    var prod = consultar('productos', function (p) { return p.id === Number(productoId); })[0];
    if (!prod) return null;

    var st = obtenerStockTallas(prod);
    var tallaKey = null;

    // Búsqueda exacta o normalizada de la talla
    if (st.hasOwnProperty(talla)) {
      tallaKey = talla;
    } else {
      var tallaNorm = String(talla).trim().toLowerCase().replace(/^talla\s*/i, '');
      for (var k in st) {
        if (st.hasOwnProperty(k)) {
          var kNorm = String(k).trim().toLowerCase().replace(/^talla\s*/i, '');
          if (kNorm === tallaNorm) {
            tallaKey = k;
            break;
          }
        }
      }
    }

    if (!tallaKey) {
      // Si la talla no existía en el diccionario, usar la primera o registrarla
      var keys = Object.keys(st);
      tallaKey = keys.length ? keys[0] : (talla || 'Estándar');
    }

    var actualCant = Number(st[tallaKey]) || 0;
    var nuevaCant = Math.max(0, actualCant + Number(delta));
    st[tallaKey] = nuevaCant;

    // Recalcular stock total sumando cada talla
    var totalSuma = 0;
    for (var tk in st) {
      if (st.hasOwnProperty(tk)) totalSuma += Number(st[tk]) || 0;
    }

    prod.stock_tallas = st;
    prod.stock = totalSuma;

    actualizar('productos', function (p) { return p.id === prod.id; }, {
      stock_tallas: st,
      stock: totalSuma
    });

    return { producto: prod, talla: tallaKey, stock_talla: nuevaCant, stock_total: totalSuma };
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

  // Sincroniza productos y categorías directamente desde el Servidor de Base de Datos
  // Soporta conexión multi-candidato inteligente para Windows 7 (mismo origen, 127.0.0.1 y localhost)
  async function sincronizarDesdeServidorBD(urlServidor) {
    var candidatos = [];

    // 1. Si se pasó una URL específica, intentarla primero
    if (urlServidor) {
      candidatos.push(urlServidor);
    }

    // 2. Mismo origen relativo (puerto actual, ej. 3000). Sin CORS y con latencia 0.
    if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.indexOf('http') === 0) {
      candidatos.push(window.location.origin + '/api/database');
      if (window.location.hostname) {
        candidatos.push('http://' + window.location.hostname + ':3001/api/database');
      }
    }

    // 3. Fallbacks directos por IP 127.0.0.1 (evita resolución fallida de IPv6 en Windows 7)
    candidatos.push('http://127.0.0.1:3001/api/database');
    candidatos.push('http://127.0.0.1:3000/api/database');

    // 4. Fallbacks por localhost
    candidatos.push('http://localhost:3001/api/database');
    candidatos.push('http://localhost:3000/api/database');

    // Filtrar candidatos únicos manteniendo orden
    var urls = [];
    for (var i = 0; i < candidatos.length; i++) {
      if (urls.indexOf(candidatos[i]) === -1) {
        urls.push(candidatos[i]);
      }
    }

    var ultimoError = 'Servidor de base de datos no disponible';

    for (var j = 0; j < urls.length; j++) {
      var candidateUrl = urls[j];
      try {
        var sep = candidateUrl.indexOf('?') === -1 ? '?' : '&';
        var resp = await fetch(candidateUrl + sep + 't=' + Date.now(), { cache: 'no-store' });
        if (resp && resp.ok) {
          var datos = await resp.json();
          if (datos && datos.disponible && Array.isArray(datos.productos)) {
            // Recuperar lista de productos eliminados para no reintroducirlos
            var listaEliminados = [];
            try {
              if (typeof localStorage !== 'undefined') {
                var rawDel = localStorage.getItem('db_inveranoli_productos_eliminados');
                if (rawDel) listaEliminados = JSON.parse(rawDel) || [];
              }
            } catch (e) {}

            var prodsExistentes = obtenerTabla('productos');
            var prodsFinales = [];

            if (prodsExistentes && prodsExistentes.length > 0) {
              var mapaExistentes = {};
              for (var ex = 0; ex < prodsExistentes.length; ex++) {
                mapaExistentes[prodsExistentes[ex].id] = prodsExistentes[ex];
              }

              // Fusionar productos del servidor preservando stock, tallas, pausas y ediciones
              (datos.productos || []).forEach(function (pServ) {
                if (listaEliminados.indexOf(pServ.id) !== -1) {
                  return; // Joya eliminada por el administrador, omitir
                }
                var pLocal = mapaExistentes[pServ.id];
                if (pLocal) {
                  // Conservar inventario y tallas dinámicas
                  pServ.stock = (typeof pLocal.stock === 'number') ? pLocal.stock : pServ.stock;
                  if (pLocal.stock_tallas) {
                    pServ.stock_tallas = pLocal.stock_tallas;
                  }
                  if (pLocal.activo !== undefined) {
                    pServ.activo = pLocal.activo;
                  }
                  if (pLocal.recomendado !== undefined) {
                    pServ.recomendado = pLocal.recomendado;
                  }
                  if (pLocal.nombre) pServ.nombre = pLocal.nombre;
                  if (pLocal.precio !== undefined) pServ.precio = pLocal.precio;
                  if (pLocal.presentacion) pServ.presentacion = pLocal.presentacion;
                  if (pLocal.tallas) pServ.tallas = pLocal.tallas;
                  if (pLocal.descripcion) pServ.descripcion = pLocal.descripcion;
                  if (pLocal.piedras) pServ.piedras = pLocal.piedras;
                  if (pLocal.imagenes && pLocal.imagenes.length) pServ.imagenes = pLocal.imagenes;
                  delete mapaExistentes[pServ.id];
                }
                prodsFinales.push(pServ);
              });

              // Mantener productos creados por el admin que no existen en el servidor
              for (var idRestante in mapaExistentes) {
                if (mapaExistentes.hasOwnProperty(idRestante)) {
                  var pRest = mapaExistentes[idRestante];
                  if (pRest && listaEliminados.indexOf(pRest.id) === -1) {
                    prodsFinales.push(pRest);
                  }
                }
              }
            } else {
              prodsFinales = (datos.productos || []).filter(function (p) {
                return listaEliminados.indexOf(p.id) === -1;
              });
            }

            // Asegurar que cada joya tenga sus tallas y stock inicializados
            prodsFinales.forEach(function (prod) {
              obtenerStockTallas(prod);
            });

            persistirTabla('categorias', datos.categorias || []);
            persistirTabla('productos', prodsFinales);
            return {
              conectado: true,
              productos: prodsFinales.length,
              categorias: (datos.categorias || []).length,
              url_origen: candidateUrl
            };
          }
        }
      } catch (e) {
        ultimoError = e.message || 'Error al conectar';
      }
    }

    // Si ningún servidor respondió, la base de datos no está disponible (0 productos, 0 categorías)
    persistirTabla('categorias', []);
    persistirTabla('productos', []);
    return {
      conectado: false,
      productos: 0,
      categorias: 0,
      error: ultimoError
    };
  }

  // Construye la sentencia SQL y la envía a /api/guardar_sql para persistencia permanente en database/schema.sql
  function sincronizarSentenciaSQLConServidor(tabla, operacion, registro) {
    if (typeof window === 'undefined') return;

    var sentencia = '';
    if (tabla === 'usuarios' && operacion === 'INSERT') {
      var sal = registro.sal || 'sal_defecto';
      var hash = registro.password_hash || '';
      var rol = registro.rol || 'cliente';
      sentencia = "INSERT OR IGNORE INTO usuarios (id, nombre, apellido, cedula, telefono, email, password_hash, sal, rol) VALUES (" +
        registro.id + ", '" +
        (registro.nombre || '').replace(/'/g, "''") + "', '" +
        (registro.apellido || '').replace(/'/g, "''") + "', '" +
        (registro.cedula || '') + "', '" +
        (registro.telefono || '') + "', '" +
        (registro.email || '').replace(/'/g, "''") + "', '" +
        hash + "', '" +
        sal + "', '" +
        rol + "')";
    } else if (tabla === 'productos' && operacion === 'INSERT') {
      var imgsJSON = JSON.stringify(registro.imagenes || ['logo.png']).replace(/'/g, "''");
      sentencia = "INSERT OR IGNORE INTO productos (id, nombre, presentacion, precio, stock, categoria_id, activo, recomendado, descripcion, tallas, piedras, imagenes) VALUES (" +
        registro.id + ", '" +
        (registro.nombre || '').replace(/'/g, "''") + "', '" +
        (registro.presentacion || '').replace(/'/g, "''") + "', " +
        (parseFloat(registro.precio) || 0) + ", " +
        (parseInt(registro.stock, 10) || 0) + ", " +
        (parseInt(registro.categoria_id, 10) || 1) + ", " +
        (registro.activo !== false ? 1 : 0) + ", " +
        (registro.recomendado ? 1 : 0) + ", '" +
        (registro.descripcion || '').replace(/'/g, "''") + "', '" +
        (registro.tallas || '').replace(/'/g, "''") + "', '" +
        (registro.piedras || '').replace(/'/g, "''") + "', '" +
        imgsJSON + "')";
    } else if (tabla === 'fabricas' && operacion === 'INSERT') {
      sentencia = "-- FABRICA REGISTRADA: " + (registro.nombre || '') + " (RIF " + (registro.rif || '') + ")";
    }

    if (!sentencia) return;

    var endpoints = [
      'http://localhost:3001/api/guardar_sql',
      'http://127.0.0.1:3001/api/guardar_sql',
      'http://localhost:3000/api/guardar_sql',
      'http://127.0.0.1:3000/api/guardar_sql'
    ];

    if (window.location && window.location.origin && window.location.origin.indexOf('http') === 0) {
      endpoints.unshift(window.location.origin + '/api/guardar_sql');
    }

    // Enviar asíncronamente con fallback
    (async function () {
      for (var k = 0; k < endpoints.length; k++) {
        try {
          var resp = await fetch(endpoints[k], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql: sentencia })
          });
          if (resp && resp.ok) break;
        } catch (e) {}
      }
    })();
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
    sincronizarDesdeServidorBD: sincronizarDesdeServidorBD,
    obtenerStockTallas: obtenerStockTallas,
    guardarStockTallas: guardarStockTallas,
    actualizarStockTalla: actualizarStockTalla,
    extraerListaTallas: extraerListaTallas
  };
})();
