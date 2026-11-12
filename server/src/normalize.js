/**
 * Unified category classifier & price normalizer for Australian supermarket specials
 * across Woolworths, Coles, and ALDI.
 */

export const CATEGORIES = [
  'Fruit & Veg',
  'Meat & Seafood',
  'Fridge & Dairy',
  'Bakery',
  'Freezer',
  'Pantry & Snacks',
  'Drinks',
  'Household & Pet',
  'Health & Beauty',
  'Special Buys',
  'Other',
];

const CATEGORY_RULES = [
  {
    category: 'Meat & Seafood',
    pattern: /\b(beef|chicken|pork|lamb|mince|steak|sausage|bacon|salmon|prawn|fish|seafood|turkey|ham|roast|schnitzel|meatball|chorizo|deli meat|barramundi)\b/i,
  },
  {
    category: 'Fruit & Veg',
    pattern: /\b(apple|banana|avocado|berry|berries|strawberr|blueberr|mango|tomato|potato|onion|salad|lettuce|carrot|broccoli|grape|melon|orange|mandarin|mushroom|spinach|produce|fruit|vegetable|capsicum|cucumber|peach|nectarine|cherry|cherries)\b/i,
  },
  {
    category: 'Fridge & Dairy',
    pattern: /\b(milk|cheese|yoghurt|yogurt|butter|cream|dip|hummus|custard|egg|eggs|margarine|cheddar|brie|feta|halloumi|probiotic|oat milk|almond milk|chilled|pasta sauce fresh)\b/i,
  },
  {
    category: 'Freezer',
    pattern: /\b(frozen|ice cream|gelato|icy pole|drumstick|magnum|connoisseur|bulla|peters|birds eye|mccain|frozen pizza|dumpling|gyoza|spring roll|fish finger|nugget|hash brown)\b/i,
  },
  {
    category: 'Bakery',
    pattern: /\b(bread|loaf|sourdough|croissant|muffin|crumpet|bagel|wrap|tortilla|hot cross|cake|danish|brioche|bakery|roll|rolls|pita|flatbread)\b/i,
  },
  {
    category: 'Drinks',
    pattern: /\b(cola|pepsi|coca-cola|schweppes|sprite|solo|sunkist|water|sparkling|juice|coffee|nescafe|moccona|tea|twining|energy drink|red bull|monster|v energy|gatorade|powerade|kombucha|cordial|mineral water)\b/i,
  },
  {
    category: 'Health & Beauty',
    pattern: /\b(shampoo|conditioner|toothpaste|colgate|oral-b|deodorant|body wash|soap|skincare|moisturiser|sunscreen|vitamin|swisse|blackmores|panadol|nurofen|razor|tissue|toiletries|cosmetic|lip|lotion|serum)\b/i,
  },
  {
    category: 'Household & Pet',
    pattern: /\b(laundry|detergent|omo|cold power|dishwashing|finish|fairy|morning fresh|toilet paper|quilton|kleenex|paper towel|bleach|cleaner|bin liner|foil|cling wrap|cat food|dog food|pet|felix|whiskas|optimum|dine|purina|air freshener|batteries)\b/i,
  },
  {
    category: 'Pantry & Snacks',
    pattern: /\b(chips|chocolate|cadbury|lindt|tim tam|arnotts|biscuit|cookie|cracker|shapes|smiths|doritos|pringles|kettle|cereal|weet-bix|kellogg|oats|muesli|pasta|rice|noodle|sauce|oil|olive oil|tuna|canned|soup|honey|peanut butter|vegemite|jam|sugar|flour|baking|lollies|sweets|nut|almonds|cashews|snack|popcorn)\b/i,
  },
  {
    category: 'Special Buys',
    pattern: /\b(special buy|camping|garden|power tool|ferrex|medion|crofton|ambiano|crane|adventuridge|cookware|bedding|quilt|pillow|lawn|toy|christmas tree|furniture|appliance|air fryer)\b/i,
  },
];

export function classifyCategory(rawCategory = '', title = '', store = '') {
  const combined = `${rawCategory} ${title}`.trim();

  if (/special\s*buys?/i.test(rawCategory)) {
    // Keep grocery special buys in food categories if clearly food, else Special Buys
    for (const rule of CATEGORY_RULES.slice(0, 9)) {
      if (rule.pattern.test(title)) return rule.category;
    }
    return 'Special Buys';
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(combined)) {
      return rule.category;
    }
  }

  if (store === 'aldi' && /special/i.test(combined)) {
    return 'Special Buys';
  }
  return 'Pantry & Snacks';
}

export function parseMoney(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number' && Number.isFinite(val)) {
    return Math.round(val * 100) / 100;
  }
  const str = String(val).replace(/,/g, '').trim();
  if (!str) return null;

  // Handle cents format like "99c"
  const centsMatch = str.match(/^(\d+(?:\.\d+)?)\s*c$/i);
  if (centsMatch) {
    return Math.round(parseFloat(centsMatch[1])) / 100;
  }

  const dollarMatch = str.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  if (dollarMatch) {
    const num = parseFloat(dollarMatch[1]);
    return Number.isFinite(num) ? Math.round(num * 100) / 100 : null;
  }
  return null;
}

export function computeSavings({ price, wasPrice, saveAmount, promoText = '' }) {
  let finalPrice = parseMoney(price);
  let finalWas = parseMoney(wasPrice);
  let finalSave = parseMoney(saveAmount);

  // Extract "Save $X.XX" from promoText if missing
  if (finalSave === null && promoText) {
    const m = promoText.match(/save\s*\$\s*(\d+(?:\.\d{1,2})?)/i);
    if (m) finalSave = parseFloat(m[1]);
  }

  // Extract "Was $X.XX" from promoText if missing
  if (finalWas === null && promoText) {
    const m = promoText.match(/was\s*\$\s*(\d+(?:\.\d{1,2})?)/i);
    if (m) finalWas = parseFloat(m[1]);
  }

  const halfPriceMentioned =
    /\b(1\/2\s*price|half\s*price|50%\s*off|save\s*50%)\b/i.test(promoText);

  if (finalPrice !== null && finalSave !== null && finalWas === null) {
    finalWas = Math.round((finalPrice + finalSave) * 100) / 100;
  } else if (finalPrice !== null && finalWas !== null && finalSave === null && finalWas > finalPrice) {
    finalSave = Math.round((finalWas - finalPrice) * 100) / 100;
  } else if (finalPrice !== null && halfPriceMentioned && finalWas === null) {
    finalWas = Math.round(finalPrice * 2 * 100) / 100;
    finalSave = finalPrice;
  }

  let discountPercent = null;
  if (finalWas && finalPrice !== null && finalWas > finalPrice) {
    discountPercent = Math.round(((finalWas - finalPrice) / finalWas) * 100);
  } else if (halfPriceMentioned) {
    discountPercent = 50;
  }

  const isHalfPrice = Boolean(
    halfPriceMentioned || (discountPercent !== null && discountPercent >= 48)
  );

  return {
    price: finalPrice,
    wasPrice: finalWas,
    saveAmount: finalSave,
    discountPercent,
    isHalfPrice,
  };
}

export function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim();
}
