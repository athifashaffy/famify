import { Card } from '../components/ui/card';

export function NeedlePage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Needle</h1>
      <Card>
        <p className="text-slate-600">
          Find and save family-friendly places: daycares, medical centers, parks, and more.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Search for places and save them for your family.
        </p>
      </Card>
    </div>
  );
}
