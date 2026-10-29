const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const SCHEMA_PATH = path.join(__dirname, 'database', 'schema.sql');

// ─── Cache en memoria de Tasa Oficial BCV (https://www.bcv.org.ve/) ───
let cacheTasaBCV = {
  monto: null,
  monto_formateado: null,
  fecha: null,
  fuente: 'Banco Central de Venezuela (https://www.bcv.org.ve/)',
  timestamp: null,
  actualizado_hace_ms: null
};
let peticionEnCursoBCV = null;

function consultarTasaOficialBCV() {
  const ahora = Date.now();
  // Cache por 15 minutos (900.000 ms)
  if (cacheTasaBCV.monto && (ahora - cacheTasaBCV.timestamp < 15 * 60 * 1000)) {
    return Promise.resolve(cacheTasaBCV);
  }

  if (peticionEnCursoBCV) {
    return peticionEnCursoBCV;
  }

  peticionEnCursoBCV = new Promise((resolve) => {
    const options = {
      hostname: 'www.bcv.org.ve',
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const matchDolar = data.match(/id=["']dolar["'][\s\S]*?<strong[^>]*>\s*([0-9.,]+)\s*<\/strong>/i);
          let matchFecha = data.match(/Fecha Valor:\s*<span[^>]*>\s*([^<]+)\s*<\/span>/i);
          let fechaTexto = matchFecha ? matchFecha[1].trim().replace(/\s+/g, ' ') : new Date().toLocaleDateString('es-VE');

          if (matchDolar) {
            const raw = matchDolar[1].trim();
            const num = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
            if (!isNaN(num) && num > 0) {
              cacheTasaBCV = {
                monto: num,
                monto_formateado: raw,
                fecha: fechaTexto,
                fuente: 'Banco Central de Venezuela (https://www.bcv.org.ve/)',
                timestamp: Date.now(),
                oficial: true
              };
              peticionEnCursoBCV = null;
              return resolve(cacheTasaBCV);
            }
          }
        } catch (e) {
          console.error('[BCV] Error parseando HTML:', e.message);
        }
        peticionEnCursoBCV = null;
        resolve(cacheTasaBCV.monto ? cacheTasaBCV : { error: 'No se pudo extraer la tasa de www.bcv.org.ve' });
      });
    });

    req.on('error', (e) => {
      console.error('[BCV] Error de red:', e.message);
      peticionEnCursoBCV = null;
      resolve(cacheTasaBCV.monto ? cacheTasaBCV : { error: e.message });
    });

    req.setTimeout(12000, () => {
      req.abort();
      console.warn('[BCV] Timeout al consultar www.bcv.org.ve');
      peticionEnCursoBCV = null;
      resolve(cacheTasaBCV.monto ? cacheTasaBCV : { error: 'Timeout al conectar a www.bcv.org.ve' });
    });

    req.end();
  });

  return peticionEnCursoBCV;
}

function parsearValoresSQL(cadenaValores) {
  const valores = [];
  let actual = '';
  let enComillas = false;

  for (let i = 0; i < cadenaValores.length; i++) {
    const c = cadenaValores[i];
    if (c === "'") {
      if (enComillas && cadenaValores[i + 1] === "'") {
        actual += "'";
        i++;
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
  let v = val.trim();
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

function leerDatosDesdeSQL() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    return {
      disponible: false,
      mensaje: 'El archivo database/schema.sql no existe.',
      categorias: [],
      productos: []
    };
  }

  const contenido = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const lineas = contenido.split('\n');
  const categorias = [];
  const productos = [];

  lineas.forEach(linea => {
    const l = linea.trim();
    if (!l || l.startsWith('--')) return;

    const mCat = l.match(/INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+categorias\s*\(([^)]+)\)\s*VALUES\s*\((.*)\);?/i);
    if (mCat) {
      const cols = mCat[1].split(',').map(c => c.trim());
      const vals = parsearValoresSQL(mCat[2]);
      const reg = {};
      cols.forEach((col, idx) => { reg[col] = vals[idx]; });
      if (reg.id && reg.nombre) categorias.push(reg);
    }

    const mProd = l.match(/INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+productos\s*\(([^)]+)\)\s*VALUES\s*\((.*)\);?/i);
    if (mProd) {
      const cols = mProd[1].split(',').map(c => c.trim());
      const vals = parsearValoresSQL(mProd[2]);
      const reg = {};
      cols.forEach((col, idx) => {
        let val = vals[idx];
        if (col === 'imagenes' && typeof val === 'string') {
          try { val = JSON.parse(val); } catch (e) { val = [val]; }
        }
        reg[col] = val;
      });
      if (reg.id && reg.nombre) productos.push(reg);
    }
  });

  return {
    disponible: true,
    total_productos: productos.length,
    total_categorias: categorias.length,
    categorias,
    productos
  };
}

const server = http.createServer((req, res) => {
  // Configuración CORS total para permitir peticiones desde cualquier origen (file:/// o http://localhost)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = req.url.split('?')[0];

  // Endpoint de estado del servidor
  if (url === '/api/estado' || url === '/estado') {
    const datos = leerDatosDesdeSQL();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      servidor_activo: true,
      base_de_datos: datos.disponible ? 'conectada' : 'archivo_sql_no_encontrado',
      archivo_sql: SCHEMA_PATH,
      productos_cargados: datos.productos ? datos.productos.length : 0,
      timestamp: new Date().toISOString()
    }));
  }

  // Endpoint de solo productos
  if (url === '/api/productos' || url === '/productos') {
    const datos = leerDatosDesdeSQL();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(datos.productos || []));
  }

  // Endpoint de Tasa Oficial en Vivo desde www.bcv.org.ve
  if (url === '/api/bcv' || url === '/api/tasa' || url === '/bcv') {
    return consultarTasaOficialBCV().then((tasa) => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(tasa));
    });
  }

  // Endpoint de base de datos completa (categorías + productos)
  if (url === '/api/database' || url === '/database' || url === '/api/db') {
    const datos = leerDatosDesdeSQL();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(datos));
  }

  // Endpoint para persistir inserciones y actualizaciones en database/schema.sql
  if (url === '/api/guardar_sql' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const sentencia = payload.sql;
        if (sentencia && typeof sentencia === 'string') {
          fs.appendFileSync(SCHEMA_PATH, '\n' + sentencia.trim() + ';\n', 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ exito: true, mensaje: 'Sentencia SQL persistida en schema.sql' }));
        }
      } catch (err) {
        console.error('Error al guardar en schema.sql:', err.message);
      }
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ exito: false, error: 'Sentencia inválida' }));
    });
    return;
  }

  // Ruta raíz de bienvenida e instrucciones
  if (url === '/' || url === '') {
    const datos = leerDatosDesdeSQL();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Servidor de Base de Datos — INVERANOLI</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; padding: 40px 20px; text-align: center; }
          .card { background: #182238; border: 1px solid #d4af37; border-radius: 12px; max-width: 600px; margin: 0 auto; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          h1 { color: #d4af37; font-size: 1.6rem; margin-bottom: 10px; }
          .badge { display: inline-block; background: #10b981; color: white; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; margin-bottom: 20px; }
          .info { background: #101726; padding: 15px; border-radius: 8px; text-align: left; font-size: 0.9rem; color: #cbd5e1; line-height: 1.6; }
          code { color: #f59e0b; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✦ SERVIDOR DE BASE DE DATOS INVERANOLI ✦</h1>
          <div class="badge">● SERVIDOR ACTIVO EN PUERTO ${PORT}</div>
          <div class="info">
            <p><strong>Estado:</strong> ${datos.disponible ? '✓ Base de datos vinculada con éxito' : '⚠️ Archivo database/schema.sql ausente'}</p>
            <p><strong>Total Joyas:</strong> ${datos.productos ? datos.productos.length : 0} productos</p>
            <p><strong>Total Categorías:</strong> ${datos.categorias ? datos.categorias.length : 0} categorías</p>
            <p><strong>Endpoint API:</strong> <code>http://localhost:${PORT}/api/database</code></p>
          </div>
          <p style="margin-top: 20px; font-size: 0.85rem; color: #94a3b8;">
            Ahora cuando abras el archivo <code>public/index.html</code> en tu navegador, las joyas se cargarán automáticamente desde este servidor. Si detienes este servidor, la página abrirá sin productos.
          </p>
        </div>
      </body>
      </html>
    `);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

server.listen(PORT, () => {
  console.log('========================================================');
  console.log('💎 INVERANOLI — SERVIDOR DEDICADO DE BASE DE DATOS');
  console.log('========================================================');
  console.log(`✓ Servidor ejecutándose en: http://localhost:${PORT}`);
  console.log(`✓ Endpoint de base de datos: http://localhost:${PORT}/api/database`);
  console.log('--------------------------------------------------------');
  console.log('Si alguien abre index.html sin este servidor, la página');
  console.log('abrirá en 0 productos (100% no local).');
  console.log('========================================================\n');
});
