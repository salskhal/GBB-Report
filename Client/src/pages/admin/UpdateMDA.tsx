import { useParams } from 'react-router-dom';
import { useMDA } from '@/hooks/useMDAs';
import MDAForm from '@/components/forms/MDAForm';

export default function UpdateMDA() {
  const { id } = useParams<{ id: string }>();
  const { data: mda, isLoading, error } = useMDA(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading MDA...</div>
      </div>
    );
  }

  if (error || !mda) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading MDA. Please try again.</div>
      </div>
    );
  }

  return <MDAForm mode="update" mda={mda} />;
}