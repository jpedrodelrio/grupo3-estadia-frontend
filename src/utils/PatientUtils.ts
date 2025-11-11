/**
 * Utilidades para cálculos y formateo de datos de pacientes
 */

import { Patient } from '../types';

export class PatientUtils {
  /**
   * Calcula la edad exacta en años
   */
  static calculateAge(fechaNacimiento: string): number {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  /**
   * Calcula días entre dos fechas
   */
  static calculateDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calcula días hasta una fecha futura
   */
  static calculateDaysUntil(futureDate: string): number {
    const hoy = new Date();
    const fecha = new Date(futureDate);
    const diffTime = fecha.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Formatea fecha para mostrar
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /**
   * Formatea fecha y hora para mostrar
   */
  static formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Obtiene el color CSS para el nivel de riesgo
   */
  static getRiskColor(riskLevel: 'verde' | 'amarillo' | 'rojo'): string {
    switch (riskLevel) {
      case 'verde':
        return 'bg-green-100 text-green-800';
      case 'amarillo':
        return 'bg-yellow-100 text-yellow-800';
      case 'rojo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtiene el color CSS para el estado del paciente
   */
  static getStatusColor(status: 'activo' | 'alta_pendiente' | 'dado_alta'): string {
    switch (status) {
      case 'activo':
        return 'bg-blue-100 text-blue-800';
      case 'alta_pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'dado_alta':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Valida si un RUT es válido (formato chileno)
   */
  static validateRUT(rut: string): boolean {
    // Remover puntos y guión
    const cleanRUT = rut.replace(/[.-]/g, '');
    
    if (cleanRUT.length < 8 || cleanRUT.length > 9) return false;
    
    const body = cleanRUT.slice(0, -1);
    const dv = cleanRUT.slice(-1).toUpperCase();
    
    // Validar dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const calculatedDV = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString();
    
    return dv === calculatedDV;
  }

  /**
   * Formatea RUT con puntos y guión
   */
  static formatRUT(rut: string): string {
    const cleanRUT = rut.replace(/[.-]/g, '');
    if (cleanRUT.length < 8) return rut;
    
    const body = cleanRUT.slice(0, -1);
    const dv = cleanRUT.slice(-1);
    
    // Agregar puntos cada 3 dígitos desde la derecha
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${formattedBody}-${dv}`;
  }

  /**
   * Genera resumen de estadía del paciente
   */
  static generateStaySummary(patient: Patient): string {
    const dias = patient.dias_hospitalizacion;
    const estado = patient.estado;
    
    if (estado === 'dado_alta') {
      return `Alta completada después de ${dias} días`;
    }
    
    if (estado === 'alta_pendiente') {
      return `Alta pendiente - ${dias} días hospitalizado`;
    }
    
    if (dias > 30) {
      return `Estadía prolongada - ${dias} días (requiere revisión)`;
    }
    
    if (dias > 15) {
      return `Estadía extendida - ${dias} días`;
    }
    
    return `Estadía normal - ${dias} días`;
  }
}
