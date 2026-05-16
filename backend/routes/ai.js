const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect, optionalAuth } = require('../middleware/auth');
const AILog = require('../models/AILog');
const Product = require('../models/Product');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

function formatINR(value) {
  const n = Number(value || 0);
  if (n >= 10000000) return `Rs ${(n / 10000000).toFixed(n % 10000000 ? 1 : 0)} Cr`;
  if (n >= 100000) return `Rs ${(n / 100000).toFixed(n % 100000 ? 1 : 0)} Lakh`;
  return `Rs ${n.toLocaleString('en-IN')}`;
}

async function getPlatformSnapshot() {
  const baseMatch = { isActive: true, approvalStatus: 'approved' };
  const [summary] = await Product.aggregate([
    { $match: baseMatch },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              minPrice: { $min: { $cond: [{ $gt: ['$discountPrice', 0] }, '$discountPrice', '$price'] } },
              maxPrice: { $max: { $cond: [{ $gt: ['$discountPrice', 0] }, '$discountPrice', '$price'] } },
              avgPrice: { $avg: { $cond: [{ $gt: ['$discountPrice', 0] }, '$discountPrice', '$price'] } },
            },
          },
        ],
        categories: [
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ],
        cities: [
          { $match: { 'location.city': { $nin: [null, ''] } } },
          { $group: { _id: '$location.city', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ],
      },
    },
  ]);

  const topProperties = await Product.find(baseMatch)
    .sort('-isFeatured -isTrending -ratings.average -viewCount -createdAt')
    .limit(6)
    .select('name category price discountPrice location.city ratings viewCount brand attributes tags')
    .lean();

  const totals = summary?.totals?.[0] || {};
  return {
    listingCount: totals.count || 0,
    minPrice: totals.minPrice || 0,
    maxPrice: totals.maxPrice || 0,
    avgPrice: Math.round(totals.avgPrice || 0),
    categories: (summary?.categories || []).map(c => `${c._id || 'Other'} (${c.count})`),
    cities: (summary?.cities || []).map(c => `${c._id} (${c.count})`),
    topProperties: topProperties.map(p => ({
      name: p.name,
      category: p.category,
      city: p.location?.city || 'India',
      price: formatINR(p.discountPrice > 0 ? p.discountPrice : p.price),
      rating: p.ratings?.average || 0,
      views: p.viewCount || 0,
      highlights: [
        p.brand,
        ...(p.attributes || []).slice(0, 2).map(a => `${a.key}: ${a.value}`),
        ...(p.tags || []).slice(0, 2),
      ].filter(Boolean),
    })),
  };
}

async function callGroq(messages, options = {}) {
  const start = Date.now();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: GROQ_MODEL,
      messages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const duration = Date.now() - start;
  const content = response.data.choices[0].message.content;
  const tokens = response.data.usage?.total_tokens || 0;

  return { content, tokens, duration };
}

router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, propertyContext, conversationHistory = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const systemPrompt = `You are HomeBot, an expert AI real estate assistant for HomeConnect — an Indian real estate platform. You help users with:
- Property buying, selling, and renting in India
- EMI and home loan calculations (typical rates: 8.5–9.5% p.a., banks: SBI, HDFC, ICICI, Axis)
- Investment analysis and ROI advice
- Property valuations and price estimates
- Booking site visits and video calls
- RERA compliance and legal advice
- Location-specific property market insights for Indian cities (Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai, Gurgaon, Noida)
- Stamp duty and registration charges

${propertyContext ? `Current Property Context:
- Name: ${propertyContext.name}
- Category: ${propertyContext.category}
- Price: ₹${(propertyContext.discountPrice || propertyContext.price)?.toLocaleString()}
- Description: ${propertyContext.shortDescription || propertyContext.description?.substring(0, 200)}
- Attributes: ${JSON.stringify(propertyContext.attributes?.slice(0, 8))}
` : ''}

Keep responses concise, helpful, and use ₹ for prices. Format numbers in Indian system (Lakh, Crore). Be friendly and professional. If asked about specific properties not in context, suggest browsing the HomeConnect listings.`;

    const platform = await getPlatformSnapshot().catch(() => null);
    const platformPrompt = platform ? `

Live HomeConnect platform context:
- Approved listings: ${platform.listingCount}
- Price range: ${formatINR(platform.minPrice)} to ${formatINR(platform.maxPrice)}; average ${formatINR(platform.avgPrice)}
- Categories: ${platform.categories.join(', ') || 'Not available'}
- Active cities: ${platform.cities.join(', ') || 'Not available'}
- Notable listings: ${platform.topProperties.map(p => `${p.name} (${p.category}, ${p.city}, ${p.price}${p.highlights.length ? `, ${p.highlights.join(', ')}` : ''})`).join(' | ') || 'Not available'}

Use the live HomeConnect context above when recommending properties. If a user asks for matches, mention 1-3 suitable listings from this context when possible. Do not invent exact legal or tax figures; give typical ranges and ask the user to verify with a bank, lawyer, builder, or local authority. End with one practical next step when useful.` : '';

    const messages = [
      { role: 'system', content: `${systemPrompt}${platformPrompt}` },
      ...conversationHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const { content, tokens, duration } = await callGroq(messages, { maxTokens: 512 });

    if (req.user) {
      await AILog.create({
        user: req.user._id,
        type: 'chat',
        prompt: message,
        response: content,
        model: GROQ_MODEL,
        property: propertyContext?._id,
        tokensUsed: tokens,
        durationMs: duration,
        success: true,
      }).catch(() => {});
    }

    res.json({ success: true, response: content, tokensUsed: tokens });
  } catch (err) {
    console.error('Groq chat error:', err.message);

    if (req.user) {
      await AILog.create({
        user: req.user._id,
        type: 'chat',
        prompt: req.body.message || '',
        response: '',
        model: GROQ_MODEL,
        success: false,
        error: err.message,
      }).catch(() => {});
    }

    res.status(500).json({ success: false, message: 'AI service temporarily unavailable', error: err.message });
  }
});

router.get('/recommendations', optionalAuth, async (req, res) => {
  try {
    const { category, budget, city, limit = 4 } = req.query;

    const query = { isActive: true, approvalStatus: 'approved' };
    if (category) query.category = new RegExp(category, 'i');
    if (budget) query.price = { $lte: Number(budget) };

    const sampleProps = await Product.find(query)
      .sort('-ratings.average -viewCount')
      .limit(20)
      .select('name category price discountPrice description attributes tags ratings viewCount');

    if (sampleProps.length === 0) {
      return res.json({ success: true, recommendations: [], reasoning: 'No properties found matching your criteria.' });
    }

    const propsForAI = sampleProps.map((p, i) => ({
      index: i,
      name: p.name,
      category: p.category,
      price: p.discountPrice > 0 ? p.discountPrice : p.price,
      rating: p.ratings?.average || 0,
      views: p.viewCount,
      attrs: p.attributes?.slice(0, 4).map(a => `${a.key}: ${a.value}`).join(', '),
      tags: p.tags?.slice(0, 3).join(', '),
    }));

    const prompt = `You are a real estate AI recommendation engine for HomeConnect (Indian market).

User preferences:
- Category: ${category || 'any'}
- Max Budget: ${budget ? `₹${Number(budget).toLocaleString()}` : 'flexible'}
- City preference: ${city || 'any'}

Available properties (JSON):
${JSON.stringify(propsForAI, null, 2)}

Task: Select the top ${Math.min(Number(limit), sampleProps.length)} most suitable properties for this user. Return a JSON response with this exact structure:
{
  "recommendations": [
    { "index": <number>, "reason": "<1-2 sentence personalized reason>" }
  ],
  "summary": "<2-3 sentence overall recommendation summary>"
}

Only include the JSON, no other text.`;

    const { content, tokens, duration } = await callGroq(
      [{ role: 'user', content: prompt }],
      { maxTokens: 800, temperature: 0.4 }
    );

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = { recommendations: propsForAI.slice(0, limit).map((_, i) => ({ index: i, reason: 'Highly rated property matching your criteria.' })), summary: 'Top rated properties for you.' };
    }

    const recommendations = (parsed.recommendations || []).map(rec => ({
      property: sampleProps[rec.index],
      reason: rec.reason,
    })).filter(r => r.property);

    if (req.user) {
      await AILog.create({
        user: req.user._id,
        type: 'recommendation',
        prompt: JSON.stringify({ category, budget, city }),
        response: content,
        model: GROQ_MODEL,
        tokensUsed: tokens,
        durationMs: duration,
        success: true,
        metadata: { count: recommendations.length },
      }).catch(() => {});
    }

    res.json({ success: true, recommendations, summary: parsed.summary || '' });
  } catch (err) {
    console.error('Groq recommendations error:', err.message);
    res.status(500).json({ success: false, message: 'AI recommendations unavailable', error: err.message });
  }
});

router.post('/location-suggestions', optionalAuth, async (req, res) => {
  try {
    const { city, budget, propertyType } = req.body;

    if (!city) {
      return res.status(400).json({ success: false, message: 'City is required' });
    }

    const prompt = `You are a real estate location expert for India. Provide smart location-based property suggestions.

User query:
- City: ${city}
- Budget: ${budget ? `₹${Number(budget).toLocaleString()}` : 'flexible'}
- Property Type: ${propertyType || 'any'}

Provide a JSON response with this structure:
{
  "topLocalities": [
    {
      "name": "<locality name>",
      "avgPrice": "<price range>",
      "pros": ["<pro1>", "<pro2>", "<pro3>"],
      "connectivity": "<metro/roads info>",
      "trend": "rising|stable|declining",
      "investmentScore": <1-10>
    }
  ],
  "marketInsights": "<2-3 sentences about ${city} real estate market>",
  "buyingTips": ["<tip1>", "<tip2>", "<tip3>"]
}

Return 3-4 localities. Only include JSON, no other text.`;

    const { content, tokens, duration } = await callGroq(
      [{ role: 'user', content: prompt }],
      { maxTokens: 800, temperature: 0.5 }
    );

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = { topLocalities: [], marketInsights: content, buyingTips: [] };
    }

    if (req.user) {
      await AILog.create({
        user: req.user._id,
        type: 'location_suggestion',
        prompt: JSON.stringify({ city, budget, propertyType }),
        response: content,
        model: GROQ_MODEL,
        tokensUsed: tokens,
        durationMs: duration,
        success: true,
      }).catch(() => {});
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error('Groq location suggestions error:', err.message);
    res.status(500).json({ success: false, message: 'AI location suggestions unavailable', error: err.message });
  }
});

router.post('/compare', optionalAuth, async (req, res) => {
  try {
    const { properties } = req.body;
    if (!properties || properties.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 properties required for comparison' });
    }

    const prompt = `You are a real estate investment advisor for the Indian property market (HomeConnect platform).

Compare these ${properties.length} properties for a buyer and provide a structured analysis:

${properties.map((p, i) => `
Property ${i + 1}: ${p.name}
- Type: ${p.category}
- Price: ₹${p.price?.toLocaleString()}${p.originalPrice && p.originalPrice !== p.price ? ` (was ₹${p.originalPrice?.toLocaleString()})` : ''}
- Builder/Brand: ${p.brand || 'Unknown'}
- Rating: ${p.rating ? `${p.rating}/5 (${p.reviewCount} reviews)` : 'No reviews'}
- Availability: ${p.stock > 0 ? 'Available' : 'Not Available'}
- Key Features: ${p.attributes?.map(a => `${a.key}: ${a.value}`).join(', ') || 'N/A'}
- Tags: ${p.tags?.join(', ') || 'N/A'}
- Description: ${p.shortDescription || 'N/A'}
`).join('\n')}

Provide a JSON response with this exact structure:
{
  "winner": "<name of the best property>",
  "winnerReason": "<2-3 sentence explanation of why this is the best choice>",
  "breakdown": [
    {
      "name": "<property name>",
      "investmentScore": <1-10>,
      "pros": ["<pro1>", "<pro2>", "<pro3>"],
      "cons": ["<con1>", "<con2>"]
    }
  ],
  "summary": "<3-4 sentence comprehensive comparison covering value for money, investment potential, and who each property suits best>"
}

Return only JSON, no other text.`;

    const { content, tokens, duration } = await callGroq(
      [{ role: 'user', content: prompt }],
      { maxTokens: 1200, temperature: 0.4 }
    );

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = {
        winner: properties[0].name,
        winnerReason: 'Based on overall value and features.',
        breakdown: properties.map(p => ({ name: p.name, investmentScore: 7, pros: ['Good value'], cons: [] })),
        summary: content,
      };
    }

    if (req.user) {
      await AILog.create({
        user: req.user._id,
        type: 'recommendation',
        prompt: JSON.stringify({ type: 'compare', properties: properties.map(p => p.name) }),
        response: content,
        model: GROQ_MODEL,
        tokensUsed: tokens,
        durationMs: duration,
        success: true,
        metadata: { compareCount: properties.length },
      }).catch(() => {});
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error('Groq compare error:', err.message);
    res.status(500).json({ success: false, message: 'AI comparison unavailable', error: err.message });
  }
});

module.exports = router;
