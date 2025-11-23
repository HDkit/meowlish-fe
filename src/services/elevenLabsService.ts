// ElevenLabs API service for speech-to-text and text-to-speech processing
export interface ElevenLabsTranscriptionOptions {
  language?: string;
  model?: 'whisper-v1' | 'whisper-v2';
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  optimize_streaming_latency?: number;
  output_format?: 'json' | 'text';
}

export interface ElevenLabsTranscriptionResult {
  text: string;
  language?: string;
  confidence?: number;
  duration?: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
}

export interface ElevenLabsTTSOptions {
  voice_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  model_id?: string; // Free tier: 'eleven_turbo_v2_5' | Paid: 'eleven_monolingual_v1', 'eleven_multilingual_v1'
  output_format?: 'mp3_44100_128' | 'mp3_22050_32' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100';
  optimize_streaming_latency?: number;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  fine_tuning: {
    is_allowed_to_fine_tune: boolean;
    state: string;
    verification_failures: string[];
    verification_attempts_count: number;
  };
  labels: Record<string, string>;
  description: string;
  preview_url: string;
  available_for_tiers: string[];
  settings: {
    stability: number;
    similarity_boost: number;
  };
}

export class ElevenLabsService {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.apiKey = apiKey || this.getAPIKey();
  }

  // Set API configuration
  configure(apiKey: string): void {
    this.apiKey = apiKey;
  }

  // Get API key from environment
  private getAPIKey(): string {
    const runtimeEnv: any = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
    const key = runtimeEnv?.VITE_ELEVENLABS_API_KEY || runtimeEnv?.REACT_APP_ELEVENLABS_API_KEY || '';
    
    // Debug logging
    console.log('🔑 ElevenLabs API Key Debug:');
    console.log('- import.meta.env exists:', typeof import.meta !== 'undefined');
    console.log('- VITE_ELEVENLABS_API_KEY:', runtimeEnv?.VITE_ELEVENLABS_API_KEY ? 'Found (length: ' + runtimeEnv.VITE_ELEVENLABS_API_KEY.length + ')' : 'Not found');
    console.log('- REACT_APP_ELEVENLABS_API_KEY:', runtimeEnv?.REACT_APP_ELEVENLABS_API_KEY ? 'Found' : 'Not found');
    console.log('- Final key:', key ? 'Found (length: ' + key.length + ')' : 'Not found');
    
    return key;
  }

  // Transcribe audio blob using ElevenLabs Speech-to-Text API
  async transcribeAudio(
    audioBlob: Blob,
    options: ElevenLabsTranscriptionOptions = {}
  ): Promise<ElevenLabsTranscriptionResult> {
    try {
      // Check if API key is valid
      if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey === 'your_elevenlabs_api_key_here') {
        throw new Error('ElevenLabs API key not configured');
      }

      console.log('🎙️ ElevenLabs STT Request:');
      console.log('- URL:', `${this.baseUrl}/speech-to-text`);
      console.log('- Audio size:', audioBlob.size, 'bytes');
      console.log('- Audio type:', audioBlob.type);
      console.log('- Language:', options.language || 'en');
      console.log('- Model specified:', !!options.model);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      
      // Add options to FormData with defaults optimized for English speech
      // Note: ElevenLabs may not require model_id for STT, let's try without it first
      if (options.model) {
        formData.append('model_id', options.model);
      }
      formData.append('language', options.language || 'en');
      formData.append('response_format', options.response_format || 'json');
      
      if (options.optimize_streaming_latency !== undefined) {
        formData.append('optimize_streaming_latency', options.optimize_streaming_latency.toString());
      }

      // Prepare headers (don't set Content-Type, let browser set it with boundary)
      const headers: HeadersInit = {
        'xi-api-key': this.apiKey,
      };

      // Make API request to Speech-to-Text endpoint
      const response = await fetch(`${this.baseUrl}/speech-to-text`, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('📡 ElevenLabs STT Response:');
      console.log('- Status:', response.status);
      console.log('- Status Text:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('❌ STT Error:', errorText);
        throw new Error(`ElevenLabs STT API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ STT Success:', result);
      
      return {
        text: result.text || result.transcript || '',
        language: result.language,
        confidence: result.confidence,
        duration: result.duration,
        segments: result.segments,
      };
    } catch (error) {
      console.warn('ElevenLabs transcription failed:', error);
      throw new Error(`Lỗi chuyển đổi giọng nói thành văn bản: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Text-to-Speech conversion using ElevenLabs
  async synthesizeSpeech(
    text: string,
    options: ElevenLabsTTSOptions = {}
  ): Promise<Blob> {
    try {
      // Check if API key is valid
      if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey === 'your_elevenlabs_api_key_here') {
        throw new Error('ElevenLabs API key not configured');
      }

      const voiceId = options.voice_id || 'pNInz6obpgDQGcFmaJgB'; // Default: Adam voice
      
      const requestBody = {
        text,
        model_id: options.model_id || 'eleven_turbo_v2_5', // Free tier model
        voice_settings: options.voice_settings || {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        }
      };

      const headers: HeadersInit = {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      };

      // Add streaming optimization if specified
      const url = new URL(`${this.baseUrl}/text-to-speech/${voiceId}`);
      if (options.optimize_streaming_latency !== undefined) {
        url.searchParams.append('optimize_streaming_latency', options.optimize_streaming_latency.toString());
      }
      if (options.output_format) {
        url.searchParams.append('output_format', options.output_format);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('ElevenLabs API key không hợp lệ');
        }
        throw new Error(`ElevenLabs TTS API error: ${response.status} ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.warn('ElevenLabs TTS failed:', error);
      throw new Error(`Lỗi chuyển đổi văn bản thành giọng nói: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get available voices
  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return this.getDefaultVoices();
    }
  }

  // Get default voices as fallback
  private getDefaultVoices(): ElevenLabsVoice[] {
    return [
      {
        voice_id: 'pNInz6obpgDQGcFmaJgB',
        name: 'Adam',
        category: 'premade',
        fine_tuning: {
          is_allowed_to_fine_tune: false,
          state: '',
          verification_failures: [],
          verification_attempts_count: 0
        },
        labels: { accent: 'american', description: 'middle aged', age: 'middle aged', gender: 'male' },
        description: 'A middle-aged American male voice',
        preview_url: '',
        available_for_tiers: ['free', 'starter', 'creator', 'pro', 'scale'],
        settings: { stability: 0.5, similarity_boost: 0.8 }
      },
      {
        voice_id: '21m00Tcm4TlvDq8ikWAM',
        name: 'Rachel',
        category: 'premade',
        fine_tuning: {
          is_allowed_to_fine_tune: false,
          state: '',
          verification_failures: [],
          verification_attempts_count: 0
        },
        labels: { accent: 'american', description: 'calm', age: 'young', gender: 'female' },
        description: 'A calm young American female voice',
        preview_url: '',
        available_for_tiers: ['free', 'starter', 'creator', 'pro', 'scale'],
        settings: { stability: 0.5, similarity_boost: 0.8 }
      },
      {
        voice_id: 'AZnzlk1XvdvUeBnXmlld',
        name: 'Domi',
        category: 'premade',
        fine_tuning: {
          is_allowed_to_fine_tune: false,
          state: '',
          verification_failures: [],
          verification_attempts_count: 0
        },
        labels: { accent: 'american', description: 'strong', age: 'young', gender: 'female' },
        description: 'A strong young American female voice',
        preview_url: '',
        available_for_tiers: ['free', 'starter', 'creator', 'pro', 'scale'],
        settings: { stability: 0.5, similarity_boost: 0.8 }
      }
    ];
  }

  // Check if ElevenLabs service is available
  async checkHealth(): Promise<boolean> {
    try {
      // If no API key, return false immediately
      if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey === 'your_elevenlabs_api_key_here') {
        console.info('ElevenLabs API key not configured, using browser fallback');
        return false;
      }

      // Test with a simple TTS request instead of /user endpoint
      // Some API keys may not have access to user info but can do TTS
      const testVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
      const requestUrl = `${this.baseUrl}/text-to-speech/${testVoiceId}`;
      const headers = {
        'xi-api-key': this.apiKey,
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json'
      };

      const requestBody = {
        text: "test", // Very short text for health check
        model_id: "eleven_turbo_v2_5", // Free tier model
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      };


      const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      

      if (!response.ok) {
        const responseText = await response.text();
        console.warn('❌ TTS Health Check failed:', responseText);
        return false;
      }
      
      // If we get audio data back, the API is working
      const blob = await response.blob();
      console.log('✅ TTS Health Check Success! Audio size:', blob.size, 'bytes');
      return true;
    } catch (error) {
      console.error('🚨 Network error in TTS health check:', error);
      return false;
    }
  }

  // Get user subscription info
  async getUserInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/user/subscription`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  // Get supported languages
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'pl', name: 'Polish' },
      { code: 'tr', name: 'Turkish' },
      { code: 'ru', name: 'Russian' },
      { code: 'nl', name: 'Dutch' },
      { code: 'cs', name: 'Czech' },
      { code: 'ar', name: 'Arabic' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'hi', name: 'Hindi' },
      { code: 'ko', name: 'Korean' },
    ];
  }

  // Enhanced transcription with retry logic
  async transcribeWithEnhancedOptions(
    audioBlob: Blob,
    options: ElevenLabsTranscriptionOptions & {
      enableTimestamps?: boolean;
      enableWordLevelTimestamps?: boolean;
      maxRetries?: number;
    } = {}
  ): Promise<ElevenLabsTranscriptionResult> {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const transcriptionOptions: ElevenLabsTranscriptionOptions = {
          ...options,
          response_format: options.enableTimestamps ? 'verbose_json' : 'json',
        };

        const result = await this.transcribeAudio(audioBlob, transcriptionOptions);
        
        // If successful, return result
        return result;
      } catch (error) {
        console.error(`Transcription attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw new Error('Max retries exceeded');
  }

  // Convert audio blob to appropriate format for ElevenLabs
  async convertAudioFormat(audioBlob: Blob): Promise<Blob> {
    // ElevenLabs supports various formats, WebM should work fine
    return audioBlob;
  }

  // Estimate processing time based on audio duration
  estimateProcessingTime(audioDurationSeconds: number): number {
    // ElevenLabs is typically faster than local Whisper
    return Math.max(audioDurationSeconds * 0.1, 1); // Minimum 1 second
  }

  // Create audio playback URL from synthesized speech
  createSpeechPlaybackUrl(audioBlob: Blob): string {
    return URL.createObjectURL(audioBlob);
  }

  // Clean up playback URL
  revokeSpeechPlaybackUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  // Batch text-to-speech for multiple texts
  async batchSynthesize(
    texts: string[],
    options: ElevenLabsTTSOptions = {}
  ): Promise<Blob[]> {
    const results: Blob[] = [];
    
    for (const text of texts) {
      try {
        const audioBlob = await this.synthesizeSpeech(text, options);
        results.push(audioBlob);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to synthesize text: "${text}"`, error);
        // Continue with other texts even if one fails
        results.push(new Blob()); // Empty blob as placeholder
      }
    }
    
    return results;
  }
}

export const elevenLabsService = new ElevenLabsService();

// Export as whisperService for backward compatibility
export const whisperService = elevenLabsService;