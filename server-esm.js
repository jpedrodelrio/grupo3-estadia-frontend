#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * Servidor Express para servir datos de pacientes CMBD
 * Convierte datos del CSV a formato JSON para la aplicación React
 * Versión ES Modules compatible
 */

import express from 'express';
import cors from 'cors';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Variables globales para cache
let patientsCache = [];
let gestionEstadiaCache = [];
let lastModified = null;
let serverStartTime = new Date();

// Función para parsear fechas de manera robusta
function parseDate(dateString) {
  if (!dateString || dateString === '') return null;
  
  try {
    // Intentar diferentes formatos de fecha
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/, // DD/MM/YYYY HH:mm
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/ // YYYY-MM-DD
    ];
    
    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        if (format === formats[0]) { // DD/MM/YYYY HH:mm
          const [, day, month, year, hour, minute] = match;
          return new Date(year, month - 1, day, hour, minute).toISOString();
        } else if (format === formats[1]) { // DD/MM/YYYY
          const [, day, month, year] = match;
          return new Date(year, month - 1, day).toISOString();
        } else if (format === formats[2]) { // YYYY-MM-DD
          const [, year, month, day] = match;
          return new Date(year, month - 1, day).toISOString();
        }
      }
    }
    
    // Si no coincide con ningún formato, intentar parseo directo
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  } catch (error) {
    console.warn(`Error parsing date: ${dateString}`, error.message);
    return null;
  }
}

// Función para convertir datos del CSV al formato esperado por React
function convertCSVToPatientFormat(row) {
  try {
    // Mapear columnas del CSV real a los campos esperados
    const fechaIngreso = parseDate(row['Fecha Ingreso completa']) || new Date().toISOString();
    const fechaEgreso = parseDate(row['Fecha Completa']);
    
    return {
      id: row['﻿Episodio CMBD'] || row['Episodio CMBD'] || Math.random().toString(36).substr(2, 9),
      episodio_cmbd: row['﻿Episodio CMBD'] || row['Episodio CMBD'] || 'Sin episodio',
      nombre: row['Nombre'] || 'Paciente',
      rut: row['RUT'] || '12.345.678-9',
      edad: parseInt(row['Edad en años']) || 0,
      sexo: row['Sexo  (Desc)'] === 'Hombre' ? 'Masculino' : 'Femenino',
      diagnostico: row['Diagnóstico   Principal'] || 'Sin diagnóstico',
      servicio: row['Servicio Ingreso (Descripción)'] || 'Sin servicio',
      fechaIngreso: fechaIngreso,
      fechaEgreso: fechaEgreso,
      estado: 'Vivo', // No hay campo de estado en el CSV original
      riesgo: row['IR Gravedad  (desc)'] || 'Sin riesgo',
      estancia: parseInt(row['Estancia del Episodio']) || 0,
      prevision: row['Prevision (Desc)'] || 'Sin previsión',
      created_at: fechaIngreso,
      updated_at: fechaIngreso
    };
  } catch (error) {
    console.warn(`Error converting row to patient format:`, error.message);
    // Retornar un objeto paciente por defecto en caso de error
    const fechaBase = new Date().toISOString();
    return {
      id: Math.random().toString(36).substr(2, 9),
      nombre: 'Paciente',
      rut: '12.345.678-9',
      edad: 0,
      sexo: 'Masculino',
      diagnostico: 'Sin diagnóstico',
      servicio: 'Sin servicio',
      fechaIngreso: fechaBase,
      fechaEgreso: null,
      estado: 'Vivo',
      riesgo: 'Sin riesgo',
      estancia: 0,
      prevision: 'Sin previsión',
      created_at: fechaBase,
      updated_at: fechaBase
    };
  }
}

// Función para cargar datos del CSV
async function loadPatientsData() {
  return new Promise((resolve, reject) => {
    const patients = [];
    const csvPath = path.join(__dirname, 'GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv');
    
    console.log(`📂 Cargando datos desde: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      reject(new Error(`Archivo CSV no encontrado: ${csvPath}`));
      return;
    }
    
    fs.createReadStream(csvPath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        try {
          const patient = convertCSVToPatientFormat(row);
          patients.push(patient);
        } catch (error) {
          console.warn(`Error procesando fila:`, error.message);
        }
      })
      .on('end', () => {
        console.log(`✅ Datos cargados: ${patients.length} pacientes`);
        resolve(patients);
      })
      .on('error', (error) => {
        console.error(`❌ Error leyendo CSV:`, error);
        reject(error);
      });
  });
}

// Función para cargar datos de gestión de estadía
async function loadGestionEstadiaData() {
  return new Promise((resolve, reject) => {
    const gestionData = [];
    const csvPath = path.join(__dirname, 'Gestion Estadía(Respuestas Formulario).csv');
    
    console.log(`📂 Cargando datos de gestión desde: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      reject(new Error(`Archivo CSV de gestión no encontrado: ${csvPath}`));
      return;
    }
    
    fs.createReadStream(csvPath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        try {
          const gestionItem = {
            episodio: row['﻿Episodio:'] || row['Episodio:'] || '',
            ultimaModificacion: row['﻿Última Modificación'] || row['Última Modificación'] || '',
            gestionSolicitada: row['﻿¿Qué gestión se solicito?'] || row['¿Qué gestión se solicito?'] || '',
            fechaAdmision: row['﻿Fecha admisión'] || row['Fecha admisión'] || '',
            fechaAlta: row['﻿Fecha alta'] || row['Fecha alta'] || '',
            cama: row['﻿CAMA'] || row['CAMA'] || '',
            diagnosticoAdmision: row['﻿Texto libre diagnóstico admisión'] || row['Texto libre diagnóstico admisión'] || '',
            convenio: row['﻿Convenio'] || row['Convenio'] || '',
            nombreAseguradora: row['﻿Nombre de la aseguradora'] || row['Nombre de la aseguradora'] || '',
            valorParcial: row['﻿ Valor parcial '] || row[' Valor parcial '] || '',
            concretado: row['﻿concretado'] || row['concretado'] || '',
            diasHospitalizacion: row['﻿Días Hospitalización'] || row['Días Hospitalización'] || ''
          };
          gestionData.push(gestionItem);
        } catch (error) {
          console.warn(`Error procesando fila de gestión:`, error.message);
        }
      })
      .on('end', () => {
        console.log(`✅ Datos de gestión cargados: ${gestionData.length} registros`);
        resolve(gestionData);
      })
      .on('error', (error) => {
        console.error(`❌ Error leyendo CSV de gestión:`, error);
        reject(error);
      });
  });
}

// Función para inicializar datos
async function initializeData() {
  try {
    console.log('🔄 Inicializando datos...');
    patientsCache = await loadPatientsData();
    gestionEstadiaCache = await loadGestionEstadiaData();
    lastModified = new Date();
    console.log(`✅ Datos inicializados: ${patientsCache.length} pacientes, ${gestionEstadiaCache.length} registros de gestión`);
  } catch (error) {
    console.error('❌ Error inicializando datos:', error);
    patientsCache = [];
    gestionEstadiaCache = [];
  }
}

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    patientsLoaded: patientsCache.length,
    lastModified: lastModified,
    uptime: (new Date() - serverStartTime) / 1000
  });
});

// Endpoint para obtener pacientes con filtros y paginación
app.get('/api/patients', (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      service = '',
      risk = '',
      status = '',
      ageMin = '',
      ageMax = ''
    } = req.query;

    let filteredPatients = [...patientsCache];

    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPatients = filteredPatients.filter(patient =>
        patient.nombre.toLowerCase().includes(searchLower) ||
        patient.rut.toLowerCase().includes(searchLower) ||
        patient.diagnostico.toLowerCase().includes(searchLower)
      );
    }

    if (service) {
      filteredPatients = filteredPatients.filter(patient =>
        patient.servicio.toLowerCase().includes(service.toLowerCase())
      );
    }

    if (risk) {
      filteredPatients = filteredPatients.filter(patient =>
        patient.riesgo.toLowerCase().includes(risk.toLowerCase())
      );
    }

    if (status) {
      filteredPatients = filteredPatients.filter(patient =>
        patient.estado.toLowerCase().includes(status.toLowerCase())
      );
    }

    if (ageMin) {
      filteredPatients = filteredPatients.filter(patient =>
        patient.edad >= parseInt(ageMin)
      );
    }

    if (ageMax) {
      filteredPatients = filteredPatients.filter(patient =>
        patient.edad <= parseInt(ageMax)
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
      totalPages: Math.ceil(filteredPatients.length / parseInt(limit))
    });
  } catch (error) {
    console.error('Error en /api/patients:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener estadísticas
app.get('/api/stats', (req, res) => {
  try {
    const total = patientsCache.length;
    const hombres = patientsCache.filter(p => p.sexo === 'Masculino').length;
    const mujeres = patientsCache.filter(p => p.sexo === 'Femenino').length;
    const vivos = patientsCache.filter(p => p.estado === 'Vivo').length;
    const fallecidos = patientsCache.filter(p => p.estado === 'Fallecido').length;
    
    const edades = patientsCache.map(p => p.edad).filter(edad => edad > 0);
    const edadPromedio = edades.length > 0 ? edades.reduce((a, b) => a + b, 0) / edades.length : 0;
    
    const estancias = patientsCache.map(p => p.estancia).filter(estancia => estancia > 0);
    const estanciaPromedio = estancias.length > 0 ? estancias.reduce((a, b) => a + b, 0) / estancias.length : 0;

    res.json({
      total,
      hombres,
      mujeres,
      vivos,
      fallecidos,
      edadPromedio: Math.round(edadPromedio * 10) / 10,
      estanciaPromedio: Math.round(estanciaPromedio * 10) / 10,
      serviciosUnicos: [...new Set(patientsCache.map(p => p.servicio))].length,
      diagnosticosUnicos: [...new Set(patientsCache.map(p => p.diagnostico))].length
    });
  } catch (error) {
    console.error('Error en /api/stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener servicios únicos
app.get('/api/services', (req, res) => {
  try {
    const services = [...new Set(patientsCache.map(p => p.servicio))].sort();
    res.json(services);
  } catch (error) {
    console.error('Error en /api/services:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para recargar datos
app.post('/api/reload', async (req, res) => {
  try {
    console.log('🔄 Recargando datos...');
    await initializeData();
    res.json({ 
      message: 'Datos recargados exitosamente',
      patientsLoaded: patientsCache.length,
      lastModified: lastModified
    });
  } catch (error) {
    console.error('Error recargando datos:', error);
    res.status(500).json({ error: 'Error recargando datos' });
  }
});

// Endpoint para obtener episodios de gestión por paciente
app.get('/api/patient/:episodioCmbd/gestion', (req, res) => {
  try {
    const { episodioCmbd } = req.params;
    
    if (!episodioCmbd) {
      return res.status(400).json({ error: 'Episodio CMBD es requerido' });
    }
    
    // Buscar todos los registros de gestión que coincidan con el episodio CMBD
    const episodiosGestion = gestionEstadiaCache.filter(item => 
      item.episodio === episodioCmbd
    );
    
    res.json({
      episodioCmbd,
      total: episodiosGestion.length,
      episodios: episodiosGestion
    });
  } catch (error) {
    console.error('Error en /api/patient/:episodioCmbd/gestion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para recibir archivos CSV
app.post('/api/upload-csv', (req, res) => {
  try {
    const { csvData, filename } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ error: 'Datos CSV son requeridos' });
    }
    
    // Generar nombre de archivo único
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilename = filename ? `${filename}_${timestamp}.csv` : `uploaded_data_${timestamp}.csv`;
    const csvPath = path.join(__dirname, csvFilename);
    
    // Escribir el archivo CSV
    fs.writeFileSync(csvPath, csvData, 'utf8');
    
    console.log(`📁 Archivo CSV guardado: ${csvFilename}`);
    
    res.json({
      success: true,
      filename: csvFilename,
      path: csvPath,
      message: 'Archivo CSV guardado exitosamente'
    });
    
  } catch (error) {
    console.error('Error guardando CSV:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint proxy para enviar CSV al backend real (evita CORS)
app.post('/api/proxy-upload-csv', async (req, res) => {
  try {
    const { csvData, filename } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ error: 'Datos CSV son requeridos' });
    }
    
    // Crear FormData para enviar al backend real
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    
    // Crear un buffer del CSV
    const csvBuffer = Buffer.from(csvData, 'utf8');
    formData.append('file', csvBuffer, {
      filename: `${filename || 'datos'}.csv`,
      contentType: 'text/csv'
    });
    
    // Enviar al backend real
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://18.216.167.127/gestion/ingest/csv', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.text();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Error del backend: ${result}`,
        status: response.status 
      });
    }
    
    // Intentar parsear como JSON, si falla devolver como texto
    try {
      const jsonResult = JSON.parse(result);
      res.json(jsonResult);
    } catch {
      res.json({ 
        success: true, 
        message: 'CSV enviado exitosamente',
        response: result 
      });
    }
    
  } catch (error) {
    console.error('Error en proxy upload:', error);
    res.status(500).json({ error: 'Error interno del servidor proxy' });
  }
});

// Inicializar datos al arrancar el servidor
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
    console.log(`📊 API disponible en: http://localhost:${PORT}/api`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  });
}).catch(error => {
  console.error('❌ Error al inicializar el servidor:', error);
  process.exit(1);
});
