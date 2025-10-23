#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para mostrar información del paciente desde el CSV
Extrae y presenta datos relevantes de cada episodio CMBD
"""

import csv
import json
from typing import Dict, List, Optional
from datetime import datetime

def extraer_informacion_paciente(row: List[str], headers: List[str]) -> Dict[str, str]:
    """
    Extrae la información relevante del paciente de una fila del CSV
    """
    # Crear diccionario con los datos de la fila
    datos = dict(zip(headers, row))
    
    # Información básica del paciente
    info_paciente = {
        # Datos personales
        "episodio_cmbd": datos.get("Episodio CMBD", ""),
        "nombre": datos.get("Nombre", ""),
        "rut": datos.get("RUT", ""),
        "edad": datos.get("Edad en años", ""),
        "sexo": datos.get("Sexo  (Desc)", ""),
        
        # Información médica
        "diagnostico_principal": datos.get("Diagnóstico   Principal", ""),
        "conjunto_diagnosticos": datos.get("Conjunto Dx", ""),
        "especialidad": datos.get("Especialidad médica de la intervención (des)", ""),
        
        # Información de ingreso
        "tipo_actividad": datos.get("Tipo Actividad", ""),
        "tipo_ingreso": datos.get("Tipo Ingreso (Descripción)", ""),
        "servicio_ingreso": datos.get("Servicio Ingreso (Descripción)", ""),
        "servicio_ingreso_codigo": datos.get("Servicio Ingreso (Código)", ""),
        
        # Información de previsión
        "prevision_codigo": datos.get("Prevision (Cód)", ""),
        "prevision_descripcion": datos.get("Prevision (Desc)", ""),
        
        # Fechas importantes
        "fecha_ingreso": datos.get("Fecha Ingreso completa", ""),
        "fecha_egreso": datos.get("Fecha Completa", ""),
        
        # Información de estancia
        "estancia_episodio": datos.get("Estancia del Episodio", ""),
        "horas_estancia": datos.get("Horas de Estancia", ""),
        "estancia_norma": datos.get("Estancia Norma GRD ", ""),
        "impacto_estancias": datos.get("Impacto (Estancias evitables) Brutas", ""),
        
        # Información GRD
        "peso_grd": datos.get("Peso GRD Medio (Todos)", ""),
        "ir_gravedad": datos.get("IR Gravedad  (desc)", ""),
        "ir_mortalidad": datos.get("IR Mortalidad  (desc)", ""),
        "ir_tipo_grd": datos.get("IR Tipo GRD", ""),
        "ir_grd_codigo": datos.get("IR GRD (Código)", ""),
        "ir_grd_descripcion": datos.get("IR GRD", ""),
        
        # Información de outlier
        "estancia_inlier_outlier": datos.get("Estancia Inlier / Outlier", ""),
        
        # Procedimientos
        "procedimiento_principal": datos.get("Proced 01 Principal    (cod)", ""),
        "conjunto_procedimientos": datos.get("Conjunto Procedimientos Secundarios", ""),
        
        # Año y mes
        "año": datos.get("Año", ""),
        "mes": datos.get("Mes (Número)", "")
    }
    
    return info_paciente

def mostrar_informacion_paciente(info: Dict[str, str]) -> None:
    """
    Muestra la información del paciente de forma organizada
    """
    print("=" * 80)
    print("INFORMACIÓN DEL PACIENTE")
    print("=" * 80)
    
    # Datos personales
    print("\n📋 DATOS PERSONALES:")
    print(f"  • Episodio CMBD: {info['episodio_cmbd']}")
    print(f"  • Nombre: {info['nombre']}")
    print(f"  • RUT: {info['rut']}")
    print(f"  • Edad: {info['edad']} años")
    print(f"  • Sexo: {info['sexo']}")
    
    # Información médica
    print("\n🏥 INFORMACIÓN MÉDICA:")
    print(f"  • Diagnóstico Principal: {info['diagnostico_principal']}")
    print(f"  • Especialidad: {info['especialidad']}")
    print(f"  • Tipo de Actividad: {info['tipo_actividad']}")
    print(f"  • Tipo de Ingreso: {info['tipo_ingreso']}")
    print(f"  • Servicio de Ingreso: {info['servicio_ingreso']}")
    
    # Información de previsión
    print("\n💳 INFORMACIÓN DE PREVISIÓN:")
    print(f"  • Previsión: {info.get('prevision_descripcion', 'N/A')} ({info.get('prevision_codigo', 'N/A')})")
    
    # Fechas
    print("\n📅 FECHAS:")
    print(f"  • Fecha de Ingreso: {info['fecha_ingreso']}")
    print(f"  • Fecha de Egreso: {info['fecha_egreso']}")
    
    # Estancia
    print("\n⏱️  INFORMACIÓN DE ESTANCIA:")
    print(f"  • Estancia del Episodio: {info.get('estancia_episodio', 'N/A')} días")
    print(f"  • Horas de Estancia: {info.get('horas_estancia', 'N/A')}")
    print(f"  • Estancia Norma GRD: {info.get('estancia_norma', 'N/A')}")
    print(f"  • Impacto Estancias: {info.get('impacto_estancias', 'N/A')}")
    print(f"  • Tipo: {info.get('estancia_inlier_outlier', 'N/A')}")
    
    # GRD
    print("\n📊 INFORMACIÓN GRD:")
    print(f"  • Peso GRD Medio: {info.get('peso_grd', 'N/A')}")
    print(f"  • IR Gravedad: {info.get('ir_gravedad', 'N/A')}")
    print(f"  • IR Mortalidad: {info.get('ir_mortalidad', 'N/A')}")
    print(f"  • IR Tipo GRD: {info.get('ir_tipo_grd', 'N/A')}")
    print(f"  • IR GRD Código: {info.get('ir_grd_codigo', 'N/A')}")
    print(f"  • IR GRD Descripción: {info.get('ir_grd_descripcion', 'N/A')}")
    
    # Procedimientos
    print("\n🔬 PROCEDIMIENTOS:")
    print(f"  • Procedimiento Principal: {info.get('procedimiento_principal', 'N/A')}")
    
    print("\n" + "=" * 80)

def buscar_paciente_por_rut(csv_file: str, rut_buscar: str) -> Optional[Dict[str, str]]:
    """
    Busca un paciente por RUT en el archivo CSV
    """
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.reader(file, delimiter=';')
        headers = next(reader)  # Leer cabecera
        
        for row in reader:
            if len(row) > 2 and row[2] == rut_buscar:  # RUT está en la columna 2
                return extraer_informacion_paciente(row, headers)
    
    return None

def buscar_paciente_por_episodio(csv_file: str, episodio_buscar: str) -> Optional[Dict[str, str]]:
    """
    Busca un paciente por Episodio CMBD en el archivo CSV
    """
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.reader(file, delimiter=';')
        headers = next(reader)  # Leer cabecera
        
        for row in reader:
            if len(row) > 0 and row[0] == episodio_buscar:  # Episodio está en la columna 0
                return extraer_informacion_paciente(row, headers)
    
    return None

def listar_pacientes_muestra(csv_file: str, cantidad: int = 5) -> List[Dict[str, str]]:
    """
    Lista una muestra de pacientes del archivo CSV
    """
    pacientes = []
    
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.reader(file, delimiter=';')
        headers = next(reader)  # Leer cabecera
        
        contador = 0
        for row in reader:
            if contador >= cantidad:
                break
            
            if len(row) > 2:  # Asegurar que hay datos suficientes
                paciente = extraer_informacion_paciente(row, headers)
                pacientes.append(paciente)
                contador += 1
    
    return pacientes

def exportar_paciente_json(info_paciente: Dict[str, str], archivo_salida: str) -> None:
    """
    Exporta la información del paciente a un archivo JSON
    """
    with open(archivo_salida, 'w', encoding='utf-8') as file:
        json.dump(info_paciente, file, ensure_ascii=False, indent=2)
    
    print(f"✅ Información del paciente exportada a: {archivo_salida}")

def main():
    """
    Función principal del script
    """
    csv_file = "GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
    
    print("🏥 SISTEMA DE CONSULTA DE INFORMACIÓN DE PACIENTES")
    print("=" * 60)
    
    while True:
        print("\nOpciones disponibles:")
        print("1. Buscar paciente por RUT")
        print("2. Buscar paciente por Episodio CMBD")
        print("3. Mostrar muestra de pacientes")
        print("4. Salir")
        
        opcion = input("\nSeleccione una opción (1-4): ").strip()
        
        if opcion == "1":
            rut = input("Ingrese el RUT del paciente (formato: XX.XXX.XXX-X): ").strip()
            paciente = buscar_paciente_por_rut(csv_file, rut)
            
            if paciente:
                mostrar_informacion_paciente(paciente)
                
                # Opción de exportar
                exportar = input("\n¿Desea exportar esta información a JSON? (s/n): ").strip().lower()
                if exportar == 's':
                    archivo_json = f"paciente_{rut.replace('.', '').replace('-', '')}.json"
                    exportar_paciente_json(paciente, archivo_json)
            else:
                print(f"❌ No se encontró paciente con RUT: {rut}")
        
        elif opcion == "2":
            episodio = input("Ingrese el Episodio CMBD: ").strip()
            paciente = buscar_paciente_por_episodio(csv_file, episodio)
            
            if paciente:
                mostrar_informacion_paciente(paciente)
                
                # Opción de exportar
                exportar = input("\n¿Desea exportar esta información a JSON? (s/n): ").strip().lower()
                if exportar == 's':
                    archivo_json = f"paciente_episodio_{episodio}.json"
                    exportar_paciente_json(paciente, archivo_json)
            else:
                print(f"❌ No se encontró paciente con Episodio CMBD: {episodio}")
        
        elif opcion == "3":
            try:
                cantidad = int(input("¿Cuántos pacientes desea mostrar? (máximo 10): ").strip())
                cantidad = min(cantidad, 10)  # Limitar a máximo 10
            except ValueError:
                cantidad = 5
            
            pacientes = listar_pacientes_muestra(csv_file, cantidad)
            
            print(f"\n📋 MUESTRA DE {len(pacientes)} PACIENTES:")
            print("-" * 60)
            
            for i, paciente in enumerate(pacientes, 1):
                print(f"\n{i}. {paciente['nombre']} (RUT: {paciente['rut']})")
                print(f"   Episodio: {paciente['episodio_cmbd']} | Edad: {paciente['edad']} | Sexo: {paciente['sexo']}")
                print(f"   Diagnóstico: {paciente['diagnostico_principal']}")
                print(f"   Servicio: {paciente['servicio_ingreso']}")
        
        elif opcion == "4":
            print("👋 ¡Hasta luego!")
            break
        
        else:
            print("❌ Opción no válida. Por favor, seleccione 1, 2, 3 o 4.")

if __name__ == "__main__":
    main()
