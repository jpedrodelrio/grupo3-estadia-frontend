/**
 * Servicio para manejo de gestiones de pacientes
 * Separa la lógica de negocio del componente principal
 */

import { RegistroGestion } from '../types';

export class GestionService {
  /**
   * Valida si una gestión fue concretada exitosamente
   */
  static isGestionConcretada(gestion: RegistroGestion): boolean {
    if (!gestion.concretado) return false;
    const concretado = gestion.concretado.toLowerCase();
    return concretado === 'si' || concretado === 'si';
  }

  /**
   * Obtiene el color asociado a una gestión según su estado
   */
  static getGestionColor(gestion: RegistroGestion): string {
    const concretado = this.isGestionConcretada(gestion);
    const estado = gestion.estado?.toLowerCase();

    if (estado === 'completado' || (concretado && estado === null)) {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    
    if (estado === 'cancelado' || gestion.motivo_de_cancelacion) {
      return 'bg-red-100 text-red-800 border-red-300';
    }

    if (gestion.motivo_de_rechazo) {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    }

    return 'bg-gray-100 text-gray-800 border-gray-300';
  }

  /**
   * Obtiene el nombre formateado del tipo de gestión
   */
  static getTipoGestionName(tipo: string | null | undefined): string {
    if (!tipo || typeof tipo !== 'string' || tipo.trim() === '') {
      return 'Sin clasificar';
    }
    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }

  /**
   * Formatea una fecha para display
   */
  static formatFecha(dateString: string | null): string {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Formatea una fecha con hora para display
   */
  static formatFechaHora(fecha: string | null, hora: string | null): string {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      const formato = date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      return hora ? `${formato} ${hora}` : formato;
    } catch {
      return fecha;
    }
  }

  /**
   * Agrupa las gestiones por tipo
   */
  static groupByTipoGestion(gestiones: RegistroGestion[]): Map<string, RegistroGestion[]> {
    const grouped = new Map<string, RegistroGestion[]>();
    
    gestiones.forEach(gestion => {
      const tipo = gestion.que_gestion_se_solicito || 'Sin clasificar';
      if (!grouped.has(tipo)) {
        grouped.set(tipo, []);
      }
      grouped.get(tipo)!.push(gestion);
    });

    return grouped;
  }

  /**
   * Filtra gestiones por tipo
   */
  static filterByTipoGestion(gestiones: RegistroGestion[], tipo: string): RegistroGestion[] {
    return gestiones.filter(g => g.que_gestion_se_solicito === tipo);
  }

  /**
   * Obtiene el diagnóstico en formato legible
   */
  static getDiagnostico(gestion: RegistroGestion): string {
    return gestion.diagnostico_transfer || 
           gestion.texto_libre_diagnostico_admision || 
           'No disponible';
  }

  /**
   * Obtiene información de traslado en formato legible
   */
  static getTrasladoInfo(gestion: RegistroGestion): string {
    // Verificar si hay información de traslado
    const hasTraslado = gestion.tipo_de_traslado || gestion.centro_de_destinatario || gestion.nivel_de_atencion;
    
    if (!hasTraslado) return 'N/A';
    
    const partes = [];
    if (gestion.centro_de_destinatario) partes.push(gestion.centro_de_destinatario);
    if (gestion.tipo_de_traslado) partes.push(gestion.tipo_de_traslado);
    if (gestion.nivel_de_atencion) partes.push(gestion.nivel_de_atencion);
    
    return partes.length > 0 ? partes.join(' • ') : 'N/A';
  }

  /**
   * Obtiene un resumen de la gestión
   */
  static getResumenGestion(gestion: RegistroGestion): string {
    const partes = [];
    
    if (gestion.diagnostico_transfer) {
      partes.push(`Diagnóstico: ${gestion.diagnostico_transfer}`);
    }
    
    if (gestion.centro_de_destinatario) {
      partes.push(`Destino: ${gestion.centro_de_destinatario}`);
    }
    
    if (gestion.motivo_de_cancelacion) {
      partes.push(`Motivo cancelación: ${gestion.motivo_de_cancelacion}`);
    }
    
    if (gestion.motivo_de_rechazo) {
      partes.push(`Motivo rechazo: ${gestion.motivo_de_rechazo}`);
    }

    return partes.length > 0 ? partes.join(' | ') : gestion.texto_libre_causa_rechazo || 'N/A';
  }
}

