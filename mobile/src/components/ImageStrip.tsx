import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Theme } from '../theme';
import type { ImageAttachment } from '../types';

interface Props {
  images: ImageAttachment[];
  onRemove?: (id: string) => void;
  theme: Theme;
}

export function ImageStrip({ images, onRemove, theme }: Props) {
  const [viewing, setViewing] = useState<ImageAttachment | null>(null);
  if (images.length === 0) return null;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.scroll}
      >
        {images.map((image) => (
          <View key={image.id}>
            <TouchableOpacity onPress={() => setViewing(image)}>
              <Image
                source={{ uri: image.uri }}
                style={[styles.thumb, { borderColor: theme.surfaceBorder }]}
              />
            </TouchableOpacity>
            {onRemove && (
              <TouchableOpacity
                onPress={() => onRemove(image.id)}
                style={[styles.remove, { backgroundColor: theme.chipActiveBg }]}
                hitSlop={6}
              >
                <Ionicons name="close" size={14} color={theme.chipActiveText} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={viewing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewing(null)}
      >
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewing(null)}>
          {viewing && (
            <Image source={{ uri: viewing.uri }} style={styles.viewerImage} resizeMode="contain" />
          )}
          <TouchableOpacity onPress={() => setViewing(null)} style={styles.viewerClose} hitSlop={12}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    gap: 10,
    paddingVertical: 8,
  },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
  },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: '#000000E6',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '80%',
  },
  viewerClose: {
    position: 'absolute',
    top: 56,
    right: 20,
  },
});
