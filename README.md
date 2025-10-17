# Sistema de Gestión de Estadía Hospitalaria - Hospital UC

![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.4.2-purple.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-cyan.svg)
![Supabase](https://img.shields.io/badge/Supabase-2.57.4-green.svg)

## 📋 Descripción

Sistema web desarrollado para optimizar la gestión de pacientes hospitalizados en el Hospital UC. La aplicación permite coordinar equipos multidisciplinarios, identificar pacientes con riesgo social alto y automatizar alertas para intervenciones oportunas, reduciendo estadías prolongadas y mejorando la eficiencia operacional.

## ✨ Características Principales

### 🏥 Dashboard Operacional
- **Métricas en tiempo real** de pacientes activos
- **Estadísticas de tareas** pendientes y completadas
- **Indicadores de estadía promedio** y pacientes con estadías prolongadas
- **Distribución visual de riesgos** (semáforo: verde/amarillo/rojo)

### 👥 Gestión de Pacientes
- **Tabla completa** de pacientes hospitalizados
- **Sistema de filtros avanzados** por servicio, riesgo y estado
- **Panel de alertas** automáticas
- **Modal de detalles** del paciente con historial completo

### 📋 Coordinación de Equipos
- **Sistema de tareas** asignadas por roles:
  - Gestor de Estadía
  - Trabajador Social
  - Analista
  - Jefe de Servicio
- **Tipos de tareas**: social, clínica, administrativa, coordinación
- **Prioridades**: baja, media, alta, crítica
- **Estados**: pendiente, en progreso, completada, cancelada

### 🧠 Sistema de Predicción de Riesgo Social
- **Algoritmo inteligente** que evalúa múltiples factores:
  - Edad del paciente (>65 años)
  - Días de hospitalización (>10 días)
  - Tipo de previsión (FONASA A/B)
  - Servicio clínico de alta complejidad
  - Evaluación de riesgo social previa
- **Genera scores y recomendaciones** automáticas
- **Clasificación en niveles**: bajo, medio, alto, crítico

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **Iconos**: Lucide React
- **Linting**: ESLint

## 📦 Instalación

### Prerrequisitos

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- **Cuenta de Supabase** (gratuita)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd grupo3-estadia-frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar variables de entorno**
   
   Crear un archivo `.env.local` en la raíz del proyecto:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```

   > **Nota**: Si no tienes configuración de Supabase, la aplicación funcionará con datos de ejemplo.

4. **Configurar Supabase (Opcional)**

   Si quieres usar la base de datos real:
   
   a. Crear un proyecto en [Supabase](https://supabase.com)
   
   b. Ejecutar la migración SQL:
   ```bash
   # En el dashboard de Supabase, ejecutar el contenido del archivo:
   supabase/migrations/20250928224533_dry_dust.sql
   ```

## 🚀 Ejecución Local

### Modo Desarrollo

```bash
npm run dev
# o
yarn dev
```

La aplicación estará disponible en `http://localhost:5173`

### Modo Producción

```bash
# Construir para producción
npm run build
# o
yarn build

# Preview de la build
npm run preview
# o
yarn preview
```

### Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview de la build
npm run lint         # Ejecutar ESLint
npm run typecheck    # Verificar tipos TypeScript
```

## 📊 Datos de Ejemplo

El sistema incluye datos de muestra realistas con:

- **6 pacientes** de diferentes servicios clínicos
- **4 tareas** que demuestran el flujo de trabajo multidisciplinario
- **Alertas automáticas** basadas en criterios de riesgo

### Servicios Clínicos Incluidos:
- Medicina Interna
- Cardiología
- Cirugía
- UCI
- Ginecología
- Traumatología

## 🏗️ Estructura del Proyecto

```
src/
├── components/
│   ├── Dashboard/           # Componentes del dashboard
│   │   ├── AlertsPanel.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── OperationalDashboard.tsx
│   │   ├── PatientTable.tsx
│   │   ├── SocialRiskPredictor.tsx
│   │   ├── StatsCards.tsx
│   │   └── TaskManagement.tsx
│   ├── Layout/
│   │   └── Header.tsx
│   └── Modals/              # Modales del sistema
│       ├── NewPatientModal.tsx
│       ├── PatientDetailModal.tsx
│       └── UploadModal.tsx
├── hooks/
│   └── useSupabase.ts       # Hook para operaciones de BD
├── types/
│   └── index.ts             # Definiciones de tipos TypeScript
├── App.tsx                  # Componente principal
├── main.tsx                 # Punto de entrada
└── index.css                # Estilos globales
```

## 🔧 Configuración de Supabase

### Esquema de Base de Datos

El sistema utiliza tres tablas principales:

1. **`patients`** - Información completa de pacientes
2. **`patient_notes`** - Notas y gestiones por paciente  
3. **`alerts`** - Sistema de alertas automáticas

### Políticas de Seguridad

- **Row Level Security (RLS)** habilitado
- **Políticas de acceso** configuradas para usuarios autenticados
- **Índices optimizados** para consultas rápidas

## 🎯 Funcionalidades por Módulo

### Dashboard Operacional
- Métricas de pacientes activos
- Distribución de riesgos
- Tareas críticas pendientes
- Indicadores de rendimiento

### Gestión de Pacientes
- Lista completa con filtros
- Búsqueda por nombre, RUT o diagnóstico
- Filtros por servicio, riesgo y estado
- Panel de alertas en tiempo real

### Coordinación de Equipos
- Creación de tareas
- Asignación por roles
- Seguimiento de progreso
- Alertas de vencimiento

### Predicción de Riesgo Social
- Evaluación automática de factores
- Scoring inteligente
- Recomendaciones personalizadas
- Clasificación por niveles de riesgo

## 🔍 Uso del Sistema

### Navegación Principal

El sistema cuenta con 4 vistas principales accesibles desde la barra de navegación:

1. **Dashboard Operacional** - Vista general del estado del hospital
2. **Gestión de Pacientes** - Administración completa de pacientes
3. **Coordinación de Equipos** - Gestión de tareas multidisciplinarias
4. **Predicción de Riesgo Social** - Evaluación automática de riesgos

### Flujo de Trabajo Típico

1. **Revisar Dashboard** para obtener visión general
2. **Filtrar pacientes** por criterios específicos
3. **Crear tareas** para pacientes de alto riesgo
4. **Revisar predicciones** de riesgo social
5. **Seguir progreso** de tareas asignadas

## 🚨 Sistema de Alertas

El sistema genera alertas automáticas para:

- **Estadías prolongadas** (>10 días)
- **Pacientes de alto riesgo** (nivel rojo)
- **Tareas vencidas** sin completar
- **Factores sociales críticos** identificados

## 📈 Métricas y KPIs

### Indicadores Operacionales
- **Pacientes activos** por servicio
- **Estadía promedio** por diagnóstico
- **Eficiencia diaria** de tareas
- **Distribución de riesgos** global

### Indicadores de Calidad
- **Tiempo de respuesta** a alertas
- **Completitud de tareas** por rol
- **Reducción de estadías** prolongadas
- **Satisfacción del equipo** multidisciplinario

## 🔒 Seguridad y Privacidad

- **Datos sensibles** protegidos con RLS
- **Acceso controlado** por roles de usuario
- **Auditoría completa** de cambios
- **Cumplimiento** con normativas de salud

## 🤝 Contribución

### Para Desarrolladores

1. **Fork** del repositorio
2. **Crear branch** para nueva funcionalidad
3. **Commit** con mensajes descriptivos
4. **Push** al branch
5. **Crear Pull Request**

### Estándares de Código

- **TypeScript** estricto
- **ESLint** para calidad de código
- **Componentes funcionales** con hooks
- **Nomenclatura** en español para el dominio médico

