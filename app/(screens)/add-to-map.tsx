import PlaceholderScreen from '@/components/placeholder-screen';

export default function AddToMap() {
  return (
    <PlaceholderScreen
      title="Haritaya eklemek ister misin?"
      links={[{ href: '/home', label: 'Ana sayfaya dön' }]}
    />
  );
}
