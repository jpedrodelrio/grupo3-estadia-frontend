import React, { useState } from 'react';
import { X, FileSpreadsheet, AlertCircle, CheckCircle, Eye, Send, ArrowLeft, Download, Bed } from 'lucide-react';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { fileTypeConfigs, getFileTypeConfig } from '../../config/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  
  const {
    currentStep,
    selectedFile,
    csvData,
    previewData,
    uploadMessage,
    detectedColumns,
    processedSheetName,
    processingStatus,
    isXlsmFile,
    usedLocalProcessing,
    selectedFileType,
    handleFileUpload,
    handleSendToBackend,
    downloadGeneratedCSV,
    resetUpload,
    goBackToUpload,
    setSelectedFileType,
    clearFileOnly,
  } = useFileProcessor();

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


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
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
          {/* Paso 1: Carga de archivo */}
          {currentStep === 'upload' && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Seleccionar Tipo de Archivo</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Elija el tipo de archivo que desea procesar:
                </p>
                
                {/* Selector de tipo de archivo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {fileTypeConfigs.map((config) => {
                    const IconComponent = config.icon === 'Bed' ? Bed : FileSpreadsheet;
                    const isSelected = selectedFileType === config.id;
                    
                    return (
                      <button
                        key={config.id}
                        onClick={() => {
                          console.log('🔧 Debug - Cambiando tipo de archivo en modal:', {
                            from: selectedFileType,
                            to: config.id,
                            currentFile: selectedFile?.name
                          });
                          setSelectedFileType(config.id);
                          // Limpiar archivo seleccionado cuando cambias el tipo (sin resetear el tipo)
                          if (selectedFile) {
                            console.log('🔧 Debug - Limpiando archivo al cambiar tipo');
                            clearFileOnly();
                          }
                        }}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          isSelected 
                            ? `border-${config.color}-400 bg-${config.color}-50` 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <IconComponent className={`h-6 w-6 mr-3 ${
                            isSelected ? `text-${config.color}-600` : 'text-gray-400'
                          }`} />
                          <div>
                            <h4 className={`font-medium ${
                              isSelected ? `text-${config.color}-800` : 'text-gray-900'
                            }`}>
                              {config.name}
                            </h4>
                            <p className={`text-sm mt-1 ${
                              isSelected ? `text-${config.color}-700` : 'text-gray-600'
                            }`}>
                              {config.description}
                            </p>
                            <p className={`text-xs mt-2 ${
                              isSelected ? `text-${config.color}-600` : 'text-gray-500'
                            }`}>
                              Formatos: {config.acceptedFormats.join(', ')} • Máx: {config.maxSize}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Seleccionar Archivo</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedFileType ? (
                    <>
                      Seleccione un archivo para <span className="font-medium">{getFileTypeConfig(selectedFileType)?.name}</span>.
                    </>
                  ) : (
                    'Primero seleccione el tipo de archivo arriba.'
                  )}
                </p>
              </div>

              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
                  !selectedFileType 
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                    : dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                } transition-colors`}
                onDragEnter={selectedFileType ? handleDrag : undefined}
                onDragLeave={selectedFileType ? handleDrag : undefined}
                onDragOver={selectedFileType ? handleDrag : undefined}
                onDrop={selectedFileType ? handleDrop : undefined}
              >
                <FileSpreadsheet className={`mx-auto h-12 w-12 ${!selectedFileType ? 'text-gray-300' : 'text-gray-400'}`} />
                <div className="mt-4">
                  <p className={`text-lg font-medium ${!selectedFileType ? 'text-gray-400' : 'text-gray-900'}`}>
                    {!selectedFileType 
                      ? 'Seleccione primero el tipo de archivo'
                      : 'Arrastre su archivo aquí o haga clic para seleccionar'
                    }
                  </p>
                  {selectedFileType && (
                    <>
                      <p className="text-sm text-gray-500 mt-1">
                        Formatos soportados: {getFileTypeConfig(selectedFileType)?.acceptedFormats.join(', ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Tamaño máximo: {getFileTypeConfig(selectedFileType)?.maxSize}
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept={selectedFileType ? getFileTypeConfig(selectedFileType)?.acceptedFormats.join(',') : ''}
                  disabled={!selectedFileType}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            </>
          )}

          {/* Paso 2: Procesamiento de archivo .xlsm */}
          {currentStep === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-900 mb-2">Procesando archivo .xlsm</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                {processingStatus}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-blue-800">
                      Archivo: {selectedFile?.name}
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      El archivo está siendo procesado para extraer los datos de la primera hoja y convertirlos a formato CSV. 
                      Si el servidor no está disponible, se procesará localmente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Preview de datos */}
          {currentStep === 'preview' && (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Vista Previa de Datos</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Archivo: <span className="font-medium">{selectedFile?.name}</span>
                      {processedSheetName && (
                        <span className="ml-2 text-blue-600">
                          • Hoja: <span className="font-medium">{processedSheetName}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={goBackToUpload}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Cambiar Archivo
                  </button>
                </div>
              </div>

              {/* Indicador de columnas críticas */}
              {detectedColumns.length > 0 && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800">
                        Columnas críticas detectadas
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        Se encontraron las siguientes columnas requeridas por el servidor:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {detectedColumns.map((col, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Indicador de archivo procesado desde .xlsm */}
              {isXlsmFile && (
                <div className={`mb-4 p-4 border rounded-lg ${
                  usedLocalProcessing 
                    ? 'bg-orange-50 border-orange-200' 
                    : 'bg-purple-50 border-purple-200'
                }`}>
                  <div className="flex items-center">
                    <CheckCircle className={`h-5 w-5 mr-2 ${
                      usedLocalProcessing ? 'text-orange-600' : 'text-purple-600'
                    }`} />
                    <div>
                      <h4 className={`text-sm font-medium ${
                        usedLocalProcessing ? 'text-orange-800' : 'text-purple-800'
                      }`}>
                        Archivo .xlsm procesado exitosamente
                        {usedLocalProcessing && ' (procesamiento local)'}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        usedLocalProcessing ? 'text-orange-700' : 'text-purple-700'
                      }`}>
                        {usedLocalProcessing 
                          ? 'El archivo fue procesado localmente usando JavaScript. El servidor Python no estaba disponible.'
                          : 'El archivo Excel con macros ha sido procesado por el servidor Python y convertido a CSV.'
                        }
                        {processedSheetName && ` Hoja procesada: "${processedSheetName}"`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Indicador de hoja correcta */}
              {processedSheetName === 'Respuesta Formulario' && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">
                        Hoja correcta encontrada
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Se está procesando la hoja "Respuesta Formulario" como se requiere.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Eye className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Vista previa (primeras 10 filas)
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Columnas normalizadas para el servidor
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {previewData.length > 0 && (
                          Array.isArray(previewData[0]) 
                            ? previewData[0].map((_, index) => (
                                <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Columna {index + 1}
                                </th>
                              ))
                            : Object.keys(previewData[0]).map((key, index) => (
                                <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {key}
                                </th>
                              ))
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          {Array.isArray(row) 
                            ? row.map((value, colIndex) => (
                                <td key={colIndex} className="px-4 py-3 text-sm text-gray-900">
                                  {String(value || '')}
                                </td>
                              ))
                            : Object.values(row).map((value, colIndex) => (
                                <td key={colIndex} className="px-4 py-3 text-sm text-gray-900">
                                  {String(value || '')}
                                </td>
                              ))
                          }
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Información del CSV generado */}
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-5 w-5 text-gray-600 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-800">
                        CSV Generado
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Archivo procesado y listo para envío. 
                        {csvData && ` Tamaño: ${Math.round(csvData.length / 1024)} KB`}
                        {isXlsmFile && (
                          <span className="ml-2 text-blue-600">
                            • Procesado {usedLocalProcessing ? 'localmente' : 'con servidor Python'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Formato: CSV con separador {usedLocalProcessing ? 'coma' : 'punto y coma'}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={downloadGeneratedCSV}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar CSV
                </button>
                
                <div className="space-x-3">
                  <button
                    onClick={goBackToUpload}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSendToBackend}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar al Servidor
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Paso 4: Enviando */}
          {currentStep === 'sending' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-900">Enviando archivo...</p>
              <p className="text-sm text-gray-500 mt-1">
                {uploadMessage}
              </p>
            </div>
          )}

          {/* Paso 5: Éxito */}
          {currentStep === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">¡Envío exitoso!</p>
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

          {/* Paso 6: Error */}
          {currentStep === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Error</p>
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