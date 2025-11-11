import React, { useState, useEffect } from 'react';
import { Brain, AlertTriangle, TrendingUp, Users, Home, DollarSign } from 'lucide-react';
import { Patient, SocialRiskPrediction } from '../../types';

interface SocialRiskPredictorProps {
  patients: Patient[];
}

export const SocialRiskPredictor: React.FC<SocialRiskPredictorProps> = ({ patients }) => {
  const [predictions, setPredictions] = useState<SocialRiskPrediction[]>([]);
  // const [selectedPatient, setSelectedPatient] = useState<string>('');

  // Simulación del sistema de predicción de riesgo social
  const calculateSocialRisk = (patient: Patient): SocialRiskPrediction => {
    let score = 0;
    const factores: string[] = [];
    const recomendaciones: string[] = [];

    // Factores de edad
    if (patient.edad > 75) {
      score += 25;
      factores.push('Edad avanzada (>75 años)');
      recomendaciones.push('Evaluación geriátrica integral');
    } else if (patient.edad > 65) {
      score += 15;
      factores.push('Adulto mayor (65-75 años)');
    }

    // Factores de estadía prolongada
    if (patient.dias_hospitalizacion > 15) {
      score += 30;
      factores.push('Estadía prolongada (>15 días)');
      recomendaciones.push('Evaluación de barreras de alta');
    } else if (patient.dias_hospitalizacion > 10) {
      score += 20;
      factores.push('Estadía extendida (10-15 días)');
    }

    // Factores de previsión
    if (patient.prevision.includes('FONASA A') || patient.prevision.includes('FONASA B')) {
      score += 20;
      factores.push('Previsión social básica');
      recomendaciones.push('Evaluación socioeconómica');
    }

    // Factores por servicio clínico
    if (patient.servicio_clinico === 'UCI' || patient.servicio_clinico === 'Neurología') {
      score += 25;
      factores.push('Servicio de alta complejidad');
      recomendaciones.push('Planificación de cuidados post-alta');
    }

    // Factores de riesgo existentes
    if (patient.riesgo_social === 'alto') {
      score += 35;
      factores.push('Riesgo social alto identificado');
      recomendaciones.push('Intervención social inmediata');
    } else if (patient.riesgo_social === 'medio') {
      score += 20;
      factores.push('Riesgo social medio');
    }

    // Determinar nivel de riesgo
    let nivel_riesgo: 'bajo' | 'medio' | 'alto' | 'critico';
    if (score >= 80) {
      nivel_riesgo = 'critico';
      recomendaciones.push('Activación de protocolo de alta compleja');
    } else if (score >= 60) {
      nivel_riesgo = 'alto';
      recomendaciones.push('Evaluación social prioritaria');
    } else if (score >= 40) {
      nivel_riesgo = 'medio';
      recomendaciones.push('Seguimiento social programado');
    } else {
      nivel_riesgo = 'bajo';
    }

    // Agregar recomendaciones generales
    if (factores.length > 0) {
      recomendaciones.push('Coordinación con equipo multidisciplinario');
    }

    return {
      patient_id: patient.id,
      score,
      nivel_riesgo,
      factores_riesgo: factores,
      recomendaciones,
      fecha_evaluacion: new Date().toISOString(),
    };
  };

  useEffect(() => {
    const newPredictions = patients
      .filter(p => p.estado === 'activo')
      .map(calculateSocialRisk)
      .sort((a, b) => b.score - a.score);
    
    setPredictions(newPredictions);
  }, [patients]);

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case 'critico': return 'bg-red-600 text-white';
      case 'alto': return 'bg-red-100 text-red-800';
      case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'bajo': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (nivel: string) => {
    switch (nivel) {
      case 'critico': return AlertTriangle;
      case 'alto': return AlertTriangle;
      case 'medio': return TrendingUp;
      case 'bajo': return Users;
      default: return Users;
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.nombre} ${patient.apellido_paterno}` : 'Paciente no encontrado';
  };

  const getPatient = (patientId: string) => {
    return patients.find(p => p.id === patientId);
  };

  const highRiskCount = predictions.filter(p => p.nivel_riesgo === 'alto' || p.nivel_riesgo === 'critico').length;
  const avgRiskScore = Math.round(predictions.reduce((sum, p) => sum + p.score, 0) / predictions.length) || 0;

  return (
    <div className="space-y-6">
      {/* Header del Sistema de Predicción */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center">
          <Brain className="h-8 w-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Sistema de Predicción de Riesgo Social</h2>
            <p className="text-purple-100 mt-1">
              Identificación temprana de pacientes con factores sociales críticos
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <div>
                <p className="text-2xl font-bold">{highRiskCount}</p>
                <p className="text-sm text-purple-100">Pacientes Alto Riesgo</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 mr-2" />
              <div>
                <p className="text-2xl font-bold">{avgRiskScore}</p>
                <p className="text-sm text-purple-100">Score Promedio</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 mr-2" />
              <div>
                <p className="text-2xl font-bold">{predictions.length}</p>
                <p className="text-sm text-purple-100">Evaluaciones Activas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Predicciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Evaluaciones de Riesgo Social ({predictions.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Ordenado por nivel de riesgo descendente
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {predictions.map((prediction) => {
            const patient = getPatient(prediction.patient_id);
            const RiskIcon = getRiskIcon(prediction.nivel_riesgo);
            
            return (
              <div key={prediction.patient_id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="text-lg font-medium text-gray-900">
                        {getPatientName(prediction.patient_id)}
                      </h4>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(prediction.nivel_riesgo)}`}>
                        <RiskIcon className="h-4 w-4 mr-1" />
                        {prediction.nivel_riesgo.charAt(0).toUpperCase() + prediction.nivel_riesgo.slice(1)}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        Score: {prediction.score}
                      </span>
                    </div>
                    
                    {patient && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{patient.edad} años • {patient.servicio_clinico}</span>
                        </div>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-1" />
                          <span>{patient.dias_hospitalizacion} días hospitalizado</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span>{patient.prevision}</span>
                        </div>
                      </div>
                    )}
                    
                    {prediction.factores_riesgo.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Factores de Riesgo Identificados:</h5>
                        <div className="flex flex-wrap gap-2">
                          {prediction.factores_riesgo.map((factor, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {prediction.recomendaciones.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Recomendaciones:</h5>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {prediction.recomendaciones.map((recomendacion, index) => (
                            <li key={index}>{recomendacion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6 text-right">
                    <p className="text-xs text-gray-500">
                      Evaluado: {new Date(prediction.fecha_evaluacion).toLocaleDateString('es-CL')}
                    </p>
                    <button
                      onClick={() => setSelectedPatient(prediction.patient_id)}
                      className="mt-2 px-3 py-1 text-sm border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {predictions.length === 0 && (
            <div className="text-center py-12">
              <Brain className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay evaluaciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                No hay pacientes activos para evaluar.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Metodología del Sistema */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metodología de Evaluación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Factores Evaluados</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Edad del paciente (&gt;65 años: +15-25 puntos)
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Días de hospitalización (&gt;10 días: +20-30 puntos)
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Tipo de previsión social (+20 puntos FONASA A/B)
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Servicio clínico de alta complejidad (+25 puntos)
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Evaluación de riesgo social previa (+20-35 puntos)
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Niveles de Riesgo</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mr-3">
                  Bajo (0-39)
                </span>
                <span className="text-sm text-gray-600">Seguimiento estándar</span>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 mr-3">
                  Medio (40-59)
                </span>
                <span className="text-sm text-gray-600">Seguimiento programado</span>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 mr-3">
                  Alto (60-79)
                </span>
                <span className="text-sm text-gray-600">Evaluación prioritaria</span>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white mr-3">
                  Crítico (80+)
                </span>
                <span className="text-sm text-gray-600">Protocolo de alta compleja</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};