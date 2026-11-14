export type StoreId = 'woolworths' | 'coles' | 'aldi' | 'iga' | 'amazon';

export type StoreFilter = 'all' | StoreId;

export type DealFilter = 'all' | 'regular' | 'sale' | 'half_price';

export type SortOption = 'featured' | 'discount' | 'savings' | 'price_asc';

export interface SubCategoryFilterDef {
  id: string;
  label: string;
  shortLabel: string;
  parentCategory: string;
  leafSubCategories: string[];
  searchQuery: string;
  popular?: boolean;
}

export interface SpecialItem {
  id: string;
  store: StoreId;
  storeName: 'Woolworths' | 'Coles' | 'ALDI' | 'IGA' | 'Amazon AU';
  title: string;
  brand: string | null;
  packageSize: string | null;
  barcode?: string | null;
  sku?: string | null;
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
  subCategory?: string;
  imageUrl: string | null;
  productUrl: string | null;
  catalogueName: string | null;
  validDates: string | null;
  inStock?: boolean | null;
  stockLabel?: string | null;
  localStoreName?: string | null;
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
  inStock?: boolean | null;
  stockLabel?: string | null;
  localStoreName?: string | null;
  isCurrentItem?: boolean;
}

export interface SuburbSuggestion {
  postcode: string;
  suburb: string;
  state: string;
  latitude: number;
  longitude: number;
  display: string;
}

export interface NearbyStoreOption {
  store: 'woolworths' | 'iga' | 'aldi';
  storeId: string;
  name: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  distanceKm: number | null;
  isOpen?: boolean | null;
  tradingHours?: string | null;
}

export interface NearbyStoresResponse {
  location: SuburbSuggestion;
  stores: {
    woolworths: NearbyStoreOption[];
    iga: NearbyStoreOption[];
    aldi: NearbyStoreOption[];
  };
}

export interface UserStoreLocation {
  postcode: string;
  suburb: string;
  state: string;
  latitude: number;
  longitude: number;
  woolworthsStore: NearbyStoreOption | null;
  igaStore: NearbyStoreOption | null;
  aldiStore: NearbyStoreOption | null;
}

export interface LocationSearchContext {
  postcode?: string;
  suburb?: string;
  state?: string;
  wwStoreId?: string;
  wwStoreName?: string;
  igaStoreId?: string;
  igaStoreName?: string;
  aldiStoreId?: string;
  aldiStoreName?: string;
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
