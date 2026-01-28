export enum AspectRatio {
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9'
}

export enum VideoStyle {
  CINEMATIC = 'Cinemático',
  THREE_D = 'Render 3D',
  ANIME = 'Anime/Manga',
  CYBERPUNK = 'Cyberpunk',
  MINIMALIST = 'Minimalista',
  VINTAGE = 'Vintage/Retro'
}

export type InputType = 'url' | 'text';

export interface VideoSettings {
  inputType: InputType;
  url: string;
  description: string;
  videoText: string;
  aspectRatio: AspectRatio;
  style: VideoStyle;
}

export interface AnalysisResult {
  summary: string;
  concept: string; // Explicação da ideia criativa
  suggestedPrompt: string; // The visual prompt for Veo in English
  title: string;
}

export interface GeneratedVideo {
  uri: string;
  mimeType: string;
}