// Client-side only service for audio recording
// This service uses MediaRecorder API and must be used with 'use client'

export interface AudioRecordingOptions {
  sampleRate?: number;
  channelCount?: number;
  audioBitsPerSecond?: number;
}

export interface AudioProcessingResult {
  blob: Blob;
  duration: number;
  size: number;
}

export class AudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private stream: MediaStream | null = null;

  async initializeRecording(options: AudioRecordingOptions = {}): Promise<MediaRecorder> {
    // SSR check
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      throw new Error('AudioService can only be used in browser environment');
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: options.sampleRate || 44100,
          channelCount: options.channelCount || 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Create MediaRecorder
      const mediaRecorderOptions: MediaRecorderOptions = {
        mimeType: this.getSupportedMimeType(),
      };

      if (options.audioBitsPerSecond) {
        mediaRecorderOptions.audioBitsPerSecond = options.audioBitsPerSecond;
      }

      this.mediaRecorder = new MediaRecorder(this.stream, mediaRecorderOptions);
      this.audioChunks = [];

      // Setup event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      return this.mediaRecorder;
    } catch (error) {
      console.error('Failed to initialize audio recording:', error);
      throw error;
    }
  }

  private getSupportedMimeType(): string {
    if (typeof window === 'undefined') return '';
    
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return '';
  }

  startRecording(): void {
    if (!this.mediaRecorder) {
      throw new Error('MediaRecorder not initialized. Call initializeRecording first.');
    }

    this.audioChunks = [];
    this.startTime = Date.now();
    this.mediaRecorder.start(100); // Collect data every 100ms
  }

  stopRecording(): Promise<AudioProcessingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const duration = Date.now() - this.startTime;
        const mimeType = this.getSupportedMimeType();
        const blob = new Blob(this.audioChunks, { type: mimeType });

        resolve({
          blob,
          duration,
          size: blob.size
        });

        // Cleanup
        this.audioChunks = [];
      };

      this.mediaRecorder.stop();
    });
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  isPaused(): boolean {
    return this.mediaRecorder?.state === 'paused';
  }

  cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  // Convert blob to base64 for API transmission
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
        reject(new Error('FileReader not available'));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Create audio URL for playback
  createAudioURL(blob: Blob): string {
    if (typeof window === 'undefined' || typeof URL === 'undefined') {
      throw new Error('URL API not available');
    }
    return URL.createObjectURL(blob);
  }

  // Revoke audio URL to free memory
  revokeAudioURL(url: string): void {
    if (typeof window !== 'undefined' && typeof URL !== 'undefined') {
      URL.revokeObjectURL(url);
    }
  }
}

// Helper to create service instance only on client
export function createAudioService(): AudioService | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return new AudioService();
}
