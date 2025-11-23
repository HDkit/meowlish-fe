// Backward compatibility wrapper for ElevenLabs service
import { 
  elevenLabsService,
  ElevenLabsTranscriptionOptions,
  ElevenLabsTranscriptionResult,
  ElevenLabsTTSOptions
} from './elevenLabsService';

// Legacy interfaces for backward compatibility
export interface WhisperTranscriptionOptions extends ElevenLabsTranscriptionOptions {
  // Additional options that were in Whisper but not in ElevenLabs
  task?: 'transcribe' | 'translate';
  temperature?: number;
}

export interface WhisperTranscriptionResult extends ElevenLabsTranscriptionResult {}

export class WhisperService {
  // Delegate all methods to ElevenLabsService
  async transcribeAudio(
    audioBlob: Blob,
    options: WhisperTranscriptionOptions = {}
  ): Promise<WhisperTranscriptionResult> {
    // Convert Whisper options to ElevenLabs options
    const elevenLabsOptions: ElevenLabsTranscriptionOptions = {
      language: options.language,
      model: options.model as any, // ElevenLabs uses different model names
      response_format: options.response_format,
      optimize_streaming_latency: options.optimize_streaming_latency,
      output_format: options.output_format
    };

    return elevenLabsService.transcribeAudio(audioBlob, elevenLabsOptions);
  }

  async translateAudio(
    audioBlob: Blob,
    options: Omit<WhisperTranscriptionOptions, 'task'> = {}
  ): Promise<WhisperTranscriptionResult> {
    // Note: ElevenLabs doesn't have direct translation, but we can transcribe
    // and then translate the text using another service if needed
    return this.transcribeAudio(audioBlob, options);
  }

  async checkHealth(): Promise<boolean> {
    return elevenLabsService.checkHealth();
  }

  async getAvailableModels(): Promise<string[]> {
    // ElevenLabs has different models
    return ['whisper-v1', 'whisper-v2'];
  }

  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return elevenLabsService.getSupportedLanguages();
  }

  async transcribeWithEnhancedOptions(
    audioBlob: Blob,
    options: WhisperTranscriptionOptions & {
      enableTimestamps?: boolean;
      enableWordLevelTimestamps?: boolean;
      maxRetries?: number;  
    } = {}
  ): Promise<WhisperTranscriptionResult> {
    return elevenLabsService.transcribeWithEnhancedOptions(audioBlob, options);
  }

  async convertAudioFormat(audioBlob: Blob): Promise<Blob> {
    return elevenLabsService.convertAudioFormat(audioBlob);
  }

  estimateProcessingTime(audioDurationSeconds: number): number {
    return elevenLabsService.estimateProcessingTime(audioDurationSeconds);
  }

  configure(apiKey: string): void {
    elevenLabsService.configure(apiKey);
  }
}

// Create singleton instance
export const whisperService = new WhisperService();