import { Href, Link, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '@/lib/theme';

// Temporary shell component: renders a screen title and the outgoing links of
// the navigation flow. Every screen replaces this with its real UI in the
// screen-by-screen build phase — nothing here is meant to survive.
type PlaceholderLink = { href: Href; label: string };

type Props = {
  title: string;
  links?: PlaceholderLink[];
};

export default function PlaceholderScreen({ title, links = [] }: Props) {
  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.note}>Bu ekran yapım aşamasında.</Text>
        {links.map((link) => (
          <Link key={String(link.href)} href={link.href} style={styles.link}>
            {link.label} →
          </Link>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.ink,
  },
  note: {
    fontSize: 15,
    color: colors.ink,
    opacity: 0.6,
  },
  link: {
    fontSize: 17,
    color: colors.petrol,
    paddingVertical: 12, // ≥44px total tap target with line height
  },
});
