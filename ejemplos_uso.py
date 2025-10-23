#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ejemplo práctico de uso de los scripts de información de pacientes
Demuestra diferentes formas de consultar y mostrar información
"""

from patient_extractor import PatientInfoExtractor, get_patient_info, get_patients_by_criteria
from patient_info_viewer import mostrar_informacion_paciente

def ejemplo_busqueda_por_rut():
    """Ejemplo: Buscar paciente por RUT"""
    print("🔍 EJEMPLO: Búsqueda por RUT")
    print("-" * 40)
    
    csv_file = "GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
    
    # RUT de ejemplo (del primer paciente)
    rut_ejemplo = "16.014.303-7"
    
    paciente = get_patient_info(csv_file, rut=rut_ejemplo)
    
    if paciente:
        print(f"✅ Paciente encontrado: {paciente['nombre']}")
        print(f"   Episodio: {paciente['episodio_cmbd']}")
        print(f"   Edad: {paciente['edad']} años")
        print(f"   Sexo: {paciente['sexo']}")
        print(f"   Servicio: {paciente['servicio_ingreso']}")
        print(f"   Diagnóstico: {paciente['diagnostico_principal']}")
    else:
        print(f"❌ No se encontró paciente con RUT: {rut_ejemplo}")

def ejemplo_busqueda_por_servicio():
    """Ejemplo: Buscar pacientes por servicio"""
    print("\n🏥 EJEMPLO: Búsqueda por servicio")
    print("-" * 40)
    
    csv_file = "GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
    
    # Buscar pacientes en NEONATOLOGIA
    servicio = "NEONATOLOGIA"
    pacientes = get_patients_by_criteria(csv_file, servicio=servicio)
    
    print(f"📊 Pacientes en {servicio}: {len(pacientes)}")
    
    if pacientes:
        print("Primeros 3 pacientes:")
        for i, paciente in enumerate(pacientes[:3], 1):
            print(f"   {i}. {paciente['nombre']} - RUT: {paciente['rut']} - Edad: {paciente['edad']}")

def ejemplo_busqueda_por_edad():
    """Ejemplo: Buscar pacientes por rango de edad"""
    print("\n👶 EJEMPLO: Búsqueda por rango de edad")
    print("-" * 40)
    
    csv_file = "GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
    
    # Buscar pacientes entre 0 y 5 años
    min_edad, max_edad = 0, 5
    pacientes = get_patients_by_criteria(csv_file, min_age=min_edad, max_age=max_edad)
    
    print(f"📊 Pacientes entre {min_edad} y {max_edad} años: {len(pacientes)}")
    
    if pacientes:
        print("Primeros 3 pacientes:")
        for i, paciente in enumerate(pacientes[:3], 1):
            print(f"   {i}. {paciente['nombre']} - RUT: {paciente['rut']} - Edad: {paciente['edad']}")

def ejemplo_estadisticas():
    """Ejemplo: Mostrar estadísticas del dataset"""
    print("\n📈 EJEMPLO: Estadísticas del dataset")
    print("-" * 40)
    
    csv_file = "GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
    extractor = PatientInfoExtractor(csv_file)
    
    stats = extractor.get_statistics()
    
    print("📊 Estadísticas generales:")
    print(f"   • Total de pacientes: {stats['total_pacientes']:,}")
    print(f"   • Hombres: {stats['hombres']:,} ({stats['hombres']/stats['total_pacientes']*100:.1f}%)")
    print(f"   • Mujeres: {stats['mujeres']:,} ({stats['mujeres']/stats['total_pacientes']*100:.1f}%)")
    print(f"   • Servicios únicos: {stats['servicios_unicos']}")
    print(f"   • Diagnósticos únicos: {stats['diagnosticos_unicos']}")
    print(f"   • Años únicos: {stats['años_unicos']}")

def ejemplo_informacion_completa():
    """Ejemplo: Mostrar información completa de un paciente"""
    print("\n📋 EJEMPLO: Información completa de paciente")
    print("-" * 40)
    
    csv_file = "GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
    
    # Obtener un paciente de ejemplo
    extractor = PatientInfoExtractor(csv_file)
    pacientes = extractor.get_sample_patients(1)
    
    if pacientes:
        paciente = pacientes[0]
        print(f"Mostrando información completa de: {paciente['nombre']}")
        print("=" * 60)
        
        # Mostrar información detallada usando la función del viewer
        mostrar_informacion_paciente(paciente)

def ejemplo_exportar_datos():
    """Ejemplo: Exportar datos a JSON"""
    print("\n💾 EJEMPLO: Exportar datos a JSON")
    print("-" * 40)
    
    csv_file = "GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
    
    # Obtener muestra de pacientes
    pacientes = get_patients_by_criteria(csv_file, count=5)
    
    if pacientes:
        # Exportar a JSON
        extractor = PatientInfoExtractor(csv_file)
        extractor.export_to_json(pacientes, "muestra_pacientes.json")
        
        print(f"✅ Exportados {len(pacientes)} pacientes a muestra_pacientes.json")
        
        # Mostrar información del primer paciente exportado
        print(f"\nPrimer paciente exportado:")
        print(f"   Nombre: {pacientes[0]['nombre']}")
        print(f"   RUT: {pacientes[0]['rut']}")
        print(f"   Servicio: {pacientes[0]['servicio_ingreso']}")

def main():
    """Función principal con todos los ejemplos"""
    print("🏥 EJEMPLOS PRÁCTICOS DE USO - SISTEMA DE PACIENTES")
    print("=" * 70)
    
    try:
        # Ejecutar todos los ejemplos
        ejemplo_busqueda_por_rut()
        ejemplo_busqueda_por_servicio()
        ejemplo_busqueda_por_edad()
        ejemplo_estadisticas()
        ejemplo_informacion_completa()
        ejemplo_exportar_datos()
        
        print("\n" + "=" * 70)
        print("✅ Todos los ejemplos ejecutados exitosamente!")
        print("\n📚 FUNCIONES DISPONIBLES:")
        print("   • patient_info_viewer.py - Interfaz interactiva completa")
        print("   • patient_extractor.py - Funciones programáticas")
        print("   • generate_names_ruts.py - Generador de datos")
        
    except FileNotFoundError:
        print("❌ Error: No se encontró el archivo CSV")
        print("   Asegúrate de que 'GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv' esté en el directorio")
    except Exception as e:
        print(f"❌ Error durante la ejecución: {str(e)}")

if __name__ == "__main__":
    main()
