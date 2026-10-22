/**
 * main.js — Orquestador Central y Renderizado de Vistas para INEVAROLI
 * Joyería Fina & Accesorios (@inveranoli2017)
 */

var estado = {
  categoriaActiva: 0, // 0 = Todas
  busqueda: ''
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async function () {
  // 0. Inicializar Tema Visual (Modo Claro por defecto o guardado)
  inicializarTemaVisual();

  // 1. Inicializar base de datos
  MotorSQL.inicializarDatosMaestros(false);

  // 1.1 Consultar al Servidor de Base de Datos (puerto 3001)
  // Si el servidor está apagado, la tienda abre en 0 productos (100% no local)
  await intentarSincronizacionServidorBD();

  // 2. Asegurar precarga de cuentas predeterminadas (Admin y Cliente)
  if (typeof precargarUsuarios === 'function') {
    await precargarUsuarios();
  } else if (typeof precargarAdmin === 'function') {
    await precargarAdmin();
  }

  // 3. Inicializar Tasa BCV
  if (typeof TasaBCV !== 'undefined') {
    TasaBCV.actualizarWidget();
  }

  // 4. Actualizar estado de usuario y sesión
  if (typeof actualizarInterfazUsuario === 'function') {
    actualizarInterfazUsuario();
  }

  // 5. Cargar Categorías en UI
  actualizarCategoriasUI();

  // 6. Renderizar Catálogo, Ofertas y Recomendados
  renderProductos();
  renderCarruselesSecundarios();

  // 7. Inicializar Hero Slider
  if (typeof CarruselInicio !== 'undefined') {
    CarruselInicio.initHero();
  }

  // 8. Configurar Event Listeners
  configurarEventos();

  // 9. Sincronizar datos de la tienda en el pie de página
  var elRif = document.getElementById('footer-rif');
  if (elRif && typeof INEVAROLI_CONFIG !== 'undefined' && INEVAROLI_CONFIG.rif) {
    elRif.textContent = INEVAROLI_CONFIG.rif;
  }
});

// Control de Tema Visual (Modo Claro por Defecto / Modo Oscuro)
function inicializarTemaVisual() {
  var temaGuardado = 'light';
  try {
    temaGuardado = localStorage.getItem('inevaroli_tema') || 'light';
  } catch (e) {}

  aplicarTemaVisual(temaGuardado);
}

function alternarTemaVisual() {
  var actual = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  var nuevo = actual === 'dark' ? 'light' : 'dark';
  aplicarTemaVisual(nuevo);
  try {
    localStorage.setItem('inevaroli_tema', nuevo);
  } catch (e) {}
}

function aplicarTemaVisual(tema) {
  var btnIcon = document.getElementById('theme-toggle-icon');
  if (tema === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (btnIcon) btnIcon.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (btnIcon) btnIcon.textContent = '🌙';
  }
}

// Sincronización con el Servidor Dedicado de Base de Datos (puerto 3001)
// 100% no local: Si el servidor no está levantado, el catálogo queda en 0 productos.
async function intentarSincronizacionServidorBD() {
  if (typeof MotorSQL === 'undefined') return;

  var res = await MotorSQL.sincronizarDesdeServidorBD('http://localhost:3001/api/database');
  
  // Actualizar indicador visual de base de datos en pantalla si existe
  var statusWidget = document.getElementById('estado-servidor-db-badge');
  if (statusWidget) {
    if (res.conectado) {
      statusWidget.className = 'servidor-badge conectado';
      statusWidget.innerHTML = '● Servidor BD Conectado (' + res.productos + ' joyas)';
    } else {
      statusWidget.className = 'servidor-badge desconectado';
      statusWidget.innerHTML = '○ Servidor BD Desconectado (0 joyas)';
    }
  }

  // Refrescar UI con los datos obtenidos (o vacíos si el servidor está apagado)
  actualizarCategoriasUI();
  renderProductos();
  renderCarruselesSecundarios();
  if (typeof renderAdminTabla === 'function') renderAdminTabla();
}

// Configura listeners de eventos en la página
function configurarEventos() {
  // Buscador Principal & Selector de Categoría Amazon Style
  var inBuscar = document.getElementById('buscar');
  if (inBuscar) {
    inBuscar.addEventListener('input', function (e) {
      estado.busqueda = e.target.value.trim().toLowerCase();
      renderProductos();
    });
  }

  var selCatAmz = document.getElementById('amz-search-cat');
  if (selCatAmz) {
    selCatAmz.addEventListener('change', function (e) {
      seleccionarCategoria(parseInt(e.target.value, 10));
    });
  }

  var formBuscarAmz = document.getElementById('amz-search-form');
  if (formBuscarAmz) {
    formBuscarAmz.addEventListener('submit', function (e) {
      e.preventDefault();
      var elCatalogo = document.getElementById('catalogo-header');
      if (elCatalogo) elCatalogo.scrollIntoView({ behavior: 'smooth' });
      renderProductos();
    });
  }

  // Botón Abrir Carrito en Header
  var btnCart = document.getElementById('toggle-cart');
  if (btnCart) {
    btnCart.addEventListener('click', toggleCarritoDrawer);
  }

  // Botones de Autenticación
  var btnLogin = document.getElementById('btn-abrir-login');
  if (btnLogin) {
    btnLogin.addEventListener('click', function () { abrirAuthModal('login'); });
  }

  var btnReg = document.getElementById('btn-abrir-registro');
  if (btnReg) {
    btnReg.addEventListener('click', function () { abrirAuthModal('registro'); });
  }

  var btnPerfil = document.getElementById('btn-perfil');
  if (btnPerfil) {
    btnPerfil.addEventListener('click', abrirPerfilModal);
  }

  var btnPedidos = document.getElementById('btn-pedidos');
  if (btnPedidos) {
    btnPedidos.addEventListener('click', mostrarPedidosModal);
  }

  var btnAdmin = document.getElementById('btn-admin');
  if (btnAdmin) {
    btnAdmin.addEventListener('click', abrirAdminModal);
  }

  // Formulario Login
  var fLogin = document.getElementById('form-login');
  if (fLogin) fLogin.addEventListener('submit', procesarLogin);

  // Formulario Registro
  var fReg = document.getElementById('form-registro');
  if (fReg) fReg.addEventListener('submit', procesarRegistro);

  // Formulario Recuperar
  var fRec = document.getElementById('form-recuperar');
  if (fRec) fRec.addEventListener('submit', procesarRecuperacion);

  // Formulario Perfil
  var fPerfil = document.getElementById('form-perfil');
  if (fPerfil) fPerfil.addEventListener('submit', guardarCambiosPerfil);

  // Formulario Admin Producto
  var fAdminProd = document.getElementById('form-producto-admin');
  if (fAdminProd) fAdminProd.addEventListener('submit', guardarProductoAdmin);

  // Input de Archivo para Foto de Producto en Admin
  var fileInput = document.getElementById('form-prod-file');
  if (fileInput) fileInput.addEventListener('change', previsualizarImagenArchivo);

  // Input de Contraseña en Registro con Medidor de Fuerza
  var regPass = document.getElementById('reg-pass');
  if (regPass) {
    regPass.addEventListener('input', function () {
      actualizarMedidorFuerza('reg-pass', 'barra-fuerza', 'texto-fuerza');
    });
  }

  // Restricciones de Cédula y Teléfono en tiempo real
  var inCedulas = [document.getElementById('login-cedula'), document.getElementById('reg-cedula'), document.getElementById('checkout-cedula')];
  inCedulas.forEach(function (inp) {
    if (inp) inp.addEventListener('keypress', soloNumeros);
  });

  var inTels = [document.getElementById('reg-telefono'), document.getElementById('perfil-telefono'), document.getElementById('checkout-telefono')];
  inTels.forEach(function (inp) {
    if (inp) inp.addEventListener('keypress', soloNumeros);
  });

  var inNombres = [document.getElementById('reg-nombre'), document.getElementById('reg-apellido'), document.getElementById('perfil-nombre'), document.getElementById('perfil-apellido')];
  inNombres.forEach(function (inp) {
    if (inp) inp.addEventListener('keypress', soloLetras);
  });

  // Selector de Despacho en Checkout
  var radiosDespacho = document.querySelectorAll('input[name="checkout_tipo_despacho"]');
  radiosDespacho.forEach(function (r) {
    r.addEventListener('change', Checkout.toggleOpcionesEnvio);
  });

  // Selector de Método de Pago en Checkout
  var selPago = document.getElementById('checkout-select-pago');
  if (selPago) {
    selPago.addEventListener('change', Checkout.actualizarDetalleMetodoPago);
  }

  // Cerrar modales al hacer clic fuera de la caja
  window.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-fondo')) {
      e.target.style.display = 'none';
    }
  });

  // Menú hamburguesa móvil
  var btnHamburguesa = document.getElementById('btn-menu-lateral');
  if (btnHamburguesa) {
    btnHamburguesa.addEventListener('click', toggleMenuMovil);
  }
}

// Menú Móvil
function toggleMenuMovil() {
  var nav = document.querySelector('.nav-saas');
  if (nav) nav.classList.toggle('abierto-movil');
}

// Actualiza las categorías en el menú y las pastillas de filtro
function actualizarCategoriasUI() {
  var categorias = MotorSQL.consultar('categorias');

  // 1. Desplegable de Departamentos
  var menuDept = document.getElementById('menu-dept-desplegable');
  if (menuDept) {
    var h = '<a href="#catalogo-header" onclick="seleccionarCategoriaMenu(0)"><svg class="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 18 3 22 9 12 22 2 9"></polygon></svg> <strong>Todas las Colecciones</strong></a>';
    categorias.forEach(function (c) {
      h += '<a href="#catalogo-header" onclick="seleccionarCategoriaMenu(' + c.id + ')">' + c.nombre + '</a>';
    });
    menuDept.innerHTML = h;
  }

  // 2. Barra de Pastillas de Filtro
  var pillsWrap = document.getElementById('categoria-pills-wrap');
  if (pillsWrap) {
    var ph = '<button type="button" class="cat-pill ' + (estado.categoriaActiva === 0 ? 'activa' : '') + '" onclick="seleccionarCategoria(' + 0 + ')">Todas las Joyas</button>';
    categorias.forEach(function (c) {
      ph += '<button type="button" class="cat-pill ' + (estado.categoriaActiva === c.id ? 'activa' : '') + '" onclick="seleccionarCategoria(' + c.id + ')">' + c.nombre + '</button>';
    });
    pillsWrap.innerHTML = ph;
  }
}

function toggleMenuDept() {
  var dd = document.getElementById('dropdown-dept');
  if (dd) dd.classList.toggle('abierto');
}

function seleccionarCategoriaMenu(catId) {
  var dd = document.getElementById('dropdown-dept');
  if (dd) dd.classList.remove('abierto');
  seleccionarCategoria(catId);
}

function seleccionarCategoria(catId) {
  estado.categoriaActiva = Number(catId);
  var pills = document.querySelectorAll('.cat-pill');
  pills.forEach(function (p) { p.classList.remove('activa'); });

  // Marcar activa la que corresponde
  var btn = document.querySelector('.cat-pill[onclick*="seleccionarCategoria(' + catId + ')"]');
  if (btn) btn.classList.add('activa');

  renderProductos();
}

// ─── Renderizado de la Cuadrícula Principal de Joyas ───
function renderProductos() {
  var grid = document.getElementById('productos-grid');
  var contador = document.getElementById('catalogo-contador-texto');
  if (!grid) return;

  var productos = MotorSQL.consultar('productos', function (p) {
    return p.activo !== false;
  });

  // Filtro por Categoría
  if (estado.categoriaActiva !== 0) {
    productos = productos.filter(function (p) {
      return p.categoria_id === estado.categoriaActiva;
    });
  }

  // Filtro por Búsqueda
  if (estado.busqueda) {
    var q = estado.busqueda;
    productos = productos.filter(function (p) {
      var n = (p.nombre || '').toLowerCase();
      var mat = (p.presentacion || '').toLowerCase();
      var desc = (p.descripcion || '').toLowerCase();
      var piedras = (p.piedras || '').toLowerCase();
      return n.indexOf(q) !== -1 || mat.indexOf(q) !== -1 || desc.indexOf(q) !== -1 || piedras.indexOf(q) !== -1;
    });
  }

  if (contador) {
    contador.textContent = 'Mostrando ' + productos.length + ' joya' + (productos.length !== 1 ? 's' : '') + ' disponibles';
  }

  if (!productos.length) {
    var hayBusqueda = !!(estado.busqueda || estado.categoriaActiva !== 0);
    if (hayBusqueda) {
      grid.innerHTML =
        '<div class="sin-productos-box">' +
        '  <div style="font-size:3rem; margin-bottom:12px;">🔍</div>' +
        '  <h3>No encontramos joyas con ese criterio</h3>' +
        '  <p>Prueba con otros términos como "grado", "matrimonio", "cadena" o selecciona otra categoría.</p>' +
        '  <button class="btn btn-sm" onclick="seleccionarCategoria(0); document.getElementById(\'buscar\').value=\'\'; estado.busqueda=\'\'; renderProductos();" style="margin-top:12px;">Ver Catálogo Completo</button>' +
        '</div>';
    } else {
      grid.innerHTML =
        '<div class="sin-productos-box servidor-db-alerta">' +
        '  <div style="font-size:3.2rem; margin-bottom:14px;">🔌</div>' +
        '  <h3 style="color:var(--card-text-title); font-size:1.3rem; margin-bottom:8px;">Servidor de Base de Datos Desconectado</h3>' +
        '  <p style="color:var(--text-secondary); max-width:580px; margin:0 auto 16px; line-height:1.6;">' +
        '    Esta tienda opera con una arquitectura <strong>100% no local</strong>. Como el servidor de la base de datos no se encuentra levantado, la página se abre sin productos.' +
        '  </p>' +
        '  <div style="background:var(--bg-surface); border:1px solid var(--border-gold); padding:16px 20px; border-radius:10px; max-width:520px; margin:0 auto 16px; text-align:left; font-size:0.9rem;">' +
        '    <div style="font-weight:700; color:var(--gold-primary); margin-bottom:6px;">✦ Pasos para ver los productos:</div>' +
        '    <ol style="margin-left:20px; color:var(--text-secondary); line-height:1.6;">' +
        '      <li>Ejecuta el archivo <strong>iniciar_servidor_bd.bat</strong> o corre <code>node servidor_database.js</code>.</li>' +
        '      <li>Haz clic en el botón de abajo para reconectar en tiempo real.</li>' +
        '    </ol>' +
        '  </div>' +
        '  <button class="btn" onclick="intentarSincronizacionServidorBD()" style="padding:10px 24px; font-weight:700;">⟳ Conectar con Servidor de Base de Datos</button>' +
        '</div>';
    }
    return;
  }

  var html = '';
  productos.forEach(function (p) {
    html += generarTarjetaProductoHTML(p);
  });

  grid.innerHTML = html;
}

// Genera el HTML de una tarjeta de producto de joyería
function generarTarjetaProductoHTML(p) {
  var precioFinal = p.precio;
  var precioBs = typeof TasaBCV !== 'undefined' ? TasaBCV.convertirBs(precioFinal) : '';
  var esFav = typeof Favoritos !== 'undefined' ? Favoritos.esFavorito(p.id) : false;

  var foto = (p.imagenes && p.imagenes.length) ? p.imagenes[0] : 'images/anillo_grado.jpg';

  // Badges superiores (Destacado exclusivo)
  var badgesHTML = '';
  if (p.recomendado) {
    badgesHTML += '<span class="badge-destacado">DESTACADO</span>';
  }

  // Stock badge
  var stockHTML = '';
  if (p.stock <= 0) {
    stockHTML = '<span class="badge-stock badge-stock-agotado">Agotado</span>';
  } else if (p.stock <= 5) {
    stockHTML = '<span class="badge-stock badge-stock-bajo">¡Últimas ' + p.stock + ' piezas!</span>';
  }

  return (
    '<article class="producto-card" data-id="' + p.id + '">' +
    '  <div class="producto-img-wrap" onclick="abrirDetalleProducto(' + p.id + ')">' +
    '    <img src="' + foto + '" alt="' + p.nombre + '" class="producto-img" loading="lazy">' +
    '    <div class="producto-badges-box">' + badgesHTML + '</div>' +
    '    <button type="button" class="btn-fav ' + (esFav ? 'activo' : '') + '" data-id="' + p.id + '" onclick="Favoritos.toggle(' + p.id + ', event)" title="Guardar en joyas favoritas">' +
    '      <svg class="heart-icon" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
    '    </button>' +
    '  </div>' +
    '  <div class="producto-body">' +
    '    <div class="producto-material">' + (p.presentacion || 'Joyería Fina') + '</div>' +
    '    <h3 class="producto-nombre" onclick="abrirDetalleProducto(' + p.id + ')">' + p.nombre + '</h3>' +
    '    <div class="producto-piedras">' + (p.piedras ? p.piedras : '') + '</div>' +
    '    <div class="producto-stock-line">' + stockHTML + '</div>' +
    '    <div class="producto-precios">' +
    '      <div class="precio-usd-line">' +
    '        <span class="precio-monto">$' + precioFinal.toFixed(2) + '</span>' +
    '      </div>' +
    '      <div class="precio-bs-line">' + precioBs + '</div>' +
    '    </div>' +
    '    <div class="producto-acciones">' +
    '      <button type="button" class="btn btn-sm btn-detalle" onclick="abrirDetalleProducto(' + p.id + ')">Ver Ficha</button>' +
    '      <button type="button" class="btn btn-sm btn-add-cart" onclick="Cart.agregar(' + p.id + ', 1)" ' + (p.stock <= 0 ? 'disabled' : '') + '>' +
    (p.stock <= 0 ? 'Agotado' : '+ Al Pedido') +
    '      </button>' +
    '    </div>' +
    '  </div>' +
    '</article>'
  );
}

// ─── Renderizado de Carruseles de Ofertas y Recomendados ───
function renderCarruselesSecundarios() {
  var trackDesc = document.getElementById('carrusel-descuentos-track');
  var trackRec  = document.getElementById('carrusel-recomendados-track');

  var todos = MotorSQL.consultar('productos', function (p) { return p.activo !== false; });

  // Ofertas (Descuento > 0)
  if (trackDesc) {
    var conDescuento = todos.filter(function (p) { return p.descuento && p.descuento > 0; });
    var htmlDesc = '';
    conDescuento.forEach(function (p) {
      htmlDesc += generarTarjetaProductoHTML(p);
    });
    trackDesc.innerHTML = htmlDesc || '<p style="padding:20px; color:#64748b;">No hay promociones activas actualmente.</p>';
  }

  // Recomendados (recomendado = true)
  if (trackRec) {
    var recomendados = todos.filter(function (p) { return !!p.recomendado; });
    var htmlRec = '';
    recomendados.forEach(function (p) {
      htmlRec += generarTarjetaProductoHTML(p);
    });
    trackRec.innerHTML = htmlRec || '<p style="padding:20px; color:#64748b;">No hay joyas destacadas en este momento.</p>';
  }
}
