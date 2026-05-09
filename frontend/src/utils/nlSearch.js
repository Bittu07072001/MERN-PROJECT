// Natural-language query parser for real-estate search
// Returns { category, minPrice, maxPrice, searchText, parsed, summary }

const CAT_MAP = {
  flat: 'Flat', flats: 'Flat',
  apartment: 'Apartments', apartments: 'Apartments',
  villa: 'Villa', villas: 'Villa',
  plot: 'Plot', plots: 'Plot', land: 'Plot',
  office: 'Office', 'office space': 'Office',
  condo: 'Condominium', condominium: 'Condominium',
  studio: 'Flat',
};

const CITY_KEYWORDS = [
  'mumbai','delhi','bangalore','bengaluru','pune','hyderabad',
  'chennai','gurgaon','gurugram','noida','kolkata','ahmedabad',
  'thane','navi mumbai','lonavala','bandra','juhu','andheri',
  'powai','whitefield','koramangala','indiranagar','hsr',
  'gachibowli','hitech city','madhapur','adyar','electronic city',
  'sector 56','sector 62','south delhi',
];

export function parseNLQuery(query) {
  if (!query?.trim()) return null;

  const q = query.toLowerCase().trim();
  const result = { category: '', minPrice: '', maxPrice: '', searchText: '', parsed: false, summary: [] };

  // BHK
  const bhkMatch = q.match(/(\d+)\s*bhk/);
  const bhk = bhkMatch ? bhkMatch[1] : null;
  if (bhk) result.summary.push(`${bhk} BHK`);

  // Category
  for (const [kw, val] of Object.entries(CAT_MAP)) {
    if (q.includes(kw)) { result.category = val; break; }
  }
  if (result.category) result.summary.push(result.category);

  // Price — under/below
  const underCrore  = q.match(/(?:under|below|less than|upto?|up to|within|max)\s*(?:₹\s*)?(\d+(?:\.\d+)?)\s*crore/);
  const underLakh   = q.match(/(?:under|below|less than|upto?|up to|within|max)\s*(?:₹\s*)?(\d+(?:\.\d+)?)\s*lakh/);
  // Price — above/over
  const aboveCrore  = q.match(/(?:above|over|more than|at least|min(?:imum)?|budget)\s*(?:₹\s*)?(\d+(?:\.\d+)?)\s*crore/);
  const aboveLakh   = q.match(/(?:above|over|more than|at least|min(?:imum)?|budget)\s*(?:₹\s*)?(\d+(?:\.\d+)?)\s*lakh/);

  if (underCrore) {
    result.maxPrice = Math.round(parseFloat(underCrore[1]) * 10_000_000);
    result.summary.push(`Under ₹${underCrore[1]} Cr`);
  } else if (underLakh) {
    result.maxPrice = Math.round(parseFloat(underLakh[1]) * 100_000);
    result.summary.push(`Under ₹${underLakh[1]}L`);
  }

  if (aboveCrore) {
    result.minPrice = Math.round(parseFloat(aboveCrore[1]) * 10_000_000);
    result.summary.push(`Above ₹${aboveCrore[1]} Cr`);
  } else if (aboveLakh) {
    result.minPrice = Math.round(parseFloat(aboveLakh[1]) * 100_000);
    result.summary.push(`Above ₹${aboveLakh[1]}L`);
  }

  // City / location for text search
  const foundCity = CITY_KEYWORDS.find(c => q.includes(c));
  const searchParts = [];
  if (bhk) searchParts.push(`${bhk} BHK`);
  if (foundCity) { searchParts.push(foundCity); result.summary.push(foundCity); }
  if (/sea.?view/.test(q)) { searchParts.push('sea view'); result.summary.push('Sea View'); }
  if (/garden/.test(q))    { searchParts.push('garden');   result.summary.push('Garden'); }
  if (/pool/.test(q))      { searchParts.push('pool');     result.summary.push('Pool'); }
  if (/penthouse/.test(q)) { searchParts.push('penthouse'); result.summary.push('Penthouse'); }
  if (/furnished/.test(q) && !/un/.test(q)) { searchParts.push('furnished'); result.summary.push('Furnished'); }

  result.searchText = searchParts.join(' ');
  result.parsed = result.summary.length > 0;

  return result;
}

export const NL_EXAMPLES = [
  '3 BHK flat in Mumbai under 2 crore',
  'Villa in Bangalore above 1.5 crore',
  'sea view apartment under 5 crore',
  'affordable plot in Hyderabad',
  'furnished 2 BHK in Pune',
  'Gurgaon office space under 3 crore',
];
