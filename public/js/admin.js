/**
 * admin.js — Panel de Control y Administración de Inventario para INVERANOLI
 * 
 * Funcionalidades Clave:
 * 1. Precarga automática de Administrador (12345678 / Admin123*) y Cliente por Defecto (20123456 / Cliente123*).
 * 2. Reposición Inmediata de Stock (+ Stock) mediante modal en página (sin tocar archivos de base de datos).
 * 3. Textos de alto contraste y legibilidad total sobre fondos oscuros.
 * 4. Eliminación de promociones en joyería (precios de lista oficiales).
 * 5. Notificaciones en página (Toasts y Diálogos) sin alertas nativas del navegador.
 */

// Asegura que las credenciales oficiales estén siempre disponibles
async function precargarUsuarios() {
  var usuarios = MotorSQL.consultar('usuarios');

  // 1. Administrador (Cédula: 12345678 / Clave: Admin123*)
  var adminUser = usuarios.find(function (u) { return String(u.cedula) === '12345678' || u.rol === 'admin'; });
  var salAdmin = 'sal_admin_inveranoli_2026';
  var hashAdmin = await hashearPassword('Admin123*', salAdmin);

  if (!adminUser) {
    MotorSQL.insertar('usuarios', {
      id: 1,
      nombre: 'Administrador',
      apellido: 'INVERANOLI',
      cedula: '12345678',
      telefono: '04125006377',
      email: 'admin@inveranoli.com',
      sal: salAdmin,
      password_hash: hashAdmin,
      rol: 'admin'
    });
  } else if (adminUser.password_hash !== hashAdmin) {
    MotorSQL.actualizar('usuarios', function (u) { return u.id === adminUser.id; }, {
      sal: salAdmin,
      password_hash: hashAdmin,
      rol: 'admin'
    });
  }

  // 2. Cliente Registrado Oficial (Cédula: 20123456 / Clave: Cliente123*)
  var clienteUser = usuarios.find(function (u) { return String(u.cedula) === '20123456'; });
  var salCli = 'sal_cliente_inveranoli_2026';
  var hashCli = await hashearPassword('Cliente123*', salCli);

  if (!clienteUser) {
    MotorSQL.insertar('usuarios', {
      id: 2,
      nombre: 'María',
      apellido: 'González',
      cedula: '20123456',
      telefono: '04141234567',
      email: 'maria.gonzalez@gmail.com',
      sal: salCli,
      password_hash: hashCli,
      rol: 'cliente'
    });
  } else if (clienteUser.password_hash !== hashCli) {
    MotorSQL.actualizar('usuarios', function (u) { return u.id === clienteUser.id; }, {
      sal: salCli,
      password_hash: hashCli
    });
  }
}

// Variables de filtrado del panel
var adminFiltroProducto = '';
var adminFiltroCategoria = '';
var adminFiltroPedidoTexto = '';
var adminFiltroPedidoEstado = 'todos';

// Abre el modal del panel de administración
function abrirAdminModal() {
  var modal = document.getElementById('modal-admin');
  if (!modal) return;
  modal.style.display = 'flex';
  actualizarWidgetBCVAdmin();
  actualizarDashboardFinanciero();
  cambiarSeccionAdmin('productos');
}

function cerrarAdminModal() {
  var u = Api.leer('sesion_actual', null);
  if (u && u.rol === 'admin') {
    if (typeof cerrarSesion === 'function') {
      cerrarSesion();
    }
    return;
  }
  var modal = document.getElementById('modal-admin');
  if (modal) modal.style.display = 'none';
}

function actualizarWidgetBCVAdmin() {
  var bcvVal = document.getElementById('admin-bcv-val');
  if (bcvVal && typeof TasaBCV !== 'undefined') {
    bcvVal.textContent = 'Bs. ' + (TasaBCV.obtenerTasa() ? TasaBCV.obtenerTasa().toFixed(2) : '36.50');
  }
}

// Alternar entre pestañas del panel administrativo
function cambiarSeccionAdmin(seccion) {
  var secProds = document.getElementById('admin-sec-productos');
  var secCats = document.getElementById('admin-sec-categorias');
  var secPeds = document.getElementById('admin-sec-pedidos');
  var secFabricas = document.getElementById('admin-sec-fabricas');

  var tabProds = document.getElementById('tab-admin-productos');
  var tabCats = document.getElementById('tab-admin-categorias');
  var tabPeds = document.getElementById('tab-admin-pedidos');
  var tabFabricas = document.getElementById('tab-admin-fabricas');

  if (secProds) secProds.style.display = 'none';
  if (secCats) secCats.style.display = 'none';
  if (secPeds) secPeds.style.display = 'none';
  if (secFabricas) secFabricas.style.display = 'none';

  [tabProds, tabCats, tabPeds, tabFabricas].forEach(function (t) {
    if (t) t.classList.remove('activo');
  });

  actualizarDashboardFinanciero();

  if (seccion === 'categorias') {
    if (secCats) secCats.style.display = 'block';
    if (tabCats) tabCats.classList.add('activo');
    renderAdminCategoriasTabla();
  } else if (seccion === 'pedidos') {
    if (secPeds) secPeds.style.display = 'block';
    if (tabPeds) tabPeds.classList.add('activo');
    renderAdminPedidosTabla();
  } else if (seccion === 'fabricas') {
    if (secFabricas) secFabricas.style.display = 'block';
    if (tabFabricas) tabFabricas.classList.add('activo');
    renderAdminFabricasSeccion();
  } else {
    if (secProds) secProds.style.display = 'block';
    if (tabProds) tabProds.classList.add('activo');
    renderAdminTabla();
  }
}

// Filtrar productos por nombre o ID
function filtrarAdminProductos(val) {
  adminFiltroProducto = (val || '').trim().toLowerCase();
  renderAdminTabla();
}

// Filtrar categorías
function filtrarAdminCategorias(val) {
  adminFiltroCategoria = (val || '').trim().toLowerCase();
  renderAdminCategoriasTabla();
}

// Filtrar pedidos por texto
function filtrarAdminPedidosTexto(val) {
  adminFiltroPedidoTexto = (val || '').trim().toLowerCase();
  renderAdminPedidosTabla();
}

// Filtrar pedidos por estado
function filtrarAdminPedidosEstado(val) {
  adminFiltroPedidoEstado = val || 'todos';
  renderAdminPedidosTabla();
}

// ─── Actualiza todas las vistas del catálogo del cliente tras un cambio de admin ───
function refrescarCatalogoCliente() {
  if (typeof renderProductos === 'function') renderProductos();
  if (typeof renderCarruselesSecundarios === 'function') renderCarruselesSecundarios();
  if (typeof actualizarCategoriasUI === 'function') actualizarCategoriasUI();
}

// ─── Renderizado de Tabla de Joyería (Inventario con Alto Contraste) ───
function renderAdminTabla() {
  var tbody = document.getElementById('admin-tabla-cuerpo');
  if (!tbody) return;
  tbody.innerHTML = '';

  var productos = MotorSQL.consultar('productos');
  var categorias = MotorSQL.consultar('categorias');
  var catMap = {};
  categorias.forEach(function (c) { catMap[c.id] = c.nombre; });

  var q = adminFiltroProducto;
  var filtrados = productos.filter(function (p) {
    if (!q) return true;
    var n = (p.nombre || '').toLowerCase();
    var mat = (p.presentacion || '').toLowerCase();
    var idStr = String(p.id);
    return n.indexOf(q) !== -1 || mat.indexOf(q) !== -1 || idStr.indexOf(q) !== -1;
  });

  if (!filtrados.length) {
    var trVacio = document.createElement('tr');
    trVacio.innerHTML = '<td colspan="7" style="text-align:center; padding:24px; color:#cbd5e1; font-size:0.95rem;">No se encontraron joyas que coincidan con la búsqueda.</td>';
    tbody.appendChild(trVacio);
    return;
  }

  filtrados.forEach(function (p) {
    var tr = document.createElement('tr');
    var activo = p.activo !== false;
    var esRec = (p.recomendado === 1 || p.recomendado === true || p.recomendado === '1');

    // Botón Recomendado
    var recHTML = '<button type="button" class="btn-sm ' + (esRec ? 'btn-rec-si' : 'btn-rec-no') + '" onclick="toggleProductoRecomendado(' + p.id + ')" title="Alternar en destacados">' +
      (esRec ? '★ Sí' : '☆ No') + '</button>';

    // Stock Segmentado por Tallas con Alerta Visual
    var stockTallasObj = MotorSQL.obtenerStockTallas(p);
    var tallasKeys = Object.keys(stockTallasObj);
    var stockBadge = '';
    if (p.stock <= 0) {
      stockBadge = '<span class="badge-stock-admin agotado">0 (Agotado)</span>';
    } else if (p.stock <= 5) {
      stockBadge = '<span class="badge-stock-admin critico">' + p.stock + ' (Bajo)</span>';
    } else {
      stockBadge = '<span class="badge-stock-admin disponible">' + p.stock + ' disp.</span>';
    }

    var tallasPillsHTML = '';
    if (tallasKeys.length > 0) {
      tallasPillsHTML = '<div class="stock-tallas-grid">';
      tallasKeys.forEach(function (tk) {
        var cTalla = stockTallasObj[tk] || 0;
        var stCls = cTalla > 0 ? 'disponible' : 'agotado';
        tallasPillsHTML += '<span class="badge-talla-admin ' + stCls + '">' + tk + ': <strong>' + cTalla + '</strong></span>';
      });
      tallasPillsHTML += '</div>';
    }

    // Foto pequeña de previsualización
    var foto = (p.imagenes && p.imagenes.length) ? p.imagenes[0] : 'logo.png';

    // Textos con contraste cristalino en modo claro y oscuro
    tr.innerHTML =
      '<td style="color:var(--text-muted); font-weight:bold;">#' + p.id + '</td>' +
      '<td>' +
      '  <div style="display:flex; align-items:center; gap:10px;">' +
      '    <img src="' + foto + '" alt="" style="width:42px; height:42px; border-radius:6px; object-fit:cover; border:1px solid var(--border-gold);">' +
      '    <div>' +
      '      <div style="font-weight:700; color:var(--card-text-title); font-size:0.95rem; line-height:1.2;">' + p.nombre + '</div>' +
      '      <div style="color:var(--gold-primary); font-weight:600; font-size:0.8rem; margin-top:2px;">' + (p.presentacion || '') + ' · <span style="color:var(--text-muted);">' + (catMap[p.categoria_id] || 'General') + '</span></div>' +
      '    </div>' +
      '  </div>' +
      '</td>' +
      '<td style="color:var(--card-text-title); font-weight:800; font-size:0.95rem;">Ref. $' + p.precio.toFixed(2) + '</td>' +
      '<td>' + recHTML + '</td>' +
      '<td>' +
      '  ' + stockBadge +
      '  ' + tallasPillsHTML +
      '</td>' +
      '<td><span style="color:' + (activo ? '#16a34a' : '#ef4444') + '; font-weight:bold;">' + (activo ? '● Activo' : '○ Pausado') + '</span></td>' +
      '<td>' +
      '  <div class="admin-acciones-grid">' +
      '    <button type="button" class="btn-sm btn-editar" onclick="abrirFormularioProductoModal(' + p.id + ')" title="Editar toda la información">Editar</button>' +
      '    <button type="button" class="btn-sm ' + (activo ? 'btn-desactivar' : 'btn-activar') + '" onclick="toggleProductoEstado(' + p.id + ')">' + (activo ? 'Pausar' : 'Activar') + '</button>' +
      '    <button type="button" class="btn-sm btn-eliminar-prod" onclick="eliminarProductoCompletamente(' + p.id + ')" title="Borrar joya permanentemente">Eliminar</button>' +
      '  </div>' +
      '</td>';

    tbody.appendChild(tr);
  });
}

// ====================================================================
// REPOSICIÓN INMEDIATA DE STOCK (+ Stock por Talla)
// Utiliza un modal personalizado para elegir la talla y la cantidad
// ====================================================================
function reponerStock(id) {
  var p = MotorSQL.consultar('productos', function (x) { return x.id === Number(id); })[0];
  if (!p) {
    Notificaciones.alerta('Joya no encontrada en la base de datos.', 'Error');
    return;
  }

  var stockTallas = MotorSQL.obtenerStockTallas(p);
  var tallas = Object.keys(stockTallas);

  var modalId = 'modal-reponer-stock-talla';
  var existModal = document.getElementById(modalId);
  if (existModal) existModal.remove();

  var optionsTallas = tallas.map(function (t) {
    return '<option value="' + t + '">' + t + ' (Stock actual: ' + (stockTallas[t] || 0) + ')</option>';
  }).join('');

  var overlay = document.createElement('div');
  overlay.id = modalId;
  overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(3px);';

  overlay.innerHTML =
    '<div style="background:#0f172a; border:1px solid #d4af37; border-radius:12px; padding:24px; max-width:440px; width:90%; color:#f8fafc; box-shadow:0 12px 30px rgba(0,0,0,0.8);">' +
    '  <h3 style="margin:0 0 12px 0; color:#d4af37; font-size:1.2rem; display:flex; align-items:center; gap:8px;">📦 Reposición por Talla</h3>' +
    '  <div style="font-size:0.9rem; line-height:1.4; margin-bottom:14px; border-bottom:1px solid #334155; padding-bottom:10px;">' +
    '    <strong>' + p.nombre + '</strong><br>' +
    '    <span style="color:#94a3b8;">' + (p.presentacion || '') + ' · Stock Total Actual: <strong style="color:#10b981;">' + p.stock + ' unidades</strong></span>' +
    '  </div>' +
    '  <div style="margin-bottom:14px;">' +
    '    <label style="display:block; font-size:0.85rem; font-weight:700; color:#cbd5e1; margin-bottom:4px;">Selecciona la Talla a Reponer:</label>' +
    '    <select id="reponer-stock-select-talla" style="width:100%; padding:9px; border-radius:6px; background:#1e293b; border:1px solid #475569; color:#fff; font-size:0.9rem;">' +
    '      ' + optionsTallas +
    '    </select>' +
    '  </div>' +
    '  <div style="margin-bottom:18px;">' +
    '    <label style="display:block; font-size:0.85rem; font-weight:700; color:#cbd5e1; margin-bottom:4px;">Cantidad de Unidades a Añadir:</label>' +
    '    <input type="number" id="reponer-stock-input-cant" min="1" max="1000" value="5" style="width:100%; padding:9px; border-radius:6px; background:#1e293b; border:1px solid #475569; color:#fff; font-size:1rem; font-weight:bold; text-align:center;">' +
    '  </div>' +
    '  <div style="display:flex; justify-content:flex-end; gap:10px;">' +
    '    <button type="button" id="reponer-stock-btn-cancelar" style="background:#334155; border:none; color:#cbd5e1; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">Cancelar</button>' +
    '    <button type="button" id="reponer-stock-btn-guardar" style="background:#10b981; border:none; color:#ffffff; padding:8px 18px; border-radius:6px; font-weight:800; cursor:pointer;">✓ Sumar al Stock</button>' +
    '  </div>' +
    '</div>';

  document.body.appendChild(overlay);

  document.getElementById('reponer-stock-btn-cancelar').onclick = function () {
    overlay.remove();
  };

  document.getElementById('reponer-stock-btn-guardar').onclick = function () {
    var selTalla = document.getElementById('reponer-stock-select-talla').value;
    var inpCant = document.getElementById('reponer-stock-input-cant');
    var cant = parseInt(inpCant.value, 10);

    if (isNaN(cant) || cant <= 0) {
      Notificaciones.alerta('Por favor ingresa una cantidad válida mayor a 0.', 'Cantidad Inválida');
      return;
    }

    var actualizado = MotorSQL.actualizarStockTalla(p.id, selTalla, cant);
    overlay.remove();

    renderAdminTabla();
    refrescarCatalogoCliente();

    Notificaciones.toast('¡+' + cant + ' unidades añadidas a "' + p.nombre + '" (' + selTalla + ')! Nuevo total: ' + (actualizado ? actualizado.stock : (p.stock + cant)), 'exito');
  };
}

// Activar o pausar visibilidad de un producto
function toggleProductoEstado(id) {
  var p = MotorSQL.consultar('productos', function (x) { return x.id === Number(id); })[0];
  if (p) {
    var nuevo = p.activo === false ? true : false;
    MotorSQL.actualizar('productos', function (x) { return x.id === Number(id); }, { activo: nuevo });
    renderAdminTabla();
    refrescarCatalogoCliente();
    Notificaciones.toast('Joya "' + p.nombre + '" ' + (nuevo ? 'activada' : 'pausada') + ' correctamente.', 'info');
  }
}

// Alternar en destacados / recomendados
function toggleProductoRecomendado(id) {
  var p = MotorSQL.consultar('productos', function (x) { return x.id === Number(id); })[0];
  if (p) {
    var esActual = (p.recomendado === 1 || p.recomendado === true || p.recomendado === '1');
    var nuevo = esActual ? 0 : 1;
    MotorSQL.actualizar('productos', function (x) { return x.id === Number(id); }, { recomendado: nuevo });
    renderAdminTabla();
    refrescarCatalogoCliente();
    Notificaciones.toast('"' + p.nombre + '" ' + (nuevo === 1 ? 'agregado a destacados.' : 'removido de destacados.'), 'info');
  }
}

// Eliminar producto permanentemente con diálogo en página
function eliminarProductoCompletamente(id) {
  var p = MotorSQL.consultar('productos', function (x) { return x.id === Number(id); })[0];
  if (!p) return;

  Notificaciones.confirmar(
    '¿Estás seguro de que deseas eliminar permanentemente la joya <strong style="color:#ffffff;">"' + p.nombre + '"</strong> del catálogo?',
    'Confirmar Eliminación',
    function () {
      MotorSQL.eliminar('productos', function (x) { return x.id === Number(id); });
      renderAdminTabla();
      refrescarCatalogoCliente();
      Notificaciones.toast('La joya "' + p.nombre + '" ha sido eliminada del catálogo.', 'aviso');
    }
  );
}

// ─── Modal de Registro y Edición de Joyas ───
var imagenBase64Seleccionada = '';

function abrirFormularioProductoModal(id) {
  var modal = document.getElementById('modal-producto-form');
  var form = document.getElementById('form-producto-admin');
  var titulo = document.getElementById('form-prod-titulo');
  var previewImg = document.getElementById('form-prod-preview');
  var previewText = document.getElementById('form-prod-preview-text');
  var fileInput = document.getElementById('form-prod-file');
  var urlInput = document.getElementById('form-prod-url');

  if (!modal || !form) return;
  imagenBase64Seleccionada = '';
  if (fileInput) fileInput.value = '';

  // Poblar select de categorías
  poblarSelectCategoriasForm();

  if (id) {
    var p = MotorSQL.consultar('productos', function (x) { return x.id === Number(id); })[0];
    if (!p) {
      Notificaciones.alerta('Producto no encontrado.', 'Error');
      return;
    }

    if (titulo) titulo.textContent = 'Editar Joya: ' + p.nombre;
    document.getElementById('form-prod-id').value = p.id;
    document.getElementById('form-prod-nombre').value = p.nombre || '';
    document.getElementById('form-prod-pres').value = p.presentacion || '';
    document.getElementById('form-prod-cat').value = p.categoria_id || 1;
    document.getElementById('form-prod-precio').value = p.precio || '';
    document.getElementById('form-prod-stock').value = p.stock !== undefined ? p.stock : 0;
    document.getElementById('form-prod-desc').value = p.descripcion || '';
    document.getElementById('form-prod-tallas').value = p.tallas || '';
    document.getElementById('form-prod-piedras').value = p.piedras || '';
    document.getElementById('form-prod-recomendado').checked = !!p.recomendado;

    var foto = (p.imagenes && p.imagenes.length) ? p.imagenes[0] : '';
    if (urlInput) urlInput.value = foto;
    if (foto) {
      previewImg.src = foto;
      previewImg.style.display = 'block';
      previewText.style.display = 'none';
    } else {
      previewImg.style.display = 'none';
      previewText.style.display = 'block';
    }
  } else {
    if (titulo) titulo.textContent = 'Registrar Nueva Joya';
    form.reset();
    document.getElementById('form-prod-id').value = '';
    document.getElementById('form-prod-stock').value = 15;
    if (urlInput) urlInput.value = '';
    previewImg.style.display = 'none';
    previewText.style.display = 'block';
  }

  modal.style.display = 'flex';
}

function cerrarFormularioProductoModal() {
  var modal = document.getElementById('modal-producto-form');
  if (modal) modal.style.display = 'none';
}

function poblarSelectCategoriasForm() {
  var sel = document.getElementById('form-prod-cat');
  if (!sel) return;
  sel.innerHTML = '';
  var categorias = MotorSQL.consultar('categorias');
  categorias.forEach(function (c) {
    var opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.nombre;
    sel.appendChild(opt);
  });
}

function previsualizarImagenArchivo(event) {
  var archivo = event.target.files && event.target.files[0];
  if (!archivo) return;

  var reader = new FileReader();
  reader.onload = function (e) {
    imagenBase64Seleccionada = e.target.result;
    var previewImg = document.getElementById('form-prod-preview');
    var previewText = document.getElementById('form-prod-preview-text');
    var urlInput = document.getElementById('form-prod-url');
    if (urlInput) urlInput.value = '';
    if (previewImg) {
      previewImg.src = imagenBase64Seleccionada;
      previewImg.style.display = 'block';
    }
    if (previewText) previewText.style.display = 'none';
  };
  reader.readAsDataURL(archivo);
}

function guardarProductoAdmin(e) {
  e.preventDefault();

  var id = document.getElementById('form-prod-id').value;
  var nombre = document.getElementById('form-prod-nombre').value.trim();
  var pres = document.getElementById('form-prod-pres').value.trim();
  var catId = parseInt(document.getElementById('form-prod-cat').value, 10);
  var precio = parseFloat(document.getElementById('form-prod-precio').value);
  var stock = parseInt(document.getElementById('form-prod-stock').value, 10);
  var desc = document.getElementById('form-prod-desc').value.trim();
  var tallas = document.getElementById('form-prod-tallas').value.trim();
  var piedras = document.getElementById('form-prod-piedras').value.trim();
  var recomendado = document.getElementById('form-prod-recomendado').checked;
  var urlFoto = (document.getElementById('form-prod-url').value || '').trim();

  if (nombre.length < 2) {
    return Notificaciones.alerta('El nombre de la joya debe tener al menos 2 caracteres.', 'Dato Requerido');
  }
  if (isNaN(precio) || precio <= 0) {
    return Notificaciones.alerta('El precio referencial debe ser mayor a $0.', 'Precio Inválido');
  }
  if (isNaN(stock) || stock < 0) {
    return Notificaciones.alerta('El stock debe ser un entero no negativo.', 'Stock Inválido');
  }

  var fotoFinal = imagenBase64Seleccionada || urlFoto || 'logo.png';

  if (id) {
    // Modo Edición: mantener stock y tallas existentes
    var pExistente = MotorSQL.consultar('productos', function (x) { return x.id === Number(id); })[0];
    var stockActual = pExistente ? pExistente.stock : (stock || 0);
    var stockTallasActual = pExistente ? (pExistente.stock_tallas || MotorSQL.obtenerStockTallas(pExistente)) : null;

    MotorSQL.actualizar('productos', function (x) { return x.id === Number(id); }, {
      nombre: nombre,
      presentacion: pres,
      categoria_id: catId,
      precio: precio,
      stock: stockActual,
      stock_tallas: stockTallasActual,
      descripcion: desc,
      tallas: tallas,
      piedras: piedras,
      recomendado: recomendado,
      imagenes: [fotoFinal]
    });
    Notificaciones.toast('¡Joya "' + nombre + '" actualizada con éxito!', 'exito');
  } else {
    // Modo Creación: stock inicial es 0 (se abastece por Pedidos de Entrada)
    var nuevoProd = {
      nombre: nombre,
      presentacion: pres,
      categoria_id: catId,
      precio: precio,
      stock: 0,
      descripcion: desc,
      tallas: tallas,
      piedras: piedras,
      recomendado: recomendado,
      activo: true,
      imagenes: [fotoFinal]
    };
    nuevoProd.stock_tallas = MotorSQL.obtenerStockTallas(nuevoProd);
    for (var tk in nuevoProd.stock_tallas) {
      if (nuevoProd.stock_tallas.hasOwnProperty(tk)) {
        nuevoProd.stock_tallas[tk] = 0;
      }
    }
    nuevoProd.stock = 0;
    MotorSQL.insertar('productos', nuevoProd);
    Notificaciones.toast('¡Nueva joya "' + nombre + '" registrada con stock 0! Haz un pedido de entrada para adquirir inventario.', 'exito');
  }

  cerrarFormularioProductoModal();
  renderAdminTabla();
  refrescarCatalogoCliente();
}

// ─── Gestión de Categorías ───
function renderAdminCategoriasTabla() {
  var tbody = document.getElementById('admin-tabla-categorias');
  if (!tbody) return;
  tbody.innerHTML = '';

  var categorias = MotorSQL.consultar('categorias');
  var productos = MotorSQL.consultar('productos');

  var q = adminFiltroCategoria;
  var filtradas = categorias.filter(function (c) {
    if (!q) return true;
    return c.nombre.toLowerCase().indexOf(q) !== -1 || String(c.id).indexOf(q) !== -1;
  });

  if (!filtradas.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#cbd5e1;">No hay categorías registradas.</td></tr>';
    return;
  }

  filtradas.forEach(function (c) {
    var cant = productos.filter(function (p) { return p.categoria_id === c.id; }).length;
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td style="color:#cbd5e1; font-weight:bold;">#' + c.id + '</td>' +
      '<td>' +
      '  <div style="font-weight:700; color:#ffffff; font-size:0.95rem;">' + c.nombre + '</div>' +
      '  <small style="color:#e5c158;">' + (c.descripcion || '') + '</small>' +
      '</td>' +
      '<td style="color:#ffffff; font-weight:600;">' + cant + ' pieza(s)</td>' +
      '<td>' +
      '  <button type="button" class="btn-sm btn-editar" onclick="editarCategoriaPrompt(' + c.id + ')">Editar</button>' +
      '  <button type="button" class="btn-sm btn-desactivar" style="margin-left:6px;" onclick="eliminarCategoriaPrompt(' + c.id + ')">Eliminar</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

function agregarCategoriaPrompt() {
  Notificaciones.prompt(
    'Ingresa el nombre de la nueva categoría de joyería:',
    'Nueva Categoría de Joyería',
    '',
    function (nombre) {
      if (!nombre || nombre.trim().length < 3) {
        return Notificaciones.alerta('El nombre debe tener al menos 3 caracteres.', 'Categoría Inválida');
      }
      var limpio = nombre.trim();
      var categorias = MotorSQL.consultar('categorias');
      if (categorias.some(function (c) { return c.nombre.toLowerCase() === limpio.toLowerCase(); })) {
        return Notificaciones.alerta('Ya existe una categoría con este nombre.', 'Categoría Duplicada');
      }

      MotorSQL.insertar('categorias', { nombre: limpio, descripcion: 'Colección de joyería fina' });
      renderAdminCategoriasTabla();
      poblarSelectCategoriasForm();
      refrescarCatalogoCliente();
      Notificaciones.toast('¡Categoría "' + limpio + '" registrada con éxito!', 'exito');
    }
  );
}

function editarCategoriaPrompt(id) {
  var c = MotorSQL.consultar('categorias', function (x) { return x.id === Number(id); })[0];
  if (!c) return;

  Notificaciones.prompt(
    'Editar nombre de la categoría:',
    'Modificar Categoría',
    c.nombre,
    function (nombre) {
      if (!nombre || nombre.trim().length < 3) {
        return Notificaciones.alerta('El nombre debe tener al menos 3 caracteres.', 'Nombre Inválido');
      }
      var limpio = nombre.trim();
      MotorSQL.actualizar('categorias', function (x) { return x.id === Number(id); }, { nombre: limpio });
      renderAdminCategoriasTabla();
      poblarSelectCategoriasForm();
      refrescarCatalogoCliente();
      Notificaciones.toast('Categoría actualizada a "' + limpio + '".', 'exito');
    }
  );
}

function eliminarCategoriaPrompt(id) {
  var c = MotorSQL.consultar('categorias', function (x) { return x.id === Number(id); })[0];
  if (!c) return;

  var prods = MotorSQL.consultar('productos', function (p) { return p.categoria_id === Number(id); });
  Notificaciones.confirmar(
    '¿Deseas eliminar la categoría <strong style="color:#ffffff;">"' + c.nombre + '"</strong>?<br><br>Las ' + prods.length + ' joyas asociadas seguirán disponibles en el catálogo general.',
    'Eliminar Categoría',
    function () {
      MotorSQL.actualizar('productos', function (p) { return p.categoria_id === Number(id); }, { categoria_id: 0 });
      MotorSQL.eliminar('categorias', function (x) { return x.id === Number(id); });

      renderAdminCategoriasTabla();
      poblarSelectCategoriasForm();
      refrescarCatalogoCliente();
      Notificaciones.toast('Categoría eliminada.', 'info');
    }
  );
}

// ─── Gestión de Pedidos en Admin (Alto Contraste) ───
function renderAdminPedidosTabla() {
  var cont = document.getElementById('admin-pedidos-lista');
  if (!cont) return;

  var ordenes = MotorSQL.consultarOrdenesConDetalle();
  var usuarios = MotorSQL.consultar('usuarios');
  var userMap = {};
  usuarios.forEach(function (u) { userMap[u.id] = u; });

  var q = adminFiltroPedidoTexto;
  var estFiltro = adminFiltroPedidoEstado;

  var filtradas = ordenes.filter(function (ord) {
    if (estFiltro !== 'todos' && ord.estado !== estFiltro) return false;
    if (!q) return true;

    var u = userMap[ord.usuario_id] || {};
    var textoCompleto = (ord.id + ' ' + (u.nombre || '') + ' ' + (u.apellido || '') + ' ' + (u.cedula || '') + ' ' + (u.telefono || '')).toLowerCase();
    return textoCompleto.indexOf(q) !== -1;
  });

  if (!filtradas.length) {
    cont.innerHTML = '<div style="text-align:center; padding:24px; color:#cbd5e1;">No se encontraron pedidos con los filtros aplicados.</div>';
    return;
  }

  var html = '<div class="admin-pedidos-grid">';
  filtradas.slice().reverse().forEach(function (ord) {
    var u = userMap[ord.usuario_id] || { nombre: 'Cliente', apellido: '', cedula: '', telefono: '' };
    var totalBs = typeof TasaBCV !== 'undefined' ? TasaBCV.convertirBs(ord.total) : '';

    var ESTADOS_ORDEN = [
      { id: 'pendiente', label: 'Pendiente' },
      { id: 'en_camino', label: 'En Camino' },
      { id: 'entregado', label: 'Entregado' }
    ];

    var estadoActual = ord.estado || 'pendiente';
    if (estadoActual === 'recibido' || estadoActual === 'preparacion') estadoActual = 'pendiente';
    if (estadoActual === 'camino') estadoActual = 'en_camino';

    var accionBotonHTML = '';
    if (estadoActual === 'pendiente') {
      accionBotonHTML = '<button type="button" class="btn btn-sm" style="background:#10b981; color:#fff; font-weight:800;" onclick="confirmarValidarPagoPedido(\'' + ord.id + '\')">Validar pago</button>';
    } else if (estadoActual === 'en_camino') {
      accionBotonHTML = '<span style="color:#10b981; font-weight:bold; font-size:0.85rem; margin-right:8px;">Pago Validado ✓</span>' +
        '<button type="button" class="btn btn-sm btn-hero-gold" onclick="marcarPedidoEntregado(\'' + ord.id + '\')">Marcar Entregado</button>';
    } else {
      accionBotonHTML = '<span class="badge-estado badge-entregado" style="font-weight:800;">✓ Entregado</span>';
    }

    html +=
      '<div class="admin-pedido-card">' +
      '  <div class="admin-pedido-header">' +
      '    <div>' +
      '      <strong style="color:var(--card-text-title); font-size:1rem;">Orden #' + ord.id + '</strong> · <small style="color:var(--text-muted);">' + ord.fecha + '</small><br>' +
      '      <span style="color:var(--text-secondary);">Cliente: <strong style="color:var(--card-text-title);">' + u.nombre + ' ' + u.apellido + '</strong> (C.I. ' + (u.tipo_doc ? u.tipo_doc + '-' : '') + u.cedula + ') · Tel: <span style="color:var(--gold-primary); font-weight:700;">' + u.telefono + '</span></span>' +
      '    </div>' +
      '    <div style="text-align:right;">' +
      '      <div style="font-size:0.8rem; font-weight:700; color:var(--gold-primary); margin-bottom:4px;">Estado: <strong style="text-transform:uppercase;">' + estadoActual.replace('_', ' ') + '</strong></div>' +
      '      ' + accionBotonHTML +
      '    </div>' +
      '  </div>' +
      '  <div class="admin-pedido-body">';

    ord.detalles.forEach(function (d) {
      html +=
        '<div style="font-size:0.9rem; margin-bottom:6px; display:flex; justify-content:space-between; border-bottom:1px dashed var(--border-gold); padding-bottom:4px;">' +
        '  <span style="color:var(--text-primary);"><strong>' + d.nombre + '</strong> × ' + d.cantidad + (d.personalizacion ? ' <em style="color:var(--gold-primary);">[Talla: ' + d.personalizacion + ']</em>' : '') + '</span>' +
        '  <span style="color:var(--card-text-title); font-weight:bold;">$' + (d.cantidad * d.precio_unitario).toFixed(2) + '</span>' +
        '</div>';
    });

    html +=
      '  </div>' +
      '  <div class="admin-pedido-footer">' +
      '    <span style="color:var(--text-muted);"><strong style="color:var(--text-secondary);">Despacho:</strong> ' + (ord.despacho || 'Tienda') + ' · <strong style="color:var(--text-secondary);">Pago:</strong> ' + (ord.metodo_pago || 'PM').toUpperCase() + '</span>' +
      '    <strong style="color:var(--gold-primary); font-size:1.15rem;">Total: $' + ord.total.toFixed(2) + ' <small style="color:var(--text-muted); font-size:0.85rem;">(' + totalBs + ')</small></strong>' +
      '  </div>' +
      '</div>';
  });

  html += '</div>';
  cont.innerHTML = html;
}

function confirmarValidarPagoPedido(ordenId) {
  var orden = MotorSQL.consultar('ordenes', function (o) { return o.id === ordenId; })[0];
  if (!orden) return;

  Notificaciones.confirmar(
    '¿Estás seguro de que deseas validar el pago de la orden <strong style="color:#ffffff;">#' + ordenId + '</strong> por un monto de <strong style="color:#10b981;">$' + orden.total.toFixed(2) + '</strong>?<br><br><span style="color:#f59e0b; font-size:0.86rem;">⚠️ Recuerda verificar primero en tu cuenta bancaria o WhatsApp que el dinero haya ingresado efectivamente.</span>',
    'Confirmar Validación de Pago',
    function () {
      // 1. Cambiar estado a 'en_camino'
      MotorSQL.actualizar('ordenes', function (o) { return o.id === ordenId; }, { estado: 'en_camino' });

      // 2. Descontar stock atómicamente de la talla específica de cada joya
      var detalles = MotorSQL.consultar('detalle_ordenes', function (d) { return d.orden_id === ordenId; });
      detalles.forEach(function (d) {
        var tallaComprada = d.personalizacion || 'Estándar';
        if (typeof MotorSQL.actualizarStockTalla === 'function') {
          MotorSQL.actualizarStockTalla(d.producto_id, tallaComprada, -d.cantidad);
        } else {
          var prod = MotorSQL.consultar('productos', function (p) { return p.id === d.producto_id; })[0];
          if (prod) {
            var nuevoStock = Math.max(0, (prod.stock || 0) - d.cantidad);
            MotorSQL.actualizar('productos', function (p) { return p.id === d.producto_id; }, { stock: nuevoStock });
          }
        }
      });

      // 3. Al validar el pago, se borra el pedido del carrito de compra y ya permite agregar otros productos
      var uActual = Api.leer('sesion_actual', null);
      if (uActual && uActual.id === orden.usuario_id) {
        if (typeof Cart !== 'undefined') {
          Cart.vaciar(true);
        }
      } else {
        // Limpiar el carrito tanto global como el específico del usuario de la orden
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('inveranoli_carrito_items', JSON.stringify([]));
            if (orden.usuario_id) {
              localStorage.setItem('inveranoli_carrito_items_user_' + orden.usuario_id, JSON.stringify([]));
            }
          }
        } catch (e) { }
      }

      renderAdminPedidosTabla();
      refrescarCatalogoCliente();
      if (typeof renderAdminTabla === 'function') renderAdminTabla();
      actualizarDashboardFinanciero();
      if (typeof Cart !== 'undefined') {
        Cart.actualizarBadges();
      }

      Notificaciones.alerta('¡Pago Validado! El pedido #' + ordenId + ' ahora se encuentra En Camino. El carrito del cliente ha sido liberado para permitirle agregar nuevos productos.', 'Pago Validado Exitosamente');
    }
  );
}

function marcarPedidoEntregado(ordenId) {
  Notificaciones.confirmar(
    '¿Confirmas que el cliente ya recibió su pedido <strong style="color:#ffffff;">#' + ordenId + '</strong>?',
    'Confirmar Entrega de Pedido',
    function () {
      MotorSQL.actualizar('ordenes', function (o) { return o.id === ordenId; }, { estado: 'entregado' });
      renderAdminPedidosTabla();
      actualizarDashboardFinanciero();
      Notificaciones.toast('Pedido #' + ordenId + ' marcado como ENTREGADO.', 'exito');
    }
  );
}

// ====================================================================
// GESTIÓN Y REACTIVIDAD DE BASE DE DATOS (.SQL)
// Permite sincronizar productos desde un archivo .sql o vaciarlos
// ====================================================================
function procesarArchivoSQLAdmin(evento) {
  var file = evento.target.files && evento.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function (e) {
    var contenido = e.target.result;
    var res = MotorSQL.cargarDesdeSQL(contenido);
    var box = document.getElementById('admin-sql-resultado');

    if (res && res.exito) {
      refrescarCatalogoCliente();
      if (typeof renderAdminTabla === 'function') renderAdminTabla();

      if (box) {
        box.style.display = 'block';
        box.style.background = 'rgba(16, 185, 129, 0.15)';
        box.style.color = '#10b981';
        box.style.border = '1px solid #10b981';
        box.innerHTML = '<strong>✓ Base de datos sincronizada:</strong> Se cargaron ' + res.productos + ' joyas y ' + res.categorias + ' categorías desde ' + file.name + '.';
      }
      Notificaciones.toast('¡Archivo ' + file.name + ' importado con éxito!', 'exito', 4500);
    } else {
      Notificaciones.alerta('No se pudieron extraer registros válidos del archivo SQL. Verifica la estructura del archivo.', 'Error en Importación');
    }
  };
  reader.readAsText(file);
}

// Sincroniza el catálogo consultando al servidor dedicado de base de datos (puerto 3001)
async function recargarCatalogoDesdeServidorSQL() {
  var box = document.getElementById('admin-sql-resultado');
  try {
    var res = await MotorSQL.sincronizarDesdeServidorBD();
    if (res && res.conectado) {
      refrescarCatalogoCliente();
      if (typeof renderAdminTabla === 'function') renderAdminTabla();

      if (box) {
        box.style.display = 'block';
        box.style.background = 'rgba(16, 185, 129, 0.15)';
        box.style.color = '#10b981';
        box.style.border = '1px solid #10b981';
        box.innerHTML = '<strong>✓ Servidor de Base de Datos Conectado:</strong> ' + res.productos + ' joyas y ' + res.categorias + ' categorías sincronizadas desde el servidor (puerto 3001).';
      }
      Notificaciones.toast('¡Catálogo sincronizado desde el Servidor de BD!', 'exito');
    } else {
      throw new Error(res.mensaje || 'Servidor apagado o no responde en el puerto 3001.');
    }
  } catch (err) {
    if (box) {
      box.style.display = 'block';
      box.style.background = 'rgba(239, 68, 68, 0.15)';
      box.style.color = '#ef4444';
      box.style.border = '1px solid #ef4444';
      box.innerHTML = '<strong>Servidor de Base de Datos Inactivo:</strong> Para cargar los productos, ejecuta <code>iniciar_servidor_bd.bat</code> o <code>node servidor_database.js</code> en tu terminal. También puedes cargar manualmente el archivo con el botón <strong>"📂 Elegir archivo .sql"</strong>.';
    }
    Notificaciones.alerta('El servidor de base de datos en el puerto 3001 no está encendido. Ejecuta iniciar_servidor_bd.bat para levantarlo.', 'Servidor Desconectado');
  }
}

// Simula el borrado del archivo .sql: se vacían todos los productos de la página
function simularBorradoBaseDeDatos() {
  Notificaciones.confirmar(
    '¿Deseas simular la eliminación del archivo SQL? Todos los productos desaparecerán inmediatamente de la tienda hasta que vuelvas a cargar o restaurar el archivo schema.sql.',
    'Simular Borrado de Base de Datos',
    function () {
      MotorSQL.vaciarTabla('productos');
      refrescarCatalogoCliente();
      Notificaciones.toast('Catálogo vaciado. Los productos han desaparecido.', 'aviso', 4000);
    }
  );
}

// ====================================================================
// GESTIÓN FINANCIERA & DASHBOARD (4 Columnas)
// Dinero Total = Ganancia - Gastos
// Ganancia = Pedidos Validados (en_camino + entregado)
// Gastos = Pedidos de Entrada a Fábricas
// Pendiente = Pedidos por Validar (pendiente)
// ====================================================================
function actualizarDashboardFinanciero() {
  var ordenes = MotorSQL.consultar('ordenes');
  var pedidosEntrada = MotorSQL.consultar('pedidos_entrada');

  var ganancia = 0;
  var pendiente = 0;
  var gastos = 0;

  ordenes.forEach(function (o) {
    var tot = parseFloat(o.total) || 0;
    var est = o.estado || 'pendiente';
    if (est === 'en_camino' || est === 'camino' || est === 'entregado') {
      ganancia += tot;
    } else {
      pendiente += tot;
    }
  });

  pedidosEntrada.forEach(function (pe) {
    var totGastado = parseFloat(pe.total_usd) || 0;
    gastos += totGastado;
  });

  var dineroTotal = ganancia - gastos;

  var elTotal = document.getElementById('dash-dinero-total');
  var elGanancia = document.getElementById('dash-ganancia');
  var elGastos = document.getElementById('dash-gastos');
  var elPendiente = document.getElementById('dash-pendiente');

  if (elTotal) elTotal.textContent = (dineroTotal < 0 ? '-$' : '$') + Math.abs(dineroTotal).toFixed(2);
  if (elGanancia) elGanancia.textContent = '$' + ganancia.toFixed(2);
  if (elGastos) elGastos.textContent = '$' + gastos.toFixed(2);
  if (elPendiente) elPendiente.textContent = '$' + pendiente.toFixed(2);
}

// ====================================================================
// BOTON 4: PEDIDOS DE ENTRADA (FÁBRICAS MAYORISTAS DE JOYAS)
// ====================================================================
var fabricaSeleccionadaId = null;

function renderAdminFabricasSeccion() {
  poblarSelectFabricas();
  renderPedidosEntradaLista();
}

function poblarSelectFabricas() {
  var select = document.getElementById('admin-select-fabrica');
  var btnComprar = document.getElementById('btn-comprar-fabrica');
  if (!select) return;

  var fabricas = MotorSQL.consultar('fabricas');
  select.innerHTML = '<option value="">-- Selecciona una fábrica de joyas registrada --</option>';

  fabricas.forEach(function (f) {
    var opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = f.nombre + ' (' + f.rif + ') - ' + f.direccion;
    select.appendChild(opt);
  });

  if (fabricaSeleccionadaId) {
    select.value = fabricaSeleccionadaId;
    if (btnComprar) btnComprar.disabled = false;
  } else if (btnComprar) {
    btnComprar.disabled = true;
  }
}

function seleccionarFabricaParaPedido(val) {
  var btnComprar = document.getElementById('btn-comprar-fabrica');
  fabricaSeleccionadaId = val ? Number(val) : null;
  if (btnComprar) btnComprar.disabled = !fabricaSeleccionadaId;
}

function abrirModalRegistrarFabrica() {
  var modal = document.getElementById('modal-fabrica-registro');
  var form = document.getElementById('form-registrar-fabrica');
  if (form) form.reset();
  if (modal) modal.style.display = 'flex';
}

function cerrarModalRegistrarFabrica() {
  var modal = document.getElementById('modal-fabrica-registro');
  if (modal) modal.style.display = 'none';
}

function guardarNuevaFabrica(e) {
  e.preventDefault();
  var nombre = document.getElementById('fab-nombre').value.trim();
  var rif = document.getElementById('fab-rif').value.trim();
  var tel = document.getElementById('fab-telefono').value.trim();
  var dir = document.getElementById('fab-direccion').value.trim();
  var contacto = document.getElementById('fab-contacto').value.trim();

  if (!nombre || !rif || !tel || !dir) {
    return Notificaciones.alerta('Todos los campos son obligatorios.', 'Faltan Datos');
  }

  var nueva = MotorSQL.insertar('fabricas', {
    nombre: nombre,
    rif: rif,
    telefono: tel,
    direccion: dir,
    contacto: contacto,
    fecha_registro: new Date().toLocaleDateString('es-VE')
  });

  fabricaSeleccionadaId = nueva.id;
  cerrarModalRegistrarFabrica();
  poblarSelectFabricas();
  Notificaciones.toast('¡Fábrica "' + nombre + '" registrada con éxito!', 'exito');
}

// Catálogo de compra al por mayor a fábrica
function abrirCatalogoCompraFabrica() {
  if (!fabricaSeleccionadaId) {
    return Notificaciones.alerta('Por favor selecciona una fábrica registrada en el selector.', 'Selecciona Fábrica');
  }

  var fabrica = MotorSQL.consultar('fabricas', function (f) { return f.id === fabricaSeleccionadaId; })[0];
  if (!fabrica) return;

  var modal = document.getElementById('modal-compra-fabrica');
  var sub = document.getElementById('compra-fabrica-subtitulo');
  var tbody = document.getElementById('compra-fabrica-tabla-cuerpo');
  var totalUSD = document.getElementById('compra-fabrica-total-usd');

  if (sub) sub.textContent = 'Fábrica: ' + fabrica.nombre + ' (' + fabrica.rif + ') • Contacto: ' + (fabrica.contacto || fabrica.telefono);
  if (totalUSD) totalUSD.textContent = '$0.00';

  var productos = MotorSQL.consultar('productos');
  if (!productos.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#cbd5e1;">No hay joyas en el catálogo general. Registra joyas primero.</td></tr>';
    if (modal) modal.style.display = 'flex';
    return;
  }

  tbody.innerHTML = '';
  productos.forEach(function (p) {
    // REGLA COMERCIAL: Los productos tienen un 50% mayor al precio de fábrica.
    // Ej. Anillo vale $20 en fábrica -> se vende en $30 en la tienda.
    // costoFabrica = precioVenta / 1.5
    var costoFabrica = parseFloat((p.precio / 1.5).toFixed(2));
    var stockTallas = MotorSQL.obtenerStockTallas(p);
    var tallasKeys = Object.keys(stockTallas);

    var selectTallasHTML = '<select class="select-compra-fabrica-talla" data-prod-id="' + p.id + '" style="padding:6px; border:1px solid var(--border-gold); border-radius:4px; background:var(--input-bg); color:var(--text-primary); font-size:0.85rem; width:100%;">';
    tallasKeys.forEach(function (t) {
      selectTallasHTML += '<option value="' + t + '">' + t + ' (disp: ' + (stockTallas[t] || 0) + ')</option>';
    });
    selectTallasHTML += '</select>';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' +
      '  <strong>' + p.nombre + '</strong><br>' +
      '  <small style="color:var(--text-muted);">' + (p.presentacion || '') + ' · Tallas: ' + (p.tallas || 'Estándar') + '</small>' +
      '</td>' +
      '<td style="color:#10b981; font-weight:700;">$' + p.precio.toFixed(2) + '</td>' +
      '<td style="color:#ef4444; font-weight:700;">$' + costoFabrica.toFixed(2) + '</td>' +
      '<td>' + p.stock + ' disp.</td>' +
      '<td>' + selectTallasHTML + '</td>' +
      '<td>' +
      '  <input type="number" min="0" max="500" value="0" class="input-compra-fabrica" data-prod-id="' + p.id + '" data-costo="' + costoFabrica + '" style="width:75px; padding:6px; border:1px solid var(--border-gold); border-radius:4px; background:var(--input-bg); color:var(--text-primary); text-align:center;" oninput="calcularTotalCompraFabrica()">' +
      '</td>';
    tbody.appendChild(tr);
  });

  if (modal) modal.style.display = 'flex';
}

function cerrarCatalogoCompraFabrica() {
  var modal = document.getElementById('modal-compra-fabrica');
  if (modal) modal.style.display = 'none';
}

function calcularTotalCompraFabrica() {
  var inputs = document.querySelectorAll('.input-compra-fabrica');
  var total = 0;
  inputs.forEach(function (inp) {
    var cant = parseInt(inp.value, 10) || 0;
    var costo = parseFloat(inp.getAttribute('data-costo')) || 0;
    if (cant > 0) total += cant * costo;
  });

  var elTotal = document.getElementById('compra-fabrica-total-usd');
  if (elTotal) elTotal.textContent = '$' + total.toFixed(2);
  return total;
}

function confirmarPedidoAFabrica() {
  var inputs = document.querySelectorAll('.input-compra-fabrica');
  var items = [];
  var totalGasto = 0;

  inputs.forEach(function (inp) {
    var cant = parseInt(inp.value, 10) || 0;
    var prodId = parseInt(inp.getAttribute('data-prod-id'), 10);
    var costo = parseFloat(inp.getAttribute('data-costo')) || 0;
    if (cant > 0) {
      var prod = MotorSQL.consultar('productos', function (p) { return p.id === prodId; })[0];
      var selTallaEl = document.querySelector('.select-compra-fabrica-talla[data-prod-id="' + prodId + '"]');
      var tallaElegida = selTallaEl ? selTallaEl.value : 'Estándar';

      items.push({
        producto_id: prodId,
        nombre: prod ? prod.nombre : 'Joya',
        talla: tallaElegida,
        presentacion: prod ? prod.presentacion : '',
        precio_venta: prod ? prod.precio : 0,
        costo_fabrica: costo,
        cantidad: cant,
        subtotal: cant * costo
      });
      totalGasto += cant * costo;
    }
  });

  if (!items.length) {
    return Notificaciones.alerta('Debes seleccionar al menos una joya con cantidad mayor a 0 para pedir a la fábrica.', 'Pedido Vacío');
  }

  var fabrica = MotorSQL.consultar('fabricas', function (f) { return f.id === fabricaSeleccionadaId; })[0];
  var pedidoId = 'PE-FAB-' + Math.floor(100000 + Math.random() * 900000);
  var ahora = Date.now();
  var tiempo24h = 24 * 60 * 60 * 1000;

  MotorSQL.insertar('pedidos_entrada', {
    id: pedidoId,
    fabrica_id: fabrica.id,
    fabrica_nombre: fabrica.nombre,
    fabrica_rif: fabrica.rif,
    fabrica_direccion: fabrica.direccion,
    fabrica_telefono: fabrica.telefono,
    fecha_pedido: new Date().toLocaleString('es-VE'),
    timestamp_creacion: ahora,
    timestamp_llegada: ahora + tiempo24h,
    total_usd: totalGasto,
    estado: 'en_camino', // 'en_camino', 'recibido'
    items: items
  });

  cerrarCatalogoCompraFabrica();
  renderPedidosEntradaLista();
  actualizarDashboardFinanciero();

  Notificaciones.alerta(
    '¡Pedido a fábrica <strong>#' + pedidoId + '</strong> realizado exitosamente!<br><br>Total invertido: <strong style="color:#ef4444;">$' + totalGasto.toFixed(2) + '</strong>.<br>El pedido tiene un tiempo estimado de <strong>24 horas</strong>. En el registro podrás acelerar el tiempo para recibir el stock inmediatamente.',
    'Pedido a Fábrica Registrado'
  );
}

function renderPedidosEntradaLista() {
  var cont = document.getElementById('admin-pedidos-entrada-lista');
  if (!cont) return;

  var pedidos = MotorSQL.consultar('pedidos_entrada');
  if (!pedidos.length) {
    cont.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">No hay pedidos de entrada registrados aún.</div>';
    return;
  }

  var ahora = Date.now();
  var html = '';

  pedidos.slice().reverse().forEach(function (pe) {
    var llegoTiempo = ahora >= pe.timestamp_llegada;
    var botonHTML = '';

    if (pe.estado === 'recibido') {
      botonHTML = '<button type="button" class="btn btn-sm btn-detalle" onclick="mostrarFacturaFabrica(\'' + pe.id + '\')">📄 Mostrar Factura</button>';
    } else if (llegoTiempo) {
      botonHTML = '<button type="button" class="btn btn-sm" style="background:#10b981; color:#fff; font-weight:800;" onclick="recibirPedidoFabrica(\'' + pe.id + '\')">📥 Recibir Pedido (+ Stock)</button>';
    } else {
      botonHTML = '<button type="button" class="btn btn-sm btn-hero-gold" onclick="acelerarTiempoPedidoFabrica(\'' + pe.id + '\')">⏳ En camino (Simular 24h)</button>';
    }

    html +=
      '<div class="pedido-entrada-card">' +
      '  <div>' +
      '    <strong style="color:var(--gold-light); font-size:1rem;">Pedido #' + pe.id + '</strong> · <small style="color:var(--text-muted);">' + pe.fecha_pedido + '</small><br>' +
      '    <span style="color:var(--text-secondary); font-size:0.9rem;">Fábrica: <strong>' + pe.fabrica_nombre + '</strong> (' + pe.fabrica_rif + ')</span><br>' +
      '    <small style="color:var(--text-muted);">' + pe.items.length + ' modelo(s) de joya solicitados</small>' +
      '  </div>' +
      '  <div style="text-align:right;">' +
      '    <strong style="color:#ef4444; font-size:1.15rem; display:block; margin-bottom:6px;">Gasto: $' + pe.total_usd.toFixed(2) + '</strong>' +
      '    ' + botonHTML +
      '  </div>' +
      '</div>';
  });

  cont.innerHTML = html;
}

function acelerarTiempoPedidoFabrica(pedidoId) {
  Notificaciones.confirmar(
    '¿Desea acelerar el tiempo y recibir su pedido de joyas inmediatamente?<br><br><span style="color:#94a3b8; font-size:0.86rem;">Como este es un entorno de demostración comercial simulado, puedes adelantar las 24 horas y reponer el stock al instante.</span>',
    'Acelerar Tiempo de Entrega',
    function () {
      recibirPedidoFabrica(pedidoId);
    }
  );
}

function recibirPedidoFabrica(pedidoId) {
  var pe = MotorSQL.consultar('pedidos_entrada', function (p) { return p.id === pedidoId; })[0];
  if (!pe) return;

  // Aumentar stock de cada joya pedida en su talla específica
  pe.items.forEach(function (it) {
    if (it.talla) {
      MotorSQL.actualizarStockTalla(it.producto_id, it.talla, it.cantidad);
    } else {
      var prod = MotorSQL.consultar('productos', function (p) { return p.id === it.producto_id; })[0];
      if (prod) {
        var nuevoStock = (prod.stock || 0) + it.cantidad;
        MotorSQL.actualizar('productos', function (p) { return p.id === it.producto_id; }, { stock: nuevoStock });
      }
    }
  });

  // Marcar pedido como recibido
  MotorSQL.actualizar('pedidos_entrada', function (p) { return p.id === pedidoId; }, { estado: 'recibido' });

  renderPedidosEntradaLista();
  renderAdminTabla();
  refrescarCatalogoCliente();
  actualizarDashboardFinanciero();

  Notificaciones.alerta(
    '¡Pedido de fábrica <strong>#' + pedidoId + '</strong> recibido con éxito!<br><br>Se ha incrementado el stock por tallas de todas las joyas solicitadas. Ahora puedes hacer clic en <strong>"Mostrar Factura"</strong> para ver el documento formal de compra.',
    'Stock Incrementado Exitosamente'
  );
}

function mostrarFacturaFabrica(pedidoId) {
  var pe = MotorSQL.consultar('pedidos_entrada', function (p) { return p.id === pedidoId; })[0];
  if (!pe) return;

  var cont = document.getElementById('contenido-factura-imprimible');
  var modal = document.getElementById('modal-factura-fabrica');
  if (!cont || !modal) return;

  var totalBs = typeof TasaBCV !== 'undefined' ? TasaBCV.convertirBs(pe.total_usd) : '';

  var lineasHTML = '';
  (pe.items || []).forEach(function (it, idx) {
    var detalleTalla = it.talla ? ' · <span style="color:#d97706; font-weight:700;">Talla: ' + it.talla + '</span>' : '';
    lineasHTML +=
      '<tr>' +
      '  <td>' + (idx + 1) + '</td>' +
      '  <td><strong>' + it.nombre + '</strong><br><small style="color:#64748b;">' + it.presentacion + detalleTalla + '</small></td>' +
      '  <td style="text-align:center;">' + it.cantidad + '</td>' +
      '  <td style="text-align:right;">$' + it.costo_fabrica.toFixed(2) + '</td>' +
      '  <td style="text-align:right;"><strong>$' + it.subtotal.toFixed(2) + '</strong></td>' +
      '</tr>';
  });

  cont.innerHTML =
    '<div class="factura-header">' +
    '  <div>' +
    '    <h2 style="color:#0f172a; margin:0 0 4px 0; font-size:1.35rem;">FACTURA DE COMPRA MAYORISTA</h2>' +
    '    <p style="margin:0; font-size:0.9rem; color:#475569;"><strong>Proveedor:</strong> ' + pe.fabrica_nombre + '</p>' +
    '    <p style="margin:0; font-size:0.85rem; color:#475569;"><strong>RIF:</strong> ' + pe.fabrica_rif + ' • <strong>Tel:</strong> ' + pe.fabrica_telefono + '</p>' +
    '    <p style="margin:0; font-size:0.85rem; color:#475569;"><strong>Ubicación:</strong> ' + pe.fabrica_direccion + '</p>' +
    '  </div>' +
    '  <div style="text-align:right;">' +
    '    <h3 style="color:#d97706; margin:0 0 4px 0;">N° ' + pe.id + '</h3>' +
    '    <p style="margin:0; font-size:0.85rem; color:#64748b;"><strong>Fecha de Emisión:</strong><br>' + pe.fecha_pedido + '</p>' +
    '    <span style="display:inline-block; background:#dcfce7; color:#166534; padding:3px 8px; border-radius:4px; font-weight:800; font-size:0.75rem; margin-top:6px;">PAGADA Y RECIBIDA</span>' +
    '  </div>' +
    '</div>' +
    '<div style="margin-bottom:14px; font-size:0.88rem; color:#334155;">' +
    '  <strong>Cliente / Comprador:</strong> INVERANOLI Joyería Fina C.A. (RIF: J-50478161-0) • CC Gran Bazar, Valencia<br>' +
    '  <strong>Modalidad:</strong> Compra de Inventario al por Mayor para Reposición' +
    '</div>' +
    '<table class="factura-tabla">' +
    '  <thead>' +
    '    <tr>' +
    '      <th style="width:30px;">#</th>' +
    '      <th>Descripción de la Joya</th>' +
    '      <th style="width:70px; text-align:center;">Cant.</th>' +
    '      <th style="width:110px; text-align:right;">Costo Fábrica</th>' +
    '      <th style="width:110px; text-align:right;">Total</th>' +
    '    </tr>' +
    '  </thead>' +
    '  <tbody>' + lineasHTML + '</tbody>' +
    '</table>' +
    '<div style="display:flex; justify-content:flex-end; margin-top:16px;">' +
    '  <div style="text-align:right; min-width:220px; border-top:2px solid #0f172a; padding-top:10px;">' +
    '    <div style="font-size:0.95rem; color:#475569;">Subtotal Fábrica: <strong>$' + pe.total_usd.toFixed(2) + '</strong></div>' +
    '    <div style="font-size:1.3rem; color:#0f172a; font-weight:800; margin-top:4px;">TOTAL: $' + pe.total_usd.toFixed(2) + '</div>' +
    '    <div style="font-size:0.85rem; color:#d97706; font-weight:700;">Equivalente BCV: ' + totalBs + '</div>' +
    '  </div>' +
    '</div>';

  modal.style.display = 'flex';
}

function cerrarFacturaFabrica() {
  var modal = document.getElementById('modal-factura-fabrica');
  if (modal) modal.style.display = 'none';
}

