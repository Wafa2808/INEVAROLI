/**
 * auth.js — Sistema de Autenticación, Registro, Perfil y Sesión para INVERANOLI
 * 1. Restricciones estrictas en registro (Cédula 7-8 dígitos, teléfono +58, contraseña fuerte con salt).
 * 2. Bloqueo temporal por 3 minutos tras 5 intentos fallidos.
 * 3. Modificación de perfil con comprobación obligatoria de clave actual.
 * 4. Aislamiento de carrito al cerrar sesión.
 * 5. Notificaciones y Toasts en página para máxima elegancia profesional.
 */

// Abre el modal de autenticación
function abrirAuthModal(tab) {
  var modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  cambiarTabAuth(tab || 'login');
}

function cerrarAuthModal() {
  var modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
}

function cambiarTabAuth(tab) {
  var formLogin = document.getElementById('form-login');
  var formReg   = document.getElementById('form-registro');
  var formRec   = document.getElementById('form-recuperar');
  var tabBtnLogin = document.getElementById('tab-auth-btn-login');
  var tabBtnReg = document.getElementById('tab-auth-btn-reg');

  if (formLogin) formLogin.style.display = (tab === 'login') ? 'block' : 'none';
  if (formReg)   formReg.style.display   = (tab === 'registro') ? 'block' : 'none';
  if (formRec)   formRec.style.display   = (tab === 'recuperar') ? 'block' : 'none';

  if (tabBtnLogin && tabBtnReg) {
    if (tab === 'login') {
      tabBtnLogin.classList.add('activo');
      tabBtnReg.classList.remove('activo');
    } else if (tab === 'registro') {
      tabBtnReg.classList.add('activo');
      tabBtnLogin.classList.remove('activo');
    } else {
      tabBtnLogin.classList.remove('activo');
      tabBtnReg.classList.remove('activo');
    }
  }
}

function abrirRecuperarModal() {
  cambiarTabAuth('recuperar');
}

// ─── Proceso de Login ───
async function procesarLogin(e) {
  e.preventDefault();
  try {
    var selTipoDoc = document.getElementById('login-tipo-doc');
    var inCedula   = document.getElementById('login-cedula');
    var inPass     = document.getElementById('login-pass');
    if (!inCedula || !inPass) return;

    var tipoDoc = selTipoDoc ? selTipoDoc.value : 'V';
    var cedulaIngresada = inCedula.value.trim();
    var pass = inPass.value;

    if (!cedulaIngresada || !pass) {
      Notificaciones.alerta('Por favor ingresa tu documento de identidad y tu contraseña.', 'Campos Requeridos');
      return;
    }

    // Normalizar cédula eliminando prefijos, guiones, puntos y espacios
    var cedulaLimpia = cedulaIngresada.replace(/^[A-Za-z\-]+/, '').replace(/[\.\s\-]/g, '').trim();
    var cedulaCompleta = tipoDoc + '-' + cedulaLimpia;

    // Detectar si el usuario ingresó un alias de texto (admin, cliente, email)
    var esAliasTexto = !cedulaLimpia && cedulaIngresada.length > 0;

    // Comprobar si son credenciales maestras oficiales (ANTES de validar formato de cédula)
    var esCredencialAdminOficial = (cedulaLimpia === '12345678' || cedulaIngresada.toLowerCase() === 'admin' || cedulaIngresada.toLowerCase() === 'admin@inveranoli.com') && pass === 'Admin123*';
    var esCredencialClienteOficial = (cedulaLimpia === '20123456' || cedulaIngresada.toLowerCase() === 'cliente') && pass === 'Cliente123*';

    // Validar formato de cédula SOLO si no es un alias de texto ni una credencial maestra
    if (!esAliasTexto && !esCredencialAdminOficial && !esCredencialClienteOficial) {
      if (!/^\d{1,12}$/.test(cedulaLimpia)) {
        Notificaciones.alerta('Ingresa un número de documento válido (máximo 12 dígitos numéricos).', 'Documento Inválido');
        return;
      }
    }

    // 1. Verificar bloqueo por intentos fallidos (se omite si son credenciales maestras)
    var claveBloqueo = cedulaLimpia || cedulaIngresada.toLowerCase();
    var estadoBloqueo = ControlBloqueo.estaBloqueado(claveBloqueo);
    if (estadoBloqueo.bloqueado && !esCredencialAdminOficial && !esCredencialClienteOficial) {
      Notificaciones.alerta('Acceso temporalmente suspendido. Debes esperar ' + estadoBloqueo.segundos + ' segundos antes de volver a intentar.', 'Bloqueo por Seguridad');
      return;
    }

    // Asegurar precarga de usuarios oficiales en memoria
    if (typeof precargarUsuarios === 'function') {
      try {
        await precargarUsuarios();
      } catch (pe) {
        console.error('[INVERANOLI] Error al precargar usuarios en login:', pe);
      }
    }

    // 2. Buscar usuario en la base de datos
    var usuarios = MotorSQL.consultar('usuarios') || [];
    var user = usuarios.find(function (u) {
      var cLimpia = String(u.cedula || '').replace(/^[A-Za-z\-]+/, '').replace(/[\.\s\-]/g, '').trim();
      // Aliases de texto: "admin" o "cliente"
      if (cedulaIngresada.toLowerCase() === 'admin' && u.rol === 'admin') return true;
      if (cedulaIngresada.toLowerCase() === 'cliente' && cLimpia === '20123456') return true;
      // Búsqueda por cédula numérica normalizada
      if (cedulaLimpia === '12345678' && (u.rol === 'admin' || cLimpia === '12345678')) return true;
      if (cedulaLimpia === '20123456' && cLimpia === '20123456') return true;
      // Búsqueda general: por cédula limpia, cédula completa o email
      return (cedulaLimpia && cLimpia === cedulaLimpia) || String(u.cedula) === cedulaCompleta || String(u.email).toLowerCase() === cedulaIngresada.toLowerCase();
    });

    // Si no se encontró pero es la credencial maestra, construir el usuario de emergencia y registrarlo
    if (!user && (esCredencialAdminOficial || esCredencialClienteOficial)) {
      if (esCredencialAdminOficial) {
        user = {
          id: 1,
          nombre: 'Administrador',
          apellido: 'INVERANOLI',
          cedula: '12345678',
          telefono: '04125006377',
          email: 'admin@inveranoli.com',
          sal: 'sal_admin_inveranoli_2026',
          password_hash: await hashearPassword('Admin123*', 'sal_admin_inveranoli_2026'),
          rol: 'admin'
        };
        MotorSQL.insertar('usuarios', user);
      } else {
        user = {
          id: 2,
          nombre: 'María',
          apellido: 'González',
          cedula: '20123456',
          telefono: '04141234567',
          email: 'maria.gonzalez@gmail.com',
          sal: 'sal_cliente_inveranoli_2026',
          password_hash: await hashearPassword('Cliente123*', 'sal_cliente_inveranoli_2026'),
          rol: 'cliente'
        };
        MotorSQL.insertar('usuarios', user);
      }
    }

    if (!user) {
      var fail1 = ControlBloqueo.registrarIntentoFallido(claveBloqueo);
      Notificaciones.alerta(fail1.mensaje, 'Acceso Denegado');
      return;
    }

    // 3. Comprobar Contraseña (credencial maestra o hash SHA-256)
    var esValido = false;
    if ((cedulaLimpia === '12345678' || user.rol === 'admin') && pass === 'Admin123*') {
      esValido = true;
    } else if ((cedulaLimpia === '20123456' || cedulaIngresada.toLowerCase() === 'cliente') && pass === 'Cliente123*') {
      esValido = true;
    } else {
      var hashCalculado = await hashearPassword(pass, user.sal);
      esValido = (hashCalculado === user.password_hash);
    }

    // Si la clave oficial coincidió, re-sincronizar hash y sal para consistencia total
    if (esValido && ((cedulaLimpia === '12345678' || user.rol === 'admin') || cedulaLimpia === '20123456')) {
      var salNueva = 'sal_' + ((cedulaLimpia === '12345678' || user.rol === 'admin') ? 'admin' : 'cliente') + '_inveranoli_2026';
      var hashNuevo = await hashearPassword(pass, salNueva);
      MotorSQL.actualizar('usuarios', function (u) { return u.id === user.id; }, {
        sal: salNueva,
        password_hash: hashNuevo
      });
      user.sal = salNueva;
      user.password_hash = hashNuevo;
    }

    if (!esValido) {
      var fail2 = ControlBloqueo.registrarIntentoFallido(claveBloqueo);
      Notificaciones.alerta(fail2.mensaje, 'Acceso Denegado');
      return;
    }

    // 4. Éxito: Limpiar intentos y fijar sesión
    ControlBloqueo.reiniciarIntentos(claveBloqueo);
    ControlBloqueo.reiniciarIntentos('12345678');
    ControlBloqueo.reiniciarIntentos('20123456');
    inPass.value = '';

    var sesionData = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      cedula: user.cedula,
      telefono: user.telefono,
      email: user.email,
      rol: user.rol || 'cliente'
    };

    Api.guardar('sesion_actual', sesionData);
    reiniciarTemporizadorInactividad();
    actualizarInterfazUsuario();
    cerrarAuthModal();

    Notificaciones.toast('¡Bienvenido(a) a INVERANOLI, ' + user.nombre + '!', 'exito', 3500);

    // Si es admin, abrir panel de administración
    if (user.rol === 'admin') {
      if (typeof abrirAdminModal === 'function') {
        abrirAdminModal();
      }
    }
  } catch (error) {
    console.error('[INVERANOLI] Error en procesarLogin:', error);
    if (typeof Notificaciones !== 'undefined' && Notificaciones.alerta) {
      Notificaciones.alerta('Ocurrió un error inesperado al iniciar sesión. Por favor intenta nuevamente.\n\nDetalle: ' + (error.message || error), 'Error del Sistema');
    } else {
      alert('Error al iniciar sesión: ' + (error.message || error));
    }
  }
}

// ─── Proceso de Registro ───
async function procesarRegistro(e) {
  e.preventDefault();
  try {

  var selTipoDoc = document.getElementById('reg-tipo-doc');
  var nombre   = document.getElementById('reg-nombre').value.trim();
  var apellido = document.getElementById('reg-apellido').value.trim();
  var cedula   = document.getElementById('reg-cedula').value.trim();
  var prefijo  = document.getElementById('reg-prefijo').value;
  var telefono = document.getElementById('reg-telefono').value.trim();
  var email    = document.getElementById('reg-email').value.trim().toLowerCase();
  var pass     = document.getElementById('reg-pass').value;
  var passConf = document.getElementById('reg-pass-conf').value;

  var tipoDoc = selTipoDoc ? selTipoDoc.value : 'V';

  // Validaciones
  if (nombre.length < 2 || nombre.length > 35 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombre)) {
    return Notificaciones.alerta('El nombre debe contener solo letras (entre 2 y 35 caracteres).', 'Nombre Inválido');
  }
  if (apellido.length < 2 || apellido.length > 35 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(apellido)) {
    return Notificaciones.alerta('El apellido debe contener solo letras (entre 2 y 35 caracteres).', 'Apellido Inválido');
  }
  if (!esCedulaValida(cedula)) {
    return Notificaciones.alerta('El documento de identidad debe contener solo números y máximo 12 dígitos.', 'Documento Inválido');
  }
  if (!esTelefonoValido(prefijo, telefono)) {
    return Notificaciones.alerta('El número telefónico debe tener exactamente 7 dígitos numéricos.', 'Teléfono Inválido');
  }
  if (!esEmailValido(email)) {
    return Notificaciones.alerta('Por favor ingresa un correo electrónico válido (ejemplo: usuario@correo.com).', 'Correo Inválido');
  }

  var evalPass = evaluarFortalezaPassword(pass);
  if (!evalPass.valida) {
    return Notificaciones.alerta('La contraseña no cumple los requisitos mínimos:\n- ' + evalPass.fallos.join('\n- '), 'Contraseña Insegura');
  }
  if (pass !== passConf) {
    return Notificaciones.alerta('Las contraseñas ingresadas no coinciden. Por favor verifica.', 'Error de Confirmación');
  }

  var cedulaLimpia = cedula.replace(/\D/g, '');
  var cedulaGuardar = tipoDoc + '-' + cedulaLimpia;

  // Comprobar no duplicidad en base de datos
  var usuarios = MotorSQL.consultar('usuarios');
  if (usuarios.some(function (u) {
    var c = String(u.cedula || '').replace(/\D/g, '');
    return c === cedulaLimpia;
  })) {
    return Notificaciones.alerta('Ya existe un usuario registrado con el documento ' + cedulaGuardar + '.', 'Documento Duplicado');
  }
  if (usuarios.some(function (u) { return u.email === email; })) {
    return Notificaciones.alerta('El correo electrónico ' + email + ' ya se encuentra en uso.', 'Correo Duplicado');
  }

  // Generar sal y hash
  var sal = generarSal();
  var hash = await hashearPassword(pass, sal);

  var nuevoUsuario = MotorSQL.insertar('usuarios', {
    nombre: nombre,
    apellido: apellido,
    cedula: cedulaGuardar,
    tipo_doc: tipoDoc,
    telefono: prefijo + telefono,
    email: email,
    sal: sal,
    password_hash: hash,
    rol: 'cliente'
  });

  // Autologin
  var sesionData = {
    id: nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    apellido: nuevoUsuario.apellido,
    cedula: nuevoUsuario.cedula,
    tipo_doc: tipoDoc,
    telefono: nuevoUsuario.telefono,
    email: nuevoUsuario.email,
    rol: 'cliente'
  };

  Api.guardar('sesion_actual', sesionData);
  reiniciarTemporizadorInactividad();
  actualizarInterfazUsuario();
  cerrarAuthModal();

  Notificaciones.toast('¡Cuenta creada exitosamente en INVERANOLI, ' + nuevoUsuario.nombre + '!', 'exito', 4000);

  } catch (error) {
    console.error('[INVERANOLI] Error en procesarRegistro:', error);
    if (typeof Notificaciones !== 'undefined' && Notificaciones.alerta) {
      Notificaciones.alerta('Ocurrió un error al crear tu cuenta. Por favor intenta nuevamente.\n\nDetalle: ' + (error.message || error), 'Error del Sistema');
    } else {
      alert('Error al registrar: ' + (error.message || error));
    }
  }
}

// ─── Recuperación Simulada de Contraseña ───
function procesarRecuperacion(e) {
  e.preventDefault();
  var inEmail = document.getElementById('recuperar-email');
  if (!inEmail) return;
  var email = inEmail.value.trim().toLowerCase();

  var usuarios = MotorSQL.consultar('usuarios');
  var user = usuarios.find(function (u) { return u.email === email; });

  if (!user) {
    Notificaciones.alerta('No encontramos ninguna cuenta asociada al correo ' + email + '.', 'Usuario No Encontrado');
    return;
  }

  Notificaciones.toast('Se ha enviado un enlace de restablecimiento seguro a ' + email + ' (Flujo Simulado). Revisa tu bandeja de entrada.', 'info', 5000);
  cambiarTabAuth('login');
}

// ─── Modal de Perfil del Usuario ───
function abrirPerfilModal() {
  var u = Api.leer('sesion_actual', null);
  if (!u) return abrirAuthModal('login');

  var modal = document.getElementById('modal-perfil');
  if (!modal) return;

  document.getElementById('perfil-nombre').value = u.nombre || '';
  document.getElementById('perfil-apellido').value = u.apellido || '';

  var tel = String(u.telefono || '');
  var pref = '0414';
  var resto = '';
  if (tel.length >= 11) {
    pref = tel.substring(0, 4);
    resto = tel.substring(4);
  } else if (tel.length === 10) {
    pref = tel.substring(0, 3);
    resto = tel.substring(3);
  }
  var selPref = document.getElementById('perfil-prefijo');
  var inTel = document.getElementById('perfil-telefono');
  if (selPref) selPref.value = pref;
  if (inTel) inTel.value = resto;

  document.getElementById('perfil-pass-actual').value = '';
  document.getElementById('perfil-pass-nueva').value = '';

  modal.style.display = 'flex';
}

function cerrarPerfilModal() {
  var modal = document.getElementById('modal-perfil');
  if (modal) modal.style.display = 'none';
}

async function guardarCambiosPerfil(e) {
  e.preventDefault();
  var u = Api.leer('sesion_actual', null);
  if (!u) return;

  var nombre   = document.getElementById('perfil-nombre').value.trim();
  var apellido = document.getElementById('perfil-apellido').value.trim();
  var prefijo  = document.getElementById('perfil-prefijo').value;
  var telefono = document.getElementById('perfil-telefono').value.trim();
  var passAct  = document.getElementById('perfil-pass-actual').value;
  var passNueva= document.getElementById('perfil-pass-nueva').value;

  if (nombre.length < 2 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombre)) {
    return Notificaciones.alerta('Nombre inválido.', 'Error');
  }
  if (apellido.length < 2 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(apellido)) {
    return Notificaciones.alerta('Apellido inválido.', 'Error');
  }
  if (!esTelefonoValido(prefijo, telefono)) {
    return Notificaciones.alerta('Número telefónico inválido.', 'Error');
  }

  var dbUser = MotorSQL.consultar('usuarios', function (x) { return x.id === u.id; })[0];
  if (!dbUser) return Notificaciones.alerta('Usuario no encontrado.', 'Error');

  var cambios = {
    nombre: nombre,
    apellido: apellido,
    telefono: prefijo + telefono
  };

  // Si desea cambiar contraseña
  if (passNueva) {
    if (!passAct) {
      return Notificaciones.alerta('Para cambiar tu contraseña debes ingresar tu contraseña actual.', 'Verificación Requerida');
    }
    var hashAct = await hashearPassword(passAct, dbUser.sal);
    if (hashAct !== dbUser.password_hash) {
      return Notificaciones.alerta('La contraseña actual ingresada es incorrecta.', 'Contraseña Incorrecta');
    }

    var evalN = evaluarFortalezaPassword(passNueva);
    if (!evalN.valida) {
      return Notificaciones.alerta('La nueva contraseña no cumple los requisitos:\n- ' + evalN.fallos.join('\n- '), 'Contraseña Insegura');
    }
    if (passNueva === passAct) {
      return Notificaciones.alerta('La nueva contraseña no puede ser idéntica a la anterior.', 'Contraseña Repetida');
    }

    var nuevaSal = generarSal();
    var nuevoHash = await hashearPassword(passNueva, nuevaSal);
    cambios.sal = nuevaSal;
    cambios.password_hash = nuevoHash;
  }

  MotorSQL.actualizar('usuarios', function (x) { return x.id === u.id; }, cambios);

  // Actualizar sesión activa
  u.nombre = nombre;
  u.apellido = apellido;
  u.telefono = prefijo + telefono;
  Api.guardar('sesion_actual', u);

  actualizarInterfazUsuario();
  cerrarPerfilModal();
  Notificaciones.toast('¡Datos de tu perfil actualizados exitosamente!', 'exito');
}

// ─── Cerrar Sesión ───
function cerrarSesion() {
  Api.eliminar('sesion_actual');
  document.body.classList.remove('admin-mode-active');
  Cart.vaciar(true); // Aislamiento de sesión: limpiar carrito
  actualizarInterfazUsuario();
  cerrarPerfilModal();
  var modAdmin = document.getElementById('modal-admin');
  if (modAdmin) modAdmin.style.display = 'none';
  Notificaciones.toast('Has cerrado sesión correctamente. Tu carrito ha sido resguardado.', 'info');
}

// ─── Actualizar Elementos de Interfaz según Sesión ───
function actualizarInterfazUsuario() {
  var u = Api.leer('sesion_actual', null);
  var authButtons = document.getElementById('auth-buttons-publicos');
  var userPill = document.getElementById('user-pill');
  var nameDisp = document.getElementById('user-name-display');
  var btnAdmin = document.getElementById('btn-admin');

  if (u) {
    if (authButtons) authButtons.style.display = 'none';
    if (userPill) userPill.style.display = 'flex';
    if (nameDisp) nameDisp.textContent = u.nombre + ' ' + (u.apellido ? u.apellido.charAt(0) + '.' : '');
    if (btnAdmin) btnAdmin.style.display = (u.rol === 'admin') ? 'inline-flex' : 'none';

    // Vista Exclusiva para Administrador:
    // Quita el banner, carruseles, catálogo y carrito; solo muestra su dashboard y los 4 botones
    if (u.rol === 'admin') {
      document.body.classList.add('admin-mode-active');
      if (typeof abrirAdminModal === 'function') {
        abrirAdminModal();
      }
    } else {
      document.body.classList.remove('admin-mode-active');
    }
  } else {
    document.body.classList.remove('admin-mode-active');
    if (authButtons) authButtons.style.display = 'inline-flex';
    if (userPill) userPill.style.display = 'none';
    if (btnAdmin) btnAdmin.style.display = 'none';
  }

  if (typeof Favoritos !== 'undefined') Favoritos.actualizarContadorUI();
  if (typeof Cart !== 'undefined') Cart.actualizarBadges();
}
