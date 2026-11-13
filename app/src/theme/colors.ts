import { StoreId } from '../types/specials';

export const COLORS = {
  // Core snag design tokens
  blue: '#009DE0',
  blueDark: '#0086C3',
  blueSoft: '#E6F6FD',
  ink: '#1F2024',
  ink2: '#4A4B52',
  muted: '#7A7B82',
  faint: '#B4B5BB',
  line: '#EEEEF0',
  surfaceAlt: '#F5F5F7',
  green: '#12A16B',
  greenSoft: '#E3F7EE',
  yellow: '#FFDB3D',
  hot: '#FF3D5A',
  hotSoft: '#FFECEF',

  // Semantic aliases used across modals & components
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSubtle: '#F5F5F7',
  border: '#EEEEF0',
  textPrimary: '#1F2024',
  textSecondary: '#4A4B52',
  textMuted: '#7A7B82',

  accent: '#009DE0',
  accentSoft: '#E6F6FD',

  halfPriceBg: '#FFDB3D',
  halfPriceText: '#1F2024',

  savingsText: '#12A16B',
  savingsBg: '#E3F7EE',

  danger: '#FF3D5A',
};

export type StoreCategoryType = 'Supermarket' | 'Discount' | 'Local' | 'Online';

export const STORE_THEMES: Record<
  StoreId,
  {
    name: string;
    shortName: string;
    mono: string;
    storeType: StoreCategoryType;
    defaultHours: string;
    primary: string;
    softBg: string;
    border: string;
    textOnPrimary: string;
  }
> = {
  woolworths: {
    name: 'Woolworths',
    shortName: 'Woolies',
    mono: 'W',
    storeType: 'Supermarket',
    defaultHours: 'Open till 10pm',
    primary: '#1C8A45',
    softBg: '#E8F5ED',
    border: '#B9E2C7',
    textOnPrimary: '#FFFFFF',
  },
  coles: {
    name: 'Coles',
    shortName: 'Coles',
    mono: 'C',
    storeType: 'Supermarket',
    defaultHours: 'Open till 10pm',
    primary: '#E01A22',
    softBg: '#FDECEC',
    border: '#F7C2C4',
    textOnPrimary: '#FFFFFF',
  },
  aldi: {
    name: 'ALDI',
    shortName: 'ALDI',
    mono: 'A',
    storeType: 'Discount',
    defaultHours: 'Open till 8:30pm',
    primary: '#1B2D6B',
    softBg: '#E9EFF9',
    border: '#BDD1F0',
    textOnPrimary: '#FFFFFF',
  },
  iga: {
    name: 'IGA Local',
    shortName: 'IGA',
    mono: 'IGA',
    storeType: 'Local',
    defaultHours: 'Open till 9pm',
    primary: '#111216',
    softBg: '#F3F4F6',
    border: '#D1D5DB',
    textOnPrimary: '#FFFFFF',
  },
  amazon: {
    name: 'Amazon AU',
    shortName: 'Amazon',
    mono: 'AZ',
    storeType: 'Online',
    defaultHours: 'Fast AU Delivery',
    primary: '#232F3E',
    softBg: '#FFF7ED',
    border: '#FED7AA',
    textOnPrimary: '#FFFFFF',
  },
};
