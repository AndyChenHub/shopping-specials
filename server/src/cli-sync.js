import { syncAllSupermarkets } from './scrapers/index.js';

console.log('Searching the web & downloading weekly specials from Woolworths, Coles, and ALDI...');
const start = Date.now();
const state = await syncAllSupermarkets({ maxPagesPerCatalogue: 15 });
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log(`\nDone in ${elapsed}s! Total specials downloaded: ${state.items.length}`);
console.log('Store breakdown:', JSON.stringify(state.storeStats, null, 2));
console.log('Sample items:');
for (const store of ['woolworths', 'coles', 'aldi']) {
  const sample = state.items.find((i) => i.store === store);
  if (sample) {
    console.log(
      `  [${sample.storeName}] ${sample.title} -> ${sample.priceText} (${sample.promoText || 'Special'}) [${sample.category}]`
    );
  }
}
