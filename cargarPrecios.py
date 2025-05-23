import json
import requests
import time
from dbfread import DBF
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import os

# 🔧 CONFIGURACIÓN
ARCHIVO_DBF = "articulo.dbf"
ARCHIVO_CATALOGO = "catalogo.json"
FIREBASE_PRECIOS_URL = "https://kiosco-web-default-rtdb.firebaseio.com/productos.json"
FIREBASE_CATALOGO_URL = "https://kiosco-web-default-rtdb.firebaseio.com/catalogo.json"

# ✅ Convertir .dbf a array [{ nombre, precio }]
def convertir_dbf_a_array(archivo):
    tabla = DBF(archivo, encoding="latin-1")
    productos = []
    for fila in tabla:
        nombre = str(fila.get("DESC", "")).strip().upper()
        precio = float(fila.get("PRECIOA", 0))
        if nombre:
            productos.append({
                "data-nombre": nombre,
                "precio": precio
            })
    return productos

# ✅ Subida genérica a Firebase
def subir_a_firebase(json_data, url, descripcion):
    print(f"🔄 Subiendo {descripcion} a Firebase...")
    response = requests.put(url, json=json_data)
    if response.status_code == 200:
        print(f"✅ {descripcion.capitalize()} subido correctamente.")
    else:
        print(f"❌ Error al subir {descripcion}: {response.status_code} - {response.text}")

# ✅ Procesar y subir precios
def procesar_y_subir_precios():
    print("📥 Procesando archivo DBF...")
    productos = convertir_dbf_a_array(ARCHIVO_DBF)
    subir_a_firebase(productos, FIREBASE_PRECIOS_URL, "precios")

# ✅ Procesar y subir catálogo
def procesar_y_subir_catalogo():
    print("📥 Procesando archivo catalogo.json...")
    if os.path.exists(ARCHIVO_CATALOGO):
        with open(ARCHIVO_CATALOGO, "r", encoding="utf-8") as f:
            catalogo = json.load(f)
        subir_a_firebase(catalogo, FIREBASE_CATALOGO_URL, "catálogo")
    else:
        print("⚠️ No se encontró el archivo catalogo.json.")

# 👀 Detectar cambios en archivos
class ArchivoHandler(FileSystemEventHandler):
    def on_modified(self, event):
        archivo = os.path.basename(event.src_path)
        if archivo == ARCHIVO_DBF:
            print("📁 Cambio detectado en articulo.dbf")
            time.sleep(1)
            procesar_y_subir_precios()
        elif archivo == ARCHIVO_CATALOGO:
            print("📁 Cambio detectado en catalogo.json")
            time.sleep(1)
            procesar_y_subir_catalogo()

# 👀 Iniciar observación
def observar_archivos():
    observer = Observer()
    observer.schedule(ArchivoHandler(), path=".", recursive=False)
    observer.start()
    print("👀 Observando articulo.dbf y catalogo.json...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

# ▶️ INICIO
if __name__ == "__main__":
    procesar_y_subir_precios()
    procesar_y_subir_catalogo()
    observar_archivos()
