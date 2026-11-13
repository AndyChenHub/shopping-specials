import { ImageSourcePropType } from 'react-native';
import { StoreId } from '../types/specials';

export const UI_ASSETS = {
  avocados: require('../../assets/ui/avocados.jpg') as ImageSourcePropType,
  bananas: require('../../assets/ui/bananas.jpg') as ImageSourcePropType,
  bannerFresh: require('../../assets/ui/banner-fresh.jpg') as ImageSourcePropType,
  bannerPantry: require('../../assets/ui/banner-pantry.jpg') as ImageSourcePropType,
  chicken: require('../../assets/ui/chicken.jpg') as ImageSourcePropType,
  chocolate: require('../../assets/ui/chocolate.jpg') as ImageSourcePropType,
  coffee: require('../../assets/ui/coffee.jpg') as ImageSourcePropType,
  detergent: require('../../assets/ui/detergent.jpg') as ImageSourcePropType,
  icecream: require('../../assets/ui/icecream.jpg') as ImageSourcePropType,
  oliveOil: require('../../assets/ui/olive-oil.jpg') as ImageSourcePropType,
  salmon: require('../../assets/ui/salmon.jpg') as ImageSourcePropType,
  sourdough: require('../../assets/ui/sourdough.jpg') as ImageSourcePropType,
  sparkling: require('../../assets/ui/sparkling.jpg') as ImageSourcePropType,
  strawberries: require('../../assets/ui/strawberries.jpg') as ImageSourcePropType,
};

export interface CategoryTileTheme {
  id: string;
  shortLabel: string;
  image: ImageSourcePropType;
  bg: string;
  fg: string;
}

export const DISCOVER_CATEGORIES: CategoryTileTheme[] = [
  {
    id: 'Fruit & Veg',
    shortLabel: 'Fruit & veg',
    image: UI_ASSETS.avocados,
    bg: '#E4F5E9',
    fg: '#1E6B39',
  },
  {
    id: 'Meat & Seafood',
    shortLabel: 'Meat & fish',
    image: UI_ASSETS.salmon,
    bg: '#FFE9E1',
    fg: '#9A3A1E',
  },
  {
    id: 'Fridge & Dairy',
    shortLabel: 'Dairy & eggs',
    image: UI_ASSETS.chicken,
    bg: '#FFF6E0',
    fg: '#8A5A00',
  },
  {
    id: 'Bakery',
    shortLabel: 'Bakery',
    image: UI_ASSETS.sourdough,
    bg: '#FFF3D6',
    fg: '#8A5A00',
  },
  {
    id: 'Pantry & Snacks',
    shortLabel: 'Pantry & snacks',
    image: UI_ASSETS.oliveOil,
    bg: '#EEF1E2',
    fg: '#4E5A1E',
  },
  {
    id: 'Drinks',
    shortLabel: 'Drinks',
    image: UI_ASSETS.sparkling,
    bg: '#E0F6F6',
    fg: '#14706E',
  },
  {
    id: 'Freezer',
    shortLabel: 'Frozen',
    image: UI_ASSETS.icecream,
    bg: '#FFF8D9',
    fg: '#7F6A00',
  },
  {
    id: 'Household & Pet',
    shortLabel: 'Household',
    image: UI_ASSETS.detergent,
    bg: '#E6F2FD',
    fg: '#1D5E99',
  },
  {
    id: 'Health & Beauty',
    shortLabel: 'Health & care',
    image: UI_ASSETS.strawberries,
    bg: '#FFEBF0',
    fg: '#9B2449',
  },
  {
    id: 'Special Buys',
    shortLabel: 'Special buys',
    image: UI_ASSETS.chocolate,
    bg: '#EFE8FB',
    fg: '#5B3C99',
  },
];

export function getStoreHeroImage(store: StoreId): ImageSourcePropType {
  switch (store) {
    case 'woolworths':
      return UI_ASSETS.bannerFresh;
    case 'coles':
      return UI_ASSETS.bannerPantry;
    case 'aldi':
      return UI_ASSETS.sourdough;
    case 'iga':
      return UI_ASSETS.strawberries;
    case 'amazon':
      return UI_ASSETS.coffee;
    default:
      return UI_ASSETS.bannerFresh;
  }
}

export function getCategoryFallbackImage(category: string): ImageSourcePropType {
  const found = DISCOVER_CATEGORIES.find(
    (c) => c.id.toLowerCase() === category.toLowerCase()
  );
  return found ? found.image : UI_ASSETS.oliveOil;
}

/**
 * Australian supermarket weekly catalogues reset Tuesday 11:59pm (new specials Wednesday).
 */
export function getCatalogueResetInfo(): {
  endDate: Date;
  endLabel: string;
  shortDay: string;
  timeLeft: string;
} {
  const now = new Date();
  const end = new Date(now);
  const addDays = (2 - end.getDay() + 7) % 7 || 7;
  end.setDate(end.getDate() + addDays);
  end.setHours(23, 59, 0, 0);

  const endLabel = end.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const shortDay = end.toLocaleDateString('en-AU', { weekday: 'short' });

  const ms = Math.max(0, end.getTime() - now.getTime());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const timeLeft = d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;

  return { endDate: end, endLabel, shortDay, timeLeft };
}
