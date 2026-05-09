export function computeInvestmentScore(product) {
  if (!product) return null;

  let score = 0;
  const attrs = Object.fromEntries(
    (product.attributes || []).map(a => [
      (a.key || '').toLowerCase().trim(),
      (a.value || '').toLowerCase().trim(),
    ])
  );
  const price    = product.discountPrice > 0 ? product.discountPrice : product.price;
  const category = (product.category || '').toLowerCase();
  const allText  = [
    product.name, product.description, product.shortDescription,
    ...Object.values(attrs),
  ].join(' ').toLowerCase();

  // 1. Location tier (0–20)
  if (/mumbai|bandra|juhu|andheri|powai|worli|lower parel|colaba/.test(allText)) score += 20;
  else if (/delhi|south delhi|cp|connaught|gurgaon|gurugram/.test(allText)) score += 18;
  else if (/bangalore|bengaluru|koramangala|indiranagar|whitefield|hsr|sarjapur/.test(allText)) score += 16;
  else if (/hyderabad|gachibowli|hitech|madhapur|noida/.test(allText)) score += 15;
  else if (/pune|chennai|kolkata|ahmedabad/.test(allText)) score += 13;
  else if (/navi mumbai|thane|lonavala|mysore|kochi|vizag/.test(allText)) score += 10;
  else score += 8;

  // 2. Category demand (0–15)
  if (/flat/.test(category)) score += 15;
  else if (/apartment/.test(category)) score += 14;
  else if (/villa/.test(category)) score += 12;
  else if (/condo/.test(category)) score += 11;
  else if (/office/.test(category)) score += 10;
  else if (/plot/.test(category)) score += 9;

  // 3. Price zone / affordability (0–15)
  if      (price < 5_000_000)   score += 15;
  else if (price < 10_000_000)  score += 13;
  else if (price < 20_000_000)  score += 11;
  else if (price < 50_000_000)  score += 8;
  else if (price < 100_000_000) score += 5;
  else                           score += 3;

  // 4. BHK demand (0–12)
  const bhk = attrs['bhk type'] || attrs.bhk || attrs.type || '';
  if      (/2\s*bhk/.test(bhk))   score += 12;
  else if (/3\s*bhk/.test(bhk))   score += 11;
  else if (/1\s*bhk/.test(bhk))   score += 9;
  else if (/4\s*bhk/.test(bhk))   score += 8;
  else if (/studio/.test(bhk))    score += 7;
  else                              score += 9;

  // 5. Property age (0–10)
  const age = attrs['age of property'] || attrs.age || '';
  if      (/new|under.constr|ready/.test(age)) score += 10;
  else if (/[1-2]\s*year/.test(age))           score += 9;
  else if (/[3-5]\s*year/.test(age))           score += 7;
  else if (/[6-9]\s*year/.test(age))           score += 5;
  else if (/\d+\s*year/.test(age))             score += 3;
  else                                          score += 7;

  // 6. Furnishing (0–10)
  const furn = attrs.furnishing || '';
  if      (/fully/.test(furn)) score += 10;
  else if (/semi/.test(furn))  score += 7;
  else if (/un/.test(furn))    score += 3;
  else                          score += 5;

  // 7. Amenity bonuses (0–10)
  if (/sea.?view|ocean.?view/.test(allText))  score += 4;
  if (/pool|swimming/.test(allText))           score += 2;
  if (/garden|terrace|balcony/.test(allText)) score += 1;
  if (/gym|club/.test(allText))               score += 1;
  if (/gated|security|24.?7/.test(allText))   score += 1;
  if (/penthouse/.test(allText))              score += 1;

  // 8. Discount attractiveness (0–5)
  const disc = product.discountPrice > 0
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  if      (disc >= 10) score += 5;
  else if (disc >= 5)  score += 3;
  else if (disc >= 1)  score += 1;

  // Normalize to 1–10 (max raw = 97)
  const norm = Math.min(10, Math.max(1, Math.round((score / 95) * 10)));

  const tiers = {
    10: { label: 'Exceptional',  color: 'emerald', stars: 5 },
    9:  { label: 'Exceptional',  color: 'emerald', stars: 5 },
    8:  { label: 'Excellent',    color: 'green',   stars: 4 },
    7:  { label: 'Very Good',    color: 'teal',    stars: 4 },
    6:  { label: 'Good',         color: 'blue',    stars: 3 },
    5:  { label: 'Fair',         color: 'yellow',  stars: 3 },
    4:  { label: 'Below Avg',    color: 'orange',  stars: 2 },
  };
  const tier = tiers[norm] || { label: 'Low', color: 'gray', stars: 1 };

  return { score: norm, raw: score, ...tier };
}

export function scoreColor(color) {
  const map = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    green:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    teal:    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    blue:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    yellow:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    orange:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    gray:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return map[color] || map.gray;
}
