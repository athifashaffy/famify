import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SavedPlace } from '../lib/types';
import { Search, MapPin, Phone, Navigation, Star, Filter, List, Map, X, Bookmark, BookmarkCheck } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const CATEGORIES = [
  { id: 'doctor', label: 'Doctor', emoji: '🏥' },
  { id: 'pharmacy', label: 'Pharmacy', emoji: '💊' },
  { id: 'daycare', label: 'Daycare', emoji: '👶' },
  { id: 'activities', label: 'Activities', emoji: '⚽' },
  { id: 'supplies', label: 'Supplies', emoji: '🛒' },
  { id: 'education', label: 'Education', emoji: '📚' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'emergency', label: 'Emergency', emoji: '🚨' },
  { id: 'parks', label: 'Parks & Rec', emoji: '🌳' },
  { id: 'faith', label: 'Faith', emoji: '⛪' },
  { id: 'library', label: 'Library', emoji: '📖' },
  { id: 'family', label: 'Family Support', emoji: '👪' },
];

const DISTANCE_OPTIONS = [
  { value: '1', label: '1 km' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
];

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  category: string;
  rating: number;
  reviewCount: number;
  distance: string;
  isOpen: boolean;
  phone: string;
  description: string;
  latitude: number;
  longitude: number;
}

// Curated real organizations in Greater Sudbury, ON
const SAMPLE_PLACES: PlaceResult[] = [
  // === DAYCARES & CHILDCARE ===
  {
    id: '1', name: 'Laurentian Child and Family Centre', address: '935 Ramsey Lake Rd, Sudbury, ON P3E 2C6',
    category: 'daycare', rating: 4.8, reviewCount: 142, distance: '4.5 km',
    isOpen: true, phone: '+1-705-675-1151', description: 'University-affiliated child care centre offering quality early learning programs',
    latitude: 46.4673, longitude: -80.9716,
  },
  {
    id: '2', name: 'Jubilee Heritage Family Resources Centre', address: '19 Jubilee St, Sudbury, ON P3E 1A7',
    category: 'daycare', rating: 4.7, reviewCount: 98, distance: '1.8 km',
    isOpen: true, phone: '+1-705-673-7546', description: 'Community-based family resource centre with licensed child care programs',
    latitude: 46.4912, longitude: -81.0072,
  },
  {
    id: '3', name: 'YMCA of Northeastern Ontario (Child Care)', address: '140 Durham St, Sudbury, ON P3E 3M7',
    category: 'daycare', rating: 4.6, reviewCount: 210, distance: '0.6 km',
    isOpen: true, phone: '+1-705-673-9136', description: 'Licensed child care programs for infants, toddlers, and preschoolers',
    latitude: 46.4902, longitude: -81.0045,
  },

  // === FAMILY & EARLY CHILDHOOD SUPPORT ===
  {
    id: '4', name: 'West End EarlyON Child and Family Centre', address: '104 Applegrove St, Sudbury, ON P3C 1N1',
    category: 'family', rating: 4.9, reviewCount: 76, distance: '3.2 km',
    isOpen: true, phone: '+1-705-566-3416', description: 'Free drop-in programs for families with children ages 0-6',
    latitude: 46.4880, longitude: -81.0370,
  },
  {
    id: '5', name: 'Jubilee West End EarlyON at St. Francis', address: '691 Lilac St, Sudbury, ON P3C 4R2',
    category: 'family', rating: 4.8, reviewCount: 64, distance: '3.5 km',
    isOpen: true, phone: '+1-705-673-7546', description: 'EarlyON centre offering play-based learning and parenting support at St. Francis Catholic School',
    latitude: 46.4845, longitude: -81.0410,
  },
  {
    id: '6', name: 'Child and Community Resources (CCR)', address: '1100 Bancroft Dr, Sudbury, ON P3B 1R2',
    category: 'family', rating: 4.7, reviewCount: 118, distance: '3.1 km',
    isOpen: true, phone: '+1-705-525-0055', description: 'Integrated early childhood development and family support services',
    latitude: 46.5070, longitude: -80.9620,
  },

  // === HEALTH & CLINICS ===
  {
    id: '7', name: 'NEO Kids Program – Health Sciences North', address: '41 Ramsey Lake Rd, Sudbury, ON P3E 5J1',
    category: 'doctor', rating: 4.9, reviewCount: 320, distance: '4.2 km',
    isOpen: true, phone: '+1-705-523-7100', description: 'Specialized pediatric care program at Health Sciences North for children and youth',
    latitude: 46.4700, longitude: -80.9750,
  },
  {
    id: '8', name: 'Lasalle Walk-In Clinic', address: '1385 LaSalle Blvd, Sudbury, ON P3A 1Z8',
    category: 'doctor', rating: 4.3, reviewCount: 187, distance: '1.5 km',
    isOpen: true, phone: '+1-705-566-2273', description: 'Walk-in medical clinic with family-friendly hours and no appointment needed',
    latitude: 46.5055, longitude: -81.0090,
  },
  {
    id: '9', name: 'Sudbury Family Medical Centre', address: '865 Regent St S, Sudbury, ON P3E 3Y9',
    category: 'doctor', rating: 4.5, reviewCount: 245, distance: '1.2 km',
    isOpen: true, phone: '+1-705-522-2200', description: 'Full-service family medical practice accepting new patients',
    latitude: 46.4894, longitude: -80.9930,
  },
  {
    id: '10', name: 'Health Sciences North', address: '41 Ramsey Lake Rd, Sudbury, ON P3E 5J1',
    category: 'emergency', rating: 4.8, reviewCount: 1024, distance: '4.2 km',
    isOpen: true, phone: '+1-705-523-7100', description: 'Full-service hospital with emergency department and pediatric care',
    latitude: 46.4698, longitude: -80.9755,
  },

  // === EDUCATION & LEARNING ===
  {
    id: '11', name: 'St. Francis Catholic School', address: '691 Lilac St, Sudbury, ON P3C 4R2',
    category: 'education', rating: 4.6, reviewCount: 89, distance: '3.5 km',
    isOpen: true, phone: '+1-705-673-1700', description: 'Catholic elementary school serving families in the West End community',
    latitude: 46.4843, longitude: -81.0415,
  },
  {
    id: '12', name: 'Montessori School of Sudbury', address: '1930 Paris St, Sudbury, ON P3E 3C8',
    category: 'education', rating: 4.9, reviewCount: 67, distance: '2.8 km',
    isOpen: true, phone: '+1-705-522-8643', description: 'Authentic Montessori education for children ages 2.5 to 12',
    latitude: 46.4760, longitude: -80.9870,
  },
  {
    id: '13', name: 'King Montessori Academy', address: '1500 Paris St, Sudbury, ON P3E 3B8',
    category: 'education', rating: 4.7, reviewCount: 54, distance: '2.1 km',
    isOpen: true, phone: '+1-705-675-9111', description: 'Montessori-based preschool and elementary programs with before and after care',
    latitude: 46.4810, longitude: -80.9880,
  },

  // === KIDS ACTIVITIES & PLAY ===
  {
    id: '14', name: 'KUPP Centre (Kids Ultimate Play Place)', address: '1975 Lasalle Blvd, Sudbury, ON P3A 2A3',
    category: 'activities', rating: 4.5, reviewCount: 312, distance: '2.8 km',
    isOpen: true, phone: '+1-705-524-5877', description: 'Indoor play centre with climbing structures, slides, and birthday party packages',
    latitude: 46.5085, longitude: -80.9880,
  },
  {
    id: '15', name: 'Urban Air Trampoline and Adventure Park', address: '1485 Kingsway Blvd, Sudbury, ON P3B 0A2',
    category: 'activities', rating: 4.4, reviewCount: 278, distance: '3.0 km',
    isOpen: true, phone: '+1-705-419-0027', description: 'Trampoline park with obstacle courses, climbing walls, and dodgeball for all ages',
    latitude: 46.5020, longitude: -80.9550,
  },
  {
    id: '16', name: 'YMCA of Northeastern Ontario', address: '140 Durham St, Sudbury, ON P3E 3M7',
    category: 'activities', rating: 4.6, reviewCount: 195, distance: '0.6 km',
    isOpen: true, phone: '+1-705-673-9136', description: 'Youth sports leagues, swimming lessons, day camps, and fitness programs for families',
    latitude: 46.4900, longitude: -81.0048,
  },
  {
    id: '17', name: 'Sudbury Theatre Centre (Youth Programs)', address: '170 Shaughnessy St, Sudbury, ON P3E 3E9',
    category: 'activities', rating: 4.8, reviewCount: 96, distance: '1.0 km',
    isOpen: true, phone: '+1-705-674-8381', description: 'Youth theatre workshops, drama camps, and performance programs for ages 5-18',
    latitude: 46.4888, longitude: -80.9970,
  },

  // === PARKS, RECREATION & LANDMARKS ===
  {
    id: '18', name: 'Bell Park', address: 'Bell Park Rd, Sudbury, ON P3E 3A3',
    category: 'parks', rating: 4.9, reviewCount: 520, distance: '2.5 km',
    isOpen: true, phone: '+1-705-674-4455', description: 'Beautiful lakeside park with beach, playground, walking trails, and concert amphitheatre',
    latitude: 46.4775, longitude: -80.9940,
  },
  {
    id: '19', name: 'Westmount Playground', address: 'Westmount Ave, Sudbury, ON P3A 4L3',
    category: 'parks', rating: 4.5, reviewCount: 87, distance: '2.0 km',
    isOpen: true, phone: '+1-705-674-4455', description: 'Community playground with modern play equipment and green space for families',
    latitude: 46.5030, longitude: -80.9820,
  },
  {
    id: '20', name: 'Lonsdale Playground', address: 'Lonsdale Ave, Sudbury, ON P3C 2H7',
    category: 'parks', rating: 4.4, reviewCount: 65, distance: '2.8 km',
    isOpen: true, phone: '+1-705-674-4455', description: 'Neighbourhood playground with swings, climbing structures, and picnic areas',
    latitude: 46.4870, longitude: -81.0280,
  },
  {
    id: '21', name: 'Delki Dozzi Park Playground', address: '100 Bancroft Dr, Sudbury, ON P3B 1R2',
    category: 'parks', rating: 4.6, reviewCount: 142, distance: '3.2 km',
    isOpen: true, phone: '+1-705-674-4455', description: 'Multi-sport complex with splash pad, playground, soccer fields, and walking trails',
    latitude: 46.5075, longitude: -80.9640,
  },
  {
    id: '22', name: 'Sudbury Wolves', address: '240 Elgin St, Sudbury, ON P3E 3N5',
    category: 'parks', rating: 4.7, reviewCount: 380, distance: '0.8 km',
    isOpen: false, phone: '+1-705-675-3141', description: 'OHL junior hockey team – exciting family-friendly game nights at Sudbury Arena',
    latitude: 46.4920, longitude: -80.9985,
  },
  {
    id: '23', name: 'Sudbury Five', address: '240 Elgin St, Sudbury, ON P3E 3N5',
    category: 'parks', rating: 4.5, reviewCount: 215, distance: '0.8 km',
    isOpen: false, phone: '+1-705-675-3141', description: 'Professional basketball team – affordable family entertainment at Sudbury Arena',
    latitude: 46.4922, longitude: -80.9982,
  },
  {
    id: '24', name: 'Sudbury Arena', address: '240 Elgin St, Sudbury, ON P3E 3N5',
    category: 'parks', rating: 4.4, reviewCount: 450, distance: '0.8 km',
    isOpen: true, phone: '+1-705-674-4455', description: 'Multi-purpose arena hosting hockey, basketball, concerts, and community events',
    latitude: 46.4918, longitude: -80.9988,
  },

  // === FAITH-BASED COMMUNITY ===
  {
    id: '25', name: 'St. Andrew the Apostle Church', address: '40 Julien Ave, Sudbury, ON P3C 3H8',
    category: 'faith', rating: 4.7, reviewCount: 78, distance: '2.5 km',
    isOpen: true, phone: '+1-705-674-2727', description: 'Catholic parish with family mass, children\'s liturgy, and community outreach programs',
    latitude: 46.4862, longitude: -81.0310,
  },
  {
    id: '26', name: 'Christ the King Church', address: '410 Kathleen St, Sudbury, ON P3C 2N1',
    category: 'faith', rating: 4.6, reviewCount: 63, distance: '2.2 km',
    isOpen: true, phone: '+1-705-674-5764', description: 'Catholic church with Sunday school, youth groups, and family-focused community events',
    latitude: 46.4875, longitude: -81.0250,
  },
  {
    id: '27', name: 'Sudbury Mosque (Islamic Association of Sudbury)', address: '1553 Kennedy St, Sudbury, ON P3A 2G3',
    category: 'faith', rating: 4.8, reviewCount: 55, distance: '2.5 km',
    isOpen: true, phone: '+1-705-560-3030', description: 'Islamic centre offering Friday prayers, Sunday school, and family community gatherings',
    latitude: 46.5060, longitude: -80.9810,
  },
  {
    id: '28', name: 'Glad Tidings Church', address: '741 Glendale Ave, Sudbury, ON P3C 1N5',
    category: 'faith', rating: 4.5, reviewCount: 47, distance: '3.0 km',
    isOpen: true, phone: '+1-705-674-4077', description: 'Family-friendly church with kids programs, youth groups, and community meals',
    latitude: 46.4850, longitude: -81.0350,
  },

  // === FAMILY-FRIENDLY RESTAURANTS ===
  {
    id: '29', name: 'Respect Is Burning Kitchen & Bar', address: '82 Durham St, Sudbury, ON P3E 3M5',
    category: 'food', rating: 4.6, reviewCount: 445, distance: '0.5 km',
    isOpen: true, phone: '+1-705-222-6010', description: 'Trendy restaurant with creative comfort food, kids menu, and relaxed family atmosphere',
    latitude: 46.4905, longitude: -81.0030,
  },
  {
    id: '30', name: 'Lot 88 Steakhouse & Bar', address: '88 Durham St, Sudbury, ON P3E 3M5',
    category: 'food', rating: 4.5, reviewCount: 380, distance: '0.5 km',
    isOpen: true, phone: '+1-705-688-8488', description: 'Upscale steakhouse with private dining options and welcoming family service',
    latitude: 46.4907, longitude: -81.0028,
  },
  {
    id: '31', name: 'Swiss Chalet', address: '1490 LaSalle Blvd, Sudbury, ON P3A 1Z7',
    category: 'food', rating: 4.2, reviewCount: 520, distance: '1.5 km',
    isOpen: true, phone: '+1-705-566-8311', description: 'Classic Canadian family restaurant with rotisserie chicken and dedicated kids meals',
    latitude: 46.5048, longitude: -81.0095,
  },
  {
    id: '32', name: 'La Fromagerie', address: '64 Elgin St, Sudbury, ON P3E 3N5',
    category: 'food', rating: 4.7, reviewCount: 290, distance: '0.8 km',
    isOpen: true, phone: '+1-705-675-9900', description: 'Gourmet cafe and cheese shop with family brunch, artisan sandwiches, and pastries',
    latitude: 46.4915, longitude: -80.9995,
  },
  {
    id: '33', name: 'M.I.C. Canadian Eatery & Whisky Pub', address: '75 Durham St, Sudbury, ON P3E 3M5',
    category: 'food', rating: 4.4, reviewCount: 365, distance: '0.5 km',
    isOpen: true, phone: '+1-705-586-0642', description: 'Canadian comfort food with poutine, burgers, and a welcoming family dining area',
    latitude: 46.4903, longitude: -81.0035,
  },

  // === LIBRARIES ===
  {
    id: '34', name: 'New Sudbury Public Library', address: '1500 LaSalle Blvd, Sudbury, ON P3A 1Z8',
    category: 'library', rating: 4.6, reviewCount: 175, distance: '1.5 km',
    isOpen: true, phone: '+1-705-673-1155', description: 'Public library with children\'s reading programs, storytime, and free community events',
    latitude: 46.5052, longitude: -81.0100,
  },
  {
    id: '35', name: 'Greater Sudbury Public Library - Main Branch', address: '74 Mackenzie St, Sudbury, ON P3C 4X8',
    category: 'library', rating: 4.7, reviewCount: 230, distance: '0.7 km',
    isOpen: true, phone: '+1-705-673-1155', description: 'Main downtown library with extensive children\'s section, maker space, and family programs',
    latitude: 46.4910, longitude: -81.0015,
  },
  {
    id: '36', name: 'South End Public Library', address: '1935 Paris St, Sudbury, ON P3E 3C8',
    category: 'library', rating: 4.5, reviewCount: 110, distance: '2.8 km',
    isOpen: true, phone: '+1-705-673-1155', description: 'Neighbourhood library with kids programming, book clubs, and summer reading challenges',
    latitude: 46.4755, longitude: -80.9875,
  },
];

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZmFtaWZ5LWRlbW8iLCJhIjoiY200ZHVtbXkifQ.demo';

const CATEGORY_COLORS: Record<string, string> = {
  doctor: '#ef4444',
  pharmacy: '#8b5cf6',
  daycare: '#f59e0b',
  activities: '#10b981',
  supplies: '#3b82f6',
  education: '#6366f1',
  food: '#f97316',
  emergency: '#dc2626',
  parks: '#22c55e',
  faith: '#a855f7',
  library: '#0ea5e9',
  family: '#ec4899',
};

export function NeedlePage() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState('25');
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (family) fetchSavedPlaces();
  }, [family]);

  const fetchSavedPlaces = async () => {
    if (!family) return;
    const { data } = await supabase
      .from('saved_places')
      .select('*')
      .eq('family_id', family.id);
    if (data) setSavedPlaces(data);
  };

  const filteredPlaces = SAMPLE_PLACES.filter((place) => {
    if (searchQuery && !place.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !place.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategory && place.category !== selectedCategory) return false;
    if (openNowOnly && !place.isOpen) return false;
    if (minRating > 0 && place.rating < minRating) return false;
    const dist = parseFloat(place.distance);
    if (dist > parseFloat(maxDistance)) return false;
    return true;
  });

  // Initialize Mapbox map when switching to map view
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-81.0000, 46.4900], // Sudbury
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [viewMode]);

  // Update markers when filtered places change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || viewMode !== 'map') return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredPlaces.forEach((place) => {
      const catInfo = CATEGORIES.find((c) => c.id === place.category);
      const color = CATEGORY_COLORS[place.category] || '#10b981';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: system-ui, sans-serif; max-width: 200px;">
          <strong style="font-size: 14px;">${catInfo?.emoji || '📍'} ${place.name}</strong>
          <p style="font-size: 12px; color: #64748b; margin: 4px 0;">${place.address}</p>
          <p style="font-size: 12px; color: #64748b;">${place.distance} · ⭐ ${place.rating}</p>
          <span style="display: inline-block; margin-top: 4px; padding: 2px 8px; border-radius: 12px; font-size: 11px; background: ${place.isOpen ? '#d1fae5' : '#ffe4e6'}; color: ${place.isOpen ? '#065f46' : '#9f1239'};">
            ${place.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      `);

      const marker = new mapboxgl.Marker({ color })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener('click', () => {
        setSelectedPlace(place);
      });

      markersRef.current.push(marker);
    });

    if (filteredPlaces.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredPlaces.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    }
  }, [viewMode, searchQuery, selectedCategory, openNowOnly, minRating, maxDistance]);

  const toggleSavePlace = async (place: PlaceResult) => {
    if (!family || !user) return;
    const existing = savedPlaces.find((sp) => sp.place_name === place.name);
    if (existing) {
      await supabase.from('saved_places').delete().eq('id', existing.id);
      setSavedPlaces((prev) => prev.filter((sp) => sp.id !== existing.id));
    } else {
      const { data } = await supabase.from('saved_places').insert({
        user_id: user.id,
        family_id: family.id,
        place_name: place.name,
        category: place.category,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        rating: place.rating,
        notes: place.description,
      }).select().single();
      if (data) setSavedPlaces((prev) => [...prev, data]);
    }
  };

  const isSaved = (placeName: string) => savedPlaces.some((sp) => sp.place_name === placeName);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        <Star size={14} className="text-amber-400 fill-amber-400" />
        <span className="text-sm font-medium">{rating}</span>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Needle</h1>
        <p className="text-sm text-slate-500 mt-1">Find what your family needs - instantly</p>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for doctors, daycare, activities, supplies..."
            className="pl-10 pr-12"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${
              showFilters ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4 mb-4 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Distance</label>
              <select
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
              >
                {DISTANCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Rating</label>
              <select
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
              >
                <option value="0">Any rating</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="4.5">4.5+ stars</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={openNowOnly}
                  onChange={(e) => setOpenNowOnly(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-slate-700">Open Now Only</span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* View Toggle + Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{filteredPlaces.length} results found</p>
        <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 ${viewMode === 'map' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
          >
            <Map size={18} />
          </button>
        </div>
      </div>

      {/* Place Detail Modal */}
      {selectedPlace && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPlace(null)}>
          <Card className="max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedPlace.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{selectedPlace.address}</p>
              </div>
              <button onClick={() => setSelectedPlace(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              {renderStars(selectedPlace.rating)}
              <span className="text-sm text-slate-500">({selectedPlace.reviewCount} reviews)</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                selectedPlace.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {selectedPlace.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>

            <p className="text-sm text-slate-600 mb-4">{selectedPlace.description}</p>

            <div className="space-y-2 mb-6 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={14} /> {selectedPlace.distance} away
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} /> {selectedPlace.phone}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => window.open(`tel:${selectedPlace.phone}`)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                <Phone size={16} className="mr-2" /> Call
              </Button>
              <Button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.address)}`)}
                variant="outline"
                className="flex-1"
              >
                <Navigation size={16} className="mr-2" /> Directions
              </Button>
              <Button
                onClick={() => toggleSavePlace(selectedPlace)}
                variant="outline"
                className={isSaved(selectedPlace.name) ? 'text-emerald-600' : ''}
              >
                {isSaved(selectedPlace.name) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Results */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredPlaces.map((place) => {
            const catInfo = CATEGORIES.find((c) => c.id === place.category);
            return (
              <Card
                key={place.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedPlace(place)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{catInfo?.emoji}</span>
                      <h3 className="font-semibold text-slate-900">{place.name}</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">{place.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      {renderStars(place.rating)}
                      <span className="text-slate-400">({place.reviewCount})</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin size={12} /> {place.distance}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        place.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {place.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSavePlace(place); }}
                      className={`p-1.5 rounded-full ${
                        isSaved(place.name) ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600'
                      }`}
                    >
                      {isSaved(place.name) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`tel:${place.phone}`); }}
                        className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      >
                        <Phone size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`); }}
                        className="p-1.5 rounded-full bg-sky-50 text-sky-600 hover:bg-sky-100"
                      >
                        <Navigation size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {filteredPlaces.length === 0 && (
            <Card className="p-8 text-center">
              <Search size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">No results found</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
            </Card>
          )}
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-slate-200" style={{ height: '500px' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {/* Saved Places */}
      {savedPlaces.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <BookmarkCheck size={20} className="text-emerald-600" />
            Saved Places ({savedPlaces.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {savedPlaces.map((sp) => {
              const catInfo = CATEGORIES.find((c) => c.id === sp.category);
              return (
                <Card key={sp.id} className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{catInfo?.emoji || '📍'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">{sp.place_name}</p>
                      <p className="text-xs text-slate-500 truncate">{sp.address}</p>
                    </div>
                    {sp.rating && renderStars(Number(sp.rating))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
