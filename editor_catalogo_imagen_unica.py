data_nombre_original = None

import json
import os
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

catalogo_path = "catalogo.json"
undo_stack = []

def cargar_catalogo():
    if not os.path.exists(catalogo_path):
        return []
    with open(catalogo_path, "r", encoding="utf-8") as f:
        return json.load(f)

def guardar_catalogo():
    with open(catalogo_path, "w", encoding="utf-8") as f:
        json.dump(productos, f, ensure_ascii=False, indent=2)

def limpiar_campos():
    for entry in entries:
        entry.delete(0, tk.END)
    btn_agregar.config(state="normal")
    btn_actualizar.config(state="disabled")

def obtener_datos_formulario():
    return {
        "data-nombre": entry_data_nombre.get().strip(),
        "nombre": entry_nombre.get().strip(),
        "imagen": entry_imagen.get().strip(),
        "categoria": entry_categoria.get().strip(),
        "subcategoria": entry_subcategoria.get().strip(),
        "tercer_categoria": entry_tercer_categoria.get().strip()
    }

def agregar_producto():
    producto = obtener_datos_formulario()
    if not producto["data-nombre"]:
        messagebox.showwarning("Validación", "El campo 'data-nombre' no puede estar vacío.")
        return
    productos.append(producto)
    guardar_catalogo()
    actualizar_tabla()
    limpiar_campos()


def actualizar_producto():
    global data_nombre_original
    selected = tree.selection()
    if not selected or data_nombre_original is None:
        return
    index = tree.index(selected)
    producto_nuevo = obtener_datos_formulario()

    # Buscar el producto original
    for i, p in enumerate(productos):
        if p.get("data-nombre") == data_nombre_original:
            undo_stack.append(("actualizar", i, productos[i].copy()))
            productos[i] = producto_nuevo
            data_nombre_original = None
            guardar_catalogo()
            actualizar_tabla()
            limpiar_campos()
            return
    
    selected = tree.selection()
    if not selected:
        return
    index = tree.index(selected)
    antiguo = productos[index].copy()
    undo_stack.append(("actualizar", index, antiguo))
    productos[index] = obtener_datos_formulario()
    guardar_catalogo()
    actualizar_tabla()
    limpiar_campos()

def eliminar_producto():
    selected = tree.selection()
    if not selected:
        return
    index = tree.index(selected)
    eliminado = productos.pop(index)
    undo_stack.append(("eliminar", index, eliminado))
    guardar_catalogo()
    actualizar_tabla()
    limpiar_campos()

def deshacer_ultima_accion(event=None):
    if not undo_stack:
        return
    accion, index, producto = undo_stack.pop()
    if accion == "eliminar":
        productos.insert(index, producto)
    elif accion == "actualizar":
        productos[index] = producto
    guardar_catalogo()
    actualizar_tabla()

def cargar_producto_en_formulario(event):
    selected = tree.selection()
    if not selected:
        return
    index = tree.index(selected)
    prod = productos_filtrados[index]

    entry_data_nombre.delete(0, tk.END)
    entry_data_nombre.insert(0, prod.get("data-nombre", ""))
    global data_nombre_original
    data_nombre_original = prod.get("data-nombre", "")

    entry_nombre.delete(0, tk.END)
    entry_nombre.insert(0, prod.get("nombre", ""))

    entry_imagen.delete(0, tk.END)
    entry_imagen.insert(0, prod.get("imagen", ""))

    entry_categoria.delete(0, tk.END)
    entry_categoria.insert(0, prod.get("categoria", ""))

    entry_subcategoria.delete(0, tk.END)
    entry_subcategoria.insert(0, prod.get("subcategoria", ""))

    entry_tercer_categoria.delete(0, tk.END)
    entry_tercer_categoria.insert(0, prod.get("tercer_categoria", ""))

    btn_agregar.config(state="disabled")
    btn_actualizar.config(state="normal")


import os


def construir_ruta_categoria():
    cat = entry_categoria.get().strip().lower().replace(" ", "_")
    partes = ["img"]
    if cat:
        partes.append(cat)
    return "./" + "/".join(partes)

    cat = entry_categoria.get().strip().lower().replace(" ", "_")
    subcat = entry_subcategoria.get().strip().lower().replace(" ", "_")
    partes = ["img"]
    if cat:
        partes.append(cat)
    if subcat:
        partes.append(subcat)
    return "./" + "/".join(partes)



import shutil


import shutil

imagen_en_proceso = False

def seleccionar_imagen():
    global imagen_en_proceso
    if imagen_en_proceso:
        return
    imagen_en_proceso = True

    try:
        path = filedialog.askopenfilename(
            title="Seleccionar imagen",
            filetypes=[("Imágenes", "*.jpg *.png *.jpeg *.gif")]
        )
        if not path:
            imagen_en_proceso = False
            return

        nombre_archivo = os.path.basename(path)
        destino_carpeta = construir_ruta_categoria().replace("./", "")
        os.makedirs(destino_carpeta, exist_ok=True)
        destino_path = os.path.join(destino_carpeta, nombre_archivo).replace("\\", "/")

        shutil.copy(path, destino_path)
        ruta_relativa = "./" + destino_path.replace("\\", "/")

        entry_imagen.delete(0, tk.END)
        entry_imagen.insert(0, ruta_relativa)

    except Exception as e:
        messagebox.showerror("Error al copiar imagen", str(e))
    finally:
        imagen_en_proceso = False

    path = filedialog.askopenfilename(
        title="Seleccionar imagen",
        filetypes=[("Imágenes", "*.jpg *.png *.jpeg *.gif")]
    )
    if not path:
        return

    nombre_archivo = os.path.basename(path)
    destino_carpeta = construir_ruta_categoria().replace("./", "")
    os.makedirs(destino_carpeta, exist_ok=True)
    destino_path = os.path.join(destino_carpeta, nombre_archivo).replace("\\", "/")

    try:
        shutil.copy(path, destino_path)
    except Exception as e:
        messagebox.showerror("Error al copiar imagen", str(e))
        return

    ruta_relativa = "./" + destino_path.replace("\\", "/")
    entry_imagen.delete(0, tk.END)
    entry_imagen.insert(0, ruta_relativa)

    path = filedialog.askopenfilename(
        title="Seleccionar imagen",
        filetypes=[("Imágenes", "*.jpg *.png *.jpeg *.gif")]
    )
    if path:
        nombre_archivo = os.path.basename(path)
        ruta_relativa = os.path.join(construir_ruta_categoria(), nombre_archivo).replace("\\", "/")
        entry_imagen.delete(0, tk.END)
        entry_imagen.insert(0, ruta_relativa)

    path = filedialog.askopenfilename(title="Seleccionar imagen", filetypes=[("Imágenes", "*.jpg *.png *.jpeg *.gif")])
    if path:
        entry_imagen.delete(0, tk.END)
        entry_imagen.insert(0, path)

def actualizar_tabla():
    global productos_filtrados
    busqueda = entry_busqueda.get().strip().lower()
    cat = combo_categoria.get()
    subcat = combo_subcategoria.get()

    productos_filtrados = [
        p for p in productos
        if busqueda in p.get("nombre", "").lower()
        and (cat == "" or p.get("categoria", "") == cat)
        and (subcat == "" or p.get("subcategoria", "") == subcat)
    ]

    for i in tree.get_children():
        tree.delete(i)
    for prod in productos_filtrados:
        tree.insert("", tk.END, values=(
            prod.get("data-nombre", ""),
            prod.get("nombre", ""),
            prod.get("imagen", ""),
            prod.get("categoria", ""),
            prod.get("subcategoria", ""),
            prod.get("tercer_categoria", "")
        ))

    actualizar_filtros()

def actualizar_filtros():
    categorias = sorted(set(p.get("categoria", "") for p in productos if p.get("categoria", "")))
    subcategorias = sorted(set(p.get("subcategoria", "") for p in productos if p.get("subcategoria", "")))
    combo_categoria["values"] = [""] + categorias
    combo_subcategoria["values"] = [""] + subcategorias

def limpiar_filtros():
    entry_busqueda.delete(0, tk.END)
    combo_categoria.set("")
    combo_subcategoria.set("")
    actualizar_tabla()

# Interfaz
root = tk.Tk()
root.title("Editor Catálogo Completo")
root.geometry("1200x650")
root.configure(bg="#f4f4f4")
root.bind_all("<Control-z>", deshacer_ultima_accion)

frame_form = tk.Frame(root, bg="#f4f4f4")
frame_form.pack(pady=10)

labels_text = ["data-nombre", "Nombre", "Imagen", "Categoría", "Subcategoría", "Tercer categoría"]
entries = []

for i, text in enumerate(labels_text):
    label = tk.Label(frame_form, text=text, bg="#f4f4f4")
    label.grid(row=0, column=i, padx=5, sticky="w")
    entry = tk.Entry(frame_form, width=20)
    entry.grid(row=1, column=i, padx=5)
    entries.append(entry)

entry_data_nombre, entry_nombre, entry_imagen, entry_categoria, entry_subcategoria, entry_tercer_categoria = entries
btn_imagen = tk.Button(frame_form, text="📁", command=seleccionar_imagen)
btn_imagen.grid(row=1, column=2, sticky="e")

frame_filtros = tk.Frame(root, bg="#f4f4f4")
frame_filtros.pack()

tk.Label(frame_filtros, text="Buscar:", bg="#f4f4f4").grid(row=0, column=0)
entry_busqueda = tk.Entry(frame_filtros, width=30)
entry_busqueda.grid(row=0, column=1, padx=5)
entry_busqueda.bind("<KeyRelease>", lambda e: actualizar_tabla())

tk.Label(frame_filtros, text="Categoría:", bg="#f4f4f4").grid(row=0, column=2)
combo_categoria = ttk.Combobox(frame_filtros, width=20, state="readonly")
combo_categoria.grid(row=0, column=3, padx=5)
combo_categoria.bind("<<ComboboxSelected>>", lambda e: actualizar_tabla())

tk.Label(frame_filtros, text="Subcategoría:", bg="#f4f4f4").grid(row=0, column=4)
combo_subcategoria = ttk.Combobox(frame_filtros, width=20, state="readonly")
combo_subcategoria.grid(row=0, column=5, padx=5)
combo_subcategoria.bind("<<ComboboxSelected>>", lambda e: actualizar_tabla())

btn_limpia_filtro = tk.Button(frame_filtros, text="Limpiar filtros", command=limpiar_filtros)
btn_limpia_filtro.grid(row=0, column=6, padx=10)

frame_botones = tk.Frame(root, bg="#f4f4f4")
frame_botones.pack(pady=10)

btn_agregar = tk.Button(frame_botones, text="Agregar", bg="#4CAF50", fg="white", command=agregar_producto)
btn_agregar.grid(row=0, column=0, padx=10)

btn_actualizar = tk.Button(frame_botones, text="Actualizar", bg="#2196F3", fg="white", state="disabled", command=actualizar_producto)
btn_actualizar.grid(row=0, column=1, padx=10)

btn_eliminar = tk.Button(frame_botones, text="Eliminar", bg="#f44336", fg="white", command=eliminar_producto)
btn_eliminar.grid(row=0, column=2, padx=10)

btn_deshacer = tk.Button(frame_botones, text="↩ Deshacer Ctrl+Z", command=deshacer_ultima_accion)
btn_deshacer.grid(row=0, column=3, padx=10)

btn_limpiar = tk.Button(frame_botones, text="Limpiar", command=limpiar_campos)
btn_limpiar.grid(row=0, column=4, padx=10)

frame_tabla = tk.Frame(root)
frame_tabla.pack(expand=True, fill=tk.BOTH, padx=10, pady=10)

cols = ("data-nombre", "Nombre", "Imagen", "Categoría", "Subcategoría", "Tercer categoría")
tree = ttk.Treeview(frame_tabla, columns=cols, show="headings")
for col in cols:
    tree.heading(col, text=col)
    tree.column(col, width=160)

scroll_y = ttk.Scrollbar(frame_tabla, orient="vertical", command=tree.yview)
tree.configure(yscroll=scroll_y.set)
scroll_y.pack(side="right", fill="y")

tree.pack(expand=True, fill=tk.BOTH)
tree.bind("<<TreeviewSelect>>", cargar_producto_en_formulario)

productos = cargar_catalogo()
productos_filtrados = productos.copy()
actualizar_tabla()

root.mainloop()
