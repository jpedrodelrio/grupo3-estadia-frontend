import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Plus, FolderOpen, FolderPen, Bed, Hash, Briefcase, CheckCircle, XCircle, Clock, Edit, Save, Trash2, Download } from 'lucide-react';
import { Patient, PatientNote, GestionType, RegistroGestion } from '../../types';
import { useGestiones } from '../../hooks/useGestiones';
import { GestionService } from '../../services/GestionService';
import { ExcelExportService } from '../../services/ExcelExportService';

interface PatientDetailModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'additional'>('details');
  const [notes, setNotes] = useState<PatientNote[]>([]);
  // const [loading, setLoading] = useState(false);
  const [, setLoading] = useState(true);
  const [editandoGestion, setEditandoGestion] = useState<number | null>(null);
  const [gestionEditada, setGestionEditada] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  const [gestionAEliminar, setGestionAEliminar] = useState<{ episodio: string; registroId: string; index: number } | null>(null);
  
  // Nuevos campos para gestión completa
  const [nuevaGestion, setNuevaGestion] = useState({
    que_gestion_se_solicito: '',
    fecha_inicio: '',
    hora_inicio: '',
    cama: '',
    texto_libre_diagnostico_admision: '',
    diagnostico_transfer: '',
    concretado: '',
    estado: '',
    motivo_de_cancelacion: '',
    tipo_de_traslado: '',
    centro_de_destinatario: '',
    nivel_de_atencion: '',
    servicio_especialidad: '',
    fecha_de_finalizacion: '',
    hora_de_finalizacion: '',
  });
  const { 
    gestiones, 
    loading: gestionesLoading, 
    error: gestionesError, 
    fetchGestiones,
    createGestion,
    updateGestion,
    deleteGestion
  } = useGestiones();

  useEffect(() => {
    if (patient && isOpen) {
      // Siempre mostrar la pestaña de Información General al abrir el modal
      setActiveTab('details');
      
      loadNotes();
      // Cargar gestiones del episodio
      if (patient.episodio) {
        fetchGestiones(patient.episodio);
      }
      
      // Prellenar campos con valores por defecto (fecha y hora de Chile)
      const ahora = new Date();
      // Obtener fecha y hora en zona horaria de Chile (America/Santiago)
      const fechaHoraChile = new Date(ahora.toLocaleString('en-CL', { timeZone: 'America/Santiago' }));
      
      // Formato YYYY-MM-DD para input type="date"
      const fechaHoy = fechaHoraChile.toISOString().split('T')[0];
      
      // Formato HH:MM para input type="time" (en hora de Chile)
      const horaActual = fechaHoraChile.toTimeString().slice(0, 5);
      
      setNuevaGestion(prev => ({
        ...prev,
        cama: patient.ultima_cama || prev.cama || '',
        fecha_inicio: prev.fecha_inicio || fechaHoy,
        hora_inicio: prev.hora_inicio || horaActual,
      }));
    }
  }, [patient, isOpen, fetchGestiones]);

  const loadNotes = async () => {
    if (!patient) return;
    setLoading(true);
    // Cargar notas desde localStorage
    try {
      const storedNotes = localStorage.getItem(`notes_${patient.id}`);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
    setLoading(false);
  };

  // Función helper para obtener fecha/hora actual en formato ISO con zona horaria de Chile
  const obtenerFechaChileISO = (): string => {
    const ahora = new Date();
    // Obtener fecha y hora en zona horaria de Chile usando Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('en-CL', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const partes = formatter.formatToParts(ahora);
    const year = partes.find(p => p.type === 'year')?.value;
    const month = partes.find(p => p.type === 'month')?.value;
    const day = partes.find(p => p.type === 'day')?.value;
    const hour = partes.find(p => p.type === 'hour')?.value;
    const minute = partes.find(p => p.type === 'minute')?.value;
    const second = partes.find(p => p.type === 'second')?.value;
    
    // Construir fecha ISO en formato: YYYY-MM-DDTHH:mm:ss.sss
    // El servidor debería interpretar esta fecha como hora local de Chile
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  };

  // Función para validar campos mínimos requeridos
  const validarCamposMinimos = (): { valido: boolean; errores: string[] } => {
    const errores: string[] = [];

    // Validar que el paciente tenga los datos necesarios
    if (!patient) {
      errores.push('No hay información del paciente disponible');
      return { valido: false, errores };
    }

    if (!patient.episodio || patient.episodio.trim() === '') {
      errores.push('El paciente debe tener un episodio asignado');
    }

    if (!patient.nombre || patient.nombre.trim() === '') {
      errores.push('El paciente debe tener un nombre');
    }

    if (!patient.tipo_cuenta_1 || patient.tipo_cuenta_1.trim() === '' || patient.tipo_cuenta_1 === 'No especificado') {
      errores.push('El paciente debe tener un tipo de cuenta asignado');
    }

    // Validar que se haya seleccionado un tipo de gestión
    if (!nuevaGestion.que_gestion_se_solicito || nuevaGestion.que_gestion_se_solicito.trim() === '') {
      errores.push('Debe seleccionar un tipo de gestión');
    }

    // Validar diagnóstico de admisión (obligatorio)
    if (!nuevaGestion.texto_libre_diagnostico_admision || nuevaGestion.texto_libre_diagnostico_admision.trim() === '') {
      errores.push('Debe ingresar un diagnóstico de admisión');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  };

  const handleAddNote = async () => {
    if (!patient) return;

    // Validar campos mínimos requeridos
    const validacion = validarCamposMinimos();
    if (!validacion.valido) {
      alert(`Por favor complete los siguientes campos requeridos:\n\n${validacion.errores.join('\n')}`);
      return;
    }

    try {
      setLoading(true);

      // Función helper para extraer mes y año de una fecha
      const extraerMesYAno = (fecha: string) => {
        try {
          const fechaObj = new Date(fecha);
          const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
          const mes = meses[fechaObj.getMonth()];
          const ano = fechaObj.getFullYear().toString();
          return { mes, ano };
        } catch (error) {
          console.error('Error al extraer mes y año:', error);
          return null;
        }
      };

      // Preparar datos para el endpoint
      const marcaTemporal = obtenerFechaChileISO();
      const nombreCompleto = `${patient.nombre} ${patient.apellido_paterno} ${patient.apellido_materno}`.trim();
      
      // Construir objeto con campos mínimos requeridos
      const gestionData: any = {
        episodio: patient.episodio,
        marca_temporal: marcaTemporal,
        nombre: nombreCompleto,
        tipo_cuenta_1: patient.tipo_cuenta_1 || 'No especificado',
        ultima_modificacion: marcaTemporal,
      };

      // Agregar campos opcionales si tienen valor
      if (nuevaGestion.que_gestion_se_solicito) {
        gestionData.que_gestion_se_solicito = nuevaGestion.que_gestion_se_solicito;
      }
      if (nuevaGestion.fecha_inicio) {
        gestionData.fecha_inicio = nuevaGestion.fecha_inicio;
        // Extraer mes y año de la fecha de inicio
        const mesYAno = extraerMesYAno(nuevaGestion.fecha_inicio);
        if (mesYAno) {
          gestionData.mes = mesYAno.mes;
          gestionData.ano = mesYAno.ano;
        }
      }
      if (nuevaGestion.hora_inicio) {
        gestionData.hora_inicio = nuevaGestion.hora_inicio;
      }
      if (nuevaGestion.cama) {
        gestionData.cama = nuevaGestion.cama;
      } else if (patient.ultima_cama) {
        gestionData.cama = patient.ultima_cama;
      }
      if (nuevaGestion.texto_libre_diagnostico_admision) {
        gestionData.texto_libre_diagnostico_admision = nuevaGestion.texto_libre_diagnostico_admision;
      } else if (patient.diagnostico_principal) {
        gestionData.texto_libre_diagnostico_admision = patient.diagnostico_principal;
      }
      if (nuevaGestion.diagnostico_transfer) {
        gestionData.diagnostico_transfer = nuevaGestion.diagnostico_transfer;
      }
      if (nuevaGestion.concretado) {
        gestionData.concretado = nuevaGestion.concretado.toUpperCase();
      }
      if (nuevaGestion.estado) {
        gestionData.estado = nuevaGestion.estado;
      }
      if (nuevaGestion.motivo_de_cancelacion) {
        gestionData.motivo_de_cancelacion = nuevaGestion.motivo_de_cancelacion;
      }
      if (nuevaGestion.tipo_de_traslado) {
        gestionData.tipo_de_traslado = nuevaGestion.tipo_de_traslado;
      }
      if (nuevaGestion.centro_de_destinatario) {
        gestionData.centro_de_destinatario = nuevaGestion.centro_de_destinatario;
      }
      if (nuevaGestion.nivel_de_atencion) {
        gestionData.nivel_de_atencion = nuevaGestion.nivel_de_atencion;
      }
      if (nuevaGestion.servicio_especialidad) {
        gestionData.servicio_especialidad = nuevaGestion.servicio_especialidad;
      }
      if (nuevaGestion.fecha_de_finalizacion) {
        gestionData.fecha_de_finalizacion = nuevaGestion.fecha_de_finalizacion;
      }
      if (nuevaGestion.hora_de_finalizacion) {
        gestionData.hora_de_finalizacion = nuevaGestion.hora_de_finalizacion;
      }

      // Agregar datos del paciente si están disponibles
      if (patient.rut) {
        gestionData.rut = patient.rut;
        gestionData.run = patient.rut;
      }
      if (patient.fecha_de_nacimiento) {
        gestionData.fecha_de_nacimiento = patient.fecha_de_nacimiento.split('T')[0]; // Solo fecha, sin hora
      }
      if (patient.sexo) {
        gestionData.sexo = patient.sexo === 'M' ? 'Masculino' : 'Femenino';
      }
      if (patient.fecha_ingreso) {
        const fechaAdmision = patient.fecha_ingreso.split('T')[0]; // Solo fecha, sin hora
        gestionData.fecha_admision = fechaAdmision;
        // Extraer mes y año de la fecha de admisión (si no se extrajeron de fecha_inicio)
        if (!gestionData.mes || !gestionData.ano) {
          const mesYAno = extraerMesYAno(fechaAdmision);
          if (mesYAno) {
            gestionData.mes = mesYAno.mes;
            gestionData.ano = mesYAno.ano;
          }
        }
      }
      if (patient.dias_hospitalizacion) {
        gestionData.dias_hospitalizacion = patient.dias_hospitalizacion;
      }
      if (patient.convenio) {
        gestionData.convenio = patient.convenio;
      }
      if (patient.nombre_de_la_aseguradora) {
        gestionData.nombre_de_la_aseguradora = patient.nombre_de_la_aseguradora;
      }
      if (patient.valor_parcial_estadia) {
        gestionData.valor_parcial = patient.valor_parcial_estadia;
      }
      if (patient.tipo_cuenta_2) {
        gestionData.tipo_cuenta_2 = patient.tipo_cuenta_2;
      }
      if (patient.tipo_cuenta_3) {
        gestionData.tipo_cuenta_3 = patient.tipo_cuenta_3;
      }

      // Llamar al endpoint para crear la gestión
      await createGestion(gestionData);

      // Crear nota local para mostrar en el historial (opcional, para mantener compatibilidad)
      const createdNote: PatientNote = {
        id: `note_${Date.now()}`,
        patient_id: patient.id,
        user_name: 'Sistema',
        user_role: 'Gestor de Estadía',
        tipo_gestion: (nuevaGestion.que_gestion_se_solicito.toLowerCase().includes('social') ? 'social' :
                     nuevaGestion.que_gestion_se_solicito.toLowerCase().includes('clínica') ? 'clinica' :
                     nuevaGestion.que_gestion_se_solicito.toLowerCase().includes('administrativa') ? 'administrativa' : 
                     'general') as GestionType,
        nota: JSON.stringify(gestionData),
        fecha_gestion: marcaTemporal,
        created_at: marcaTemporal,
      };

      // Guardar en localStorage (opcional, para mantener compatibilidad)
      try {
        const updatedNotes = [createdNote, ...notes];
        setNotes(updatedNotes);
        localStorage.setItem(`notes_${patient.id}`, JSON.stringify(updatedNotes));
      } catch (error) {
        console.error('Error saving note to localStorage:', error);
      }

      // Resetear formulario
      setNuevaGestion({
        que_gestion_se_solicito: '',
        fecha_inicio: '',
        hora_inicio: '',
        cama: '',
        texto_libre_diagnostico_admision: '',
        diagnostico_transfer: '',
        concretado: '',
        estado: '',
        motivo_de_cancelacion: '',
        tipo_de_traslado: '',
        centro_de_destinatario: '',
        nivel_de_atencion: '',
        servicio_especialidad: '',
        fecha_de_finalizacion: '',
        hora_de_finalizacion: '',
      });

      // Las gestiones se recargan automáticamente en createGestion
      console.log('✅ Gestión agregada exitosamente');
      
      // Mostrar modal de éxito
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error al agregar gestión:', error);
      // Mostrar error al usuario (podrías agregar un toast o alert aquí)
      alert(`Error al agregar la gestión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGestion = (index: number, gestion: RegistroGestion) => {
    setEditandoGestion(index);
    setGestionEditada(gestion);
  };

  const handleSaveEdit = async () => {
    if (editandoGestion === null || !gestionEditada || !patient || !patient.episodio) return;

    try {
      setLoading(true);

      // Obtener la marca_temporal como registroId
      const registroId = gestionEditada.marca_temporal;
      if (!registroId) {
        alert('Error: No se pudo identificar la gestión a actualizar');
        return;
      }

      // Función helper para extraer mes y año de una fecha
      const extraerMesYAno = (fecha: string) => {
        try {
          const fechaObj = new Date(fecha);
          const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
          const mes = meses[fechaObj.getMonth()];
          const ano = fechaObj.getFullYear().toString();
          return { mes, ano };
        } catch (error) {
          console.error('Error al extraer mes y año:', error);
          return null;
        }
      };

      // Preparar datos para actualizar - construir objeto con campos válidos
      const nombreCompleto = `${patient.nombre} ${patient.apellido_paterno} ${patient.apellido_materno}`.trim();
      const ultimaModificacion = obtenerFechaChileISO();
      
      const updateData: any = {
        // Campos mínimos requeridos
        episodio: patient.episodio,
        marca_temporal: gestionEditada.marca_temporal, // Mantener la marca temporal original
        nombre: nombreCompleto,
        tipo_cuenta_1: patient.tipo_cuenta_1 || 'No especificado',
        ultima_modificacion: ultimaModificacion,
      };

      // Agregar campos editables del formulario
      if (gestionEditada.que_gestion_se_solicito) {
        updateData.que_gestion_se_solicito = gestionEditada.que_gestion_se_solicito;
      }
      if (gestionEditada.fecha_inicio) {
        updateData.fecha_inicio = gestionEditada.fecha_inicio;
        // Extraer mes y año de la fecha de inicio
        const mesYAno = extraerMesYAno(gestionEditada.fecha_inicio);
        if (mesYAno) {
          updateData.mes = mesYAno.mes;
          updateData.ano = mesYAno.ano;
        }
      }
      if (gestionEditada.hora_inicio) {
        updateData.hora_inicio = gestionEditada.hora_inicio;
      }
      if (gestionEditada.cama !== undefined && gestionEditada.cama !== null) {
        updateData.cama = gestionEditada.cama;
      }
      // Diagnóstico de admisión es obligatorio, siempre incluirlo
      if (gestionEditada.texto_libre_diagnostico_admision !== undefined) {
        updateData.texto_libre_diagnostico_admision = gestionEditada.texto_libre_diagnostico_admision || '';
      }
      if (gestionEditada.diagnostico_transfer) {
        updateData.diagnostico_transfer = gestionEditada.diagnostico_transfer;
      }
      if (gestionEditada.concretado) {
        updateData.concretado = gestionEditada.concretado.toUpperCase ? gestionEditada.concretado.toUpperCase() : gestionEditada.concretado;
      }
      if (gestionEditada.estado) {
        updateData.estado = gestionEditada.estado;
      }
      if (gestionEditada.motivo_de_cancelacion) {
        updateData.motivo_de_cancelacion = gestionEditada.motivo_de_cancelacion;
      }
      if (gestionEditada.motivo_de_rechazo) {
        updateData.motivo_de_rechazo = gestionEditada.motivo_de_rechazo;
      }
      if (gestionEditada.tipo_de_traslado) {
        updateData.tipo_de_traslado = gestionEditada.tipo_de_traslado;
      }
      if (gestionEditada.centro_de_destinatario) {
        updateData.centro_de_destinatario = gestionEditada.centro_de_destinatario;
      }
      if (gestionEditada.nivel_de_atencion) {
        updateData.nivel_de_atencion = gestionEditada.nivel_de_atencion;
      }
      if (gestionEditada.servicio_especialidad) {
        updateData.servicio_especialidad = gestionEditada.servicio_especialidad;
      }
      if (gestionEditada.fecha_de_finalizacion) {
        updateData.fecha_de_finalizacion = gestionEditada.fecha_de_finalizacion;
      }
      if (gestionEditada.hora_de_finalizacion) {
        updateData.hora_de_finalizacion = gestionEditada.hora_de_finalizacion;
      }
      if (gestionEditada.dias_solicitados_homecare) {
        updateData.dias_solicitados_homecare = gestionEditada.dias_solicitados_homecare;
      }
      if (gestionEditada.texto_libre_causa_rechazo) {
        updateData.texto_libre_causa_rechazo = gestionEditada.texto_libre_causa_rechazo;
      }
      if (gestionEditada.causa_devolucion_rechazo) {
        updateData.causa_devolucion_rechazo = gestionEditada.causa_devolucion_rechazo;
      }
      if (gestionEditada.solicitud_de_traslado) {
        updateData.solicitud_de_traslado = gestionEditada.solicitud_de_traslado;
      }
      if (gestionEditada.status) {
        updateData.status = gestionEditada.status;
      }

      // Agregar datos del paciente si están disponibles
      if (patient.rut) {
        updateData.rut = patient.rut;
        updateData.run = patient.rut;
      }
      if (patient.fecha_de_nacimiento) {
        updateData.fecha_de_nacimiento = patient.fecha_de_nacimiento.split('T')[0];
      }
      if (patient.sexo) {
        updateData.sexo = patient.sexo === 'M' ? 'Masculino' : 'Femenino';
      }
      if (patient.fecha_ingreso) {
        const fechaAdmision = patient.fecha_ingreso.split('T')[0];
        updateData.fecha_admision = fechaAdmision;
        // Si no hay fecha_inicio, usar fecha_admision para mes y año
        if (!updateData.mes || !updateData.ano) {
          const mesYAno = extraerMesYAno(fechaAdmision);
          if (mesYAno) {
            updateData.mes = mesYAno.mes;
            updateData.ano = mesYAno.ano;
          }
        }
      }
      if (patient.dias_hospitalizacion) {
        updateData.dias_hospitalizacion = patient.dias_hospitalizacion;
      }
      if (patient.convenio) {
        updateData.convenio = patient.convenio;
      }
      if (patient.nombre_de_la_aseguradora) {
        updateData.nombre_de_la_aseguradora = patient.nombre_de_la_aseguradora;
      }
      if (patient.valor_parcial_estadia) {
        updateData.valor_parcial = patient.valor_parcial_estadia;
      }
      if (patient.tipo_cuenta_2) {
        updateData.tipo_cuenta_2 = patient.tipo_cuenta_2;
      }
      if (patient.tipo_cuenta_3) {
        updateData.tipo_cuenta_3 = patient.tipo_cuenta_3;
      }

      console.log('📤 Datos a enviar para actualizar:', updateData);

      // Llamar al endpoint para actualizar la gestión
      await updateGestion(patient.episodio, registroId, updateData);
      
      console.log('✅ Gestión actualizada exitosamente');
      
      setEditandoGestion(null);
      setGestionEditada(null);
      
      // Mostrar modal de éxito de edición
      setShowEditSuccessModal(true);
      
    } catch (error) {
      console.error('Error al guardar gestión editada:', error);
      alert(`Error al actualizar la gestión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditandoGestion(null);
    setGestionEditada(null);
  };

  const handleDeleteGestion = async () => {
    if (!gestionAEliminar || !patient) return;

    try {
      setLoading(true);
      await deleteGestion(gestionAEliminar.episodio, gestionAEliminar.registroId);
      console.log('✅ Gestión eliminada exitosamente');
      setGestionAEliminar(null);
    } catch (error) {
      console.error('Error al eliminar gestión:', error);
      alert(`Error al eliminar la gestión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = (gestion: RegistroGestion, index: number) => {
    if (!patient || !patient.episodio || !gestion.marca_temporal) {
      alert('Error: No se pudo identificar la gestión a eliminar');
      return;
    }
    setGestionAEliminar({
      episodio: patient.episodio,
      registroId: gestion.marca_temporal,
      index
    });
  };

  const handleClose = () => {
    // Cancelar cualquier edición en curso antes de cerrar
    if (editandoGestion !== null) {
      handleCancelEdit();
    }
    // Cancelar cualquier eliminación pendiente
    if (gestionAEliminar !== null) {
      setGestionAEliminar(null);
    }
    onClose();
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'bajo': return 'text-green-600 bg-green-100';
      case 'medio': return 'text-yellow-600 bg-yellow-100';
      case 'alto': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // const getGestionTypeColor = (type: GestionType) => {
  //   switch (type) {
  //     case 'social': return 'bg-purple-100 text-purple-800';
  //     case 'clinica': return 'bg-blue-100 text-blue-800';
  //     case 'administrativa': return 'bg-green-100 text-green-800';
  //     case 'general': return 'bg-gray-100 text-gray-800';
  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadExcel = () => {
    if (!patient) {
      alert('No hay información del paciente disponible');
      return;
    }

    try {
      ExcelExportService.exportPatientAndGestiones(patient, gestiones);
    } catch (error) {
      console.error('Error al generar Excel:', error);
      alert(error instanceof Error ? error.message : 'Error al generar el archivo Excel. Por favor, intente nuevamente.');
    }
  };

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalles del Paciente: {patient.nombre} {patient.apellido_paterno}
            </h2>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
              < Hash className="h-4 w-4 mr-1" />
              Episodio: {patient.episodio}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {gestiones.length > 0 && (
              <button
                onClick={handleDownloadExcel}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                title="Descargar Excel con información del paciente y gestiones"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Excel
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Información General
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'notes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FolderPen className="h-4 w-4 inline mr-1" />
                Nueva Gestión
              </button>
              <button
                onClick={() => setActiveTab('additional')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'additional'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FolderOpen className="h-4 w-4 inline mr-1" />
                Historial de Gestiones
              </button>
            </nav>
          </div>

          {activeTab === 'details' && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Paciente</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">RUT</dt>
                    <dd className="text-sm text-gray-900">{patient.rut}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                    <dd className="text-sm text-gray-900">
                      {patient.nombre} {patient.apellido_paterno} {patient.apellido_materno}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha de Nacimiento</dt>
                    <dd className="text-sm text-gray-900">
                      {formatDate(patient.fecha_de_nacimiento)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Edad / Sexo</dt>
                    <dd className="text-sm text-gray-900">{patient.edad} años • {patient.sexo === 'M' ? 'Masculino' : 'Femenino'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Convenio-Isapre</dt>
                    <dd className="text-sm text-gray-900">{patient.convenio || 'No disponible'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Isapre</dt>
                    <dd className="text-sm text-gray-900">{patient.nombre_de_la_aseguradora || 'No disponible'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Estadía Hospitalaria</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Cama</dt>
                    <dd className="text-sm text-gray-900">{patient.ultima_cama || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha de Ingreso</dt>
                    <dd className="text-sm text-gray-900">{formatDate(patient.fecha_ingreso)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Días Hospitalizado</dt>
                    <dd className="text-sm text-gray-900">{patient.dias_hospitalizacion} días</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Alta Estimada</dt>
                    <dd className="text-sm text-gray-900">{formatDate(patient.fecha_estimada_alta)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Valor Parcial de la Estadia</dt>
                    <dd className="text-sm text-gray-900">{patient.valor_parcial_estadia || '-'}</dd>
                  </div>
                </dl>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Evaluación de Riesgos</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(patient.riesgo_social)}`}>
                      Riesgo Social: {patient.riesgo_social.charAt(0).toUpperCase() + patient.riesgo_social.slice(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(patient.riesgo_clinico)}`}>
                      Riesgo Clínico: {patient.riesgo_clinico.charAt(0).toUpperCase() + patient.riesgo_clinico.slice(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(patient.riesgo_administrativo)}`}>
                      Riesgo Admin.: {patient.riesgo_administrativo.charAt(0).toUpperCase() + patient.riesgo_administrativo.slice(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      patient.nivel_riesgo_global === 'verde' ? 'bg-green-100 text-green-800' :
                      patient.nivel_riesgo_global === 'amarillo' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {patient.nivel_riesgo_global === 'rojo' && <AlertTriangle className="h-4 w-4 mr-1" />}
                      Global: {patient.nivel_riesgo_global === 'rojo' ? 'Alto' : patient.nivel_riesgo_global === 'amarillo' ? 'Medio' : 'Bajo'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Diagnóstico Principal</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {patient.diagnostico_principal}
                </p>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo Cuenta</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {patient.tipo_cuenta_1 || '-'}
                  {patient.tipo_cuenta_2 && ` • ${patient.tipo_cuenta_2}`}
                  {patient.tipo_cuenta_3 && ` • ${patient.tipo_cuenta_3}`}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="mt-6">
              <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Nueva Gestión</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de Gestión */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Gestión <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={nuevaGestion.que_gestion_se_solicito}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, que_gestion_se_solicito: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !nuevaGestion.que_gestion_se_solicito.trim() ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Seleccione...</option>
                      <option value="Gestión Clínica">Gestión Clínica</option>
                      <option value="Traslado">Traslado</option>
                      <option value="Homecare">Homecare</option>
                      <option value="Corte Cuentas">Corte Cuentas</option>
                      <option value="Autorización Procedimiento">Autorización Procedimiento</option>
                      <option value="Actualización de estado paciente solicitado por prestadores">Actualización de estado</option>
                    </select>
                  </div>

                  {/* Fecha de Inicio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={nuevaGestion.fecha_inicio}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, fecha_inicio: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Hora de Inicio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora de Inicio
                    </label>
                    <input
                      type="time"
                      value={nuevaGestion.hora_inicio}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, hora_inicio: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Cama */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cama
                    </label>
                    <input
                      type="text"
                      value={nuevaGestion.cama || patient?.ultima_cama || ''}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, cama: e.target.value})}
                      placeholder="Ej: CH344P3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {patient?.ultima_cama && !nuevaGestion.cama && (
                      <p className="mt-1 text-xs text-gray-500">
                        Cama actual del paciente: {patient.ultima_cama}
                      </p>
                    )}
                  </div>

                  {/* Diagnóstico Admisión */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Diagnóstico de Admisión <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nuevaGestion.texto_libre_diagnostico_admision}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, texto_libre_diagnostico_admision: e.target.value})}
                      placeholder="Ingrese el diagnóstico de admisión..."
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !nuevaGestion.texto_libre_diagnostico_admision.trim() 
                          ? 'border-red-300' 
                          : 'border-gray-300'
                      }`}
                      required
                    />
                    {patient?.diagnostico_principal && !nuevaGestion.texto_libre_diagnostico_admision && (
                      <p className="mt-1 text-xs text-gray-500">
                        Diagnóstico del paciente: {patient.diagnostico_principal}
                      </p>
                    )}
                  </div>

                  {/* Diagnóstico Transferencia */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Diagnóstico de Transferencia
                    </label>
                    <input
                      type="text"
                      value={nuevaGestion.diagnostico_transfer}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, diagnostico_transfer: e.target.value})}
                      placeholder="Ingrese el diagnóstico de transferencia..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Tipo de Traslado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Traslado
                    </label>
                    <input
                      type="text"
                      value={nuevaGestion.tipo_de_traslado}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, tipo_de_traslado: e.target.value})}
                      placeholder="Ej: Hospitalizado Externo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Centro Destinatario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Centro Destinatario
                    </label>
                    <input
                      type="text"
                      value={nuevaGestion.centro_de_destinatario}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, centro_de_destinatario: e.target.value})}
                      placeholder="Ej: FUSAT"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Nivel de Atención */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nivel de Atención
                    </label>
                    <input
                      type="text"
                      value={nuevaGestion.nivel_de_atencion}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, nivel_de_atencion: e.target.value})}
                      placeholder="Ej: Cuidados Intensivos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Servicio/Especialidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Servicio/Especialidad
                    </label>
                    <input
                      type="text"
                      value={nuevaGestion.servicio_especialidad}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, servicio_especialidad: e.target.value})}
                      placeholder="Ej: Cardiología"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Concretado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Concretado
                    </label>
                    <select
                      value={nuevaGestion.concretado}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, concretado: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione...</option>
                      <option value="SI">Sí</option>
                      <option value="NO">No</option>
                    </select>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={nuevaGestion.estado}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, estado: e.target.value})}
                      placeholder="Ej: Completado, Cancelado"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Fecha Finalización */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Finalización
                    </label>
                    <input
                      type="date"
                      value={nuevaGestion.fecha_de_finalizacion}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, fecha_de_finalizacion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Hora Finalización */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora de Finalización
                    </label>
                    <input
                      type="time"
                      value={nuevaGestion.hora_de_finalizacion}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, hora_de_finalizacion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Motivo Cancelación */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo de Cancelación
                    </label>
                    <input
                      type="text"
                      value={nuevaGestion.motivo_de_cancelacion}
                      onChange={(e) => setNuevaGestion({...nuevaGestion, motivo_de_cancelacion: e.target.value})}
                      placeholder="Ingrese el motivo de cancelación si aplica..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Mensaje de validación */}
                {(() => {
                  const validacion = validarCamposMinimos();
                  if (!validacion.valido && nuevaGestion.que_gestion_se_solicito) {
                    return (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-yellow-800 mb-1">
                              Campos requeridos faltantes:
                            </h4>
                            <ul className="text-xs text-yellow-700 list-disc list-inside">
                              {validacion.errores.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleAddNote}
                    disabled={(() => {
                      const validacion = validarCamposMinimos();
                      return !validacion.valido;
                    })()}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar Gestión
                  </button>
                </div>
              </div>

              {/* <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Historial de Gestiones</h3>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : notes.length > 0 ? (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGestionTypeColor(note.tipo_gestion)}`}>
                              {note.tipo_gestion.charAt(0).toUpperCase() + note.tipo_gestion.slice(1)}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{note.user_name}</span>
                            <span className="text-sm text-gray-500">({note.user_role})</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(note.fecha_gestion)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{note.nota}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No hay gestiones registradas</p>
                  </div>
                )}
              </div> */}
            </div>
          )}

          {activeTab === 'additional' && (
            <div className="mt-6">
              
              {gestionesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando gestiones...</p>
                </div>
              ) : gestionesError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
                  <p className="mt-2 text-sm text-red-600">{gestionesError}</p>
                </div>
              ) : gestiones.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No hay gestiones registradas para este episodio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">
                          Total de gestiones: {gestiones.length}
                        </span>
                      </div>
                      <span className="text-xs text-blue-600">
                        Episodio: {patient?.episodio}
                      </span>
                    </div>
                  </div>

                  {/* Ordenar gestiones por marca_temporal (más reciente a más antigua) */}
                  {[...gestiones]
                    .sort((a, b) => {
                      return new Date(b.marca_temporal).getTime() - new Date(a.marca_temporal).getTime();
                    })
                    .map((gestion, index) => {
                    const isConcretada = GestionService.isGestionConcretada(gestion);
                    const colorClass = GestionService.getGestionColor(gestion);
                    const tipoGestion = GestionService.getTipoGestionName(gestion.que_gestion_se_solicito);
                    const diagnostico = GestionService.getDiagnostico(gestion);
                    
                    // Usar fecha_inicio y hora_inicio, o marca_temporal como fallback
                    const fechaParaMostrar = gestion.fecha_inicio || gestion.marca_temporal;
                    const horaParaMostrar = gestion.hora_inicio || null;
                    const fechaHora = GestionService.formatFechaHora(fechaParaMostrar, horaParaMostrar);
                    
                    const fechaFinalizacion = GestionService.formatFechaHora(
                      gestion.fecha_de_finalizacion, 
                      gestion.hora_de_finalizacion
                    );
                    
                    // Si está en modo edición, mostrar formulario de edición
                    if (editandoGestion === index && gestionEditada) {
                      return (
                        <div key={index} className="border border-blue-500 rounded-lg p-4 bg-blue-50">
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                              <Edit className="h-4 w-4 mr-1" />
                              Editando Gestión
                            </h4>
                            
                            {/* Formulario de edición inline */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {Object.entries(gestionEditada).map(([key, value]: [string, any]) => {
                                if (key === 'marca_temporal' || key === 'ultima_modificacion' || key === 'mes' || key === 'ano') return null;
                                
                                // Campos que deben ocupar todo el ancho (texto largo)
                                const isFullWidth = key === 'texto_libre_diagnostico_admision' || 
                                                   key === 'texto_libre_causa_rechazo' ||
                                                   key === 'motivo_de_cancelacion' ||
                                                   key === 'motivo_de_rechazo' ||
                                                   key === 'causa_devolucion_rechazo';
                                
                                return (
                                  <div key={key} className={isFullWidth ? 'md:col-span-2' : ''}>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      {key === 'texto_libre_diagnostico_admision' && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    {key === 'concretado' ? (
                                      <select
                                        value={value || ''}
                                        onChange={(e) => setGestionEditada({...gestionEditada, [key]: e.target.value})}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        <option value="">Seleccione...</option>
                                        <option value="SI">Sí</option>
                                        <option value="NO">No</option>
                                      </select>
                                    ) : key.includes('fecha') ? (
                                      <input
                                        type="date"
                                        value={value && typeof value === 'string' && value.includes('T') ? value.split('T')[0] : (value || '')}
                                        onChange={(e) => setGestionEditada({...gestionEditada, [key]: e.target.value})}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    ) : key.includes('hora') ? (
                                      <input
                                        type="time"
                                        value={value || ''}
                                        onChange={(e) => setGestionEditada({...gestionEditada, [key]: e.target.value})}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    ) : isFullWidth ? (
                                      <textarea
                                        value={value || ''}
                                        onChange={(e) => setGestionEditada({...gestionEditada, [key]: e.target.value})}
                                        rows={3}
                                        className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                          key === 'texto_libre_diagnostico_admision' && !value 
                                            ? 'border-red-300' 
                                            : 'border-gray-300'
                                        }`}
                                        placeholder={`Ingrese ${key.replace(/_/g, ' ').toLowerCase()}...`}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={value || ''}
                                        onChange={(e) => setGestionEditada({...gestionEditada, [key]: e.target.value})}
                                        className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                          key === 'texto_libre_diagnostico_admision' && !value 
                                            ? 'border-red-300' 
                                            : 'border-gray-300'
                                        }`}
                                        placeholder={`Ingrese ${key.replace(/_/g, ' ').toLowerCase()}...`}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Guardar
                            </button>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div 
                        key={index} 
                        className={`border rounded-lg p-4 ${colorClass.split(' ')[0]} bg-opacity-50`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
                              {tipoGestion}
                            </div>
                            {gestion.cama && (
                              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                                <Bed className="h-3 w-3 mr-1" />
                                {gestion.cama}
                              </div>
                            )}
                            {isConcretada && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {gestion.motivo_de_cancelacion && (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            {gestion.estado && (
                              <span className="text-xs font-medium text-gray-600">
                                Estado: {gestion.estado}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {fechaHora}
                            </div>
                            <button
                              onClick={() => handleEditGestion(index, gestion)}
                              className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Editar gestión"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleConfirmDelete(gestion, index)}
                              className="inline-flex items-center px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar gestión"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Eliminar
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 mt-3">
                          <div>
                            <span className="text-xs font-medium text-gray-600">Diagnóstico:</span>
                            <p className="text-sm text-gray-900 mt-1">{diagnostico}</p>
                          </div>

                          {gestion.diagnostico_transfer && (
                            <div>
                              <span className="text-xs font-medium text-gray-600">Diagnóstico Transferencia:</span>
                              <p className="text-sm text-gray-700 font-medium mt-1">{gestion.diagnostico_transfer}</p>
                            </div>
                          )}

                          {(gestion.tipo_de_traslado || gestion.centro_de_destinatario || gestion.nivel_de_atencion) && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                              <h5 className="text-xs font-semibold text-red-900 mb-2 flex items-center">
                                <Briefcase className="h-3 w-3 mr-1" />
                                Información de Traslado
                              </h5>
                              <div className="space-y-2">
                                {gestion.tipo_de_traslado && (
                                  <div>
                                    <span className="text-xs font-medium text-red-700">Tipo de Traslado:</span>
                                    <p className="text-sm text-gray-700 font-medium">{gestion.tipo_de_traslado}</p>
                                  </div>
                                )}
                                {gestion.centro_de_destinatario && (
                                  <div>
                                    <span className="text-xs font-medium text-red-700">Centro Destinatario:</span>
                                    <p className="text-sm text-gray-700 font-medium">{gestion.centro_de_destinatario}</p>
                                  </div>
                                )}
                                {gestion.nivel_de_atencion && (
                                  <div>
                                    <span className="text-xs font-medium text-red-700">Nivel de Atención:</span>
                                    <p className="text-sm text-gray-700 font-medium">{gestion.nivel_de_atencion}</p>
                                  </div>
                                )}
                                {gestion.servicio_especialidad && (
                                  <div>
                                    <span className="text-xs font-medium text-red-700">Especialidad:</span>
                                    <p className="text-sm text-gray-700 font-medium">{gestion.servicio_especialidad}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {gestion.concretado && (
                            <div className="flex items-center">
                              <span className="text-xs font-medium text-gray-600 mr-2">Concretado:</span>
                              <span className={`text-xs font-medium ${
                                isConcretada ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {gestion.concretado}
                              </span>
                            </div>
                          )}

                          {gestion.motivo_de_cancelacion && (
                            <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                              <span className="text-xs font-medium text-red-800">Motivo de Cancelación:</span>
                              <p className="text-sm text-gray-700 font-medium">{gestion.motivo_de_cancelacion}</p>
                            </div>
                          )}

                          {gestion.motivo_de_rechazo && (
                            <div className="bg-orange-50 border border-orange-200 rounded p-2 mt-2">
                              <span className="text-xs font-medium text-orange-800">Motivo de Rechazo:</span>
                              <p className="text-sm text-orange-900">{gestion.motivo_de_rechazo}</p>
                            </div>
                          )}

                          {gestion.causa_devolucion_rechazo && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                              <span className="text-xs font-medium text-yellow-800">Causa de Devolución:</span>
                              <p className="text-sm text-yellow-900">{gestion.causa_devolucion_rechazo}</p>
                            </div>
                          )}

                          {fechaFinalizacion !== '-' && (
                            <div className="text-xs text-gray-500 mt-2">
                              Finalización: {fechaFinalizacion}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Éxito - Crear Gestión */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-96 max-w-md shadow-lg rounded-lg bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Gestión Agregada Exitosamente!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                La gestión ha sido guardada correctamente y se ha agregado al historial del paciente.
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  // Cambiar a la pestaña de historial para que vea la nueva gestión
                  setActiveTab('additional');
                }}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Ver Historial de Gestiones
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="mt-3 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito - Editar Gestión */}
      {showEditSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-96 max-w-md shadow-lg rounded-lg bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Gestión Actualizada Exitosamente!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Los cambios en la gestión han sido guardados correctamente en el historial del paciente.
              </p>
              <button
                onClick={() => {
                  setShowEditSuccessModal(false);
                }}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación - Eliminar Gestión */}
      {gestionAEliminar && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-96 max-w-md shadow-lg rounded-lg bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¿Eliminar Gestión?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar esta gestión?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setGestionAEliminar(null)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteGestion}
                  disabled={gestionesLoading}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {gestionesLoading ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};