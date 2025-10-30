// import React, { useState, useRef } from 'react';
// import { X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Eye, Link, Users, FileText } from 'lucide-react';
// import * as XLSX from 'xlsx';
// import { Patient, PatientNote } from '../../types';

// interface DualExcelUploadModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onPatientsImported: (patients: Patient[], notes: PatientNote[]) => void;
// }

// interface ColumnMapping {
//   excelColumn: string;
//   patientField: keyof Patient | '';
// }

// interface NotesColumnMapping {
//   excelColumn: string;
//   noteField: keyof PatientNote | '';
// }

// interface ExcelData {
//   headers: string[];
//   rows: any[][];
// }

// interface ProcessedData {
//   patients: Patient[];
//   notes: PatientNote[];
//   errors: string[];
// }

// export const DualExcelUploadModal: React.FC<DualExcelUploadModalProps> = ({
//   isOpen,
//   onClose,
//   onPatientsImported,
// }) => {
//   const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'import'>('upload');
//   const [patientsFile, setPatientsFile] = useState<File | null>(null);
//   const [notesFile, setNotesFile] = useState<File | null>(null);
//   const [patientsData, setPatientsData] = useState<ExcelData | null>(null);
//   const [notesData, setNotesData] = useState<ExcelData | null>(null);
//   const [patientsMapping, setPatientsMapping] = useState<ColumnMapping[]>([]);
//   const [notesMapping, setNotesMapping] = useState<NotesColumnMapping[]>([]);
//   const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
//   const [errors, setErrors] = useState<string[]>([]);
  
//   const patientsFileRef = useRef<HTMLInputElement>(null);
//   const notesFileRef = useRef<HTMLInputElement>(null);

//   // Campos requeridos para pacientes
//   const requiredPatientFields: (keyof Patient)[] = [
//     'rut', 'nombre', 'apellido_paterno', 'edad', 'sexo', 
//     'servicio_clinico', 'diagnostico_principal', 'prevision'
//   ];

//   // Campos requeridos para notas
//   const requiredNoteFields: (keyof PatientNote)[] = [
//     'patient_id', 'user_name', 'user_role', 'tipo_gestion', 'nota', 'fecha_gestion'
//   ];

//   // Valores por defecto para pacientes
//   const defaultPatientValues: Partial<Patient> = {
//     apellido_materno: '',
//     fecha_ingreso: new Date().toISOString(),
//     fecha_estimada_alta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//     dias_hospitalizacion: 0,
//     riesgo_social: 'bajo',
//     riesgo_clinico: 'bajo',
//     riesgo_administrativo: 'bajo',
//     nivel_riesgo_global: 'verde',
//     estado: 'activo',
//     created_at: new Date().toISOString(),
//     updated_at: new Date().toISOString(),
//   };

//   const readExcelFile = (file: File): Promise<ExcelData> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         try {
//           const data = new Uint8Array(e.target?.result as ArrayBuffer);
//           const workbook = XLSX.read(data, { type: 'array' });
//           const sheetName = workbook.SheetNames[0];
//           const worksheet = workbook.Sheets[sheetName];
          
//           const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
//           if (jsonData.length < 2) {
//             reject(new Error('El archivo Excel debe tener al menos una fila de encabezados y una fila de datos.'));
//             return;
//           }

//           const headers = jsonData[0] as string[];
//           const rows = jsonData.slice(1) as any[][];

//           resolve({ headers, rows });
//         } catch (error) {
//           reject(new Error('Error al leer el archivo Excel. Asegúrate de que sea un archivo válido.'));
//         }
//       };
//       reader.readAsArrayBuffer(file);
//     });
//   };

//   const handlePatientsFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     try {
//       const data = await readExcelFile(file);
//       setPatientsFile(file);
//       setPatientsData(data);
//       setErrors([]);
//     } catch (error) {
//       setErrors([error instanceof Error ? error.message : 'Error desconocido']);
//     }
//   };

//   const handleNotesFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     try {
//       const data = await readExcelFile(file);
//       setNotesFile(file);
//       setNotesData(data);
//       setErrors([]);
//     } catch (error) {
//       setErrors([error instanceof Error ? error.message : 'Error desconocido']);
//     }
//   };

//   const processData = () => {
//     if (!patientsData || !notesData) {
//       setErrors(['Debes cargar ambos archivos Excel']);
//       return;
//     }

//     const processedPatients: Patient[] = [];
//     const processedNotes: PatientNote[] = [];
//     const newErrors: string[] = [];

//     // Crear mapa de episodios a pacientes
//     const episodeToPatientMap = new Map<string, Patient>();

//     // Procesar pacientes
//     patientsData.rows.forEach((row, rowIndex) => {
//       try {
//         const patient: Partial<Patient> = { ...defaultPatientValues };

//         patientsMapping.forEach(mapping => {
//           if (mapping.patientField && mapping.excelColumn) {
//             const columnIndex = patientsData.headers.indexOf(mapping.excelColumn);
//             if (columnIndex !== -1 && row[columnIndex] !== undefined) {
//               const value = row[columnIndex];
//               patient[mapping.patientField] = value?.toString() || '';
//             }
//           }
//         });

//         // Buscar el campo episodio (puede estar mapeado o ser automático)
//         const episodeField = patientsMapping.find(m => m.patientField === 'id' || m.excelColumn.toLowerCase().includes('episodio'));
//         let episodeId = '';
        
//         if (episodeField) {
//           const columnIndex = patientsData.headers.indexOf(episodeField.excelColumn);
//           episodeId = row[columnIndex]?.toString() || '';
//         } else {
//           // Generar ID único si no hay episodio
//           episodeId = `episode_${Date.now()}_${rowIndex}`;
//         }

//         if (!episodeId) {
//           newErrors.push(`Fila ${rowIndex + 2} del archivo de pacientes: No se encontró identificador de episodio`);
//           return;
//         }

//         patient.id = episodeId;
//         episodeToPatientMap.set(episodeId, patient as Patient);
//         processedPatients.push(patient as Patient);
//       } catch (error) {
//         newErrors.push(`Fila ${rowIndex + 2} del archivo de pacientes: Error al procesar datos`);
//       }
//     });

//     // Procesar notas/gestiones
//     notesData.rows.forEach((row, rowIndex) => {
//       try {
//         const note: Partial<PatientNote> = {};

//         notesMapping.forEach(mapping => {
//           if (mapping.noteField && mapping.excelColumn) {
//             const columnIndex = notesData.headers.indexOf(mapping.excelColumn);
//             if (columnIndex !== -1 && row[columnIndex] !== undefined) {
//               const value = row[columnIndex];
//               note[mapping.noteField] = value?.toString() || '';
//             }
//           }
//         });

//         // Buscar el campo episodio en las notas
//         const episodeField = notesMapping.find(m => m.noteField === 'patient_id' || m.excelColumn.toLowerCase().includes('episodio'));
//         let episodeId = '';
        
//         if (episodeField) {
//           const columnIndex = notesData.headers.indexOf(episodeField.excelColumn);
//           episodeId = row[columnIndex]?.toString() || '';
//         }

//         if (!episodeId) {
//           newErrors.push(`Fila ${rowIndex + 2} del archivo de gestiones: No se encontró identificador de episodio`);
//           return;
//         }

//         // Verificar que el episodio existe en los pacientes
//         if (!episodeToPatientMap.has(episodeId)) {
//           newErrors.push(`Fila ${rowIndex + 2} del archivo de gestiones: Episodio ${episodeId} no encontrado en pacientes`);
//           return;
//         }

//         note.patient_id = episodeId;
//         note.id = `note_${Date.now()}_${rowIndex}`;
//         note.created_at = new Date().toISOString();

//         // Valores por defecto para campos faltantes
//         if (!note.user_name) note.user_name = 'Usuario Importado';
//         if (!note.user_role) note.user_role = 'gestor_estadia';
//         if (!note.tipo_gestion) note.tipo_gestion = 'general';
//         if (!note.fecha_gestion) note.fecha_gestion = new Date().toISOString();

//         processedNotes.push(note as PatientNote);
//       } catch (error) {
//         newErrors.push(`Fila ${rowIndex + 2} del archivo de gestiones: Error al procesar datos`);
//       }
//     });

//     setProcessedData({
//       patients: processedPatients,
//       notes: processedNotes,
//       errors: newErrors
//     });
//     setErrors(newErrors);
//     setStep('preview');
//   };

//   const handleImport = () => {
//     if (processedData) {
//       onPatientsImported(processedData.patients, processedData.notes);
//       onClose();
//       resetModal();
//     }
//   };

//   const resetModal = () => {
//     setStep('upload');
//     setPatientsFile(null);
//     setNotesFile(null);
//     setPatientsData(null);
//     setNotesData(null);
//     setPatientsMapping([]);
//     setNotesMapping([]);
//     setProcessedData(null);
//     setErrors([]);
//     if (patientsFileRef.current) patientsFileRef.current.value = '';
//     if (notesFileRef.current) notesFileRef.current.value = '';
//   };

//   const handleClose = () => {
//     onClose();
//     resetModal();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
//       <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
//         <div className="flex justify-between items-center pb-4 border-b">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Importar Pacientes y Gestiones desde Excel
//           </h2>
//           <button
//             onClick={handleClose}
//             className="text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <X className="h-6 w-6" />
//           </button>
//         </div>

//         {/* Indicador de pasos */}
//         <div className="mt-6 mb-6">
//           <div className="flex items-center justify-center space-x-4">
//             <div className={`flex items-center ${step === 'upload' ? 'text-blue-600' : step === 'mapping' || step === 'preview' || step === 'import' ? 'text-green-600' : 'text-gray-400'}`}>
//               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-100' : step === 'mapping' || step === 'preview' || step === 'import' ? 'bg-green-100' : 'bg-gray-100'}`}>
//                 <Upload className="h-4 w-4" />
//               </div>
//               <span className="ml-2 text-sm font-medium">1. Subir Archivos</span>
//             </div>
//             <div className={`w-8 h-1 ${step === 'mapping' || step === 'preview' || step === 'import' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
//             <div className={`flex items-center ${step === 'mapping' ? 'text-blue-600' : step === 'preview' || step === 'import' ? 'text-green-600' : 'text-gray-400'}`}>
//               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'mapping' ? 'bg-blue-100' : step === 'preview' || step === 'import' ? 'bg-green-100' : 'bg-gray-100'}`}>
//                 <Link className="h-4 w-4" />
//               </div>
//               <span className="ml-2 text-sm font-medium">2. Mapear Columnas</span>
//             </div>
//             <div className={`w-8 h-1 ${step === 'preview' || step === 'import' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
//             <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : step === 'import' ? 'text-green-600' : 'text-gray-400'}`}>
//               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-blue-100' : step === 'import' ? 'bg-green-100' : 'bg-gray-100'}`}>
//                 <Eye className="h-4 w-4" />
//               </div>
//               <span className="ml-2 text-sm font-medium">3. Vista Previa</span>
//             </div>
//           </div>
//         </div>

//         {/* Errores */}
//         {errors.length > 0 && (
//           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
//             <div className="flex items-center">
//               <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
//               <h3 className="text-sm font-medium text-red-800">Errores encontrados:</h3>
//             </div>
//             <ul className="mt-2 text-sm text-red-700 list-disc list-inside max-h-32 overflow-y-auto">
//               {errors.map((error, index) => (
//                 <li key={index}>{error}</li>
//               ))}
//             </ul>
//           </div>
//         )}

//         {/* Paso 1: Subir archivos */}
//         {step === 'upload' && (
//           <div className="mt-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Archivo de Pacientes */}
//               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
//                 <Users className="mx-auto h-12 w-12 text-gray-400" />
//                 <h3 className="mt-2 text-sm font-medium text-gray-900">
//                   Archivo de Pacientes
//                 </h3>
//                 <p className="mt-1 text-sm text-gray-500">
//                   Un paciente por fila con su episodio único
//                 </p>
//                 <div className="mt-4">
//                   <input
//                     ref={patientsFileRef}
//                     type="file"
//                     accept=".xlsx,.xls"
//                     onChange={handlePatientsFileUpload}
//                     className="hidden"
//                   />
//                   <button
//                     onClick={() => patientsFileRef.current?.click()}
//                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                   >
//                     <Upload className="h-4 w-4 mr-2" />
//                     Seleccionar Archivo
//                   </button>
//                 </div>
//                 {patientsFile && (
//                   <p className="mt-2 text-sm text-green-600">
//                     ✓ {patientsFile.name} ({patientsData?.rows.length || 0} pacientes)
//                   </p>
//                 )}
//               </div>

//               {/* Archivo de Gestiones */}
//               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
//                 <FileText className="mx-auto h-12 w-12 text-gray-400" />
//                 <h3 className="mt-2 text-sm font-medium text-gray-900">
//                   Archivo de Gestiones
//                 </h3>
//                 <p className="mt-1 text-sm text-gray-500">
//                   Múltiples gestiones por episodio
//                 </p>
//                 <div className="mt-4">
//                   <input
//                     ref={notesFileRef}
//                     type="file"
//                     accept=".xlsx,.xls"
//                     onChange={handleNotesFileUpload}
//                     className="hidden"
//                   />
//                   <button
//                     onClick={() => notesFileRef.current?.click()}
//                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//                   >
//                     <Upload className="h-4 w-4 mr-2" />
//                     Seleccionar Archivo
//                   </button>
//                 </div>
//                 {notesFile && (
//                   <p className="mt-2 text-sm text-green-600">
//                     ✓ {notesFile.name} ({notesData?.rows.length || 0} gestiones)
//                   </p>
//                 )}
//               </div>
//             </div>

//             {patientsFile && notesFile && (
//               <div className="mt-6 text-center">
//                 <button
//                   onClick={() => setStep('mapping')}
//                   className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
//                 >
//                   <Link className="h-5 w-5 mr-2" />
//                   Continuar al Mapeo
//                 </button>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Paso 2: Mapear columnas */}
//         {step === 'mapping' && patientsData && notesData && (
//           <div className="mt-6">
//             <h3 className="text-lg font-medium text-gray-900 mb-4">
//               Mapear Columnas de los Archivos
//             </h3>
//             <p className="text-sm text-gray-600 mb-6">
//               Selecciona qué columna de cada archivo corresponde a cada campo. 
//               Los campos marcados con * son obligatorios.
//             </p>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Mapeo de Pacientes */}
//               <div>
//                 <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
//                   <Users className="h-5 w-5 mr-2 text-blue-600" />
//                   Archivo de Pacientes
//                 </h4>
//                 <div className="space-y-3 max-h-96 overflow-y-auto">
//                   {patientsData.headers.map((header, index) => (
//                     <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
//                       <div className="w-1/3">
//                         <label className="block text-sm font-medium text-gray-700">
//                           "{header}"
//                         </label>
//                       </div>
//                       <div className="w-2/3">
//                         <select
//                           value={patientsMapping.find(m => m.excelColumn === header)?.patientField || ''}
//                           onChange={(e) => {
//                             const newMapping = [...patientsMapping];
//                             const existingIndex = newMapping.findIndex(m => m.excelColumn === header);
                            
//                             if (existingIndex !== -1) {
//                               newMapping[existingIndex].patientField = e.target.value as keyof Patient | '';
//                             } else {
//                               newMapping.push({
//                                 excelColumn: header,
//                                 patientField: e.target.value as keyof Patient | ''
//                               });
//                             }
                            
//                             setPatientsMapping(newMapping);
//                           }}
//                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                         >
//                           <option value="">-- No mapear --</option>
//                           <optgroup label="Identificador">
//                             <option value="id">Episodio/ID *</option>
//                           </optgroup>
//                           <optgroup label="Datos Personales">
//                             <option value="rut">RUT *</option>
//                             <option value="nombre">Nombre *</option>
//                             <option value="apellido_paterno">Apellido Paterno *</option>
//                             <option value="apellido_materno">Apellido Materno</option>
//                             <option value="edad">Edad *</option>
//                             <option value="sexo">Sexo (M/F) *</option>
//                           </optgroup>
//                           <optgroup label="Datos Médicos">
//                             <option value="servicio_clinico">Servicio Clínico *</option>
//                             <option value="diagnostico_principal">Diagnóstico Principal *</option>
//                             <option value="prevision">Previsión *</option>
//                             <option value="fecha_ingreso">Fecha de Ingreso</option>
//                             <option value="fecha_estimada_alta">Fecha Estimada de Alta</option>
//                             <option value="dias_hospitalizacion">Días Hospitalizado</option>
//                           </optgroup>
//                           <optgroup label="Evaluación de Riesgos">
//                             <option value="riesgo_social">Riesgo Social</option>
//                             <option value="riesgo_clinico">Riesgo Clínico</option>
//                             <option value="riesgo_administrativo">Riesgo Administrativo</option>
//                             <option value="nivel_riesgo_global">Nivel Riesgo Global</option>
//                             <option value="estado">Estado</option>
//                           </optgroup>
//                         </select>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Mapeo de Gestiones */}
//               <div>
//                 <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
//                   <FileText className="h-5 w-5 mr-2 text-green-600" />
//                   Archivo de Gestiones
//                 </h4>
//                 <div className="space-y-3 max-h-96 overflow-y-auto">
//                   {notesData.headers.map((header, index) => (
//                     <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
//                       <div className="w-1/3">
//                         <label className="block text-sm font-medium text-gray-700">
//                           "{header}"
//                         </label>
//                       </div>
//                       <div className="w-2/3">
//                         <select
//                           value={notesMapping.find(m => m.excelColumn === header)?.noteField || ''}
//                           onChange={(e) => {
//                             const newMapping = [...notesMapping];
//                             const existingIndex = newMapping.findIndex(m => m.excelColumn === header);
                            
//                             if (existingIndex !== -1) {
//                               newMapping[existingIndex].noteField = e.target.value as keyof PatientNote | '';
//                             } else {
//                               newMapping.push({
//                                 excelColumn: header,
//                                 noteField: e.target.value as keyof PatientNote | ''
//                               });
//                             }
                            
//                             setNotesMapping(newMapping);
//                           }}
//                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
//                         >
//                           <option value="">-- No mapear --</option>
//                           <optgroup label="Relación">
//                             <option value="patient_id">Episodio/ID del Paciente *</option>
//                           </optgroup>
//                           <optgroup label="Datos de la Gestión">
//                             <option value="user_name">Usuario Responsable *</option>
//                             <option value="user_role">Rol del Usuario *</option>
//                             <option value="tipo_gestion">Tipo de Gestión *</option>
//                             <option value="nota">Nota/Descripción *</option>
//                             <option value="fecha_gestion">Fecha de Gestión *</option>
//                           </optgroup>
//                         </select>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end space-x-3">
//               <button
//                 onClick={() => setStep('upload')}
//                 className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//               >
//                 Volver
//               </button>
//               <button
//                 onClick={processData}
//                 className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
//               >
//                 Procesar Datos
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Paso 3: Vista previa */}
//         {step === 'preview' && processedData && (
//           <div className="mt-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-medium text-gray-900">
//                 Vista Previa de Datos Relacionados
//               </h3>
//               <div className="flex items-center space-x-4 text-sm text-gray-600">
//                 <div className="flex items-center">
//                   <Users className="h-4 w-4 text-blue-600 mr-1" />
//                   {processedData.patients.length} pacientes
//                 </div>
//                 <div className="flex items-center">
//                   <FileText className="h-4 w-4 text-green-600 mr-1" />
//                   {processedData.notes.length} gestiones
//                 </div>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Vista previa de pacientes */}
//               <div>
//                 <h4 className="text-md font-medium text-gray-900 mb-3">Pacientes</h4>
//                 <div className="overflow-x-auto max-h-64">
//                   <table className="min-w-full divide-y divide-gray-200 text-sm">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Riesgo</th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {processedData.patients.slice(0, 5).map((patient, index) => (
//                         <tr key={index}>
//                           <td className="px-3 py-2">
//                             <div className="text-xs font-medium text-gray-900">
//                               {patient.nombre} {patient.apellido_paterno}
//                             </div>
//                             <div className="text-xs text-gray-500">{patient.rut}</div>
//                           </td>
//                           <td className="px-3 py-2 text-xs text-gray-900">{patient.servicio_clinico}</td>
//                           <td className="px-3 py-2">
//                             <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
//                               patient.nivel_riesgo_global === 'verde' ? 'bg-green-100 text-green-800' :
//                               patient.nivel_riesgo_global === 'amarillo' ? 'bg-yellow-100 text-yellow-800' :
//                               'bg-red-100 text-red-800'
//                             }`}>
//                               {patient.nivel_riesgo_global}
//                             </span>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//                 {processedData.patients.length > 5 && (
//                   <p className="mt-2 text-xs text-gray-500 text-center">
//                     Mostrando los primeros 5 de {processedData.patients.length} pacientes
//                   </p>
//                 )}
//               </div>

//               {/* Vista previa de gestiones */}
//               <div>
//                 <h4 className="text-md font-medium text-gray-900 mb-3">Gestiones</h4>
//                 <div className="overflow-x-auto max-h-64">
//                   <table className="min-w-full divide-y divide-gray-200 text-sm">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Episodio</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {processedData.notes.slice(0, 5).map((note, index) => (
//                         <tr key={index}>
//                           <td className="px-3 py-2 text-xs text-gray-900">{note.patient_id}</td>
//                           <td className="px-3 py-2">
//                             <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                               {note.tipo_gestion}
//                             </span>
//                           </td>
//                           <td className="px-3 py-2 text-xs text-gray-900">{note.user_name}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//                 {processedData.notes.length > 5 && (
//                   <p className="mt-2 text-xs text-gray-500 text-center">
//                     Mostrando las primeras 5 de {processedData.notes.length} gestiones
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end space-x-3">
//               <button
//                 onClick={() => setStep('mapping')}
//                 className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//               >
//                 Volver
//               </button>
//               <button
//                 onClick={handleImport}
//                 disabled={errors.length > 0}
//                 className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Importar {processedData.patients.length} Pacientes y {processedData.notes.length} Gestiones
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
