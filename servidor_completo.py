#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
servidor_completo.py — Servidor Web y de Base de Datos Integrado para INVERANOLI
Levanta en un solo comando:
- Puerto 3000: Servidor web que sirve la carpeta /public (index.html, css, js, imagenes)
- Puerto 3001: Servidor API de base de datos relacional vinculada con database/schema.sql

Compatible universalmente con Python 2.7 y Python 3.x (Windows 7 / 8 / 10 / 11).
Cero dependencias externas (usa unicamente la libreria estandar de Python, sin pip).
No requiere permisos de administrador.
"""

import os
import sys
import threading
import webbrowser

# Cargar el manejador de base de datos desde servidor_database.py
import servidor_database

if sys.version_info[0] >= 3:
    from http.server import HTTPServer, SimpleHTTPRequestHandler
else:
    from BaseHTTPServer import HTTPServer
    from SimpleHTTPServer import SimpleHTTPRequestHandler

PORT_WEB = 3000
PORT_DB = 3001
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')


class PublicFolderHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # En Python 3.7+ SimpleHTTPRequestHandler acepta directory=
        # Para compatibilidad con versiones viejas (Python 2.7, 3.4, 3.5, 3.6), cambiamos el directorio de trabajo o usamos translate_path
        SimpleHTTPRequestHandler.__init__(self, *args, **kwargs)

    def translate_path(self, path):
        # Mapea cualquier peticion web a la carpeta /public
        path = SimpleHTTPRequestHandler.translate_path(self, path)
        relpath = os.path.relpath(path, os.getcwd())
        return os.path.join(PUBLIC_DIR, relpath)

    def end_headers(self):
        # Habilitar CORS y evitar problemas de cache en presentaciones
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        SimpleHTTPRequestHandler.end_headers(self)


def iniciar_servidor_bd():
    try:
        httpd_bd = HTTPServer(('0.0.0.0', PORT_DB), servidor_database.ManejadorBD)
        httpd_bd.serve_forever()
    except Exception as e:
        sys.stderr.write("Error en Servidor BD: %s\n" % str(e))


def iniciar_servidor_web():
    try:
        httpd_web = HTTPServer(('0.0.0.0', PORT_WEB), PublicFolderHandler)
        httpd_web.serve_forever()
    except Exception as e:
        sys.stderr.write("Error en Servidor Web: %s\n" % str(e))


def main():
    print("========================================================")
    print("💎 INVERANOLI — SERVIDOR TODO EN UNO (PYTHON NATIVO)")
    print("========================================================")
    print("✓ Cero dependencias externas (Sin Node.js, sin pip)")
    print("✓ Compatible con Windows 7, 8, 10, 11 (Python 2.7 y 3.x)")
    print("✓ Cero permisos de administrador requeridos")
    print("--------------------------------------------------------")
    print("🌐 Servidor Web:       http://localhost:%d" % PORT_WEB)
    print("🗄️ Servidor Base Datos: http://localhost:%d/api/database" % PORT_DB)
    print("--------------------------------------------------------")
    print("Abriendo el navegador en http://localhost:%d ..." % PORT_WEB)
    print("Presiona Ctrl+C en esta ventana para detener el sistema.")
    print("========================================================\n")

    hilo_bd = threading.Thread(target=iniciar_servidor_bd)
    hilo_bd.daemon = True
    hilo_bd.start()

    hilo_web = threading.Thread(target=iniciar_servidor_web)
    hilo_web.daemon = True
    hilo_web.start()

    # Abrir navegador automaticamente
    try:
        webbrowser.open('http://localhost:%d' % PORT_WEB)
    except Exception:
        pass

    try:
        while True:
            # Mantener hilo principal vivo compatible con py2 y py3
            import time
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nDeteniendo servidores de INVERANOLI...")
        sys.exit(0)


if __name__ == '__main__':
    main()
