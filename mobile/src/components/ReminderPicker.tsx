import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatReminderTime } from '../lib/reminders';
import { Theme } from '../theme';

interface Props {
  visible: boolean;
  current: number | null;
  onClose: () => void;
  onSet: (when: number | null) => void;
  theme: Theme;
}

function preset(hoursFromNow: number): number {
  return Date.now() + hoursFromNow * 3_600_000;
}

function tomorrowMorning(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.getTime();
}

function thisEvening(): number | null {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  return d.getTime() > Date.now() ? d.getTime() : null;
}

export function ReminderPicker({ visible, current, onClose, onSet, theme }: Props) {
  // Android shows the date dialog then the time dialog; iOS shows one inline datetime spinner.
  const [customStage, setCustomStage] = useState<'none' | 'date' | 'time'>('none');
  const [customDate, setCustomDate] = useState<Date>(new Date(Date.now() + 3_600_000));

  const finish = (when: number | null) => {
    setCustomStage('none');
    onSet(when);
    onClose();
  };

  const evening = thisEvening();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: theme.text }]}>Remind me</Text>
          {current && (
            <Text style={[styles.current, { color: theme.textSecondary }]}>
              Currently set for {formatReminderTime(current)}
            </Text>
          )}

          {customStage === 'none' && (
            <>
              <Option
                icon="time-outline"
                label="In 1 hour"
                onPress={() => finish(preset(1))}
                theme={theme}
              />
              {evening !== null && (
                <Option
                  icon="partly-sunny-outline"
                  label="This evening (6 PM)"
                  onPress={() => finish(evening)}
                  theme={theme}
                />
              )}
              <Option
                icon="sunny-outline"
                label="Tomorrow morning (9 AM)"
                onPress={() => finish(tomorrowMorning())}
                theme={theme}
              />
              <Option
                icon="calendar-outline"
                label="Pick date & time…"
                onPress={() => {
                  setCustomDate(new Date(Math.max(Date.now() + 3_600_000, current ?? 0)));
                  setCustomStage('date');
                }}
                theme={theme}
              />
              {current && (
                <Option
                  icon="notifications-off-outline"
                  label="Remove reminder"
                  destructive
                  onPress={() => finish(null)}
                  theme={theme}
                />
              )}
            </>
          )}

          {customStage !== 'none' && Platform.OS === 'ios' && (
            <>
              <DateTimePicker
                value={customDate}
                mode="datetime"
                display="spinner"
                minimumDate={new Date()}
                onChange={(_event, date) => date && setCustomDate(date)}
                themeVariant={theme.dark ? 'dark' : 'light'}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={() => setCustomStage('none')}>
                  <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => finish(customDate.getTime())}>
                  <Text style={[styles.buttonText, { color: theme.accent }]}>Set reminder</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {customStage === 'date' && Platform.OS === 'android' && (
            <DateTimePicker
              value={customDate}
              mode="date"
              minimumDate={new Date()}
              onChange={(event, date) => {
                if (event.type === 'dismissed' || !date) {
                  setCustomStage('none');
                  return;
                }
                const next = new Date(customDate);
                next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                setCustomDate(next);
                setCustomStage('time');
              }}
            />
          )}
          {customStage === 'time' && Platform.OS === 'android' && (
            <DateTimePicker
              value={customDate}
              mode="time"
              onChange={(event, date) => {
                setCustomStage('none');
                if (event.type === 'dismissed' || !date) return;
                const next = new Date(customDate);
                next.setHours(date.getHours(), date.getMinutes(), 0, 0);
                finish(next.getTime());
              }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Option({
  icon,
  label,
  onPress,
  theme,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  theme: Theme;
  destructive?: boolean;
}) {
  const color = destructive ? theme.danger : theme.text;
  return (
    <TouchableOpacity onPress={onPress} style={styles.option}>
      <Ionicons name={icon} size={20} color={destructive ? theme.danger : theme.textSecondary} />
      <Text style={[styles.optionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    padding: 28,
  },
  sheet: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  current: {
    fontSize: 13,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  optionLabel: {
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
