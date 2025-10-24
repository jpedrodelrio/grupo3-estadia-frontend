import React, { useState, useEffect } from 'react';
// import { X, Calendar, User, AlertTriangle, FileText, Plus } from 'lucide-react';
import { X, AlertTriangle, FileText, Plus } from 'lucide-react';
import { Patient, PatientNote, GestionType } from '../../types';
import { useSupabase } from '../../hooks/useSupabase';

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
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<GestionType>('general');
  const [loading, setLoading] = useState(false);
  const { getPatientNotes, createPatientNote } = useSupabase();

  useEffect(() => {
    if (patient && isOpen) {
      loadNotes();
    }
  }, [patient, isOpen]);

  const loadNotes = async () => {
    if (!patient) return;
    setLoading(true);
    const patientNotes = await getPatientNotes(patient.id);
    setNotes(patientNotes);
    setLoading(false);
  };

  const handleAddNote = async () => {
    if (!patient || !newNote.trim()) return;

    const noteData = {
      patient_id: patient.id,
      user_name: 'Dr. Juan Pérez',
      user_role: 'Gestor de Estadía',
      tipo_gestion: noteType,
      nota: newNote.trim(),
      fecha_gestion: new Date().toISOString(),
    };

    const createdNote = await createPatientNote(noteData);
    if (createdNote) {
      setNotes([createdNote, ...notes]);
      setNewNote('');
      setNoteType('general');
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'bajo': return 'text-green-600 bg-green-100';
      case 'medio': return 'text-yellow-600 bg-yellow-100';
      case 'alto': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGestionTypeColor = (type: GestionType) => {
    switch (type) {
      case 'social': return 'bg-purple-100 text-purple-800';
      case 'clinica': return 'bg-blue-100 text-blue-800';
      case 'administrativa': return 'bg-green-100 text-green-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Detalles del Paciente: {patient.nombre} {patient.apellido_paterno}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
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
                Notas y Gestiones ({notes.length})
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
                    <dt className="text-sm font-medium text-gray-500">Edad / Sexo</dt>
                    <dd className="text-sm text-gray-900">{patient.edad} años • {patient.sexo}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Previsión</dt>
                    <dd className="text-sm text-gray-900">{patient.prevision}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Estadía Hospitalaria</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Servicio Clínico</dt>
                    <dd className="text-sm text-gray-900">{patient.servicio_clinico}</dd>
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
                      Global: {patient.nivel_riesgo_global.charAt(0).toUpperCase() + patient.nivel_riesgo_global.slice(1)}
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
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="mt-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Agregar Nueva Gestión</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Gestión
                    </label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as GestionType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="social">Social</option>
                      <option value="clinica">Clínica</option>
                      <option value="administrativa">Administrativa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nota de Gestión
                    </label>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ingrese los detalles de la gestión realizada..."
                    />
                  </div>
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Gestión
                  </button>
                </div>
              </div>

              <div className="space-y-4">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};