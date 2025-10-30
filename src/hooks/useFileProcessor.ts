import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { apiUrls, getFileTypeConfig } from '../config/api';



export interface FileProcessingState {
  currentStep: 'upload' | 'processing' | 'preview' | 'sending' | 'success' | 'error';
  selectedFile: File | null;
  csvData: string;
  previewData: any[];
  uploadMessage: string;
  detectedColumns: string[];
  processedSheetName: string;
  processingStatus: string;
  isXlsmFile: boolean;
  usedLocalProcessing: boolean;
  selectedFileType: string | null;
}

export interface FileProcessorActions {
  handleFileUpload: (file: File, fileTypeId?: string) => Promise<void>;
  handleSendToBackend: () => Promise<void>;
  downloadGeneratedCSV: () => void;
  resetUpload: () => void;
  goBackToUpload: () => void;
  setSelectedFileType: (fileTypeId: string) => void;
  clearFileOnly: () => void;
}

export const useFileProcessor = (): FileProcessingState & FileProcessorActions => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'preview' | 'sending' | 'success' | 'error'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [processedSheetName, setProcessedSheetName] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isXlsmFile, setIsXlsmFile] = useState<boolean>(false);
  const [usedLocalProcessing, setUsedLocalProcessing] = useState<boolean>(false);
  const [selectedFileType, setSelectedFileType] = useState<string | null>('gestion-estadias');

  const convertExcelDate = useCallback((excelSerial: number): string | null => {
    if (!excelSerial || excelSerial === 0) return null;
    
    try {
      // Excel cuenta desde 1900-01-01, pero tiene un bug conocido (considera 1900 como año bisiesto)
      const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
      
      const days = Math.floor(excelSerial);
      const fractionalPart = excelSerial - days;
      
      // Calcular la fecha base
      const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      
      // Si hay parte fraccionaria, es hora
      if (fractionalPart > 0) {
        const hours = Math.floor(fractionalPart * 24);
        const minutes = Math.floor((fractionalPart * 24 - hours) * 60);
        const seconds = Math.floor(((fractionalPart * 24 - hours) * 60 - minutes) * 60);
        
        date.setHours(hours, minutes, seconds);
      }
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(',', '');
    } catch {
      return null;
    }
  }, []);

  const normalizeColumnNames = useCallback((data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) return data;
    
    // Si es un array de arrays (Excel), convertir a objetos con headers
    if (Array.isArray(data[0])) {
      const headers = data[0] as string[];
      const normalizedHeaders = headers.map(header => 
        header.toLowerCase()
          .replace(/[:\s]+$/, '') // Remover dos puntos y espacios al final
          .replace(/[:\s]+/g, '_') // Reemplazar espacios y dos puntos con guiones bajos
          .replace(/^episodio.*$/, 'episodio') // Normalizar episodio
          .replace(/^rut$/, 'run') // Normalizar RUN
          .replace(/^fecha.*ingreso.*$/, 'fecha_ingreso') // Normalizar fecha ingreso
          .replace(/^marca.*temporal.*$/, 'marca_temporal') // Normalizar marca temporal
      );
      
      return data.slice(1).map(row => {
        const normalizedRow: any = {};
        (row as any[]).forEach((value, index) => {
          normalizedRow[normalizedHeaders[index]] = value;
        });
        return normalizedRow;
      });
    }
    
    // Si ya es un array de objetos (CSV)
    return data.map(row => {
      const normalizedRow: any = {};
      
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase()
          .replace(/[:\s]+$/, '') // Remover dos puntos y espacios al final
          .replace(/[:\s]+/g, '_') // Reemplazar espacios y dos puntos con guiones bajos
          .replace(/^episodio.*$/, 'episodio') // Normalizar episodio
          .replace(/^rut$/, 'run') // Normalizar RUN
          .replace(/^fecha.*ingreso.*$/, 'fecha_ingreso') // Normalizar fecha ingreso
          .replace(/^marca.*temporal.*$/, 'marca_temporal'); // Normalizar marca temporal
        
        normalizedRow[normalizedKey] = row[key];
      });
      
      return normalizedRow;
    });
  }, []);

  const detectCriticalColumns = useCallback((data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    const columns = Object.keys(data[0]);
    const criticalColumns: string[] = [];
    
    // Buscar columnas críticas
    if (columns.includes('episodio')) criticalColumns.push('episodio');
    if (columns.includes('run')) criticalColumns.push('run');
    if (columns.includes('fecha_ingreso')) criticalColumns.push('fecha_ingreso');
    if (columns.includes('marca_temporal')) criticalColumns.push('marca_temporal');
    
    return criticalColumns;
  }, []);

  const processXlsmWithBackend = useCallback(async (file: File) => {
    // Crear un FormData para enviar el archivo al backend
    const formData = new FormData();
    formData.append('file', file);
    
    setProcessingStatus('Enviando archivo al procesador...');
    
    // Enviar archivo al backend para procesamiento con Python
    const response = await fetch(apiUrls.processXlsm(), {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error desconocido en el procesamiento');
    }
    
    setProcessingStatus('Procesamiento completado. Cargando datos...');
    
    // Leer el archivo CSV generado
    const csvResponse = await fetch(apiUrls.downloadCsv(result.output_file));
    if (!csvResponse.ok) {
      throw new Error('Error al descargar el archivo CSV procesado');
    }
    
    const csvText = await csvResponse.text();
    
    // Parsear CSV para preview
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';', // Usar punto y coma como separador
      complete: (results: any) => {
        setPreviewData(results.data.slice(0, 10)); // Solo mostrar primeras 10 filas
        
        // Normalizar nombres de columnas para el servidor
        const normalizedData = normalizeColumnNames(results.data);
        
        // Detectar columnas críticas
        const criticalColumns = detectCriticalColumns(normalizedData);
        setDetectedColumns(criticalColumns);
        
        // Convertir a CSV con separador estándar (coma) para el servidor
        const csvString = Papa.unparse(normalizedData, { delimiter: ',' });
        setCsvData(csvString);
        
        setProcessedSheetName(result.processed_sheet);
        setCurrentStep('preview');
      }
    });
  }, [normalizeColumnNames, detectCriticalColumns]);

  const processXlsmLocally = useCallback(async (file: File) => {
    setProcessingStatus('Procesando archivo Excel localmente...');
    
    // Leer el archivo Excel usando XLSX
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Buscar la hoja específica "Respuestas Formulario"
    const targetSheetName = 'Respuestas Formulario';
    let worksheet;
    let processedSheetName = '';
    
    if (workbook.SheetNames.includes(targetSheetName)) {
      worksheet = workbook.Sheets[targetSheetName];
      processedSheetName = targetSheetName;
    } else {
      // Si no encuentra la hoja específica, buscar variaciones del nombre
      const variations = [
        'Respuesta Formulario',
        'respuesta formulario',
        'RespuestaFormulario',
        'respuestaformulario',
        'RESPUESTA FORMULARIO'
      ];
      
      const foundSheet = variations.find(name => workbook.SheetNames.includes(name));
      if (foundSheet) {
        worksheet = workbook.Sheets[foundSheet];
        processedSheetName = foundSheet;
      } else {
        // Si no encuentra ninguna variación, usar la primera hoja y mostrar advertencia
        const firstSheetName = workbook.SheetNames[0];
        worksheet = workbook.Sheets[firstSheetName];
        processedSheetName = firstSheetName;
        setUploadMessage(`Advertencia: No se encontró la hoja "${targetSheetName}". Se está usando la hoja "${firstSheetName}".`);
      }
    }
    
    setProcessingStatus('Convirtiendo datos a CSV...');
    
    // Convertir a JSON con opciones para manejar fechas
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      raw: false, // Esto ayuda a obtener fechas como strings
      dateNF: 'dd/mm/yyyy hh:mm:ss' // Formato de fecha europeo
    });
    
    // Convertir fechas de Excel manualmente
    const processedData = jsonData.map((row: any) => {
      if (Array.isArray(row)) {
        return row.map((cell: any) => {
          // Si es un número que podría ser una fecha de Excel
          if (typeof cell === 'number' && cell > 1 && cell < 50000) {
            const convertedDate = convertExcelDate(cell);
            return convertedDate || cell;
          }
          // Si es un string que parece una fecha ISO, convertirla
          else if (typeof cell === 'string' && cell.includes('-') && cell.includes(' ')) {
            try {
              const date = new Date(cell);
              if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }).replace(',', '');
              }
            } catch {
              // Si falla la conversión, mantener el valor original
            }
          }
          return cell;
        });
      }
      return row;
    });
    
    // Preparar preview (primeras 10 filas)
    setPreviewData(Array.isArray(processedData) ? processedData.slice(0, 10) : [processedData]);
    
    // Normalizar nombres de columnas
    const normalizedData = normalizeColumnNames(processedData);
    
    // Detectar columnas críticas
    const criticalColumns = detectCriticalColumns(normalizedData);
    setDetectedColumns(criticalColumns);
    
    // Convertir a CSV con separador estándar (coma)
    const csvString = Papa.unparse(normalizedData, { delimiter: ',' });
    setCsvData(csvString);
    
    setProcessedSheetName(processedSheetName);
    setCurrentStep('preview');
  }, [convertExcelDate, normalizeColumnNames, detectCriticalColumns]);

  const processXlsmFile = useCallback(async (file: File) => {
    try {
      // Intentar primero con el backend
      try {
        await processXlsmWithBackend(file);
        return;
      } catch (backendError) {
        console.warn('Backend no disponible, usando procesamiento local:', backendError);
        setProcessingStatus('Backend no disponible. Procesando localmente...');
        
        // Fallback: procesamiento local usando XLSX
        setUsedLocalProcessing(true);
        await processXlsmLocally(file);
      }
    } catch (error) {
      console.error('Error procesando archivo .xlsm:', error);
      throw error;
    }
  }, [processXlsmWithBackend, processXlsmLocally]);

  const processFile = useCallback(async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      // Procesar CSV directamente
      const text = await file.text();
      
      // Detectar separador automáticamente
      const delimiter = text.includes(';') ? ';' : ',';
      
      // Parsear para preview
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        delimiter: delimiter,
        complete: (results: any) => {
          setPreviewData(results.data.slice(0, 10)); // Solo mostrar primeras 10 filas
          
          // Normalizar nombres de columnas para el servidor
          const normalizedData = normalizeColumnNames(results.data);
          
          // Detectar columnas críticas
          const criticalColumns = detectCriticalColumns(normalizedData);
          setDetectedColumns(criticalColumns);
          
          // Convertir a CSV con separador estándar (coma)
          const csvString = Papa.unparse(normalizedData, { delimiter: ',' });
          setCsvData(csvString);
        }
      });
    } else {
      // Procesar Excel (.xlsx, .xls, .xlsm)
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Buscar la hoja específica "Respuesta Formulario"
      const targetSheetName = 'Respuesta Formulario';
      let worksheet;
      
      if (workbook.SheetNames.includes(targetSheetName)) {
        worksheet = workbook.Sheets[targetSheetName];
        setProcessedSheetName(targetSheetName);
      } else {
        // Si no encuentra la hoja específica, buscar variaciones del nombre
        const variations = [
          'Respuesta Formulario',
          'respuesta formulario',
          'RespuestaFormulario',
          'respuestaformulario',
          'RESPUESTA FORMULARIO'
        ];
        
        const foundSheet = variations.find(name => workbook.SheetNames.includes(name));
        if (foundSheet) {
          worksheet = workbook.Sheets[foundSheet];
          setProcessedSheetName(foundSheet);
        } else {
          // Si no encuentra ninguna variación, usar la primera hoja y mostrar advertencia
          const firstSheetName = workbook.SheetNames[0];
          worksheet = workbook.Sheets[firstSheetName];
          setProcessedSheetName(firstSheetName);
          setUploadMessage(`Advertencia: No se encontró la hoja "${targetSheetName}". Se está usando la hoja "${firstSheetName}".`);
        }
      }
      
      // Preparar preview (primeras 10 filas)
      const previewJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setPreviewData(Array.isArray(previewJson) ? previewJson.slice(0, 10) : [previewJson]);
      
      // Normalizar nombres de columnas
      const normalizedData = normalizeColumnNames(previewJson);
      
      // Detectar columnas críticas
      const criticalColumns = detectCriticalColumns(normalizedData);
      setDetectedColumns(criticalColumns);
      
      // Convertir a CSV con separador estándar (coma)
      const csvString = Papa.unparse(normalizedData, { delimiter: ',' });
      setCsvData(csvString);
    }
  }, [normalizeColumnNames, detectCriticalColumns]);

  const handleFileUpload = useCallback(async (file: File, fileTypeId?: string) => {
    // Si no se especifica tipo, usar el seleccionado o el primero por defecto
    const typeId = fileTypeId || selectedFileType || 'gestion-estadias';
    const fileTypeConfig = getFileTypeConfig(typeId);
    
    if (!fileTypeConfig) {
      setCurrentStep('error');
      setUploadMessage('Tipo de archivo no válido.');
      return;
    }

    // Validar formato de archivo según configuración
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!fileTypeConfig.acceptedFormats.includes(fileExtension)) {
      setCurrentStep('error');
      setUploadMessage(`Formato de archivo no válido para ${fileTypeConfig.name}. Formatos aceptados: ${fileTypeConfig.acceptedFormats.join(', ')}`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setCurrentStep('error');
      setUploadMessage('El archivo es demasiado grande. El tamaño máximo permitido es 50MB.');
      return;
    }

    setSelectedFile(file);
    setSelectedFileType(typeId);
    
    // Verificar si es un archivo .xlsm
    const isXlsm = file.name.toLowerCase().endsWith('.xlsm');
    setIsXlsmFile(isXlsm);
    
    if (isXlsm) {
      setCurrentStep('processing');
      setProcessingStatus('Preparando archivo para procesamiento...');
      
      try {
        await processXlsmFile(file);
      } catch {
        setCurrentStep('error');
        setUploadMessage('Error al procesar el archivo .xlsm. Por favor, verifique que el archivo no esté corrupto.');
      }
    } else {
      setCurrentStep('preview');
      
      try {
        await processFile(file);
      } catch {
        setCurrentStep('error');
        setUploadMessage('Error al procesar el archivo. Por favor, verifique que el archivo no esté corrupto.');
      }
    }
  }, [processXlsmFile, processFile]);

  const downloadGeneratedCSV = useCallback(() => {
    if (!csvData) return;
    
    // Si es procesamiento local, ya está en formato coma
    // Si es procesamiento con servidor, convertir de coma a punto y coma
    let csvToDownload = csvData;
    if (!usedLocalProcessing) {
      // Convertir de coma a punto y coma para descarga
      csvToDownload = csvData.replace(/,/g, ';');
    }
    
    // Crear un blob con los datos CSV
    const blob = new Blob([csvToDownload], { type: 'text/csv;charset=utf-8;' });
    
    // Crear un enlace de descarga
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generar nombre de archivo basado en el archivo original
    const originalName = selectedFile?.name || 'archivo';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const processingType = usedLocalProcessing ? 'local' : 'servidor';
    const fileName = `${baseName}_procesado_${processingType}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    // Agregar al DOM, hacer clic y remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar la URL del objeto
    URL.revokeObjectURL(url);
  }, [csvData, usedLocalProcessing, selectedFile]);

  const handleSendToBackend = useCallback(async () => {
    if (!csvData) return;
    
    setCurrentStep('sending');
    setUploadMessage('Enviando archivo al servidor...');
    
    try {
      // Crear un blob CSV
      const csvBlob = new Blob([csvData], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', csvBlob, selectedFile?.name.replace(/\.[^/.]+$/, '.csv') || 'data.csv');
      
      // Usar configuración de API basada en tipo de archivo seleccionado
      const fileTypeConfig = getFileTypeConfig(selectedFileType!);
      const apiUrl = fileTypeConfig ? apiUrls.uploadByType(selectedFileType!) : apiUrls.ingest();
      
      console.log('🔧 Debug - Enviando archivo:', {
        selectedFileType,
        fileTypeConfig,
        apiUrl,
        fileName: selectedFile?.name
      });
      
      if (!apiUrl) {
        throw new Error('Endpoint no configurado para este tipo de archivo');
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        // No agregar Content-Type header, dejar que el navegador lo maneje para FormData
      });
      
      if (response.ok) {
        setCurrentStep('success');
        setUploadMessage(`Archivo "${selectedFile?.name}" enviado exitosamente al servidor.`);
      } else {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error del servidor (${response.status}): ${errorText}`);
      }
    } catch (error) {
      setCurrentStep('error');
      let errorMessage = 'Error desconocido';
      
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = 'Error de CORS: El servidor no permite peticiones desde este origen. Contacte al administrador del sistema.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setUploadMessage(`Error al enviar el archivo: ${errorMessage}`);
    }
  }, [csvData, selectedFile]);

  const clearFileOnly = useCallback(() => {
    setSelectedFile(null);
    setCsvData('');
    setPreviewData([]);
    setUploadMessage('');
    setDetectedColumns([]);
    setProcessedSheetName('');
    setProcessingStatus('');
    setIsXlsmFile(false);
    setUsedLocalProcessing(false);
  }, []);

  const resetUpload = useCallback(() => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setCsvData('');
    setPreviewData([]);
    setUploadMessage('');
    setDetectedColumns([]);
    setProcessedSheetName('');
    setProcessingStatus('');
    setIsXlsmFile(false);
    setUsedLocalProcessing(false);
    setSelectedFileType('gestion-estadias');
  }, []);

  const goBackToUpload = useCallback(() => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setCsvData('');
    setPreviewData([]);
    setDetectedColumns([]);
    setProcessedSheetName('');
    setProcessingStatus('');
    setIsXlsmFile(false);
    setUsedLocalProcessing(false);
  }, []);

  return {
    // State
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
    
    // Actions
    handleFileUpload,
    handleSendToBackend,
    downloadGeneratedCSV,
    resetUpload,
    goBackToUpload,
    setSelectedFileType,
    clearFileOnly,
  };
};
