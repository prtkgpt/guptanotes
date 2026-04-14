export default function VoiceRecorder({
  recording,
  audioUrl,
  duration,
  onStart,
  onStop,
  onReset,
}) {
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
      {!audioUrl ? (
        /* Recording state */
        <div className="flex items-center gap-3">
          <button
            onClick={recording ? onStop : onStart}
            className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 transition-colors ${
              recording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-black hover:bg-gray-800 text-white'
            }`}
          >
            {recording ? (
              /* Stop icon */
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            ) : (
              /* Mic icon */
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {recording ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-gray-600 font-medium">
                Recording {formatTime(duration)}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Tap to start recording</span>
          )}
        </div>
      ) : (
        /* Preview state */
        <div className="flex items-center gap-3">
          <audio src={audioUrl} controls className="flex-1 h-10" />
          <button
            onClick={onReset}
            className="text-xs text-red-500 hover:text-red-600 font-medium whitespace-nowrap"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
}
