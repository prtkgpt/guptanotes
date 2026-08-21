import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatRelativeTime } from '../lib/noteUtils';
import { useNotes } from '../store/NotesContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SyncSheet({ visible, onClose }: Props) {
  const {
    theme,
    syncConfigured,
    session,
    syncing,
    lastSyncAt,
    syncError,
    syncNow,
    signIn,
    signUp,
    signOut,
  } = useNotes();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setAuthError('Enter an email and password.');
      return;
    }
    setBusy(true);
    setAuthError(null);
    setInfo(null);
    const error =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setBusy(false);
    if (error) {
      setAuthError(error);
    } else if (mode === 'signup') {
      setInfo('Account created. If email confirmation is enabled, confirm before signing in.');
      setMode('signin');
    } else {
      setPassword('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdropWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: theme.surfaceBorder }]} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Sync</Text>

          {!syncConfigured && (
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              Sync is optional and currently not configured. Your notes are stored on this
              device. To enable sync, set EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env, run the SQL in
              supabase/mobile_notes_schema.sql, and rebuild the app.
            </Text>
          )}

          {syncConfigured && !session && (
            <View style={styles.form}>
              <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                Sign in to back up your notes and sync them across devices. Notes stay fully
                usable offline. Images and voice recordings remain on-device.
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                style={[
                  styles.input,
                  { backgroundColor: theme.searchBg, color: theme.text },
                ]}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={theme.textTertiary}
                secureTextEntry
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                style={[
                  styles.input,
                  { backgroundColor: theme.searchBg, color: theme.text },
                ]}
              />
              {authError && (
                <Text style={[styles.error, { color: theme.danger }]}>{authError}</Text>
              )}
              {info && <Text style={[styles.paragraph, { color: theme.accent }]}>{info}</Text>}
              <TouchableOpacity
                onPress={submit}
                disabled={busy}
                style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              >
                {busy ? (
                  <ActivityIndicator color={theme.onAccent} />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: theme.onAccent }]}>
                    {mode === 'signin' ? 'Sign in' : 'Create account'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setAuthError(null);
                }}
              >
                <Text style={[styles.switchText, { color: theme.textSecondary }]}>
                  {mode === 'signin'
                    ? 'New here? Create an account'
                    : 'Already have an account? Sign in'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {syncConfigured && session && (
            <View style={styles.form}>
              <View style={styles.accountRow}>
                <Ionicons name="person-circle-outline" size={22} color={theme.textSecondary} />
                <Text style={[styles.accountEmail, { color: theme.text }]} numberOfLines={1}>
                  {session.user.email}
                </Text>
              </View>
              <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                {syncing
                  ? 'Syncing…'
                  : lastSyncAt
                    ? `Last synced ${formatRelativeTime(lastSyncAt)}`
                    : 'Not synced yet'}
              </Text>
              {syncError && (
                <Text style={[styles.error, { color: theme.danger }]}>{syncError}</Text>
              )}
              <TouchableOpacity
                onPress={syncNow}
                disabled={syncing}
                style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              >
                {syncing ? (
                  <ActivityIndicator color={theme.onAccent} />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: theme.onAccent }]}>
                    Sync now
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={signOut}>
                <Text style={[styles.switchText, { color: theme.danger }]}>Sign out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000066',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  handleRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 12,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
  },
  error: {
    fontSize: 13,
  },
  primaryButton: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  switchText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 4,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountEmail: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
