import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { ChildProfile } from '../lib/types';
import { differenceInYears, differenceInMonths } from 'date-fns';
import { ArrowLeft, Heart, CalendarClock, FileText, Share2, User, Moon } from 'lucide-react';
import { OverviewTab } from '../components/child-hub/OverviewTab';
import { HealthTab } from '../components/child-hub/HealthTab';
import { RoutineTab } from '../components/child-hub/RoutineTab';
import { ScheduleTab } from '../components/child-hub/ScheduleTab';
import { DocumentsTab } from '../components/child-hub/DocumentsTab';
import { ShareTab } from '../components/child-hub/ShareTab';

type TabId = 'overview' | 'health' | 'routine' | 'schedule' | 'documents' | 'share';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: <User size={16} /> },
  { id: 'health', label: 'Health', icon: <Heart size={16} /> },
  { id: 'routine', label: 'Routine', icon: <Moon size={16} /> },
  { id: 'schedule', label: 'Schedule', icon: <CalendarClock size={16} /> },
  { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
  { id: 'share', label: 'Share', icon: <Share2 size={16} /> },
];

export function ChildDetailPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { family } = useFamily();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
    if (childId) {
      fetchChild();
    }
  }, [childId]);

  const fetchChild = async () => {
    if (!childId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('id', childId)
      .single();

    if (!error && data) {
      setChild(data);
    }
    setLoading(false);
  };

  const getChildAge = (dob: string | null): string | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const years = differenceInYears(new Date(), birthDate);
    if (years < 1) {
      const months = differenceInMonths(new Date(), birthDate);
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''}`;
  };

  const getInitial = (name: string | null): string => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const renderTabContent = () => {
    if (!child || !childId) return null;
    const familyId = family?.id || child.family_id || '';

    switch (activeTab) {
      case 'overview':
        return <OverviewTab child={child} childId={childId} />;
      case 'health':
        return <HealthTab childId={childId} familyId={familyId} />;
      case 'routine':
        return <RoutineTab childId={childId} familyId={familyId} />;
      case 'schedule':
        return <ScheduleTab childId={childId} familyId={familyId} />;
      case 'documents':
        return <DocumentsTab childId={childId} familyId={familyId} />;
      case 'share':
        return <ShareTab childId={childId} familyId={familyId} child={child} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Child not found</h2>
          <p className="text-slate-500 mb-4">This profile may have been removed or you don't have access.</p>
          <Button onClick={() => navigate('/child-hub')} variant="outline">
            Back to Child Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Back Button */}
      <Button
        onClick={() => navigate('/child-hub')}
        variant="ghost"
        className="mb-4 text-slate-600 hover:text-slate-900 gap-2 -ml-2"
      >
        <ArrowLeft size={18} />
        Back to Child Hub
      </Button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-sky-500 flex items-center justify-center text-white text-2xl md:text-3xl font-bold flex-shrink-0">
            {getInitial(child.name)}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {child.name || 'Unnamed Child'}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {child.date_of_birth && (
                <span className="text-slate-500">{getChildAge(child.date_of_birth)} old</span>
              )}
              {child.gender && (
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium capitalize">
                  {child.gender}
                </span>
              )}
              {child.age_group && (
                <span className="px-2.5 py-0.5 bg-sky-100 text-sky-700 rounded-full text-sm font-medium">
                  {child.age_group}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>{renderTabContent()}</div>
    </div>
  );
}
