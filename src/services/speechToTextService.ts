// Comprehensive Speech-to-Text service that combines multiple providers
import { elevenLabsService, type ElevenLabsTranscriptionResult } from './elevenLabsService';
import { speechRecognitionService } from './speechRecognitionService';
import { audioService } from './audioService';

export interface STTResult {
  text: string;
  confidence?: number;
  duration?: number;
  method: 'elevenlabs' | 'webspeech' | 'hybrid';
  audioQuality?: {
    size: number;
    duration: number;
    bitrate?: number;
  };
}

export interface STTOptions {
  language?: string;
  preferElevenLabs?: boolean;
  hybridMode?: boolean; // Use both methods and compare
  minAudioSize?: number; // Minimum audio size to use ElevenLabs
}

export class SpeechToTextService {
  private isElevenLabsAvailable: boolean = false;

  constructor() {
    this.checkElevenLabsAvailability();
  }

  async checkElevenLabsAvailability(): Promise<boolean> {
    try {
      this.isElevenLabsAvailable = await elevenLabsService.checkHealth();
      return this.isElevenLabsAvailable;
    } catch (error) {
      console.warn('ElevenLabs STT not available:', error);
      this.isElevenLabsAvailable = false;
      return false;
    }
  }

  async transcribe(audioBlob: Blob, options: STTOptions = {}): Promise<STTResult> {
    const {
      language = 'en',
      preferElevenLabs = true,
      hybridMode = false,
      minAudioSize = 1000
    } = options;

    // Audio quality assessment
    const audioQuality = {
      size: audioBlob.size,
      duration: await this.getAudioDuration(audioBlob),
    };

    console.log('🎙️ STT Processing:', {
      audioSize: audioQuality.size,
      duration: audioQuality.duration,
      preferElevenLabs,
      isElevenLabsAvailable: this.isElevenLabsAvailable
    });

    // Determine transcription strategy
    const useElevenLabs = this.isElevenLabsAvailable && 
                         preferElevenLabs && 
                         audioBlob.size >= minAudioSize;

    if (hybridMode && useElevenLabs) {
      return await this.hybridTranscribe(audioBlob, language, audioQuality);
    } else if (useElevenLabs) {
      return await this.elevenLabsTranscribe(audioBlob, language, audioQuality);
    } else {
      return await this.webSpeechTranscribe(audioBlob, language, audioQuality);
    }
  }

  private async elevenLabsTranscribe(
    audioBlob: Blob, 
    language: string, 
    audioQuality: any
  ): Promise<STTResult> {
    try {
      console.log('🤖 Using ElevenLabs STT...');
      
      const result = await elevenLabsService.transcribeAudio(audioBlob, {
        language,
        // Don't specify model for ElevenLabs STT - let it use default
        response_format: 'json'
      });

      return {
        text: result.text || '',
        confidence: result.confidence,
        duration: result.duration,
        method: 'elevenlabs',
        audioQuality
      };
    } catch (error) {
      console.warn('ElevenLabs STT failed, falling back to Web Speech:', error);
      return await this.webSpeechTranscribe(audioBlob, language, audioQuality);
    }
  }

  private async webSpeechTranscribe(
    audioBlob: Blob, 
    language: string, 
    audioQuality: any
  ): Promise<STTResult> {
    // For Web Speech API, we'll use the current transcript from SpeechRecognitionService
    // This is a limitation - Web Speech API doesn't work with pre-recorded audio blobs
    console.log('🌐 Using Web Speech API (live transcription)...');
    
    return {
      text: speechRecognitionService.getCurrentTranscript() || '',
      confidence: 0.8, // Estimated confidence
      duration: audioQuality.duration,
      method: 'webspeech',
      audioQuality
    };
  }

  private async hybridTranscribe(
    audioBlob: Blob, 
    language: string, 
    audioQuality: any
  ): Promise<STTResult> {
    console.log('🔄 Using Hybrid STT (ElevenLabs + Web Speech)...');
    
    try {
      // Try ElevenLabs first
      const elevenLabsResult = await this.elevenLabsTranscribe(audioBlob, language, audioQuality);
      const webSpeechText = speechRecognitionService.getCurrentTranscript() || '';

      // Compare results and use the longer/more detailed one
      const elevenLabsLength = elevenLabsResult.text.length;
      const webSpeechLength = webSpeechText.length;

      if (elevenLabsLength > webSpeechLength * 0.8) {
        // ElevenLabs result is significantly better
        return {
          ...elevenLabsResult,
          method: 'hybrid'
        };
      } else {
        // Use Web Speech result
        return {
          text: webSpeechText,
          confidence: 0.7,
          duration: audioQuality.duration,
          method: 'hybrid',
          audioQuality
        };
      }
    } catch (error) {
      return await this.webSpeechTranscribe(audioBlob, language, audioQuality);
    }
  }

  private async getAudioDuration(audioBlob: Blob): Promise<number> {
    try {
      return await audioService.getAudioDuration(audioBlob);
    } catch (error) {
      console.warn('Could not get audio duration:', error);
      return 0;
    }
  }

  // Get transcription quality assessment
  getTranscriptionQuality(result: STTResult): {
    score: number;
    level: 'excellent' | 'good' | 'fair' | 'poor';
    factors: string[];
  } {
    const factors: string[] = [];
    let score = 0;

    // Method quality
    if (result.method === 'elevenlabs') {
      score += 40;
      factors.push('AI-powered transcription');
    } else if (result.method === 'hybrid') {
      score += 35;
      factors.push('Hybrid processing');
    } else {
      score += 20;
      factors.push('Web Speech API');
    }

    // Audio quality
    if (result.audioQuality) {
      if (result.audioQuality.size > 50000) {
        score += 20;
        factors.push('High audio quality');
      } else if (result.audioQuality.size > 10000) {
        score += 10;
        factors.push('Good audio quality');
      } else {
        factors.push('Low audio quality');
      }

      if (result.audioQuality.duration > 3) {
        score += 15;
        factors.push('Sufficient duration');
      } else {
        score += 5;
        factors.push('Short duration');
      }
    }

    // Confidence
    if (result.confidence && result.confidence > 0.8) {
      score += 15;
      factors.push('High confidence');
    } else if (result.confidence && result.confidence > 0.6) {
      score += 10;
      factors.push('Medium confidence');
    }

    // Text length (more words usually means better capture)
    const wordCount = result.text.split(' ').length;
    if (wordCount > 20) {
      score += 10;
      factors.push('Detailed response');
    } else if (wordCount > 5) {
      score += 5;
      factors.push('Adequate response');
    }

    const level = score >= 80 ? 'excellent' : 
                 score >= 60 ? 'good' : 
                 score >= 40 ? 'fair' : 'poor';

    return { score, level, factors };
  }

  // Check what STT methods are available
  getAvailableMethods(): string[] {
    const methods = ['webspeech']; // Always available in browsers
    
    if (this.isElevenLabsAvailable) {
      methods.push('elevenlabs', 'hybrid');
    }
    
    return methods;
  }
}

// Export singleton instance
export const speechToTextService = new SpeechToTextService();