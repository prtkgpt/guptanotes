import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TagFilterBar } from '../components/FilterBar';
import { NoteCard } from '../components/NoteCard';
import { allTags, hasTag, matchesSearch, sortNotes } from '../lib/noteUtils';
import { useNotes } from '../store/NotesContext';
import type { Note, NoteStatus, SortMode } from '../types';

interface Props {
  onOpenNote: (id: string) => void;
  onCreateNote: (checklist: boolean) => void;
}

const FOLDERS: { key: NoteStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'active', label: 'Notes', icon: 'document-text-outline' },
  { key: 'archived', label: 'Archive', icon: 'archive-outline' },
  { key: 'trashed', label: 'Trash', icon: 'trash-outline' },
];

const SORT_LABELS: Record<SortMode, string> = {
  edited: 'Last edited',
  created: 'Newest',
  alpha: 'A–Z',
};

const NEXT_SORT: Record<SortMode, SortMode> = {
  edited: 'created',
  created: 'alpha',
  alpha: 'edited',
};

export function NotesListScreen({ onOpenNote, onCreateNote }: Props) {
  const {
    notes,
    ready,
    theme,
    viewMode,
    setViewMode,
    sortMode,
    setSortMode,
    themePreference,
    setThemePreference,
    updateNote,
    deleteForever,
    emptyTrash,
  } = useNotes();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState<NoteStatus>('active');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const folderNotes = useMemo(
    () => notes.filter((note) => note.status === folder),
    [notes, folder],
  );
  const tags = useMemo(() => allTags(folderNotes), [folderNotes]);

  const visible = useMemo(() => {
    const filtered = folderNotes.filter(
      (note) => matchesSearch(note, query) && hasTag(note, activeTag),
    );
    return sortNotes(filtered, sortMode);
  }, [folderNotes, query, activeTag, sortMode]);

  type Row =
    | { type: 'header'; key: string; text: string }
    | { type: 'notes'; key: string; notes: Note[] };

  const rows = useMemo<Row[]>(() => {
    const columns = viewMode === 'grid' ? 2 : 1;
    const chunk = (list: Note[], prefix: string): Row[] => {
      const out: Row[] = [];
      for (let i = 0; i < list.length; i += columns) {
        out.push({
          type: 'notes',
          key: `${prefix}-${list[i].id}`,
          notes: list.slice(i, i + columns),
        });
      }
      return out;
    };
    const pinned = folder === 'active' ? visible.filter((n) => n.pinned) : [];
    const others = folder === 'active' ? visible.filter((n) => !n.pinned) : visible;
    if (pinned.length === 0) return chunk(others, 'n');
    return [
      { type: 'header', key: 'h-pinned', text: 'Pinned' },
      ...chunk(pinned, 'p'),
      ...(others.length > 0
        ? [{ type: 'header', key: 'h-others', text: 'Others' } as Row, ...chunk(others, 'n')]
        : []),
    ];
  }, [visible, viewMode, folder]);

  const showNoteActions = (note: Note) => {
    const buttons = [];
    if (note.status === 'active') {
      buttons.push(
        {
          text: note.pinned ? 'Unpin' : 'Pin',
          onPress: () => updateNote(note.id, { pinned: !note.pinned }),
        },
        {
          text: 'Archive',
          onPress: () => updateNote(note.id, { status: 'archived' as const, pinned: false }),
        },
        {
          text: 'Move to Trash',
          style: 'destructive' as const,
          onPress: () => updateNote(note.id, { status: 'trashed' as const, pinned: false }),
        },
      );
    } else if (note.status === 'archived') {
      buttons.push(
        {
          text: 'Unarchive',
          onPress: () => updateNote(note.id, { status: 'active' as const }),
        },
        {
          text: 'Move to Trash',
          style: 'destructive' as const,
          onPress: () => updateNote(note.id, { status: 'trashed' as const }),
        },
      );
    } else {
      buttons.push(
        {
          text: 'Restore',
          onPress: () => updateNote(note.id, { status: 'active' as const }),
        },
        {
          text: 'Delete forever',
          style: 'destructive' as const,
          onPress: () =>
            Alert.alert('Delete forever?', 'This note cannot be recovered.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteForever(note.id),
              },
            ]),
        },
      );
    }
    // Android alerts cap at 3 buttons and dismiss on outside tap, so Cancel is iOS-only.
    if (Platform.OS === 'ios') {
      buttons.push({ text: 'Cancel', style: 'cancel' as const });
    }
    Alert.alert('Note actions', undefined, buttons, { cancelable: true });
  };

  const cycleTheme = () => {
    const next =
      themePreference === 'system' ? 'dark' : themePreference === 'dark' ? 'light' : 'system';
    setThemePreference(next);
  };

  const themeIcon =
    themePreference === 'system'
      ? 'contrast-outline'
      : themePreference === 'dark'
        ? 'moon-outline'
        : 'sunny-outline';

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.appTitle, { color: theme.text }]}>Gupta Notes</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={cycleTheme} hitSlop={8}>
            <Ionicons name={themeIcon} size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            hitSlop={8}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
              size={22}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: theme.searchBg }]}>
        <Ionicons name="search" size={18} color={theme.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search notes, tags…"
          placeholderTextColor={theme.textTertiary}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
        />
        {query !== '' && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Folder tabs */}
      <View style={styles.folderRow}>
        {FOLDERS.map((f) => {
          const active = folder === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => {
                setFolder(f.key);
                setActiveTag(null);
              }}
              style={[
                styles.folderTab,
                { backgroundColor: active ? theme.chipActiveBg : 'transparent' },
              ]}
            >
              <Ionicons
                name={f.icon}
                size={15}
                color={active ? theme.chipActiveText : theme.textTertiary}
              />
              <Text
                style={[
                  styles.folderLabel,
                  { color: active ? theme.chipActiveText : theme.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={styles.spacer} />
        <TouchableOpacity
          onPress={() => setSortMode(NEXT_SORT[sortMode])}
          style={styles.sortButton}
          hitSlop={8}
        >
          <Ionicons name="swap-vertical" size={14} color={theme.textTertiary} />
          <Text style={[styles.sortLabel, { color: theme.textTertiary }]}>
            {SORT_LABELS[sortMode]}
          </Text>
        </TouchableOpacity>
      </View>

      <TagFilterBar tags={tags} activeTag={activeTag} onSelect={setActiveTag} theme={theme} />

      {folder === 'trashed' && folderNotes.length > 0 && (
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Empty Trash?', 'All notes in the Trash will be deleted forever.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Empty Trash', style: 'destructive', onPress: emptyTrash },
            ])
          }
          style={styles.emptyTrashRow}
        >
          <Text style={[styles.emptyTrashText, { color: theme.danger }]}>Empty Trash</Text>
        </TouchableOpacity>
      )}

      {/* Notes */}
      <FlatList
        key={viewMode}
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 96 }]}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <SectionLabel text={item.text} color={theme.textTertiary} />;
          }
          return (
            <View style={styles.gridRow}>
              {item.notes.map((note) => (
                <View key={note.id} style={styles.gridItem}>
                  <NoteCard
                    note={note}
                    theme={theme}
                    grid={viewMode === 'grid'}
                    onPress={() => onOpenNote(note.id)}
                    onLongPress={() => showNoteActions(note)}
                  />
                </View>
              ))}
              {viewMode === 'grid' && item.notes.length === 1 && <View style={styles.gridItem} />}
            </View>
          );
        }}
        ListEmptyComponent={
          ready ? (
            <View style={styles.empty}>
              <Ionicons
                name={
                  folder === 'trashed'
                    ? 'trash-outline'
                    : folder === 'archived'
                      ? 'archive-outline'
                      : 'create-outline'
                }
                size={44}
                color={theme.textTertiary}
              />
              <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
                {query || activeTag
                  ? 'No matching notes'
                  : folder === 'active'
                    ? 'Your notes live here'
                    : folder === 'archived'
                      ? 'No archived notes'
                      : 'Trash is empty'}
              </Text>
              {folder === 'active' && !query && !activeTag && (
                <Text style={[styles.emptyHint, { color: theme.textTertiary }]}>
                  Tap + to capture your first thought.{'\n'}Type #tags anywhere to organize.
                </Text>
              )}
            </View>
          ) : null
        }
      />

      {/* FABs */}
      {folder === 'active' && (
        <View style={[styles.fabColumn, { bottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            onPress={() => onCreateNote(true)}
            style={[
              styles.fabSmall,
              { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
            ]}
            accessibilityLabel="New checklist"
          >
            <Ionicons name="checkbox-outline" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onCreateNote(false)}
            style={[styles.fab, { backgroundColor: theme.accent }]}
            accessibilityLabel="New note"
          >
            <Ionicons name="add" size={30} color={theme.onAccent} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function SectionLabel({ text, color }: { text: string; color: string }) {
  return <Text style={[styles.sectionLabel, { color }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 4,
  },
  folderTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  folderLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyTrashRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  emptyTrashText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: -4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fabColumn: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    gap: 14,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
