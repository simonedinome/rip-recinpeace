import { TRANSCRIPTION_ENGINE } from '../config.js';
import * as WebSpeechEngine from './transcriber.js';
import * as WhisperEngine from './whisperTranscriber.js';
import * as GeminiEngine from './geminiTranscriber.js';

export function transcriberFactory() {
  switch (TRANSCRIPTION_ENGINE) {
    case 'whisper': return WhisperEngine;
    case 'gemini':  return GeminiEngine;
    default:        return WebSpeechEngine;
  }
}
