#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
servidor_completo.py — Servidor Web y de Base de Datos Integrado para INVERANOLI
Compatible al 100% con Python 3.6 (y 2.7 / 3.x) en Windows 7 (32 y 64 bits), 8, 10 y 11.
Cero dependencias externas (usa unicamente la libreria estandar de Python, sin pip).
No requiere permisos de administrador.

Levanta en un solo comando:
- Servidor Web unificado que sirve la carpeta /public (index.html, css, js, imagenes)
  y atiende endpoints API (/api/database, /api/productos, /api/estado).
- Servidor API de base de datos relacional para compatibilidad dual.
"""

import os
import sys
import threading
import webbrowser
import time
import json
import mimetypes
import posixpath
import socket

# ==============================================================================
# 1. Compatibilidad segura de consola para Windows 7
# ==============================================================================
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

# ==============================================================================
# 2. Correccion critica de tipos MIME para Windows 7
# En Windows 7, el registro suele asociar .js con 'text/plain'.
# Los navegadores modernos rechazan ejecutar scripts JS que tengan MIME text/plain.
# ==============================================================================
mimetypes.init()
mimes_fijos = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.sql': 'text/plain',
    '.txt': 'text/plain'
}
for extension, tipo in mimes_fijos.items():
    mimetypes.add_type(tipo, extension)
    if hasattr(mimetypes, 'types_map'):
        mimetypes.types_map[extension] = tipo

# ==============================================================================
# 3. Importacion compatible de HTTP Server (Python 2.7 y 3.x)
# ==============================================================================
if sys.version_info[0] >= 3:
    from http.server import HTTPServer, SimpleHTTPRequestHandler
    from urllib.parse import urlparse, unquote
else:
    from BaseHTTPServer import HTTPServer
    from SimpleHTTPServer import SimpleHTTPRequestHandler
    from urlparse import urlparse
    from urllib import unquote

# Cargar el modulo de base de datos
import servidor_database

PORT_WEB = 3000
PORT_DB = 3001
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')


class ServidorReutilizable(HTTPServer):
    allow_reuse_address = True
    daemon_threads = True


class ManejadorWebUnificado(SimpleHTTPRequestHandler):
    """
    Manejador web unificado:
    1. Sirve la carpeta /public con tipos MIME estrictos garantizados.
    2. Responde directamente a /api/database, /api/productos y /api/estado
       asegurando funcionamiento inmediato sin problemas de CORS ni puertos cruzados.
    """

    def log_message(self, format, *args):
        try:
            sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))
        except Exception:
            pass

    def guess_type(self, path):
        # Garantizar tipo MIME correcto en Windows 7
        _, ext = os.path.splitext(path.lower())
        mimes = {
            '.js': 'application/javascript; charset=utf-8',
            '.mjs': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.html': 'text/html; charset=utf-8',
            '.htm': 'text/html; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.sql': 'text/plain; charset=utf-8'
        }
        if ext in mimes:
            return mimes[ext]
        return SimpleHTTPRequestHandler.guess_type(self, path)

    def translate_path(self, path):
        # Mapea cualquier peticion a la carpeta /public de forma segura
        # Totalmente independiente de os.getcwd() y de la version de Python
        path = path.split('?', 1)[0]
        path = path.split('#', 1)[0]
        trailing_slash = path.rstrip().endswith('/')
        try:
            path = unquote(path)
        except Exception:
            pass
        path = posixpath.normpath(path)
        words = [w for w in path.split('/') if w and w not in (os.curdir, os.pardir)]

        resultado = PUBLIC_DIR
        for word in words:
            resultado = os.path.join(resultado, os.path.basename(word))

        if trailing_slash:
            resultado += os.sep
        return resultado

    def end_headers(self):
        # Encabezados universales CORS y control estricto de cache
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        SimpleHTTPRequestHandler.end_headers(self)

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

    def do_GET(self):
        parsed = urlparse(self.path)
        ruta = parsed.path

        # 1. API Base de Datos Completa
        if ruta in ('/api/database', '/database', '/api/db'):
            datos = servidor_database.leer_datos_desde_sql()
            return self.responder_json(200, datos)

        # 2. API Solo Productos
        if ruta in ('/api/productos', '/productos'):
            datos = servidor_database.leer_datos_desde_sql()
            return self.responder_json(200, datos.get('productos', []))

        # 3. API Estado del Servidor
        if ruta in ('/api/estado', '/estado'):
            datos = servidor_database.leer_datos_desde_sql()
            res = {
                'servidor_activo': True,
                'servidor_motor': 'Python nativo unificado (sin dependencias)',
                'base_de_datos': 'conectada' if datos.get('disponible') else 'archivo_sql_no_encontrado',
                'archivo_sql': servidor_database.SCHEMA_PATH,
                'productos_cargados': len(datos.get('productos', [])),
                'total_categorias': len(datos.get('categorias', []))
            }
            return self.responder_json(200, res)

        # 4. Servir archivos estaticos (/public/index.html, imagenes, css, js)
        return SimpleHTTPRequestHandler.do_GET(self)


def probar_servidor_activo(host, puerto):
    """Comprueba rapidamente si un servidor HTTP responde en el host y puerto dados."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        res = s.connect_ex((host, puerto))
        s.close()
        return res == 0
    except Exception:
        return False


def crear_servidor(puerto, manejador):
    """
    Intenta crear un servidor HTTP en el puerto indicado.
    Prueba primero en '0.0.0.0' y si Windows 7 bloquea el socket (WSAEACCES / WinError 10013),
    hace fallback automatico a '127.0.0.1'.
    """
    for host in ('0.0.0.0', '127.0.0.1'):
        try:
            httpd = ServidorReutilizable((host, puerto), manejador)
            return httpd, host
        except Exception:
            continue
    return None, None


def main():
    print("========================================================")
    print("INVERANOLI - SERVIDOR INTEGRADO (PYTHON NATIVO)")
    print("========================================================")
    print("Cero dependencias externas (Sin Node.js, sin pip)")
    print("Compatible con Python 3.6 y Windows 7 (32 y 64 bits)")
    print("Cero permisos de administrador requeridos")
    print("--------------------------------------------------------")

    # Si el servidor ya estaba en ejecucion en el puerto 3000, abrir navegador y no fallar
    if probar_servidor_activo('127.0.0.1', PORT_WEB):
        print("[INFO] El servidor de INVERANOLI ya se encuentra activo en el puerto %d." % PORT_WEB)
        print("Servidor Web:        http://127.0.0.1:%d" % PORT_WEB)
        print("Servidor Base Datos: http://127.0.0.1:%d/api/database" % PORT_WEB)
        print("--------------------------------------------------------")
        print("Abriendo el navegador en http://127.0.0.1:%d ..." % PORT_WEB)
        print("Presiona Ctrl+C para salir.")
        print("========================================================\n")
        try:
            webbrowser.open('http://127.0.0.1:%d' % PORT_WEB)
        except Exception:
            pass
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nFinalizado.")
            sys.exit(0)

    # 1. Crear Servidor Web Unificado (intentar puertos 3000, 3002, 8000, 8080)
    puerto_web = PORT_WEB
    httpd_web = None
    host_web = None

    puertos_a_probar = [PORT_WEB, 3002, 8000, 8080]
    for p in puertos_a_probar:
        httpd_web, host_web = crear_servidor(p, ManejadorWebUnificado)
        if httpd_web:
            puerto_web = p
            break

    if not httpd_web:
        print("[ERROR] No se pudo abrir ningun puerto de red (%s)." % str(puertos_a_probar))
        print("Por favor reinicie el equipo o cierre aplicaciones que bloqueen puertos.")
        sys.exit(1)

    # 2. Iniciar Servidor BD dedicado en puerto 3001 si está libre
    httpd_bd, host_bd = crear_servidor(PORT_DB, servidor_database.ManejadorBD)
    if httpd_bd:
        hilo_bd = threading.Thread(target=httpd_bd.serve_forever)
        hilo_bd.daemon = True
        hilo_bd.start()
        print("Servidor BD dedicado: http://127.0.0.1:%d/api/database" % PORT_DB)
    else:
        print("[AVISO] Servidor Web proveera la API de BD directamente en el puerto %d." % puerto_web)

    print("Servidor Web:         http://127.0.0.1:%d" % puerto_web)
    print("API de Base de Datos: http://127.0.0.1:%d/api/database" % puerto_web)
    print("Escuchando en:        %s:%d" % (host_web, puerto_web))
    print("--------------------------------------------------------")
    print("Abriendo el navegador en http://127.0.0.1:%d ..." % puerto_web)
    print("Presiona Ctrl+C para detener el sistema.")
    print("========================================================\n")

    # Iniciar servidor web en segundo plano
    hilo_web = threading.Thread(target=httpd_web.serve_forever)
    hilo_web.daemon = True
    hilo_web.start()

    # Abrir navegador automaticamente
    time.sleep(0.3)
    try:
        webbrowser.open('http://127.0.0.1:%d' % puerto_web)
    except Exception:
        try:
            webbrowser.open('http://localhost:%d' % puerto_web)
        except Exception:
            pass

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nDeteniendo servidores de INVERANOLI...")
        try:
            httpd_web.server_close()
        except Exception:
            pass
        if httpd_bd:
            try:
                httpd_bd.server_close()
            except Exception:
                pass
        sys.exit(0)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        import traceback
        sys.stderr.write("\n[ERROR EN SERVIDOR]: %s\n" % str(e))
        traceback.print_exc()
        sys.exit(1)
