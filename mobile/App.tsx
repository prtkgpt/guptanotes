import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EditorScreen } from './src/screens/EditorScreen';
import { NotesListScreen } from './src/screens/NotesListScreen';
import { NotesProvider, useNotes } from './src/store/NotesContext';

function Root() {
  const { createNote, theme } = useNotes();
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

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
