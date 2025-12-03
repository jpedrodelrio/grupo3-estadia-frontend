# Guía de Prueba - Predicción de Sobre-Estadía

## 📋 Requisitos Previos

1. **Servidor Backend**: Asegúrate de que el backend esté corriendo en:
   - **Desarrollo**: `http://localhost:5173` (o la URL configurada)
   - **Producción**: `http://3.135.182.158`

2. **Endpoint disponible**: El endpoint `/prediccion/nuevos-pacientes` debe estar implementado y funcionando en el backend.

## 🚀 Pasos para Probar

### 1. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:5173` (o el puerto que Vite asigne).

### 2. Acceder a la Aplicación

1. Abre tu navegador en `http://localhost:5173`
2. Verás el dashboard principal con el header en la parte superior

### 3. Abrir el Formulario de Nuevo Paciente

**Ubicación**: En el header (parte superior derecha), haz clic en el botón **"Nuevo Paciente"** (botón azul).

### 4. Completar el Formulario

Completa todos los campos requeridos:

#### Campos Obligatorios:
- **RUT**: Ejemplo: `12.345.678-9` o `12345678-9`
- **Nombre**: Ejemplo: `Juan`
- **Apellido Paterno**: Ejemplo: `Pérez`
- **Apellido Materno**: (Opcional) Ejemplo: `González`
- **Edad**: Ejemplo: `65`
- **Sexo**: Selecciona `Masculino` o `Femenino`
- **Servicio Clínico**: Selecciona uno de los servicios (ej: `Medicina Interna`, `UCI`, `Cardiología`)
- **Previsión**: Selecciona (ej: `FONASA A`, `ISAPRE`)
- **Fecha Estimada de Alta**: Selecciona una fecha futura
- **Código GRD**: ⭐ **NUEVO** - Ejemplo: `51401` o `81605`
- **Diagnóstico Principal**: Ejemplo: `Neumonía severa`
- **Riesgo Social**: Selecciona `Bajo`, `Medio` o `Alto`
- **Riesgo Clínico**: Selecciona `Bajo`, `Medio` o `Alto`
- **Riesgo Administrativo**: Selecciona `Bajo`, `Medio` o `Alto`

### 5. Ejemplos de Datos para Probar

#### Ejemplo 1: Paciente de Alto Riesgo
```
RUT: API-001
Nombre: María
Apellido Paterno: Rodríguez
Edad: 78
Sexo: Femenino
Servicio Clínico: UCI
Previsión: FONASA A
Fecha Estimada de Alta: (7 días desde hoy)
Código GRD: 81605
Diagnóstico: Insuficiencia respiratoria aguda
Riesgo Social: Alto
Riesgo Clínico: Alto
Riesgo Administrativo: Medio
```

#### Ejemplo 2: Paciente de Bajo Riesgo
```
RUT: API-002
Nombre: Carlos
Apellido Paterno: Mendoza
Edad: 45
Sexo: Masculino
Servicio Clínico: Medicina Interna
Previsión: ISAPRE
Fecha Estimada de Alta: (5 días desde hoy)
Código GRD: 51401
Diagnóstico: Hipertensión controlada
Riesgo Social: Bajo
Riesgo Clínico: Bajo
Riesgo Administrativo: Bajo
```

### 6. Enviar el Formulario

1. Haz clic en el botón **"Crear Paciente"** (azul, parte inferior del formulario)
2. El sistema automáticamente:
   - Normalizará los datos (sexo, riesgos, fecha)
   - Llamará al endpoint `/prediccion/nuevos-pacientes`
   - Mostrará un modal con los resultados

### 7. Ver los Resultados de la Predicción

Después de enviar, aparecerá un **modal de resultados** que muestra:

#### Información Mostrada:
- ✅ **Probabilidad de Sobre-Estadía**: Porcentaje (0-100%)
- ✅ **Categoría de Riesgo**: 
  - 🟢 **Baja** (verde) - Probabilidad < 33%
  - 🟡 **Media** (amarillo) - Probabilidad 33-66%
  - 🔴 **Alta** (rojo) - Probabilidad > 66%
- ✅ **Información del Paciente**: RUT, servicio, edad, sexo
- ✅ **Detalles**: Previsión, días estimados, código GRD
- ✅ **Riesgos**: Social, Clínico, Administrativo
- ✅ **Fecha de Predicción**: Timestamp de cuando se generó

### 8. Cerrar y Continuar

1. Haz clic en **"Cerrar"** en el modal de resultados
2. El modal principal se cerrará automáticamente
3. El paciente se habrá creado en el sistema
4. La predicción se habrá guardado en MongoDB (si `persist=true`)

## 🔍 Verificación en la Consola del Navegador

Abre las **DevTools** (F12) y revisa la pestaña **Console** para ver:

1. **Llamada al endpoint**: 
   ```
   POST http://3.135.182.158/prediccion/nuevos-pacientes?persist=true
   ```

2. **Datos enviados**: JSON con los datos normalizados

3. **Respuesta recibida**: JSON con `probabilidad_sobre_estadia` y `riesgo_categoria`

## 🐛 Solución de Problemas

### Error: "Error en predicción: 404"
- **Causa**: El endpoint no existe en el backend
- **Solución**: Verifica que el backend tenga el endpoint `/prediccion/nuevos-pacientes` implementado

### Error: "Error en predicción: 422"
- **Causa**: Faltan campos obligatorios o tipos inválidos
- **Solución**: Verifica que todos los campos estén completos y con el formato correcto

### Error: "Error en predicción: 500"
- **Causa**: El modelo ML no está disponible
- **Solución**: Verifica que el backend tenga los archivos de modelo en `src/ml/models/`

### El modal de resultados no aparece
- **Causa**: Error en la respuesta del endpoint
- **Solución**: Revisa la consola del navegador para ver el error específico

## 📊 Qué Esperar Ver

### Resultado Típico:
```
Probabilidad de Sobre-Estadía: 45.23%
Categoría: Media (amarillo)
```

### Colores según Categoría:
- 🟢 **Verde**: Baja probabilidad (< 33%)
- 🟡 **Amarillo**: Media probabilidad (33-66%)
- 🔴 **Rojo**: Alta probabilidad (> 66%)

## 🧪 Pruebas Adicionales

### Prueba con Múltiples Valores:
1. Prueba con diferentes códigos GRD
2. Prueba con diferentes combinaciones de riesgos
3. Prueba con diferentes edades (joven vs adulto mayor)
4. Prueba con diferentes servicios clínicos

### Verificar Persistencia:
Si `persist=true` (por defecto), verifica en MongoDB que se haya guardado en la colección `predicciones` de la base de datos `ucchristus`.

## 📝 Notas Importantes

1. **Código GRD**: Es un campo nuevo y obligatorio. Asegúrate de ingresar un código válido (número entero).

2. **Normalización Automática**: 
   - El sexo se convierte automáticamente a "Hombre" o "Mujer"
   - Los riesgos se convierten a números (0=Bajo, 1=Medio, 2=Alto)
   - La fecha se convierte a días desde hoy

3. **Endpoint**: El endpoint acepta tanto un objeto único como un array de pacientes.

## 🎯 Flujo Completo Visual

```
1. Click "Nuevo Paciente" 
   ↓
2. Completar formulario (incluye código GRD)
   ↓
3. Click "Crear Paciente"
   ↓
4. Sistema normaliza datos
   ↓
5. POST /prediccion/nuevos-pacientes
   ↓
6. Modal con resultados aparece
   ↓
7. Click "Cerrar"
   ↓
8. Paciente creado en sistema
```

---

**¿Necesitas ayuda?** Revisa la consola del navegador (F12) para ver errores detallados.

