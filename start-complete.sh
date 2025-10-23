#!/bin/bash
# Script completo para iniciar la aplicación con datos CMBD

echo "🏥 SISTEMA DE GESTIÓN DE ESTADÍA - INICIO COMPLETO"
echo "=================================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
show_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

show_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar requisitos
echo "🔍 Verificando requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    show_error "Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi
show_message "Node.js encontrado: $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    show_error "npm no está instalado."
    exit 1
fi
show_message "npm encontrado: $(npm --version)"

# Verificar archivo CSV
CSV_FILE="GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
if [ ! -f "$CSV_FILE" ]; then
    show_error "Archivo CSV no encontrado: $CSV_FILE"
    show_info "Asegúrate de que el archivo esté en el directorio actual."
    exit 1
fi
show_message "Archivo CSV encontrado: $CSV_FILE"

echo ""
echo "📦 Configurando dependencias..."

# Configurar dependencias del servidor
if [ ! -d "node_modules" ] || [ ! -f "package.json" ]; then
    show_info "Instalando dependencias del servidor..."
    cp server-package.json package.json
    npm install express cors csv-parser nodemon
    if [ $? -ne 0 ]; then
        show_error "Error instalando dependencias del servidor"
        exit 1
    fi
    show_message "Dependencias del servidor instaladas"
else
    show_message "Dependencias del servidor ya instaladas"
fi

# Verificar dependencias de React
if [ ! -d "node_modules" ] || [ ! -f "package.json" ]; then
    show_warning "No se encontraron dependencias de React"
    show_info "Ejecuta 'npm install' en el directorio del proyecto React"
fi

echo ""
echo "🚀 Iniciando servicios..."

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    show_info "Deteniendo servicios..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        show_message "Servidor detenido"
    fi
    if [ ! -z "$REACT_PID" ]; then
        kill $REACT_PID 2>/dev/null
        show_message "Aplicación React detenida"
    fi
    exit 0
}

# Configurar trap para cleanup
trap cleanup SIGINT SIGTERM

# Iniciar servidor en background
show_info "Iniciando servidor de datos en puerto 3001..."
node server.js &
SERVER_PID=$!

# Esperar un momento para que el servidor inicie
sleep 3

# Verificar que el servidor esté funcionando
if curl -s http://localhost:3001/api/health > /dev/null; then
    show_message "Servidor iniciado correctamente"
    show_info "API disponible en: http://localhost:3001/api"
else
    show_error "No se pudo conectar al servidor"
    exit 1
fi

echo ""
echo "📱 INSTRUCCIONES DE USO:"
echo "========================"
echo ""
echo "1. 🌐 Abre tu navegador y ve a: http://localhost:3000"
echo "2. 🔄 Haz clic en el botón 'Datos Ejemplo' en el header"
echo "3. 📊 El botón cambiará a 'Datos CSV' (39,222 pacientes)"
echo "4. 👥 Ve a la pestaña 'Gestión de Pacientes'"
echo "5. 🔍 Usa los filtros para buscar pacientes específicos"
echo ""
echo "📡 ENDPOINTS DISPONIBLES:"
echo "• http://localhost:3001/api/patients - Lista de pacientes"
echo "• http://localhost:3001/api/stats - Estadísticas"
echo "• http://localhost:3001/api/health - Estado del servidor"
echo ""
echo "💡 Para detener todo presiona Ctrl+C"
echo ""

# Mantener el script ejecutándose
while true; do
    sleep 1
done
