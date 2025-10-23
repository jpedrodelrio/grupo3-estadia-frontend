#!/bin/bash
# Script para iniciar ambos servicios: API de datos y aplicación React

echo "🏥 SISTEMA COMPLETO DE GESTIÓN DE ESTADÍA"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

show_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

show_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

show_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    show_info "Deteniendo servicios..."
    pkill -f "node server.js" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    pkill -f "npm run dev" 2>/dev/null
    show_message "Servicios detenidos"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Verificar archivo CSV
CSV_FILE="GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
if [ ! -f "$CSV_FILE" ]; then
    show_error "Archivo CSV no encontrado: $CSV_FILE"
    exit 1
fi
show_message "Archivo CSV encontrado"

# Verificar dependencias del servidor
if [ ! -d "node_modules" ] || [ ! -f "node_modules/express/package.json" ]; then
    show_info "Instalando dependencias del servidor..."
    cp server-package.json package-server.json
    npm install express cors csv-parser
fi

# Verificar dependencias de React
if [ ! -f "node_modules/react/package.json" ]; then
    show_info "Instalando dependencias de React..."
    cp package-react.json package.json
    npm install
fi

# Iniciar servidor de datos
show_info "Iniciando servidor de datos (puerto 3001)..."
node server.js &
SERVER_PID=$!

# Esperar a que el servidor inicie
sleep 5

# Verificar servidor
if curl -s http://localhost:3001/api/health > /dev/null; then
    STATS=$(curl -s http://localhost:3001/api/stats)
    TOTAL=$(echo $STATS | grep -o '"total":[0-9]*' | cut -d':' -f2)
    show_message "Servidor de datos iniciado - $TOTAL pacientes cargados"
else
    show_error "No se pudo iniciar el servidor de datos"
    exit 1
fi

# Iniciar aplicación React
show_info "Iniciando aplicación React (puerto 5173)..."
npm run dev &
REACT_PID=$!

# Esperar a que React inicie
sleep 8

# Verificar aplicación React
if curl -s http://localhost:5173 > /dev/null; then
    show_message "Aplicación React iniciada"
else
    show_warning "Aplicación React puede estar iniciándose..."
fi

echo ""
show_message "🎉 SISTEMA COMPLETAMENTE FUNCIONAL:"
echo ""
echo "📊 Servidor de datos: http://localhost:3001/api"
echo "   • $TOTAL pacientes CMBD cargados"
echo "   • API REST funcionando"
echo ""
echo "🌐 Aplicación React: http://localhost:5173"
echo "   • Interfaz de usuario"
echo "   • Integración con datos CMBD"
echo ""
show_info "📱 INSTRUCCIONES DE USO:"
echo "1. 🌐 Abre tu navegador en: http://localhost:5173"
echo "2. 🔄 Haz clic en 'Datos Ejemplo' → 'Datos CSV'"
echo "3. 👥 Ve a 'Gestión de Pacientes'"
echo "4. 🔍 Usa filtros para buscar pacientes"
echo ""
show_info "💡 Para detener todo presiona Ctrl+C"
echo ""

# Mantener el script ejecutándose
while true; do
    sleep 1
done
