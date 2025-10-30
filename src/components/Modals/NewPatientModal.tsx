import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Patient, RiskLevel, GlobalRisk } from '../../types';

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
  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    edad: '',
    sexo: 'M' as 'M' | 'F',
    servicio_clinico: '',
    diagnostico_principal: '',
    prevision: '',
    riesgo_social: 'bajo' as RiskLevel,
    riesgo_clinico: 'bajo' as RiskLevel,
    riesgo_administrativo: 'bajo' as RiskLevel,
    fecha_estimada_alta: '',
  });

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

  const calculateGlobalRisk = (social: RiskLevel, clinico: RiskLevel, administrativo: RiskLevel): GlobalRisk => {
    const risks = [social, clinico, administrativo];
    if (risks.includes('alto')) return 'rojo';
    if (risks.includes('medio')) return 'amarillo';
    return 'verde';
  };

  const calculateHospitalizationDays = (fechaIngreso: Date): number => {
    const today = new Date();
    const diffTime = today.getTime() - fechaIngreso.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fechaIngreso = new Date();
    const diasHospitalizacion = calculateHospitalizationDays(fechaIngreso);
    const nivelRiesgoGlobal = calculateGlobalRisk(
      formData.riesgo_social,
      formData.riesgo_clinico,
      formData.riesgo_administrativo
    );

    const fechaNacimiento = new Date();
    fechaNacimiento.setFullYear(fechaNacimiento.getFullYear() - parseInt(formData.edad));

    const patientData: Patient = {
      id: `patient_${Date.now()}`,
      episodio: '',
      rut: formData.rut,
      nombre: formData.nombre,
      apellido_paterno: formData.apellido_paterno,
      apellido_materno: formData.apellido_materno,
      fecha_de_nacimiento: fechaNacimiento.toISOString(),
      edad: parseInt(formData.edad),
      sexo: formData.sexo,
      convenio: formData.prevision,
      nombre_de_la_aseguradora: '',
      ultima_cama: null,
      fecha_ingreso: fechaIngreso.toISOString(),
      fecha_estimada_alta: formData.fecha_estimada_alta,
      dias_hospitalizacion: diasHospitalizacion,
      valor_parcial_estadia: '',
      diagnostico_principal: formData.diagnostico_principal,
      tipo_cuenta_1: null,
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
    };
    
    onPatientCreated(patientData);
    onClose();
    setFormData({
      rut: '',
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      edad: '',
      sexo: 'M',
      servicio_clinico: '',
      diagnostico_principal: '',
      prevision: '',
      riesgo_social: 'bajo',
      riesgo_clinico: 'bajo',
      riesgo_administrativo: 'bajo',
      fecha_estimada_alta: '',
    });
    
    setLoading(false);
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
                Edad *
              </label>
              <input
                type="number"
                name="edad"
                value={formData.edad}
                onChange={handleChange}
                required
                min="0"
                max="150"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
      </div>
    </div>
  );
};