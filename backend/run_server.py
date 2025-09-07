#!/usr/bin/env python
"""
Script para ejecutar el servidor Django con ASGI para soporte de WebSockets
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_management.settings")
    django.setup()
    
    # Ejecutar el servidor con uvicorn para soporte de WebSockets
    try:
        import uvicorn
        from project_management.asgi import application
        
        print("Iniciando servidor con soporte para WebSockets...")
        uvicorn.run(
            application,
            host="127.0.0.1",
            port=8000,
            log_level="info"
        )
    except ImportError:
        print("Uvicorn no está instalado. Instalando...")
        os.system("pip install uvicorn")
        print("Por favor, ejecuta el script nuevamente.")
