import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AspectRatio, VideoSettings, AnalysisResult, VideoStyle } from './types';
import { analyzeContent, generateVeoVideo } from './services/geminiService';
import { SettingsForm } from './components/SettingsForm';
import { VideoPlayer } from './components/VideoPlayer';
import { LeadForm } from './components/LeadForm';
import logo from './src/assets/logo.png';

const App: React.FC = () => {
  const [apiKeySelected, setApiKeySelected] = useState(false);

  // App Steps: Input -> Analyzing -> Review -> Generating -> Result
  const [step, setStep] = useState<'input' | 'analyzing' | 'review' | 'generating' | 'result'>('input');

  const [settings, setSettings] = useState<VideoSettings>({
    inputType: 'url',
    url: '',
    description: '',
    videoText: '',
    aspectRatio: AspectRatio.PORTRAIT,
    style: VideoStyle.CINEMATIC,
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('Produzindo seu Vídeo...');
  const [error, setError] = useState<string | null>(null);

  // Lead Form Modal State
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [hasUsedFreeCredit, setHasUsedFreeCredit] = useState(false);

  // Check API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      // Prioritize key from .env.local
      const envKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (envKey && envKey !== 'PLACEHOLDER_API_KEY') {
        setApiKeySelected(true);
        return;
      }

      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setApiKeySelected(true);
      }

      // Check credit usage
      const used = localStorage.getItem('aipyra_first_video_done') === 'true';
      setHasUsedFreeCredit(used);
    };
    checkKey();

    return () => {
      if (generatedVideoUrl && generatedVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(generatedVideoUrl);
      }
    };
  }, []);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true);
      }
    } catch (e) {
      console.error(e);
      setError("Falha ao selecionar chave API. Tente novamente.");
    }
  };

  const handleAnalysis = async () => {
    const content = settings.inputType === 'url' ? settings.url : settings.description;
    if (!content) return;

    setError(null);
    setStep('analyzing');

    try {
      // Pass videoText and style to the analysis so it gets baked into the prompt
      const result = await analyzeContent(settings.inputType, content, settings.videoText, settings.style);
      setAnalysisResult(result);
      setStep('review');
    } catch (e: any) {
      setError(e.message || "Erro durante a análise.");
      setStep('input');
    }
  };

  const handleGenerateVideo = async () => {
    if (!analysisResult) return;

    // Check if user needs to fill lead form first
    if (!hasUsedFreeCredit) {
      setShowLeadForm(true);
      return;
    }

    // If already used credit, we might want to prevent or redirect
    // For now, let's keep it open for the owner but note it for monetization
    proceedWithGeneration();
  };

  const proceedWithGeneration = async () => {
    setError(null);
    setStep('generating');

    if (generatedVideoUrl) {
      URL.revokeObjectURL(generatedVideoUrl);
      setGeneratedVideoUrl(null);
    }

    try {
      const url = await generateVeoVideo(analysisResult.suggestedPrompt, settings.aspectRatio, setGenerationStatus);
      setGeneratedVideoUrl(url);

      // Mark as used after first successful generation
      if (!hasUsedFreeCredit) {
        localStorage.setItem('aipyra_first_video_done', 'true');
        setHasUsedFreeCredit(true);
      }

      setStep('result');
    } catch (e: any) {
      console.error("Video Generation Error:", e);
      setError(e.message || "Erro ao gerar vídeo.");
      setStep('review');
    }
  };

  const resetApp = () => {
    setStep('input');
    setAnalysisResult(null);
    if (generatedVideoUrl) {
      URL.revokeObjectURL(generatedVideoUrl);
      setGeneratedVideoUrl(null);
    }
    setError(null);
    setShowLeadForm(false);
  };

  const triggerDownload = () => {
    if (generatedVideoUrl) {
      const a = document.createElement('a');
      a.href = generatedVideoUrl;
      a.download = "video-facil-aipyra.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setShowLeadForm(false);
    }
  };

  if (!apiKeySelected) {
    return (
      <div className="min-h-screen bg-[#1f2937] flex items-center justify-center p-4">
        <div className="bg-[#374151] p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl border border-gray-600">
          <div className="mx-auto mb-4">
            <img src={logo} alt="Video Facil Logo" className="h-16 w-auto mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white">Video Facil</h1>
          <p className="text-gray-300">
            Para gerar vídeos com qualidade de cinema, precisamos acessar a API do Google Veo.
            Esta é uma funcionalidade paga que requer sua própria chave de API.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-[#ff6b3d] hover:bg-[#e65b2d] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg"
          >
            Conectar Google AI Studio
          </button>
          <p className="text-xs text-gray-400">
            Saiba mais sobre o faturamento em <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[#ff6b3d] hover:underline">documentação de faturamento</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f2937] text-white pb-20 font-sans">

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <LeadForm
            onSuccess={() => {
              setShowLeadForm(false);
              proceedWithGeneration();
            }}
            onCancel={() => setShowLeadForm(false)}
            isFirstTime={!hasUsedFreeCredit}
          />
        </div>
      )}

      {/* Header */}
      <header className="bg-[#1f2937]/95 backdrop-blur border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <img src={logo} alt="Logo" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Video Facil
            </h1>
          </div>
          {step !== 'input' && (
            <button onClick={resetApp} className="text-sm text-gray-400 hover:text-white transition-colors">
              Novo Vídeo
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-start gap-3 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold">Ops, algo deu errado.</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {step === 'input' || step === 'analyzing' ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-3xl font-bold text-center mb-2">Transforme Ideias em Vídeos</h2>
            <p className="text-gray-400 text-center mb-8">
              Cole a URL de um blog ou descreva sua ideia criativa. A IA cuida do resto.
            </p>
            <SettingsForm
              settings={settings}
              setSettings={setSettings}
              onAnalyze={handleAnalysis}
              isAnalyzing={step === 'analyzing'}
            />
          </div>
        ) : null}

        {step === 'review' && analysisResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center gap-3 text-[#ff6b3d] mb-2">
              <div className="h-8 w-1 bg-[#ff6b3d] rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">Planejamento Criativo</h2>
            </div>
            <p className="text-gray-400 text-sm">
              A IA analisou sua entrada e criou o seguinte plano. <strong>Revise e aprove</strong> antes de gerar o vídeo.
            </p>

            {/* Concept Section */}
            <div className="bg-[#374151] p-6 rounded-2xl border border-[#ff6b3d]/30 shadow-lg shadow-orange-900/10">
              <h3 className="text-lg font-bold text-[#ff6b3d] mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Conceito Visual
              </h3>
              <p className="text-white text-lg leading-relaxed font-medium">"{analysisResult.concept}"</p>
            </div>

            <div className="bg-[#374151] p-6 rounded-2xl border border-gray-600">
              <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                {settings.inputType === 'url' ? 'Resumo do Artigo' : 'Estrutura da Ideia'}
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm">{analysisResult.summary}</p>
            </div>

            <div className="bg-[#374151] p-6 rounded-2xl border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Prompt Técnico (Veo)</h3>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-400">Editável</span>
              </div>
              <textarea
                className="w-full h-32 bg-[#1f2937] border border-gray-600 rounded-lg p-3 text-gray-300 focus:ring-2 focus:ring-[#ff6b3d] outline-none font-mono text-sm"
                value={analysisResult.suggestedPrompt}
                onChange={(e) => setAnalysisResult({ ...analysisResult, suggestedPrompt: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-2">
                Este é o comando exato que será enviado para a IA de vídeo.
              </p>
            </div>

            {/* Text Preview */}
            {settings.videoText && (
              <div className="bg-[#374151] p-6 rounded-2xl border border-gray-600">
                <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider mb-2">Texto Solicitado</h3>
                <p className="text-white text-lg font-mono">"{settings.videoText}"</p>
                <p className="text-xs text-gray-500 mt-1">A IA integrará este texto organicamente na cena.</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-700">
              {hasUsedFreeCredit ? (
                <div className="space-y-4">
                  <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-orange-200">
                      Você já utilizou seu crédito gratuito. Para gerar este vídeo, fale com nosso time.
                    </p>
                  </div>
                  <button
                    onClick={() => window.open('https://aipyra.com/contato', '_blank')}
                    className="w-full py-4 rounded-xl font-bold text-xl bg-[#ff6b3d] hover:bg-[#e65b2d] text-white shadow-xl transition-all flex items-center justify-center gap-3"
                  >
                    <span>Falar com Especialista</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateVideo}
                  className="w-full py-4 rounded-xl font-bold text-xl bg-[#ff6b3d] hover:bg-[#e65b2d] text-white shadow-xl hover:shadow-orange-500/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-3"
                >
                  <span>Liberar Vídeo HD Gratuitamente</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
              <p className="text-center text-xs text-gray-500 mt-3">
                {hasUsedFreeCredit ? 'Aproveite seu vídeo grátis para crescer seu negócio!' : 'Ao clicar, você iniciará a produção de um vídeo cinematográfico exclusivo.'}
              </p>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="text-center py-20 animate-in fade-in duration-500">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-[#ff6b3d] border-r-orange-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold mb-2">{generationStatus}</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              A IA Veo está transformando o conceito aprovado em realidade. Por favor, aguarde cerca de 1 min.
            </p>
          </div>
        )}

        {step === 'result' && generatedVideoUrl && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                Seu Vídeo está Pronto!
              </h2>
              <p className="text-gray-400">Aqui está o resultado gerado pelo Veo (~8s).</p>
            </div>

            <VideoPlayer
              videoUrl={generatedVideoUrl}
              aspectRatio={settings.aspectRatio}
            />

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={triggerDownload}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all text-center uppercase tracking-wide"
              >
                DOWNLOAD ARQUIVO MP4
              </button>
              <button
                onClick={resetApp}
                className="flex-1 bg-[#374151] hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
              >
                Criar Outro
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;