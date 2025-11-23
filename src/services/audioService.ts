// Audio recording and processing utilities
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
      throw new Error('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  }

  startRecording(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder chưa được khởi tạo'));
        return;
      }

      this.startTime = Date.now();
      this.audioChunks = [];
      
      try {
        this.mediaRecorder.start(1000); // Collect data every second
        resolve();
      } catch (error) {
        reject(error);
      }
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

  async stopRecording(): Promise<AudioProcessingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder chưa được khởi tạo'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const duration = (Date.now() - this.startTime) / 1000;
        const blob = new Blob(this.audioChunks, { 
          type: this.getSupportedMimeType() 
        });
        
        // Clean up
        this.cleanup();

        resolve({
          blob,
          duration,
          size: blob.size
        });
      };

      this.mediaRecorder.stop();
    });
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return '';
  }

  // Convert audio blob to different formats if needed
  async convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]); // Remove data:audio/... prefix
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Get audio duration from blob
  async getAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(blob);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio metadata'));
      };
      
      audio.src = url;
    });
  }

  // Create audio playback URL
  createPlaybackUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  // Clean up playback URL
  revokePlaybackUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const audioService = new AudioService();