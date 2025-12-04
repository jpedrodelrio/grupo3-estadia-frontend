import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Patient, RiskLevel, GlobalRisk, PrediccionNuevoPacienteInput, CreateGestionData } from '../../types';
import { PrediccionService } from '../../services/PrediccionService';
import { PrediccionResultModal } from './PrediccionResultModal';
import { useGestiones } from '../../hooks/useGestiones';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: (patient: Patient) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [showPrediccionResult, setShowPrediccionResult] = useState(false);
  const [prediccionResultados, setPrediccionResultados] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_de_nacimiento: '',
    sexo: 'M' as 'M' | 'F',
    servicio_clinico: '',
    diagnostico_principal: '',
    prevision: '',
    riesgo_social: 'bajo' as RiskLevel,
    riesgo_clinico: 'bajo' as RiskLevel,
    riesgo_administrativo: 'bajo' as RiskLevel,
    fecha_estimada_alta: '',
    codigo_grd: '',
  });
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
  
  const { createGestion } = useGestiones();

  const servicios = [
    'Medicina Interna',
    'Cirugía',
    'Cardiología',
    'Neurología',
    'Pediatría',
    'Ginecología',
    'Traumatología',
    'Oncología',
    'Urgencias',
    'UCI',
  ];

  const previsiones = [
    'FONASA A',
    'FONASA B',
    'FONASA C',
    'FONASA D',
    'ISAPRE',
    'Particular',
    'Otro',
  ];

  /**
   * Calcula el nivel de riesgo global basado en la probabilidad de sobre-estadía o días de hospitalización
   * Usa la misma lógica que PatientService.calculateRiskLevel
   */
  const calculateGlobalRisk = (probSobreEstadia: number | null, diasHospitalizacion: number): GlobalRisk => {
    // Si hay probabilidad disponible, usarla para calcular el riesgo
    if (probSobreEstadia !== null && probSobreEstadia !== undefined) {
      // Umbrales basados en probabilidad de sobre-estadía:
      // - >= 70% (0.7): Rojo (Alto riesgo)
      // - >= 40% (0.4) y < 70%: Amarillo (Medio riesgo)
      // - < 40% (0.4): Verde (Bajo riesgo)
      if (probSobreEstadia >= 0.66) return 'rojo';
      if (probSobreEstadia >= 0.33) return 'amarillo';
      return 'verde';
    }
    
    // Si no hay probabilidad disponible, calcular basándose en días de hospitalización
    // Umbrales basados en días de hospitalización:
    // - > 15 días: Rojo (Alto riesgo)
    // - > 7 días: Amarillo (Medio riesgo)
    // - <= 7 días: Verde (Bajo riesgo)
    if (diasHospitalizacion > 15) return 'rojo';
    if (diasHospitalizacion > 7) return 'amarillo';
    return 'verde';
  };

  const calculateHospitalizationDays = (fechaIngreso: Date): number => {
    const today = new Date();
    const diffTime = today.getTime() - fechaIngreso.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  /**
   * Calcula la edad desde la fecha de nacimiento
   */
  const calculateAge = (fechaNacimiento: string): number => {
    if (!fechaNacimiento) return 0;
    try {
      const nacimiento = new Date(fechaNacimiento);
      const hoy = new Date();
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mesDiff = hoy.getMonth() - nacimiento.getMonth();
      if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    } catch {
      return 0;
    }
  };

  /**
   * Convierte fecha a días desde hoy
   */
  const convertFechaToDias = (fecha: string): number => {
    try {
      const fechaAlta = new Date(fecha);
      const hoy = new Date();
      const diffTime = fechaAlta.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 0;
    }
  };

  /**
   * Genera un episodio único para el paciente
   */
  const generarEpisodio = (rut: string): string => {
    // Usar RUT sin puntos ni guión
    const rutLimpio = rut.replace(/[.-]/g, '');
    return `EP${rutLimpio}`;
  };

  /**
   * Extrae mes y año de una fecha
   */
  const extraerMesYAno = (fecha: string) => {
    try {
      const fechaObj = new Date(fecha);
      const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const mes = meses[fechaObj.getMonth()];
      const ano = fechaObj.getFullYear().toString();
      return { mes, ano };
    } catch {
      return null;
    }
  };

  /**
   * Obtiene fecha/hora actual en formato ISO con zona horaria de Chile
   */
  const obtenerFechaChileISO = (): string => {
    const ahora = new Date();
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
    
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  };

  // Prellenar fecha y hora de inicio cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const ahora = new Date();
      const fechaHoraChile = new Date(ahora.toLocaleString('en-CL', { timeZone: 'America/Santiago' }));
      const fechaHoy = fechaHoraChile.toISOString().split('T')[0];
      const horaActual = fechaHoraChile.toTimeString().slice(0, 5);
      
      setNuevaGestion(prev => ({
        ...prev,
        fecha_inicio: prev.fecha_inicio || fechaHoy,
        hora_inicio: prev.hora_inicio || horaActual,
      }));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calcular edad desde la fecha de nacimiento
      const edad = calculateAge(formData.fecha_de_nacimiento);
      if (edad <= 0 || edad > 150) {
        alert('Por favor ingrese una fecha de nacimiento válida');
        setLoading(false);
        return;
      }

      // Primero, llamar al endpoint de predicción
      const fechaEstimadaDias = formData.fecha_estimada_alta 
        ? convertFechaToDias(formData.fecha_estimada_alta)
        : 7; // Default 7 días si no hay fecha

      const prediccionInput: PrediccionNuevoPacienteInput = {
        rut: formData.rut,
        edad: edad,
        sexo: formData.sexo,
        servicio_clinico: formData.servicio_clinico,
        prevision: formData.prevision,
        fecha_estimada_de_alta: fechaEstimadaDias,
        riesgo_social: formData.riesgo_social,
        riesgo_clinico: formData.riesgo_clinico,
        riesgo_administrativo: formData.riesgo_administrativo,
        codigo_grd: parseInt(formData.codigo_grd) || 0,
      };

      // Llamar al endpoint de predicción
      const prediccionResponse = await PrediccionService.predecirSobreEstadia(
        [prediccionInput],
        true // persistir en MongoDB
      );

      // Mostrar resultados de predicción
      setPrediccionResultados(prediccionResponse.items);
      setShowPrediccionResult(true);

      // Obtener la probabilidad de sobre-estadía del primer resultado (solo se envía un paciente)
      const prediccionResult = prediccionResponse.items[0];
      const probSobreEstadia = prediccionResult?.probabilidad_sobre_estadia || null;

      // Crear el paciente después de la predicción
      const fechaIngreso = new Date();
      const diasHospitalizacion = calculateHospitalizationDays(fechaIngreso);
      
      // Calcular nivel de riesgo global usando la misma lógica que PatientService
      // Basado en probabilidad de sobre-estadía (o días de hospitalización como fallback)
      const nivelRiesgoGlobal = calculateGlobalRisk(probSobreEstadia, diasHospitalizacion);

      // Usar la fecha de nacimiento ingresada directamente
      const fechaNacimiento = new Date(formData.fecha_de_nacimiento);

      // Generar episodio único para el paciente
      const episodio = generarEpisodio(formData.rut);
      const nombreCompleto = `${formData.nombre} ${formData.apellido_paterno} ${formData.apellido_materno || ''}`.trim();
      const marcaTemporal = obtenerFechaChileISO();

      const patientData: Patient = {
        id: episodio, // Usar el mismo episodio como ID para mantener consistencia
        episodio: episodio,
        rut: formData.rut,
        nombre: formData.nombre,
        apellido_paterno: formData.apellido_paterno,
        apellido_materno: formData.apellido_materno,
        fecha_de_nacimiento: fechaNacimiento.toISOString(),
        edad: edad,
        sexo: formData.sexo,
        convenio: formData.prevision,
        nombre_de_la_aseguradora: '',
        ultima_cama: nuevaGestion.cama || null,
        fecha_ingreso: fechaIngreso.toISOString(),
        fecha_estimada_alta: formData.fecha_estimada_alta,
        dias_hospitalizacion: diasHospitalizacion,
        valor_parcial_estadia: '',
        diagnostico_principal: formData.diagnostico_principal,
        tipo_cuenta_1: 'No especificado',
        tipo_cuenta_2: null,
        tipo_cuenta_3: null,
        riesgo_social: formData.riesgo_social,
        riesgo_clinico: formData.riesgo_clinico,
        riesgo_administrativo: formData.riesgo_administrativo,
        nivel_riesgo_global: nivelRiesgoGlobal,
        estado: 'activo',
        prevision: formData.prevision,
        created_at: fechaIngreso.toISOString(),
        updated_at: fechaIngreso.toISOString(),
        prob_sobre_estadia: probSobreEstadia,
        grd_code: formData.codigo_grd || null,
      };

      // Calcular mes y año desde fecha_inicio o fecha_admision
      const fechaParaMesAno = nuevaGestion.fecha_inicio || fechaIngreso.toISOString().split('T')[0];
      const mesYAno = extraerMesYAno(fechaParaMesAno);

      // Crear la gestión usando el endpoint /gestion/estadias
      // Incluir todos los campos requeridos, incluso si son null
      const gestionData: CreateGestionData = {
        episodio: episodio,
        marca_temporal: marcaTemporal,
        nombre: nombreCompleto,
        tipo_cuenta_1: 'No especificado',
        ultima_modificacion: marcaTemporal,
        que_gestion_se_solicito: nuevaGestion.que_gestion_se_solicito || 'Ingreso Paciente',
        fecha_inicio: nuevaGestion.fecha_inicio || null,
        hora_inicio: nuevaGestion.hora_inicio || null,
        mes: mesYAno?.mes || null,
        ano: mesYAno?.ano || null,
        cama: nuevaGestion.cama || null,
        texto_libre_diagnostico_admision: nuevaGestion.texto_libre_diagnostico_admision || formData.diagnostico_principal || null,
        diagnostico_transfer: nuevaGestion.diagnostico_transfer || null,
        concretado: nuevaGestion.concretado ? nuevaGestion.concretado.toUpperCase() : null,
        solicitud_de_traslado: null,
        status: null,
        causa_devolucion_rechazo: null,
        estado: nuevaGestion.estado || null,
        motivo_de_cancelacion: nuevaGestion.motivo_de_cancelacion || null,
        motivo_de_rechazo: null,
        tipo_de_traslado: nuevaGestion.tipo_de_traslado || null,
        centro_de_destinatario: nuevaGestion.centro_de_destinatario || null,
        nivel_de_atencion: nuevaGestion.nivel_de_atencion || null,
        servicio_especialidad: nuevaGestion.servicio_especialidad || formData.servicio_clinico || null,
        fecha_de_finalizacion: nuevaGestion.fecha_de_finalizacion || null,
        hora_de_finalizacion: nuevaGestion.hora_de_finalizacion || null,
        dias_solicitados_homecare: null,
        texto_libre_causa_rechazo: null,
        // Campos adicionales del paciente
        rut: formData.rut,
        run: formData.rut,
        fecha_de_nacimiento: fechaNacimiento.toISOString().split('T')[0],
        sexo: formData.sexo === 'M' ? 'Masculino' : 'Femenino',
        fecha_admision: fechaIngreso.toISOString().split('T')[0],
        fecha_alta: formData.fecha_estimada_alta || null,
        dias_hospitalizacion: diasHospitalizacion,
        convenio: formData.prevision,
        valor_parcial: '',
        // Nuevos campos del endpoint
        riesgo_social: formData.riesgo_social,
        riesgo_clinico: formData.riesgo_clinico,
        riesgo_administrativo: formData.riesgo_administrativo,
        ultima_cama: nuevaGestion.cama || null,
        prob_sobre_estadia: probSobreEstadia,
        grd_code: formData.codigo_grd || null,
      };

      // Crear la gestión en el backend
      console.log('🔄 Creando gestión para nuevo paciente...', gestionData);
      await createGestion(gestionData);
      console.log('✅ Gestión creada exitosamente');

      // Agregar el paciente al frontend
      onPatientCreated(patientData);
      
      // Resetear formulario después de mostrar resultados
      // (no cerrar el modal todavía, esperar a que el usuario cierre el modal de resultados)
    } catch (error) {
      console.error('Error al realizar predicción:', error);
      alert(`Error al realizar la predicción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePrediccionResult = () => {
    setShowPrediccionResult(false);
    // Cerrar el modal principal y resetear formulario
    onClose();
    setFormData({
      rut: '',
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      fecha_de_nacimiento: '',
      sexo: 'M',
      servicio_clinico: '',
      diagnostico_principal: '',
      prevision: '',
      riesgo_social: 'bajo',
      riesgo_clinico: 'bajo',
      riesgo_administrativo: 'bajo',
      fecha_estimada_alta: '',
      codigo_grd: '',
    });
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
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Nuevo Paciente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT *
              </label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12.345.678-9"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido Paterno *
              </label>
              <input
                type="text"
                name="apellido_paterno"
                value={formData.apellido_paterno}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido Materno
              </label>
              <input
                type="text"
                name="apellido_materno"
                value={formData.apellido_materno}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                name="fecha_de_nacimiento"
                value={formData.fecha_de_nacimiento}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.fecha_de_nacimiento && (
                <p className="mt-1 text-xs text-gray-500">
                  Edad: {calculateAge(formData.fecha_de_nacimiento)} años
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sexo *
              </label>
              <select
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servicio Clínico *
              </label>
              <select
                name="servicio_clinico"
                value={formData.servicio_clinico}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione un servicio</option>
                {servicios.map((servicio) => (
                  <option key={servicio} value={servicio}>
                    {servicio}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Previsión *
              </label>
              <select
                name="prevision"
                value={formData.prevision}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione previsión</option>
                {previsiones.map((prevision) => (
                  <option key={prevision} value={prevision}>
                    {prevision}
                  </option>
                ))}
              </select>
            </div>
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Estimada de Alta *
              </label>
              <input
                type="date"
                name="fecha_estimada_alta"
                value={formData.fecha_estimada_alta}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código GRD *
              </label>
              <input
                type="number"
                name="codigo_grd"
                value={formData.codigo_grd}
                onChange={handleChange}
                required
                min="0"
                placeholder="Ej: 51401"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Código GRD del paciente (requerido para predicción)
              </p>
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnóstico Principal *
            </label>
            <textarea
              name="diagnostico_principal"
              value={formData.diagnostico_principal}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese el diagnóstico principal del paciente"
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Evaluación de Riesgos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Riesgo Social
                </label>
                <select
                  name="riesgo_social"
                  value={formData.riesgo_social}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Riesgo Clínico
                </label>
                <select
                  name="riesgo_clinico"
                  value={formData.riesgo_clinico}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Riesgo Administrativo
                </label>
                <select
                  name="riesgo_administrativo"
                  value={formData.riesgo_administrativo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Formulario de Gestión */}
          <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Gestión</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Gestión */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Gestión
                </label>
                <select
                  value={nuevaGestion.que_gestion_se_solicito}
                  onChange={(e) => setNuevaGestion({...nuevaGestion, que_gestion_se_solicito: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  value={nuevaGestion.cama}
                  onChange={(e) => setNuevaGestion({...nuevaGestion, cama: e.target.value})}
                  placeholder="Ej: CH344P3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Diagnóstico Admisión */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnóstico de Admisión
                </label>
                <input
                  type="text"
                  value={nuevaGestion.texto_libre_diagnostico_admision || formData.diagnostico_principal}
                  onChange={(e) => setNuevaGestion({...nuevaGestion, texto_libre_diagnostico_admision: e.target.value})}
                  placeholder="Ingrese el diagnóstico de admisión..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.diagnostico_principal && !nuevaGestion.texto_libre_diagnostico_admision && (
                  <p className="mt-1 text-xs text-gray-500">
                    Se usará el diagnóstico principal del paciente si no se especifica otro
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
                  value={nuevaGestion.servicio_especialidad || formData.servicio_clinico}
                  onChange={(e) => setNuevaGestion({...nuevaGestion, servicio_especialidad: e.target.value})}
                  placeholder="Ej: Cardiología"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.servicio_clinico && !nuevaGestion.servicio_especialidad && (
                  <p className="mt-1 text-xs text-gray-500">
                    Se usará el servicio clínico del paciente si no se especifica otro
                  </p>
                )}
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
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creando...' : 'Crear Paciente'}
            </button>
          </div>
        </form>

        <PrediccionResultModal
          isOpen={showPrediccionResult}
          onClose={handleClosePrediccionResult}
          resultados={prediccionResultados}
        />
      </div>
    </div>
  );
};