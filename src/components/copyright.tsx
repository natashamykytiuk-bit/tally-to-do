import { Linking, Pressable, StyleSheet, Text } from 'react-native';

import { usePalette } from '@/constants/tally';

const LICENSE_URL = 'https://github.com/natashamykytiuk-bit/tally-to-do/blob/master/LICENSE';

/** "© 2026 Natasha Mykytiuk · MIT License", linking to the license on GitHub. */
export function Copyright() {
  const c = usePalette();
  return (
    <Pressable onPress={() => Linking.openURL(LICENSE_URL)} accessibilityRole="link" style={styles.wrap}>
      <Text style={[styles.text, { color: c.muted }]}>© 2026 Natasha Mykytiuk · MIT License</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center', paddingVertical: 6 },
  text: { fontSize: 11 },
});
