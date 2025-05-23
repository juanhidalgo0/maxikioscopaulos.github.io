import os
import json
import requests
from urllib.parse import quote

# Configuración de Cloudinary
CLOUD_NAME = "dzegjtthy"
UPLOAD_PRESET = "kioscopaulosweb"
CLOUDINARY_FOLDER = "imagenesWeb"

# Carpetas locales donde buscar las imágenes
CARPETAS_IMAGENES = [
    r"C:\Users\PC\Desktop\Kiosco Web final\img\Productos\Bebidas\Gaseosas",
    r"C:\Users\PC\Desktop\Kiosco Web final\img\Productos\Bebidas\Cervezas",
    r"C:\Users\PC\Desktop\Kiosco Web final\img\Productos\Bebidas\Vinos\Tinto",
]

# Cargar archivo JSON original
with open("catalogo.json", "r", encoding="utf-8") as f:
    catalogo = json.load(f)

def normalizar_nombre(nombre):
    return nombre.strip().lower().replace(" ", "_").replace("/", "_")

def buscar_imagen_local(ruta_relativa):
    nombre_archivo = os.path.basename(ruta_relativa)
    for carpeta in CARPETAS_IMAGENES:
        ruta = os.path.join(carpeta, nombre_archivo)
        if os.path.exists(ruta):
            return ruta
    return None

def subir_a_cloudinary(ruta_local, nombre_publico):
    url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"
    with open(ruta_local, "rb") as img_file:
        files = {"file": img_file}
        data = {
            "upload_preset": UPLOAD_PRESET,
            "public_id": f"{CLOUDINARY_FOLDER}/{nombre_publico}"
        }
        response = requests.post(url, files=files, data=data)
        if response.status_code == 200:
            return response.json().get("secure_url")
        else:
            print(f"❌ Error subiendo {nombre_publico}: {response.text}")
            return None

# Procesar cada producto
for producto in catalogo:
    ruta_img = producto.get("imagen")
    data_nombre = producto.get("data-nombre", "")
    nombre_publico = normalizar_nombre(data_nombre)

    ruta_local = buscar_imagen_local(ruta_img)
    if ruta_local:
        print(f"📤 Subiendo imagen: {ruta_local}")
        url_cloudinary = subir_a_cloudinary(ruta_local, nombre_publico)
        if url_cloudinary:
            producto["imagen"] = url_cloudinary
        else:
            print(f"⚠️ No se pudo subir: {ruta_local}")
    else:
        print(f"⚠️ Imagen no encontrada para: {ruta_img}")

# Guardar nuevo JSON
with open("catalogo_con_urls_cloudinary.json", "w", encoding="utf-8") as f:
    json.dump(catalogo, f, ensure_ascii=False, indent=2)

print("✅ Proceso completo. Archivo guardado como 'catalogo_con_urls_cloudinary.json'")
