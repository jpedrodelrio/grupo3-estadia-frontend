import React from 'react';
import { X, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { PrediccionNuevoPacienteResponse } from '../../types';

interface PrediccionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultados: PrediccionNuevoPacienteResponse[];
}

export const PrediccionResultModal: React.FC<PrediccionResultModalProps> = ({
  isOpen,
  onClose,
  resultados,
}) => {
  if (!isOpen) return null;

  const getRiesgoColor = (categoria: string) => {
    switch (categoria) {
      case 'Alta':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Baja':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiesgoIcon = (categoria: string) => {
    switch (categoria) {
      case 'Alta':
        return AlertTriangle;
      case 'Media':
        return TrendingUp;
      case 'Baja':
        return CheckCircle;
      default:
        return CheckCircle;
    }
  };

  const formatProbabilidad = (prob: number): string => {
    return `${(prob * 100).toFixed(2)}%`;
  };

  const getProbabilidadColor = (prob: number): string => {
    if (prob >= 0.66) return 'text-red-600 font-bold';
    if (prob >= 0.33) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Resultados de Predicción de Sobre-Estadía
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {resultados.map((resultado, index) => {
            const Icon = getRiesgoIcon(resultado.riesgo_categoria);
            
            return (
              <div
                key={index}
                className={`border rounded-lg p-6 ${getRiesgoColor(resultado.riesgo_categoria).split(' ')[0]} bg-opacity-10`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getRiesgoColor(resultado.riesgo_categoria)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {resultado.rut}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {resultado.servicio_clinico} • {resultado.edad} años • {resultado.sexo}
                      </p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getRiesgoColor(resultado.riesgo_categoria)}`}>
                    {resultado.riesgo_categoria}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Probabilidad de Sobre-Estadía
                    </div>
                    <div className={`text-3xl font-bold ${getProbabilidadColor(resultado.probabilidad_sobre_estadia)}`}>
                      {formatProbabilidad(resultado.probabilidad_sobre_estadia)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Rango: 0% - 100%
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-sm font-medium text-gray-500 mb-2">
                      Información del Paciente
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Previsión:</span>
                        <span className="font-medium">{resultado.prevision}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Días estimados:</span>
                        <span className="font-medium">{resultado.fecha_estimada_de_alta}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Código GRD:</span>
                        <span className="font-medium">{resultado.codigo_grd}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Riesgo Social</div>
                    <div className="text-sm font-medium">
                      {typeof resultado.riesgo_social === 'number' 
                        ? ['Bajo', 'Medio', 'Alto'][resultado.riesgo_social] || 'N/A'
                        : resultado.riesgo_social}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Riesgo Clínico</div>
                    <div className="text-sm font-medium">
                      {typeof resultado.riesgo_clinico === 'number' 
                        ? ['Bajo', 'Medio', 'Alto'][resultado.riesgo_clinico] || 'N/A'
                        : resultado.riesgo_clinico}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Riesgo Admin.</div>
                    <div className="text-sm font-medium">
                      {typeof resultado.riesgo_administrativo === 'number' 
                        ? ['Bajo', 'Medio', 'Alto'][resultado.riesgo_administrativo] || 'N/A'
                        : resultado.riesgo_administrativo}
                    </div>
                  </div>
                </div>

                {resultado.created_at && (
                  <div className="mt-4 text-xs text-gray-500">
                    Predicción generada: {new Date(resultado.created_at).toLocaleString('es-CL')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

