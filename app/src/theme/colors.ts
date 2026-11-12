import { StoreId } from '../types/specials';

export const COLORS = {
  background: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceSubtle: '#ECEEF2',
  border: '#E2E5EB',
  textPrimary: '#12151A',
  textSecondary: '#5A6270',
  textMuted: '#8891A0',

  // Primary iOS interactive accent
  accent: '#0F62FE',
  accentSoft: '#E8F0FE',

  // Iconic Aussie supermarket half-price badge palette
  halfPriceBg: '#FFCD00',
  halfPriceText: '#141414',

  // Savings green
  savingsText: '#137A36',
  savingsBg: '#E6F5EC',

  danger: '#D92D20',
};

export const STORE_THEMES: Record<
  StoreId,
  {
    name: string;
    shortName: string;
    primary: string;
    softBg: string;
    border: string;
    textOnPrimary: string;
  }
> = {
  woolworths: {
    name: 'Woolworths',
    shortName: 'Woolies',
    primary: '#178841',
    softBg: '#E8F5ED',
    border: '#B9E2C7',
    textOnPrimary: '#FFFFFF',
  },
  coles: {
    name: 'Coles',
    shortName: 'Coles',
    primary: '#E01A22',
    softBg: '#FDECEC',
    border: '#F7C2C4',
    textOnPrimary: '#FFFFFF',
  },
  aldi: {
    name: 'ALDI',
    shortName: 'ALDI',
    primary: '#003882',
    softBg: '#E9EFF9',
    border: '#BDD1F0',
    textOnPrimary: '#FFFFFF',
  },
};
