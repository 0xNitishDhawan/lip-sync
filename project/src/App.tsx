import React, { useState, useRef } from 'react';
import { useLipSync } from './hooks/useLipSync';
import { 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Settings, 
  Mic, 
  Video, 
  FileText,
  Clock,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';

interface AudioFile {
  file: File;
  url: string;
  duration?: number;
}

interface VideoFile {
  file: File;
  url: string;
  duration?: number;
  thumbnail?: string;
}

interface Project {
  id: string;
  name: string;
  script: string;
  audioFile?: AudioFile;
  sourceVideo?: VideoFile;
  videoDuration: 60 | 90;
  voice: string;
  status: 'draft' | 'processing' | 'completed' | 'error';
  createdAt: Date;
}

function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'projects'>('create');
  const [script, setScript] = useState('');
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [sourceVideo, setSourceVideo] = useState<VideoFile | null>(null);
  const [videoDuration, setVideoDuration] = useState<60 | 90>(60);
  const [selectedVoice, setSelectedVoice] = useState('sarah');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [audioMode, setAudioMode] = useState<'tts' | 'upload'>('tts');
  const [projects, setProjects] = useState<Project[]>([]);
  
  const {
    isProcessing: isLipSyncProcessing,
    progress: lipSyncProgress,
    currentStep: lipSyncStep,
    error: lipSyncError,
    resultUrl: lipSyncResultUrl,
    startLipSync,
    reset: resetLipSync
  } = useLipSync();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const voices = [
    { id: 'sarah', name: 'Sarah', accent: 'American', gender: 'Female' },
    { id: 'david', name: 'David', accent: 'British', gender: 'Male' },
    { id: 'maria', name: 'Maria', accent: 'Spanish', gender: 'Female' },
    { id: 'james', name: 'James', accent: 'Australian', gender: 'Male' },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setAudioFile({ file, url });
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setSourceVideo({ file, url });
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setAudioFile({ file, url });
    }
  };

  const handleVideoDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setSourceVideo({ file, url });
    }
  };

  const handleGenerateVideo = async () => {
    if (!sourceVideo || !script || (audioMode === 'upload' && !audioFile)) {
      return;
    }

    resetLipSync();
    
    await startLipSync({
      sourceVideo: sourceVideo.file,
      audioFile: audioMode === 'upload' ? audioFile?.file : undefined,
      script: audioMode === 'tts' ? script : undefined,
      voice: selectedVoice,
      onProgress: (progress, step) => {
        setProgress(progress);
        setProcessingStep(step);
      },
      onComplete: (resultUrl) => {
        // Add to projects
        const newProject: Project = {
          id: Date.now().toString(),
          name: `Project ${projects.length + 1}`,
          script,
          audioFile,
          sourceVideo,
          videoDuration,
          voice: selectedVoice,
          status: 'completed',
          createdAt: new Date()
        };
        setProjects(prev => [newProject, ...prev]);
        
        // Reset form
        setScript('');
        setAudioFile(null);
        setSourceVideo(null);
      },
      onError: (error) => {
        console.error('Lip sync error:', error);
        // You can show a toast notification here
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">VideoGen Studio</h1>
            </div>
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'bg-red-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'projects'
                    ? 'bg-red-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Projects ({projects.length})
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Script & Audio */}
            <div className="lg:col-span-2 space-y-6">
              {/* Source Video Upload */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Video className="w-5 h-5 text-red-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Source Video</h2>
                  <span className="text-sm text-red-500 bg-red-50 px-2 py-1 rounded-full">Required</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Upload the video that will be used for lip sync and cloning. This person's face will be animated with your audio.
                </p>
                
                {!sourceVideo ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleVideoDrop}
                    onClick={() => videoInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-500 transition-colors"
                  >
                    <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drop video file here or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports MP4, MOV, AVI files up to 100MB
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Best results with clear face visibility and good lighting
                    </p>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <Video className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{sourceVideo.file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(sourceVideo.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSourceVideo(null)}
                        className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                      >
                        ×
                      </button>
                    </div>
                    <video 
                      ref={videoRef} 
                      src={sourceVideo.url} 
                      controls 
                      className="w-full rounded-lg"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}
              </div>

              {/* Script Input */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="w-5 h-5 text-red-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Script</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the text that will be spoken and lip-synced with your source video.
                </p>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Enter your script here... This text will be converted to speech and lip-synced with your source video."
                  className="w-full h-40 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500">
                    {script.length} characters
                  </span>
                  <span className="text-sm text-gray-500">
                    ~{Math.ceil(script.length / 160)} seconds estimated
                  </span>
                </div>
              </div>

              {/* Audio Source Selection */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Mic className="w-5 h-5 text-red-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Audio Source</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Choose how to generate the audio that will be lip-synced with your source video.
                </p>
                
                {/* Mode Toggle */}
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setAudioMode('tts')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      audioMode === 'tts'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Mic className="w-6 h-6 mx-auto mb-2 text-red-500" />
                    <div className="text-center">
                      <h3 className="font-medium text-gray-900">Text-to-Speech</h3>
                      <p className="text-sm text-gray-500">Generate audio from script</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setAudioMode('upload')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      audioMode === 'upload'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-red-500" />
                    <div className="text-center">
                      <h3 className="font-medium text-gray-900">Upload Audio</h3>
                      <p className="text-sm text-gray-500">Use your own voice recording</p>
                    </div>
                  </button>
                </div>

                {/* TTS Controls */}
                {audioMode === 'tts' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Voice Selection
                      </label>
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        {voices.map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name} ({voice.accent} {voice.gender})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                      <Play className="w-4 h-4" />
                      <span>Preview Voice</span>
                    </button>
                  </div>
                )}

                {/* Audio Upload */}
                {audioMode === 'upload' && (
                  <div>
                    {!audioFile ? (
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-500 transition-colors"
                      >
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Drop audio file here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports MP3, WAV, M4A files up to 50MB
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <Mic className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{audioFile.file.name}</p>
                              <p className="text-sm text-gray-500">
                                {(audioFile.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setAudioFile(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        </div>
                        <audio ref={audioRef} src={audioFile.url} controls className="w-full mt-4" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Settings & Controls */}
            <div className="space-y-6">
              {/* Video Settings */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Settings className="w-5 h-5 text-red-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Video Settings</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Video Duration
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setVideoDuration(60)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          videoDuration === 60
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Clock className="w-5 h-5 mx-auto mb-1 text-red-500" />
                        <span className="block text-sm font-medium">60 sec</span>
                      </button>
                      <button
                        onClick={() => setVideoDuration(90)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          videoDuration === 90
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Clock className="w-5 h-5 mx-auto mb-1 text-red-500" />
                        <span className="block text-sm font-medium">90 sec</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video Quality
                    </label>
                    <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                      <option>1080p HD</option>
                      <option>720p HD</option>
                      <option>480p SD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aspect Ratio
                    </label>
                    <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                      <option>16:9 (Landscape)</option>
                      <option>9:16 (Portrait)</option>
                      <option>1:1 (Square)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                {lipSyncError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">{lipSyncError}</span>
                    </div>
                  </div>
                )}
                
                {lipSyncResultUrl && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-700">Video generated successfully!</span>
                      </div>
                      <a
                        href={lipSyncResultUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:text-green-800 underline"
                      >
                        View Result
                      </a>
                    </div>
                  </div>
                )}
                
                {!isLipSyncProcessing ? (
                  <button
                    onClick={handleGenerateVideo}
                    disabled={!sourceVideo || !script || (audioMode === 'upload' && !audioFile)}
                    className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
                      sourceVideo && script && (audioMode === 'tts' || audioFile)
                        ? 'bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Video className="w-5 h-5" />
                      <span>Generate Lip-Sync Video</span>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                      <span className="font-medium text-gray-900">{lipSyncStep}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${lipSyncProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 text-center">{lipSyncProgress}% complete</p>
                  </div>
                )}
                
                {/* Requirements Check */}
                <div className="mt-4 space-y-2">
                  <div className={`flex items-center space-x-2 text-sm ${sourceVideo ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${sourceVideo ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Source video uploaded</span>
                  </div>
                  <div className={`flex items-center space-x-2 text-sm ${script ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${script ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Script provided</span>
                  </div>
                  <div className={`flex items-center space-x-2 text-sm ${(audioMode === 'tts' || audioFile) ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${(audioMode === 'tts' || audioFile) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Audio source configured</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Projects Tab */
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
            </div>
            
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-6">Create your first video to get started</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : project.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : project.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status === 'completed' && <Check className="w-3 h-3" />}
                        {project.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
                        {project.status === 'error' && <AlertCircle className="w-3 h-3" />}
                        <span className="capitalize">{project.status}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {project.script.substring(0, 120)}...
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                      {project.sourceVideo && (
                        <div className="flex items-center space-x-1">
                          <Video className="w-3 h-3" />
                          <span>Source video</span>
                        </div>
                      )}
                      {project.audioFile && (
                        <div className="flex items-center space-x-1">
                          <Mic className="w-3 h-3" />
                          <span>Custom audio</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{project.videoDuration}s video</span>
                      <span>{project.createdAt.toLocaleDateString()}</span>
                    </div>
                    
                    {project.status === 'completed' && (
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1">
                          <Play className="w-4 h-4" />
                          <span>Preview</span>
                        </button>
                        <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1">
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;