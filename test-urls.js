// Script de prueba para verificar URLs de ambos tipos
console.log('🔧 Verificando URLs de ambos tipos:');
console.log('===================================');

// Simular variables de entorno de desarrollo
const mockEnv = {
  DEV: true,
  VITE_DEV_API_BASE_URL: 'http://localhost:5173',
  VITE_DEV_API_INGEST_ENDPOINT: '/api/gestion/ingest/csv',
  VITE_DEV_API_CAMAS_INGEST_ENDPOINT: '/api/camas/ingest/csv'
};

// Simular la función getApiConfig
const getApiConfig = () => ({
  baseUrl: mockEnv.VITE_DEV_API_BASE_URL,
  ingestEndpoint: mockEnv.VITE_DEV_API_INGEST_ENDPOINT,
  camasIngestEndpoint: mockEnv.VITE_DEV_API_CAMAS_INGEST_ENDPOINT
});

// Simular la función buildApiUrl
const buildApiUrl = (endpoint) => {
  const config = getApiConfig();
  return `${config.baseUrl}${endpoint}`;
};

// Simular la función uploadByType
const uploadByType = (fileTypeId) => {
  let url;
  
  if (fileTypeId === 'gestion-estadias') {
    url = buildApiUrl(getApiConfig().ingestEndpoint);
  } else if (fileTypeId === 'camas-nwp') {
    url = buildApiUrl(getApiConfig().camasIngestEndpoint);
  } else {
    return null;
  }
  
  console.log(`Tipo: ${fileTypeId} → URL: ${url}`);
  return url;
};

// Probar ambos tipos
console.log('\n📡 URLs generadas:');
uploadByType('gestion-estadias');
uploadByType('camas-nwp');

console.log('\n✅ Verificación completada');
