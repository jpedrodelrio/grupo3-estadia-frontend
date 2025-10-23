#!/bin/bash

# Script para iniciar el sistema completo
# Incluye servidor API y aplicación React

echo "🚀 Iniciando Sistema Completo de Gestión de Pacientes CMBD"
echo "=========================================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para verificar si un puerto está en uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Puerto en uso
    else
        return 1  # Puerto libre
    fi
}

# Función para matar procesos en puertos específicos
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port)
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}🔄 Liberando puerto $port...${NC}"
        kill -9 $pids 2>/dev/null
        sleep 2
    fi
}

# Verificar y liberar puertos si es necesario
echo -e "${BLUE}🔍 Verificando puertos...${NC}"
if check_port 3001; then
    echo -e "${YELLOW}⚠️  Puerto 3001 en uso, liberando...${NC}"
    kill_port 3001
fi

if check_port 5173; then
    echo -e "${YELLOW}⚠️  Puerto 5173 en uso, liberando...${NC}"
    kill_port 5173
fi

echo ""

# Verificar que el archivo CSV existe
CSV_FILE="GRD 2024-Agosto 2025(Egresos 2024-2025)_con_datos.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo -e "${RED}❌ Error: Archivo CSV no encontrado: $CSV_FILE${NC}"
    echo -e "${YELLOW}💡 Asegúrate de que el archivo CSV esté en el directorio actual${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Archivo CSV encontrado: $CSV_FILE${NC}"
echo ""

# Verificar dependencias del servidor
echo -e "${BLUE}📦 Verificando dependencias del servidor...${NC}"
if [ ! -d "node_modules" ] || [ ! -f "node_modules/express/package.json" ]; then
    echo -e "${YELLOW}📥 Instalando dependencias del servidor...${NC}"
    npm install express csv-parser cors
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error instalando dependencias del servidor${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dependencias del servidor ya instaladas${NC}"
fi

echo ""

# Iniciar servidor API
echo -e "${BLUE}🚀 Iniciando servidor API...${NC}"
echo -e "${YELLOW}📊 Puerto: 3001${NC}"
echo -e "${YELLOW}📂 Datos: $CSV_FILE${NC}"

# Usar el servidor ES modules
node server-esm.js &
SERVER_PID=$!

# Esperar a que el servidor se inicie
echo -e "${YELLOW}⏳ Esperando que el servidor se inicie...${NC}"
sleep 5

# Verificar que el servidor esté funcionando
echo -e "${BLUE}🔍 Verificando servidor API...${NC}"
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Servidor API funcionando correctamente${NC}"
    curl -s http://localhost:3001/api/health | jq '.' 2>/dev/null || curl -s http://localhost:3001/api/health
else
    echo -e "${RED}❌ Error: Servidor API no responde${NC}"
    echo -e "${YELLOW}💡 Verifica que el puerto 3001 esté libre${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo ""

# Verificar dependencias de React
echo -e "${BLUE}📦 Verificando dependencias de React...${NC}"
if [ ! -d "node_modules" ] || [ ! -f "node_modules/react/package.json" ]; then
    echo -e "${YELLOW}📥 Instalando dependencias de React...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error instalando dependencias de React${NC}"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dependencias de React ya instaladas${NC}"
fi

echo ""

# Iniciar aplicación React
echo -e "${BLUE}🌐 Iniciando aplicación React...${NC}"
echo -e "${YELLOW}📱 Puerto: 5173${NC}"
echo -e "${YELLOW}🔗 URL: http://localhost:5173${NC}"

npm run dev &
REACT_PID=$!

# Esperar a que React se inicie
echo -e "${YELLOW}⏳ Esperando que React se inicie...${NC}"
sleep 10

# Verificar que React esté funcionando
echo -e "${BLUE}🔍 Verificando aplicación React...${NC}"
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✅ Aplicación React funcionando correctamente${NC}"
else
    echo -e "${RED}❌ Error: Aplicación React no responde${NC}"
    echo -e "${YELLOW}💡 Verifica que el puerto 5173 esté libre${NC}"
    kill $SERVER_PID $REACT_PID 2>/dev/null
    exit 1
fi

echo ""
echo "=========================================================="
echo -e "${GREEN}🎉 ¡Sistema completo iniciado exitosamente!${NC}"
echo "=========================================================="
echo ""
echo -e "${BLUE}📊 Servidor API:${NC}"
echo -e "   🌐 URL: http://localhost:3001/api"
echo -e "   💚 Health: http://localhost:3001/api/health"
echo -e "   📈 Pacientes: $(curl -s http://localhost:3001/api/health | grep -o '"patientsLoaded":[0-9]*' | cut -d: -f2)"
echo ""
echo -e "${BLUE}🌐 Aplicación React:${NC}"
echo -e "   🔗 URL: http://localhost:5173"
echo -e "   📱 Interfaz: Tabla de pacientes hospitalizados"
echo ""
echo -e "${YELLOW}💡 Instrucciones de uso:${NC}"
echo -e "   1. Abre tu navegador en: http://localhost:5173"
echo -e "   2. Ve a la pestaña 'Gestión de Pacientes'"
echo -e "   3. Haz clic en 'Datos CSV' para ver los datos reales"
echo -e "   4. Usa los filtros y búsqueda para explorar los datos"
echo ""
echo -e "${YELLOW}🛑 Para detener el sistema:${NC}"
echo -e "   Presiona Ctrl+C o ejecuta: kill $SERVER_PID $REACT_PID"
echo ""

# Mantener el script corriendo
echo -e "${GREEN}🔄 Sistema corriendo... Presiona Ctrl+C para detener${NC}"
echo ""

# Función para limpiar al salir
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Deteniendo sistema...${NC}"
    kill $SERVER_PID $REACT_PID 2>/dev/null
    echo -e "${GREEN}✅ Sistema detenido${NC}"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# Mantener el script activo
while true; do
    sleep 1
done
