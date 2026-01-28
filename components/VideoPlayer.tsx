import React, { useState, useEffect } from 'react';
import { AspectRatio } from '../types';

interface VideoPlayerProps {
  videoUrl: string;
  // removed textConfig as text is now baked into the video via prompt
  textConfig?: any; 
  aspectRatio: AspectRatio;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, aspectRatio }) => {
  const [hasError, setHasError] = useState(false);
  
  // Reset error when url changes
  useEffect(() => {
    setHasError(false);
  }, [videoUrl]);

  // Determine aspect ratio class
  const ratioClass = aspectRatio === AspectRatio.PORTRAIT ? 'aspect-[9/16]' : 'aspect-[16/9]';
  const containerWidth = aspectRatio === AspectRatio.PORTRAIT ? 'max-w-[320px]' : 'max-w-[600px]';

  return (
    <div className={`relative ${ratioClass} ${containerWidth} mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 group`}>
      {/* Video Element with protections */}
      {!hasError ? (
        <video 
          src={videoUrl} 
          controls 
          autoPlay 
          loop 
          // Attributes to hinder downloading
          controlsList="nodownload" 
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
          onError={(e) => {
            console.error("Video failed to load from URL:", videoUrl);
            setHasError(true);
          }}
        >
          Seu navegador não suporta a tag de vídeo.
        </video>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 text-red-500 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-bold text-white mb-1">Erro ao carregar vídeo</p>
          <p className="text-xs">O link expirou ou a chave de API é inválida.</p>
        </div>
      )}
      
      {/* Optional transparent overlay for extra protection if needed, 
          though standard controls are usually preferred for playback. 
          Right click protection is handled on the video tag. */}
    </div>
  );
};