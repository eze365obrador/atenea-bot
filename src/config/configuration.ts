export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'demo-key',
  },
  sharepoint: {
    tenantId: process.env.SHAREPOINT_TENANT_ID || '',
    clientId: process.env.SHAREPOINT_CLIENT_ID || '',
    clientSecret: process.env.SHAREPOINT_CLIENT_SECRET || '',
    siteUrl: process.env.SHAREPOINT_SITE_URL || '',
    documentLibrary: process.env.SHAREPOINT_DOCUMENT_LIBRARY || 'Documentos',
  },
  sales: {
    apiUrl: process.env.SALES_API_URL || 'https://api.365equipo.com/ventas',
  },
  chroma: {
    url: process.env.CHROMA_URL || 'http://localhost:8000',
  },
});