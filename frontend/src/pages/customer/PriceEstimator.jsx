import { useState } from 'react';
import { Calculator, TrendingUp, MapPin, Home, Sparkles, Info, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { computeInvestmentScore, scoreColor } from '../../utils/aiScore';

const CITIES = ['Mumbai','Delhi','Bangalore','Pune','Hyderabad','Chennai','Gurgaon','Noida','Thane','Navi Mumbai','Kolkata','Ahmedabad','Jaipur','Lucknow','Kochi'];
const CATEGORIES = ['Flat','Apartments','Condominium','Office','Commercial','Studio','Penthouse','Villa','Plot'];
const BHK_OPTIONS = ['Studio','1 BHK','2 BHK','3 BHK','4 BHK','4+ BHK'];
const FURNISHING = ['Fully Furnished','Semi Furnished','Unfurnished'];
const AGES = ['New / Under Construction','0–2 years','3–5 years','6–10 years','10+ years'];
const FLOORS = ['Ground','1–5','6–10','11–20','Penthouse'];

// Base price per sqft (₹) — city × category
const BASE = {
  Mumbai:      { Flat: 36000, Apartments: 29000, Condominium: 34000, Office: 22000, Commercial: 30000, Studio: 31000, Penthouse: 52000, Villa: 48000, Plot: 26000 },
  Delhi:       { Flat: 22000, Apartments: 18000, Condominium: 25000, Office: 15000, Commercial: 21000, Studio: 19000, Penthouse: 34000, Villa: 30000, Plot: 18000 },
  Bangalore:   { Flat: 14000, Apartments: 12000, Condominium: 15000, Office: 10000, Commercial: 13500, Studio: 12500, Penthouse: 22000, Villa: 19000, Plot: 8000 },
  Gurgaon:     { Flat: 19000, Apartments: 16000, Condominium: 21000, Office: 13000, Commercial: 18500, Studio: 17000, Penthouse: 30000, Villa: 26000, Plot: 13000 },
  Pune:        { Flat: 10000, Apartments: 8500,  Condominium: 11000, Office: 7000,  Commercial: 9500,  Studio: 9000,  Penthouse: 16000, Villa: 14000, Plot: 5000 },
  Hyderabad:   { Flat: 9000,  Apartments: 7500,  Condominium: 10000, Office: 6000,  Commercial: 8500,  Studio: 8000,  Penthouse: 15000, Villa: 13000, Plot: 4500 },
  Chennai:     { Flat: 11000, Apartments: 9000,  Condominium: 12000, Office: 7500,  Commercial: 10500, Studio: 9500,  Penthouse: 17000, Villa: 15000, Plot: 5500 },
  Noida:       { Flat: 12000, Apartments: 10000, Condominium: 14000, Office: 8000,  Commercial: 11500, Studio: 10500, Penthouse: 21000, Villa: 18000, Plot: 7000 },
  Kolkata:     { Flat: 8000,  Apartments: 7000,  Condominium: 9000,  Office: 5500,  Commercial: 7500,  Studio: 7200,  Penthouse: 13500, Villa: 12000, Plot: 4000 },
  'Thane':     { Flat: 14000, Apartments: 12000, Condominium: 15000, Office: 8000,  Commercial: 12500, Studio: 12500, Penthouse: 21000, Villa: 18000, Plot: 7000 },
  'Navi Mumbai': { Flat: 15000, Apartments: 12500, Condominium: 16000, Office: 9000, Commercial: 14000, Studio: 13000, Penthouse: 23000, Villa: 20000, Plot: 8000 },
  Ahmedabad:   { Flat: 8500,  Apartments: 7200,  Condominium: 9200,  Office: 6200,  Commercial: 9800,  Studio: 7600,  Penthouse: 14500, Villa: 12500, Plot: 4500 },
  Jaipur:      { Flat: 6500,  Apartments: 5600,  Condominium: 7200,  Office: 4800,  Commercial: 7000,  Studio: 6000,  Penthouse: 11000, Villa: 9500,  Plot: 3500 },
  Lucknow:     { Flat: 6200,  Apartments: 5200,  Condominium: 6800,  Office: 4500,  Commercial: 6500,  Studio: 5600,  Penthouse: 10000, Villa: 9000,  Plot: 3200 },
  Kochi:       { Flat: 7800,  Apartments: 6800,  Condominium: 8500,  Office: 5200,  Commercial: 7600,  Studio: 7000,  Penthouse: 12500, Villa: 11000, Plot: 4200 },
};

const FURN_MOD  = { 'Fully Furnished': 1.15, 'Semi Furnished': 1.07, 'Unfurnished': 1.0 };
const BHK_MOD   = { Studio: 0.85, '1 BHK': 0.9, '2 BHK': 1.0, '3 BHK': 1.08, '4 BHK': 1.18, '4+ BHK': 1.28 };
const AGE_MOD   = { 'New / Under Construction': 1.05, '0–2 years': 1.0, '3–5 years': 0.95, '6–10 years': 0.88, '10+ years': 0.80 };
const FLOOR_MOD = { Ground: 0.95, '1–5': 0.97, '6–10': 1.0, '11–20': 1.03, Penthouse: 1.22 };

function fmt(n) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)} L`;
  return `₹${n.toLocaleString()}`;
}

function estimate({ city, category, bhk, area, furnishing, age, floor, amenities }) {
  const base = (BASE[city]?.[category] || 12000);
  let ppsf = base;
  ppsf *= (BHK_MOD[bhk]   || 1);
  ppsf *= (FURN_MOD[furnishing] || 1);
  ppsf *= (AGE_MOD[age]   || 1);
  ppsf *= (FLOOR_MOD[floor] || 1);
  if (amenities.seaView)  ppsf *= 1.08;
  if (amenities.pool)     ppsf *= 1.05;
  if (amenities.garden)   ppsf *= 1.03;
  if (amenities.gym)      ppsf *= 1.02;
  if (amenities.parking)  ppsf *= 1.02;
  if (amenities.security) ppsf *= 1.01;

  const mid   = Math.round(ppsf * area);
  const low   = Math.round(mid * 0.88);
  const high  = Math.round(mid * 1.12);
  return { low, mid, high, ppsf: Math.round(ppsf), base };
}

export default function PriceEstimator() {
  const [form, setForm] = useState({
    city: 'Mumbai', category: 'Flat', bhk: '2 BHK',
    area: '', furnishing: 'Semi Furnished',
    age: '0–2 years', floor: '6–10',
    amenities: { seaView: false, pool: false, garden: false, gym: false, parking: true, security: false },
  });
  const [result, setResult] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setAmenity = (k, v) => setForm(f => ({ ...f, amenities: { ...f.amenities, [k]: v } }));

  const handleEstimate = () => {
    if (!form.area || isNaN(form.area) || Number(form.area) < 100) {
      return;
    }
    const r = estimate({ ...form, area: Number(form.area) });
    // Build a mock product for AI score
    const mockProduct = {
      name: `${form.bhk} ${form.category} in ${form.city}`,
      category: form.category,
      price: r.mid,
      discountPrice: 0,
      attributes: [
        { key: 'BHK Type', value: form.bhk },
        { key: 'Furnishing', value: form.furnishing },
        { key: 'Age of Property', value: form.age },
        { key: 'Location', value: form.city },
      ],
      description: [
        form.amenities.seaView ? 'sea view' : '',
        form.amenities.pool ? 'swimming pool' : '',
        form.amenities.garden ? 'garden' : '',
        form.amenities.gym ? 'gym' : '',
      ].join(' '),
    };
    const aiScore = computeInvestmentScore(mockProduct);
    setResult({ ...r, aiScore });
  };

  const emi = result ? Math.round((result.mid * 0.009) / (1 - Math.pow(1 / 1.009, 240))) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold px-4 py-1.5 rounded-full">
          <Sparkles className="w-4 h-4" /> AI-Powered Tool
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Property Price Estimator</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">Get an instant AI-estimated market value for any property based on real market data.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Home className="w-4 h-4 text-indigo-500" />Property Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">City</label>
              <select value={form.city} onChange={e => set('city', e.target.value)} className="input text-sm py-2 w-full">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Property Type</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input text-sm py-2 w-full">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Configuration</label>
              <select value={form.bhk} onChange={e => set('bhk', e.target.value)} className="input text-sm py-2 w-full">
                {BHK_OPTIONS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Area (sq.ft) *</label>
              <input type="number" placeholder="e.g. 1200" value={form.area} onChange={e => set('area', e.target.value)}
                className="input text-sm py-2 w-full" min="100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Furnishing</label>
              <select value={form.furnishing} onChange={e => set('furnishing', e.target.value)} className="input text-sm py-2 w-full">
                {FURNISHING.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Property Age</label>
              <select value={form.age} onChange={e => set('age', e.target.value)} className="input text-sm py-2 w-full">
                {AGES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Floor</label>
              <select value={form.floor} onChange={e => set('floor', e.target.value)} className="input text-sm py-2 w-full">
                {FLOORS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Amenities</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { k: 'seaView',  label: '🌊 Sea View' },
                { k: 'pool',     label: '🏊 Pool' },
                { k: 'garden',   label: '🌿 Garden' },
                { k: 'gym',      label: '💪 Gym' },
                { k: 'parking',  label: '🚗 Parking' },
                { k: 'security', label: '🔒 Security' },
              ].map(a => (
                <button key={a.k} onClick={() => setAmenity(a.k, !form.amenities[a.k])}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                    form.amenities[a.k]
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300'
                  }`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleEstimate} disabled={!form.area || Number(form.area) < 100}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Calculator className="w-4 h-4" />
            Estimate Price
          </button>
        </div>

        {/* Result panel */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">
                {/* Price range */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-6 text-white">
                  <p className="text-indigo-200 text-sm font-semibold mb-1">Estimated Market Value</p>
                  <p className="text-3xl font-black">{fmt(result.mid)}</p>
                  <p className="text-indigo-200 text-xs mt-1">Range: {fmt(result.low)} – {fmt(result.high)}</p>
                  <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/80 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <div className="flex justify-between text-xs text-indigo-200 mt-1">
                    <span>Low</span><span>Likely</span><span>High</span>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Price per sq.ft</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹{result.ppsf.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Base rate ({form.city})</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">₹{result.base.toLocaleString()}/sqft</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Est. EMI (20yr, 9%)</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{fmt(emi)}/mo</span>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-gray-800" />
                  {result.aiScore && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">AI Investment Score</span>
                      <span className={`font-bold px-2 py-0.5 rounded-lg text-xs ${scoreColor(result.aiScore.color)}`}>
                        {result.aiScore.score}/10 · {result.aiScore.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bar chart — price breakdown */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" /> Price Factors
                  </p>
                  {[
                    { label: 'Base Location', pct: 45 },
                    { label: 'Configuration', pct: Math.round((BHK_MOD[form.bhk] || 1) * 20) },
                    { label: 'Furnishing', pct: Math.round((FURN_MOD[form.furnishing] || 1) * 10) },
                    { label: 'Floor & Age', pct: Math.round(((FLOOR_MOD[form.floor] || 1) * (AGE_MOD[form.age] || 1) - 0.9) * 100) },
                    { label: 'Amenities', pct: Object.values(form.amenities).filter(Boolean).length * 2 },
                  ].map(f => (
                    <div key={f.label} className="mb-2">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                        <span>{f.label}</span><span>{f.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-indigo-500 rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${Math.min(100, f.pct)}%` }} transition={{ duration: 0.5 }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-start gap-1.5 px-1">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  Estimates are indicative and based on current market data. Actual prices may vary by ±15%.
                </div>

                <Link to="/products" className="btn-secondary w-full text-center text-sm flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" /> Browse Real Properties
                </Link>
              </motion.div>
            ) : (
              <motion.div key="empty" className="bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center space-y-3 h-full flex flex-col items-center justify-center min-h-64">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-indigo-500" />
                </div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">Fill the form to estimate</p>
                <p className="text-sm text-gray-400">Enter property details and get an instant AI-powered price estimate.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
