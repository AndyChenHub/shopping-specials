export type StoreId = 'woolworths' | 'coles' | 'aldi';

export type StoreFilter = 'all' | StoreId;

export type SortOption = 'featured' | 'discount' | 'savings' | 'price_asc';

export interface SpecialItem {
  id: string;
  store: StoreId;
  storeName: 'Woolworths' | 'Coles' | 'ALDI';
  title: string;
  brand: string | null;
  packageSize: string | null;
  price: number;
  priceText: string;
  wasPrice: number | null;
  saveAmount: number | null;
  discountPercent: number | null;
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

export interface StoreStat {
  count: number;
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
  storeStats: Record<StoreId, StoreStat>;
  catalogues: Record<StoreId, CatalogueInfo | null>;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'ready' | 'error';
}
