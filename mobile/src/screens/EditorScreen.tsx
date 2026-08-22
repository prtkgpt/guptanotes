import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChecklistEditor } from '../components/ChecklistEditor';
import { ColorPicker } from '../components/ColorPicker';
import { ImageStrip } from '../components/ImageStrip';
import { ReminderPicker } from '../components/ReminderPicker';
import { VoiceClipList, VoiceRecorder } from '../components/VoiceNotes';
import {
  deleteAttachmentQuiet,
  extensionFromUri,
  importAttachment,
} from '../lib/attachments';
import {
  bodyToChecklist,
  checklistToBody,
  displayTitle,
  extractTags,
  formatRelativeTime,
  makeId,
  wordCount,
} from '../lib/noteUtils';
import { formatReminderTime } from '../lib/reminders';
import { noteBackground } from '../theme';
import { useNotes } from '../store/NotesContext';

interface Props {
  noteId: string;
  onClose: () => void;
}

export function EditorScreen({ noteId, onClose }: Props) {
  const { notes, theme, updateNote, setNoteStatus, setReminder, deleteForever, discardIfEmpty } =
    useNotes();
  const insets = useSafeAreaInsets();
  const [showColors, setShowColors] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const note = notes.find((n) => n.id === noteId);

  const close = () => {
    discardIfEmpty(noteId);
    onClose();
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const tags = useMemo(() => (note ? extractTags(note) : []), [note]);

  if (!note) {
    // Note was deleted from under us; bail out to the list.
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={onClose} style={{ padding: insets.top + 20 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
    );
  }

  const inTrash = note.status === 'trashed';
  const bg = noteBackground(note.color, theme);
  const bodyText = note.checklist ? checklistToBody(note.checklist) : note.body;
  const words = wordCount(`${note.title} ${bodyText}`);
  const reminderOverdue = note.reminderAt !== null && note.reminderAt < Date.now();

  const toggleChecklist = () => {
    if (note.checklist) {
      updateNote(note.id, { checklist: null, body: checklistToBody(note.checklist) });
    } else {
      updateNote(note.id, { checklist: bodyToChecklist(note.body), body: '' });
    }
  };

  const addImages = async (fromCamera: boolean) => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Camera needed', 'Allow camera access to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.85,
          allowsMultipleSelection: true,
          selectionLimit: 8,
        });
      }
      if (result.canceled) return;
      const added = result.assets.map((asset) => ({
        id: makeId(),
        uri: importAttachment(asset.uri, extensionFromUri(asset.uri, 'jpg')),
        width: asset.width ?? 0,
        height: asset.height ?? 0,
      }));
      updateNote(note.id, { images: [...note.images, ...added] });
    } catch (error) {
      console.warn('Failed to add image', error);
      Alert.alert('Could not add image', 'Something went wrong picking the image.');
    }
  };

  const promptAddImage = () => {
    Alert.alert(
      'Add image',
      undefined,
      [
        { text: 'Take photo', onPress: () => addImages(true) },
        { text: 'Choose from library', onPress: () => addImages(false) },
        ...(Platform.OS === 'ios' ? [{ text: 'Cancel', style: 'cancel' as const }] : []),
      ],
      { cancelable: true },
    );
  };

  const removeImage = (imageId: string) => {
    const image = note.images.find((i) => i.id === imageId);
    if (image) deleteAttachmentQuiet(image.uri);
    updateNote(note.id, { images: note.images.filter((i) => i.id !== imageId) });
  };

  const removeVoice = (clipId: string) => {
    const clip = note.voice.find((c) => c.id === clipId);
    if (clip) deleteAttachmentQuiet(clip.uri);
    updateNote(note.id, { voice: note.voice.filter((c) => c.id !== clipId) });
  };

  const shareNote = async () => {
    const text = [note.title.trim(), bodyText.trim()].filter(Boolean).join('\n\n');
    try {
      await Share.share({ message: text || 'Empty note', title: displayTitle(note) });
    } catch {
      // User dismissed the share sheet.
    }
  };

  const confirmDeleteForever = () => {
    Alert.alert('Delete forever?', 'This note cannot be recovered.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteForever(note.id);
          onClose();
        },
      },
    ]);
  };

  const onSetReminder = async (when: number | null) => {
    const ok = await setReminder(note.id, when);
    if (!ok && when !== null) {
      Alert.alert(
        'Reminder not set',
        'Notifications are unavailable. Check notification permissions (on Android, reminders need a development build rather than Expo Go).',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={close} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.topActions}>
          {!inTrash && (
            <>
              <TouchableOpacity onPress={() => setShowReminder(true)} hitSlop={8}>
                <Ionicons
                  name={note.reminderAt ? 'notifications' : 'notifications-outline'}
                  size={22}
                  color={note.reminderAt ? theme.accent : theme.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowColors((v) => !v)} hitSlop={8}>
                <Ionicons name="color-palette-outline" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateNote(note.id, { pinned: !note.pinned })}
                hitSlop={8}
              >
                <Ionicons
                  name={note.pinned ? 'pin' : 'pin-outline'}
                  size={22}
                  color={note.pinned ? theme.accent : theme.textSecondary}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {showColors && !inTrash && (
        <View style={styles.colorRow}>
          <ColorPicker
            selected={note.color}
            onSelect={(color) => updateNote(note.id, { color })}
            theme={theme}
          />
        </View>
      )}

      {inTrash && (
        <View style={[styles.trashBanner, { backgroundColor: theme.chipBg }]}>
          <Text style={[styles.trashText, { color: theme.textSecondary }]}>
            This note is in the Trash
          </Text>
          <View style={styles.trashActions}>
            <TouchableOpacity onPress={() => setNoteStatus(note.id, 'active')}>
              <Text style={[styles.trashAction, { color: theme.accent }]}>Restore</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDeleteForever}>
              <Text style={[styles.trashAction, { color: theme.danger }]}>Delete forever</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {note.reminderAt !== null && (
          <TouchableOpacity
            onPress={() => !inTrash && setShowReminder(true)}
            style={[
              styles.reminderChip,
              { backgroundColor: theme.chipBg, borderColor: theme.surfaceBorder },
            ]}
          >
            <Ionicons
              name="alarm-outline"
              size={14}
              color={reminderOverdue ? theme.danger : theme.textSecondary}
            />
            <Text
              style={[
                styles.reminderChipText,
                { color: reminderOverdue ? theme.danger : theme.textSecondary },
              ]}
            >
              {formatReminderTime(note.reminderAt)}
              {reminderOverdue ? ' (past)' : ''}
            </Text>
          </TouchableOpacity>
        )}

        <TextInput
          value={note.title}
          onChangeText={(title) => updateNote(note.id, { title })}
          placeholder="Title"
          placeholderTextColor={theme.textTertiary}
          editable={!inTrash}
          multiline
          style={[styles.titleInput, { color: theme.text }]}
        />

        <ImageStrip
          images={note.images}
          onRemove={inTrash ? undefined : removeImage}
          theme={theme}
        />
        <VoiceClipList
          clips={note.voice}
          onRemove={inTrash ? undefined : removeVoice}
          theme={theme}
        />

        {note.checklist ? (
          <ChecklistEditor
            items={note.checklist}
            onChange={(items) => updateNote(note.id, { checklist: items })}
            theme={theme}
            editable={!inTrash}
          />
        ) : (
          <TextInput
            value={note.body}
            onChangeText={(body) => updateNote(note.id, { body })}
            placeholder="Start writing… use #tags anywhere"
            placeholderTextColor={theme.textTertiary}
            editable={!inTrash}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
            style={[styles.bodyInput, { color: theme.text }]}
          />
        )}
      </ScrollView>

      {/* Bottom toolbar + footer */}
      {!inTrash && (
        <View style={[styles.bottomBar, { borderTopColor: theme.divider }]}>
          <VoiceRecorder
            theme={theme}
            onRecorded={(clip) => updateNote(note.id, { voice: [...note.voice, clip] })}
          >
            {(startRecording) => (
              <View style={styles.toolRow}>
                <TouchableOpacity onPress={toggleChecklist} hitSlop={8}>
                  <Ionicons
                    name={note.checklist ? 'document-text-outline' : 'checkbox-outline'}
                    size={22}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={promptAddImage} hitSlop={8}>
                  <Ionicons name="image-outline" size={22} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={startRecording} hitSlop={8}>
                  <Ionicons name="mic-outline" size={22} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={shareNote} hitSlop={8}>
                  <Ionicons name="share-outline" size={22} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setNoteStatus(note.id, note.status === 'archived' ? 'active' : 'archived');
                    onClose();
                  }}
                  hitSlop={8}
                >
                  <Ionicons
                    name={
                      note.status === 'archived' ? 'arrow-up-circle-outline' : 'archive-outline'
                    }
                    size={22}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setNoteStatus(note.id, 'trashed');
                    onClose();
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={22} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </VoiceRecorder>
        </View>
      )}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Text numberOfLines={1} style={[styles.footerText, { color: theme.textTertiary }]}>
          {tags.length > 0 ? tags.map((t) => `#${t}`).join(' ') + '  ·  ' : ''}
          {words} {words === 1 ? 'word' : 'words'} · edited {formatRelativeTime(note.updatedAt)}
        </Text>
      </View>

      <ReminderPicker
        visible={showReminder}
        current={note.reminderAt}
        onClose={() => setShowReminder(false)}
        onSet={onSetReminder}
        theme={theme}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  topActions: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  colorRow: {
    paddingBottom: 10,
  },
  trashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  trashText: {
    fontSize: 13,
  },
  trashActions: {
    flexDirection: 'row',
    gap: 16,
  },
  trashAction: {
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  reminderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 2,
  },
  reminderChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    paddingVertical: 8,
  },
  bodyInput: {
    fontSize: 17,
    lineHeight: 26,
    paddingTop: 4,
    minHeight: 200,
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
  },
});
