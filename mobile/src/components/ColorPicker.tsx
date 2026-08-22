import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { noteSwatch, Theme } from '../theme';
import { NOTE_COLORS, NoteColor } from '../types';

interface Props {
  selected: NoteColor;
  onSelect: (color: NoteColor) => void;
  theme: Theme;
}

export function ColorPicker({ selected, onSelect, theme }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {NOTE_COLORS.map((color) => {
        const active = color === selected;
        return (
          <TouchableOpacity
            key={color}
            onPress={() => onSelect(color)}
            style={[
              styles.swatch,
              {
                backgroundColor: noteSwatch(color, theme),
                borderColor: active ? theme.accent : theme.surfaceBorder,
                borderWidth: active ? 2 : 1,
              },
            ]}
            accessibilityLabel={`Note color ${color}`}
          >
            {active && <Ionicons name="checkmark" size={16} color={theme.text} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    gap: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
