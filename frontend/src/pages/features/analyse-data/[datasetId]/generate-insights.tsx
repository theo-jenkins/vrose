import { useRouter } from 'next/router';
import GenerateInsightsPage from '../../../../components/GenerateInsightsPage';

export default function DatasetGenerateInsights() {
  const router = useRouter();
  const { datasetId } = router.query;

  // Pass datasetId as prop to the main component
  return <GenerateInsightsPage datasetId={datasetId as string} />;
}