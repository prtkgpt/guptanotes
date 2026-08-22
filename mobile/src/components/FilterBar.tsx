import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Theme } from '../theme';

interface Props {
  tags: string[];
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
  theme: Theme;
}

export function TagFilterBar({ tags, activeTag, onSelect, theme }: Props) {
  if (tags.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      <Chip
        label="All"
        active={activeTag === null}
        onPress={() => onSelect(null)}
        theme={theme}
      />
      {tags.map((tag) => (
        <Chip
          key={tag}
          label={`#${tag}`}
          active={activeTag === tag}
          onPress={() => onSelect(activeTag === tag ? null : tag)}
          theme={theme}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: Theme;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? theme.chipActiveBg : theme.chipBg },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? theme.chipActiveText : theme.chipText },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
