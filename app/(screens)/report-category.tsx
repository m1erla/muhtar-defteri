import PlaceholderScreen from '@/components/placeholder-screen';

export default function ReportCategory() {
  return (
    <PlaceholderScreen
      title="Ne tür bir sorun?"
      links={[{ href: '/report-details', label: 'Detaylar' }]}
    />
  );
}
