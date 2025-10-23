# 🏥 Sistema de Información de Pacientes CMBD

Este sistema permite extraer, consultar y mostrar información de pacientes desde archivos CSV de episodios CMBD (Casemix Básico de Datos).

## 📁 Archivos del Sistema

### Scripts Principales

1. **`generate_names_ruts.py`** - Generador de datos
   - Rellena nombres y RUTs únicos en archivos CSV
   - Genera datos realistas para anonimización

2. **`patient_info_viewer.py`** - Interfaz interactiva
   - Menú interactivo para consultar pacientes
   - Búsqueda por RUT o Episodio CMBD
   - Visualización completa de información

3. **`patient_extractor.py`** - Funciones programáticas
   - Clase `PatientInfoExtractor` para uso programático
   - Funciones de conveniencia para consultas específicas
   - Estadísticas del dataset

4. **`ejemplos_uso.py`** - Ejemplos prácticos
   - Demuestra todas las funcionalidades
   - Casos de uso comunes

### Archivos de Datos

- **`GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv`** - Dataset principal con 39,222 pacientes
- **`muestra_pacientes.json`** - Archivo JSON de ejemplo exportado

## 🚀 Uso del Sistema

### 1. Interfaz Interactiva

```bash
python3 patient_info_viewer.py
```

**Opciones disponibles:**
- Buscar paciente por RUT
- Buscar paciente por Episodio CMBD
- Mostrar muestra de pacientes
- Exportar información a JSON

### 2. Uso Programático

```python
from patient_extractor import PatientInfoExtractor, get_patient_info

# Crear extractor
extractor = PatientInfoExtractor("archivo.csv")

# Buscar paciente por RUT
paciente = get_patient_info("archivo.csv", rut="12.345.678-9")

# Buscar pacientes por servicio
pacientes_neonatologia = extractor.get_patients_by_service("NEONATOLOGIA")

# Obtener estadísticas
stats = extractor.get_statistics()
```

### 3. Ejemplos Prácticos

```bash
python3 ejemplos_uso.py
```

## 📊 Información Disponible

### Datos Personales
- Episodio CMBD
- Nombre completo
- RUT
- Edad
- Sexo

### Información Médica
- Diagnóstico principal
- Conjunto de diagnósticos
- Especialidad médica
- Tipo de actividad
- Tipo de ingreso
- Servicio de ingreso

### Información de Previsión
- Código de previsión
- Descripción de previsión

### Fechas
- Fecha de ingreso
- Fecha de egreso

### Información de Estancia
- Estancia del episodio (días)
- Horas de estancia
- Estancia norma GRD
- Impacto de estancias evitables
- Tipo (Inlier/Outlier)

### Información GRD
- Peso GRD medio
- IR Gravedad
- IR Mortalidad
- IR Tipo GRD
- IR GRD código y descripción

### Procedimientos
- Procedimiento principal
- Conjunto de procedimientos secundarios

## 🔍 Funciones de Búsqueda

### Por Criterios Específicos

```python
# Por servicio
pacientes = get_patients_by_criteria("archivo.csv", servicio="NEONATOLOGIA")

# Por rango de edad
pacientes = get_patients_by_criteria("archivo.csv", min_age=0, max_age=5)

# Por diagnóstico
pacientes = get_patients_by_criteria("archivo.csv", diagnostico="D81.8")

# Muestra específica
pacientes = get_patients_by_criteria("archivo.csv", count=10)
```

### Estadísticas del Dataset

```python
extractor = PatientInfoExtractor("archivo.csv")
stats = extractor.get_statistics()

print(f"Total pacientes: {stats['total_pacientes']}")
print(f"Hombres: {stats['hombres']}")
print(f"Mujeres: {stats['mujeres']}")
print(f"Servicios únicos: {stats['servicios_unicos']}")
```

## 📈 Estadísticas del Dataset Actual

- **Total de pacientes:** 39,222
- **Hombres:** 16,319 (41.6%)
- **Mujeres:** 22,903 (58.4%)
- **Servicios únicos:** 34
- **Diagnósticos únicos:** 334
- **Años únicos:** 33

## 💾 Exportación de Datos

### A JSON

```python
# Exportar lista de pacientes
extractor.export_to_json(pacientes, "pacientes_exportados.json")

# Exportar paciente individual
from patient_info_viewer import exportar_paciente_json
exportar_paciente_json(info_paciente, "paciente_individual.json")
```

## 🛠️ Requisitos

- Python 3.6+
- Archivo CSV con formato específico (delimitador: `;`)
- Columnas requeridas: Episodio CMBD, Nombre, RUT, Edad, Sexo, etc.

## 📝 Formato del CSV

El archivo CSV debe tener las siguientes columnas principales:
- `Episodio CMBD`
- `Nombre`
- `RUT`
- `Edad en años`
- `Sexo (Desc)`
- `Diagnóstico Principal`
- `Servicio Ingreso (Descripción)`
- `Fecha Ingreso completa`
- `Fecha Completa`
- Y otras columnas específicas del sistema CMBD

## 🔧 Personalización

### Agregar Nuevas Búsquedas

```python
def buscar_por_criterio_personalizado(self, criterio):
    pacientes = []
    with open(self.csv_file, 'r', encoding='utf-8') as file:
        reader = csv.reader(file, delimiter=';')
        next(reader)
        
        for row in reader:
            if criterio_personalizado(row):
                pacientes.append(self._extract_patient_info(row))
    
    return pacientes
```

### Modificar Información Mostrada

Editar la función `mostrar_informacion_paciente()` en `patient_info_viewer.py` para agregar o modificar campos mostrados.

## 🎯 Casos de Uso

1. **Consulta Individual:** Buscar información específica de un paciente
2. **Análisis por Servicio:** Estudiar pacientes de un servicio específico
3. **Análisis Demográfico:** Estudiar distribución por edad o sexo
4. **Análisis de Estancias:** Estudiar patrones de estancia hospitalaria
5. **Exportación de Datos:** Preparar datos para análisis externos

## ⚠️ Notas Importantes

- Los datos están anonimizados con nombres y RUTs generados
- El sistema preserva la estructura original del CSV
- Las búsquedas son case-insensitive para texto
- Los archivos JSON mantienen la codificación UTF-8

## 📞 Soporte

Para dudas o problemas con el sistema, revisar los ejemplos en `ejemplos_uso.py` o ejecutar `python3 patient_info_viewer.py` para la interfaz interactiva.
