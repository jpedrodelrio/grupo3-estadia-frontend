/**
 * Servicio para conversión y manejo de datos de pacientes
 * Separa la lógica de negocio del componente principal
 */

import { Patient, PersonaResumen } from '../types';

export class PatientService {
  /**
   * Convierte una PersonaResumen del endpoint a un Patient del sistema
   */
  static convertPersonaToPatient(persona: PersonaResumen): Patient {
    const fechaNacimiento = new Date(persona.fecha_de_nacimiento);
    const hoy = new Date();
    const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    
    // Calcular fecha de ingreso y alta estimada
    // La fecha viene en formato 'YYYY-MM-DD' desde la base de datos
    // Mantener el formato original para evitar problemas de zona horaria
    let fechaIngresoISO: string;
    let fechaAdmisionDate: Date;
    
    if (persona.fecha_admision) {
      // Si la fecha viene en formato 'YYYY-MM-DD', crear Date en UTC para evitar problemas de zona horaria
      const fechaParts = persona.fecha_admision.split('-');
      if (fechaParts.length === 3) {
        // Crear fecha en UTC para evitar cambios por zona horaria
        fechaAdmisionDate = new Date(Date.UTC(
          parseInt(fechaParts[0]), // año
          parseInt(fechaParts[1]) - 1, // mes (0-indexed)
          parseInt(fechaParts[2]) // día
        ));
        // Mantener el formato original 'YYYY-MM-DD' para fecha_ingreso
        fechaIngresoISO = persona.fecha_admision;
      } else {
        fechaAdmisionDate = new Date(persona.fecha_admision);
        fechaIngresoISO = fechaAdmisionDate.toISOString().split('T')[0];
      }
    } else {
      fechaAdmisionDate = new Date();
      fechaIngresoISO = fechaAdmisionDate.toISOString().split('T')[0];
    }
    
    const fechaAlta = persona.fecha_alta ? new Date(persona.fecha_alta) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Determinar estado basado en fecha de alta
    const estado = persona.fecha_alta ? 'dado_alta' : 'activo';
    
    // Calcular días de hospitalización
    const diasHospitalizacion = persona.dias_hospitalizacion || 
      Math.ceil((hoy.getTime() - fechaAdmisionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      episodio: persona.episodio,
      id: persona.episodio,
      rut: persona.rut,
      nombre: persona.nombre.split(' ')[0] || persona.nombre,
      apellido_paterno: persona.nombre.split(' ')[1] || '',
      apellido_materno: persona.nombre.split(' ')[2] || '',
      edad: edad,
      fecha_de_nacimiento: persona.fecha_de_nacimiento,
      sexo: this.mapSexo(persona.sexo),
      convenio: persona.convenio || '-',
      nombre_de_la_aseguradora: persona.nombre_de_la_aseguradora || '-',
      ultima_cama: persona.ultima_cama,
      fecha_ingreso: fechaIngresoISO,
      fecha_estimada_alta: fechaAlta.toISOString(),
      dias_hospitalizacion: diasHospitalizacion,
      valor_parcial_estadia: persona.valor_parcial || '-',
      tipo_cuenta_1: persona.tipo_cuenta_1 || null,
      tipo_cuenta_2: persona.tipo_cuenta_2 || null,
      tipo_cuenta_3: persona.tipo_cuenta_3 || null,
      diagnostico_principal: this.getDiagnostico(diasHospitalizacion),
      riesgo_social: 'medio',
      riesgo_clinico: 'medio',
      riesgo_administrativo: 'bajo',
      nivel_riesgo_global: this.calculateRiskLevel(diasHospitalizacion),
      estado: estado,
      prevision: persona.convenio !== '#N/D' ? persona.convenio || '-' : 'FONASA',
      created_at: fechaAdmisionDate.toISOString(),
      updated_at: hoy.toISOString(),
    };
  }

  /**
   * Convierte múltiples PersonaResumen a Patient[]
   */
  static convertPersonasToPatients(personas: PersonaResumen[]): Patient[] {
    return personas.map(persona => this.convertPersonaToPatient(persona));
  }

  /**
   * Mapea el sexo del endpoint al formato del sistema
   */
  private static mapSexo(sexo: string): 'M' | 'F' {
    if (sexo === 'Masculino') return 'M';
    if (sexo === 'Femenino') return 'F';
    return 'M'; // Default
  }

  /**
   * Determina el servicio clínico basado en el convenio
   */
  private static getServicioClinico(convenio: string): string {
    if (convenio.includes('CAEC')) return 'Medicina Interna';
    if (convenio.includes('GRD')) return 'Especialidades';
    if (convenio.includes('FONASA')) return 'Servicio General';
    if (convenio.includes('ISAPRE')) return 'Servicio Privado';
    return 'Servicio General';
  }

  /**
   * Genera diagnóstico contextual basado en días de hospitalización
   */
  private static getDiagnostico(dias: number): string {
    if (dias > 30) return 'Estadía prolongada - Evaluación multidisciplinaria';
    if (dias > 15) return 'Estadía extendida - Seguimiento especializado';
    if (dias > 7) return 'Estadía moderada - Control regular';
    return 'Estadía corta - Evaluación inicial';
  }

  /**
   * Calcula el nivel de riesgo global basado en días de hospitalización
   */
  private static calculateRiskLevel(diasHospitalizacion: number): 'verde' | 'amarillo' | 'rojo' {
    if (diasHospitalizacion > 15) return 'rojo';
    if (diasHospitalizacion > 7) return 'amarillo';
    return 'verde';
  }

  /**
   * Valida si un paciente está activo
   */
  static isPatientActive(patient: Patient): boolean {
    return patient.estado === 'activo';
  }

  /**
   * Obtiene pacientes por nivel de riesgo
   */
  static getPatientsByRiskLevel(patients: Patient[], level: 'verde' | 'amarillo' | 'rojo'): Patient[] {
    return patients.filter(patient => patient.nivel_riesgo_global === level);
  }

  /**
   * Calcula estadísticas de pacientes
   */
  static calculatePatientStats(patients: Patient[]) {
    const total = patients.length;
    const activos = patients.filter(p => p.estado === 'activo').length;
    const dadosAlta = patients.filter(p => p.estado === 'dado_alta').length;
    const altaPendiente = patients.filter(p => p.estado === 'alta_pendiente').length;
    
    const riesgoVerde = patients.filter(p => p.nivel_riesgo_global === 'verde').length;
    const riesgoAmarillo = patients.filter(p => p.nivel_riesgo_global === 'amarillo').length;
    const riesgoRojo = patients.filter(p => p.nivel_riesgo_global === 'rojo').length;

    return {
      total,
      activos,
      dadosAlta,
      altaPendiente,
      riesgoVerde,
      riesgoAmarillo,
      riesgoRojo,
    };
  }
}
