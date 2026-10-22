/**
 * admin.js — Panel de Control y Administración de Inventario para INEVAROLI
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
  var salAdmin = 'sal_admin_inevaroli_2026';
  var hashAdmin = await hashearPassword('Admin123*', salAdmin);

  if (!adminUser) {
    MotorSQL.insertar('usuarios', {
      id: 1,
      nombre: 'Administrador',
      apellido: 'INEVAROLI',
      cedula: '12345678',
      telefono: '04125006377',
      email: 'admin@inevaroli.com',
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
  var salCli = 'sal_cliente_inevaroli_2026';
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
  cambiarSeccionAdmin('productos');
}

function cerrarAdminModal() {
  var modal = document.getElementById('modal-admin');
  if (modal) modal.style.display = 'none';
}

// Alternar entre pestañas del panel administrativo
function cambiarSeccionAdmin(seccion) {
  var secProds = document.getElementById('admin-sec-productos');
  var secCats  = document.getElementById('admin-sec-categorias');
  var secPeds  = document.getElementById('admin-sec-pedidos');
  var secBD    = document.getElementById('admin-sec-basedatos');

  var tabProds = document.getElementById('tab-admin-productos');
  var tabCats  = document.getElementById('tab-admin-categorias');
  var tabPeds  = document.getElementById('tab-admin-pedidos');
  var tabBD    = document.getElementById('tab-admin-basedatos');

  if (secProds) secProds.style.display = 'none';
  if (secCats)  secCats.style.display  = 'none';
  if (secPeds)  secPeds.style.display  = 'none';
  if (secBD)    secBD.style.display    = 'none';

  [tabProds, tabCats, tabPeds, tabBD].forEach(function (t) {
    if (t) t.classList.remove('activo');
  });

  if (seccion === 'categorias') {
    if (secCats)  secCats.style.display = 'block';
    if (tabCats)  tabCats.classList.add('activo');
    renderAdminCategoriasTabla();
  } else if (seccion === 'pedidos') {
    if (secPeds)  secPeds.style.display = 'block';
    if (tabPeds)  tabPeds.classList.add('activo');
    renderAdminPedidosTabla();
  } else if (seccion === 'basedatos') {
    if (secBD)    secBD.style.display = 'block';
    if (tabBD)    tabBD.classList.add('activo');
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
    var esRec = !!p.recomendado;

    // Botón Recomendado
    var recHTML = '<button type="button" class="btn-sm ' + (esRec ? 'btn-rec-si' : 'btn-rec-no') + '" onclick="toggleProductoRecomendado(' + p.id + ')" title="Alternar en destacados">' +
                  (esRec ? '★ Sí' : '☆ No') + '</button>';

    // Stock Badge con Alerta Visual
    var stockBadge = '';
    if (p.stock <= 0) {
      stockBadge = '<span class="badge-stock-admin agotado">0 (Agotado)</span>';
    } else if (p.stock <= 5) {
      stockBadge = '<span class="badge-stock-admin critico">' + p.stock + ' (Bajo)</span>';
    } else {
      stockBadge = '<span class="badge-stock-admin disponible">' + p.stock + ' disp.</span>';
    }

    // Foto pequeña de previsualización
    var foto = (p.imagenes && p.imagenes.length) ? p.imagenes[0] : 'images/prod_1_grado_bachiller_ciencias.jpg';

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
      '<td>' + stockBadge + '</td>' +
      '<td><span style="color:' + (activo ? '#16a34a' : '#ef4444') + '; font-weight:bold;">' + (activo ? '● Activo' : '○ Pausado') + '</span></td>' +
      '<td>' +
      '  <div class="admin-acciones-grid">' +
      '    <button type="button" class="btn-sm btn-stock" onclick="reponerStock(' + p.id + ')" title="Agregar más unidades al stock">+ Stock</button>' +
      '    <button type="button" class="btn-sm btn-editar" onclick="abrirFormularioProductoModal(' + p.id + ')" title="Editar información">Editar</button>' +
      '    <button type="button" class="btn-sm ' + (activo ? 'btn-desactivar' : 'btn-activar') + '" onclick="toggleProductoEstado(' + p.id + ')">' + (activo ? 'Pausar' : 'Activar') + '</button>' +
      '    <button type="button" class="btn-sm btn-eliminar-prod" onclick="eliminarProductoCompletamente(' + p.id + ')" title="Borrar joya permanentemente">Eliminar</button>' +
      '  </div>' +
      '</td>';

    tbody.appendChild(tr);
  });
}

// ====================================================================
// REPOSICIÓN INMEDIATA DE STOCK (+ Stock)
// Utiliza el modal en página personalizado sin usar prompt del navegador
// ====================================================================
function reponerStock(id) {
  var p = MotorSQL.consultar('productos', function (x) { return x.id === Number(id); })[0];
  if (!p) {
    Notificaciones.alerta('Joya no encontrada en la base de datos.', 'Error');
    return;
  }

  var mensajePrompt =
    'Joya: <strong style="color:#ffffff;">' + p.nombre + '</strong><br>' +
    'Material: <span style="color:#e5c158;">' + (p.presentacion || 'Joyería Fina') + '</span><br>' +
    'Stock Actual: <strong style="color:#22c55e;">' + p.stock + ' unidades</strong><br><br>' +
    'Ingresa la cantidad de unidades que deseas agregar al inventario:';

  Notificaciones.prompt(
    mensajePrompt,
    'Reposición de Stock — INEVAROLI',
    '10',
    function (cantidad) {
      if (!cantidad) return;
      var suma = parseInt(String(cantidad).trim(), 10);
      if (isNaN(suma) || suma <= 0 || !/^\d+$/.test(String(cantidad).trim())) {
        Notificaciones.alerta('Debes ingresar un número entero mayor a 0 (ejemplo: 5, 10, 20).', 'Cantidad Inválida');
        return;
      }

      var nuevoStock = p.stock + suma;
      MotorSQL.actualizar('productos', function (x) { return x.id === p.id; }, { stock: nuevoStock });

      renderAdminTabla();
      if (typeof renderProductos === 'function') renderProductos();

      Notificaciones.toast('¡+' + suma + ' unidades añadidas a "' + p.nombre + '"! Stock total: ' + nuevoStock, 'exito');
    },
    null,
    'number'
  );
}

// Activar o pausar visibilidad de un producto
function toggleProductoEstado(id) {
  var p = MotorSQL.consultar('productos', function (x) { return x.id === Number(id); })[0];
  if (p) {
    var nuevo = p.activo === false ? true : false;
    MotorSQL.actualizar('productos', function (x) { return x.id === Number(id); }, { activo: nuevo });
    renderAdminTabla();
    if (typeof renderProductos === 'function') renderProductos();
    Notificaciones.toast('Joya "' + p.nombre + '" ' + (nuevo ? 'activada' : 'pausada') + ' correctamente.', 'info');
  }
}

// Alternar en destacados / recomendados
function toggleProductoRecomendado(id) {
  var p = MotorSQL.consultar('productos', function (x) { return x.id === Number(id); })[0];
  if (p) {
    var nuevo = !p.recomendado;
    MotorSQL.actualizar('productos', function (x) { return x.id === Number(id); }, { recomendado: nuevo });
    renderAdminTabla();
    if (typeof renderProductos === 'function') renderProductos();
    Notificaciones.toast('"' + p.nombre + '" ' + (nuevo ? 'agregado a destacados.' : 'removido de destacados.'), 'info');
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
      if (typeof renderProductos === 'function') renderProductos();
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

  var fotoFinal = imagenBase64Seleccionada || urlFoto || 'images/prod_1_grado_bachiller_ciencias.jpg';

  if (id) {
    // Modo Edición
    MotorSQL.actualizar('productos', function (x) { return x.id === Number(id); }, {
      nombre: nombre,
      presentacion: pres,
      categoria_id: catId,
      precio: precio,
      stock: stock,
      descripcion: desc,
      tallas: tallas,
      piedras: piedras,
      recomendado: recomendado,
      imagenes: [fotoFinal]
    });
    Notificaciones.toast('¡Joya "' + nombre + '" actualizada con éxito!', 'exito');
  } else {
    // Modo Creación
    MotorSQL.insertar('productos', {
      nombre: nombre,
      presentacion: pres,
      categoria_id: catId,
      precio: precio,
      stock: stock,
      descripcion: desc,
      tallas: tallas,
      piedras: piedras,
      recomendado: recomendado,
      activo: true,
      imagenes: [fotoFinal]
    });
    Notificaciones.toast('¡Nueva joya "' + nombre + '" registrada en inventario!', 'exito');
  }

  cerrarFormularioProductoModal();
  renderAdminTabla();
  if (typeof renderProductos === 'function') renderProductos();
  if (typeof actualizarCategoriasUI === 'function') actualizarCategoriasUI();
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
      if (typeof actualizarCategoriasUI === 'function') actualizarCategoriasUI();
      if (typeof renderProductos === 'function') renderProductos();
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
      if (typeof actualizarCategoriasUI === 'function') actualizarCategoriasUI();
      if (typeof renderProductos === 'function') renderProductos();
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
      if (typeof actualizarCategoriasUI === 'function') actualizarCategoriasUI();
      if (typeof renderProductos === 'function') renderProductos();
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
      { id: 'recibido', label: 'Recibido' },
      { id: 'preparacion', label: 'En Taller / Ajuste' },
      { id: 'camino', label: 'Listo / En Camino' },
      { id: 'entregado', label: 'Entregado' }
    ];

    var estadoActual = ord.estado || 'recibido';
    var ordenIndice = { 'recibido': 0, 'preparacion': 1, 'camino': 2, 'entregado': 3 };
    var indiceActual = ordenIndice[estadoActual] !== undefined ? ordenIndice[estadoActual] : 0;

    var selectOptionsHTML = '';
    ESTADOS_ORDEN.forEach(function (estObj, idx) {
      if (idx === indiceActual) {
        selectOptionsHTML += '<option value="' + estObj.id + '" selected>' + estObj.label + ' (Actual)</option>';
      } else if (idx > indiceActual) {
        selectOptionsHTML += '<option value="' + estObj.id + '">Avanzar a: ' + estObj.label + '</option>';
      } else {
        // No se permite regresar a un estado anterior
        selectOptionsHTML += '<option value="' + estObj.id + '" disabled style="color:#64748b;">' + estObj.label + ' (Bloqueado)</option>';
      }
    });

    html +=
      '<div class="admin-pedido-card">' +
      '  <div class="admin-pedido-header">' +
      '    <div>' +
      '      <strong style="color:var(--card-text-title); font-size:1rem;">Orden #' + ord.id + '</strong> · <small style="color:var(--text-muted);">' + ord.fecha + '</small><br>' +
      '      <span style="color:var(--text-secondary);">Cliente: <strong style="color:var(--card-text-title);">' + u.nombre + ' ' + u.apellido + '</strong> (C.I. ' + u.cedula + ') · Tel: <span style="color:var(--gold-primary); font-weight:700;">' + u.telefono + '</span></span>' +
      '    </div>' +
      '    <div style="text-align:right;">' +
      '      <label style="font-size:0.8rem; font-weight:700; color:var(--gold-primary);">Estado de la Orden:</label><br>' +
      (indiceActual >= 3 
        ? '<span class="badge-estado badge-entregado" style="display:inline-block; margin-top:4px; font-weight:800;">✓ PEDIDO ENTREGADO</span>'
        : '      <select class="admin-select-estado" onchange="cambiarEstadoPedidoAdmin(\'' + ord.id + '\', this.value)">' + selectOptionsHTML + '      </select>') +
      '    </div>' +
      '  </div>' +
      '  <div class="admin-pedido-body">';

    ord.detalles.forEach(function (d) {
      html +=
        '<div style="font-size:0.9rem; margin-bottom:6px; display:flex; justify-content:space-between; border-bottom:1px dashed var(--border-gold); padding-bottom:4px;">' +
        '  <span style="color:var(--text-primary);"><strong>' + d.nombre + '</strong> × ' + d.cantidad + (d.personalizacion ? ' <em style="color:var(--gold-primary);">[Grabado: ' + d.personalizacion + ']</em>' : '') + '</span>' +
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

function cambiarEstadoPedidoAdmin(ordenId, nuevoEstado) {
  var orden = MotorSQL.consultar('ordenes', function (o) { return o.id === ordenId; })[0];
  if (!orden) return;

  var ordenIndice = { 'recibido': 0, 'preparacion': 1, 'camino': 2, 'entregado': 3 };
  var idxActual = ordenIndice[orden.estado || 'recibido'] || 0;
  var idxNuevo = ordenIndice[nuevoEstado] !== undefined ? ordenIndice[nuevoEstado] : idxActual;

  // Validación estricta: No se puede regresar a un estado previo
  if (idxNuevo < idxActual) {
    Notificaciones.alerta('Regla de seguridad: El pedido no puede regresar a un estado anterior (' + (orden.estado || '').toUpperCase() + '). Solo puede avanzar progresivamente hacia Entregado.', 'Operación No Permitida');
    renderAdminPedidosTabla();
    return;
  }

  // Si pasa de "Recibido" a "En Taller / Ajuste", se descuenta el stock de los productos
  if (orden.estado === 'recibido' && nuevoEstado === 'preparacion') {
    var detalles = MotorSQL.consultar('detalle_ordenes', function (d) { return d.orden_id === ordenId; });
    detalles.forEach(function (d) {
      var prod = MotorSQL.consultar('productos', function (p) { return p.id === d.producto_id; })[0];
      if (prod) {
        var nuevoStock = Math.max(0, prod.stock - d.cantidad);
        MotorSQL.actualizar('productos', function (p) { return p.id === d.producto_id; }, { stock: nuevoStock });
      }
    });

    if (typeof renderProductos === 'function') renderProductos();
    if (typeof renderAdminTabla === 'function') renderAdminTabla();
    Notificaciones.toast('¡Pedido en taller! Se descontaron los productos del inventario.', 'aviso', 4000);
  }

  MotorSQL.actualizar('ordenes', function (o) { return o.id === ordenId; }, { estado: nuevoEstado });
  renderAdminPedidosTabla();
  Notificaciones.toast('Estado del pedido #' + ordenId + ' actualizado a: ' + nuevoEstado.toUpperCase(), 'exito');
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
      if (typeof renderProductos === 'function') renderProductos();
      if (typeof renderAdminTabla === 'function') renderAdminTabla();
      if (typeof actualizarCategoriasUI === 'function') actualizarCategoriasUI();
      if (typeof renderCarruselesSecundarios === 'function') renderCarruselesSecundarios();

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
    var res = await MotorSQL.sincronizarDesdeServidorBD('http://localhost:3001/api/database');
    if (res && res.conectado) {
      if (typeof renderProductos === 'function') renderProductos();
      if (typeof renderAdminTabla === 'function') renderAdminTabla();
      if (typeof actualizarCategoriasUI === 'function') actualizarCategoriasUI();
      if (typeof renderCarruselesSecundarios === 'function') renderCarruselesSecundarios();

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
      if (typeof renderProductos === 'function') renderProductos();
      if (typeof renderAdminTabla === 'function') renderAdminTabla();
      if (typeof renderCarruselesSecundarios === 'function') renderCarruselesSecundarios();

      var box = document.getElementById('admin-sql-resultado');
      if (box) {
        box.style.display = 'block';
        box.style.background = 'rgba(239, 68, 68, 0.15)';
        box.style.color = '#ef4444';
        box.style.border = '1px solid #ef4444';
        box.innerHTML = '<strong>Archivo .sql no disponible o vaciado:</strong> El catálogo de joyas se encuentra actualmente en 0 productos. Para restaurarlos, haz clic en "Elegir archivo .sql" o "Recargar database/schema.sql".';
      }
      Notificaciones.toast('Catálogo vaciado. Los productos han desaparecido.', 'aviso', 4000);
    }
  );
}
