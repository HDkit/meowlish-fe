// Client-side only service wrapper for Speech Recognition
// This service uses browser-only APIs and must be used with 'use client'

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
  
  // Event handlers
  private onResultHandler: SpeechRecognitionEventHandler | null = null;
  private onErrorHandler: SpeechErrorEventHandler | null = null;
  private onStartHandler: (() => void) | null = null;
  private onEndHandler: (() => void) | null = null;

  constructor() {
    // SSR check - only initialize in browser
    if (typeof window === 'undefined') {
      console.warn('SpeechRecognitionService: Cannot initialize on server');
      return;
    }
    
    this.checkSupport();
    this.initializeRecognition();
  }

  private checkSupport(): void {
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return;
    }
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  private initializeRecognition(): void {
    if (!this.isSupported || typeof window === 'undefined') {
      console.warn('Speech Recognition API is not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Set default configuration
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;
    
    // Setup event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult) {
        const transcript = lastResult[0].transcript;
        const confidence = lastResult[0].confidence;
        const isFinal = lastResult.isFinal;
        
        const alternatives = [];
        for (let i = 0; i < lastResult.length; i++) {
          alternatives.push({
            transcript: lastResult[i].transcript,
            confidence: lastResult[i].confidence
          });
        }
        
        const result: SpeechRecognitionResult = {
          transcript,
          confidence,
          isFinal,
          alternatives
        };
        
        if (isFinal) {
          this.currentTranscript += ' ' + transcript;
        }
        
        if (this.onResultHandler) {
          this.onResultHandler(result);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      if (this.onErrorHandler) {
        this.onErrorHandler(event.error);
      }
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStartHandler) {
        this.onStartHandler();
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEndHandler) {
        this.onEndHandler();
      }
    };
  }

  configure(options: SpeechRecognitionOptions): void {
    if (!this.recognition) return;
    
    if (options.language) this.recognition.lang = options.language;
    if (options.continuous !== undefined) this.recognition.continuous = options.continuous;
    if (options.interimResults !== undefined) this.recognition.interimResults = options.interimResults;
    if (options.maxAlternatives) this.recognition.maxAlternatives = options.maxAlternatives;
  }

  start(): void {
    if (!this.isSupported || !this.recognition) {
      console.error('Speech Recognition is not supported');
      return;
    }
    
    if (!this.isListening) {
      this.currentTranscript = '';
      this.recognition.start();
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  isRecognitionSupported(): boolean {
    return this.isSupported;
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  getCurrentTranscript(): string {
    return this.currentTranscript.trim();
  }

  resetTranscript(): void {
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

  // Cleanup
  destroy(): void {
    this.stop();
    this.recognition = null;
    this.onResultHandler = null;
    this.onErrorHandler = null;
    this.onStartHandler = null;
    this.onEndHandler = null;
  }
}

// Helper function to create service instance only on client
export function createSpeechRecognitionService(): SpeechRecognitionService | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return new SpeechRecognitionService();
}
