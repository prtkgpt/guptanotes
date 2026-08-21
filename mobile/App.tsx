import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureNotifications } from './src/lib/reminders';
import { EditorScreen } from './src/screens/EditorScreen';
import { NotesListScreen } from './src/screens/NotesListScreen';
import { NotesProvider, useNotes } from './src/store/NotesContext';

configureNotifications();

function Root() {
  const { createNote, theme, notes, ready } = useNotes();
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  // Tapping a reminder notification opens the note it belongs to.
  useEffect(() => {
    if (!ready) return;
    const openFromResponse = (response: Notifications.NotificationResponse | null) => {
      const noteId = response?.notification.request.content.data?.noteId;
      if (typeof noteId === 'string' && notes.some((n) => n.id === noteId)) {
        setOpenNoteId(noteId);
      }
    };
    Notifications.getLastNotificationResponseAsync()
      .then(openFromResponse)
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(openFromResponse);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      {openNoteId ? (
        <EditorScreen noteId={openNoteId} onClose={() => setOpenNoteId(null)} />
      ) : (
        <NotesListScreen
          onOpenNote={setOpenNoteId}
          onCreateNote={(checklist) => setOpenNoteId(createNote(checklist).id)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NotesProvider>
        <Root />
      </NotesProvider>
    </SafeAreaProvider>
  );
}
