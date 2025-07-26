interface SyncSoUploadResponse {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface SyncSoJobResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result_url?: string;
  error?: string;
}

class SyncSoAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_SYNCSO_API_KEY;
    this.baseUrl = import.meta.env.VITE_SYNCSO_API_URL || 'https://api.sync.so/v1';
    
    if (!this.apiKey) {
      throw new Error('Sync.so API key not found. Please check your environment variables.');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sync.so API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async uploadVideo(videoFile: File): Promise<SyncSoUploadResponse> {
    const formData = new FormData();
    formData.append('video', videoFile);

    const response = await fetch(`${this.baseUrl}/upload/video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload video: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async uploadAudio(audioFile: File): Promise<SyncSoUploadResponse> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch(`${this.baseUrl}/upload/audio`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload audio: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async createLipSyncJob(videoId: string, audioId: string): Promise<SyncSoJobResponse> {
    return this.makeRequest('/lipsync', {
      method: 'POST',
      body: JSON.stringify({
        video_id: videoId,
        audio_id: audioId,
        model: 'wav2lip',
        quality: 'high'
      }),
    });
  }

  async getJobStatus(jobId: string): Promise<SyncSoJobResponse> {
    return this.makeRequest(`/jobs/${jobId}`);
  }

  async generateTTS(text: string, voice: string = 'sarah'): Promise<SyncSoUploadResponse> {
    return this.makeRequest('/tts', {
      method: 'POST',
      body: JSON.stringify({
        text,
        voice,
        format: 'wav'
      }),
    });
  }
}

export const syncSoAPI = new SyncSoAPI();