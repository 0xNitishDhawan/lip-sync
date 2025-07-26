import { useState, useCallback } from 'react';
import { syncSoAPI } from '../services/syncso';

interface LipSyncState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  resultUrl: string | null;
  jobId: string | null;
}

interface LipSyncOptions {
  sourceVideo: File;
  audioFile?: File;
  script?: string;
  voice?: string;
  onProgress?: (progress: number, step: string) => void;
  onComplete?: (resultUrl: string) => void;
  onError?: (error: string) => void;
}

export const useLipSync = () => {
  const [state, setState] = useState<LipSyncState>({
    isProcessing: false,
    progress: 0,
    currentStep: '',
    error: null,
    resultUrl: null,
    jobId: null,
  });

  const updateState = useCallback((updates: Partial<LipSyncState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const pollJobStatus = useCallback(async (jobId: string, onProgress?: (progress: number, step: string) => void, onComplete?: (resultUrl: string) => void, onError?: (error: string) => void) => {
    const poll = async () => {
      try {
        const jobStatus = await syncSoAPI.getJobStatus(jobId);
        
        updateState({
          progress: jobStatus.progress,
          currentStep: `Processing... ${jobStatus.progress}%`
        });

        onProgress?.(jobStatus.progress, `Processing... ${jobStatus.progress}%`);

        if (jobStatus.status === 'completed' && jobStatus.result_url) {
          updateState({
            isProcessing: false,
            resultUrl: jobStatus.result_url,
            currentStep: 'Completed!',
            progress: 100
          });
          onComplete?.(jobStatus.result_url);
        } else if (jobStatus.status === 'failed') {
          const errorMsg = jobStatus.error || 'Processing failed';
          updateState({
            isProcessing: false,
            error: errorMsg,
            currentStep: 'Failed'
          });
          onError?.(errorMsg);
        } else if (jobStatus.status === 'processing' || jobStatus.status === 'pending') {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        updateState({
          isProcessing: false,
          error: errorMsg,
          currentStep: 'Error'
        });
        onError?.(errorMsg);
      }
    };

    poll();
  }, [updateState]);

  const startLipSync = useCallback(async (options: LipSyncOptions) => {
    const { sourceVideo, audioFile, script, voice = 'sarah', onProgress, onComplete, onError } = options;

    try {
      updateState({
        isProcessing: true,
        progress: 0,
        error: null,
        resultUrl: null,
        currentStep: 'Uploading source video...'
      });

      onProgress?.(10, 'Uploading source video...');

      // Upload source video
      const videoUpload = await syncSoAPI.uploadVideo(sourceVideo);
      
      updateState({ currentStep: 'Processing audio...' });
      onProgress?.(30, 'Processing audio...');

      let audioId: string;

      if (audioFile) {
        // Upload custom audio file
        const audioUpload = await syncSoAPI.uploadAudio(audioFile);
        audioId = audioUpload.id;
      } else if (script) {
        // Generate TTS audio
        updateState({ currentStep: 'Generating speech...' });
        onProgress?.(40, 'Generating speech...');
        const ttsResult = await syncSoAPI.generateTTS(script, voice);
        audioId = ttsResult.id;
      } else {
        throw new Error('Either audio file or script must be provided');
      }

      updateState({ currentStep: 'Starting lip sync...' });
      onProgress?.(60, 'Starting lip sync...');

      // Create lip sync job
      const lipSyncJob = await syncSoAPI.createLipSyncJob(videoUpload.id, audioId);
      
      updateState({ 
        jobId: lipSyncJob.id,
        currentStep: 'Processing lip sync...' 
      });

      // Start polling for job completion
      pollJobStatus(lipSyncJob.id, onProgress, onComplete, onError);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      updateState({
        isProcessing: false,
        error: errorMsg,
        currentStep: 'Error'
      });
      onError?.(errorMsg);
    }
  }, [updateState, pollJobStatus]);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      currentStep: '',
      error: null,
      resultUrl: null,
      jobId: null,
    });
  }, []);

  return {
    ...state,
    startLipSync,
    reset,
  };
};