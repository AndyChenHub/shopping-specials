/**
 * Unified category classifier & price normalizer for Australian supermarket specials
 * across Woolworths, Coles, ALDI, IGA, and Amazon AU.
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

const HOUSEHOLD_PET_PATTERN =
  /\b(laundry|fabric\s*(?:softener|conditioner)|stain\s*remover|napisan|vanish|biozet|omo\b|cold\s*power|radiant\b|earth\s*choice|cuddly|fluffy\b|detergent|dishwashing|dishwasher|rinse\s*aid|finish\b|fairy\b|morning\s*fresh|bleach|disinfectant|glen\s*20|pine\s*o\s*cleen|white\s*king|ajax\b|jif\b|harpic|bref\b|domestos|windex|mr\s*muscle|easy-?off|chux\b|sabco|vileda|scourer|scouring|microfibre\s*cloth|surface\s*(?:spray|cleaner|wipes?)|multisurface|toilet\s*(?:cleaner|gel|block|rim|duck)|drain\s*cleaner|air\s*freshener|air\s*wick|glade\b|febreze|insect(?:icide)?|fly\s*spray|mortein|raid\b|aerogard|ant\s*rid|cockroach|mouse\s*trap|toilet\s*(?:paper|tissues?|rolls?)|quilton|kleenex|sorbent|who\s*gives\s*a\s*crap|paper\s*towels?|kitchen\s*towels?|viva\b|handee|facial\s*tissues?|serviettes?|napkins?|bin\s*liners?|garbage\s*bags?|rubbish\s*bags?|kitchen\s*tidy|glad\b|multix|hercules|cling\s*wrap|aluminium\s*foil|aluminum\s*foil|alfoil|baking\s*paper|parchment\s*paper|freezer\s*bags?|sandwich\s*bags?|ziploc|snap\s*lock|batteries|energizer|duracell|eveready|firelighters?|charcoal\s*briquettes?|cat\s*food|dog\s*food|kitten\s*food|puppy\s*food|pet\s*(?:food|treats?|milk|litter|care)|cat\s*litter|kitty\s*litter|dentalife|schmackos|pedigree|whiskas|felix\b|optimum\b|dine\b|fancy\s*feast|purina|supercoat|vip\s*petfoods?|my\s*dog\b|cesar\b|fussy\s*cat|applaws|bird\s*seed)\b/i;

const COFFEE_CAPSULE_GUARD =
  /\b(coffee|espresso|nespresso|dolce\s*gusto|caffitaly|lavazza|vittoria|moccona|l'or|starbucks|campos|pod|pods|roast)\b/i;

const HEALTH_BEAUTY_CORE_PATTERN =
  /\b(vitamins?|multivitamins?|multi-?vitamins?|vita\s*gumm(?:y|ies)|supplements?|caplets?|softgels?|lozenges?|effervescent|chewable\s*tablets?|fish\s*oil|krill\s*oil|omega-?\s*3|glucosamine|magnesium|melatonin|ashwagandha|collagen|coq10|folic\s*acid|caltrate|centrum|swisse|blackmores|cenovis|ostelin|voost|berocca|elevit|bioglan|ethical\s*nutrients|natures?\s*way|natures?\s*own|healthy\s*care|life-?space|life\s*botanics|jshealth|musashi|bsc\b|body\s*science|whey\s*protein|protein\s*(?:powder|isolate)|mass\s*gainer|creatine|pre-?workout|electrolyte\s*(?:powder|tablets?|sticks?|solution)|liquid\s*i\.?v\.?|hydralyte|gastrolyte|metamucil|benefiber|probiotic\s*(?:capsules?|tablets?|powder|drops?|gumm(?:y|ies)|supplement)|panadol|nurofen|paracetamol|ibuprofen|aspirin|disprin|voltaren|deep\s*heat|metsal|zyrtec|telfast|claratyne|codral|sudafed|lemsup|strepsils|difflam|betadine|vicks|bisolvon|duro-?tuss|gaviscon|mylanta|quick-?eze|nexium|somac|rennie|imodium|buscopan|coloxyl|movicol|canesten|hydrozole|savlon|bepanthen|sudocrem|band-?aids?|elastoplast|antiseptic|first\s*aid|eye\s*drops?|ear\s*drops?|nasal\s*spray|otrivin|fess\b|throat\s*(?:spray|gargle|drops?|lozenges?)|shampoos?|conditioners?|hair\s*(?:colour|color|dye|mask|serum|spray|gel|mousse|wax|treatment|food)|colourant|schwarzkopf|head\s*(?:&|and)\s*shoulders|pantene|tresemme|garnier|herbal\s*essences|sunsilk|toni\s*(?:&|and)\s*guy|ogx\b|john\s*frieda|monday\s*haircare|toothpastes?|toothbrush(?:es)?|mouthwash|dental\s*floss|interdental|colgate|oral-?b|sensodyne|macleans|listerine|polident|steradent|deodorants?|antiperspirants?|roll-?on|rexona|lynx\b|dove\b|nivea|mitchum|norsca|brut\b|body\s*(?:wash|scrub|lotion|butter|oil|mist|spray)|shower\s*gel|hand\s*(?:wash|saniti[sz]er|cream|lotion)|bar\s*soap|liquid\s*soap|palmolive|imperial\s*leather|radox|original\s*source|skincare|moisturis(?:er|ing)|cleans(?:er|ing)|micellar|facial\s*(?:wash|scrub|wipes?|mask|serum|oil|cream)|eye\s*cream|night\s*cream|day\s*cream|retinol|hyaluronic|niacinamide|spf\s*\d+|sunscreen|aftersun|cancer\s*council|banana\s*boat|bondi\s*sands|le\s*tan|self\s*tan|olay|neutrogena|cerave|cetaphil|aveeno|sukin|vaseline|sorbolene|la\s*roche|l'oreal|loreal|essano|swisspers|cotton\s*(?:pads?|balls?|tips?|buds?)|razors?|shav(?:e|ing)\s*(?:gel|foam|cream|blades?|balm)|aftershave|gillette|venus\b|schick|veet\b|nair\b|wax\s*strips?|toiletries|cosmetics?|makeup|mascara|eyeliner|eyeshadow|concealer|lipstick|lip\s*(?:balm|gloss|care|oil|liner)|chapstick|blistex|burt'?s\s*bees|maybelline|revlon|rimmel|covergirl|sally\s*hansen|nail\s*polish|serum|lotion|tampons?|sanitary\s*(?:pads?|napkins?)|panty\s*liners?|kotex|libra\b|carefree|always\s*(?:discreet|pads?|ultra)|poise\b|tena\b|condoms?|durex|lubricant|napp(?:y|ies)|nappy\s*pants|baby\s*(?:wipes?|bath|shampoo|lotion|oil|powder)|waterwipes|huggies|rascals\b|babylove|curash|infant\s*formula|aptamil|karicare)\b/i;

const CAPSULE_TABLET_DOSE_PATTERN = /\b(capsules?|tablets?)\b/i;

const SPECIAL_BUYS_GM_PATTERN =
  /\b(special\s*buys?|power\s*tools?|cordless\s*drill|angle\s*grinder|ferrex|workzone|auto\s*xs|medion|bauhn|crofton|ambiano|crane\b|adventuridge|gardenline|kirkton\s*house|easy\s*home|sohl\s*furniture|cookware|frypan|frying\s*pan|saucepan|cast\s*iron|baking\s*tray|roasting\s*pan|oven\s*mitt|pot\s*holder|tea\s*towels?|food\s*storage\s*containers?|insulated\s*(?:tumbler|mug|bottle)|ceramic\s*(?:mug|jar|bowl|plate)|\bmugs?\b|dinner\s*set|cutlery|air\s*fryer|electric\s*kettle|cordless\s*kettle|toaster|microwave|coffee\s*machine|espresso\s*machine|stick\s*mixer|slow\s*cooker|pressure\s*cooker|rice\s*cooker|vacuum\s*cleaner|steam\s*mop|ironing\s*board|clothes\s*airer|bedding|quilt|doona|pillows?|sheet\s*set|mattress|bath\s*towels?|throw\s*rug|cushions?|curtains?|furniture|bookshelf|office\s*chair|camping|\btent\b|sleeping\s*bag|gazebo|esky|cooler\s*bag|lawn\s*mower|whipper\s*snipper|pruner|potting\s*mix|fertiliser|hose\s*reel|baubles?|christmas\s*(?:tree|lights?|cards?|crackers?|bon\s*bons?|decorations?|stocking|wreath|tin\s*set)|wrapping\s*paper|gift\s*(?:wrap|bags?|tags?)|present\s*(?:toppers?|tags?)|curling\s*ribbon|velvet\s*ribbon|printed\s*ribbon|sticky\s*tape|stationery|notebooks?|ballpoint\s*pens?|sharpie|lego\b|plush\s*toy|board\s*game|jigsaw\s*puzzle|pyjamas?|slippers?|hoodie|trackpants?|work\s*boots?|umbrellas?)\b/i;

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
  /\b(chips?|crisps?|crackers?|biscuits?|cookies?|shapes\b|twisties|cheezels|burger\s*rings|doritos|pringles|kettle\b|smith'?s|thins\b|grain\s*waves|red\s*rock\s*deli|cc'?s\b|cheetos|popcorn|pretzels?|rice\s*(?:wheels|crackers|cakes)|corn\s*chips|tortilla\s*chips|muesli\s*bars?|nut\s*bars?|granola\s*bars?|oat\s*bars?|snack\s*bars?|protein\s*bars?|fruit\s*straps?|roll-?ups|chocolate|cadbury|dairy\s*milk|milk\s*tray|milkybar|lindt|lindor|toblerone|ferrero|raffaello|guylian|darrell\s*lea|whittaker'?s|haigh'?s|kinder\b|mars\b|snickers|twix\b|kit\s*kat|kitkat|maltesers|m&m'?s?|bounty\b|smarties|aero\b|violet\s*crumble|cherry\s*ripe|crunchie|freddo|caramello|picnic\b|allen'?s|natural\s*confectionery|trolli|haribo|sour\s*patch|skittles|starburst|mentos|tic\s*tac|eclipse\s*mints?|extra\s*gum|life\s*savers|lollies|jellies|gumm(?:y|ies)|marshmallows?|licorice|liquorice|advent\s*calendars?|easter\s*eggs?|arnott'?s|tim\s*tam|oreo|belvita|anzac\s*biscuits?|shortbread|gingerbread|peanut\s*butter|almond\s*butter|cashew\s*butter|cookie\s*butter|biscoff|nutella|hazelnut\s*spread|coconut\s*(?:milk|cream)|cream\s*of\s*(?:chicken|mushroom|tomato|pumpkin|asparagus)|pasta\s*sauce|simmer\s*sauce|butter\s*chicken\s*sauce|egg\s*noodles?|cake\s*mix|muffin\s*mix|frosting|icing)\b/i;

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

function resolveRetailerCategoryHint(rawCategory, title) {
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
    /\b(household(?:\s*cleaning)?|cleaning\s*(?:&|and)?\s*maintenance|laundry|dishwashing|papergoods|paper\s*goods|wraps?\s*(?:&|and)\s*bags|toilet\s*paper|pest\s*control|air\s*care|pet\s*care|pets?\b|cat\s*(?:&|and)\s*dog)\b/i.test(
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
    /\b(fruit\s*(?:&|and)\s*veg(?:etables?)?|fresh\s*produce|produce|fresh\s*fruit|fresh\s*vegetables?|salads?\s*(?:&|and)\s*herbs?)\b/i.test(
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

export function classifyCategory(rawCategory = '', title = '', store = '') {
  const cleanTitle = cleanText(title);
  const cleanRaw = cleanText(rawCategory);
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

export function extractSaleFinderUrlHint(hrefOrUrl = '') {
  if (!hrefOrUrl) return '';
  const pathOnly = String(hrefOrUrl).replace(/^https?:\/\/[^/]+/i, '');
  const parts = pathOnly.split('/').filter(Boolean);
  if (parts.length >= 4 && /^\d+$/.test(parts[0])) {
    return parts.slice(1, -2).join(' ').replace(/-/g, ' ');
  }
  return '';
}

export function reclassifyItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return items;
  return items.map((item) => {
    const sfHint =
      item?.productUrl && String(item.productUrl).includes('salefinder.com.au')
        ? extractSaleFinderUrlHint(item.productUrl)
        : '';
    const aldiSpecialHint =
      item?.store === 'aldi' &&
      item?.catalogueName &&
      /special\s*buys?/i.test(item.catalogueName)
        ? item.catalogueName
        : '';
    const rawHint = sfHint || aldiSpecialHint;
    const nextCat = classifyCategory(rawHint, item?.title || '', item?.store || '');
    const finalCat =
      nextCat === 'Other' &&
      item?.category &&
      item.category !== 'Pantry & Snacks' &&
      CATEGORIES.includes(item.category)
        ? item.category
        : nextCat;
    return finalCat === item?.category ? item : { ...item, category: finalCat };
  });
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
  const finalPrice = parseMoney(price);
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
