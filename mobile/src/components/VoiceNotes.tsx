import { Ionicons } from '@expo/vector-icons';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { extensionFromUri, importAttachment } from '../lib/attachments';
import { makeId } from '../lib/noteUtils';
import { Theme } from '../theme';
import type { VoiceAttachment } from '../types';

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface ListProps {
  clips: VoiceAttachment[];
  onRemove?: (id: string) => void;
  theme: Theme;
}

export function VoiceClipList({ clips, onRemove, theme }: ListProps) {
  if (clips.length === 0) return null;
  return (
    <View style={styles.list}>
      {clips.map((clip) => (
        <VoiceClipRow key={clip.id} clip={clip} onRemove={onRemove} theme={theme} />
      ))}
    </View>
  );
}

function VoiceClipRow({
  clip,
  onRemove,
  theme,
}: {
  clip: VoiceAttachment;
  onRemove?: (id: string) => void;
  theme: Theme;
}) {
  const player = useAudioPlayer(clip.uri);
  const status = useAudioPlayerStatus(player);
  const playing = status.playing;

  const toggle = () => {
    if (playing) {
      player.pause();
    } else {
      if (status.didJustFinish || status.currentTime >= status.duration - 0.05) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const positionMs = status.currentTime * 1000;
  const durationMs = status.duration > 0 ? status.duration * 1000 : clip.durationMs;

  return (
    <View style={[styles.clipRow, { backgroundColor: theme.chipBg }]}>
      <TouchableOpacity onPress={toggle} hitSlop={8}>
        <Ionicons
          name={playing ? 'pause-circle' : 'play-circle'}
          size={34}
          color={theme.accent}
        />
      </TouchableOpacity>
      <View style={styles.clipInfo}>
        <View style={[styles.clipTrack, { backgroundColor: theme.dark ? '#00000055' : '#00000015' }]}>
          <View
            style={[
              styles.clipFill,
              {
                backgroundColor: theme.accent,
                width: durationMs > 0 ? `${Math.min(100, (positionMs / durationMs) * 100)}%` : '0%',
              },
            ]}
          />
        </View>
        <Text style={[styles.clipTime, { color: theme.textSecondary }]}>
          {formatDuration(playing || positionMs > 0 ? positionMs : durationMs)} /{' '}
          {formatDuration(durationMs)}
        </Text>
      </View>
      {onRemove && (
        <TouchableOpacity onPress={() => onRemove(clip.id)} hitSlop={8}>
          <Ionicons name="close" size={18} color={theme.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

interface RecorderProps {
  onRecorded: (clip: VoiceAttachment) => void;
  theme: Theme;
  /** Render prop for the trigger button so the editor controls its placement. */
  children: (start: () => void) => React.ReactNode;
}

export function VoiceRecorder({ onRecorded, theme, children }: RecorderProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [recording, setRecording] = useState(false);

  const start = async () => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone needed', 'Allow microphone access to record voice notes.');
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch (error) {
      console.warn('Failed to start recording', error);
      Alert.alert('Recording failed', 'Could not start the recorder.');
    }
  };

  const finish = async (keep: boolean) => {
    try {
      await recorder.stop();
      setRecording(false);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (keep && recorder.uri) {
        const uri = importAttachment(recorder.uri, extensionFromUri(recorder.uri, 'm4a'));
        onRecorded({
          id: makeId(),
          uri,
          durationMs: recorderState.durationMillis,
          createdAt: Date.now(),
        });
      }
    } catch (error) {
      console.warn('Failed to stop recording', error);
      setRecording(false);
    }
  };

  if (!recording) return <>{children(start)}</>;

  return (
    <View style={[styles.recordingBar, { backgroundColor: theme.chipBg }]}>
      <View style={[styles.recordingDot, { backgroundColor: theme.danger }]} />
      <Text style={[styles.recordingTime, { color: theme.text }]}>
        Recording {formatDuration(recorderState.durationMillis)}
      </Text>
      <View style={styles.recordingActions}>
        <TouchableOpacity onPress={() => finish(false)} hitSlop={8}>
          <Text style={[styles.recordingAction, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => finish(true)} hitSlop={8}>
          <Text style={[styles.recordingAction, { color: theme.accent }]}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
    paddingVertical: 6,
  },
  clipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clipInfo: {
    flex: 1,
    gap: 4,
  },
  clipTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  clipFill: {
    height: '100%',
    borderRadius: 2,
  },
  clipTime: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recordingTime: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 18,
  },
  recordingAction: {
    fontSize: 14,
    fontWeight: '600',
  },
});
