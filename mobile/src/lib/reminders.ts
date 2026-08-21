import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'reminders';

export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermissions(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

/**
 * Schedule a local notification for a note. Returns the notification id,
 * or null if permission was denied / scheduling is unsupported (e.g. Expo Go
 * on Android — use a development build there).
 */
export async function scheduleReminder(
  noteId: string,
  title: string,
  body: string,
  when: number,
): Promise<string | null> {
  if (when <= Date.now()) return null;
  if (!(await ensurePermissions())) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Note reminders',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: title || 'Note reminder',
        body: body || 'Tap to open your note',
        data: { noteId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(when),
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });
  } catch (error) {
    console.warn('Failed to schedule reminder', error);
    return null;
  }
}

export async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already fired or platform unsupported — nothing to cancel.
  }
}

export function formatReminderTime(when: number): string {
  const date = new Date(when);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return time;
  if (isTomorrow) return `Tomorrow ${time}`;
  return `${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  })} ${time}`;
}
