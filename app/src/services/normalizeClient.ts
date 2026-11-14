import { SpecialItem, SubCategoryFilterDef } from '../types/specials';

export const CLIENT_CATEGORIES = [
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

export const SUBCATEGORY_FILTERS: SubCategoryFilterDef[] = [
  // Pantry & Snacks
  {
    id: 'Snacks',
    label: 'Snacks',
    shortLabel: 'Snacks',
    parentCategory: 'Pantry & Snacks',
    leafSubCategories: ['Chips & Crisps', 'Crackers, Bars & Nuts'],
    searchQuery: 'chips crackers muesli bars snacks',
    popular: true,
  },
  {
    id: 'Chocolate',
    label: 'Chocolate',
    shortLabel: 'Chocolate',
    parentCategory: 'Pantry & Snacks',
    leafSubCategories: ['Chocolate'],
    searchQuery: 'chocolate',
    popular: true,
  },
  {
    id: 'Lollies',
    label: 'Lollies & Gum',
    shortLabel: 'Lollies',
    parentCategory: 'Pantry & Snacks',
    leafSubCategories: ['Lollies'],
    searchQuery: 'lollies gummies sweets',
    popular: true,
  },
  {
    id: 'Chips & Crisps',
    label: 'Chips & Crisps',
    shortLabel: 'Chips & crisps',
    parentCategory: 'Pantry & Snacks',
    leafSubCategories: ['Chips & Crisps'],
    searchQuery: 'potato chips crisps popcorn',
    popular: true,
  },
  {
    id: 'Biscuits & Cookies',
    label: 'Biscuits & Cookies',
    shortLabel: 'Biscuits',
    parentCategory: 'Pantry & Snacks',
    leafSubCategories: ['Biscuits & Cookies'],
    searchQuery: 'biscuits cookies',
    popular: true,
  },
  {
    id: 'Crackers, Bars & Nuts',
    label: 'Crackers, Bars & Nuts',
    shortLabel: 'Crackers & bars',
    parentCategory: 'Pantry & Snacks',
    leafSubCategories: ['Crackers, Bars & Nuts'],
    searchQuery: 'crackers muesli bars nuts',
  },
  {
    id: 'Cereal & Breakfast',
    label: 'Cereal & Breakfast',
    shortLabel: 'Cereal & oats',
    parentCategory: 'Pantry & Snacks',
    leafSubCategories: ['Cereal & Breakfast'],
    searchQuery: 'cereal oats muesli',
  },
  {
    id: 'Pasta, Rice & Noodles',
    label: 'Pasta, Rice & Noodles',
    shortLabel: 'Pasta & rice',
    parentCategory: 'Pantry & Snacks',
    leafSubCategories: ['Pasta, Rice & Noodles'],
    searchQuery: 'pasta rice noodles',
  },
  {
    id: 'Canned, Sauces & Oil',
    label: 'Canned, Sauces & Oil',
    shortLabel: 'Sauces & canned',
    parentCategory: 'Pantry & Snacks',
    leafSubCategories: ['Canned, Sauces & Oil'],
    searchQuery: 'canned tuna pasta sauce olive oil',
  },
  {
    id: 'Spreads & Baking',
    label: 'Spreads & Baking',
    shortLabel: 'Spreads & baking',
    parentCategory: 'Pantry & Snacks',
    leafSubCategories: ['Spreads & Baking'],
    searchQuery: 'peanut butter honey flour sugar',
  },

  // Fruit & Veg
  {
    id: 'Fruit',
    label: 'Fresh Fruit',
    shortLabel: 'Fruit',
    parentCategory: 'Fruit & Veg',
    leafSubCategories: ['Fruit'],
    searchQuery: 'apples bananas berries mangoes fruit',
    popular: true,
  },
  {
    id: 'Vegetables',
    label: 'Fresh Vegetables',
    shortLabel: 'Vegetables',
    parentCategory: 'Fruit & Veg',
    leafSubCategories: ['Vegetables'],
    searchQuery: 'potatoes tomatoes broccoli carrots vegetables',
    popular: true,
  },
  {
    id: 'Salad & Herbs',
    label: 'Salad & Herbs',
    shortLabel: 'Salad & herbs',
    parentCategory: 'Fruit & Veg',
    leafSubCategories: ['Salad & Herbs'],
    searchQuery: 'salad lettuce spinach fresh herbs',
  },

  // Meat & Seafood
  {
    id: 'Meat',
    label: 'Meat (All)',
    shortLabel: 'Meat',
    parentCategory: 'Meat & Seafood',
    leafSubCategories: [
      'Beef, Lamb & Pork',
      'Chicken & Poultry',
      'Bacon, Sausages & Deli',
    ],
    searchQuery: 'beef lamb pork mince sausages chicken',
    popular: true,
  },
  {
    id: 'Beef, Lamb & Pork',
    label: 'Beef, Lamb & Pork',
    shortLabel: 'Beef, lamb & pork',
    parentCategory: 'Meat & Seafood',
    leafSubCategories: ['Beef, Lamb & Pork'],
    searchQuery: 'beef steak mince lamb pork',
  },
  {
    id: 'Chicken & Poultry',
    label: 'Chicken & Poultry',
    shortLabel: 'Chicken',
    parentCategory: 'Meat & Seafood',
    leafSubCategories: ['Chicken & Poultry'],
    searchQuery: 'chicken breast thighs drumsticks',
    popular: true,
  },
  {
    id: 'Bacon, Sausages & Deli',
    label: 'Bacon, Sausages & Deli',
    shortLabel: 'Bacon & sausages',
    parentCategory: 'Meat & Seafood',
    leafSubCategories: ['Bacon, Sausages & Deli'],
    searchQuery: 'bacon sausages ham salami',
  },
  {
    id: 'Seafood',
    label: 'Seafood & Fish',
    shortLabel: 'Seafood',
    parentCategory: 'Meat & Seafood',
    leafSubCategories: ['Seafood'],
    searchQuery: 'salmon prawns fish barramundi',
    popular: true,
  },

  // Fridge & Dairy
  {
    id: 'Milk & Cream',
    label: 'Milk & Cream',
    shortLabel: 'Milk & cream',
    parentCategory: 'Fridge & Dairy',
    leafSubCategories: ['Milk & Cream'],
    searchQuery: 'milk cream iced coffee',
    popular: true,
  },
  {
    id: 'Cheese',
    label: 'Cheese',
    shortLabel: 'Cheese',
    parentCategory: 'Fridge & Dairy',
    leafSubCategories: ['Cheese'],
    searchQuery: 'cheese cheddar tasty mozzarella',
    popular: true,
  },
  {
    id: 'Yoghurt & Custard',
    label: 'Yoghurt & Desserts',
    shortLabel: 'Yoghurt',
    parentCategory: 'Fridge & Dairy',
    leafSubCategories: ['Yoghurt & Custard'],
    searchQuery: 'yoghurt greek yoghurt custard',
  },
  {
    id: 'Butter, Eggs & Dips',
    label: 'Butter, Eggs & Dips',
    shortLabel: 'Eggs, butter & dips',
    parentCategory: 'Fridge & Dairy',
    leafSubCategories: ['Butter, Eggs & Dips'],
    searchQuery: 'eggs butter hummus dip',
  },

  // Bakery
  {
    id: 'Bread & Rolls',
    label: 'Bread & Rolls',
    shortLabel: 'Bread',
    parentCategory: 'Bakery',
    leafSubCategories: ['Bread & Rolls'],
    searchQuery: 'bread rolls sourdough crumpets',
    popular: true,
  },
  {
    id: 'Cakes & Pastries',
    label: 'Cakes & Pastries',
    shortLabel: 'Cakes & pastries',
    parentCategory: 'Bakery',
    leafSubCategories: ['Cakes & Pastries'],
    searchQuery: 'croissants muffins cakes donuts',
  },
  {
    id: 'Wraps & Flatbread',
    label: 'Wraps & Flatbread',
    shortLabel: 'Wraps & flatbread',
    parentCategory: 'Bakery',
    leafSubCategories: ['Wraps & Flatbread'],
    searchQuery: 'wraps tortillas pita naan',
  },

  // Freezer
  {
    id: 'Ice Cream & Desserts',
    label: 'Ice Cream & Desserts',
    shortLabel: 'Ice cream',
    parentCategory: 'Freezer',
    leafSubCategories: ['Ice Cream & Desserts'],
    searchQuery: 'ice cream gelato icy poles',
    popular: true,
  },
  {
    id: 'Frozen Meals & Pizza',
    label: 'Frozen Meals & Pizza',
    shortLabel: 'Frozen meals & pizza',
    parentCategory: 'Freezer',
    leafSubCategories: ['Frozen Meals & Pizza'],
    searchQuery: 'frozen pizza pies dumplings meals',
  },
  {
    id: 'Frozen Chips, Veg & Fish',
    label: 'Frozen Chips, Veg & Fish',
    shortLabel: 'Frozen chips & veg',
    parentCategory: 'Freezer',
    leafSubCategories: ['Frozen Chips, Veg & Fish'],
    searchQuery: 'frozen chips peas fish fingers nuggets',
  },

  // Drinks
  {
    id: 'Soft Drinks',
    label: 'Soft Drinks & Mixers',
    shortLabel: 'Soft drinks',
    parentCategory: 'Drinks',
    leafSubCategories: ['Soft Drinks'],
    searchQuery: 'soft drink cola lemonade ginger beer',
    popular: true,
  },
  {
    id: 'Coffee & Tea',
    label: 'Coffee & Tea',
    shortLabel: 'Coffee & tea',
    parentCategory: 'Drinks',
    leafSubCategories: ['Coffee & Tea'],
    searchQuery: 'coffee tea milo',
    popular: true,
  },
  {
    id: 'Water & Sports',
    label: 'Water, Sports & Energy',
    shortLabel: 'Water & energy',
    parentCategory: 'Drinks',
    leafSubCategories: ['Water & Sports'],
    searchQuery: 'sparkling water sports drink energy drink',
  },
  {
    id: 'Juice & Cordial',
    label: 'Juice & Cordial',
    shortLabel: 'Juice & cordial',
    parentCategory: 'Drinks',
    leafSubCategories: ['Juice & Cordial'],
    searchQuery: 'orange juice apple juice cordial',
  },

  // Health & Beauty
  {
    id: 'Vitamins & Pharmacy',
    label: 'Vitamins & Pharmacy',
    shortLabel: 'Vitamins & meds',
    parentCategory: 'Health & Beauty',
    leafSubCategories: ['Vitamins & Pharmacy'],
    searchQuery: 'vitamins supplements panadol',
  },
  {
    id: 'Personal Care & Beauty',
    label: 'Personal Care & Toiletries',
    shortLabel: 'Personal care',
    parentCategory: 'Health & Beauty',
    leafSubCategories: ['Personal Care & Beauty'],
    searchQuery: 'shampoo toothpaste body wash deodorant',
  },
  {
    id: 'Baby Care',
    label: 'Baby Care & Nappies',
    shortLabel: 'Baby care',
    parentCategory: 'Health & Beauty',
    leafSubCategories: ['Baby Care'],
    searchQuery: 'nappies baby wipes formula',
  },

  // Household & Pet
  {
    id: 'Cleaning & Laundry',
    label: 'Cleaning & Laundry',
    shortLabel: 'Cleaning & laundry',
    parentCategory: 'Household & Pet',
    leafSubCategories: ['Cleaning & Laundry'],
    searchQuery: 'laundry detergent dishwashing cleaner',
  },
  {
    id: 'Paper, Wraps & Bags',
    label: 'Toilet Paper, Wraps & Bags',
    shortLabel: 'Paper & wraps',
    parentCategory: 'Household & Pet',
    leafSubCategories: ['Paper, Wraps & Bags'],
    searchQuery: 'toilet paper paper towel bin liners foil',
  },
  {
    id: 'Pet Food & Care',
    label: 'Pet Food & Care',
    shortLabel: 'Pet food',
    parentCategory: 'Household & Pet',
    leafSubCategories: ['Pet Food & Care'],
    searchQuery: 'cat food dog food pet treats',
  },

  // Special Buys
  {
    id: 'Kitchen & Home',
    label: 'Kitchen & Homewares',
    shortLabel: 'Kitchen & home',
    parentCategory: 'Special Buys',
    leafSubCategories: ['Kitchen & Home'],
    searchQuery: 'kitchenware homewares appliances',
  },
  {
    id: 'Outdoor, Tools & Seasonal',
    label: 'Outdoor, Tools & Seasonal',
    shortLabel: 'Outdoor & seasonal',
    parentCategory: 'Special Buys',
    leafSubCategories: ['Outdoor, Tools & Seasonal'],
    searchQuery: 'special buys outdoor garden tools',
  },
];

const SUBCATEGORY_BY_ID = new Map<string, SubCategoryFilterDef>(
  SUBCATEGORY_FILTERS.map((s) => [s.id.toLowerCase(), s])
);

export const POPULAR_SUBCATEGORY_FILTERS: SubCategoryFilterDef[] = [
  'Snacks',
  'Chocolate',
  'Lollies',
  'Chips & Crisps',
  'Biscuits & Cookies',
  'Fruit',
  'Vegetables',
  'Meat',
  'Chicken & Poultry',
  'Seafood',
  'Milk & Cream',
  'Cheese',
  'Bread & Rolls',
  'Ice Cream & Desserts',
  'Soft Drinks',
  'Coffee & Tea',
]
  .map((id) => SUBCATEGORY_BY_ID.get(id.toLowerCase()))
  .filter((x): x is SubCategoryFilterDef => Boolean(x));

export function getSubCategoryDef(
  subCategoryId: string | null | undefined
): SubCategoryFilterDef | null {
  if (!subCategoryId || subCategoryId === 'All' || subCategoryId === 'all') {
    return null;
  }
  return SUBCATEGORY_BY_ID.get(subCategoryId.toLowerCase()) || null;
}

export function getSubCategoriesForAisle(
  aisle: string | null | undefined
): SubCategoryFilterDef[] {
  if (!aisle || aisle === 'All' || aisle === 'all') {
    return POPULAR_SUBCATEGORY_FILTERS;
  }
  return SUBCATEGORY_FILTERS.filter(
    (s) => s.parentCategory.toLowerCase() === aisle.toLowerCase()
  );
}

export const AISLE_DEFAULT_SEARCH_QUERIES: Record<string, string> = {
  'Fruit & Veg': 'apples',
  'Meat & Seafood': 'chicken breast',
  'Fridge & Dairy': 'milk',
  Bakery: 'bread',
  Freezer: 'ice cream',
  'Pantry & Snacks': 'potato chips',
  Drinks: 'soft drink',
  'Household & Pet': 'laundry liquid',
  'Health & Beauty': 'vitamins',
  'Special Buys': 'kitchenware',
};

export const SUBCATEGORY_RANGE_TERMS: Record<string, string[]> = {
  Snacks: ['potato chips', 'crackers', 'muesli bars', 'popcorn', 'pretzels', 'mixed nuts'],
  Chocolate: ['chocolate block', 'cadbury', 'lindt', 'chocolate bar', 'maltesers', 'kitkat'],
  Lollies: ['lollies', 'gummies', 'jellies', 'marshmallows', 'chewing gum', 'mints'],
  'Chips & Crisps': ['potato chips', 'corn chips', 'pringles', 'popcorn', 'twisties', 'pretzels'],
  'Biscuits & Cookies': ['biscuits', 'cookies', 'tim tam', 'shortbread', 'oreo', 'wafers'],
  'Crackers, Bars & Nuts': ['crackers', 'muesli bars', 'shapes', 'almonds', 'rice crackers', 'protein bars'],
  'Cereal & Breakfast': ['cereal', 'rolled oats', 'muesli', 'weet-bix', 'granola', 'porridge'],
  'Pasta, Rice & Noodles': ['pasta', 'jasmine rice', 'noodles', 'spaghetti', 'ramen', 'basmati'],
  'Canned, Sauces & Oil': ['pasta sauce', 'canned tuna', 'olive oil', 'baked beans', 'soup', 'mayonnaise'],
  'Spreads & Baking': ['peanut butter', 'honey', 'jam', 'flour', 'sugar', 'vegemite'],
  Fruit: ['apples', 'bananas', 'berries', 'oranges', 'grapes', 'mangoes', 'pears', 'watermelon'],
  Vegetables: ['potatoes', 'tomatoes', 'broccoli', 'carrots', 'mushrooms', 'onions', 'avocados', 'capsicum'],
  'Salad & Herbs': ['salad', 'spinach', 'lettuce', 'coleslaw', 'fresh herbs', 'rocket'],
  Meat: ['beef mince', 'chicken breast', 'lamb', 'pork', 'sausages', 'steak', 'bacon', 'schnitzel'],
  'Beef, Lamb & Pork': ['beef mince', 'steak', 'lamb', 'pork', 'roast beef', 'lamb chops'],
  'Chicken & Poultry': ['chicken breast', 'chicken thighs', 'chicken drumsticks', 'turkey', 'chicken schnitzel', 'roast chicken'],
  'Bacon, Sausages & Deli': ['sausages', 'bacon', 'sliced ham', 'salami', 'meatballs', 'chorizo'],
  Seafood: ['salmon', 'prawns', 'fish fillets', 'barramundi', 'calamari', 'smoked salmon'],
  'Milk & Cream': ['full cream milk', 'oat milk', 'iced coffee', 'thickened cream', 'flavoured milk', 'almond milk'],
  Cheese: ['tasty cheese', 'cheddar', 'mozzarella', 'cream cheese', 'feta', 'brie'],
  'Yoghurt & Custard': ['greek yoghurt', 'yoghurt', 'custard', 'chobani', 'mousse', 'cheesecake'],
  'Butter, Eggs & Dips': ['free range eggs', 'butter', 'hummus', 'dips', 'margarine', 'olives'],
  'Bread & Rolls': ['bread', 'sourdough', 'bread rolls', 'crumpets', 'english muffins', 'bagels'],
  'Cakes & Pastries': ['croissants', 'muffins', 'cakes', 'lamingtons', 'pancakes', 'donuts'],
  'Wraps & Flatbread': ['wraps', 'tortillas', 'garlic bread', 'turkish bread', 'naan', 'pita'],
  'Ice Cream & Desserts': ['ice cream', 'gelato', 'icy poles', 'magnum', 'frozen dessert', 'sorbet'],
  'Frozen Meals & Pizza': ['frozen pizza', 'meat pies', 'dumplings', 'frozen meals', 'sausage rolls', 'lasagne'],
  'Frozen Chips, Veg & Fish': ['frozen chips', 'frozen peas', 'fish fingers', 'hash browns', 'chicken nuggets', 'frozen berries'],
  'Soft Drinks': ['soft drink', 'cola', 'lemonade', 'ginger beer', 'tonic water', 'sunkist'],
  'Coffee & Tea': ['coffee', 'instant coffee', 'coffee capsules', 'tea bags', 'green tea', 'milo'],
  'Water & Sports': ['sparkling water', 'spring water', 'sports drink', 'energy drink', 'kombucha', 'coconut water'],
  'Juice & Cordial': ['orange juice', 'apple juice', 'cordial', 'iced tea', 'fruit drink', 'pineapple juice'],
  'Vitamins & Pharmacy': ['vitamins', 'panadol', 'fish oil', 'magnesium', 'throat lozenges', 'hydralyte'],
  'Personal Care & Beauty': ['shampoo', 'toothpaste', 'body wash', 'deodorant', 'moisturiser', 'sunscreen'],
  'Baby Care': ['nappies', 'baby wipes', 'infant formula', 'baby bath'],
  'Cleaning & Laundry': ['laundry liquid', 'dishwashing', 'surface spray', 'toilet cleaner', 'bleach', 'dishwasher tablets'],
  'Paper, Wraps & Bags': ['toilet paper', 'paper towel', 'bin liners', 'baking paper', 'aluminium foil', 'cling wrap'],
  'Pet Food & Care': ['cat food', 'dog food', 'pet treats', 'cat litter'],
  'Kitchen & Home': ['frypan', 'containers', 'kitchenware', 'towels', 'appliances', 'mug'],
  'Outdoor, Tools & Seasonal': ['garden', 'camping', 'storage', 'batteries'],
};

export const AISLE_RANGE_TERMS: Record<string, string[]> = {
  'Fruit & Veg': ['apples', 'potatoes', 'bananas', 'tomatoes', 'berries', 'salad', 'broccoli', 'avocados'],
  'Meat & Seafood': ['beef mince', 'chicken breast', 'sausages', 'salmon', 'lamb', 'bacon', 'pork', 'prawns'],
  'Fridge & Dairy': ['milk', 'cheese', 'yoghurt', 'eggs', 'butter', 'iced coffee', 'hummus', 'cream'],
  Bakery: ['bread', 'bread rolls', 'croissants', 'wraps', 'muffins', 'sourdough', 'crumpets', 'cakes'],
  Freezer: ['ice cream', 'frozen pizza', 'frozen chips', 'dumplings', 'frozen peas', 'meat pies', 'fish fingers', 'gelato'],
  'Pantry & Snacks': ['potato chips', 'chocolate', 'lollies', 'biscuits', 'crackers', 'pasta', 'cereal', 'olive oil', 'canned tuna', 'peanut butter'],
  Drinks: ['soft drink', 'coffee', 'orange juice', 'sparkling water', 'tea bags', 'energy drink', 'cordial', 'ginger beer'],
  'Household & Pet': ['laundry liquid', 'toilet paper', 'dishwashing', 'cat food', 'dog food', 'bin liners', 'surface spray', 'paper towel'],
  'Health & Beauty': ['vitamins', 'shampoo', 'toothpaste', 'body wash', 'deodorant', 'nappies', 'panadol', 'moisturiser'],
  'Special Buys': ['kitchenware', 'containers', 'frypan', 'towels', 'batteries', 'garden'],
};

const AISLE_COLES_BROWSE_SLUG: Record<string, string> = {
  'Fruit & Veg': 'browse:fruit-vegetables',
  'Meat & Seafood': 'browse:meat-seafood',
  'Fridge & Dairy': 'browse:dairy-eggs-fridge',
  Bakery: 'browse:bakery',
  Freezer: 'browse:frozen',
  'Pantry & Snacks': 'browse:pantry',
  Drinks: 'browse:drinks',
};

const DEFAULT_GLOBAL_RANGE_TERMS = [
  'milk',
  'bread',
  'apples',
  'chicken breast',
  'potato chips',
  'chocolate',
  'lollies',
  'cheese',
  'beef mince',
  'soft drink',
  'biscuits',
  'yoghurt',
  'bananas',
  'pasta',
  'coffee',
  'ice cream',
];

export interface RangeSearchPlan {
  primaryTerm: string;
  secondaryTerm: string | null;
  colesQuery: string | null;
  apiPage: number;
}

export function getRangeSearchPlan(
  category?: string | null,
  subCategory?: string | null,
  page = 1
): RangeSearchPlan {
  const safePage = Math.max(1, Math.floor(page || 1));
  const subDef = getSubCategoryDef(subCategory);

  let terms: string[] = DEFAULT_GLOBAL_RANGE_TERMS;
  if (subDef && SUBCATEGORY_RANGE_TERMS[subDef.id]) {
    terms = SUBCATEGORY_RANGE_TERMS[subDef.id];
  } else if (category && category !== 'All' && category !== 'all' && AISLE_RANGE_TERMS[category]) {
    terms = AISLE_RANGE_TERMS[category];
  }

  const slot1 = (safePage - 1) * 2;
  const slot2 = slot1 + 1;
  const primaryTerm = terms[slot1 % terms.length];
  const secondaryTerm =
    terms.length > 1 ? terms[slot2 % terms.length] : null;
  const apiPage = Math.floor(slot1 / terms.length) + 1;

  let colesQuery: string | null = null;
  if (
    !subDef &&
    safePage === 1 &&
    category &&
    AISLE_COLES_BROWSE_SLUG[category]
  ) {
    colesQuery = AISLE_COLES_BROWSE_SLUG[category];
  } else if (safePage <= terms.length) {
    colesQuery = terms[(safePage - 1) % terms.length];
  }

  return {
    primaryTerm,
    secondaryTerm: secondaryTerm !== primaryTerm ? secondaryTerm : null,
    colesQuery,
    apiPage,
  };
}

export function getRangeQueryForFilter(
  category?: string | null,
  subCategory?: string | null
): string {
  return getRangeSearchPlan(category, subCategory, 1).primaryTerm;
}

// ---------------------------------------------------------------------------
// 1. Non-Food / Pharmacy / Household / General Merchandise Patterns
//    Evaluated BEFORE food & flavour patterns so ingredient/scent words like
//    "Fish Oil", "Orange Vita Gummies", "Cocoa Butter Lotion", "Lemon Dish
//    Liquid", "Chicken Cat Food", or "Baking Paper Roll" never leak into food!
// ---------------------------------------------------------------------------

const HOUSEHOLD_PET_PATTERN =
  /\b(laundry|fabric\s*(?:softener|conditioner)|stain\s*remover|napisan|vanish|biozet|omo\b|cold\s*power|radiant\b|earth\s*choice|cuddly|fluffy\b|detergent|dishwashing|dishwasher|rinse\s*aid|finish\b|fairy\b|morning\s*fresh|bleach|disinfectant|glen\s*20|pine\s*o\s*cleen|white\s*king|ajax\b|jif\b|harpic|bref\b|domestos|windex|mr\s*muscle|easy-?off|chux\b|sabco|vileda|scourer|scouring|microfibre\s*cloth|surface\s*(?:spray|cleaner|wipes?)|multisurface|toilet\s*(?:cleaner|gel|block|rim|duck)|drain\s*cleaner|air\s*freshener|air\s*wick|glade\b|febreze|insect(?:icide)?|fly\s*spray|mortein|raid\b|aerogard|ant\s*rid|cockroach|mouse\s*trap|toilet\s*(?:paper|tissues?|rolls?)|quilton|kleenex|sorbent|who\s*gives\s*a\s*crap|paper\s*towels?|kitchen\s*towels?|viva\b|handee|facial\s*tissues?|serviettes?|napkins?|bin\s*liners?|garbage\s*bags?|rubbish\s*bags?|kitchen\s*tidy|glad\b|multix|hercules|cling\s*wrap|aluminium\s*foil|aluminum\s*foil|alfoil|baking\s*paper|parchment\s*paper|freezer\s*bags?|sandwich\s*bags?|ziploc|snap\s*lock|batteries|energizer|duracell|eveready|firelighters?|charcoal\s*briquettes?|cat\s*food|dog\s*food|kitten\s*food|puppy\s*food|pet\s*(?:food|treats?|milk|litter|care)|cat\s*litter|kitty\s*litter|dentalife|schmackos|pedigree|whiskas|felix\b|optimum\b|dine\b|fancy\s*feast|purina|supercoat|vip\s*petfoods?|my\s*dog\b|cesar\b|fussy\s*cat|applaws|bird\s*seed)\b/i;

const COFFEE_CAPSULE_GUARD =
  /\b(coffee|espresso|nespresso|dolce\s*gusto|caffitaly|lavazza|vittoria|moccona|l'or|starbucks|campos|pod|pods|roast)\b/i;

const HEALTH_BEAUTY_CORE_PATTERN =
  /\b(vitamins?|multivitamins?|multi-?vitamins?|vita\s*gumm(?:y|ies)|supplements?|caplets?|softgels?|lozenges?|effervescent|chewable\s*tablets?|fish\s*oil|krill\s*oil|omega-?\s*3|glucosamine|magnesium|melatonin|ashwagandha|collagen|coq10|folic\s*acid|caltrate|centrum|swisse|blackmores|cenovis|ostelin|voost|berocca|elevit|bioglan|ethical\s*nutrients|natures?\s*way|natures?\s*own|healthy\s*care|life-?space|life\s*botanics|jshealth|musashi|bsc\b|body\s*science|whey\s*protein|protein\s*(?:powder|isolate)|mass\s*gainer|creatine|pre-?workout|electrolyte\s*(?:powder|tablets?|sticks?|solution)|liquid\s*i\.?v\.?|hydralyte|gastrolyte|metamucil|benefiber|probiotic\s*(?:capsules?|tablets?|powder|drops?|gumm(?:y|ies)|supplement)|panadol|nurofen|paracetamol|ibuprofen|aspirin|disprin|voltaren|deep\s*heat|metsal|zyrtec|telfast|claratyne|codral|sudafed|lemsup|strepsils|difflam|betadine|vicks|bisolvon|duro-?tuss|gaviscon|mylanta|quick-?eze|nexium|somac|rennie|imodium|buscopan|coloxyl|movicol|canesten|hydrozole|savlon|bepanthen|sudocrem|band-?aids?|elastoplast|antiseptic|first\s*aid|eye\s*drops?|ear\s*drops?|nasal\s*spray|otrivin|fess\b|throat\s*(?:spray|gargle|drops?|lozenges?)|shampoos?|conditioners?|hair\s*(?:colour|color|dye|mask|serum|spray|gel|mousse|wax|treatment|food)|colourant|schwarzkopf|head\s*(?:&|and)\s*shoulders|pantene|tresemme|garnier|herbal\s*essences|sunsilk|toni\s*(?:&|and)\s*guy|ogx\b|john\s*frieda|monday\s*haircare|toothpastes?|toothbrush(?:es)?|mouthwash|dental\s*floss|interdental|colgate|oral-?b|sensodyne|macleans|listerine|polident|steradent|deodorants?|antiperspirants?|roll-?on|rexona|lynx\b|dove\b|nivea|mitchum|norsca|brut\b|body\s*(?:wash|scrub|lotion|butter|oil|mist|spray)|shower\s*gel|hand\s*(?:wash|saniti[sz]er|cream|lotion)|bar\s*soap|liquid\s*soap|palmolive|imperial\s*leather|radox|original\s*source|skincare|moisturis(?:er|ing)|cleans(?:er|ing)|micellar|facial\s*(?:wash|scrub|wipes?|mask|serum|oil|cream)|eye\s*cream|night\s*cream|day\s*cream|retinol|hyaluronic|niacinamide|spf\s*\d+|sunscreen|aftersun|cancer\s*council|banana\s*boat|bondi\s*sands|le\s*tan|self\s*tan|olay|neutrogena|cerave|cetaphil|aveeno|sukin|vaseline|sorbolene|la\s*roche|l'oreal|loreal|essano|swisspers|cotton\s*(?:pads?|balls?|tips?|buds?)|razors?|shav(?:e|ing)\s*(?:gel|foam|cream|blades?|balm)|aftershave|gillette|venus\b|schick|veet\b|nair\b|wax\s*strips?|toiletries|cosmetics?|makeup|mascara|eyeliner|eyeshadow|concealer|lipstick|lip\s*(?:balm|gloss|care|oil|liner)|chapstick|blistex|burt'?s\s*bees|maybelline|revlon|rimmel|covergirl|sally\s*hansen|nail\s*polish|serum|lotion|tampons?|sanitary\s*(?:pads?|napkins?)|panty\s*liners?|kotex|libra\b|carefree|always\s*(?:discreet|pads?|ultra)|poise\b|tena\b|condoms?|durex|lubricant|napp(?:y|ies)|nappy\s*pants|baby\s*(?:wipes?|bath|shampoo|lotion|oil|powder)|waterwipes|huggies|rascals\b|babylove|curash|infant\s*formula|aptamil|karicare)\b/i;

const CAPSULE_TABLET_DOSE_PATTERN = /\b(capsules?|tablets?)\b/i;

const SPECIAL_BUYS_GM_PATTERN =
  /\b(special\s*buys?|power\s*tools?|cordless\s*drill|angle\s*grinder|ferrex|workzone|auto\s*xs|medion|bauhn|crofton|ambiano|crane\b|adventuridge|gardenline|kirkton\s*house|easy\s*home|sohl\s*furniture|cookware|frypan|frying\s*pan|saucepan|cast\s*iron|baking\s*tray|roasting\s*pan|oven\s*mitt|pot\s*holder|tea\s*towels?|food\s*storage\s*containers?|insulated\s*(?:tumbler|mug|bottle)|ceramic\s*(?:mug|jar|bowl|plate)|\bmugs?\b|dinner\s*set|cutlery|air\s*fryer|electric\s*kettle|cordless\s*kettle|toaster|microwave|coffee\s*machine|espresso\s*machine|stick\s*mixer|slow\s*cooker|pressure\s*cooker|rice\s*cooker|vacuum\s*cleaner|steam\s*mop|ironing\s*board|clothes\s*airer|bedding|quilt|doona|pillows?|sheet\s*set|mattress|bath\s*towels?|throw\s*rug|cushions?|curtains?|furniture|bookshelf|office\s*chair|camping|\btent\b|sleeping\s*bag|gazebo|esky|cooler\s*bag|lawn\s*mower|whipper\s*snipper|pruner|potting\s*mix|fertiliser|hose\s*reel|baubles?|christmas\s*(?:tree|lights?|cards?|crackers?|bon\s*bons?|decorations?|stocking|wreath|tin\s*set)|wrapping\s*paper|gift\s*(?:wrap|bags?|tags?)|present\s*(?:toppers?|tags?)|curling\s*ribbon|velvet\s*ribbon|printed\s*ribbon|sticky\s*tape|stationery|notebooks?|ballpoint\s*pens?|sharpie|lego\b|plush\s*toy|board\s*game|jigsaw\s*puzzle|pyjamas?|slippers?|hoodie|trackpants?|work\s*boots?|umbrellas?)\b/i;

// ---------------------------------------------------------------------------
// 2. Food & Drink Category Patterns (Ordered to prevent ingredient hijacking)
// ---------------------------------------------------------------------------

const FREEZER_PATTERN =
  /\b(frozen|from\s*the\s*(?:seafood\s*)?freezer|ice\s*creams?|gelato|sorbet|icy\s*poles?|zooper\s*dooper|calippo|paddle\s*pops?|golden\s*gaytime|maxibon|magnum\b|connoisseur|weis\b|bulla\s*(?:creamy|everyday|crunch|splits|multipacks?)|peters\b|streets\b|ben\s*(?:&|and)\s*jerry|haagen-?dazs|sara\s*lee|birds\s*eye|mccain|borg'?s|herbert\s*adams|four'?\s*n\s*twenty|patties\s*(?:party|pies?|rolls?)|lean\s*cuisine|on\s*the\s*menu|super\s*nature|dumplings?|gyoza|spring\s*rolls?|dim\s*sims?|fish\s*fingers?|hash\s*browns?|potato\s*gems?|potato\s*wedges.*freezer)\b/i;

const CANNED_LIQUID_GUARD =
  /\bin\s+(?:spring\s*water|water|brine|oil|olive\s*oil|(?:natural\s+|pear\s+|apple\s+)?juice|syrup)\b/i;

const VINEGAR_COOKING_GUARD =
  /\b(vinegar|cooking\s*wine|beer\s*batter|coffee\s*(?:cake|scroll|biscuits?|cookies?))\b/i;

const DRINKS_PATTERN =
  /\b(soft\s*drinks?|cola\b|coca-?cola|pepsi|schweppes|sprite|fanta|solo\b|sunkist|kirks|mountain\s*dew|passiona|bundaberg\s*(?:ginger|brewed|sarsaparilla|lemon|burgundee|guava|passionfruit)|ginger\s*beer|tonic\s*water|soda\s*water|dry\s*ginger|lemon\s*lime\s*(?:&|and)?\s*bitters|mineral\s*water|sparkling\s*water|spring\s*water|still\s*water|active\s*water|vitamin\s*water|vitaminwater|mount\s*franklin|pump\s*water|frantelle|san\s*pellegrino|evian\b|fiji\s*water|coconut\s*water|fruit\s*juice|orange\s*juice|apple\s*juice|cloudy\s*apple|cranberry\s*juice|pineapple\s*juice|tomato\s*juice|juice\s*boxes?|nudie\b|daily\s*juice|golden\s*circle\s*(?:juice|drink|golden\s*pash|sunshine\s*punch|fruit\s*drink)|prima\b|pop\s*tops?|ribena|cordials?|bickford'?s|energy\s*drinks?|sports?\s*drinks?|red\s*bull|monster\s*energy|\bv\s+energy\b|mother\s*energy|celsius\b|gatorade|powerade|maximus\b|prime\s*hydration|kombucha|remedy\b|iced?\s*tea|lipton|fuze\s*tea|tea\s*bags?|green\s*tea|black\s*tea|herbal\s*tea|earl\s*grey|english\s*breakfast|peppermint\s*tea|chamomile|chai\s*(?:latte|tea)|twinings|tetley|bushells|dilmah|nerada|madura|\bt2\b|coffee\s*(?:beans?|capsules?|pods?|ground|instant|sachets?|bags?)|\bcoffee\b|nescafe|moccona|lavazza|vittoria|robert\s*timms|l'or\b|campos\b|grinders\b|international\s*roast|milo\b|drinking\s*chocolate|hot\s*chocolate|nesquik|prosecco|champagne|sauvignon|shiraz|chardonnay|pinot|cabernet|merlot|rose\s*wine|\bwine\b|\bbeer\b|lager\b|pale\s*ale|alcoholic\s*cider|apple\s*cider)\b/i;

const BAKERY_NON_BREAD_GUARD =
  /\b(toilet\s*rolls?|paper\s*rolls?|kitchen\s*rolls?|foil\s*rolls?|wrap\s*rolls?|baking\s*paper|spring\s*rolls?|sausage\s*rolls?|chiko\s*rolls?|roll-?on|bread\s*crumbs?|breadcrumbs?|cake\s*mix|muffin\s*mix|pancake\s*mix|wafer\s*rolls?|rice\s*cakes?|butter\s*cookies?|shortbread\s*biscuits?)\b/i;

const BAKERY_PATTERN =
  /\b(bread\b|breads\b|loaves?|loaf\b|sourdough|ciabatta|turkish\s*bread|focaccia|baguette|croissants?|pains?\s*au\s*chocolat|muffins?|crumpets?|bagels?|tortillas?|pita\b|flatbreads?|naan\b|rotis?|wraps?\b|hot\s*cross\s*buns?|brioche|danish\s*pastr(?:y|ies)|danishes|(?:fruit|apple|berry|apricot|custard)\s*danish|donuts?|doughnuts?|lamingtons?|scones?|pikelets?|pancakes?|waffles?\b|cinnamon\s*scrolls?|finger\s*buns?|burger\s*buns?|hot\s*dog\s*rolls?|bread\s*rolls?|dinner\s*rolls?|milk\s*rolls?|kaisers?|bakery|from\s*the\s*bakery|mud\s*cake|sponge\s*cake|carrot\s*cake|banana\s*bread|christmas\s*(?:pudding|mince\s*pies?)|pavlovas?)\b/i;

const SNACK_BISCUIT_CONFECTIONERY_GUARD =
  /\b(chips?|crisps?|crackers?|biscuits?|cookies?|shapes\b|twisties|cheezels|burger\s*rings|doritos|pringles|kettle\b|smith'?s|thins\b|grain\s*waves|red\s*rock\s*deli|cc'?s\b|cheetos|popcorn|cobs\b|pretzels?|parker'?s|peckish|sakata|wafers?|rice\s*(?:wheels|crackers|cakes)|corn\s*chips|tortilla\s*chips|muesli\s*bars?|nut\s*bars?|granola\s*bars?|oat\s*bars?|snack\s*bars?|protein\s*bars?|fruit\s*straps?|roll-?ups|chocolate|choc\s*bits|cadbury|dairy\s*milk|milk\s*tray|milkybar|lindt|lindor|toblerone|ferrero|raffaello|guylian|darrell\s*lea|whittaker'?s|haigh'?s|kinder\b|mars\b|snickers|twix\b|kit\s*kat|kitkat|maltesers|m&m'?s?|bounty\b|smarties|aero\b|violet\s*crumble|cherry\s*ripe|crunchie|freddo|caramello|picnic\b|allen'?s|natural\s*confectionery|trolli|haribo|sour\s*patch|sour\s*straps?|skittles|starburst|mentos|tic\s*tac|eclipse\s*(?:mints?|chewy)|extra\s*(?:gum|chewing|peppermint|spearmint)|chewing\s*gum|bubble\s*gum|sugarfree\s*gum|wrigley'?s|hubba\s*bubba|chupa\s*chups|lollipops?|toffees?|werther'?s|candy|candies|life\s*savers|lollies|jellies|gumm(?:y|ies)|marshmallows?|licorice|liquorice|advent\s*calendars?|easter\s*eggs?|arnott'?s|tim\s*tam|oreo|belvita|anzac\s*biscuits?|shortbread|gingerbread|peanut\s*butter|almond\s*butter|cashew\s*butter|cookie\s*butter|biscoff|nutella|hazelnut\s*spread|coconut\s*(?:milk|cream)|cream\s*of\s*(?:chicken|mushroom|tomato|pumpkin|asparagus)|pasta\s*sauce|simmer\s*sauce|butter\s*chicken\s*sauce|egg\s*noodles?|cake\s*mix|muffin\s*mix|frosting|icing)\b/i;

const CHILLED_DAIRY_OVERRIDE_GUARD =
  /\b(flavoured\s*milk|chocolate\s*milk|iced\s*chocolate|(?<!coconut\s)milk\s+\d+(?:\.\d+)?\s*(?:ml|l|litres?)\b|yoghurts?|yogurts?|custards?|mousse|cheesecake|trifle|tiramisu|panna\s*cotta|yogo\b|\boak\b|nippy'?s|breaka|farmers\s*union|pauls\b|dairy\s*farmers|chobani|yoplait|vaalia|danone|from\s*the\s*fridge|chilled)\b/i;

const FRIDGE_DAIRY_PATTERN =
  /\b(full\s*cream\s*milk|skim\s*milk|lite\s*milk|light\s*milk|trim\s*milk|fresh\s*milk|lactose\s*free\s*milk|a2\s*milk|oat\s*milk|almond\s*milk|soy\s*milk|macadamia\s*milk|barista\s*milk|flavoured\s*milk|iced\s*coffee|dare\s*iced|farmers\s*union|\boak\s+(?:chocolate|strawberry|vanilla|banana|iced|milk)|up\s*(?:&|and)\s*go|(?<!coconut\s)\bmilk\s+\d+(?:\.\d+)?\s*(?:l|litre|ml)\b|yoghurts?|yogurts?|chobani|yoplait|vaalia|danone|activia|jalna|farmers\s*union\s*greek|yakult|kefir|custards?|trifle|tiramisu|cheesecake|mousse|panna\s*cotta|creme\s*fraiche|sour\s*cream|thickened\s*cream|pouring\s*cream|whipping\s*cream|double\s*cream|pure\s*cream|dollop\s*cream|cream\s*cheese|philadelphia|cottage\s*cheese|ricotta|mascarpone|cheddar|mozzarella|parmesan|pecorino|brie\b|camembert|feta\b|halloumi|haloumi|bocconcini|gouda|edam|swiss\s*cheese|tasty\s*cheese|cheese\s*(?:slices?|blocks?|shredded|grated|sticks?|snacks?|portions?)|babybel|laughing\s*cow|bega\b|coon\b|cheer\s*cheese|mainland|mersey\s*valley|maggie\s*beer|salted\s*butter|unsalted\s*butter|spreadable\s*butter|cultured\s*butter|dairy\s*butter|western\s*star|lurpak|devondale\s*(?:butter|milk|cream|cheese)|flora\s*proactiv|meadowlea|nuttelex|margarine|hummus|hommus|tzatziki|guacamole|taramasalata|\bdips?\b|yumi'?s|chris'?\s*(?:homestyle|dips?)|antipasto|chilled|from\s*the\s*fridge|pasta\s*sauce\s*fresh|free\s*range\s*eggs?|cage\s*free\s*eggs?|barn\s*laid\s*eggs?|\beggs?\s*(?:\d+\s*(?:pk|pack)|\d+g)\b)\b/i;

const PANTRY_SNACKS_PATTERN =
  /\b(chips?|crisps?|crackers?|biscuits?|cookies?|shapes\b|twisties|cheezels|doritos|pringles|kettle\b|smith'?s|thins\b|grain\s*waves|red\s*rock\s*deli|popcorn|pretzels?|corn\s*chips|rice\s*crackers?|rice\s*cakes?|muesli|granola|cereals?|weet-?bix|kellogg'?s|uncle\s*tobys|sanitarium|nutri-?grain|coco\s*pops|corn\s*flakes|special\s*k|sultana\s*bran|rolled\s*oats|quick\s*oats|porridge|pasta\b|spaghetti|penne\b|fettuccine|spirals\b|macaroni|lasagne|gnocchi|ravioli|noodles?|ramen|udon|vermicelli|mii?\s*goreng|indomie|maggi\b|nongshim|fantastic\s*noodles|rice\b|jasmine\s*rice|basmati|sunrice|ben'?s\s*original|tilda\b|quinoa|couscous|lentils?|chickpeas?|kidney\s*beans|cannellini|baked\s*beans|spaghetti\s*in\s*tomato|soup\b|soups\b|campbell'?s|heinz\b|continental\b|stock\b|broth|gravy|gravox|cooking\s*sauce|pasta\s*sauce|simmer\s*sauce|leggo'?s|dolmio|barilla|patak'?s|kan-?tong|ayam\b|passage\s*to|pesto\b|tomato\s*paste|passata|chopped\s*tomatoes|diced\s*tomatoes|crushed\s*tomatoes|peeled\s*tomatoes|ketchup|tomato\s*sauce|bbq\s*sauce|barbecue\s*sauce|soy\s*sauce|oyster\s*sauce|fish\s*sauce|hoisin|sriracha|sweet\s*chilli\s*sauce|hot\s*sauce|tabasco|worcestershire|mayonnaise|whole\s*egg\s*mayo|aioli|mustard|tartare|relish|chutney|pickles?|gherkins?|capers?|jarred\s*olives?|stuffed\s*olives?|kalamata\s*olives?|vinegar|olive\s*oil|vegetable\s*oil|canola\s*oil|sunflower\s*oil|rice\s*bran\s*oil|sesame\s*oil|coconut\s*oil|cobram|moro\b|bertolli|tuna\b|john\s*west|sirena|greenseas|safcol|sardines?|canned|tinned|\bspc\b|ardmona|goulburn\s*valley|in\s+(?:natural\s+|pear\s+|apple\s+|light\s+|heavy\s+)?(?:juice|syrup|brine|spring\s*water)|spam\b|corned\s*beef\s*\d+g|peanut\s*butter|pic'?s\b|mayver'?s|bega\s*peanut|vegemite|promite|marmite|nutella|biscoff|jam\b|conserve|marmalade|capilano|manuka\s*honey|pure\s*honey|raw\s*honey|maple\s*syrup|golden\s*syrup|sugar\b|caster\s*sugar|brown\s*sugar|icing\s*sugar|sweetener|stevia|flour\b|self\s*raising|plain\s*flour|baking\s*(?:powder|soda|chocolate|chips|melts)|bicarb|yeast\b|vanilla\s*(?:extract|essence|paste)|cocoa\s*powder|bread\s*crumbs?|breadcrumbs?|panko|stuffing|jelly\s*crystals|aeroplane\s*jelly|desiccated\s*coconut|cake\s*mix|brownie\s*mix|pancake\s*mix|cookie\s*(?:kit|decorating|house)|gingerbread\s*(?:kit|house|train|tree)|seasoning|spices?|peppercorns?|sea\s*salt|table\s*salt|pink\s*salt|masterfoods|mingle\b|hoyts|taco\s*(?:kit|shells|seasoning)|old\s*el\s*paso|mission\s*(?:corn\s*chips|taco)|chocolate|cadbury|lindt|toblerone|ferrero|raffaello|guylian|darrell\s*lea|kinder\b|haribo|allen'?s|trolli|life\s*savers|lollies|sweets\b|confectionery|almonds?|cashews?|walnuts?|macadamias?|pistachios?|peanuts?|mixed\s*nuts|trail\s*mix|dried\s*(?:apricots?|mango|cranberries|fruit)|sultanas?|raisins?|prunes?|dates?\b|jerky|biltong|snacks?)\b/i;

const MEAT_SEAFOOD_PATTERN =
  /\b(beef\b|chicken\b|pork\b|lamb\b|veal\b|duck\b|turkey\b|kangaroo\b|venison|mince\b|steaks?|sausages?|snags\b|bacon\b|shortcut\s*bacon|streaky\s*bacon|ham\b|leg\s*ham|virginia\s*ham|salami|prosciutto|pancetta|chorizo|pepperoni|pastrami|silverside|corned\s*silverside|roast\s*(?:beef|pork|lamb|chicken|turkey)|schnitzels?|meatballs?|rissoles?|burgers?\s*(?:patties)?|chops?\b|cutlets?|lamb\s*shanks?|ribs?\b|brisket|sirloin|scotch\s*fillet|rump\b|eye\s*fillet|porterhouse|t-?bone|chicken\s*(?:breast|thighs?|wings?|drumsticks?|maryland|tenderloins?|nibbles|skewers?|kebabs?)|pork\s*(?:belly|loin|crackling|shoulder)|frankfurts?|kransky|kabana|devon\b|twiggy|deli\s*meat|from\s*the\s*meat\s*dept|salmon\b|tasmanian\s*salmon|smoked\s*salmon|prawns?|tiger\s*prawns?|banana\s*prawns?|barramundi|trout\b|hoki\b|whiting|flathead|snapper|cod\b|fish\s*(?:fillets?|portions?)|seafood|calamari|squid\b|mussels?|oysters?|scallops?|marinara)\b/i;

const NON_PRODUCE_TECH_GUARD =
  /\b(usb(?:-?c)?|lightning|charge\s*cable|charging|charger|power\s*bank|airpods?|airtags?|iphone|ipad|macbook|apple\s*watch|earbuds?|headphones?|bluetooth|hdmi|screen\s*protector|phone\s*case|raspberry\s*pi|sim\s*card|gift\s*card)\b/i;

const FRUIT_VEG_PATTERN =
  /\b(apples?|pink\s*lady|granny\s*smith|royal\s*gala|honeycrisp|bananas?|avocados?|hass\s*avocado|berr(?:y|ies)|strawberr(?:y|ies)|blueberr(?:y|ies)|raspberr(?:y|ies)|blackberr(?:y|ies)|cherr(?:y|ies)|mangoe?s?|calypso\s*mango|kensington\s*pride|tomato(?:es)?|truss\s*tomatoes|cherry\s*tomatoes|roma\s*tomatoes|potato(?:es)?|washed\s*potatoes|brushed\s*potatoes|sweet\s*potato(?:es)?|kumara|onions?|brown\s*onions?|red\s*onions?|spring\s*onions?|shallots?|eschallots?|garlic\s*bulbs?|fresh\s*ginger|salads?|salad\s*(?:mix|leaf|leaves|kit|bowl)|coleslaw|lettuce|iceberg|cos\s*lettuce|spinach|baby\s*spinach|rocket\b|kale\b|carrots?|broccoli|broccolini|cauliflower|cabbage|celery|asparagus|green\s*beans|snow\s*peas|sugar\s*snap|capsicums?|cucumbers?|leb(?:anese)?\s*cucumbers?|zucchinis?|eggplants?|mushrooms?|cup\s*mushrooms?|sliced\s*mushrooms?|portobello|shiitake|pumpkin|butternut|jap\s*pumpkin|beetroot|sweet\s*corn|corn\s*cobs?|pak\s*choy|bok\s*choy|wombok|fresh\s*herbs?|coriander|parsley|basil\b|grapes?|seedless\s*grapes?|melons?|watermelon|rockmelon|honeydew|oranges?|navel\s*oranges?|mandarins?|imperial\s*mandarins?|afourer|lemons?|limes?|grapefruits?|peach(?:es)?|nectarines?|plums?\b|apricots?|pears?\b|packham|corella\s*pears?|kiwifruits?|passionfruits?|pineapples?|papayas?|paw\s*paw|pomegranates?|figs?\b|persimmons?|lychees?|fresh\s*fruit|fresh\s*vegetables?|fresh\s*produce|roast\s*mixed\s*vegetables)\b/i;

// ---------------------------------------------------------------------------
// Authoritative Retailer Department / Breadcrumb Mapper
// ---------------------------------------------------------------------------

function resolveRetailerCategoryHint(
  rawCategory: string,
  title: string
): string | null {
  if (!rawCategory || !rawCategory.trim()) return null;

  const cleaned = rawCategory
    .replace(/[\[\]"']/g, ' ')
    .replace(
      /\b(food\s*(?:&|and)\s*beverages?|groceries|grocery|aldi\s*range\s*(?:&|and)\s*specials|super\s*savers?|low\s*price\s*special|everyday\s*range)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return null;

  if (
    /\b(household(?:\s*cleaning)?|cleaning\s*(?:&|and)?\s*maintenance|cleaning\s*(?:&|and)\s*household|laundry|dishwashing|papergoods|paper\s*goods|wraps?\s*(?:&|and)\s*bags|toilet\s*paper|pest\s*control|air\s*care|pet\s*care|pets?\b|cat\s*(?:&|and)\s*dog)\b/i.test(
      cleaned
    )
  ) {
    return 'Household & Pet';
  }

  if (
    /\b(health\s*(?:&|and)?\s*(?:wellbeing|wellness|beauty|care)|vitamins?|supplements?|medicinal|pharmacy|medicines?|pain\s*relief|first\s*aid|personal\s*care|toiletries|beauty|skincare|skin\s*care|hair\s*care|oral\s*care|cosmetics?|deodorants?|feminine\s*care|continence|mens?\s*grooming|shaving|sun\s*care|baby)\b/i.test(
      cleaned
    )
  ) {
    return 'Health & Beauty';
  }

  if (
    /\b(home\s*(?:&|and)\s*(?:outdoor|lifestyle|garden)|homewares?|kitchenware|cookware|appliances?|electronics?|electrical|stationery|toys?\s*(?:&|and)?\s*games|apparel|clothing|footwear|bedding|manchester|hardware|automotive|camping|outdoor\s*living|party\s*(?:&|and)?\s*gift|gift\s*wrap)\b/i.test(
      cleaned
    )
  ) {
    return 'Special Buys';
  }

  if (/\b(frozen(?:\s*food)?|freezer|ice\s*cream)\b/i.test(cleaned)) {
    return 'Freezer';
  }

  if (
    /\b(drinks?|beverages?|soft\s*drinks?|cordials?|sports?\s*(?:&|and)?\s*energy|tea\s*(?:&|and)\s*coffee|beer|wine|spirits?|liquor|alcohol|cider|premix)\b/i.test(
      cleaned
    )
  ) {
    return 'Drinks';
  }

  if (/\bdesserts?\b/i.test(cleaned)) {
    if (FREEZER_PATTERN.test(title)) return 'Freezer';
    if (
      /\b(trifle|tiramisu|cheesecake|mousse|custard|panna\s*cotta|creme\s*caramel|profiteroles?|from\s*the\s*fridge|chilled)\b/i.test(
        title
      )
    ) {
      return 'Fridge & Dairy';
    }
    if (
      /\b(puddings?|pavlovas?|cakes?|tarts?|pies?|meringues?|sponge|brownies?)\b/i.test(
        title
      )
    ) {
      return 'Bakery';
    }
    return 'Pantry & Snacks';
  }

  if (
    /\b(bakery|breads?\s*(?:&|and)\s*rolls?|speciality\s*breads?|muffins?,?\s*cakes?|in-?store\s*bakery|pastries)\b/i.test(
      cleaned
    )
  ) {
    return 'Bakery';
  }

  if (/\b(antipasto|dips?)\b/i.test(cleaned)) {
    return 'Fridge & Dairy';
  }
  if (
    /\b(deli\s*(?:&|and)\s*chilled(?:\s*meats?)?|chilled\s*meals?)\b/i.test(
      cleaned
    )
  ) {
    if (
      MEAT_SEAFOOD_PATTERN.test(title) &&
      !/\b(dip|dips|brie|camembert|cheddar|feta|olives?|hummus|hommus)\b/i.test(
        title
      )
    ) {
      return 'Meat & Seafood';
    }
    return 'Fridge & Dairy';
  }
  if (/\b(meat|poultry|seafood|butcher|fishmonger)\b/i.test(cleaned)) {
    return 'Meat & Seafood';
  }

  if (
    /\b(fruits?\s*(?:&|and)\s*veg(?:etables?)?|fresh\s*produce|produce|fresh\s*fruits?|fresh\s*vegetables?|salads?\s*(?:&|and)\s*herbs?)\b/i.test(
      cleaned
    )
  ) {
    return 'Fruit & Veg';
  }

  if (/\b(dairy|eggs?|milk,?\s*cheese|fridge)\b/i.test(cleaned)) {
    return 'Fridge & Dairy';
  }

  if (
    /\b(pantry|confectionery|biscuits?(?:\s*(?:&|and)\s*(?:snacks?|cookies?))?|snacks?\s*(?:&|and)\s*confectionery|breakfast(?:\s*foods?)?|cereals?|canned(?:\s*(?:&|and)\s*packet\s*food|\s*food)?|cooking\s*seasoning|condiments?|sauces?|oils?\s*(?:&|and)\s*vinegars?|pasta,?\s*rice|jams?\s*(?:&|and)\s*spreads?|spreads?|baking|dried\s*fruits?,?\s*nuts?|world\s*foods?|international\s*foods?)\b/i.test(
      cleaned
    )
  ) {
    if (HOUSEHOLD_PET_PATTERN.test(title)) return 'Household & Pet';
    if (HEALTH_BEAUTY_CORE_PATTERN.test(title)) return 'Health & Beauty';
    return 'Pantry & Snacks';
  }

  return null;
}

export function classifyCategory(
  rawCategory = '',
  title = '',
  store = ''
): string {
  const cleanTitle = decodeHtmlEntities(title);
  const cleanRaw = decodeHtmlEntities(rawCategory);
  const isSpecialBuysCollection = /\bspecial\s*buys?\b/i.test(cleanRaw);

  const fromHint = resolveRetailerCategoryHint(cleanRaw, cleanTitle);
  if (fromHint) {
    return fromHint;
  }

  if (HOUSEHOLD_PET_PATTERN.test(cleanTitle)) {
    return 'Household & Pet';
  }

  if (
    HEALTH_BEAUTY_CORE_PATTERN.test(cleanTitle) ||
    (CAPSULE_TABLET_DOSE_PATTERN.test(cleanTitle) &&
      !COFFEE_CAPSULE_GUARD.test(cleanTitle))
  ) {
    return 'Health & Beauty';
  }

  if (SPECIAL_BUYS_GM_PATTERN.test(cleanTitle)) {
    return 'Special Buys';
  }

  if (FREEZER_PATTERN.test(cleanTitle)) {
    return 'Freezer';
  }

  if (
    DRINKS_PATTERN.test(cleanTitle) &&
    !CANNED_LIQUID_GUARD.test(cleanTitle) &&
    !VINEGAR_COOKING_GUARD.test(cleanTitle)
  ) {
    return 'Drinks';
  }

  if (
    BAKERY_PATTERN.test(cleanTitle) &&
    !BAKERY_NON_BREAD_GUARD.test(cleanTitle)
  ) {
    return 'Bakery';
  }

  if (
    SNACK_BISCUIT_CONFECTIONERY_GUARD.test(cleanTitle) &&
    !CHILLED_DAIRY_OVERRIDE_GUARD.test(cleanTitle)
  ) {
    return 'Pantry & Snacks';
  }

  if (FRIDGE_DAIRY_PATTERN.test(cleanTitle)) {
    return 'Fridge & Dairy';
  }

  if (PANTRY_SNACKS_PATTERN.test(cleanTitle)) {
    return 'Pantry & Snacks';
  }

  if (MEAT_SEAFOOD_PATTERN.test(cleanTitle)) {
    return 'Meat & Seafood';
  }

  if (
    FRUIT_VEG_PATTERN.test(cleanTitle) &&
    !NON_PRODUCE_TECH_GUARD.test(cleanTitle)
  ) {
    return 'Fruit & Veg';
  }

  if (
    isSpecialBuysCollection ||
    (store === 'aldi' && /\bspecial\b/i.test(`${cleanRaw} ${cleanTitle}`))
  ) {
    return 'Special Buys';
  }
  if (/\bhealth\s*foods?\b/i.test(cleanRaw)) {
    return 'Pantry & Snacks';
  }
  return 'Other';
}

/**
 * Granular product-type / subcategory classifier within the item's resolved aisle.
 */
export function classifySubCategory(
  rawCategory = '',
  title = '',
  resolvedCategory?: string
): string {
  const t = decodeHtmlEntities(title);
  const r = decodeHtmlEntities(rawCategory);
  const cat = resolvedCategory || classifyCategory(r, t);

  switch (cat) {
    case 'Fruit & Veg': {
      if (
        /\b(salads?|coleslaw|lettuce|iceberg|\bcos\b|spinach|rocket\b|kale\b|fresh\s*herbs?|coriander|parsley|basil\b|mint\b|dill\b|chives?|thyme|rosemary|wombok|pak\s*choy|bok\s*choy)\b/i.test(
          t
        )
      ) {
        return 'Salad & Herbs';
      }
      // Check tomatoes & cucumbers BEFORE fruit so "Cherry Tomatoes" / "Grape Tomatoes" / "Apple Cucumber" stay in Vegetables!
      if (
        /\b(tomato(?:es)?|potato(?:es)?|kumara|onions?|shallots?|eschallots?|garlic|ginger|carrots?|broccoli|broccolini|cauliflower|cabbage|celery|asparagus|beans?\b|peas?\b|snow\s*peas|sugar\s*snap|capsicums?|cucumbers?|zucchinis?|eggplants?|mushrooms?|portobello|shiitake|pumpkins?|butternut|beetroots?|corn\b|avocados?|leeks?|fennel|radish|parsnips?|swede|turnips?|chillies|chilli\b|vegetables?|veggies|roast\s*mixed)\b/i.test(
          t
        )
      ) {
        return 'Vegetables';
      }
      if (
        /\b(apples?|pink\s*lady|granny\s*smith|royal\s*gala|kanzi|jazz\s*apple|bananas?|berr(?:y|ies)|strawberr(?:y|ies)|blueberr(?:y|ies)|raspberr(?:y|ies)|blackberr(?:y|ies)|cherr(?:y|ies)|mangoe?s?|calypso|kensington\s*pride|grapes?|melons?|watermelon|rockmelon|honeydew|oranges?|navel|mandarins?|afourer|lemons?|limes?|grapefruits?|citrus|peach(?:es)?|nectarines?|plums?\b|apricots?|pears?\b|packham|corella|kiwifruits?|kiwi\b|passionfruits?|pineapples?|papayas?|paw\s*paw|pomegranates?|figs?\b|persimmons?|lychees?|stone\s*fruit|fruits?)\b/i.test(
          t
        )
      ) {
        return 'Fruit';
      }
      return /\bfruit\b/i.test(r) && !/\bveg/i.test(r) ? 'Fruit' : 'Vegetables';
    }

    case 'Meat & Seafood': {
      if (
        /\b(salmon|prawns?|barramundi|trout\b|hoki\b|whiting|flathead|snapper|cod\b|fish\b|seafood|calamari|squid\b|mussels?|oysters?|scallops?|marinara|tuna\s*(?:steaks?|loins?|fillets?)|crab\b|lobster|basa\b|dory\b|kingfish|swordfish|octopus)\b/i.test(
          t
        ) ||
        (/\b(seafood|fishmonger)\b/i.test(r) &&
          !/\b(meat|poultry|beef|lamb|pork|chicken|deli)\b/i.test(r))
      ) {
        return 'Seafood';
      }
      if (
        /\b(sausages?|snags\b|bacon\b|ham\b|salami|prosciutto|pancetta|chorizo|pepperoni|pastrami|frankfurts?|kransky|kabana|devon\b|twiggy|mortadella|strasburg|deli\s*meat|shaved\s*(?:ham|turkey|chicken|beef)|sliced\s*(?:ham|beef|turkey|chicken\s*breast)|meatballs?|rissoles?|burger\s*patties|beef\s*burgers?)\b/i.test(
          t
        )
      ) {
        return 'Bacon, Sausages & Deli';
      }
      if (
        /\b(chicken|turkey|duck\b|poultry|quail|spatchcock)\b/i.test(t) ||
        (/\bpoultry\b/i.test(r) &&
          !/\b(meat|seafood|beef|lamb|pork)\b/i.test(r))
      ) {
        return 'Chicken & Poultry';
      }
      return 'Beef, Lamb & Pork';
    }

    case 'Pantry & Snacks': {
      // 1. Spreads & Baking (explicit baking mixes/melts first, then spreads/sweeteners guarded against flavoured snacks/sauces)
      if (
        /\b(baking\s*(?:powder|soda|chocolate|chips|melts|cocoa)|choc\s*(?:melts|bits)|cake\s*mix|muffin\s*mix|brownie\s*mix|pancake\s*mix|cookie\s*mix|biscuit\s*mix|frosting|icing\s*(?:sugar|mix)|jelly\s*crystals|aeroplane\s*jelly|bread\s*crumbs?|breadcrumbs?|panko)\b/i.test(
          t
        )
      ) {
        return 'Spreads & Baking';
      }

      if (
        /\b(peanut\s*butter|almond\s*butter|cashew\s*butter|cookie\s*butter|biscoff\s*spread|nutella|hazelnut\s*spread|vegemite|promite|marmite|jam\b|conserve|marmalade|honey\b|capilano|maple\s*syrup|golden\s*syrup|flour\b|sugar\b|caster\s*sugar|brown\s*sugar|sweetener|stevia|bicarb|yeast\b|vanilla\s*(?:extract|essence|paste)|cocoa\s*powder|icing\b|desiccated\s*coconut)\b/i.test(
          t
        ) &&
        !/\b(potato\s*chips?|corn\s*chips?|tortilla\s*chips?|kettle\s*chips?|\bchips?\b|\bcrisps?\b|pringles|doritos|smith'?s|red\s*rock\s*deli|\bthins\b|twisties|cheezels|burger\s*rings|grain\s*waves|cc'?s\b|cheetos|popcorn|cobs\b|pretzels?|parker'?s|crackers?|shapes\b|vita-?weat|cruskits?|sakata|peckish|rice\s*(?:crackers?|cakes?|wheels)|corn\s*thins|muesli\s*bars?|nut\s*bars?|granola\s*bars?|oat\s*bars?|snack\s*bars?|protein\s*bars?|cereal\s*bars?|lcm'?s?\b|biscuits?|cookies?|tim\s*tam|oreo|belvita|shortbread|anzac|wafers?|cereals?|weet-?bix|kellogg'?s|nutri-?grain|corn\s*flakes|rolled\s*oats|porridge|granola|muesli|roasted\s*nuts|mixed\s*nuts|macadamias?|almonds?|cashews?|peanuts?(?!\s*butter)|lollies|lollipops?|gumm(?:y|ies)|jellies|marshmallows?|toffees?|chewing\s*gum|mints?|chocolate\s*(?:block|bar|sharepack|balls|bullets|coated)|cadbury|lindt|maltesers|snickers|mars\b|kit\s*kat|kitkat|reese'?s|cups?\b|marinade|stir\s*fry|soy\s*sauce|simmer\s*sauce|pasta\s*sauce|mustard|dressing|baked\s*beans)\b/i.test(
          t
        )
      ) {
        return 'Spreads & Baking';
      }

      // 2. Cereal & Breakfast (excluding snack/muesli bars)
      if (
        /\b(cereals?|weet-?bix|kellogg'?s|nutri-?grain|coco\s*pops|corn\s*flakes|special\s*k|sultana\s*bran|all-?bran|froot\s*loops|rice\s*bubbles|cheerios|rolled\s*oats|quick\s*oats|porridge|granola|muesli|breakfast\s*biscuits?)\b/i.test(
          t
        ) &&
        !/\b(muesli\s*bars?|nut\s*bars?|granola\s*bars?|oat\s*bars?|lcm'?s?|snack\s*bars?|protein\s*bars?|cereal\s*bars?)\b/i.test(
          t
        )
      ) {
        return 'Cereal & Breakfast';
      }

      // 3. Crackers, Muesli/Snack Bars, Nuts & Dried Fruit (checked before Chocolate & Chips so Choc Chip Muesli Bars & Shapes land here)
      if (
        /\b(muesli\s*bars?|nut\s*bars?|granola\s*bars?|oat\s*bars?|snack\s*bars?|protein\s*bars?|cereal\s*bars?|fruit\s*(?:bars?|straps?|sticks?|roll-?ups)|roll-?ups|lcm'?s?\b|k-?time|nature\s*valley|nice\s*(?:&|and)\s*natural|tasti\b|shapes\b|crackers?|vita-?weat|cruskits?|salada|savoy\b|jatz\b|clix\b|ritz\b|sakata|peckish|fantastic\s*delites|rice\s*(?:crackers?|cakes?|wheels)|corn\s*thins|water\s*crackers?|wafer\s*crackers?|lavosh|grissini|breadsticks?|almonds?|cashews?|walnuts?|macadamias?|pistachios?|peanuts?|pecans?|hazelnuts?|mixed\s*nuts|roasted\s*nuts|salted\s*nuts|trail\s*mix|scroggin|dried\s*(?:apricots?|mango|cranberries|fruit|apple|figs?)|sultanas?|raisins?|prunes?|pitted\s*dates|medjool\s*dates|jerky|biltong|pork\s*crackl(?:e|ing)|seaweed\s*snacks?|chickpea\s*snacks?|fava\s*beans?|veggie\s*straws?)\b/i.test(
          t
        )
      ) {
        return 'Crackers, Bars & Nuts';
      }

      // 4. Biscuits & Cookies (checked before Chocolate so Tim Tams & Oreos stay in Biscuits)
      if (
        /\b(biscuits?|cookies?|tim\s*tam|oreo|belvita|shortbread|anzac|monte\s*carlo|kingston\b|scotch\s*finger|milk\s*arrowroot|malt-?o-?milk|tiny\s*teddy|wagon\s*wheels?|iced\s*vo\s*vo|mint\s*slice|gaiety|venetian|delta\s*cream|ginger\s*nut|gingerbread|florentines?|macarons?|stroopwafels?|wafer\s*(?:sticks?|rolls?|fingers?)|loacker)\b/i.test(
          t
        )
      ) {
        return 'Biscuits & Cookies';
      }

      // 5. Chips, Crisps, Popcorn & Pretzels
      if (
        /\b(potato\s*chips?|corn\s*chips?|tortilla\s*chips?|kettle\s*chips?|\bchips?\b|\bcrisps?\b|pringles|doritos|smith'?s|red\s*rock\s*deli|\bthins\b|twisties|cheezels|burger\s*rings|grain\s*waves|cc'?s\b|cheetos|monster\s*munch|jumpy'?s|popcorn|cobs\b|act\s*ii|pretzels?|parker'?s)\b/i.test(
          t
        ) &&
        !/\b(chocolate|choc\b|baking)\b/i.test(t)
      ) {
        return 'Chips & Crisps';
      }

      // 6. Lollies, Gummies, Marshmallows, Liquorice, Mints & Gum
      if (
        /\b(lollies|lollipops?|chupa\s*chups|gumm(?:y|ies)|jell(?:y|ies)\s*(?:beans?|babies|snakes?|lollies|sweets)?|snakes?\s*alive|party\s*mix|retro\s*party|allen'?s|natural\s*confectionery|trolli|haribo|sour\s*patch|sour\s*straps?|warheads|nerds\b|zappo|skittles|starburst|fruchews|fruit\s*tingles|sherbet|wizz\s*fizz|marshmallows?|pascall|licorice|liquorice|mentos|tic\s*tac|eclipse\s*(?:mints?|chewy)|extra\s*(?:gum|chewing|peppermint|spearmint)|wrigley'?s|hubba\s*bubba|juicy\s*fruit|chewing\s*gum|bubble\s*gum|life\s*savers|butter-?menthol|soothers|fisherman'?s\s*friend|werther'?s|toffees?|sweets\b|candy|candies)\b/i.test(
          t
        ) &&
        !/\b(chocolate\s*(?:block|bar|sharepack|coated|bullets|balls)|milk\s*chocolate|dark\s*chocolate|white\s*chocolate)\b/i.test(
          t
        )
      ) {
        return 'Lollies';
      }

      // 7. Chocolate Blocks, Bars, Sharepacks & Boxes
      if (
        /\b(chocolate|choc\b|cadbury|dairy\s*milk|milk\s*tray|roses\b|favourites\b|milkybar|lindt|lindor|excellence\s*\d+%|toblerone|ferrero|rocher|raffaello|guylian|darrell\s*lea|whittaker'?s|haigh'?s|kinder\b|bueno\b|mars\b|snickers|twix\b|kit\s*kat|kitkat|maltesers|m&m'?s?|pods\b|bounty\b|smarties|aero\b|violet\s*crumble|cherry\s*ripe|crunchie|freddo|caramello|picnic\b|boost\b|turkish\s*delight|curly\s*wurly|chomp\b|flake\b|twirl\b|terry'?s|after\s*eight|quality\s*street|celebrations\b|easter\s*(?:egg|bunny)|advent\s*calendar)\b/i.test(
          t
        )
      ) {
        return 'Chocolate';
      }

      // 8. Pasta, Rice, Noodles & Grains
      if (
        /\b(pasta\b|spaghetti(?!\s*in\s*tomato)|penne\b|fettuccine|linguine|rigatoni|spirals\b|fusilli|macaroni|lasagne|gnocchi|ravioli|tortellini|san\s*remo|vetta\b|noodles?|ramen|udon|soba|vermicelli|hokkien|mii?\s*goreng|indomie|maggi\s*(?:2\s*min|noodles?)|nongshim|shin\s*ramyun|fantastic\s*noodles|suimin|cup\s*noodles|rice\b|jasmine\s*rice|basmati|arborio|sushi\s*rice|brown\s*rice|sunrice|ben'?s\s*original|tilda\b|quinoa|couscous|polenta|bulgur|barley)\b/i.test(
          t
        ) &&
        !/\b(pasta\s*sauce|bake\s*sauce|simmer\s*sauce)\b/i.test(t)
      ) {
        return 'Pasta, Rice & Noodles';
      }

      if (/\b(snacks?|snack\s*foods?)\b/i.test(`${t} ${r}`)) {
        return 'Crackers, Bars & Nuts';
      }
      return 'Canned, Sauces & Oil';
    }

    case 'Fridge & Dairy': {
      if (
        /\b(cheese|cheddar|mozzarella|parmesan|pecorino|brie\b|camembert|feta\b|halloumi|haloumi|bocconcini|gouda|edam|jarlsberg|gruyere|ricotta|mascarpone|philadelphia|babybel|laughing\s*cow|bega\s*(?:stringers|tasty|farmers|heritage|slices|block|grated)|cheer\b|coon\b|mainland(?!\s*butter)|mersey\s*valley|cracker\s*barrel)\b/i.test(
          t
        ) &&
        !/\bcheesecake\b/i.test(t)
      ) {
        return 'Cheese';
      }
      if (
        /\b(yoghurts?|yogurts?|chobani|yoplait|vaalia|danone|activia|jalna|farmers\s*union\s*greek|skyr|kefir|yakult|custards?|yogo\b|fruche|creme\s*caramel|panna\s*cotta|tiramisu|trifle|cheesecake|mousse)\b/i.test(
          t
        )
      ) {
        return 'Yoghurt & Custard';
      }
      if (
        /\b(butter|western\s*star|lurpak|devondale\s*(?:butter|spread)|buttersoft|pepe\s*saya|margarine|meadowlea|flora\b|nuttelex|eggs?\b|sunny\s*queen|pace\s*farm|hummus|hommus|tzatziki|guacamole|taramasalata|\bdips?\b|yumi'?s|chris'?\b|obela|antipasto|olives?\b|dolmades)\b/i.test(
          t
        )
      ) {
        return 'Butter, Eggs & Dips';
      }
      return 'Milk & Cream';
    }

    case 'Bakery': {
      if (
        /\b(wraps?\b|tortillas?|pita\b|flatbreads?|naan\b|rotis?|chapati|lavash|piadina|turkish\s*(?:bread|rolls?)|focaccia|garlic\s*bread|ciabatta|panini)\b/i.test(
          t
        )
      ) {
        return 'Wraps & Flatbread';
      }
      if (
        /\b(croissants?|pains?\s*au\s*chocolat|danish|pastries|pastry|muffins?|donuts?|doughnuts?|cakes?|mud\s*cake|sponge|lamingtons?|scones?|pikelets?|pancakes?|waffles?|scrolls?|finger\s*buns?|hot\s*cross\s*buns?|tarts?|pies?\b|meringues?|pavlovas?|brownies?|banana\s*bread|eclairs?|profiteroles?|puddings?)\b/i.test(
          t
        ) &&
        !/\benglish\s*muffins?\b/i.test(t)
      ) {
        return 'Cakes & Pastries';
      }
      return 'Bread & Rolls';
    }

    case 'Freezer': {
      if (
        /\b(ice\s*creams?|gelato|sorbet|icy\s*poles?|zooper\s*dooper|calippo|paddle\s*pops?|gaytime|maxibon|magnum\b|connoisseur|weis\b|bulla\b|peters\b|streets\b|ben\s*(?:&|and)\s*jerry|haagen-?dazs|drumstick|cornetto|splice|frosty\s*fruits|mochi\b|sara\s*lee|frozen\s*(?:cheesecake|pavlova|dessert|yoghurt))\b/i.test(
          t
        )
      ) {
        return 'Ice Cream & Desserts';
      }
      if (
        /\b(pizza|mccain\s*(?:pizza|pub\s*size|rustica|healthy\s*choice|meals?)|dr\.?\s*oetker|ristorante|fropro|lean\s*cuisine|on\s*the\s*menu|super\s*nature|core\s*powerfoods|my\s*muscle\s*chef|four'?\s*n\s*twenty|herbert\s*adams|patties|sausage\s*rolls?|party\s*pies?|meat\s*pies?|pasties|quiche|lasagne|cannelloni|mac\s*(?:&|and)\s*cheese|dumplings?|gyoza|spring\s*rolls?|dim\s*sims?|money\s*bags|bao\s*buns|burritos?)\b/i.test(
          t
        )
      ) {
        return 'Frozen Meals & Pizza';
      }
      return 'Frozen Chips, Veg & Fish';
    }

    case 'Drinks': {
      if (
        /\b(coffee|espresso|nespresso|caffitaly|dolce\s*gusto|nescafe|moccona|lavazza|vittoria|robert\s*timms|l'or\b|campos\b|grinders\b|international\s*roast|starbucks|\btea\b|tea\s*bags?|green\s*tea|black\s*tea|herbal\s*tea|earl\s*grey|english\s*breakfast|peppermint\s*tea|chamomile|chai\b|twinings|tetley|bushells|dilmah|nerada|madura|\bt2\b|milo\b|drinking\s*chocolate|hot\s*chocolate|nesquik|ovaltine)\b/i.test(
          t
        ) &&
        !/\b(iced?\s*tea|lipton\s*ice|fuze\s*tea)\b/i.test(t)
      ) {
        return 'Coffee & Tea';
      }
      if (
        /\b(spring\s*water|sparkling\s*water|mineral\s*water|still\s*water|natural\s*water|alkaline\s*water|vitamin\s*water|vitaminwater|coconut\s*water|mount\s*franklin|pump\b|frantelle|cool\s*ridge|san\s*pellegrino|perrier|evian\b|fiji\b|voss\b|soda\s*water|tonic\s*water|sports?\s*drinks?|energy\s*drinks?|gatorade|powerade|maximus\b|prime\b|red\s*bull|monster\s*energy|\bv\s+(?:energy|guarana|blue|sugarfree)\b|mother\s*energy|rockstar|celsius\b|musashi\s*energy|kombucha|remedy\b)\b/i.test(
          t
        )
      ) {
        return 'Water & Sports';
      }
      if (
        /\b(juice|nudie\b|daily\s*juice|golden\s*circle|berri\b|mildura|ocean\s*spray|v8\b|prima\b|pop\s*tops?|fruit\s*drink|sunnyboy|cordials?|cottee'?s|bickford'?s|ribena|iced?\s*tea|lipton\s*ice|fuze\s*tea)\b/i.test(
          t
        )
      ) {
        return 'Juice & Cordial';
      }
      return 'Soft Drinks';
    }

    case 'Health & Beauty': {
      if (
        /\b(napp(?:y|ies)|huggies|rascals\b|babylove|baby\s*(?:wipes?|bath|shampoo|lotion|oil|powder|wash|cream)|waterwipes|curash|sudocrem|bepanthen|infant\s*formula|toddler\s*milk|aptamil|karicare|s-?26|bellamy'?s)\b/i.test(
          t
        ) ||
        (/\bbaby\b/i.test(r) &&
          !/\b(health|beauty|personal\s*care|toiletries)\b/i.test(r))
      ) {
        return 'Baby Care';
      }
      if (
        /\b(vitamins?|multivitamins?|multi-?vitamins?|vita\s*gumm(?:y|ies)|supplements?|capsules?|tablets?|caplets?|softgels?|lozenges?|effervescent|fish\s*oil|krill\s*oil|omega|glucosamine|magnesium|melatonin|ashwagandha|collagen|coq10|folic\s*acid|caltrate|centrum|swisse|blackmores|cenovis|ostelin|voost|berocca|elevit|bioglan|ethical\s*nutrients|natures?\s*way|natures?\s*own|healthy\s*care|life-?space|life\s*botanics|jshealth|musashi|bsc\b|body\s*science|whey\s*protein|protein\s*(?:powder|isolate)|creatine|pre-?workout|electrolyte|liquid\s*i\.?v\.?|hydralyte|gastrolyte|metamucil|benefiber|probiotic|panadol|nurofen|paracetamol|ibuprofen|aspirin|disprin|voltaren|deep\s*heat|metsal|zyrtec|telfast|claratyne|codral|sudafed|lemsup|strepsils|difflam|betadine|vicks|bisolvon|duro-?tuss|gaviscon|mylanta|quick-?eze|nexium|somac|rennie|imodium|coloxyl|movicol|canesten|savlon|band-?aids?|elastoplast|antiseptic|first\s*aid|eye\s*drops?|ear\s*drops?|nasal\s*spray|otrivin|fess\b|throat)\b/i.test(
          t
        ) ||
        (/\b(vitamins?|medicinal|pharmacy|medicines?|supplements?)\b/i.test(r) &&
          !/\b(beauty|personal\s*care|toiletries|skincare|hair\s*care|oral\s*care)\b/i.test(
            r
          ))
      ) {
        return 'Vitamins & Pharmacy';
      }
      return 'Personal Care & Beauty';
    }

    case 'Household & Pet': {
      if (
        /\b(cat\s*food|dog\s*food|kitten|puppy|pet\s*(?:food|treats?|milk|litter|care)|cat\s*litter|kitty\s*litter|dentalife|schmackos|pedigree|whiskas|felix\b|optimum\b|dine\b|fancy\s*feast|purina|supercoat|vip\s*petfoods?|my\s*dog\b|cesar\b|fussy\s*cat|applaws|bird\s*seed)\b/i.test(
          t
        ) ||
        (/\b(pet|cat\s*(?:&|and)\s*dog|pets)\b/i.test(r) &&
          !/\b(household|cleaning|laundry|paper)\b/i.test(r))
      ) {
        return 'Pet Food & Care';
      }
      if (
        /\b(toilet\s*(?:paper|tissues?|rolls?)|quilton|kleenex|sorbent|who\s*gives\s*a\s*crap|paper\s*towels?|kitchen\s*towels?|viva\b|handee|facial\s*tissues?|serviettes?|napkins?|bin\s*liners?|garbage\s*bags?|rubbish\s*bags?|kitchen\s*tidy|glad\b|multix|hercules|cling\s*wrap|aluminium\s*foil|aluminum\s*foil|alfoil|baking\s*paper|parchment\s*paper|freezer\s*bags?|sandwich\s*bags?|ziploc|snap\s*lock|batteries|energizer|duracell|eveready|firelighters?)\b/i.test(
          t
        ) ||
        /\b(papergoods|paper\s*goods|wraps?\s*(?:&|and)\s*bags|toilet\s*paper)\b/i.test(
          r
        )
      ) {
        return 'Paper, Wraps & Bags';
      }
      return 'Cleaning & Laundry';
    }

    case 'Special Buys': {
      if (
        /\b(cookware|frypan|frying\s*pan|saucepan|cast\s*iron|baking\s*tray|roasting\s*pan|oven\s*mitt|tea\s*towels?|containers?|tumbler|\bmugs?\b|dinner\s*set|cutlery|air\s*fryer|kettle|toaster|microwave|coffee\s*machine|mixer|slow\s*cooker|rice\s*cooker|vacuum|steam\s*mop|ironing|clothes\s*airer|bedding|quilt|doona|pillows?|sheet\s*set|mattress|towels?|rug|cushions?|curtains?|furniture|bookshelf|chair|crofton|ambiano|kirkton\s*house|easy\s*home|sohl)\b/i.test(
          t
        )
      ) {
        return 'Kitchen & Home';
      }
      return 'Outdoor, Tools & Seasonal';
    }

    default:
      return 'Other';
  }
}

export function matchesSubCategory(
  item: Pick<SpecialItem, 'category' | 'subCategory' | 'title'>,
  subCategoryFilter: string | null | undefined
): boolean {
  if (
    !subCategoryFilter ||
    subCategoryFilter === 'All' ||
    subCategoryFilter === 'all'
  ) {
    return true;
  }
  const itemSub =
    item.subCategory || classifySubCategory('', item.title, item.category);
  const def = getSubCategoryDef(subCategoryFilter);
  if (def) {
    if (item.category !== def.parentCategory) return false;
    return def.leafSubCategories.some(
      (leaf) => leaf.toLowerCase() === itemSub.toLowerCase()
    );
  }
  return itemSub.toLowerCase() === subCategoryFilter.toLowerCase();
}

export function extractSaleFinderUrlHint(hrefOrUrl = ''): string {
  if (!hrefOrUrl) return '';
  const pathOnly = hrefOrUrl.replace(/^https?:\/\/[^/]+/i, '');
  const parts = pathOnly.split('/').filter(Boolean);
  if (parts.length >= 4 && /^\d+$/.test(parts[0])) {
    return parts.slice(1, -2).join(' ').replace(/-/g, ' ');
  }
  return '';
}

export function reclassifySpecialItems(items: SpecialItem[]): SpecialItem[] {
  if (!Array.isArray(items) || items.length === 0) return items;
  return items.map((item) => {
    const sfHint =
      item.productUrl && item.productUrl.includes('salefinder.com.au')
        ? extractSaleFinderUrlHint(item.productUrl)
        : '';
    const aldiSpecialHint =
      item.store === 'aldi' &&
      item.catalogueName &&
      /special\s*buys?/i.test(item.catalogueName)
        ? item.catalogueName
        : '';
    const rawHint = sfHint || aldiSpecialHint;
    const nextCat = classifyCategory(rawHint, item.title, item.store);
    const finalCat =
      nextCat === 'Other' &&
      item.category &&
      item.category !== 'Pantry & Snacks' &&
      CLIENT_CATEGORIES.includes(item.category)
        ? item.category
        : nextCat;
    const finalSub = classifySubCategory(rawHint, item.title, finalCat);
    if (finalCat === item.category && finalSub === item.subCategory) {
      return item;
    }
    return { ...item, category: finalCat, subCategory: finalSub };
  });
}

export function isSpecialItemOnSale(item: SpecialItem): boolean {
  return Boolean(
    item.isOnSale ??
      (item.isHalfPrice ||
        (item.saveAmount !== null && item.saveAmount > 0) ||
        (item.wasPrice !== null && item.wasPrice > item.price) ||
        item.promoText)
  );
}

export function isSpecialItemRegularPrice(item: SpecialItem): boolean {
  return !isSpecialItemOnSale(item);
}

export function isSpecialItemHalfPrice(item: SpecialItem): boolean {
  if (item.isHalfPrice) return true;
  if (item.discountPercent !== null && item.discountPercent >= 48) return true;
  if (item.wasPrice !== null && item.wasPrice > item.price && item.wasPrice > 0) {
    return (item.wasPrice - item.price) / item.wasPrice >= 0.48;
  }
  return false;
}

export function parseMoney(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number' && Number.isFinite(val)) {
    return Math.round(val * 100) / 100;
  }
  const str = String(val).replace(/,/g, '').trim();
  if (!str) return null;

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

export function computeSavings(input: {
  price: unknown;
  wasPrice?: unknown;
  saveAmount?: unknown;
  promoText?: string;
}) {
  const promoText = input.promoText || '';
  const finalPrice = parseMoney(input.price);
  let finalWas = parseMoney(input.wasPrice);
  let finalSave = parseMoney(input.saveAmount);

  if (finalSave === null && promoText) {
    const m = promoText.match(/save\s*\$\s*(\d+(?:\.\d{1,2})?)/i);
    if (m) finalSave = parseFloat(m[1]);
  }

  if (finalWas === null && promoText) {
    const m = promoText.match(/was\s*\$\s*(\d+(?:\.\d{1,2})?)/i);
    if (m) finalWas = parseFloat(m[1]);
  }

  const halfPriceMentioned = /\b(1\/2\s*price|half\s*price|50%\s*off|save\s*50%)\b/i.test(
    promoText
  );

  if (finalPrice !== null && finalSave !== null && finalWas === null) {
    finalWas = Math.round((finalPrice + finalSave) * 100) / 100;
  } else if (
    finalPrice !== null &&
    finalWas !== null &&
    finalSave === null &&
    finalWas > finalPrice
  ) {
    finalSave = Math.round((finalWas - finalPrice) * 100) / 100;
  } else if (finalPrice !== null && halfPriceMentioned && finalWas === null) {
    finalWas = Math.round(finalPrice * 2 * 100) / 100;
    finalSave = finalPrice;
  }

  let discountPercent: number | null = null;
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

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:amp;)+/gi, '&')
    .replace(/&reg;|&#174;/gi, '®')
    .replace(/&trade;|&#8482;/gi, '™')
    .replace(/&rsquo;|&lsquo;|&#0?39;|&apos;|&#8217;|&#8216;/gi, "'")
    .replace(/&ldquo;|&rdquo;|&quot;|&#8220;|&#8221;/gi, '"')
    .replace(/&eacute;|&#233;/gi, 'é')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&ndash;|&#8211;/gi, '–')
    .replace(/&mdash;|&#8212;/gi, '—')
    .replace(/&bull;|&#8226;/gi, '•')
    .replace(/&hellip;|&#8230;/gi, '…')
    .replace(/&#(\d+);/g, (_m, code) => {
      const n = parseInt(code, 10);
      return Number.isFinite(n) && n > 31 ? String.fromCodePoint(n) : ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
}
