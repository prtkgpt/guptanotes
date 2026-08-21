import { Ionicons } from '@expo/vector-icons';
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
import {
  bodyToChecklist,
  checklistToBody,
  displayTitle,
  extractTags,
  formatRelativeTime,
  wordCount,
} from '../lib/noteUtils';
import { noteBackground } from '../theme';
import { useNotes } from '../store/NotesContext';

interface Props {
  noteId: string;
  onClose: () => void;
}

export function EditorScreen({ noteId, onClose }: Props) {
  const { notes, theme, updateNote, deleteForever, discardIfEmpty } = useNotes();
  const insets = useSafeAreaInsets();
  const [showColors, setShowColors] = useState(false);
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

  const toggleChecklist = () => {
    if (note.checklist) {
      updateNote(note.id, { checklist: null, body: checklistToBody(note.checklist) });
    } else {
      updateNote(note.id, { checklist: bodyToChecklist(note.body), body: '' });
    }
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
              <TouchableOpacity onPress={() => setShowColors((v) => !v)} hitSlop={8}>
                <Ionicons name="color-palette-outline" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleChecklist} hitSlop={8}>
                <Ionicons
                  name={note.checklist ? 'document-text-outline' : 'checkbox-outline'}
                  size={22}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={shareNote} hitSlop={8}>
                <Ionicons name="share-outline" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  updateNote(note.id, {
                    status: note.status === 'archived' ? 'active' : 'archived',
                    pinned: false,
                  });
                  onClose();
                }}
                hitSlop={8}
              >
                <Ionicons
                  name={note.status === 'archived' ? 'arrow-up-circle-outline' : 'archive-outline'}
                  size={22}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  updateNote(note.id, { status: 'trashed', pinned: false });
                  onClose();
                }}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={22} color={theme.textSecondary} />
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
            <TouchableOpacity onPress={() => updateNote(note.id, { status: 'active' })}>
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 60 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          value={note.title}
          onChangeText={(title) => updateNote(note.id, { title })}
          placeholder="Title"
          placeholderTextColor={theme.textTertiary}
          editable={!inTrash}
          multiline
          style={[styles.titleInput, { color: theme.text }]}
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

      {/* Footer */}
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 10, borderTopColor: theme.divider },
        ]}
      >
        <Text numberOfLines={1} style={[styles.footerText, { color: theme.textTertiary }]}>
          {tags.length > 0 ? tags.map((t) => `#${t}`).join(' ') + '  ·  ' : ''}
          {words} {words === 1 ? 'word' : 'words'} · edited {formatRelativeTime(note.updatedAt)}
        </Text>
      </View>
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
    gap: 18,
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
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    paddingVertical: 8,
  },
  bodyInput: {
    fontSize: 17,
    lineHeight: 26,
    paddingTop: 4,
    minHeight: 240,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
  },
});
