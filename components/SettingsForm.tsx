import React from 'react';
import { AspectRatio, VideoSettings, VideoStyle } from '../types';

interface SettingsFormProps {
  settings: VideoSettings;
  setSettings: React.Dispatch<React.SetStateAction<VideoSettings>>;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  settings,
  setSettings,
  onAnalyze,
  isAnalyzing
}) => {

  const isInputValid = () => {
    if (settings.inputType === 'url') {
      try {
        const url = new URL(settings.url);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }
    if (settings.inputType === 'text') return settings.description.trim().length > 10;
    return false;
  };

  return (
    <div className="bg-[#374151] backdrop-blur-sm p-6 rounded-2xl border border-gray-600 space-y-6 shadow-xl">

      {/* Input Type Switcher */}
      <div className="flex p-1 bg-[#1f2937] rounded-xl border border-gray-700">
        <button
          onClick={() => setSettings(prev => ({ ...prev, inputType: 'url' }))}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${settings.inputType === 'url'
            ? 'bg-[#ff6b3d] text-white shadow-md'
            : 'text-gray-400 hover:text-white'
            }`}
        >
          Link do Artigo
        </button>
        <button
          onClick={() => setSettings(prev => ({ ...prev, inputType: 'text' }))}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${settings.inputType === 'text'
            ? 'bg-[#ff6b3d] text-white shadow-md'
            : 'text-gray-400 hover:text-white'
            }`}
        >
          Ideia / Roteiro
        </button>
      </div>

      {/* Input Fields based on type */}
      <div className="animate-in fade-in duration-300">
        {settings.inputType === 'url' ? (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL do Blog Post
            </label>
            <input
              type="url"
              placeholder="https://exemplo.com.br/meu-artigo"
              value={settings.url}
              onChange={(e) => setSettings(prev => ({ ...prev, url: e.target.value }))}
              className="w-full bg-[#1f2937] border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#ff6b3d] focus:outline-none transition-all placeholder-gray-500"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descreva sua Ideia
            </label>
            <textarea
              placeholder="Ex: Quero um vídeo futurista mostrando carros voadores em uma cidade cyberpunk, com cores neon e atmosfera chuvosa..."
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              className="w-full h-32 bg-[#1f2937] border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#ff6b3d] focus:outline-none transition-all placeholder-gray-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-2 text-right">
              Use palavras-chave, insights ou descreva a cena desejada.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aspect Ratio */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Formato do Vídeo
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setSettings(prev => ({ ...prev, aspectRatio: AspectRatio.PORTRAIT }))}
              className={`flex-1 py-3 px-4 rounded-lg border transition-all ${settings.aspectRatio === AspectRatio.PORTRAIT
                ? 'bg-[#ff6b3d] border-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-[#1f2937] border-gray-600 text-gray-400 hover:bg-gray-700'
                }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold">9:16</span>
                <span>Reels / Story</span>
              </div>
            </button>
            <button
              onClick={() => setSettings(prev => ({ ...prev, aspectRatio: AspectRatio.LANDSCAPE }))}
              className={`flex-1 py-3 px-4 rounded-lg border transition-all ${settings.aspectRatio === AspectRatio.LANDSCAPE
                ? 'bg-[#ff6b3d] border-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-[#1f2937] border-gray-600 text-gray-400 hover:bg-gray-700'
                }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold">16:9</span>
                <span>Youtube / TV</span>
              </div>
            </button>
          </div>
        </div>

        {/* Info Duration */}
        <div className="flex flex-col justify-center">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Duração
          </label>
          <div className="bg-[#1f2937]/50 border border-gray-600 rounded-lg p-3 text-gray-400 text-sm">
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Automático (~8s)
            </span>
            <p className="text-xs mt-1 text-gray-500">
              *A IA Veo gera clipes curtos de alta qualidade.
            </p>
          </div>
        </div>
      </div>

      {/* Style Selector */}
      <div className="border-t border-gray-600 pt-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Estilo Visual
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.values(VideoStyle).map((style) => (
            <button
              key={style}
              onClick={() => setSettings(prev => ({ ...prev, style }))}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${settings.style === style
                ? 'bg-[#ff6b3d]/20 border-[#ff6b3d] text-[#ff6b3d] shadow-sm'
                : 'bg-[#1f2937] border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Creative Text Section */}
      <div className="border-t border-gray-600 pt-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Texto na Cena (Opcional)
        </label>
        <input
          type="text"
          placeholder="Ex: Título do Vídeo, Promoção, Nome da Marca..."
          value={settings.videoText}
          onChange={(e) => setSettings(prev => ({ ...prev, videoText: e.target.value }))}
          className="w-full bg-[#1f2937] border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#ff6b3d] focus:outline-none transition-all placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 mt-2">
          A IA tentará integrar este texto visualmente na cena (ex: letreiro neon, placa, holograma) em vez de apenas sobrepor.
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={onAnalyze}
        disabled={isAnalyzing || !isInputValid()}
        className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all ${isAnalyzing || !isInputValid()
          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
          : 'bg-[#ff6b3d] hover:bg-[#e65b2d] text-white hover:shadow-orange-500/25 hover:scale-[1.01]'
          }`}
      >
        {isAnalyzing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Criando Conceito...
          </span>
        ) : (
          "Criar Conceito e Planejar Vídeo"
        )}
      </button>
    </div>
  );
};