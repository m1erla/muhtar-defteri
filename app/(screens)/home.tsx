import PlaceholderScreen from '@/components/placeholder-screen';

export default function Home() {
  return (
    <PlaceholderScreen
      title="Dijital Muhtar"
      links={[
        { href: '/report-category', label: 'Bir Sorun Bildir' },
        { href: '/map-list', label: 'Mahalle Kaydı' },
        { href: '/how-it-works', label: 'Nasıl çalışır?' },
      ]}
    />
  );
}
