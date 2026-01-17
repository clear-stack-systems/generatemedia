'use client';

export type VideoParams = {
  aspectRatio: string;
  resolution: string;
  duration: number;
  fixedLens: boolean;
  generateAudio: boolean;
};

type VideoParamsFormProps = {
  params: VideoParams;
  onChange: (params: VideoParams) => void;
};

export default function VideoParamsForm({ params, onChange }: VideoParamsFormProps) {
  const handleChange = (field: keyof VideoParams, value: any) => {
    onChange({ ...params, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Aspect Ratio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aspect Ratio
          </label>
          <select
            value={params.aspectRatio}
            onChange={(e) => handleChange('aspectRatio', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1:1">1:1 (Square)</option>
            <option value="16:9">16:9 (Widescreen)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="4:3">4:3 (Standard)</option>
            <option value="3:4">3:4 (Portrait)</option>
          </select>
        </div>

        {/* Resolution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resolution
          </label>
          <select
            value={params.resolution}
            onChange={(e) => handleChange('resolution', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="480p">480p (SD)</option>
            <option value="720p">720p (HD)</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration
          </label>
          <select
            value={params.duration}
            onChange={(e) => handleChange('duration', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="4">4 seconds</option>
            <option value="8">8 seconds</option>
            <option value="12">12 seconds</option>
          </select>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={params.fixedLens}
            onChange={(e) => handleChange('fixedLens', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            Fixed Lens (static camera)
          </span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={params.generateAudio}
            onChange={(e) => handleChange('generateAudio', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            Generate Audio
          </span>
        </label>
      </div>
    </div>
  );
}
