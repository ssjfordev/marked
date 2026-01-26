import { SearchClient } from './SearchClient';

export default function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Search</h1>
        <p className="text-foreground-muted">Find links across all your folders</p>
      </div>
      <SearchClient />
    </div>
  );
}
