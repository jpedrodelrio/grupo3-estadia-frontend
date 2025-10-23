#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * Servidor Express para servir datos de pacientes CMBD
 * Convierte datos del CSV a formato JSON para la aplicación React
 */

const express = require('express');
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Cache para los datos de pacientes
let patientsCache = [];
let lastModified = null;

// Función para convertir datos del CSV al formato de la aplicación React
function convertCSVToPatientFormat(csvData) {
  return csvData.map((row, index) => {
    try {
    // Calcular días de hospitalización basado en fechas
    const fechaIngresoStr = row.fecha_ingreso || row['Fecha Ingreso completa'];
    const fechaEgresoStr = row.fecha_egreso || row['Fecha Completa'];
    
    let fechaIngreso = null;
    let fechaEgreso = null;
    
    // Función helper para parsear fechas de forma segura
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr.trim() === '') return null;
      
      // Intentar diferentes formatos de fecha
      const formats = [
        // Formato DD/MM/YYYY HH:mm
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/,
        // Formato DD/MM/YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        // Formato YYYY-MM-DD
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
      ];
      
      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          if (format === formats[0]) { // DD/MM/YYYY HH:mm
            const [, day, month, year, hour, minute] = match;
            const date = new Date(year, month - 1, day, hour, minute);
            return isNaN(date.getTime()) ? null : date;
          } else if (format === formats[1]) { // DD/MM/YYYY
            const [, day, month, year] = match;
            const date = new Date(year, month - 1, day);
            return isNaN(date.getTime()) ? null : date;
          } else if (format === formats[2]) { // YYYY-MM-DD
            const [, year, month, day] = match;
            const date = new Date(year, month - 1, day);
            return isNaN(date.getTime()) ? null : date;
          }
        }
      }
      
      // Intentar parseo directo como último recurso
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };
    
    fechaIngreso = parseDate(fechaIngresoStr);
    fechaEgreso = parseDate(fechaEgresoStr);
    
    const hoy = new Date();
    
    let diasHospitalizacion = 0;
    let fechaEstimadaAlta = '';
    
    // Usar fecha actual si no hay fecha válida
    const fechaBase = fechaIngreso || hoy;
    
    if (fechaIngreso && !isNaN(fechaIngreso.getTime())) {
      if (fechaEgreso && !isNaN(fechaEgreso.getTime())) {
        // Paciente ya dado de alta
        diasHospitalizacion = Math.ceil((fechaEgreso - fechaIngreso) / (1000 * 60 * 60 * 24));
        fechaEstimadaAlta = fechaEgreso.toISOString();
      } else {
        // Paciente aún hospitalizado
        diasHospitalizacion = Math.ceil((hoy - fechaIngreso) / (1000 * 60 * 60 * 24));
        // Estimar alta basada en estancia promedio del servicio
        const estanciaPromedio = parseInt(row['Estancia del Episodio']) || 7;
        const fechaEstimada = new Date(fechaIngreso);
        fechaEstimada.setDate(fechaEstimada.getDate() + estanciaPromedio);
        fechaEstimadaAlta = fechaEstimada.toISOString();
      }
    } else {
      // Si no hay fecha de ingreso válida, usar fecha actual
      diasHospitalizacion = 0;
      fechaEstimadaAlta = fechaBase.toISOString();
    }

    // Determinar nivel de riesgo basado en información GRD
    let nivelRiesgoGlobal = 'verde';
    const irGravedad = row['IR Gravedad  (desc)'] || '';
    const irMortalidad = row['IR Mortalidad  (desc)'] || '';
    const estanciaInlierOutlier = row['Estancia Inlier / Outlier'] || '';
    
    if (irGravedad.toLowerCase().includes('mayor') || irMortalidad.toLowerCase().includes('mayor')) {
      nivelRiesgoGlobal = 'rojo';
    } else if (irGravedad.toLowerCase().includes('moderada') || irMortalidad.toLowerCase().includes('moderada') || 
               estanciaInlierOutlier.toLowerCase().includes('outlier')) {
      nivelRiesgoGlobal = 'amarillo';
    }

    // Determinar estado del paciente
    let estado = 'activo';
    if (fechaEgreso && !isNaN(fechaEgreso.getTime())) {
      estado = 'dado_alta';
    } else if (diasHospitalizacion > 14) {
      estado = 'alta_pendiente';
    }

    // Extraer nombre completo
    const nombreCompleto = row.nombre || row['Nombre'] || '';
    const partesNombre = nombreCompleto.split(' ');
    const nombre = partesNombre[0] || '';
    const apellidoPaterno = partesNombre[1] || '';
    const apellidoMaterno = partesNombre.slice(2).join(' ') || '';

    return {
      id: row['Episodio CMBD'] || `episodio_${index}`,
      rut: row.rut || row['RUT'] || '',
      nombre: nombre,
      apellido_paterno: apellidoPaterno,
      apellido_materno: apellidoMaterno,
      edad: parseInt(row['Edad en años']) || 0,
      sexo: (row['Sexo  (Desc)'] || '').toLowerCase().includes('hombre') ? 'M' : 'F',
      servicio_clinico: row['Servicio Ingreso (Descripción)'] || '',
        fecha_ingreso: fechaBase.toISOString(),
      fecha_estimada_alta: fechaEstimadaAlta,
      dias_hospitalizacion: diasHospitalizacion,
      diagnostico_principal: row['Diagnóstico   Principal'] || '',
      riesgo_social: 'medio', // Valor por defecto, se puede calcular después
      riesgo_clinico: irGravedad.toLowerCase().includes('mayor') ? 'alto' : 
                     irGravedad.toLowerCase().includes('moderada') ? 'medio' : 'bajo',
      riesgo_administrativo: 'bajo', // Valor por defecto
      nivel_riesgo_global: nivelRiesgoGlobal,
      estado: estado,
      prevision: row['Prevision (Desc)'] || '',
        created_at: fechaBase.toISOString(),
      updated_at: new Date().toISOString(),
      // Datos adicionales del CMBD
      episodio_cmbd: row['Episodio CMBD'] || '',
      especialidad: row['Especialidad médica de la intervención (des)'] || '',
      tipo_ingreso: row['Tipo Ingreso (Descripción)'] || '',
      peso_grd: row['Peso GRD Medio (Todos)'] || '',
      estancia_norma: row['Estancia Norma GRD '] || '',
      impacto_estancias: row['Impacto (Estancias evitables) Brutas'] || '',
      estancia_inlier_outlier: estanciaInlierOutlier,
      procedimiento_principal: row['Proced 01 Principal    (cod)'] || '',
      año: row['Año'] || '',
      mes: row['Mes (Número)'] || ''
    };
    
    } catch (error) {
      console.warn(`Error procesando fila ${index}:`, error.message);
      // Retornar un paciente por defecto en caso de error
      return {
        id: `error_${index}`,
        rut: '',
        nombre: 'Error',
        apellido_paterno: 'Datos',
        apellido_materno: '',
        edad: 0,
        sexo: 'M',
        servicio_clinico: 'Error',
        fecha_ingreso: new Date().toISOString(),
        fecha_estimada_alta: new Date().toISOString(),
        dias_hospitalizacion: 0,
        diagnostico_principal: 'Error en datos',
        riesgo_social: 'medio',
        riesgo_clinico: 'bajo',
        riesgo_administrativo: 'bajo',
        nivel_riesgo_global: 'verde',
        estado: 'activo',
        prevision: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        episodio_cmbd: '',
        especialidad: '',
        tipo_ingreso: '',
        peso_grd: '',
        estancia_norma: '',
        impacto_estancias: '',
        estancia_inlier_outlier: '',
        procedimiento_principal: '',
        año: '',
        mes: ''
      };
    }
  });
}

// Función para cargar datos del CSV
function loadPatientsData() {
  return new Promise((resolve, reject) => {
    const csvFile = path.join(__dirname, 'GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv');
    
    if (!fs.existsSync(csvFile)) {
      reject(new Error(`Archivo CSV no encontrado: ${csvFile}`));
      return;
    }

    const results = [];
    fs.createReadStream(csvFile, { encoding: 'utf-8' })
      .pipe(csv({ separator: ';' }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`✅ Cargados ${results.length} registros del CSV`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('❌ Error leyendo CSV:', error);
        reject(error);
      });
  });
}

// Cargar datos al iniciar el servidor
async function initializeData() {
  try {
    console.log('🔄 Cargando datos de pacientes...');
    const csvData = await loadPatientsData();
    patientsCache = convertCSVToPatientFormat(csvData);
    lastModified = new Date();
    console.log(`✅ ${patientsCache.length} pacientes cargados exitosamente`);
  } catch (error) {
    console.error('❌ Error inicializando datos:', error);
  }
}

// Rutas de la API

// Obtener todos los pacientes
app.get('/api/patients', (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      service = '', 
      risk = '', 
      status = '',
      age_min = '',
      age_max = ''
    } = req.query;

    let filteredPatients = [...patientsCache];

    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPatients = filteredPatients.filter(patient =>
        patient.nombre.toLowerCase().includes(searchLower) ||
        patient.apellido_paterno.toLowerCase().includes(searchLower) ||
        patient.apellido_materno.toLowerCase().includes(searchLower) ||
        patient.rut.includes(search) ||
        patient.diagnostico_principal.toLowerCase().includes(searchLower)
      );
    }

    if (service) {
      filteredPatients = filteredPatients.filter(patient => 
        patient.servicio_clinico.toLowerCase().includes(service.toLowerCase())
      );
    }

    if (risk) {
      filteredPatients = filteredPatients.filter(patient => 
        patient.nivel_riesgo_global === risk
      );
    }

    if (status) {
      filteredPatients = filteredPatients.filter(patient => 
        patient.estado === status
      );
    }

    if (age_min) {
      filteredPatients = filteredPatients.filter(patient => 
        patient.edad >= parseInt(age_min)
      );
    }

    if (age_max) {
      filteredPatients = filteredPatients.filter(patient => 
        patient.edad <= parseInt(age_max)
      );
    }

    // Paginación
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

    res.json({
      patients: paginatedPatients,
      total: filteredPatients.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(filteredPatients.length / parseInt(limit)),
      lastModified: lastModified
    });
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener un paciente específico por ID
app.get('/api/patients/:id', (req, res) => {
  try {
    const patient = patientsCache.find(p => p.id === req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json(patient);
  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      total: patientsCache.length,
      activos: patientsCache.filter(p => p.estado === 'activo').length,
      alta_pendiente: patientsCache.filter(p => p.estado === 'alta_pendiente').length,
      dados_alta: patientsCache.filter(p => p.estado === 'dado_alta').length,
      riesgo_verde: patientsCache.filter(p => p.nivel_riesgo_global === 'verde').length,
      riesgo_amarillo: patientsCache.filter(p => p.nivel_riesgo_global === 'amarillo').length,
      riesgo_rojo: patientsCache.filter(p => p.nivel_riesgo_global === 'rojo').length,
      hombres: patientsCache.filter(p => p.sexo === 'M').length,
      mujeres: patientsCache.filter(p => p.sexo === 'F').length,
      servicios_unicos: [...new Set(patientsCache.map(p => p.servicio_clinico))].length,
      edad_promedio: patientsCache.reduce((sum, p) => sum + p.edad, 0) / patientsCache.length,
      estancia_promedio: patientsCache.reduce((sum, p) => sum + p.dias_hospitalizacion, 0) / patientsCache.length
    };
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener servicios únicos
app.get('/api/services', (req, res) => {
  try {
    const services = [...new Set(patientsCache.map(p => p.servicio_clinico))]
      .filter(service => service && service.trim() !== '')
      .sort();
    res.json(services);
  } catch (error) {
    console.error('Error obteniendo servicios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Recargar datos del CSV
app.post('/api/reload', async (req, res) => {
  try {
    console.log('🔄 Recargando datos...');
    await initializeData();
    res.json({ 
      message: 'Datos recargados exitosamente', 
      count: patientsCache.length,
      lastModified: lastModified
    });
  } catch (error) {
    console.error('Error recargando datos:', error);
    res.status(500).json({ error: 'Error recargando datos' });
  }
});

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    patientsLoaded: patientsCache.length,
    lastModified: lastModified,
    uptime: process.uptime()
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`📊 API disponible en: http://localhost:${PORT}/api`);
  
  // Cargar datos iniciales
  await initializeData();
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
