import React from 'react';
import { Filter, Search } from 'lucide-react';

interface FilterPanelProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  serviceFilter: string;
  onServiceFilterChange: (service: string) => void;
  riskFilter: string;
  onRiskFilterChange: (risk: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  searchTerm,
  onSearchChange,
  serviceFilter,
  onServiceFilterChange,
  riskFilter,
  onRiskFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  const services = [
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

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <Filter className="h-5 w-5 text-gray-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Filtros y Búsqueda</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar Paciente
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre, RUT o diagnóstico..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Servicio Clínico
          </label>
          <select
            value={serviceFilter}
            onChange={(e) => onServiceFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los servicios</option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de Riesgo
          </label>
          <select
            value={riskFilter}
            onChange={(e) => onRiskFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los riesgos</option>
            <option value="verde">Verde (Bajo)</option>
            <option value="amarillo">Amarillo (Medio)</option>
            <option value="rojo">Rojo (Alto)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="alta_pendiente">Alta Pendiente</option>
            <option value="dado_alta">Dado de Alta</option>
          </select>
        </div>
      </div>
    </div>
  );
};