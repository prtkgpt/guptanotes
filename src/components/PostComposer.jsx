import { useState, useRef } from 'react';
import { usePosts } from '../contexts/PostsContext';
import { useAuth } from '../contexts/AuthContext';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useGeolocation } from '../hooks/useGeolocation';
import PostComposerToolbar from './PostComposerToolbar';
import MediaPreview from './MediaPreview';
import VoiceRecorder from './VoiceRecorder';

export default function PostComposer() {
  const { user } = useAuth();
  const { createPost } = usePosts();
  const { upload, uploading } = useMediaUpload();
  const voiceRecorder = useVoiceRecorder();
  const geolocation = useGeolocation();

  const [body, setBody] = useState('');
  const [mode, setMode] = useState(null); // null | 'image' | 'video' | 'voice' | 'checkin'
  const [stagedFile, setStagedFile] = useState(null);
  const [stagedPreview, setStagedPreview] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [posting, setPosting] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const canPost =
    body.trim() ||
    stagedFile ||
    voiceRecorder.audioBlob ||
    (mode === 'checkin' && locationName.trim());

  const handleTextChange = (e) => {
    setBody(e.target.value);
    // Auto-expand textarea
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  const handleFileSelect = (accept, fileMode) => {
    setMode(fileMode);
    // Programmatically open file picker
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStagedFile(file);
    setStagedPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const clearMedia = () => {
    if (stagedPreview) URL.revokeObjectURL(stagedPreview);
    setStagedFile(null);
    setStagedPreview(null);
    setMode(null);
  };

  const handleToggleMode = (newMode) => {
    if (mode === newMode) {
      // Cancel this mode
      clearMedia();
      voiceRecorder.reset();
      geolocation.reset();
      setLocationName('');
      setMode(null);
      return;
    }
    // Clean up previous mode
    clearMedia();
    voiceRecorder.reset();
    geolocation.reset();
    setLocationName('');

    if (newMode === 'image') {
      handleFileSelect('image/*', 'image');
    } else if (newMode === 'video') {
      handleFileSelect('video/*', 'video');
    } else {
      setMode(newMode);
    }
  };

  const handlePost = async () => {
    if (!canPost || posting) return;
    setPosting(true);

    try {
      const postData = { body: body.trim() || null };

      if (mode === 'image' && stagedFile) {
        const { url } = await upload(user.id, stagedFile, 'images');
        postData.type = 'image';
        postData.media_url = url;
        postData.media_type = stagedFile.type;
        postData.media_size_bytes = stagedFile.size;
      } else if (mode === 'video' && stagedFile) {
        const { url } = await upload(user.id, stagedFile, 'videos');
        postData.type = 'video';
        postData.media_url = url;
        postData.media_type = stagedFile.type;
        postData.media_size_bytes = stagedFile.size;
      } else if (mode === 'voice' && voiceRecorder.audioBlob) {
        const blob = voiceRecorder.audioBlob;
        const { url } = await upload(user.id, blob, 'voice');
        postData.type = 'voice';
        postData.media_url = url;
        postData.media_type = blob.type;
        postData.media_size_bytes = blob.size;
        postData.metadata = { duration: voiceRecorder.duration };
      } else if (mode === 'checkin') {
        postData.type = 'checkin';
        postData.location_name = locationName.trim() || null;
        postData.location_lat = geolocation.location?.lat || null;
        postData.location_lng = geolocation.location?.lng || null;
      } else {
        postData.type = 'text';
      }

      await createPost(postData);

      // Reset everything
      setBody('');
      clearMedia();
      voiceRecorder.reset();
      geolocation.reset();
      setLocationName('');
      setMode(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Text area */}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={handleTextChange}
        placeholder="What's on your mind?"
        rows={2}
        className="w-full resize-none border-none outline-none text-[15px] text-gray-800 placeholder-gray-400 bg-transparent leading-relaxed"
      />

      {/* Media preview */}
      {stagedPreview && (mode === 'image' || mode === 'video') && (
        <MediaPreview
          type={mode}
          previewUrl={stagedPreview}
          onRemove={clearMedia}
        />
      )}

      {/* Voice recorder */}
      {mode === 'voice' && (
        <VoiceRecorder
          recording={voiceRecorder.recording}
          audioUrl={voiceRecorder.audioUrl}
          duration={voiceRecorder.duration}
          onStart={voiceRecorder.startRecording}
          onStop={voiceRecorder.stopRecording}
          onReset={voiceRecorder.reset}
        />
      )}

      {/* Check-in input */}
      {mode === 'checkin' && (
        <div className="mt-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
          </svg>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Location name"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={geolocation.getLocation}
            disabled={geolocation.loading}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium whitespace-nowrap disabled:opacity-50"
          >
            {geolocation.loading ? 'Locating...' : 'Use GPS'}
          </button>
        </div>
      )}

      {/* Toolbar + Post button */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <PostComposerToolbar
          activeMode={mode}
          onToggleMode={handleToggleMode}
        />
        <button
          onClick={handlePost}
          disabled={!canPost || posting || uploading}
          className="px-5 py-1.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {posting || uploading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}
