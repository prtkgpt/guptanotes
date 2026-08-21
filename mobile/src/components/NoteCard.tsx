import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { checklistProgress, extractTags, snippet } from '../lib/noteUtils';
import { formatReminderTime } from '../lib/reminders';
import { noteBackground, Theme } from '../theme';
import type { Note } from '../types';

interface Props {
  note: Note;
  theme: Theme;
  grid: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const MAX_CHECKLIST_PREVIEW = 4;

export function NoteCard({ note, theme, grid, onPress, onLongPress }: Props) {
  const bg = noteBackground(note.color, theme);
  const isDefault = note.color === 'default';
  const tags = extractTags(note);
  const title = note.title.trim();
  const body = snippet(note, grid ? 120 : 180);
  const progress = note.checklist ? checklistProgress(note.checklist) : null;
  const previewItems = note.checklist
    ? note.checklist.filter((item) => item.text.trim()).slice(0, MAX_CHECKLIST_PREVIEW)
    : [];

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        grid ? styles.cardGrid : styles.cardList,
        {
          backgroundColor: bg,
          borderColor: isDefault ? theme.surfaceBorder : 'transparent',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {note.images.length > 0 && (
        <View style={styles.imageWrap}>
          <Image source={{ uri: note.images[0].uri }} style={styles.image} />
          {note.images.length > 1 && (
            <View style={styles.imageCount}>
              <Text style={styles.imageCountText}>+{note.images.length - 1}</Text>
            </View>
          )}
        </View>
      )}

      {note.pinned && (
        <Ionicons name="pin" size={14} color={theme.textTertiary} style={styles.pin} />
      )}

      {title !== '' && (
        <Text
          numberOfLines={2}
          style={[styles.title, { color: theme.text }, note.pinned && styles.pinnedInset]}
        >
          {title}
        </Text>
      )}

      {body !== '' && (
        <Text
          numberOfLines={grid ? 7 : 4}
          style={[
            styles.body,
            { color: title !== '' ? theme.textSecondary : theme.text },
            title === '' && styles.bodyAsTitle,
            title === '' && note.pinned && styles.pinnedInset,
          ]}
        >
          {body}
        </Text>
      )}

      {previewItems.length > 0 && (
        <View style={styles.checklist}>
          {previewItems.map((item) => (
            <View key={item.id} style={styles.checkRow}>
              <Ionicons
                name={item.done ? 'checkbox' : 'square-outline'}
                size={14}
                color={item.done ? theme.accent : theme.textTertiary}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.checkText,
                  { color: item.done ? theme.textTertiary : theme.textSecondary },
                  item.done && styles.checkedText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      )}

      {progress && progress.total > 0 && (
        <View style={styles.progressRow}>
          <View style={[styles.progressTrack, { backgroundColor: theme.dark ? '#00000055' : '#00000012' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.accent,
                  width: `${Math.round((progress.done / progress.total) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: theme.textTertiary }]}>
            {progress.done}/{progress.total}
          </Text>
        </View>
      )}

      {(note.reminderAt !== null || note.voice.length > 0) && (
        <View style={styles.metaRow}>
          {note.reminderAt !== null && (
            <View style={[styles.metaChip, { backgroundColor: theme.dark ? '#00000040' : '#00000010' }]}>
              <Ionicons
                name="alarm-outline"
                size={12}
                color={note.reminderAt < Date.now() ? theme.danger : theme.textSecondary}
              />
              <Text
                style={[
                  styles.metaText,
                  { color: note.reminderAt < Date.now() ? theme.danger : theme.textSecondary },
                ]}
              >
                {formatReminderTime(note.reminderAt)}
              </Text>
            </View>
          )}
          {note.voice.length > 0 && (
            <View style={[styles.metaChip, { backgroundColor: theme.dark ? '#00000040' : '#00000010' }]}>
              <Ionicons name="mic" size={12} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {note.voice.length}
              </Text>
            </View>
          )}
        </View>
      )}

      {tags.length > 0 && (
        <Text numberOfLines={1} style={[styles.tags, { color: theme.textTertiary }]}>
          {tags.map((tag) => `#${tag}`).join('  ')}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  cardGrid: {
    flex: 1,
  },
  cardList: {
    width: '100%',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  pin: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  pinnedInset: {
    paddingRight: 18,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  bodyAsTitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  checklist: {
    gap: 4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkText: {
    flex: 1,
    fontSize: 13,
  },
  checkedText: {
    textDecorationLine: 'line-through',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  tags: {
    fontSize: 12,
    marginTop: 2,
  },
  imageWrap: {
    marginTop: -14,
    marginHorizontal: -14,
    marginBottom: 4,
  },
  image: {
    width: '100%',
    height: 110,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  imageCount: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#000000A0',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
