import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import pdfParse from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

export interface SharePointConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  siteUrl: string;
  documentLibrary: string;
}

@Injectable()
export class SharePointService implements OnModuleInit {
  private graphClient: Client | null = null;
  private config: SharePointConfig;
  private vectorStore: Chroma | null = null;
  private embeddings: GoogleGenerativeAIEmbeddings;
  private genAI: GoogleGenerativeAI;
  private documentsCache: Map<string, string> = new Map();
  private documents: Array<{
    pageContent: string;
    metadata: {
      source: string;
      type: string;
      uploadDate: string;
    };
  }> = [];

  constructor(private configService: ConfigService) {
    this.config = {
      tenantId: this.configService.get<string>('sharepoint.tenantId') || '',
      clientId: this.configService.get<string>('sharepoint.clientId') || '',
      clientSecret:
        this.configService.get<string>('sharepoint.clientSecret') || '',
      siteUrl: this.configService.get<string>('sharepoint.siteUrl') || '',
      documentLibrary:
        this.configService.get<string>('sharepoint.documentLibrary') ||
        'Documentos',
    };

    const geminiApiKey =
      this.configService.get<string>('gemini.apiKey') || 'demo-key';
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: geminiApiKey,
      modelName: 'embedding-001',
    });

    this.genAI = new GoogleGenerativeAI(geminiApiKey);
  }

  async onModuleInit() {
    await this.authenticate();
    // Indexar documentos en background
    this.indexDocuments().catch(console.error);
  }

  async authenticate(): Promise<void> {
    if (!this.config.clientId || !this.config.clientSecret) {
      console.warn('SharePoint credentials not configured. Using demo mode.');
      return;
    }

    try {
      const tokenEndpoint = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const tokenData = (await response.json()) as { access_token: string };

      this.graphClient = Client.init({
        authProvider: (done) => {
          done(null, tokenData.access_token);
        },
      });

      console.log('Successfully authenticated with SharePoint');
    } catch (error) {
      console.error('SharePoint authentication error:', error);
      throw error;
    }
  }

  async listPDFs(): Promise<any[]> {
    if (!this.graphClient) {
      console.log('Using demo PDFs - SharePoint not connected');
      return this.getDemoPDFs();
    }

    try {
      const site = await this.graphClient
        .api(`/sites/${this.config.siteUrl}`)
        .get();

      const driveItems = await this.graphClient
        .api(
          `/sites/${site.id}/drive/root:/${this.config.documentLibrary}:/children`,
        )
        .filter("endswith(name, '.pdf')")
        .get();

      return driveItems.value || [];
    } catch (error) {
      console.error('Error listing PDFs:', error);
      return this.getDemoPDFs();
    }
  }

  async processPDF(fileId: string): Promise<string> {
    if (!this.graphClient) {
      return 'Demo PDF content: Política de vacaciones, horarios flexibles, etc.';
    }

    try {
      const fileContent = await this.graphClient
        .api(`/drives/${fileId}/content`)
        .get();

      const pdfData = await pdfParse(fileContent);
      return pdfData.text;
    } catch (error) {
      console.error('Error processing PDF:', error);
      return '';
    }
  }

  async indexDocuments(): Promise<void> {
    console.log('Starting document indexing...');

    const pdfs = await this.listPDFs();
    this.documents = [];

    for (const pdf of pdfs) {
      const content = await this.processPDF(pdf.id || pdf.name);
      if (content) {
        const chunks = this.splitIntoChunks(content, 1000);
        for (const chunk of chunks) {
          this.documents.push({
            pageContent: chunk,
            metadata: {
              source: pdf.name,
              type: 'pdf',
              uploadDate: pdf.createdDateTime || new Date().toISOString(),
            },
          });
        }
      }
    }

    if (this.documents.length > 0) {
      try {
        // Try to connect to ChromaDB (only works if running locally or with docker-compose)
        const chromaUrl =
          this.configService.get<string>('chroma.url') ||
          'http://localhost:8000';

        // Test if ChromaDB is available
        const testResponse = await fetch(`${chromaUrl}/api/v1/heartbeat`).catch(
          () => null,
        );

        if (testResponse?.ok) {
          this.vectorStore = await Chroma.fromDocuments(
            this.documents,
            this.embeddings,
            {
              collectionName: 'sharepoint-docs',
              url: chromaUrl,
            },
          );
          console.log(
            `✅ Indexed ${this.documents.length} document chunks in ChromaDB`,
          );
        } else {
          throw new Error('ChromaDB not available - using cache fallback');
        }
      } catch (error) {
        console.warn(
          '⚠️  ChromaDB not available, using in-memory cache:',
          error.message,
        );
        console.log(
          '💡 To use ChromaDB: Run `docker-compose up chroma` or `docker run -p 8000:8000 chromadb/chroma`',
        );
        this.documentsCache = new Map(
          this.documents.map((d) => [d.metadata.source, d.pageContent]),
        );
        console.log(
          `📦 Using in-memory cache with ${this.documents.length} document chunks`,
        );
      }
    }
  }

  async searchDocuments(query: string): Promise<
    Array<{
      pageContent: string;
      metadata: { source: string };
    }>
  > {
    if (this.vectorStore) {
      const results = await this.vectorStore.similaritySearch(query, 3);
      // Transform Chroma results to our expected format
      return results.map((result) => ({
        pageContent: result.pageContent,
        metadata: { source: result.metadata.source as string },
      }));
    } else if (this.documentsCache.size > 0) {
      const results: Array<{
        pageContent: string;
        metadata: { source: string };
      }> = [];
      const queryLower = query.toLowerCase();

      for (const [source, content] of this.documentsCache.entries()) {
        if (content.toLowerCase().includes(queryLower)) {
          results.push({
            pageContent: this.extractRelevantSection(content, queryLower),
            metadata: { source },
          });
        }
      }

      return results.slice(0, 3);
    } else {
      return this.getDemoSearchResults(query);
    }
  }

  async answerQuestion(question: string): Promise<string> {
    const relevantDocs = await this.searchDocuments(question);

    if (relevantDocs.length === 0) {
      return 'No encontré información específica sobre eso en los documentos. Te sugiero contactar con RRHH para más detalles.';
    }

    const context = relevantDocs
      .map((doc) => `Fuente: ${doc.metadata.source}\n${doc.pageContent}`)
      .join('\n\n---\n\n');

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Eres Atenea, respondiendo sobre políticas de la empresa basándote en documentos oficiales.

PREGUNTA DEL USUARIO: ${question}

DOCUMENTOS RELEVANTES:
${context}

INSTRUCCIONES:
- Responde SOLO con información de los documentos proporcionados
- Si la información no está en los documentos, sugiere contactar RRHH
- Cita la fuente del documento cuando sea relevante
- Sé preciso y profesional
- Responde en español

Respuesta:`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

  private extractRelevantSection(content: string, query: string): string {
    const index = content.toLowerCase().indexOf(query);
    if (index === -1) return content.substring(0, 500);

    const start = Math.max(0, index - 200);
    const end = Math.min(content.length, index + 500);
    return '...' + content.substring(start, end) + '...';
  }

  private getDemoPDFs() {
    return [
      {
        id: 'demo-1',
        name: 'Manual_RRHH_2024.pdf',
        createdDateTime: '2024-01-15T10:00:00Z',
      },
      {
        id: 'demo-2',
        name: 'Politica_Vacaciones.pdf',
        createdDateTime: '2024-02-01T10:00:00Z',
      },
      {
        id: 'demo-3',
        name: 'Procedimientos_IT.pdf',
        createdDateTime: '2024-03-01T10:00:00Z',
      },
    ];
  }

  private getDemoSearchResults(query: string) {
    const demoContent = {
      vacaciones: {
        pageContent:
          'Los empleados tienen derecho a 22 días laborables de vacaciones anuales. Las vacaciones deben solicitarse con 15 días de antelación mínima a través del portal del empleado.',
        metadata: { source: 'Politica_Vacaciones.pdf' },
      },
      horario: {
        pageContent:
          'El horario laboral es de lunes a jueves de 9:00 a 18:00 horas, y viernes de 9:00 a 15:00. Durante el verano el horario es de 8:00 a 15:00.',
        metadata: { source: 'Manual_RRHH_2024.pdf' },
      },
      teletrabajo: {
        pageContent:
          'La política de teletrabajo permite hasta 2 días semanales de trabajo remoto. Debe solicitarse con una semana de antelación.',
        metadata: { source: 'Manual_RRHH_2024.pdf' },
      },
    };

    const queryLower = query.toLowerCase();
    const results: Array<{
      pageContent: string;
      metadata: { source: string };
    }> = [];

    for (const [key, value] of Object.entries(demoContent)) {
      if (
        queryLower.includes(key) ||
        value.pageContent.toLowerCase().includes(queryLower)
      ) {
        results.push(value);
      }
    }

    return results.length > 0 ? results : [demoContent.vacaciones];
  }
}
