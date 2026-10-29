#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
servidor_database.py — Servidor Dedicado de Base de Datos para INVERANOLI
Compatible 100% con Windows 7, 8, 10, 11 (Python 2.7 y Python 3.x).
Cero dependencias externas (usa unicamente modulos nativos de la libreria estandar).
No requiere permisos de administrador.

Puerto 3001: API de Base de Datos Relacional (/api/database, /api/productos, /api/estado)
"""

import os
import sys
import json
import re
import time
import ssl

if sys.version_info[0] >= 3:
    import urllib.request as urllib_req
else:
    import urllib2 as urllib_req

# Compatibilidad segura con consolas Windows (Python 3.6+, Windows 7)
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

# Compatibilidad transparente Python 2 y Python 3
if sys.version_info[0] >= 3:
    from http.server import HTTPServer, BaseHTTPRequestHandler
    from urllib.parse import urlparse
else:
    from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler
    from urlparse import urlparse

class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

PORT_DB = 3001
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCHEMA_PATH = os.path.join(BASE_DIR, 'database', 'schema.sql')

# ─── Cache de Tasa Oficial BCV (https://www.bcv.org.ve/) ───
CACHE_BCV = {
    'monto': None,
    'monto_formateado': None,
    'fecha': None,
    'fuente': 'Banco Central de Venezuela (https://www.bcv.org.ve/)',
    'timestamp': 0,
    'oficial': True
}

def consultar_tasa_oficial_bcv():
    ahora = time.time()
    # Cache durante 15 minutos (900 segundos)
    if CACHE_BCV.get('monto') and (ahora - CACHE_BCV.get('timestamp', 0) < 900):
        return CACHE_BCV

    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    except Exception:
        ctx = None

    url = 'https://www.bcv.org.ve/'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    }

    try:
        req = urllib_req.Request(url, headers=headers)
        if ctx:
            resp = urllib_req.urlopen(req, timeout=12, context=ctx)
        else:
            resp = urllib_req.urlopen(req, timeout=12)

        html = resp.read().decode('utf-8', errors='ignore')
        resp.close()

        # Extraer cotizacion del dolar
        m_dolar = re.search(r'id=["\']dolar["\'].*?<strong[^>]*>\s*([0-9.,]+)\s*</strong>', html, re.DOTALL | re.IGNORECASE)
        m_fecha = re.search(r'Fecha Valor:\s*<span[^>]*>\s*([^<]+)\s*</span>', html, re.DOTALL | re.IGNORECASE)

        fecha_texto = re.sub(r'\s+', ' ', m_fecha.group(1).strip()) if m_fecha else time.strftime('%d/%m/%Y')

        if m_dolar:
            raw = m_dolar.group(1).strip()
            num = float(raw.replace('.', '').replace(',', '.'))
            if num > 0:
                CACHE_BCV['monto'] = num
                CACHE_BCV['monto_formateado'] = raw
                CACHE_BCV['fecha'] = fecha_texto
                CACHE_BCV['timestamp'] = ahora
                CACHE_BCV['oficial'] = True
                return CACHE_BCV
    except Exception as e:
        print('[BCV API] Error consultando https://www.bcv.org.ve/:', str(e))

    if CACHE_BCV.get('monto'):
        return CACHE_BCV

    return {
        'error': 'No se pudo conectar con www.bcv.org.ve',
        'fuente': 'https://www.bcv.org.ve/',
        'oficial': False
    }


def limpiar_valor_sql(val):
    v = val.strip()
    if (v.startswith("'") and v.endswith("'")) or (v.startswith('"') and v.endswith('"')):
        v = v[1:-1].replace("''", "'")
    u = v.upper()
    if u == 'NULL':
        return None
    if u == 'TRUE':
        return 1
    if u == 'FALSE':
        return 0
    if re.match(r'^-?\d+$', v):
        try:
            return int(v)
        except Exception:
            return v
    if re.match(r'^-?\d+\.\d+$', v):
        try:
            return float(v)
        except Exception:
            return v
    return v


def parsear_valores_sql(cadena_valores):
    valores = []
    actual = []
    en_comillas = False
    i = 0
    n = len(cadena_valores)

    while i < n:
        c = cadena_valores[i]
        if c == "'":
            if en_comillas and (i + 1 < n) and cadena_valores[i + 1] == "'":
                actual.append("'")
                i += 1
            else:
                en_comillas = not en_comillas
        elif c == ',' and not en_comillas:
            valores.append(limpiar_valor_sql(''.join(actual)))
            actual = []
        else:
            actual.append(c)
        i += 1

    resto = ''.join(actual).strip()
    if resto or len(valores) > 0:
        valores.append(limpiar_valor_sql(''.join(actual)))

    return valores


def leer_datos_desde_sql():
    if not os.path.exists(SCHEMA_PATH):
        return {
            'disponible': False,
            'mensaje': 'El archivo database/schema.sql no existe.',
            'categorias': [],
            'productos': []
        }

    try:
        if sys.version_info[0] >= 3:
            with open(SCHEMA_PATH, 'r', encoding='utf-8', errors='replace') as f:
                lineas = f.readlines()
        else:
            with open(SCHEMA_PATH, 'r') as f:
                lineas = f.readlines()
    except Exception as e:
        return {
            'disponible': False,
            'mensaje': 'Error leyendo schema.sql: ' + str(e),
            'categorias': [],
            'productos': []
        }

    categorias = []
    productos = []

    patron_cat = re.compile(r'INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+categorias\s*\(([^)]+)\)\s*VALUES\s*\((.*)\);?', re.IGNORECASE)
    patron_prod = re.compile(r'INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+productos\s*\(([^)]+)\)\s*VALUES\s*\((.*)\);?', re.IGNORECASE)

    for linea in lineas:
        l = linea.strip()
        if not l or l.startswith('--'):
            continue

        m_cat = patron_cat.match(l)
        if m_cat:
            cols = [c.strip() for c in m_cat.group(1).split(',')]
            vals = parsear_valores_sql(m_cat.group(2))
            reg = {}
            for idx, col in enumerate(cols):
                if idx < len(vals):
                    reg[col] = vals[idx]
            if reg.get('id') and reg.get('nombre'):
                categorias.append(reg)
            continue

        m_prod = patron_prod.match(l)
        if m_prod:
            cols = [c.strip() for c in m_prod.group(1).split(',')]
            vals = parsear_valores_sql(m_prod.group(2))
            reg = {}
            for idx, col in enumerate(cols):
                val = vals[idx] if idx < len(vals) else None
                if col == 'imagenes' and isinstance(val, (str, bytes)):
                    try:
                        val = json.loads(val)
                    except Exception:
                        val = [val]
                reg[col] = val
            if reg.get('id') and reg.get('nombre'):
                productos.append(reg)

    return {
        'disponible': True,
        'total_productos': len(productos),
        'total_categorias': len(categorias),
        'categorias': categorias,
        'productos': productos
    }


class ManejadorBD(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        try:
            sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))
        except Exception:
            pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def responder_json(self, status, objeto):
        try:
            cuerpo = json.dumps(objeto, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(cuerpo)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.end_headers()
            self.wfile.write(cuerpo)
        except (IOError, OSError):
            pass

    def do_POST(self):
        parsed = urlparse(self.path)
        ruta = parsed.path
        if ruta == '/api/guardar_sql':
            try:
                longitud = int(self.headers.get('Content-Length', 0))
                cuerpo = self.rfile.read(longitud).decode('utf-8')
                payload = json.loads(cuerpo)
                sentencia = payload.get('sql')
                if sentencia and isinstance(sentencia, (str, unicode) if sys.version_info[0] < 3 else str):
                    with open(SCHEMA_PATH, 'a', encoding='utf-8' if sys.version_info[0] >= 3 else None) as f:
                        f.write(u'\n' + sentencia.strip() + u';\n')
                    return self.responder_json(200, {'exito': True, 'mensaje': 'Sentencia persistida en schema.sql'})
            except Exception as e:
                return self.responder_json(400, {'exito': False, 'error': str(e)})
        self.responder_json(404, {'error': 'Ruta POST no encontrada'})

    def do_GET(self):
        parsed = urlparse(self.path)
        ruta = parsed.path

        # 1. API Estado
        if ruta in ('/api/estado', '/estado'):
            datos = leer_datos_desde_sql()
            res = {
                'servidor_activo': True,
                'servidor_motor': 'Python nativo (sin dependencias)',
                'base_de_datos': 'conectada' if datos.get('disponible') else 'archivo_sql_no_encontrado',
                'archivo_sql': SCHEMA_PATH,
                'productos_cargados': len(datos.get('productos', [])),
                'total_categorias': len(datos.get('categorias', []))
            }
            return self.responder_json(200, res)

        # 2. API Solo Productos
        if ruta in ('/api/productos', '/productos'):
            datos = leer_datos_desde_sql()
            return self.responder_json(200, datos.get('productos', []))

        # 3. API Tasa Oficial BCV en Vivo desde www.bcv.org.ve
        if ruta in ('/api/bcv', '/api/tasa', '/bcv'):
            tasa = consultar_tasa_oficial_bcv()
            return self.responder_json(200, tasa)

        # 4. API Base de Datos Completa (para frontend INVERANOLI)
        if ruta in ('/api/database', '/database', '/api/db'):
            datos = leer_datos_desde_sql()
            return self.responder_json(200, datos)

        # 5. Pantalla de bienvenida
        if ruta in ('/', ''):
            datos = leer_datos_desde_sql()
            total_prods = len(datos.get('productos', []))
            total_cats = len(datos.get('categorias', []))
            disponible = datos.get('disponible', False)

            html = u"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Servidor de Base de Datos Python — INVERANOLI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; padding: 40px 20px; text-align: center; }
    .card { background: #182238; border: 1px solid #d4af37; border-radius: 12px; max-width: 620px; margin: 0 auto; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { color: #d4af37; font-size: 1.5rem; margin-bottom: 10px; }
    .badge { display: inline-block; background: #10b981; color: white; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; margin-bottom: 20px; }
    .info { background: #101726; padding: 15px; border-radius: 8px; text-align: left; font-size: 0.9rem; color: #cbd5e1; line-height: 1.6; }
    code { color: #f59e0b; font-family: monospace; }
    .footer-note { margin-top: 20px; font-size: 0.85rem; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>[INVERANOLI] SERVIDOR PYTHON DE BASE DE DATOS</h1>
    <div class="badge">SERVIDOR PYTHON ACTIVO EN PUERTO %d</div>
    <div class="info">
      <p><strong>Estado:</strong> %s</p>
      <p><strong>Motor:</strong> Python nativo universal (Sin dependencias externas ni pip)</p>
      <p><strong>Total Joyas:</strong> %d productos</p>
      <p><strong>Total Categorias:</strong> %d categorias</p>
      <p><strong>Endpoint API:</strong> <code>http://localhost:%d/api/database</code></p>
    </div>
    <p class="footer-note">
      Compatible con Windows 7, 8, 10, 11 y navegadores ligeros.<br>
      Abre <code>public/index.html</code> en tu navegador.
    </p>
  </div>
</body>
</html>""" % (
                PORT_DB,
                u"Base de datos vinculada con exito" if disponible else u"Archivo database/schema.sql ausente",
                total_prods,
                total_cats,
                PORT_DB
            )
            try:
                cuerpo = html.encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(cuerpo)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(cuerpo)
            except (IOError, OSError):
                pass
            return

        # 404
        self.responder_json(404, {'error': 'Ruta no encontrada'})


def crear_servidor_bd(puerto=PORT_DB):
    """Crea una instancia de servidor BD probando 0.0.0.0 y fallback a 127.0.0.1"""
    for host in ('0.0.0.0', '127.0.0.1'):
        try:
            httpd = ReusableHTTPServer((host, puerto), ManejadorBD)
            return httpd, host
        except Exception:
            continue
    return None, None


def ejecutar():
    servidor, host = crear_servidor_bd(PORT_DB)
    if not servidor:
        print("[ERROR] No se pudo levantar el servidor en el puerto %d." % PORT_DB)
        print("Es posible que otro proceso este utilizando el puerto %d." % PORT_DB)
        return

    print("========================================================")
    print("INVERANOLI - SERVIDOR PYTHON DE BASE DE DATOS")
    print("========================================================")
    print("Servidor Python activo en: http://127.0.0.1:%d" % PORT_DB)
    print("Endpoint API de BD:       http://127.0.0.1:%d/api/database" % PORT_DB)
    print("Escuchando en:            %s:%d" % (host, PORT_DB))
    print("Compatible con Python 3.6 y Windows 7 en adelante")
    print("Cero dependencias externas (sin pip ni node)")
    print("--------------------------------------------------------")
    print("Presiona Ctrl+C para detener el servidor.")
    print("========================================================\n")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido correctamente.")
        try:
            servidor.server_close()
        except Exception:
            pass


if __name__ == '__main__':
    ejecutar()
