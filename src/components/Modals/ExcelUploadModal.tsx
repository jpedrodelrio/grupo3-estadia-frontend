import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Eye, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Patient } from '../../types';
import { useCSVUpload } from '../../hooks/usePatientsAPI';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientsImported: (patients: Patient[]) => void;
}

interface ColumnMapping {
  excelColumn: string;
  patientField: keyof Patient | '';
}

interface ExcelData {
  headers: string[];
  rows: any[][];
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onPatientsImported,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'import'>('upload');
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [previewData, setPreviewData] = useState<Patient[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string>('');
  const [originalFilename, setOriginalFilename] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadCSV, loading: uploadLoading, error: uploadError, success: uploadSuccess } = useCSVUpload();

  // Campos requeridos para un paciente
  const requiredFields: (keyof Patient)[] = [
    'rut', 'nombre', 'apellido_paterno', 'edad', 'sexo', 
    'servicio_clinico', 'diagnostico_principal', 'prevision'
  ];

  // Campos opcionales con valores por defecto
  const defaultValues: Partial<Patient> = {
    apellido_materno: '',
    fecha_ingreso: new Date().toISOString(),
    fecha_estimada_alta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días después
    dias_hospitalizacion: 0,
    riesgo_social: 'bajo',
    riesgo_clinico: 'bajo',
    riesgo_administrativo: 'bajo',
    nivel_riesgo_global: 'verde',
    estado: 'activo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOriginalFilename(file.name.replace(/\.[^/.]+$/, "")); // Remover extensión

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          setErrors(['El archivo Excel debe tener al menos una fila de encabezados y una fila de datos.']);
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        setExcelData({ headers, rows });
        setStep('preview');
        setErrors([]);
        
        // Generar CSV directamente
        generateCSV(headers, rows);
        
      } catch (error) {
        setErrors(['Error al leer el archivo Excel. Asegúrate de que sea un archivo válido.']);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Función para generar CSV desde los datos de Excel
  const generateCSV = (headers: string[], rows: any[][]) => {
    try {
      // Crear CSV con formato específico para el backend
      // El backend espera columnas: RUN, marca_temporal, fecha_ingreso, etc.
      const csvHeaders = [
        'RUN',
        'marca_temporal', 
        'fecha_ingreso',
        'nombre',
        'edad',
        'sexo',
        'servicio',
        'diagnostico',
        'prevision',
        'cama',
        'fecha_alta',
        'dias_hospitalizacion'
      ];
      
      const csvRows = [csvHeaders.join(';')];
      
      rows.forEach((row, index) => {
        // Mapear los datos del Excel a las columnas esperadas por el backend
        const csvRow = [
          row[0] || `12345678-${index}`, // RUN (primera columna o generar uno)
          new Date().toISOString().replace('T', ' ').substring(0, 19), // marca_temporal (ahora)
          row[1] || new Date().toISOString().split('T')[0], // fecha_ingreso (segunda columna o hoy)
          row[2] || `Paciente ${index + 1}`, // nombre (tercera columna o generar)
          row[3] || '30', // edad (cuarta columna o 30)
          row[4] || 'M', // sexo (quinta columna o M)
          row[5] || 'Medicina Interna', // servicio (sexta columna o default)
          row[6] || 'Consulta General', // diagnostico (séptima columna o default)
          row[7] || 'FONASA', // prevision (octava columna o FONASA)
          row[8] || `CAMA${index + 1}`, // cama (novena columna o generar)
          row[9] || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // fecha_alta (décima columna o +7 días)
          row[10] || '7' // dias_hospitalizacion (undécima columna o 7)
        ];
        
        csvRows.push(csvRow.join(';'));
      });
      
      const csvContent = csvRows.join('\n');
      setCsvData(csvContent);
      
      // Crear datos de preview para mostrar (solo las primeras 10 filas)
      const previewPatients = rows.slice(0, 10).map((row, index) => ({
        id: `preview-${index}`,
        rut: row[0] || `12345678-${index}`,
        nombre: row[2] || `Paciente ${index + 1}`,
        apellido_paterno: '',
        apellido_materno: '',
        edad: parseInt(row[3]) || 30,
        sexo: row[4] || 'M',
        servicio_clinico: row[5] || 'Medicina Interna',
        diagnostico_principal: row[6] || 'Consulta General',
        prevision: row[7] || 'FONASA',
        fecha_ingreso: new Date().toISOString(),
        fecha_estimada_alta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        dias_hospitalizacion: parseInt(row[10]) || 7,
        riesgo_social: 'bajo',
        riesgo_clinico: 'bajo',
        riesgo_administrativo: 'bajo',
        nivel_riesgo_global: 'verde',
        estado: 'activo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      
      setPreviewData(previewPatients);
      
    } catch (error) {
      setErrors(['Error al generar CSV: ' + (error as Error).message]);
    }
  };

  const handleColumnMapping = () => {
    if (!excelData) return;

    // Validar que todos los campos requeridos estén mapeados
    const mappedFields = columnMapping.map(m => m.patientField).filter(field => field !== '');
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
    
    if (missingFields.length > 0) {
      setErrors([`Faltan campos requeridos: ${missingFields.join(', ')}`]);
      return;
    }

    // Procesar datos
    const processedPatients: Patient[] = [];
    const newErrors: string[] = [];

    excelData.rows.forEach((row, rowIndex) => {
      try {
        const patient: Partial<Patient> = { ...defaultValues };

        columnMapping.forEach(mapping => {
          if (mapping.patientField && mapping.excelColumn) {
            const columnIndex = excelData.headers.indexOf(mapping.excelColumn);
            if (columnIndex !== -1 && row[columnIndex] !== undefined) {
              const value = row[columnIndex];
              
              // Validaciones específicas por campo
              switch (mapping.patientField) {
                case 'edad':
                  const age = parseInt(value);
                  if (isNaN(age) || age < 0 || age > 120) {
                    newErrors.push(`Fila ${rowIndex + 2}: Edad inválida (${value})`);
                    return;
                  }
                  patient[mapping.patientField] = age;
                  break;
                case 'sexo':
                  if (!['M', 'F'].includes(value?.toString().toUpperCase())) {
                    newErrors.push(`Fila ${rowIndex + 2}: Sexo debe ser M o F (${value})`);
                    return;
                  }
                  patient[mapping.patientField] = value?.toString().toUpperCase() as 'M' | 'F';
                  break;
                case 'riesgo_social':
                case 'riesgo_clinico':
                case 'riesgo_administrativo':
                  if (!['bajo', 'medio', 'alto'].includes(value?.toString().toLowerCase())) {
                    newErrors.push(`Fila ${rowIndex + 2}: ${mapping.patientField} debe ser bajo, medio o alto (${value})`);
                    return;
                  }
                  patient[mapping.patientField] = value?.toString().toLowerCase() as 'bajo' | 'medio' | 'alto';
                  break;
                case 'nivel_riesgo_global':
                  if (!['verde', 'amarillo', 'rojo'].includes(value?.toString().toLowerCase())) {
                    newErrors.push(`Fila ${rowIndex + 2}: Nivel de riesgo debe ser verde, amarillo o rojo (${value})`);
                    return;
                  }
                  patient[mapping.patientField] = value?.toString().toLowerCase() as 'verde' | 'amarillo' | 'rojo';
                  break;
                case 'estado':
                  if (!['activo', 'alta_pendiente', 'dado_alta'].includes(value?.toString().toLowerCase())) {
                    newErrors.push(`Fila ${rowIndex + 2}: Estado debe ser activo, alta_pendiente o dado_alta (${value})`);
                    return;
                  }
                  patient[mapping.patientField] = value?.toString().toLowerCase() as 'activo' | 'alta_pendiente' | 'dado_alta';
                  break;
                case 'fecha_ingreso':
                case 'fecha_estimada_alta':
                  const date = new Date(value);
                  if (isNaN(date.getTime())) {
                    newErrors.push(`Fila ${rowIndex + 2}: Fecha inválida en ${mapping.patientField} (${value})`);
                    return;
                  }
                  patient[mapping.patientField] = date.toISOString();
                  break;
                case 'dias_hospitalizacion':
                  const days = parseInt(value);
                  if (isNaN(days) || days < 0) {
                    newErrors.push(`Fila ${rowIndex + 2}: Días de hospitalización inválidos (${value})`);
                    return;
                  }
                  patient[mapping.patientField] = days;
                  break;
                default:
                  patient[mapping.patientField] = value?.toString() || '';
              }
            }
          }
        });

        // Generar ID único
        patient.id = `excel_${Date.now()}_${rowIndex}`;

        // Validar RUT (formato básico)
        if (patient.rut && !/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/.test(patient.rut)) {
          newErrors.push(`Fila ${rowIndex + 2}: RUT inválido (${patient.rut})`);
          return;
        }

        processedPatients.push(patient as Patient);
      } catch (error) {
        newErrors.push(`Fila ${rowIndex + 2}: Error al procesar datos`);
      }
    });

    setPreviewData(processedPatients);
    setErrors(newErrors);
    setStep('preview');
  };

  const handleImport = async () => {
    try {
      // Enviar CSV al backend
      const result = await uploadCSV(csvData, originalFilename);
      
      if (result.success) {
        // También importar los datos localmente para mostrar en la interfaz
        onPatientsImported(previewData);
        onClose();
        resetModal();
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
    }
  };

  const resetModal = () => {
    setStep('upload');
    setExcelData(null);
    setPreviewData([]);
    setErrors([]);
    setCsvData('');
    setOriginalFilename('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Importar Pacientes desde Excel
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Indicador de pasos */}
        <div className="mt-6 mb-6">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step === 'upload' ? 'text-blue-600' : step === 'preview' || step === 'import' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-100' : step === 'preview' || step === 'import' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Upload className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium">1. Subir Archivo</span>
            </div>
            <div className={`w-8 h-1 ${step === 'preview' || step === 'import' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : step === 'import' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-blue-100' : step === 'import' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Eye className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium">2. Vista Previa</span>
            </div>
          </div>
        </div>

        {/* Errores */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Errores encontrados:</h3>
            </div>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Paso 1: Subir archivo */}
        {step === 'upload' && (
          <div className="mt-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Subir archivo Excel
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecciona un archivo .xlsx, .xls o .xlsm con los datos de los pacientes
              </p>
              <div className="mt-2 text-xs text-gray-400">
                Formatos soportados: Excel 2007+ (.xlsx), Excel 97-2003 (.xls), Excel con macros (.xlsm)
              </div>
              <div className="mt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.xlsm"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Archivo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2: Mapear columnas */}
        {/* Paso 2: Vista previa */}
        {step === 'preview' && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Vista Previa de Datos
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                  {excelData?.rows.length || 0} filas procesadas
                </div>
                <button
                  onClick={() => {
                    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `${originalFilename || 'datos'}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Descargar CSV
                </button>
              </div>
            </div>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    CSV generado con formato compatible
                  </p>
                  <p className="text-sm text-blue-700">
                    El archivo Excel se ha convertido al formato esperado por el backend (RUN, marca_temporal, fecha_ingreso, etc.)
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    <strong>Destino:</strong> Backend de producción (18.216.167.127/gestion/ingest/csv)
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diagnóstico
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Riesgo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.slice(0, 10).map((patient, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.nombre} {patient.apellido_paterno}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.rut} • {patient.edad} años
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.servicio_clinico}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {patient.diagnostico_principal.substring(0, 50)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          patient.nivel_riesgo_global === 'verde' ? 'bg-green-100 text-green-800' :
                          patient.nivel_riesgo_global === 'amarillo' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {patient.nivel_riesgo_global.charAt(0).toUpperCase() + patient.nivel_riesgo_global.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {previewData.length > 10 && (
              <p className="mt-2 text-sm text-gray-500 text-center">
                Mostrando los primeros 10 de {previewData.length} pacientes
              </p>
            )}

            {/* Mensajes de éxito o error */}
            {uploadSuccess && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      CSV enviado exitosamente al backend de producción
                    </p>
                    <p className="text-sm text-green-700">
                      El archivo se ha procesado en el servidor de producción (18.216.167.127)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      Error al enviar CSV
                    </p>
                    <p className="text-sm text-red-700">
                      {uploadError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Volver
              </button>
              <button
                onClick={handleImport}
                disabled={errors.length > 0 || uploadLoading}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploadLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando CSV...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Enviar a Backend de Producción
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
