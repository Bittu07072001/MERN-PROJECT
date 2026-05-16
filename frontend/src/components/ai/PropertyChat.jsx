import { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Sparkles, ExternalLink, Bot, RefreshCw,
  Mic, MicOff, Calculator, CalendarCheck, Heart, GitCompare, MapPin,
  BarChart3, FileText, ShieldCheck, Landmark, TrendingUp, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import useAuthStore from '../../context/authStore';
import { useWishlistStore, useCompareStore } from '../../context/stores';

const INITIAL_MSG = {
  id: 0, role: 'bot',
  text: `Hi! 👋 I'm **HomeBot** — your AI real estate assistant powered by Groq AI.\n\nAsk me anything about properties, EMI calculations, investments, or booking a visit!`,
  chips: ['Search 2BHK under 50 lakh', 'EMI calculator', 'Market snapshot', 'Buyer checklist', 'Stamp duty help', 'Book a visit'],
};

const CHAT_STORAGE_KEY = 'homebotChatHistory';

const toCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const parseBudget = (text) => {
  const m = text.toLowerCase().match(/(?:under|below|upto|up to|budget|max)?\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|lakh|lakhs|lac|l|k)?/);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2] || '';
  if (/cr|crore/.test(unit)) return Math.round(n * 10000000);
  if (/lakh|lac|^l$/.test(unit)) return Math.round(n * 100000);
  if (unit === 'k') return Math.round(n * 1000);
  return n > 100000 ? Math.round(n) : null;
};

const parseCity = (text) => {
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Gurgaon', 'Gurugram', 'Noida', 'Thane', 'Navi Mumbai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi', 'Lonavala'];
  return cities.find(city => new RegExp(`\\b${city}\\b`, 'i').test(text));
};

const parseEmi = (text, property) => {
  const price = parseBudget(text) || (property ? (property.discountPrice > 0 ? property.discountPrice : property.price) : 5000000);
  const tenureMatch = text.match(/(\d+)\s*(?:year|yr|years|yrs)/i);
  const rateMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
  const downMatch = text.match(/(?:down|down payment)\s*(\d+(?:\.\d+)?)\s*(lakh|lac|cr|crore|%)?/i);
  const years = tenureMatch ? Number(tenureMatch[1]) : 20;
  const annualRate = rateMatch ? Number(rateMatch[1]) : 9;
  let downPayment = 0;
  if (downMatch) {
    const val = Number(downMatch[1]);
    const unit = downMatch[2] || '';
    downPayment = unit === '%' ? price * val / 100 : /cr|crore/i.test(unit) ? val * 10000000 : /lakh|lac/i.test(unit) ? val * 100000 : val;
  }
  const principal = Math.max(0, price - downPayment);
  const months = years * 12;
  const monthlyRate = annualRate / 12 / 100;
  const emi = monthlyRate ? Math.round((principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))) : Math.round(principal / months);
  return { price, downPayment, principal, years, annualRate, emi };
};

function renderText(text) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : p
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    );
  });
}

function getFallbackResponse(msg, property) {
  const m = msg.toLowerCase();
  if (/emi|loan|mortgage/.test(m) && property) {
    const price = property.discountPrice > 0 ? property.discountPrice : property.price;
    const rate = 0.09 / 12;
    const emi = Math.round((price * rate) / (1 - Math.pow(1 + rate, -240)));
    return `**EMI Estimate for ${property.name}**\n\nProperty Price: ₹${price.toLocaleString()}\nEMI (20yr @ 9%): ~₹${emi.toLocaleString()}/month\n\nTop banks: HDFC, SBI, ICICI, Axis`;
  }
  if (/book|visit|schedule/.test(m)) {
    return `**Schedule a Visit**\n\n1. Open any property page\n2. Click "Schedule a Visit"\n3. Choose Site Visit or Video Call\n4. Pick your date & time\n5. Confirm — done!`;
  }
  if (/document|legal|rera|checklist/.test(m)) {
    return `**Buyer Checklist**\n\nCheck RERA registration, title chain, encumbrance certificate, approved building plan, occupancy/completion certificate, tax receipts, society NOC, and sale agreement terms before payment.`;
  }
  if (/stamp|registration|tax|charges/.test(m)) {
    return `**Buying Cost Guide**\n\nBudget for stamp duty, registration fees, GST if applicable, legal verification, loan processing, brokerage, maintenance deposit, and moving costs. Exact charges vary by state and property type.`;
  }
  if (/investment|roi|yield|rental/.test(m)) {
    return `**Investment Lens**\n\nCompare location growth, rental demand, infrastructure projects, price per sq ft, builder reputation, maintenance cost, vacancy risk, and exit liquidity.`;
  }
  return `I'm here to help with real estate queries! Ask about property search, EMI, investment score, documents, stamp duty, location insights, comparison, seller contact, or booking visits.`;
}

function getChips(msg, property) {
  const m = msg.toLowerCase();
  if (/emi|loan|mortgage/.test(m)) return ['Loan eligibility', 'Open price estimator', 'Search properties', 'Stamp duty help'];
  if (/compare/.test(m)) return ['Open compare page', 'Market snapshot', 'Investment tips', 'Search properties'];
  if (/location|area|locality|nearby/.test(m)) return ['Location insights', 'Search in Mumbai', 'Search in Bangalore', 'Market snapshot'];
  if (/legal|document|rera|checklist/.test(m)) return ['Stamp duty help', 'Book a visit', 'Search verified listings'];
  if (!property) return ['Search properties', 'EMI calculator', 'AI recommendations', 'Market snapshot', 'Buyer checklist', 'Seller guide'];
  return ["Calculate EMI", 'Save to wishlist', 'Compare this property', 'Book a visit', 'Chat with seller'];
}

export default function PropertyChat() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toggle: toggleWishlist } = useWishlistStore();
  const { add: addCompare, items: compareItems } = useCompareStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
      return saved.length ? saved : [INITIAL_MSG];
    } catch {
      return [INITIAL_MSG];
    }
  });
  const [typing, setTyping] = useState(false);
  const [property, setProperty] = useState(null);
  const [groqAvailable, setGroqAvailable] = useState(true);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [listening, setListening] = useState(false);

  const location = useLocation();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const match = location.pathname.match(/^\/products\/([a-f0-9]{24})$/);
    if (match) {
      api.get(`/products/${match[1]}`).then(r => setProperty(r.data.product)).catch(() => {});
    } else {
      setProperty(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (open) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages, open]);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
  }, [messages]);

  const addBotMessage = (text, extras = {}) => {
    setMessages(m => [...m, {
      id: Date.now() + Math.random(),
      role: 'bot',
      text,
      chips: extras.chips || getChips(text, property),
      ...extras,
    }]);
  };

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  const searchProperties = async (msg) => {
    const budget = parseBudget(msg);
    const city = parseCity(msg);
    const category = /villa/i.test(msg) ? 'Villa' : /plot/i.test(msg) ? 'Plot' : /office/i.test(msg) ? 'Office' : /flat|apartment|bhk/i.test(msg) ? 'Flat' : '';
    const params = new URLSearchParams({ limit: '3' });
    if (budget) params.set('maxPrice', String(budget));
    if (category) params.set('category', category);
    if (city) params.set('search', city);
    const { data } = await api.get(`/products?${params}`);
    const cards = (data.products || []).slice(0, 3).map(p => ({ type: 'property', property: p }));
    const linkParams = new URLSearchParams();
    if (budget) linkParams.set('maxPrice', String(budget));
    if (category) linkParams.set('category', category);
    if (city) linkParams.set('search', city);
    addBotMessage(
      cards.length
        ? `I found ${data.total || cards.length} matching propert${(data.total || cards.length) === 1 ? 'y' : 'ies'}.`
        : 'I could not find exact matches. Try broadening the city, budget, or property type.',
      {
        cards,
        actions: [{ label: 'Open full search', to: `/products?${linkParams.toString()}` }],
        chips: ['Calculate EMI', 'Location insights', 'Show recommendations'],
      }
    );
  };

  const showEmi = (msg) => {
    const e = parseEmi(msg, property);
    addBotMessage(
      `**EMI Calculator**\n\nProperty price: ${toCurrency(e.price)}\nDown payment: ${toCurrency(e.downPayment)}\nLoan amount: ${toCurrency(e.principal)}\nTenure: ${e.years} years\nInterest: ${e.annualRate}% p.a.\n\nEstimated EMI: **${toCurrency(e.emi)}/month**`,
      {
        actions: [
          { label: 'Open price estimator', to: '/price-estimator' },
          ...(property ? [{ label: 'Book a visit', to: `/products/${property._id}` }] : []),
        ],
        chips: ['Search properties', 'Investment tips', 'Compare properties'],
      }
    );
  };

  const showLocation = (msg) => {
    const city = parseCity(msg) || parseCity(property?.name || '') || 'Mumbai';
    addBotMessage(
      `I can analyze localities, connectivity, market trend, and investment score for ${city}.`,
      {
        actions: [{ label: `Analyze ${city}`, to: `/location-insights?city=${encodeURIComponent(city)}` }],
        chips: ['Search in Mumbai', 'Search in Bangalore', 'Investment tips'],
      }
    );
  };

  const showRecommendations = async (msg) => {
    const budget = parseBudget(msg);
    const city = parseCity(msg);
    const params = new URLSearchParams({ limit: '3' });
    if (budget) params.set('budget', String(budget));
    if (city) params.set('city', city);
    const { data } = await api.get(`/ai/recommendations?${params}`);
    const cards = (data.recommendations || []).slice(0, 3).map(r => ({ type: 'property', property: r.property, note: r.reason }));
    addBotMessage(data.summary || 'Here are a few recommendations for you.', {
      cards,
      actions: [{ label: 'Open AI Picks', to: '/ai-recommendations' }],
      chips: ['Compare properties', 'Save to wishlist', 'Book a visit'],
    });
  };

  const showMarketSnapshot = async () => {
    const [{ data: productsRes }, { data: categoriesRes }] = await Promise.all([
      api.get('/products?limit=4&sort=-viewCount'),
      api.get('/products/categories'),
    ]);
    const products = productsRes.products || [];
    const categories = categoriesRes.categories || [];
    const cards = products.map(p => ({ type: 'property', property: p }));
    const categoryText = categories.slice(0, 5).map(c => `${c._id || 'Other'} (${c.count})`).join(', ') || 'categories are loading';
    addBotMessage(
      `**HomeConnect Market Snapshot**\n\nApproved listings available now: **${productsRes.total || products.length}**\nTop categories: ${categoryText}\n\nThese are some high-interest listings from the platform right now.`,
      {
        cards,
        actions: [
          { label: 'Open all properties', to: '/products' },
          { label: 'Open analytics', to: '/analytics' },
        ],
        chips: ['AI recommendations', 'Investment tips', 'Search in Mumbai', 'Compare properties'],
      }
    );
  };

  const showBuyerChecklist = () => {
    addBotMessage(
      `**Strong Buyer Checklist**\n\n1. Shortlist by budget, city, property type, and commute.\n2. Verify RERA, title chain, encumbrance certificate, approved plan, tax receipts, and OC/CC.\n3. Compare effective price: base price + stamp duty + registration + GST if applicable + maintenance + parking.\n4. Calculate EMI with down payment and emergency buffer.\n5. Book a site visit/video call before final negotiation.`,
      {
        actions: [
          { label: 'Browse verified listings', to: '/products' },
          { label: 'Open price estimator', to: '/price-estimator' },
        ],
        chips: ['Stamp duty help', 'Loan eligibility', 'Book a visit', 'Compare properties'],
      }
    );
  };

  const showCostGuide = (msg) => {
    const city = parseCity(msg) || 'your city';
    addBotMessage(
      `**Stamp Duty & Extra Cost Guide**\n\nFor ${city}, budget beyond the property price for:\n- Stamp duty and registration charges\n- GST for under-construction properties, if applicable\n- Legal/title verification\n- Loan processing and valuation charges\n- Brokerage, maintenance deposit, parking, and moving costs\n\nExact stamp duty differs by state, buyer profile, and property type, so verify before payment.`,
      {
        actions: [{ label: 'Open price estimator', to: '/price-estimator' }],
        chips: ['Buyer checklist', 'EMI calculator', 'Search properties'],
      }
    );
  };

  const showLoanEligibility = (msg) => {
    const e = parseEmi(msg, property);
    const monthlyIncome = Math.round(e.emi / 0.45);
    addBotMessage(
      `**Loan Eligibility Quick Check**\n\nEstimated EMI: **${toCurrency(e.emi)}/month**\nA common comfort rule is EMI <= 40-45% of monthly net income.\nSuggested monthly income for this EMI: **${toCurrency(monthlyIncome)}+**\n\nBanks will also check credit score, existing EMIs, age, job/business stability, property documents, and LTV ratio.`,
      {
        actions: [{ label: 'Open price estimator', to: '/price-estimator' }],
        chips: ['Stamp duty help', 'Search properties', 'Book a visit'],
      }
    );
  };

  const showSellerGuide = () => {
    addBotMessage(
      `**Seller Guide**\n\nCreate a complete listing with clear photos, video tour, exact address/city, carpet area, possession status, amenities, pricing, and documents. Faster responses to buyer chats and visit requests usually improve conversions.`,
      {
        actions: [
          { label: 'Seller dashboard', to: '/seller/products' },
          { label: 'Properties', to: '/products' },
        ],
        chips: ['Market snapshot', 'Pricing tips', 'Buyer checklist'],
      }
    );
  };

  const handleAction = async (action, p) => {
    if (action === 'wishlist') {
      if (!user) return toast.error('Please login to save properties');
      const added = await toggleWishlist(p._id);
      toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
      return;
    }
    if (action === 'compare') {
      if (compareItems.length >= 3) return toast.error('Compare up to 3 properties');
      addCompare(p);
      toast.success('Added to comparison');
      return;
    }
    if (action === 'seller') return goTo(`/chat/${p.seller?._id || p.seller}`);
    if (action === 'visit') return goTo(`/products/${p._id}`);
  };

  const handleSpecialIntent = async (msg) => {
    const m = msg.toLowerCase();
    if (/open price estimator|price estimator|valuation|estimate price/.test(m)) {
      addBotMessage('Open the price estimator to calculate expected market value, EMI, and affordability.', {
        actions: [{ label: 'Open price estimator', to: '/price-estimator' }],
        chips: ['EMI calculator', 'Search properties', 'Stamp duty help'],
      });
      return true;
    }
    if (/open compare page|compare page/.test(m)) {
      addBotMessage('You can compare up to 3 shortlisted properties side by side.', {
        actions: [{ label: 'Open compare page', to: '/compare' }],
        chips: ['Search properties', 'Market snapshot', 'Investment tips'],
      });
      return true;
    }
    if (/market|snapshot|trend|trending|popular|analytics|dashboard/.test(m)) {
      await showMarketSnapshot();
      return true;
    }
    if (/emi|loan|mortgage|calculator/.test(m)) {
      showEmi(msg);
      return true;
    }
    if (/eligibility|eligible|salary|income|afford/.test(m)) {
      showLoanEligibility(msg);
      return true;
    }
    if (/recommend|ai picks|suggest/.test(m)) {
      await showRecommendations(msg);
      return true;
    }
    if (/buyer checklist|documents?|legal|rera|title|verification|checklist|due diligence/.test(m)) {
      showBuyerChecklist();
      return true;
    }
    if (/stamp|registration|gst|tax|charges|cost guide|extra cost/.test(m)) {
      showCostGuide(msg);
      return true;
    }
    if (/seller guide|sell property|list property|seller tips|pricing tips/.test(m)) {
      showSellerGuide();
      return true;
    }
    if (/show|search|find|browse|verified listings|under|below|budget|bhk|flat|apartment|villa|plot|office/.test(m) && !/investment tips|advice/.test(m)) {
      await searchProperties(msg);
      return true;
    }
    if (/book|visit|schedule|video call/.test(m)) {
      addBotMessage(
        property
          ? `You can book a site visit or video call for **${property.name}** from the property page.`
          : 'Open any property and use the visit form, or browse properties first.',
        {
          actions: [{ label: property ? 'Book this property' : 'Browse properties', to: property ? `/products/${property._id}` : '/products' }],
          chips: ['Search properties', 'Calculate EMI', 'Location insights'],
        }
      );
      return true;
    }
    if (/wishlist|save/.test(m) && property) {
      await handleAction('wishlist', property);
      addBotMessage(`I handled the wishlist action for **${property.name}**.`, { chips: ['Compare this property', 'Book a visit'] });
      return true;
    }
    if (/compare/.test(m)) {
      if (property) await handleAction('compare', property);
      addBotMessage(property ? `I added **${property.name}** to compare.` : 'Open property pages and add up to 3 listings, then compare them.', {
        actions: [{ label: 'Open compare page', to: '/compare' }],
        chips: ['Search properties', 'Investment tips'],
      });
      return true;
    }
    if (/investment|roi|rental yield|yield|resale|risk/.test(m)) {
      addBotMessage(
        `**Investment Tips**\n\nLook for strong connectivity, job hubs, upcoming infrastructure, rental demand, clean title, manageable maintenance, builder reputation, and realistic resale liquidity. Avoid overpaying for amenities you cannot monetize.`,
        {
          actions: [{ label: 'Open AI Picks', to: '/ai-recommendations' }],
          chips: ['Market snapshot', 'Compare properties', 'Search properties'],
        }
      );
      return true;
    }
    if (/location|locality|nearby|area|metro|school|hospital/.test(m)) {
      showLocation(msg);
      return true;
    }
    if (/seller|contact|call/.test(m) && property) {
      addBotMessage(`You can contact the seller for **${property.name}** from here.`, {
        actions: [{ label: 'Chat with seller', action: 'seller', property }],
        chips: ['Book a visit', 'Save to wishlist'],
      });
      return true;
    }
    return false;
  };

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || typing) return;
    setInput('');

    setMessages(m => [...m, { id: Date.now(), role: 'user', text: msg }]);
    setTyping(true);

    const newHistory = [...conversationHistory, { role: 'user', content: msg }];

    try {
      if (await handleSpecialIntent(msg)) {
        setConversationHistory(newHistory);
        setTyping(false);
        return;
      }

      const { data } = await api.post('/ai/chat', {
        message: msg,
        propertyContext: property ? {
          _id: property._id,
          name: property.name,
          category: property.category,
          price: property.price,
          discountPrice: property.discountPrice,
          brand: property.brand,
          location: property.location,
          ratings: property.ratings,
          stock: property.stock,
          shortDescription: property.shortDescription,
          description: property.description?.substring(0, 300),
          attributes: property.attributes,
        } : undefined,
        conversationHistory: newHistory.slice(-10),
      });

      setGroqAvailable(true);
      const botReply = data.response;
      setConversationHistory([...newHistory, { role: 'assistant', content: botReply }]);
      setTyping(false);
      setMessages(m => [...m, { id: Date.now() + 1, role: 'bot', text: botReply, chips: getChips(msg, property) }]);
    } catch (err) {
      setTyping(false);
      if (err.response?.status === 500) setGroqAvailable(false);
      const fallback = getFallbackResponse(msg, property);
      setMessages(m => [...m, {
        id: Date.now() + 1, role: 'bot',
        text: err.response?.status === 500
          ? `⚠️ AI temporarily unavailable.\n\n${fallback}`
          : fallback,
        chips: getChips(msg, property),
      }]);
    }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const clearChat = () => {
    setMessages([INITIAL_MSG]);
    setConversationHistory([]);
    setGroqAvailable(true);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return toast.error('Voice input is not supported in this browser');
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      toast.error('Could not capture voice input');
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setInput(transcript);
      if (transcript) send(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <>
      <motion.button
        onClick={() => { setOpen(o => !o); if (!open) setTimeout(() => inputRef.current?.focus(), 300); }}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center">
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-5 h-5" /></motion.div>
            : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle className="w-5 h-5" /></motion.div>
          }
        </AnimatePresence>
        {!open && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col"
            style={{ maxHeight: '520px' }}>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm flex items-center gap-1.5">
                  HomeBot AI <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full font-normal">Groq</span>
                </p>
                <p className="text-indigo-200 text-xs truncate">
                  {property ? `📍 ${property.name?.substring(0, 28)}` : 'Your real estate assistant'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearChat} title="Clear chat" className="text-white/60 hover:text-white transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${groqAvailable ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className="text-xs text-green-200">{groqAvailable ? 'Online' : 'Fallback'}</span>
                </div>
              </div>
            </div>

            {!groqAvailable && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-3 py-1.5 text-xs text-yellow-700 dark:text-yellow-400">
                ⚠️ Groq AI key not configured — using basic mode. Add GROQ_API_KEY to enable AI.
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%] space-y-2">
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                    }`}>
                      {renderText(msg.text)}
                    </div>
                    {msg.link && (
                      <Link to={msg.link} onClick={() => setOpen(false)}
                        className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                        <ExternalLink className="w-3 h-3" /> Open
                      </Link>
                    )}
                    {msg.cards?.length > 0 && (
                      <div className="space-y-2">
                        {msg.cards.map(({ property: p, note }) => {
                          const price = p.discountPrice > 0 ? p.discountPrice : p.price;
                          return (
                            <div key={p._id} className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden text-xs shadow-sm">
                              <Link to={`/products/${p._id}`} onClick={() => setOpen(false)} className="block">
                                <div className="flex gap-2 p-2">
                                  <img
                                    src={p.images?.[0]?.url || `https://placehold.co/160x120/e2e8f0/64748b?text=${encodeURIComponent(p.category || 'Property')}`}
                                    alt={p.name}
                                    className="w-16 h-14 rounded-xl object-cover bg-gray-100"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-gray-900 dark:text-white truncate">{p.name}</p>
                                    <p className="text-indigo-600 dark:text-indigo-400 font-black">{toCurrency(price)}</p>
                                    <p className="text-gray-500 dark:text-gray-400 truncate">{p.category}{p.location?.city ? ` · ${p.location.city}` : ''}</p>
                                  </div>
                                </div>
                                {note && <p className="px-2 pb-2 text-gray-500 dark:text-gray-400 leading-relaxed">{note}</p>}
                              </Link>
                              <div className="grid grid-cols-4 border-t border-gray-100 dark:border-gray-700">
                                <button onClick={() => handleAction('wishlist', p)} className="py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-rose-500 flex justify-center" title="Save to wishlist"><Heart className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleAction('compare', p)} className="py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-violet-500 flex justify-center" title="Compare"><GitCompare className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleAction('visit', p)} className="py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-emerald-500 flex justify-center" title="Book visit"><CalendarCheck className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleAction('seller', p)} className="py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-blue-500 flex justify-center" title="Chat with seller"><ExternalLink className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {msg.actions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.actions.map(action => (
                          action.to ? (
                            <Link key={action.label} to={action.to} onClick={() => setOpen(false)}
                              className="text-xs bg-indigo-600 text-white px-2.5 py-1.5 rounded-full hover:bg-indigo-700 transition-colors font-semibold">
                              {action.label}
                            </Link>
                          ) : (
                            <button key={action.label} onClick={() => handleAction(action.action, action.property)}
                              className="text-xs bg-indigo-600 text-white px-2.5 py-1.5 rounded-full hover:bg-indigo-700 transition-colors font-semibold">
                              {action.label}
                            </button>
                          )
                        ))}
                      </div>
                    )}
                    {msg.role === 'bot' && msg.chips?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.chips.map(chip => (
                          <button key={chip} onClick={() => send(chip)}
                            className="text-xs bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors font-medium">
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[
                  { label: 'EMI', icon: <Calculator className="w-3.5 h-3.5" />, text: 'EMI calculator' },
                  { label: 'Market', icon: <BarChart3 className="w-3.5 h-3.5" />, text: 'Market snapshot' },
                  { label: 'Search', icon: <Building2 className="w-3.5 h-3.5" />, text: 'Search 2BHK under 50 lakh' },
                  { label: 'Visit', icon: <CalendarCheck className="w-3.5 h-3.5" />, text: 'Book a visit' },
                  { label: 'Area', icon: <MapPin className="w-3.5 h-3.5" />, text: 'Location insights' },
                  { label: 'Docs', icon: <FileText className="w-3.5 h-3.5" />, text: 'Buyer checklist' },
                  { label: 'Costs', icon: <Landmark className="w-3.5 h-3.5" />, text: 'Stamp duty help' },
                  { label: 'Invest', icon: <TrendingUp className="w-3.5 h-3.5" />, text: 'Investment tips' },
                  { label: 'Safe', icon: <ShieldCheck className="w-3.5 h-3.5" />, text: 'RERA and legal checklist' },
                ].map(item => (
                  <button key={item.label} onClick={() => send(item.text)}
                    className="flex items-center justify-center gap-1 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-300 py-1.5 text-[11px] font-semibold transition-colors">
                    {item.icon}{item.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask anything about real estate…"
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none"
                />
                <button onClick={toggleVoice} type="button"
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                    listening ? 'bg-rose-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:text-indigo-600'
                  }`}
                  title={listening ? 'Stop voice input' : 'Voice input'}>
                  {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => send()} disabled={!input.trim() || typing}
                  className="w-8 h-8 bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-1.5">Powered by Groq AI · llama-3.1-8b-instant</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
