import pandas as pd
import os

# Nombre del archivo original
archivo_origen = "Gestion Estadía.xlsm"

# Nombre de la hoja a exportar
hoja_origen = "Respuestas Formulario"

# Nombre del nuevo archivo
archivo_destino = "Respuestas_FormularioCSV.csv"

# Ruta base (misma carpeta del script o del archivo original)
ruta_base = os.path.dirname(os.path.abspath(archivo_origen))
ruta_salida = os.path.join(ruta_base, archivo_destino)

# Leer solo la hoja específica
try:
    df = pd.read_excel(archivo_origen, sheet_name=hoja_origen, engine="openpyxl")
except Exception as e:
    print(f"❌ Error al leer la hoja '{hoja_origen}' desde '{archivo_origen}': {e}")
    exit()

# Guardar como nuevo archivo .csv
try:
    df.to_csv(ruta_salida, index=False, encoding='utf-8', sep=';')
    print(f"✅ Hoja '{hoja_origen}' exportada correctamente como '{ruta_salida}'")
except Exception as e:
    print(f"❌ Error al guardar el archivo .csv: {e}")
