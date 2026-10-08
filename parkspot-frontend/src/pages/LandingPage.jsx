import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Decorative dots for the mini map preview: [left%, top%, full?]
const DOTS = [
  [12, 22, false], [26, 48, true], [38, 18, false], [47, 62, false], [58, 34, true],
  [66, 70, false], [74, 20, false], [84, 52, true], [20, 76, false], [90, 80, false],
  [52, 12, true], [34, 84, true], [78, 38, false],
];

const STATS = [
  ['11,000+', 'real NYC meters'],
  ['Live', 'availability updates'],
  ['10 min – 4 hr', 'flexible booking'],
  ['$0.10 / min', 'simple pricing'],
];

const FEATURES = [
  ['⚡', 'Live availability', 'Zones flip to red the instant the last spot is taken. No refresh needed.'],
  ['📍', 'Proof you are there', 'Enter the number printed on the meter pole. Wrong number, no booking.'],
  ['💳', 'Prepaid and secure', 'Stripe payments, with automatic refunds if a payment arrives too late.'],
  ['⏰', '5-minute warning', 'A live countdown and a heads-up before your time runs out.'],
];

function Legend({ className = '' }) {
  return (
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      <span className="flex items-center gap-2">
        <span className="w-3.5 h-3.5 rounded-full bg-green-500 ring-4 ring-green-500/25" /> Available
      </span>
      <span className="flex items-center gap-2">
        <span className="w-3.5 h-3.5 rounded-full bg-red-500 ring-4 ring-red-500/25" /> Full
      </span>
    </div>
  );
}

function MapPreview() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/3] rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-blue-900/40 bg-slate-800">
      {/* street grid */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.25) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div className="absolute inset-y-0 left-[45%] w-3 bg-slate-600/50 -skew-x-6" />
      <div className="absolute inset-x-0 top-[55%] h-3 bg-slate-600/50" />

      {DOTS.map(([x, y, full], i) => (
        <span
          key={i}
          className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white/80 ${
            full ? 'bg-red-500 shadow-[0_0_14px_3px_rgba(239,68,68,.6)]' : 'bg-green-500 shadow-[0_0_14px_3px_rgba(34,197,94,.55)]'
          }`}
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}

      {/* fake popup */}
      <div className="absolute left-[60%] top-[8%] bg-white text-gray-900 rounded-lg shadow-xl px-3 py-2 text-xs w-36">
        <p className="font-semibold">7 Avenue (W 36 St)</p>
        <p className="text-gray-600 mt-0.5">2/5 spots taken</p>
        <p className="mt-1 text-center rounded bg-blue-600 text-white py-1 font-medium">Book here</p>
      </div>

      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur rounded-lg px-3 py-2 text-white">
        <Legend />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/map" replace />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900 text-white">
        <header className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <span className="font-bold text-lg flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-base font-extrabold">P</span>
            ParkSpot NYC
          </span>
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/login" className="px-4 py-2 rounded-lg hover:bg-white/10">Log in</Link>
            <Link to="/signup" className="px-4 py-2 rounded-lg bg-white text-slate-900 font-medium hover:bg-gray-100">
              Sign up
            </Link>
          </nav>
        </header>

        <section className="max-w-6xl mx-auto px-4 pt-10 pb-20 grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <span className="inline-block text-xs font-medium tracking-wide uppercase bg-white/10 border border-white/15 rounded-full px-3 py-1">
              Real-time street parking
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Find a spot. <span className="text-green-400">Book it.</span> Park.
            </h1>
            <p className="mt-5 text-lg text-slate-300 max-w-lg">
              See which NYC meters have space right now, then reserve and pay for your time in under a minute.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="px-6 py-3 rounded-xl bg-blue-600 font-semibold hover:bg-blue-500 shadow-lg shadow-blue-900/50">
                Get started free
              </Link>
              <Link to="/login" className="px-6 py-3 rounded-xl border border-white/25 font-semibold hover:bg-white/10">
                Log in
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Demo project in Stripe test mode. No real money is charged. Use card 4242 4242 4242 4242.
            </p>
          </div>
          <MapPreview />
        </section>
      </div>

      {/* STATS */}
      <section className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-lg border grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0">
          {STATS.map(([big, small]) => (
            <div key={small} className="p-5 text-center">
              <p className="text-xl sm:text-2xl font-bold text-blue-700">{big}</p>
              <p className="text-sm text-gray-500 mt-1">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center">How it works</h2>
        <p className="text-center text-gray-600 mt-2">Three steps from circling the block to parked.</p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {/* step 1 */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
            <h3 className="mt-4 text-lg font-semibold">Find a spot</h3>
            <p className="mt-1 text-sm text-gray-600">
              Zoom into the map. Every meter zone is colored by how much space is left:
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <span className="w-4 h-4 rounded-full bg-green-500 ring-4 ring-green-500/25" />
                <span className="text-sm"><b className="text-green-700">Green</b>: spots available</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <span className="w-4 h-4 rounded-full bg-red-500 ring-4 ring-red-500/25" />
                <span className="text-sm"><b className="text-red-700">Red</b>: zone is full</span>
              </div>
            </div>
          </div>

          {/* step 2 */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
            <h3 className="mt-4 text-lg font-semibold">Enter the pole number</h3>
            <p className="mt-1 text-sm text-gray-600">
              Type the number printed on the meter pole and your license plate. It proves you are really there.
            </p>
            <div className="mt-4 rounded-lg border bg-gray-50 p-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Pole number</span><span className="font-mono font-semibold">• • • • • •</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Plate</span><span className="font-mono font-semibold">ABC1234</span></div>
            </div>
          </div>

          {/* step 3 */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</div>
            <h3 className="mt-4 text-lg font-semibold">Pick a time and pay</h3>
            <p className="mt-1 text-sm text-gray-600">
              Choose 10 minutes to 4 hours. Pay securely and your countdown starts.
            </p>
            <div className="mt-4 rounded-lg border bg-gray-50 p-3 text-center">
              <p className="text-xs text-gray-500">Time remaining</p>
              <p className="text-3xl font-mono font-bold">29:42</p>
              <div className="mt-2 flex justify-center gap-1.5">
                {['+10', '+15', '+30'].map((c) => (
                  <span key={c} className="text-xs border rounded-full px-2 py-0.5 bg-white">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white border-y">
        <div className="max-w-6xl mx-auto px-4 py-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([icon, title, text]) => (
            <div key={title}>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl">{icon}</div>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold">Ready to find your spot?</h2>
        <p className="mt-2 text-gray-600">Create a free account and try a booking in under two minutes.</p>
        <Link to="/signup" className="inline-block mt-6 px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg">
          Sign up
        </Link>
      </section>

      <footer className="text-center text-xs text-gray-500 pb-8 px-4">
        Portfolio project built with React, Spring Boot and MongoDB. Not affiliated with NYC DOT or ParkNYC.
        Meter data from NYC Open Data.
      </footer>
    </div>
  );
}
