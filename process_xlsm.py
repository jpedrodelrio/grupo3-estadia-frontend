#!/usr/bin/env python3
"""
Script para procesar archivos .xlsm y convertirlos a CSV
Uso: python3 process_xlsm.py <archivo_entrada> <archivo_salida>
"""

import pandas as pd
import os
import sys
import json
from datetime import datetime, timedelta
import numpy as np

def convert_excel_dates(df):
    """
    Convierte fechas de Excel a formato europeo (día/mes/año)
    """
    for column in df.columns:
        # Manejar columnas que ya son datetime64 (fechas de pandas)
        if df[column].dtype == 'datetime64[ns]':
            try:
                def datetime_to_european(date_val):
                    if pd.isna(date_val):
                        return None
                    try:
                        return date_val.strftime('%d/%m/%Y %H:%M:%S')
                    except:
                        return None
                
                df[column] = df[column].apply(datetime_to_european)
                
            except Exception as e:
                print(f"Advertencia: No se pudieron convertir fechas datetime en columna '{column}': {e}")
                pass
        
        # Verificar si la columna contiene números que podrían ser fechas de Excel
        elif df[column].dtype in ['float64', 'int64']:
            # Los números seriales de Excel están típicamente entre 1 y 100000
            # (desde 1900 hasta ~2174)
            numeric_values = pd.to_numeric(df[column], errors='coerce')
            
            # Verificar si los valores están en el rango típico de fechas de Excel
            if not numeric_values.isna().all():
                min_val = numeric_values.min()
                max_val = numeric_values.max()
                
                # Rango típico de fechas de Excel (1 = 1900-01-01, ~50000 = 2036)
                if 1 <= min_val <= 50000 and 1 <= max_val <= 50000:
                    try:
                        # Convertir números seriales de Excel a fechas
                        # Excel cuenta desde 1900-01-01, pero tiene un bug conocido
                        excel_epoch = datetime(1899, 12, 30)
                        
                        def excel_to_date(serial):
                            if pd.isna(serial) or serial == 0:
                                return None
                            try:
                                # Manejar números seriales de Excel
                                days = int(serial)
                                fractional_part = serial - days
                                
                                # Calcular la fecha base
                                date = excel_epoch + timedelta(days=days)
                                
                                # Si hay parte fraccionaria, es hora
                                if fractional_part > 0:
                                    hours = int(fractional_part * 24)
                                    minutes = int((fractional_part * 24 - hours) * 60)
                                    seconds = int(((fractional_part * 24 - hours) * 60 - minutes) * 60)
                                    date = date.replace(hour=hours, minute=minutes, second=seconds)
                                
                                return date.strftime('%d/%m/%Y %H:%M:%S')
                            except:
                                return None
                        
                        # Aplicar conversión solo a valores que parecen fechas
                        df[column] = df[column].apply(excel_to_date)
                        
                    except Exception as e:
                        # Si hay error en la conversión, mantener los valores originales
                        print(f"Advertencia: No se pudieron convertir fechas en columna '{column}': {e}")
                        pass
        
        # También convertir fechas que ya están en formato string pero en formato ISO
        elif df[column].dtype == 'object':
            try:
                def convert_iso_to_european(date_str):
                    if pd.isna(date_str) or not isinstance(date_str, str):
                        return date_str
                    
                    # Intentar parsear fechas en formato ISO (YYYY-MM-DD HH:MM:SS)
                    try:
                        if ' ' in date_str and '-' in date_str and len(date_str) >= 10:
                            # Parsear con formato específico para evitar ambigüedad
                            date_obj = pd.to_datetime(date_str, format='%Y-%m-%d %H:%M:%S')
                            return date_obj.strftime('%d/%m/%Y %H:%M:%S')
                        elif '-' in date_str and len(date_str) >= 10:
                            # Solo fecha sin hora
                            date_obj = pd.to_datetime(date_str, format='%Y-%m-%d')
                            return date_obj.strftime('%d/%m/%Y')
                    except:
                        pass
                    
                    return date_str
                
                # Aplicar conversión a strings que parecen fechas ISO
                df[column] = df[column].apply(convert_iso_to_european)
                
            except Exception as e:
                # Si hay error, mantener los valores originales
                pass
    
    return df

def process_xlsm_to_csv(input_file, output_file=None, sheet_name=None):
    """
    Procesa un archivo .xlsm y lo convierte a CSV
    
    Args:
        input_file (str): Ruta del archivo .xlsm de entrada
        output_file (str): Ruta del archivo CSV de salida (opcional)
        sheet_name (str): Nombre de la hoja específica a procesar (opcional)
    
    Returns:
        dict: Información sobre el procesamiento
    """
    
    try:
        # Verificar que el archivo existe
        if not os.path.exists(input_file):
            return {
                "success": False,
                "error": f"El archivo '{input_file}' no existe",
                "output_file": None
            }
        
        # Generar nombre de archivo de salida si no se proporciona
        if not output_file:
            base_name = os.path.splitext(input_file)[0]
            output_file = f"{base_name}_processed.csv"
        
        # Leer el archivo Excel
        try:
            xl_file = pd.ExcelFile(input_file, engine="openpyxl")
            available_sheets = xl_file.sheet_names
            
            if sheet_name:
                # Buscar hoja específica
                if sheet_name in available_sheets:
                    df = pd.read_excel(input_file, sheet_name=sheet_name, engine="openpyxl")
                    processed_sheet = sheet_name
                else:
                    return {
                        "success": False,
                        "error": f"La hoja '{sheet_name}' no existe. Hojas disponibles: {', '.join(available_sheets)}",
                        "output_file": None
                    }
            else:
                # Buscar hoja "Respuestas Formulario" primero, luego usar la primera
                target_sheets = ["Respuestas Formulario", "Respuesta Formulario", "respuestas formulario", "respuesta formulario"]
                found_sheet = None
                
                for target in target_sheets:
                    if target in available_sheets:
                        found_sheet = target
                        break
                
                if found_sheet:
                    df = pd.read_excel(input_file, sheet_name=found_sheet, engine="openpyxl")
                    processed_sheet = found_sheet
                else:
                    # Usar la primera hoja disponible
                    df = pd.read_excel(input_file, sheet_name=available_sheets[0], engine="openpyxl")
                    processed_sheet = available_sheets[0]
        except Exception as e:
            return {
                "success": False,
                "error": f"Error al leer el archivo Excel: {str(e)}",
                "output_file": None
            }
        
        # Limpiar datos
        df = df.dropna(how='all')  # Eliminar filas completamente vacías
        df = df.dropna(axis=1, how='all')  # Eliminar columnas completamente vacías
        
        # Convertir fechas de Excel a formato legible
        df = convert_excel_dates(df)
        
        # Normalizar nombres de columnas
        df.columns = df.columns.astype(str)
        df.columns = [col.strip().lower().replace(' ', '_').replace(':', '') for col in df.columns]
        
        # Guardar como CSV con separador punto y coma
        try:
            df.to_csv(output_file, index=False, encoding='utf-8', sep=';')
        except Exception as e:
            return {
                "success": False,
                "error": f"Error al guardar el archivo CSV: {str(e)}",
                "output_file": None
            }
        
        return {
            "success": True,
            "error": None,
            "output_file": output_file,
            "processed_sheet": processed_sheet,
            "rows_count": len(df),
            "columns_count": len(df.columns),
            "columns": list(df.columns)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Error inesperado: {str(e)}",
            "output_file": None
        }

def main():
    """Función principal para uso desde línea de comandos"""
    if len(sys.argv) < 2:
        print("Uso: python3 process_xlsm.py <archivo_entrada> [archivo_salida] [nombre_hoja]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    sheet_name = sys.argv[3] if len(sys.argv) > 3 else None
    
    result = process_xlsm_to_csv(input_file, output_file, sheet_name)
    
    # Imprimir resultado como JSON para que pueda ser leído por el frontend
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
