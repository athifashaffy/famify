import { Card } from '../components/ui/card';

export function FeedPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Family Feed</h1>
      <Card>
        <p className="text-slate-600">
          Share and view family moments, photos, and updates.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Create posts, like, and comment on family memories.
        </p>
      </Card>
    </div>
  );
}
