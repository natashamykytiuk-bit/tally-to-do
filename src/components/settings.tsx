import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ColorField } from '@/components/color-field';
import { usePalette } from '@/constants/tally';
import { authErrorMessage, changePassword, deleteAccount } from '@/lib/account';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/providers/auth';
import { usePrefs, type ThemeMode } from '@/providers/prefs';

type Panel = 'main' | 'password' | 'delete';

/** Account management and appearance. Opened from the bottom of the sidebar. */
export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = usePalette();
  const [panel, setPanel] = useState<Panel>('main');
  const close = () => {
    setPanel('main');
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      {/* Modals render outside the app root, so the colour wheel needs its own gesture root. */}
      <GestureHandlerRootView style={styles.center}>
        <Pressable style={styles.scrim} onPress={close} accessibilityLabel="Close settings" />
        <View style={[styles.card, { backgroundColor: c.panel }]}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {panel === 'main' && <Main onPanel={setPanel} onClose={close} />}
            {panel === 'password' && <PasswordForm onBack={() => setPanel('main')} />}
            {panel === 'delete' && <DeleteForm onBack={() => setPanel('main')} />}
          </ScrollView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function Main({ onPanel, onClose }: { onPanel: (p: Panel) => void; onClose: () => void }) {
  const c = usePalette();
  const { user } = useAuth();
  const { prefs, setPrefs } = usePrefs();
  const themes: [ThemeMode, string][] = [
    ['system', 'System'],
    ['light', 'Light'],
    ['dark', 'Dark'],
  ];

  return (
    <>
      <Text style={[styles.h, { color: c.ink }]}>Settings</Text>

      <Section title="Account">
        <Text style={{ color: c.muted, fontSize: 13 }}>Signed in as</Text>
        <Text style={{ color: c.ink, fontSize: 15 }}>{user?.email}</Text>
        <View style={styles.row}>
          <Btn label="Change password" onPress={() => onPanel('password')} />
          <Btn label="Sign out" onPress={() => auth && signOut(auth)} />
        </View>
      </Section>

      <Section title="Appearance">
        <Text style={{ color: c.muted, fontSize: 13 }}>Theme</Text>
        <View style={[styles.seg, { backgroundColor: c.bg }]}>
          {themes.map(([id, name]) => {
            const on = prefs.theme === id;
            return (
              <Pressable
                key={id}
                onPress={() => setPrefs({ theme: id })}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={[styles.segBtn, on && { backgroundColor: c.panel, shadowColor: c.ink, ...styles.segOn }]}>
                <Text style={{ color: c.ink, fontSize: 13, fontWeight: on ? '600' : '400' }}>{name}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={{ color: c.muted, fontSize: 13 }}>Accent colour</Text>
          {prefs.accent && (
            <Pressable onPress={() => setPrefs({ accent: '' })} hitSlop={8}>
              <Text style={{ color: c.accent, fontSize: 13 }}>Reset to default</Text>
            </Pressable>
          )}
        </View>
        <ColorField value={c.accent} onChange={(accent) => setPrefs({ accent })} />
      </Section>

      <Section title="Danger zone">
        <Text style={{ color: c.muted, fontSize: 13 }}>Permanently delete your account and everything in it.</Text>
        <Btn label="Delete account…" danger onPress={() => onPanel('delete')} />
      </Section>

      <Pressable onPress={onClose} style={[styles.primary, { backgroundColor: c.accent }]}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Done</Text>
      </Pressable>
    </>
  );
}

function PasswordForm({ onBack }: { onBack: () => void }) {
  const c = usePalette();
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [status, setStatus] = useState<{ busy?: boolean; error?: string; done?: boolean }>({});

  const submit = async () => {
    if (!user) return;
    if (next.length < 6) return setStatus({ error: 'The new password needs at least 6 characters.' });
    setStatus({ busy: true });
    try {
      await changePassword(user, current, next);
      setStatus({ done: true });
    } catch (e) {
      setStatus({ error: authErrorMessage(e) });
    }
  };

  return (
    <>
      <BackHeader title="Change password" onBack={onBack} />
      {status.done ? (
        <Text style={{ color: c.ink }}>Your password has been changed.</Text>
      ) : (
        <>
          <Field label="Current password" value={current} onChange={setCurrent} secure autoComplete="current-password" />
          <Field label="New password" value={next} onChange={setNext} secure autoComplete="new-password" />
          {status.error && <Text style={{ color: c.warn }}>{status.error}</Text>}
          <Pressable
            onPress={submit}
            disabled={status.busy || !current || !next}
            style={[styles.primary, { backgroundColor: c.accent }, (status.busy || !current || !next) && { opacity: 0.5 }]}>
            {status.busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Change password</Text>}
          </Pressable>
        </>
      )}
    </>
  );
}

function DeleteForm({ onBack }: { onBack: () => void }) {
  const c = usePalette();
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<{ busy?: boolean; error?: string }>({});
  const ready = !!password && confirm.trim().toUpperCase() === 'DELETE';

  const submit = async () => {
    if (!user || !ready) return;
    setStatus({ busy: true });
    try {
      await deleteAccount(user, password);
      // Signed out automatically; the app returns to the sign-in screen.
    } catch (e) {
      setStatus({ error: authErrorMessage(e) });
    }
  };

  return (
    <>
      <BackHeader title="Delete account" onBack={onBack} />
      <Text style={{ color: c.ink, fontSize: 14 }}>
        This deletes your account ({user?.email}) and all of your lists, tasks, habits and streaks. It can’t be undone.
      </Text>
      <Field label="Password" value={password} onChange={setPassword} secure autoComplete="current-password" />
      <Field label="Type DELETE to confirm" value={confirm} onChange={setConfirm} />
      {status.error && <Text style={{ color: c.warn }}>{status.error}</Text>}
      <Pressable
        onPress={submit}
        disabled={!ready || status.busy}
        style={[styles.primary, { backgroundColor: c.warn }, (!ready || status.busy) && { opacity: 0.5 }]}>
        {status.busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Delete my account</Text>}
      </Pressable>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const c = usePalette();
  return (
    <View style={[styles.section, { backgroundColor: c.bg }]}>
      <Text style={[styles.sectionTitle, { color: c.muted }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function Btn({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  const c = usePalette();
  return (
    <Pressable onPress={onPress} style={[styles.btn, { backgroundColor: danger ? c.warnSoft : c.accentSoft }]}>
      <Text style={{ color: danger ? c.warn : c.accent, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const c = usePalette();
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityLabel="Back">
        <Text style={{ color: c.accent, fontSize: 18 }}>‹</Text>
      </Pressable>
      <Text style={[styles.h, { color: c.ink }]}>{title}</Text>
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  autoComplete?: 'current-password' | 'new-password';
}) {
  const c = usePalette();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: c.muted, fontSize: 13 }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChange}
        secureTextEntry={props.secure}
        autoComplete={props.autoComplete}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.bg }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  card: { width: '100%', maxWidth: 440, maxHeight: '92%', borderRadius: 14 },
  body: { padding: 18, gap: 12 },
  h: { fontSize: 18, fontWeight: '700' },
  section: { borderRadius: 10, padding: 12, gap: 8 },
  sectionTitle: { fontSize: 11.5, fontWeight: '600', letterSpacing: 0.7 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  btn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  primary: { borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15 },
  seg: { flexDirection: 'row', borderRadius: 8, padding: 3, gap: 3 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6 },
  segOn: { shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
});
