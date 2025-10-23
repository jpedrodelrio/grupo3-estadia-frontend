#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para generar nombres y RUTs únicos para cada episodio CMBD
en el archivo CSV de datos hospitalarios.
"""

import csv
import random
import string
from typing import List, Tuple

# Lista de nombres comunes chilenos
NOMBRES_MASCULINOS = [
    "Alejandro", "Andrés", "Antonio", "Carlos", "Cristian", "Daniel", "Diego", "Eduardo",
    "Fernando", "Francisco", "Gabriel", "Gonzalo", "Héctor", "Ignacio", "Javier", "Jorge",
    "José", "Juan", "Luis", "Manuel", "Marcelo", "Miguel", "Nicolás", "Pablo", "Patricio",
    "Pedro", "Rafael", "Ricardo", "Roberto", "Rodrigo", "Sebastián", "Sergio", "Tomás",
    "Víctor", "Álvaro", "Cristóbal", "Felipe", "Matías", "Mauricio", "Ramiro", "Santiago"
]

NOMBRES_FEMENINOS = [
    "Alejandra", "Ana", "Andrea", "Antonia", "Camila", "Carolina", "Catalina", "Claudia",
    "Cristina", "Daniela", "Elena", "Elena", "Fernanda", "Francisca", "Gabriela", "Isabel",
    "Javiera", "Jessica", "Katherine", "Laura", "Lorena", "Macarena", "María", "María José",
    "Natalia", "Paola", "Patricia", "Paulina", "Pilar", "Rocío", "Sofía", "Valentina",
    "Verónica", "Viviana", "Ángela", "Constanza", "Diana", "Fabiola", "Gloria", "Mónica"
]

APELLIDOS_CHILENOS = [
    "González", "Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Contreras", "Silva", "Martínez",
    "Sepúlveda", "Morales", "Rodríguez", "López", "Fuentes", "Hernández", "Torres", "Araya",
    "Flores", "Espinoza", "Valenzuela", "Castillo", "Ramírez", "Reyes", "Gutiérrez", "Castro",
    "Vargas", "Álvarez", "Vásquez", "Tapia", "Fernández", "Sánchez", "Peña", "Cáceres",
    "Jiménez", "Araos", "Ruiz", "Navarro", "Moreno", "Rivera", "Figueroa", "Riquelme",
    "Miranda", "Vega", "Campos", "Sandoval", "Carrasco", "Herrera", "Núñez", "Medina"
]

def generar_rut() -> str:
    """
    Genera un RUT válido chileno con formato XX.XXX.XXX-X
    """
    # Generar número base (8 dígitos)
    numero = random.randint(10000000, 99999999)
    
    # Calcular dígito verificador
    suma = 0
    multiplicador = 2
    
    for digito in reversed(str(numero)):
        suma += int(digito) * multiplicador
        multiplicador = multiplicador + 1 if multiplicador < 7 else 2
    
    resto = suma % 11
    dv = 11 - resto
    
    if dv == 11:
        dv = 0
    elif dv == 10:
        dv = 'K'
    
    # Formatear RUT
    rut_str = f"{numero:,}".replace(',', '.')
    return f"{rut_str}-{dv}"

def generar_nombre_completo(sexo: str) -> str:
    """
    Genera un nombre completo basado en el sexo del paciente
    """
    if sexo.lower() in ['hombre', 'masculino', 'm']:
        nombre = random.choice(NOMBRES_MASCULINOS)
    else:
        nombre = random.choice(NOMBRES_FEMENINOS)
    
    apellido1 = random.choice(APELLIDOS_CHILENOS)
    apellido2 = random.choice(APELLIDOS_CHILENOS)
    
    # Evitar apellidos duplicados
    while apellido2 == apellido1:
        apellido2 = random.choice(APELLIDOS_CHILENOS)
    
    return f"{nombre} {apellido1} {apellido2}"

def procesar_csv(input_file: str, output_file: str) -> None:
    """
    Procesa el archivo CSV y genera nombres y RUTs únicos para cada fila
    """
    ruts_generados = set()  # Para evitar duplicados
    
    print(f"Procesando archivo: {input_file}")
    print(f"Archivo de salida: {output_file}")
    
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        
        reader = csv.reader(infile, delimiter=';')
        writer = csv.writer(outfile, delimiter=';')
        
        # Leer y escribir la cabecera
        header = next(reader)
        writer.writerow(header)
        
        # Procesar cada fila
        fila_count = 0
        for row in reader:
            if len(row) >= 4:  # Asegurar que hay al menos las columnas necesarias
                episodio = row[0]
                sexo = row[4] if len(row) > 4 else "Hombre"  # Columna de sexo
                
                # Generar nombre único
                nombre_completo = generar_nombre_completo(sexo)
                
                # Generar RUT único
                rut = generar_rut()
                while rut in ruts_generados:
                    rut = generar_rut()
                ruts_generados.add(rut)
                
                # Actualizar las columnas de nombre y RUT
                row[1] = nombre_completo  # Columna Nombre
                row[2] = rut              # Columna RUT
                
                writer.writerow(row)
                fila_count += 1
                
                if fila_count % 1000 == 0:
                    print(f"Procesadas {fila_count} filas...")
    
    print(f"Procesamiento completado. Total de filas procesadas: {fila_count}")
    print(f"RUTs únicos generados: {len(ruts_generados)}")

def main():
    """
    Función principal del script
    """
    input_file = "GRD 2024-Agosto 2025(Egresos 2024-2025).csv"
    output_file = "GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
    
    try:
        procesar_csv(input_file, output_file)
        print("\n¡Script ejecutado exitosamente!")
        print(f"Los datos generados se han guardado en: {output_file}")
        
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {input_file}")
        print("Asegúrate de que el archivo esté en el directorio actual.")
    except Exception as e:
        print(f"Error durante el procesamiento: {str(e)}")

if __name__ == "__main__":
    main()
