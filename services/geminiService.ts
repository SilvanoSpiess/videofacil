import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AspectRatio, InputType, VideoStyle } from "../types";

// Helper to get the AI client. MUST be called inside the function to ensure the key is fresh.
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error("API Key not found. Please select an API key or define VITE_GEMINI_API_KEY in .env.local.");
  }
  return new GoogleGenAI({ apiKey });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Safe JSON stringify to avoid circular reference errors
const safeStringify = (obj: any): string => {
  try {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]';
        }
        cache.add(value);
      }
      return value;
    });
  } catch (e) {
    return String(obj);
  }
};

const isRetryableError = (e: any): boolean => {
  if (!e) return false;
  const code = e.code || e.error?.code || e.status;
  const message = e.message || e.error?.message || (typeof e === 'string' ? e : safeStringify(e));
  const status = e.status || e.error?.status;

  const isOverloaded =
    code === 503 ||
    code === 429 ||
    code === 'UNAVAILABLE' ||
    status === 'UNAVAILABLE' ||
    String(message).includes('503') ||
    String(message).toLowerCase().includes('overloaded') ||
    String(message).includes('UNAVAILABLE') ||
    String(message).toLowerCase().includes('too many requests');

  const isNetworkError = String(message).toLowerCase().includes('fetch') || String(message).toLowerCase().includes('network');

  return isOverloaded || isNetworkError;
};

export const analyzeContent = async (inputType: InputType, content: string, videoText?: string, style?: VideoStyle): Promise<AnalysisResult> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";

  let specificPrompt = "";

  if (inputType === 'url') {
    specificPrompt = `VOCÊ É UM PRODUTOR SÊNIOR DE VÍDEO E ESPECIALISTA EM MARKETING VIRAL (Reels/TikTok).
    1. Analise o conteúdo desta URL: ${content}.
    2. Extraia o "Gancho Emocional" e os pontos de venda mais fortes.
    3. Resuma o ponto principal em Português de forma persuasiva.`;
  } else {
    specificPrompt = `VOCÊ É UM PRODUTOR SÊNIOR DE VÍDEO E ENGENHEIRO DE PROMPTS AVANÇADO.
    O usuário tem uma ideia bruta: "${content}".
    1. Transforme essa ideia em um conceito de Marketing de alto impacto.
    2. Resuma o conceito em Português focado em conversão e desejo visual.`;
  }

  const textInstruction = videoText
    ? `VOCÊ DEVE INTEGRAR O TEXTO "${videoText}" NA CENA de forma cinematográfica. 
       Exemplos: Letreiro neon vibrante no fundo, texto escrito em um menu premium, gravado em uma superfície de madeira, ou um overlay estilizado de social media (TikTok/Insta style) que faça parte da composição visual.`
    : `O vídeo não deve conter texto escrito.`;

  const prompt = `
    ${specificPrompt}
    
    OBJETIVO: Criar um vídeo curto (Vertical 9:16) que seja visualmente "hipnotizante" e comercialmente impecável para Instagram/TikTok.
    
    TAREFAS:
    
    1. CONCEITO CRIATIVO (PT-BR): Explique a estratégia de Mkt por trás do vídeo (por que ele vai viralizar e atrair clientes).
    
    2. VISUAL PROMPT (ENGLISH - VEO): Crie o prompt técnico definitivo para a IA Veo.
       REGRAS PARA O PROMPT VEO:
       - MOVIEMENTO: Use termos como "Cinematic slow push-in", "Dynamic tracking shot", "Smooth handheld 4k", "Gliding camera orbit". Evite cenas estáticas.
       - ILUMINAÇÃO: Use "Golden hour rim lighting", "Soft professional studio lighting", " Moody cinematic shadows", "Vibrant appetizing color grading".
       - DETALHES: Se houver comida, foque em texturas, vapor, brilho e frescor. Se houver pessoas, descreva expressões de satisfação e diversidade étnica (Latino, Negro, Asiático, etc).
       - ESTILO: ${style || 'Cinematográfico'}.
       - ${textInstruction}
       - O prompt deve ser um parágrafo longo, técnico e extremamente visual em INGLÊS.
    
    3. TÍTULO (PT-BR): Um título magnético para o vídeo.

    Retorne APENAS um JSON:
    {
      "summary": "Resumo estratégico...",
      "concept": "Estratégia de engajamento...",
      "suggestedPrompt": "Technical English prompt...",
      "title": "Título comercial"
    }
  `;

  let lastError;
  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Análise] Tentativa ${attempt}/${maxRetries}...`);

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: inputType === 'url' ? [{ googleSearch: {} }] : [],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              concept: { type: Type.STRING },
              suggestedPrompt: { type: Type.STRING },
              title: { type: Type.STRING }
            },
            required: ["summary", "concept", "suggestedPrompt", "title"]
          }
        },
      });

      const text = response.text;
      if (!text) throw new Error("Falha ao analisar o conteúdo (resposta vazia).");

      return JSON.parse(text) as AnalysisResult;

    } catch (e: any) {
      console.error(`Erro na tentativa ${attempt}:`, safeStringify(e));
      lastError = e;

      if (isRetryableError(e) && attempt < maxRetries) {
        const baseDelay = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        const waitTime = Math.min(baseDelay + jitter, 25000);

        console.log(`Serviço instável (503/Network). Aguardando ${Math.round(waitTime)}ms...`);
        await delay(waitTime);
        continue;
      }
      break;
    }
  }

  const errorMsg = lastError?.error?.message || lastError?.message || safeStringify(lastError);
  throw new Error(`Não foi possível analisar o conteúdo após ${maxRetries} tentativas. Erro: ${errorMsg}`);
};

export const generateVeoVideo = async (
  prompt: string,
  aspectRatio: AspectRatio,
  onStatusUpdate?: (status: string) => void
): Promise<string> => {
  const ai = getAiClient();
  const model = "veo-3.1-fast-generate-preview";

  onStatusUpdate?.("Iniciando conexão com Google Veo...");
  console.log("Starting generation with prompt:", prompt);

  let operation;
  let lastError;
  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      onStatusUpdate?.("Enviando solicitação de processamento...");
      operation = await ai.models.generateVideos({
        model,
        prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio === AspectRatio.PORTRAIT ? '9:16' : '16:9',
        }
      });
      break;
    } catch (e: any) {
      console.error(`Erro ao iniciar geração de vídeo (tentativa ${attempt}):`, safeStringify(e));
      lastError = e;
      if (isRetryableError(e) && attempt < maxRetries) {
        const isQuotaError = e.message?.includes('quota') || e.status === 'RESOURCE_EXHAUSTED' || e.code === 429;
        const baseDelay = Math.pow(2, attempt) * 2000;
        const jitter = Math.random() * 1000;
        const waitTime = Math.min(baseDelay + jitter, 30000);

        const statusMsg = isQuotaError
          ? `Limite de cota atingido (Google AI Studio). Tentando liberar em ${Math.round(waitTime / 1000)}s...`
          : `Serviço instável. Tentando novamente em ${Math.round(waitTime / 1000)}s...`;

        onStatusUpdate?.(statusMsg);
        console.log(`Erro ${e.code || 'API'} ao iniciar vídeo. Aguardando ${Math.round(waitTime)}ms...`);
        await delay(waitTime);
        continue;
      }
      throw new Error(`Falha ao iniciar geração de vídeo: ${e.message || safeStringify(e)}`);
    }
  }

  if (!operation) throw new Error(`Falha interna na operação de vídeo após ${maxRetries} tentativas.`);

  onStatusUpdate?.("Vídeo em fila de processamento...");

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    try {
      operation = await ai.operations.getVideosOperation({ operation });

      const state = (operation.metadata as any)?.state || 'PROCESSING';
      if (state === 'ACTIVE') onStatusUpdate?.("IA Veo renderizando frames...");
      else if (state === 'PROCESSING') onStatusUpdate?.("Processando inteligência visual...");

      console.log("Checking video generation status...", operation.metadata);
    } catch (e: any) {
      if (isRetryableError(e)) {
        onStatusUpdate?.("Aguardando resposta do servidor...");
        console.log("Erro ao verificar status (503), tentando novamente em breve...");
        continue;
      }
      throw e;
    }
  }

  onStatusUpdate?.("Finalizando e baixando arquivo...");

  if (operation.error) {
    throw new Error(`Erro na geração do vídeo: ${operation.error.message}`);
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!videoUri) {
    throw new Error("Nenhum vídeo foi retornado pela API.");
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error("API Key não encontrada ao finalizar o vídeo. Por favor, recarregue a página e selecione a chave novamente.");
  }

  // Sanitize key
  const cleanKey = apiKey.trim().replace(/['"]/g, '');
  const separator = videoUri.includes('?') ? '&' : '?';
  const downloadUrl = `${videoUri}${separator}key=${cleanKey}`;

  // Fetch the video blob explicitly to handle errors and avoid 400 in <video> tag
  try {
    console.log("Downloading video...");
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      console.error("Video download failed:", errorBody);

      const errorMessage = typeof errorBody === 'object' && errorBody.error?.message
        ? errorBody.error.message
        : `Status ${response.status}`;

      throw new Error(`Falha ao baixar arquivo de vídeo: ${errorMessage}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (e: any) {
    throw new Error(`Erro no download do vídeo: ${e.message || safeStringify(e)}`);
  }
};