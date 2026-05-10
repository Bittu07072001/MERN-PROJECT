const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 14;

const textEncoder = new TextEncoder();

const cleanText = (value) => String(value ?? '')
  .replace(/[₹]/g, 'Rs.')
  .replace(/[–—]/g, '-')
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const escapePdfText = (value) => cleanText(value).replace(/[\\()]/g, '\\$&');

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanText(value);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatReportMoney = (value) => {
  const amount = Number(value || 0);
  if (!amount) return 'Rs.0';
  if (amount >= 10000000) return `Rs.${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `Rs.${(amount / 100000).toFixed(2)} L`;
  return `Rs.${Math.round(amount).toLocaleString('en-IN')}`;
};

const getPrice = (product) => product?.discountPrice > 0 ? product.discountPrice : product?.price || 0;

const getCity = (product) => {
  const locationAttr = product?.attributes?.find(attr => /location|city/i.test(attr.key || ''))?.value;
  return product?.location?.city || locationAttr || 'Not specified';
};

const getArea = (product) =>
  product?.attributes?.find(attr => /area|sq.?ft|size/i.test(attr.key || ''))?.value || 'Not specified';

const wrapText = (text, maxChars) => {
  const words = cleanText(text).split(' ').filter(Boolean);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });

  if (line) lines.push(line);
  return lines.length ? lines : [''];
};

const buildBuyerProfile = ({ user, wishlistProducts, cartItems, bookings, orders, products }) => {
  const interestProducts = [
    ...wishlistProducts,
    ...cartItems.map(item => item.product).filter(Boolean),
    ...bookings.map(booking => booking.property).filter(Boolean),
  ];
  const source = interestProducts.length ? interestProducts : products;
  const prices = source.map(getPrice).filter(Boolean);
  const categories = source.map(p => p?.category).filter(Boolean);
  const cities = source.map(getCity).filter(city => city && city !== 'Not specified');
  const minBudget = prices.length ? Math.min(...prices) : 0;
  const maxBudget = prices.length ? Math.max(...prices) : 0;

  const mostCommon = (items, fallback) => {
    if (!items.length) return fallback;
    const counts = items.reduce((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1 }), {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  return {
    name: user?.name || 'Buyer',
    email: user?.email || 'Not available',
    phone: user?.phone || 'Not available',
    preferredCategory: mostCommon(categories, 'Any residential property'),
    preferredCity: mostCommon(cities, 'Any listed city'),
    budgetRange: prices.length ? `${formatReportMoney(minBudget)} - ${formatReportMoney(maxBudget)}` : 'Flexible',
    savedCount: wishlistProducts.length,
    cartCount: cartItems.length,
    bookingCount: bookings.length,
    orderCount: orders.length,
  };
};

const buildSellerProfile = ({ user, products, orders, dashboard, inventory }) => {
  const activeProducts = products.filter(product => product.isActive);
  const approvedProducts = products.filter(product => product.approvalStatus === 'approved');
  const paidOrders = orders.filter(order => order.paymentStatus === 'paid');
  const revenue = dashboard?.stats?.revenue ?? paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const totalViews = products.reduce((sum, product) => sum + Number(product.viewCount || 0), 0);
  const totalEnquiries = products.reduce((sum, product) => sum + Number(product.soldCount || 0), 0);
  const cities = products.map(getCity).filter(city => city && city !== 'Not specified');
  const categories = products.map(product => product.category).filter(Boolean);

  const mostCommon = (items, fallback) => {
    if (!items.length) return fallback;
    const counts = items.reduce((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1 }), {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  return {
    name: user?.name || 'Seller',
    email: user?.email || 'Not available',
    phone: user?.phone || 'Not available',
    totalProducts: products.length,
    activeProducts: activeProducts.length,
    approvedProducts: approvedProducts.length,
    totalOrders: dashboard?.stats?.totalOrders ?? orders.length,
    pendingOrders: dashboard?.stats?.pendingOrders ?? orders.filter(order => ['placed', 'confirmed', 'processing'].includes(order.orderStatus)).length,
    revenue,
    totalViews,
    totalEnquiries,
    primaryCategory: mostCommon(categories, 'Mixed property portfolio'),
    primaryCity: mostCommon(cities, 'Multiple cities'),
    lowStockCount: inventory?.lowStock?.length || 0,
    outOfStockCount: inventory?.outOfStock?.length || 0,
  };
};

const buildReportLines = (report) => {
  const { profile, wishlistProducts, cartItems, bookings, orders, products } = report;
  const topProperties = [...wishlistProducts, ...products]
    .filter((product, index, list) => product?._id && list.findIndex(item => item?._id === product._id) === index)
    .sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0) || (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 6);

  const lines = [
    { text: 'HomeConnect ATS Friendly Buyer Report', size: 18, bold: true },
    { text: `Generated: ${formatDate(new Date())}`, size: 9 },
    { space: 12 },
    { text: 'Buyer Profile', size: 13, bold: true },
    { text: `Name: ${profile.name}` },
    { text: `Email: ${profile.email}` },
    { text: `Phone: ${profile.phone}` },
    { text: `Role: Buyer` },
    { space: 8 },
    { text: 'Buying Preferences Inferred From HomeConnect Activity', size: 13, bold: true },
    { text: `Preferred property type: ${profile.preferredCategory}` },
    { text: `Preferred city/location: ${profile.preferredCity}` },
    { text: `Observed budget range: ${profile.budgetRange}` },
    { text: `Saved properties: ${profile.savedCount}` },
    { text: `Properties in enquiry cart: ${profile.cartCount}` },
    { text: `Site/video visit bookings: ${profile.bookingCount}` },
    { text: `Orders/enquiries placed: ${profile.orderCount}` },
    { space: 8 },
    { text: 'Buyer Intent Summary', size: 13, bold: true },
    {
      text: `The buyer is actively evaluating ${profile.preferredCategory.toLowerCase()} options in ${profile.preferredCity}. This report is structured as plain searchable text so it can be parsed by ATS/document systems and shared with sellers, admins, or relationship managers.`,
    },
    { space: 8 },
    { text: 'Shortlisted Properties', size: 13, bold: true },
  ];

  if (topProperties.length) {
    topProperties.forEach((property, index) => {
      lines.push(
        { text: `${index + 1}. ${property.name}`, bold: true },
        { text: `Category: ${property.category || 'Not specified'} | Location: ${getCity(property)} | Price: ${formatReportMoney(getPrice(property))}` },
        { text: `Area: ${getArea(property)} | Rating: ${property.ratings?.average || 0}/5 | Views: ${property.viewCount || 0}` },
        { text: `Notes: ${property.shortDescription || property.description || 'No summary available.'}` },
      );
    });
  } else {
    lines.push({ text: 'No shortlisted properties found yet.' });
  }

  lines.push({ space: 8 }, { text: 'Cart / Enquiry Items', size: 13, bold: true });
  if (cartItems.length) {
    cartItems.slice(0, 8).forEach((item, index) => {
      const product = item.product || {};
      lines.push({ text: `${index + 1}. ${product.name || 'Property'} - Quantity ${item.quantity || 1} - ${formatReportMoney(getPrice(product))}` });
    });
  } else {
    lines.push({ text: 'No cart items at the time of report generation.' });
  }

  lines.push({ space: 8 }, { text: 'Recent Bookings', size: 13, bold: true });
  if (bookings.length) {
    bookings.slice(0, 8).forEach((booking, index) => {
      lines.push({ text: `${index + 1}. ${booking.property?.name || 'Property visit'} - ${formatDate(booking.visitDate)} ${booking.visitTime || ''} - ${booking.status || 'pending'} - ${booking.visitType || 'site visit'}` });
    });
  } else {
    lines.push({ text: 'No bookings found.' });
  }

  lines.push({ space: 8 }, { text: 'Recent Orders / Enquiries', size: 13, bold: true });
  if (orders.length) {
    orders.slice(0, 8).forEach((order, index) => {
      const names = (order.items || []).map(item => item.name || item.product?.name).filter(Boolean).join(', ');
      lines.push({ text: `${index + 1}. ${order.orderNumber || order._id} - ${order.orderStatus || 'placed'} - ${formatReportMoney(order.total)} - ${names || 'Property enquiry'}` });
    });
  } else {
    lines.push({ text: 'No orders found.' });
  }

  lines.push(
    { space: 8 },
    { text: 'Recommended Next Steps', size: 13, bold: true },
    { text: '1. Compare shortlisted properties by location, final price, area, seller rating, and visit availability.' },
    { text: '2. Schedule or confirm visits for high-intent properties.' },
    { text: '3. Request legal, loan, and possession documents before payment decisions.' },
    { text: '4. Keep this PDF attached to buyer follow-ups for fast ATS/search indexing.' },
  );

  return lines;
};

const buildSellerReportLines = (report) => {
  const { profile, products, orders, dashboard, inventory } = report;
  const topListings = [...products]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0) || getPrice(b) - getPrice(a))
    .slice(0, 8);
  const recentProducts = dashboard?.recentProducts?.length ? dashboard.recentProducts : products.slice(0, 5);

  const lines = [
    { text: 'HomeConnect ATS Friendly Seller Report', size: 18, bold: true },
    { text: `Generated: ${formatDate(new Date())}`, size: 9 },
    { space: 12 },
    { text: 'Seller Profile', size: 13, bold: true },
    { text: `Name: ${profile.name}` },
    { text: `Email: ${profile.email}` },
    { text: `Phone: ${profile.phone}` },
    { text: 'Role: Seller' },
    { space: 8 },
    { text: 'Portfolio Summary', size: 13, bold: true },
    { text: `Total listings: ${profile.totalProducts}` },
    { text: `Active listings: ${profile.activeProducts}` },
    { text: `Approved/live listings: ${profile.approvedProducts}` },
    { text: `Primary category: ${profile.primaryCategory}` },
    { text: `Primary city/location: ${profile.primaryCity}` },
    { text: `Total listing views: ${profile.totalViews}` },
    { text: `Property enquiries/sold count: ${profile.totalEnquiries}` },
    { space: 8 },
    { text: 'Sales And Operations Snapshot', size: 13, bold: true },
    { text: `Total orders: ${profile.totalOrders}` },
    { text: `Pending orders: ${profile.pendingOrders}` },
    { text: `Paid revenue: ${formatReportMoney(profile.revenue)}` },
    { text: `Low stock listings: ${profile.lowStockCount}` },
    { text: `Out of stock listings: ${profile.outOfStockCount}` },
    { space: 8 },
    { text: 'Seller Intent Summary', size: 13, bold: true },
    {
      text: `The seller manages a ${profile.primaryCategory.toLowerCase()} portfolio focused on ${profile.primaryCity}. This ATS friendly report summarizes searchable listing, inventory, order, and revenue data for admin review, seller verification, and partner follow-up workflows.`,
    },
    { space: 8 },
    { text: 'Top Listings By Visibility', size: 13, bold: true },
  ];

  if (topListings.length) {
    topListings.forEach((product, index) => {
      lines.push(
        { text: `${index + 1}. ${product.name}`, bold: true },
        { text: `Category: ${product.category || 'Not specified'} | Location: ${getCity(product)} | Price: ${formatReportMoney(getPrice(product))}` },
        { text: `Status: ${product.isActive ? 'Active' : 'Inactive'} | Approval: ${product.approvalStatus || 'pending'} | Units: ${product.stock || 0}` },
        { text: `Views: ${product.viewCount || 0} | Enquiries/Sold: ${product.soldCount || 0} | Rating: ${product.ratings?.average || 0}/5` },
        { text: `Summary: ${product.shortDescription || product.description || 'No listing summary available.'}` },
      );
    });
  } else {
    lines.push({ text: 'No seller listings found yet.' });
  }

  lines.push({ space: 8 }, { text: 'Recent Listings', size: 13, bold: true });
  if (recentProducts.length) {
    recentProducts.slice(0, 8).forEach((product, index) => {
      lines.push({ text: `${index + 1}. ${product.name} - ${product.category || 'Property'} - ${formatReportMoney(getPrice(product))} - ${product.approvalStatus || 'pending'}` });
    });
  } else {
    lines.push({ text: 'No recent listings found.' });
  }

  lines.push({ space: 8 }, { text: 'Recent Orders', size: 13, bold: true });
  if (orders.length) {
    orders.slice(0, 10).forEach((order, index) => {
      const itemNames = (order.items || [])
        .map(item => item.name || item.product?.name)
        .filter(Boolean)
        .join(', ');
      lines.push({ text: `${index + 1}. ${order.orderNumber || order._id} - ${order.user?.name || 'Customer'} - ${order.orderStatus || 'placed'} - ${formatReportMoney(order.total)} - ${itemNames || 'Seller order'}` });
    });
  } else {
    lines.push({ text: 'No seller orders found.' });
  }

  lines.push({ space: 8 }, { text: 'Inventory Attention', size: 13, bold: true });
  const inventoryItems = [...(inventory?.lowStock || []), ...(inventory?.outOfStock || [])];
  if (inventoryItems.length) {
    inventoryItems.slice(0, 10).forEach((product, index) => {
      lines.push({ text: `${index + 1}. ${product.name} - Units: ${product.stock || 0} - ${product.category || 'Property'} - ${getCity(product)}` });
    });
  } else {
    lines.push({ text: 'No low-stock or out-of-stock listings found.' });
  }

  lines.push(
    { space: 8 },
    { text: 'Recommended Next Steps', size: 13, bold: true },
    { text: '1. Refresh high-view listings with current photos, price, and visit availability.' },
    { text: '2. Prioritize pending orders and customer follow-ups.' },
    { text: '3. Replenish or deactivate out-of-stock listings to avoid poor buyer experience.' },
    { text: '4. Keep this PDF attached to seller verification and admin review workflows for fast ATS/search indexing.' },
  );

  return lines;
};

const buildAdminProfile = ({ user, dashboard, overview, liveCounts, users, sellers, admins, products, orders, bookings, coupons, aiLogs }) => {
  const stats = dashboard?.stats || {};
  const approvalStats = overview?.propertyApprovalStats || {};
  const activeCoupons = coupons.filter(coupon => coupon.isActive).length;
  const pendingBookings = liveCounts?.pendingBookings ?? bookings.filter(booking => booking.status === 'pending').length;
  const pendingOrders = liveCounts?.pendingOrders ?? orders.filter(order => order.orderStatus === 'placed').length;
  const pendingProperties = liveCounts?.pendingProperties ?? products.filter(product => product.approvalStatus === 'pending').length;

  return {
    name: user?.name || 'Admin',
    email: user?.email || 'Not available',
    phone: user?.phone || 'Not available',
    totalBuyers: stats.totalBuyers ?? users.length,
    totalSellers: stats.totalSellers ?? sellers.length,
    totalAdmins: admins.length,
    totalProducts: stats.totalProducts ?? products.length,
    approvedProducts: approvalStats.approved ?? products.filter(product => product.approvalStatus === 'approved').length,
    pendingProperties,
    rejectedProducts: approvalStats.rejected ?? products.filter(product => product.approvalStatus === 'rejected').length,
    totalOrders: stats.totalOrders ?? orders.length,
    pendingOrders,
    totalRevenue: stats.totalRevenue || 0,
    totalBookings: bookings.length,
    pendingBookings,
    activeCoupons,
    totalCoupons: coupons.length,
    aiLogCount: aiLogs?.total ?? aiLogs?.logs?.length ?? 0,
    aiTokenCount: aiLogs?.stats?.totalTokens || 0,
  };
};

const buildAdminReportLines = (report) => {
  const { profile, dashboard, overview, users, sellers, admins, products, orders, bookings, coupons, aiLogs } = report;
  const recentOrders = dashboard?.recentOrders?.length ? dashboard.recentOrders : orders.slice(0, 8);
  const topProducts = dashboard?.topProducts?.length
    ? dashboard.topProducts
    : [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0) || (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 8);
  const sellerStats = overview?.sellerPropertyStats || [];
  const transactions = overview?.sellerBuyerTransactions || [];
  const logs = aiLogs?.logs || [];

  const lines = [
    { text: 'HomeConnect ATS Friendly Admin Report', size: 18, bold: true },
    { text: `Generated: ${formatDate(new Date())}`, size: 9 },
    { space: 12 },
    { text: 'Admin Profile', size: 13, bold: true },
    { text: `Name: ${profile.name}` },
    { text: `Email: ${profile.email}` },
    { text: `Phone: ${profile.phone}` },
    { text: 'Role: Administrator' },
    { space: 8 },
    { text: 'Platform Summary', size: 13, bold: true },
    { text: `Total buyers: ${profile.totalBuyers}` },
    { text: `Total sellers: ${profile.totalSellers}` },
    { text: `Total admins: ${profile.totalAdmins}` },
    { text: `Total properties: ${profile.totalProducts}` },
    { text: `Approved properties: ${profile.approvedProducts}` },
    { text: `Pending properties: ${profile.pendingProperties}` },
    { text: `Rejected properties: ${profile.rejectedProducts}` },
    { text: `Total orders: ${profile.totalOrders}` },
    { text: `Pending orders: ${profile.pendingOrders}` },
    { text: `Total revenue: ${formatReportMoney(profile.totalRevenue)}` },
    { text: `Total bookings: ${profile.totalBookings}` },
    { text: `Pending bookings: ${profile.pendingBookings}` },
    { text: `Coupons: ${profile.activeCoupons} active of ${profile.totalCoupons}` },
    { text: `AI logs: ${profile.aiLogCount} events, ${profile.aiTokenCount} tokens` },
    { space: 8 },
    { text: 'Management Summary', size: 13, bold: true },
    {
      text: `The admin workspace currently manages ${profile.totalBuyers} buyers, ${profile.totalSellers} sellers, ${profile.totalProducts} properties, and ${profile.totalOrders} orders. This ATS friendly report is plain searchable text for audits, leadership updates, operational review, and quick document indexing.`,
    },
    { space: 8 },
    { text: 'Pending Action Queue', size: 13, bold: true },
    { text: `Pending property approvals: ${profile.pendingProperties}` },
    { text: `Pending bookings: ${profile.pendingBookings}` },
    { text: `Pending placed orders: ${profile.pendingOrders}` },
    { space: 8 },
    { text: 'Recent Orders', size: 13, bold: true },
  ];

  if (recentOrders.length) {
    recentOrders.slice(0, 10).forEach((order, index) => {
      const itemNames = (order.items || []).map(item => item.name || item.product?.name).filter(Boolean).join(', ');
      lines.push({ text: `${index + 1}. ${order.orderNumber || order._id} - ${order.user?.name || 'Customer'} - ${order.orderStatus || 'placed'} - ${formatReportMoney(order.total)} - ${itemNames || 'Property order'}` });
    });
  } else {
    lines.push({ text: 'No recent orders found.' });
  }

  lines.push({ space: 8 }, { text: 'Top Properties', size: 13, bold: true });
  if (topProducts.length) {
    topProducts.slice(0, 10).forEach((product, index) => {
      lines.push(
        { text: `${index + 1}. ${product.name}`, bold: true },
        { text: `Seller: ${product.seller?.name || 'Not available'} | Category: ${product.category || 'Not specified'} | Price: ${formatReportMoney(getPrice(product))}` },
        { text: `Approval: ${product.approvalStatus || 'pending'} | Active: ${product.isActive ? 'Yes' : 'No'} | Views: ${product.viewCount || 0} | Enquiries/Sold: ${product.soldCount || 0}` },
      );
    });
  } else {
    lines.push({ text: 'No properties found.' });
  }

  lines.push({ space: 8 }, { text: 'Seller Portfolio Breakdown', size: 13, bold: true });
  if (sellerStats.length) {
    sellerStats.slice(0, 10).forEach((seller, index) => {
      lines.push({ text: `${index + 1}. ${seller.sellerName || 'Seller'} - ${seller.sellerEmail || 'No email'} - Total ${seller.total || 0}, Approved ${seller.approved || 0}, Pending ${seller.pending || 0}, Rejected ${seller.rejected || 0}` });
    });
  } else {
    sellers.slice(0, 10).forEach((seller, index) => {
      lines.push({ text: `${index + 1}. ${seller.name} - ${seller.email} - Active: ${seller.isActive ? 'Yes' : 'No'}` });
    });
    if (!sellers.length) lines.push({ text: 'No sellers found.' });
  }

  lines.push({ space: 8 }, { text: 'Buyer And Admin Accounts', size: 13, bold: true });
  users.slice(0, 8).forEach((buyer, index) => {
    lines.push({ text: `Buyer ${index + 1}. ${buyer.name} - ${buyer.email} - Active: ${buyer.isActive ? 'Yes' : 'No'}` });
  });
  admins.slice(0, 5).forEach((admin, index) => {
    lines.push({ text: `Admin ${index + 1}. ${admin.name} - ${admin.email} - Active: ${admin.isActive ? 'Yes' : 'No'}` });
  });
  if (!users.length && !admins.length) lines.push({ text: 'No buyer/admin account rows loaded.' });

  lines.push({ space: 8 }, { text: 'Recent Bookings And Transactions', size: 13, bold: true });
  if (bookings.length) {
    bookings.slice(0, 8).forEach((booking, index) => {
      lines.push({ text: `${index + 1}. ${booking.name || booking.user?.name || 'Buyer'} - ${booking.property?.name || 'Property'} - ${formatDate(booking.visitDate)} ${booking.visitTime || ''} - ${booking.status || 'pending'}` });
    });
  } else if (transactions.length) {
    transactions.slice(0, 8).forEach((tx, index) => {
      lines.push({ text: `${index + 1}. ${tx.buyerName || 'Buyer'} to ${tx.sellerName || 'Seller'} - ${tx.propertyName || 'Property'} - ${tx.status || 'confirmed'}` });
    });
  } else {
    lines.push({ text: 'No bookings or confirmed transactions found.' });
  }

  lines.push({ space: 8 }, { text: 'Coupons And AI Activity', size: 13, bold: true });
  if (coupons.length) {
    coupons.slice(0, 6).forEach((coupon, index) => {
      lines.push({ text: `${index + 1}. ${coupon.code || 'Coupon'} - Active: ${coupon.isActive ? 'Yes' : 'No'} - Used ${coupon.usedCount || 0} times` });
    });
  } else {
    lines.push({ text: 'No coupons found.' });
  }
  if (logs.length) {
    logs.slice(0, 6).forEach((log, index) => {
      lines.push({ text: `AI ${index + 1}. ${log.type || 'log'} - ${log.user?.name || 'Unknown user'} - Success: ${log.success ? 'Yes' : 'No'} - Tokens: ${log.tokensUsed || 0}` });
    });
  } else {
    lines.push({ text: 'No AI logs loaded.' });
  }

  lines.push(
    { space: 8 },
    { text: 'Recommended Next Steps', size: 13, bold: true },
    { text: '1. Clear pending property approvals, bookings, and placed orders first.' },
    { text: '2. Review top seller portfolios for listing quality and approval hygiene.' },
    { text: '3. Monitor order revenue, coupon usage, and AI logs for operational anomalies.' },
    { text: '4. Keep this PDF attached to admin audits and leadership reviews for fast ATS/search indexing.' },
  );

  return lines;
};

const makePdf = (lines) => {
  const pages = [];
  let current = [];
  let y = PAGE_HEIGHT - MARGIN;

  const addPage = () => {
    pages.push(current);
    current = [];
    y = PAGE_HEIGHT - MARGIN;
  };

  lines.forEach((item) => {
    if (item.space) {
      y -= item.space;
      return;
    }

    const size = item.size || 10;
    const maxChars = Math.floor(CONTENT_WIDTH / (size * 0.52));
    const wrapped = wrapText(item.text, maxChars);

    wrapped.forEach((line, index) => {
      if (y < MARGIN) addPage();
      current.push({ text: line, x: MARGIN, y, size, bold: item.bold && index === 0 });
      y -= item.lineHeight || LINE_HEIGHT;
    });
  });

  if (current.length) pages.push(current);

  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>');
  const pagesId = addObject('');
  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds = [];

  pages.forEach((page) => {
    const stream = page.map((line) =>
      `BT /${line.bold ? 'F2' : 'F1'} ${line.size} Tf ${line.x} ${line.y} Td (${escapePdfText(line.text)}) Tj ET`
    ).join('\n');
    const contentId = addObject(`<< /Length ${textEncoder.encode(stream).length} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(textEncoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = textEncoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
};

export const downloadAtsBuyerReport = (data) => {
  const wishlistProducts = data.wishlist?.products || [];
  const cartItems = data.cart?.items || [];
  const bookings = data.bookings || [];
  const orders = data.orders || [];
  const products = data.products || [];
  const profile = buildBuyerProfile({ user: data.user, wishlistProducts, cartItems, bookings, orders, products });
  const lines = buildReportLines({ profile, wishlistProducts, cartItems, bookings, orders, products });
  const blob = makePdf(lines);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = cleanText(profile.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'buyer';

  link.href = url;
  link.download = `homeconnect-ats-friendly-report-${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadAtsSellerReport = (data) => {
  const products = data.products || [];
  const orders = data.orders || [];
  const inventory = data.inventory || { lowStock: [], outOfStock: [] };
  const dashboard = data.dashboard || null;
  const profile = buildSellerProfile({ user: data.user, products, orders, dashboard, inventory });
  const lines = buildSellerReportLines({ profile, products, orders, dashboard, inventory });
  const blob = makePdf(lines);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = cleanText(profile.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'seller';

  link.href = url;
  link.download = `homeconnect-ats-friendly-seller-report-${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadAtsAdminReport = (data) => {
  const users = data.users || [];
  const sellers = data.sellers || [];
  const admins = data.admins || [];
  const products = data.products || [];
  const orders = data.orders || [];
  const bookings = data.bookings || [];
  const coupons = data.coupons || [];
  const aiLogs = data.aiLogs || { logs: [], total: 0, stats: {} };
  const profile = buildAdminProfile({
    user: data.user,
    dashboard: data.dashboard,
    overview: data.overview,
    liveCounts: data.liveCounts,
    users,
    sellers,
    admins,
    products,
    orders,
    bookings,
    coupons,
    aiLogs,
  });
  const lines = buildAdminReportLines({
    profile,
    dashboard: data.dashboard,
    overview: data.overview,
    users,
    sellers,
    admins,
    products,
    orders,
    bookings,
    coupons,
    aiLogs,
  });
  const blob = makePdf(lines);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = cleanText(profile.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'admin';

  link.href = url;
  link.download = `homeconnect-ats-friendly-admin-report-${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
