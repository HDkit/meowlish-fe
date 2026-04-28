// Web Speech API service for real-time speech recognition
export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
}

export type SpeechRecognitionEventHandler = (result: SpeechRecognitionResult) => void;
export type SpeechErrorEventHandler = (error: string) => void;

export class SpeechRecognitionService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isListening: boolean = false;
  private currentTranscript: string = '';
  private isInitialized: boolean = false;
  
  // Event handlers
  private onResultHandler: SpeechRecognitionEventHandler | null = null;
  private onErrorHandler: SpeechErrorEventHandler | null = null;
  private onStartHandler: (() => void) | null = null;
  private onEndHandler: (() => void) | null = null;

  constructor() {
    // Only initialize on client-side
    if (typeof window !== 'undefined') {
      this.checkSupport();
      this.initializeRecognition();
      this.isInitialized = true;
    }
  }

  private checkSupport(): void {
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return;
    }
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  private initializeRecognition(): void {
    if (typeof window === 'undefined' || !this.isSupported) {
      console.warn('Speech Recognition API is not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Set up event handlers
    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.isListening = true;
      this.onStartHandler?.();
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isListening = false;
      this.onEndHandler?.();
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
          this.currentTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }

        // Create alternatives array
        const alternatives = [];
        for (let j = 0; j < Math.min(result.length, 3); j++) {
          alternatives.push({
            transcript: result[j].transcript,
            confidence: result[j].confidence || 0
          });
        }

        this.onResultHandler?.({
          transcript: result.isFinal ? finalTranscript.trim() : interimTranscript,
          confidence: confidence || 0,
          isFinal: result.isFinal,
          alternatives
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Lỗi nhận diện giọng nói';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Không phát hiện giọng nói';
          break;
        case 'audio-capture':
          errorMessage = 'Không thể truy cập microphone';
          break;
        case 'not-allowed':
          errorMessage = 'Quyền truy cập microphone bị từ chối';
          break;
        case 'network':
          errorMessage = 'Lỗi kết nối mạng';
          break;
        case 'service-not-allowed':
          errorMessage = 'Dịch vụ nhận diện giọng nói không khả dụng';
          break;
        default:
          errorMessage = `Lỗi nhận diện giọng nói: ${event.error}`;
      }
      
      this.onErrorHandler?.(errorMessage);
    };

    this.recognition.onnomatch = () => {
      console.log('No speech recognition match');
      this.onErrorHandler?.('Không thể nhận diện được giọng nói');
    };
  }

  // Configure recognition options
  configure(options: SpeechRecognitionOptions): void {
    if (!this.recognition) return;

    this.recognition.lang = options.language || 'en-US';
    this.recognition.continuous = options.continuous ?? true;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.maxAlternatives = options.maxAlternatives || 3;
  }

  // Start speech recognition
  start(options?: SpeechRecognitionOptions): void {
    // Lazy initialize if not done yet
    if (typeof window !== 'undefined' && !this.isInitialized) {
      this.checkSupport();
      this.initializeRecognition();
      this.isInitialized = true;
    }

    if (!this.isSupported) {
      this.onErrorHandler?.('Trình duyệt không hỗ trợ nhận diện giọng nói');
      return;
    }

    if (!this.recognition) {
      this.onErrorHandler?.('Dịch vụ nhận diện giọng nói chưa được khởi tạo');
      return;
    }

    if (this.isListening) {
      console.warn('Speech recognition is already running');
      return;
    }

    // Apply options if provided
    if (options) {
      this.configure(options);
    }

    // Reset transcript
    this.currentTranscript = '';

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.onErrorHandler?.('Không thể bắt đầu nhận diện giọng nói');
    }
  }

  // Stop speech recognition
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Abort speech recognition
  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  // Check if speech recognition is supported
  isSpeechRecognitionSupported(): boolean {
    return this.isSupported;
  }

  // Check if currently listening
  isSpeechRecognitionListening(): boolean {
    return this.isListening;
  }

  // Get current accumulated transcript
  getCurrentTranscript(): string {
    return this.currentTranscript.trim();
  }

  // Clear current transcript
  clearTranscript(): void {
    this.currentTranscript = '';
  }

  // Event handler setters
  onResult(handler: SpeechRecognitionEventHandler): void {
    this.onResultHandler = handler;
  }

  onError(handler: SpeechErrorEventHandler): void {
    this.onErrorHandler = handler;
  }

  onStart(handler: () => void): void {
    this.onStartHandler = handler;
  }

  onEnd(handler: () => void): void {
    this.onEndHandler = handler;
  }

  // Get supported languages (mock data - actual implementation would query the API)
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'en-AU', name: 'English (Australia)' },
      { code: 'vi-VN', name: 'Vietnamese' },
    ];
  }
}

export const speechRecognitionService = new SpeechRecognitionService();