import { DiscoverClient } from './DiscoverClient';
import { DiscoverHeader } from './DiscoverHeader';

export default function DiscoverPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <DiscoverHeader />
      </div>

      <DiscoverClient />
    </div>
  );
}
