/**
 * Servicio para manejo de predicciones de sobre-estadía
 */

import { 
  PrediccionNuevoPacienteInput, 
  PrediccionNuevosPacientesResponse 
} from '../types';
import { apiUrls } from '../config/api';

export class PrediccionService {
  /**
   * Normaliza el sexo a formato Hombre/Mujer
   */
  static normalizeSexo(sexo: string): string {
    const sexoLower = sexo.toLowerCase().trim();
    if (sexoLower === 'm' || sexoLower === 'masculino' || sexoLower === 'hombre') {
      return 'Hombre';
    }
    if (sexoLower === 'f' || sexoLower === 'femenino' || sexoLower === 'mujer') {
      return 'Mujer';
    }
    return sexo; // Si no coincide, devolver el original
  }

  /**
   * Normaliza el riesgo a número (0, 1, 2)
   */
  static normalizeRiesgo(riesgo: number | string): number {
    if (typeof riesgo === 'number') {
      return riesgo;
    }
    const riesgoLower = riesgo.toLowerCase().trim();
    if (riesgoLower === 'bajo' || riesgoLower === '0') {
      return 0;
    }
    if (riesgoLower === 'medio' || riesgoLower === '1') {
      return 1;
    }
    if (riesgoLower === 'alto' || riesgoLower === '2') {
      return 2;
    }
    return 0; // Default
  }

  /**
   * Convierte fecha a días (si es string, calcula días desde hoy)
   */
  static convertFechaEstimadaAlta(fechaEstimada: number | string): number {
    if (typeof fechaEstimada === 'number') {
      return fechaEstimada;
    }
    // Si es string (fecha), intentar parsear y calcular días
    try {
      const fecha = new Date(fechaEstimada);
      const hoy = new Date();
      const diffTime = fecha.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      // Si falla, intentar parsear como número
      const parsed = parseInt(fechaEstimada, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
  }

  /**
   * Normaliza los datos de entrada para el endpoint
   */
  static normalizeInput(input: PrediccionNuevoPacienteInput): PrediccionNuevoPacienteInput {
    return {
      ...input,
      sexo: this.normalizeSexo(input.sexo),
      riesgo_social: this.normalizeRiesgo(input.riesgo_social),
      riesgo_clinico: this.normalizeRiesgo(input.riesgo_clinico),
      riesgo_administrativo: this.normalizeRiesgo(input.riesgo_administrativo),
      fecha_estimada_de_alta: this.convertFechaEstimadaAlta(input.fecha_estimada_de_alta),
    };
  }

  /**
   * Llama al endpoint de predicción
   */
  static async predecirSobreEstadia(
    pacientes: PrediccionNuevoPacienteInput[],
    persist: boolean = true
  ): Promise<PrediccionNuevosPacientesResponse> {
    // Normalizar todos los pacientes
    const pacientesNormalizados = pacientes.map(p => this.normalizeInput(p));

    const url = apiUrls.prediccionNuevosPacientes(persist);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pacientesNormalizados.length === 1 ? pacientesNormalizados[0] : pacientesNormalizados),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en predicción: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: PrediccionNuevosPacientesResponse = await response.json();
    return data;
  }
}

