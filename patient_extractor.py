#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script simple para extraer información específica del paciente desde el CSV
Versión programática sin menú interactivo
"""

import csv
import json
from typing import Dict, List, Optional

class PatientInfoExtractor:
    """
    Clase para extraer información de pacientes desde el CSV
    """
    
    def __init__(self, csv_file: str):
        self.csv_file = csv_file
        self.headers = self._load_headers()
    
    def _load_headers(self) -> List[str]:
        """Carga las cabeceras del archivo CSV"""
        with open(self.csv_file, 'r', encoding='utf-8') as file:
            reader = csv.reader(file, delimiter=';')
            return next(reader)
    
    def get_patient_by_rut(self, rut: str) -> Optional[Dict[str, str]]:
        """Obtiene información del paciente por RUT"""
        with open(self.csv_file, 'r', encoding='utf-8') as file:
            reader = csv.reader(file, delimiter=';')
            next(reader)  # Saltar cabecera
            
            for row in reader:
                if len(row) > 2 and row[2] == rut:
                    return self._extract_patient_info(row)
        return None
    
    def get_patient_by_episodio(self, episodio: str) -> Optional[Dict[str, str]]:
        """Obtiene información del paciente por Episodio CMBD"""
        with open(self.csv_file, 'r', encoding='utf-8') as file:
            reader = csv.reader(file, delimiter=';')
            next(reader)  # Saltar cabecera
            
            for row in reader:
                if len(row) > 0 and row[0] == episodio:
                    return self._extract_patient_info(row)
        return None
    
    def get_patients_by_service(self, servicio: str) -> List[Dict[str, str]]:
        """Obtiene todos los pacientes de un servicio específico"""
        pacientes = []
        
        with open(self.csv_file, 'r', encoding='utf-8') as file:
            reader = csv.reader(file, delimiter=';')
            next(reader)  # Saltar cabecera
            
            for row in reader:
                if len(row) > 8 and servicio.lower() in row[8].lower():  # Servicio Ingreso
                    pacientes.append(self._extract_patient_info(row))
        
        return pacientes
    
    def get_patients_by_age_range(self, min_age: int, max_age: int) -> List[Dict[str, str]]:
        """Obtiene pacientes dentro de un rango de edad"""
        pacientes = []
        
        with open(self.csv_file, 'r', encoding='utf-8') as file:
            reader = csv.reader(file, delimiter=';')
            next(reader)  # Saltar cabecera
            
            for row in reader:
                if len(row) > 3:
                    try:
                        edad = int(row[3])
                        if min_age <= edad <= max_age:
                            pacientes.append(self._extract_patient_info(row))
                    except ValueError:
                        continue
        
        return pacientes
    
    def get_patients_by_diagnosis(self, diagnostico: str) -> List[Dict[str, str]]:
        """Obtiene pacientes con un diagnóstico específico"""
        pacientes = []
        
        with open(self.csv_file, 'r', encoding='utf-8') as file:
            reader = csv.reader(file, delimiter=';')
            next(reader)  # Saltar cabecera
            
            for row in reader:
                if len(row) > 45:  # Diagnóstico Principal
                    if diagnostico.lower() in row[45].lower():
                        pacientes.append(self._extract_patient_info(row))
        
        return pacientes
    
    def get_sample_patients(self, count: int = 10) -> List[Dict[str, str]]:
        """Obtiene una muestra de pacientes"""
        pacientes = []
        
        with open(self.csv_file, 'r', encoding='utf-8') as file:
            reader = csv.reader(file, delimiter=';')
            next(reader)  # Saltar cabecera
            
            for i, row in enumerate(reader):
                if i >= count:
                    break
                if len(row) > 2:
                    pacientes.append(self._extract_patient_info(row))
        
        return pacientes
    
    def _extract_patient_info(self, row: List[str]) -> Dict[str, str]:
        """Extrae información del paciente de una fila"""
        datos = dict(zip(self.headers, row))
        
        return {
            # Información básica
            "episodio_cmbd": datos.get("Episodio CMBD", ""),
            "nombre": datos.get("Nombre", ""),
            "rut": datos.get("RUT", ""),
            "edad": datos.get("Edad en años", ""),
            "sexo": datos.get("Sexo  (Desc)", ""),
            
            # Información médica
            "diagnostico_principal": datos.get("Diagnóstico   Principal", ""),
            "especialidad": datos.get("Especialidad médica de la intervención (des)", ""),
            "tipo_actividad": datos.get("Tipo Actividad", ""),
            "tipo_ingreso": datos.get("Tipo Ingreso (Descripción)", ""),
            "servicio_ingreso": datos.get("Servicio Ingreso (Descripción)", ""),
            
            # Previsión
            "prevision": datos.get("Prevision (Desc)", ""),
            
            # Fechas
            "fecha_ingreso": datos.get("Fecha Ingreso completa", ""),
            "fecha_egreso": datos.get("Fecha Completa", ""),
            
            # Estancia
            "estancia_dias": datos.get("Estancia del Episodio", ""),
            "horas_estancia": datos.get("Horas de Estancia", ""),
            "estancia_inlier_outlier": datos.get("Estancia Inlier / Outlier", ""),
            
            # GRD
            "peso_grd": datos.get("Peso GRD Medio (Todos)", ""),
            "ir_gravedad": datos.get("IR Gravedad  (desc)", ""),
            "ir_mortalidad": datos.get("IR Mortalidad  (desc)", ""),
            
            # Año y mes
            "año": datos.get("Año", ""),
            "mes": datos.get("Mes (Número)", "")
        }
    
    def export_to_json(self, pacientes: List[Dict[str, str]], filename: str) -> None:
        """Exporta lista de pacientes a JSON"""
        with open(filename, 'w', encoding='utf-8') as file:
            json.dump(pacientes, file, ensure_ascii=False, indent=2)
        print(f"✅ Datos exportados a: {filename}")
    
    def get_statistics(self) -> Dict[str, int]:
        """Obtiene estadísticas básicas del dataset"""
        stats = {
            "total_pacientes": 0,
            "hombres": 0,
            "mujeres": 0,
            "servicios_unicos": set(),
            "diagnosticos_unicos": set(),
            "años_unicos": set()
        }
        
        with open(self.csv_file, 'r', encoding='utf-8') as file:
            reader = csv.reader(file, delimiter=';')
            next(reader)  # Saltar cabecera
            
            for row in reader:
                if len(row) > 4:
                    stats["total_pacientes"] += 1
                    
                    # Contar por sexo
                    sexo = row[4].lower()
                    if "hombre" in sexo:
                        stats["hombres"] += 1
                    elif "mujer" in sexo:
                        stats["mujeres"] += 1
                    
                    # Servicios únicos
                    if len(row) > 8:
                        stats["servicios_unicos"].add(row[8])
                    
                    # Diagnósticos únicos
                    if len(row) > 45:
                        stats["diagnosticos_unicos"].add(row[45])
                    
                    # Años únicos
                    if len(row) > 46:
                        stats["años_unicos"].add(row[46])
        
        # Convertir sets a counts
        stats["servicios_unicos"] = len(stats["servicios_unicos"])
        stats["diagnosticos_unicos"] = len(stats["diagnosticos_unicos"])
        stats["años_unicos"] = len(stats["años_unicos"])
        
        return stats

# Funciones de conveniencia para uso directo
def get_patient_info(csv_file: str, rut: str = None, episodio: str = None) -> Optional[Dict[str, str]]:
    """
    Función de conveniencia para obtener información de un paciente
    """
    extractor = PatientInfoExtractor(csv_file)
    
    if rut:
        return extractor.get_patient_by_rut(rut)
    elif episodio:
        return extractor.get_patient_by_episodio(episodio)
    else:
        return None

def get_patients_by_criteria(csv_file: str, **criteria) -> List[Dict[str, str]]:
    """
    Función de conveniencia para obtener pacientes por criterios específicos
    """
    extractor = PatientInfoExtractor(csv_file)
    
    if "servicio" in criteria:
        return extractor.get_patients_by_service(criteria["servicio"])
    elif "min_age" in criteria and "max_age" in criteria:
        return extractor.get_patients_by_age_range(criteria["min_age"], criteria["max_age"])
    elif "diagnostico" in criteria:
        return extractor.get_patients_by_diagnosis(criteria["diagnostico"])
    elif "count" in criteria:
        return extractor.get_sample_patients(criteria["count"])
    else:
        return extractor.get_sample_patients(10)

# Ejemplo de uso
if __name__ == "__main__":
    csv_file = "GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
    
    # Crear extractor
    extractor = PatientInfoExtractor(csv_file)
    
    # Ejemplos de uso
    print("🔍 EJEMPLOS DE USO DEL EXTRACTOR DE INFORMACIÓN DE PACIENTES")
    print("=" * 70)
    
    # Obtener muestra de pacientes
    print("\n1. Muestra de 3 pacientes:")
    muestra = extractor.get_sample_patients(3)
    for i, paciente in enumerate(muestra, 1):
        print(f"   {i}. {paciente['nombre']} - RUT: {paciente['rut']} - Edad: {paciente['edad']}")
    
    # Buscar por RUT específico
    print("\n2. Buscar paciente por RUT:")
    if muestra:
        rut_ejemplo = muestra[0]['rut']
        paciente = extractor.get_patient_by_rut(rut_ejemplo)
        if paciente:
            print(f"   ✅ Encontrado: {paciente['nombre']} - Servicio: {paciente['servicio_ingreso']}")
    
    # Estadísticas
    print("\n3. Estadísticas del dataset:")
    stats = extractor.get_statistics()
    print(f"   • Total pacientes: {stats['total_pacientes']}")
    print(f"   • Hombres: {stats['hombres']}")
    print(f"   • Mujeres: {stats['mujeres']}")
    print(f"   • Servicios únicos: {stats['servicios_unicos']}")
    print(f"   • Diagnósticos únicos: {stats['diagnosticos_unicos']}")
    
    print("\n✅ Script funcionando correctamente!")
