import PlaceholderScreen from '@/components/placeholder-screen';

export default function RoutingResult() {
  return (
    <PlaceholderScreen
      title="İşte doğru yer"
      links={[{ href: '/add-to-map', label: 'Haritaya da Ekle' }]}
    />
  );
}
