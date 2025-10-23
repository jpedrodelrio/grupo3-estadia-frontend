#!/bin/bash
# Script para iniciar el servidor de datos de pacientes CMBD

echo "🏥 Iniciando Servidor de Datos de Pacientes CMBD"
echo "================================================"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

# Verificar si el archivo CSV existe
CSV_FILE="GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Archivo CSV no encontrado: $CSV_FILE"
    echo "   Asegúrate de que el archivo esté en el directorio actual."
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del servidor..."
    cp server-package.json package.json
    npm install
fi

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "❌ Error instalando dependencias. Verifica tu conexión a internet."
    exit 1
fi

echo "✅ Dependencias instaladas correctamente"
echo "📊 Archivo CSV encontrado: $CSV_FILE"
echo "🚀 Iniciando servidor en puerto 3001..."
echo ""
echo "📡 API disponible en: http://localhost:3001/api"
echo "🔍 Endpoints disponibles:"
echo "   • GET  /api/patients     - Obtener pacientes"
echo "   • GET  /api/stats        - Estadísticas"
echo "   • GET  /api/services     - Servicios únicos"
echo "   • POST /api/reload       - Recargar datos"
echo "   • GET  /api/health       - Estado del servidor"
echo ""
echo "💡 Para detener el servidor presiona Ctrl+C"
echo ""

# Iniciar el servidor
node server.js
