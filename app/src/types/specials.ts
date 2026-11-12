export type StoreId = 'woolworths' | 'coles' | 'aldi' | 'iga' | 'amazon';

export type StoreFilter = 'all' | StoreId;

export type DealFilter = 'all' | 'sale' | 'half_price';

export type SortOption = 'featured' | 'discount' | 'savings' | 'price_asc';

export interface SpecialItem {
  id: string;
  store: StoreId;
  storeName: 'Woolworths' | 'Coles' | 'ALDI' | 'IGA' | 'Amazon AU';
  title: string;
  brand: string | null;
  packageSize: string | null;
  barcode?: string | null;
  price: number;
  priceText: string;
  wasPrice: number | null;
  saveAmount: number | null;
  discountPercent: number | null;
  isOnSale: boolean;
  isHalfPrice: boolean;
  promoText: string | null;
  unitPrice: string | null;
  category: string;
  imageUrl: string | null;
  productUrl: string | null;
  catalogueName: string | null;
  validDates: string | null;
  fetchedAt: string;
}

export interface CompetitorQuote {
  store: StoreId;
  storeName: 'Woolworths' | 'Coles' | 'ALDI' | 'IGA' | 'Amazon AU';
  matched: boolean;
  title: string;
  packageSize: string | null;
  price: number | null;
  priceText: string | null;
  wasPrice: number | null;
  saveAmount: number | null;
  isOnSale: boolean;
  isHalfPrice: boolean;
  promoText: string | null;
  unitPrice: string | null;
  imageUrl: string | null;
  productUrl: string;
  isCurrentItem?: boolean;
}

export interface StoreStat {
  count: number;
  onSaleCount?: number;
  halfPriceCount: number;
  status: string;
  error?: string | null;
}

export interface CatalogueInfo {
  saleId?: string;
  name: string;
  validDates: string;
  coverImage?: string | null;
}

export interface SpecialsResponse {
  items: SpecialItem[];
  total: number;
  categories: string[];
  storeStats: Partial<Record<StoreId, StoreStat>>;
  catalogues: Partial<Record<StoreId, CatalogueInfo | null>>;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'ready' | 'error';
}
