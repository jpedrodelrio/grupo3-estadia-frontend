import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(file.type)) {
      setUploadStatus('error');
      setUploadMessage('Tipo de archivo no válido. Por favor, seleccione un archivo Excel (.xlsx, .xls) o CSV.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadStatus('error');
      setUploadMessage('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.');
      return;
    }

    setUploadStatus('uploading');
    setUploadMessage('Procesando archivo...');

    // Simulate file processing
    setTimeout(() => {
      setUploadStatus('success');
      setUploadMessage(`Archivo "${file.name}" cargado exitosamente. Se procesaron los datos y se actualizó la base de datos.`);
    }, 2000);
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setUploadMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Cargar Datos desde Excel/CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Formato de Datos Requerido</h3>
            <p className="text-sm text-gray-600 mb-4">
              El archivo debe contener las siguientes columnas (en cualquier orden):
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>• RUT</div>
                <div>• Nombre</div>
                <div>• Apellido Paterno</div>
                <div>• Apellido Materno</div>
                <div>• Edad</div>
                <div>• Sexo (M/F)</div>
                <div>• Servicio Clínico</div>
                <div>• Fecha Ingreso</div>
                <div>• Fecha Estimada Alta</div>
                <div>• Diagnóstico Principal</div>
                <div>• Previsión</div>
                <div>• Riesgo Social (bajo/medio/alto)</div>
                <div>• Riesgo Clínico (bajo/medio/alto)</div>
                <div>• Riesgo Administrativo (bajo/medio/alto)</div>
              </div>
            </div>
          </div>

          {uploadStatus === 'idle' && (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              } hover:border-blue-400 hover:bg-blue-50 transition-colors`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <p className="text-lg font-medium text-gray-900">
                  Arrastre su archivo aquí o haga clic para seleccionar
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Formatos soportados: Excel (.xlsx, .xls), CSV (.csv)
                </p>
                <p className="text-sm text-gray-500">
                  Tamaño máximo: 10MB
                </p>
              </div>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.csv"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}

          {uploadStatus === 'uploading' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-900">Procesando archivo...</p>
              <p className="text-sm text-gray-500 mt-1">
                Por favor, espere mientras validamos y cargamos los datos.
              </p>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">¡Carga exitosa!</p>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                {uploadMessage}
              </p>
              <div className="space-x-3">
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cargar Otro Archivo
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Error en la carga</p>
              <p className="text-sm text-red-600 mb-6 max-w-md mx-auto">
                {uploadMessage}
              </p>
              <button
                onClick={resetUpload}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Intentar Nuevamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};