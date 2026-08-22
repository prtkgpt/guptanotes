import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { makeId } from '../lib/noteUtils';
import { Theme } from '../theme';
import type { ChecklistItem } from '../types';

interface Props {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  theme: Theme;
  editable: boolean;
}

export function ChecklistEditor({ items, onChange, theme, editable }: Props) {
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const setItem = (id: string, patch: Partial<ChecklistItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addItem = (afterId?: string) => {
    const fresh: ChecklistItem = { id: makeId(), text: '', done: false };
    if (afterId === undefined) {
      onChange([...items, fresh]);
    } else {
      const index = items.findIndex((item) => item.id === afterId);
      const next = [...items];
      next.splice(index + 1, 0, fresh);
      onChange(next);
    }
    setTimeout(() => inputRefs.current[fresh.id]?.focus(), 50);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const pending = items.filter((item) => !item.done);
  const done = items.filter((item) => item.done);

  const renderItem = (item: ChecklistItem) => (
    <View key={item.id} style={styles.row}>
      <TouchableOpacity
        onPress={() => editable && setItem(item.id, { done: !item.done })}
        hitSlop={8}
      >
        <Ionicons
          name={item.done ? 'checkbox' : 'square-outline'}
          size={22}
          color={item.done ? theme.accent : theme.textTertiary}
        />
      </TouchableOpacity>
      <TextInput
        ref={(ref) => {
          inputRefs.current[item.id] = ref;
        }}
        value={item.text}
        onChangeText={(text) => setItem(item.id, { text })}
        placeholder="List item"
        placeholderTextColor={theme.textTertiary}
        editable={editable}
        multiline={false}
        returnKeyType="next"
        onSubmitEditing={() => addItem(item.id)}
        blurOnSubmit={false}
        style={[
          styles.input,
          { color: item.done ? theme.textTertiary : theme.text },
          item.done && styles.doneText,
        ]}
      />
      {editable && (
        <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={8}>
          <Ionicons name="close" size={18} color={theme.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {pending.map(renderItem)}
      {editable && (
        <TouchableOpacity onPress={() => addItem()} style={styles.addRow}>
          <Ionicons name="add" size={22} color={theme.accent} />
          <Text style={[styles.addText, { color: theme.accent }]}>Add item</Text>
        </TouchableOpacity>
      )}
      {done.length > 0 && (
        <>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <Text style={[styles.doneHeader, { color: theme.textTertiary }]}>
            {done.length} completed
          </Text>
          {done.map(renderItem)}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 17,
    padding: 0,
  },
  doneText: {
    textDecorationLine: 'line-through',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  addText: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  doneHeader: {
    fontSize: 13,
    marginBottom: 2,
  },
});
