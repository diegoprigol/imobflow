
import { GoogleGenAI, Modality } from "@google/genai";

/* --- UTILITIES FOR AUDIO --- */

// Helper to decode base64 string to byte array
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to play raw PCM audio from Gemini TTS
export const playRawAudio = async (base64Audio: string) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const pcmData = decodeBase64(base64Audio);
    
    // Convert Int16 PCM to Float32
    const dataInt16 = new Int16Array(pcmData.buffer);
    const float32Data = new Float32Array(dataInt16.length);
    for (let i = 0; i < dataInt16.length; i++) {
      float32Data[i] = dataInt16[i] / 32768.0;
    }

    const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch (e) {
    console.error("Error playing audio:", e);
  }
};

/* --- AI FUNCTIONS --- */

// Updated to gemini-3-flash-preview for basic text tasks
export const generateLegalSummary = async (caseDetails: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um assistente jurídico experiente. Resuma os seguintes detalhes do processo em um parágrafo conciso para um relatório de status: ${caseDetails}`,
    });
    return response.text || "Não foi possível gerar o resumo.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Erro ao conectar com o serviço de IA.";
  }
};

// Updated to gemini-3-flash-preview for basic text tasks
export const generateCollectionMessage = async (tenantName: string, amount: number, daysOverdue: number): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escreva uma mensagem formal e educada de cobrança (curta, para WhatsApp) para o inquilino ${tenantName}, referente a um débito de R$ ${amount} que está atrasado há ${daysOverdue} dias. Inclua instruções para contatar o setor financeiro.`,
    });
    return response.text || "Não foi possível gerar a mensagem.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Erro ao conectar com o serviço de IA.";
  }
};

// analyzeDocumentRisk uses gemini-3-pro-preview for complex reasoning tasks
export const analyzeDocumentRisk = async (text: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analise o seguinte texto jurídico/contratual e identifique potenciais riscos, cláusulas abusivas ou pontos de atenção para a imobiliária. Seja detalhista e estratégico:\n\n${text}`,
    });
    return response.text || "Não foi possível analisar o documento.";
  } catch (error) {
    console.error("Erro Gemini Pro:", error);
    return "Erro ao analisar riscos.";
  }
};

// chatWithBot uses gemini-3-pro-preview for complex tasks
export const chatWithBot = async (message: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Você é o assistente virtual inteligente do sistema ImobFlow. Ajude o usuário com dúvidas sobre imobiliária, jurídico ou o uso do sistema. Responda de forma curta e prestativa.\n\nUsuário: ${message}`,
    });
    return response.text || "Desculpe, não entendi.";
  } catch (error) {
    return "Erro no chat.";
  }
};

// Updated model to gemini-flash-lite-latest per guidelines
export const generateQuickReply = async (clientName: string, stage: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Gere um e-mail curto e profissional de follow-up para o cliente ${clientName} que está na fase de ${stage} do funil de vendas de imóveis.`,
    });
    return response.text || "Erro ao gerar email.";
  } catch (error) {
    return "Erro ao conectar.";
  }
};

// Updated to gemini-3-flash-preview for transcription
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Audio } },
          { text: "Transcreva este áudio em português com precisão." }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Erro Transcrição:", error);
    return "Erro na transcrição.";
  }
};

// gemini-2.5-flash-preview-tts is correct for text-to-speech tasks
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });
    
    // The response contains raw PCM data in base64
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Erro TTS:", error);
    return null;
  }
};
