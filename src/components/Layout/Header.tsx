import React from 'react';
import { Bell, User, Settings, Upload } from 'lucide-react';

interface HeaderProps {
  onOpenUploadModal: () => void;
  onOpenNewPatientModal: () => void;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenUploadModal, onOpenNewPatientModal, alertCount }) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              {/* <img 
                src="/image copy.png" 
                alt="Universidad Católica de Chile" 
                className="h-12 w-auto"
              /> */}
              <div className="flex flex-col">
                {/* Red de Salud en gris oscuro */}
                <span className="text-sm font-medium text-gray-600 leading-tight">
                  Red de Salud
                </span>
                {/* Línea divisoria */}
                <div className="h-px bg-gray-600 w-full my-0.5"></div>
                {/* UC en azul y CHRISTUS en morado */}
                <span className="text-base font-bold leading-tight">
                  <span className="text-blue-600">UC</span>
                  <span className="text-gray-600"> • </span>
                  <span className="text-purple-600">CHRISTUS</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Cargar CSV/Excel
            </button>

            <button
              onClick={onOpenNewPatientModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Nuevo Paciente
            </button>

            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="h-6 w-6" />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <User className="h-6 w-6 text-gray-400" />
              <div className="text-sm">
                <p className="text-gray-900 font-medium">Dr. Juan Pérez</p>
                <p className="text-gray-500">Gestor de Estadía</p>
              </div>
            </div>

            <button className="p-2 text-gray-400 hover:text-gray-500">
              <Settings className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};