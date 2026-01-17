'use client';

import { useState, useEffect } from 'react';
import ImageUpload from '@/components/ImageUpload';
import VideoParamsForm, { VideoParams } from '@/components/VideoParamsForm';

type Generation = {
  id: string;
  createdAt: string;
  prompt: string;
  mode: string;
  status: string;
  resultUrl?: string;
  errorMessage?: string;
};

export default function Home() {
  const [mode, setMode] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [error, setError] = useState('');

  // Video-specific state
  const [inputImageUrls, setInputImageUrls] = useState<string[]>([]);
  const [videoParams, setVideoParams] = useState<VideoParams>({
    aspectRatio: '16:9',
    resolution: '480p',
    duration: 4,
    fixedLens: false,
    generateAudio: false,
  });

  useEffect(() => {
    fetchGenerations();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchGenerations, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchGenerations() {
    try {
      const res = await fetch('/api/generations');
      const data = await res.json();
      if (data.success) {
        setGenerations(data.generations);
      }
    } catch (err) {
      console.error('Error fetching generations:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const requestBody: any = {
        prompt,
        mode,
      };

      // Add video parameters if in video mode
      if (mode === 'video') {
        requestBody.inputImageUrls = inputImageUrls;
        requestBody.aspectRatio = videoParams.aspectRatio;
        requestBody.resolution = videoParams.resolution;
        requestBody.duration = videoParams.duration;
        requestBody.fixedLens = videoParams.fixedLens;
        requestBody.generateAudio = videoParams.generateAudio;
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (data.success) {
        setPrompt('');
        setInputImageUrls([]);
        fetchGenerations();
      } else {
        setError(data.error || 'Failed to create generation');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          AI Media Generation 🎬
        </h1>

        {/* Generation Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('image')}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    mode === 'image'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => setMode('video')}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    mode === 'video'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Video
                </button>
              </div>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'image'
                    ? 'A beautiful sunset over mountains...'
                    : 'A cat walking through a garden...'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={loading}
                required
              />
            </div>

            {/* Video-specific options */}
            {mode === 'video' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Input Images (Optional, 0-2 images)
                  </label>
                  <ImageUpload
                    onImagesChange={setInputImageUrls}
                    maxImages={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Video Settings
                  </label>
                  <VideoParamsForm
                    params={videoParams}
                    onChange={setVideoParams}
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Generating...' : `Generate ${mode === 'video' ? 'Video' : 'Image'}`}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </form>
        </div>

        {/* Generations Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Generations
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prompt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {generations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No generations yet. Create your first one above!
                    </td>
                  </tr>
                ) : (
                  generations.map((gen) => (
                    <tr key={gen.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {gen.resultUrl ? (
                          gen.mode === 'video' ? (
                            <video
                              src={gen.resultUrl}
                              controls
                              className="w-32 h-20 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <a href={gen.resultUrl} target="_blank" rel="noopener noreferrer">
                              <img
                                src={gen.resultUrl}
                                alt={gen.prompt}
                                className="w-16 h-16 object-cover rounded border border-gray-200 hover:scale-110 transition"
                              />
                            </a>
                          )
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">
                              {gen.status === 'failed' ? '✗' : '⋯'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {gen.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {gen.prompt}
                        </div>
                        {gen.errorMessage && (
                          <div className="text-xs text-red-600 mt-1">
                            Error: {gen.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={gen.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(gen.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const color = colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
      {status}
    </span>
  );
}
