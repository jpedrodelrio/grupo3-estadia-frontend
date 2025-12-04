/**
 * Servicio para exportar datos a Excel
 * Separa la lógica de exportación del componente principal
 */

import * as XLSX from 'xlsx';
import { Patient } from '../types';
import { RegistroGestion } from '../types';
import { GestionService } from './GestionService';

export class ExcelExportService {
  /**
   * Formatea una fecha para mostrar en Excel
   */
  private static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Formatea el texto del riesgo para mostrar
   * Maneja valores como "bajo", "medio", "alto", "#N/D", null, undefined
   */
  private static formatRiskLabel(risk: string | null | undefined): string {
    if (!risk || risk === '#N/D' || (typeof risk === 'string' && risk.trim() === '')) {
      return 'No especificado';
    }
    const riskLower = typeof risk === 'string' ? risk.toLowerCase().trim() : '';
    switch (riskLower) {
      case 'bajo': return 'Bajo';
      case 'medio': return 'Medio';
      case 'alto': return 'Alto';
      default: return typeof risk === 'string' ? risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase() : 'No especificado';
    }
  }

  /**
   * Genera los datos de la hoja de información del paciente
   */
  private static generatePacienteData(patient: Patient): any[][] {
    return [
      ['INFORMACIÓN DEL PACIENTE', ''],
      ['RUT', patient.rut || ''],
      ['Nombre', patient.nombre || ''],
      ['Apellido Paterno', patient.apellido_paterno || ''],
      ['Apellido Materno', patient.apellido_materno || ''],
      ['Fecha de Nacimiento', patient.fecha_de_nacimiento ? this.formatDate(patient.fecha_de_nacimiento) : ''],
      ['Edad', patient.edad ? `${patient.edad} años` : ''],
      ['Sexo', patient.sexo === 'M' ? 'Masculino' : 'Femenino'],
      ['Episodio', patient.episodio || ''],
      ['', ''],
      ['ESTADÍA HOSPITALARIA', ''],
      ['Cama', patient.ultima_cama || ''],
      ['Fecha de Ingreso', patient.fecha_ingreso ? this.formatDate(patient.fecha_ingreso) : ''],
      ['Días Hospitalizado', patient.dias_hospitalizacion ? `${patient.dias_hospitalizacion} días` : ''],
      ['Alta Estimada', patient.fecha_estimada_alta ? this.formatDate(patient.fecha_estimada_alta) : ''],
      ['Valor Parcial Estadia', patient.valor_parcial_estadia || ''],
      ['Código GRD', patient.grd_code || ''],
      ['Probabilidad de Sobre-Estadía', patient.prob_sobre_estadia !== null && patient.prob_sobre_estadia !== undefined 
        ? `${(patient.prob_sobre_estadia * 100).toFixed(1)}%` 
        : 'No disponible'],
      ['', ''],
      ['INFORMACIÓN FINANCIERA', ''],
      ['Convenio-Isapre', patient.convenio || ''],
      ['Isapre', patient.nombre_de_la_aseguradora || ''],
      ['Tipo Cuenta 1', patient.tipo_cuenta_1 || ''],
      ['Tipo Cuenta 2', patient.tipo_cuenta_2 || ''],
      ['Tipo Cuenta 3', patient.tipo_cuenta_3 || ''],
      ['', ''],
      ['EVALUACIÓN DE RIESGOS', ''],
      ['Riesgo Social', this.formatRiskLabel(patient.riesgo_social)],
      ['Riesgo Clínico', this.formatRiskLabel(patient.riesgo_clinico)],
      ['Riesgo Administrativo', this.formatRiskLabel(patient.riesgo_administrativo)],
      ['Nivel Riesgo Global', patient.nivel_riesgo_global ? 
        (patient.nivel_riesgo_global === 'rojo' || patient.nivel_riesgo_global?.toLowerCase() === 'rojo' ? 'Alto' : 
         patient.nivel_riesgo_global === 'amarillo' || patient.nivel_riesgo_global?.toLowerCase() === 'amarillo' ? 'Medio' : 
         patient.nivel_riesgo_global === 'verde' || patient.nivel_riesgo_global?.toLowerCase() === 'verde' ? 'Bajo' : 
         this.formatRiskLabel(patient.nivel_riesgo_global)) : ''],
      ['', ''],
      ['Diagnóstico Principal', patient.diagnostico_principal || ''],
    ];
  }

  /**
   * Genera los datos de la hoja de gestiones
   */
  private static generateGestionesData(gestiones: RegistroGestion[]): any[] {
    return gestiones.map(gestion => {
      const fechaInicio = gestion.fecha_inicio || gestion.marca_temporal;
      const fechaHora = GestionService.formatFechaHora(fechaInicio, gestion.hora_inicio);
      const fechaFinalizacion = GestionService.formatFechaHora(
        gestion.fecha_de_finalizacion, 
        gestion.hora_de_finalizacion
      );

      return {
        'Marca Temporal': gestion.marca_temporal || '',
        'Última Modificación': gestion.ultima_modificacion || '',
        'Tipo de Gestión': gestion.que_gestion_se_solicito || '',
        'Fecha Inicio': gestion.fecha_inicio || '',
        'Hora Inicio': gestion.hora_inicio || '',
        'Fecha y Hora Inicio': fechaHora,
        'Cama': gestion.cama || '',
        'Diagnóstico Admisión': gestion.texto_libre_diagnostico_admision || '',
        'Diagnóstico Transferencia': gestion.diagnostico_transfer || '',
        'Concretado': gestion.concretado || '',
        'Estado': gestion.estado || '',
        'Fecha Finalización': gestion.fecha_de_finalizacion || '',
        'Hora Finalización': gestion.hora_de_finalizacion || '',
        'Fecha y Hora Finalización': fechaFinalizacion !== '-' ? fechaFinalizacion : '',
        'Tipo de Traslado': gestion.tipo_de_traslado || '',
        'Centro Destinatario': gestion.centro_de_destinatario || '',
        'Nivel de Atención': gestion.nivel_de_atencion || '',
        'Servicio/Especialidad': gestion.servicio_especialidad || '',
        'Motivo de Cancelación': gestion.motivo_de_cancelacion || '',
        'Motivo de Rechazo': gestion.motivo_de_rechazo || '',
        'Causa Devolución/Rechazo': gestion.causa_devolucion_rechazo || '',
        'Texto Libre Causa Rechazo': gestion.texto_libre_causa_rechazo || '',
        'Solicitud de Traslado': gestion.solicitud_de_traslado || '',
        'Días Solicitados Homecare': gestion.dias_solicitados_homecare || '',
        'Status': gestion.status || '',
        'Mes': gestion.mes || '',
        'Año': gestion.ano || '',
      };
    });
  }

  /**
   * Genera el nombre del archivo Excel
   */
  private static generateFileName(patient: Patient): string {
    const nombrePaciente = `${patient.nombre}_${patient.apellido_paterno}`.replace(/\s+/g, '_');
    const fechaHoy = new Date().toISOString().split('T')[0];
    return `Paciente_${nombrePaciente}_Episodio_${patient.episodio}_${fechaHoy}.xlsx`;
  }

  /**
   * Exporta la información del paciente y sus gestiones a un archivo Excel
   * @param patient - Información del paciente
   * @param gestiones - Lista de gestiones del episodio
   * @throws Error si no hay gestiones para exportar o si ocurre un error al generar el archivo
   */
  static exportPatientAndGestiones(patient: Patient, gestiones: RegistroGestion[]): void {
    if (!patient) {
      throw new Error('No hay información del paciente disponible');
    }

    if (gestiones.length === 0) {
      throw new Error('No hay gestiones para exportar');
    }

    try {
      // Crear workbook
      const workbook = XLSX.utils.book_new();

      // Hoja 1: Información del Paciente
      const pacienteData = this.generatePacienteData(patient);
      const pacienteSheet = XLSX.utils.aoa_to_sheet(pacienteData);
      XLSX.utils.book_append_sheet(workbook, pacienteSheet, 'Información Paciente');

      // Hoja 2: Gestiones del Episodio
      const gestionesData = this.generateGestionesData(gestiones);
      const gestionesSheet = XLSX.utils.json_to_sheet(gestionesData);
      XLSX.utils.book_append_sheet(workbook, gestionesSheet, 'Gestiones');

      // Generar nombre del archivo
      const fileName = this.generateFileName(patient);

      // Descargar archivo
      XLSX.writeFile(workbook, fileName);
      
      console.log('✅ Excel descargado exitosamente:', fileName);
    } catch (error) {
      console.error('Error al generar Excel:', error);
      throw new Error('Error al generar el archivo Excel. Por favor, intente nuevamente.');
    }
  }
}

