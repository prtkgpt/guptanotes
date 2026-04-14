export default function MediaPreview({ type, previewUrl, onRemove }) {
  return (
    <div className="relative mt-3">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {type === 'image' ? (
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full max-h-[300px] object-cover rounded-xl border border-gray-200"
        />
      ) : (
        <video
          src={previewUrl}
          controls
          className="w-full max-h-[300px] rounded-xl border border-gray-200"
        />
      )}
    </div>
  );
}
