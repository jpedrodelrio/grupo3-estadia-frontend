#!/bin/bash
# Script final para iniciar el sistema completo

echo "🏥 SISTEMA DE GESTIÓN DE ESTADÍA - INICIO FINAL"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

show_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar archivo CSV
CSV_FILE="GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
if [ ! -f "$CSV_FILE" ]; then
    show_warning "Archivo CSV no encontrado: $CSV_FILE"
    exit 1
fi
show_message "Archivo CSV encontrado: $CSV_FILE"

# Verificar dependencias
if [ ! -d "node_modules" ]; then
    show_info "Instalando dependencias..."
    cp server-package.json package.json
    npm install express cors csv-parser
fi

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    show_info "Deteniendo servidor..."
    pkill -f "node server.js" 2>/dev/null
    show_message "Servidor detenido"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar servidor
show_info "Iniciando servidor de datos..."
node server.js &
SERVER_PID=$!

# Esperar a que el servidor inicie
sleep 5

# Verificar que el servidor esté funcionando
if curl -s http://localhost:3001/api/health > /dev/null; then
    show_message "Servidor iniciado correctamente"
    
    # Mostrar estadísticas
    STATS=$(curl -s http://localhost:3001/api/stats)
    TOTAL=$(echo $STATS | grep -o '"total":[0-9]*' | cut -d':' -f2)
    HOMBRES=$(echo $STATS | grep -o '"hombres":[0-9]*' | cut -d':' -f2)
    MUJERES=$(echo $STATS | grep -o '"mujeres":[0-9]*' | cut -d':' -f2)
    SERVICIOS=$(echo $STATS | grep -o '"servicios_unicos":[0-9]*' | cut -d':' -f2)
    
    echo ""
    show_message "📊 DATOS CARGADOS EXITOSAMENTE:"
    echo "   • Total pacientes: $TOTAL"
    echo "   • Hombres: $HOMBRES"
    echo "   • Mujeres: $MUJERES"
    echo "   • Servicios únicos: $SERVICIOS"
    echo ""
    
    show_info "📱 INSTRUCCIONES DE USO:"
    echo "1. 🌐 Abre tu navegador y ve a: http://localhost:3000"
    echo "2. 🔄 Haz clic en el botón 'Datos Ejemplo' en el header"
    echo "3. 📊 El botón cambiará a 'Datos CSV' (39,222 pacientes)"
    echo "4. 👥 Ve a la pestaña 'Gestión de Pacientes'"
    echo "5. 🔍 Usa los filtros para buscar pacientes específicos"
    echo ""
    show_info "📡 API disponible en: http://localhost:3001/api"
    echo "💡 Para detener el servidor presiona Ctrl+C"
    echo ""
    
    # Mantener el script ejecutándose
    while true; do
        sleep 1
    done
    
else
    show_warning "No se pudo conectar al servidor"
    exit 1
fi
