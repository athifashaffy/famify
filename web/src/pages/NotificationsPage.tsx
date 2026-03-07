import { Card } from '../components/ui/card';

export function NotificationsPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Notifications</h1>
      <Card>
        <p className="text-slate-600">
          View all your family notifications and updates.
        </p>
      </Card>
    </div>
  );
}
