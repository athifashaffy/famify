import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, MapPin, Star, PlayCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Placeholder quotes for the beta launch — replace with real family feedback
// as it comes in. This array is the only place that needs editing.
const TESTIMONIALS = [
  {
    name: 'Amanda R.',
    role: 'Mom of two, beta family',
    quote:
      'Famify replaced the fridge calendar, the group chat, and the pile of sticky notes. Everything about the kids lives in one place now.',
    rating: 5,
  },
  {
    name: 'Daniel & Priya',
    role: 'Co-parenting household',
    quote:
      'Being able to share schedules and health info securely between both homes has made handoffs so much less stressful.',
    rating: 5,
  },
  {
    name: 'Sarah K.',
    role: 'Mom of three',
    quote:
      'The planner keeps our week sane, and the Needle feature found us a walk-in clinic in minutes when our youngest spiked a fever.',
    rating: 4,
  },
  {
    name: 'Michael T.',
    role: 'Dad, beta family',
    quote:
      "It's simple enough that both of us actually use it. That's the first time any family app has managed that in our house.",
    rating: 5,
  },
];

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Family Planner',
    text: 'Shared calendar, meals, and routines so the whole week is visible to everyone at a glance.',
  },
  {
    icon: Users,
    title: 'Child Hub',
    text: 'Health records, documents, and routines for each child — securely shareable with caregivers.',
  },
  {
    icon: MapPin,
    title: 'Needle',
    text: 'Find nearby hospitals and clinics fast when your family needs care.',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
}

function HeroVideo() {
  const [videoMissing, setVideoMissing] = useState(false);

  return (
    <div
      data-testid="hero-video"
      className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl ring-1 ring-emerald-200 bg-white"
    >
      {videoMissing ? (
        <div
          data-testid="video-fallback"
          className="aspect-video flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 text-center"
        >
          <PlayCircle className="w-14 h-14 opacity-90" />
          <p className="font-display font-semibold text-lg">See Famify in action</p>
          <p className="text-sm text-emerald-100">A short intro video is on its way.</p>
        </div>
      ) : (
        <video
          className="w-full aspect-video object-cover"
          controls
          muted
          playsInline
          preload="metadata"
          poster="/videos/famify-intro-poster.jpg?v=2"
          onError={() => setVideoMissing(true)}
        >
          <source src="/videos/famify-intro.mp4?v=2" type="video/mp4" />
        </video>
      )}
    </div>
  );
}

export function LandingPage() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 text-slate-800">
      {/* Nav */}
      <header className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Famify logo" className="w-9 h-9" />
          <span className="font-display font-extrabold text-xl text-emerald-700">Famify</span>
        </div>
        <nav className="flex items-center gap-3">
          {session ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center h-10 px-4 rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center h-10 px-4 rounded-md text-emerald-700 font-medium hover:bg-emerald-100 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center h-10 px-4 rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero with video on the side */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl text-emerald-600 tracking-tight">
            Famify
          </h1>
          <p className="mt-3 text-2xl font-display font-semibold text-slate-700">
            Organize your family life in one place
          </p>
          <p className="mt-4 text-lg text-slate-600 max-w-xl">
            Shared planning, child health records, secure caregiver sharing, and nearby-care
            search — built for busy families.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center h-12 px-6 text-lg rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
            >
              Get started free
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center h-12 px-6 text-lg rounded-md border border-emerald-500 text-emerald-600 font-medium hover:bg-emerald-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <HeroVideo />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white rounded-xl shadow-sm ring-1 ring-emerald-100 p-6">
              <Icon className="w-8 h-8 text-emerald-500 mb-3" />
              <h3 className="font-display font-semibold text-lg text-slate-800">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section data-testid="reviews-section" className="bg-white/70 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display font-bold text-3xl text-center text-slate-800">
            What families say about Famify
          </h2>
          <p className="mt-2 text-center text-slate-500">
            Early feedback from families using Famify every day.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                data-testid="testimonial-card"
                className="bg-white rounded-xl shadow-sm ring-1 ring-emerald-100 p-6 flex flex-col gap-4"
              >
                <StarRating rating={t.rating} />
                <blockquote className="text-slate-700 leading-relaxed">“{t.quote}”</blockquote>
                <figcaption className="mt-auto">
                  <span className="font-semibold text-slate-800">{t.name}</span>
                  <span className="block text-sm text-slate-500">{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Second video */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div className="flex justify-center lg:justify-start">
          <div
            data-testid="second-video"
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl ring-1 ring-emerald-200 bg-white"
          >
            <video
              className="w-full aspect-video object-cover"
              controls
              muted
              playsInline
              preload="metadata"
              poster="/videos/famify-mother-son-poster.jpg?v=2"
            >
              <source src="/videos/famify-mother-son.mp4?v=2" type="video/mp4" />
            </video>
          </div>
        </div>
        <div>
          <h2 className="font-display font-bold text-3xl text-slate-800">
            Every moment, organized
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-xl">
            From school runs to bedtime routines, Famify keeps parents and kids on the same
            page — so you spend less time coordinating and more time together.
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-12 text-center">
        <p className="text-slate-600">Ready to simplify your family life?</p>
        <Link
          to="/register"
          className="mt-4 inline-flex items-center h-12 px-6 text-lg rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
        >
          Join Famify today
        </Link>
        <p className="mt-8 text-sm text-slate-400">
          © {new Date().getFullYear()} Famify. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
