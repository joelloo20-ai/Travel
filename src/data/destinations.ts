export interface Destination {
  key: string;
  country: string;
  countryName: string;
  name: string;
  airport: string;
  airportCode: string;
  latitude: number;
  longitude: number;
  primary: boolean;
  accent: string;
  deep: string;
  sky: string;
  glow: string;
  cityscapeLabel: string;
  atmosphere: 'rain' | 'snow' | 'leaves' | 'mist' | 'sea-spray';
  seasonNote: string;
  recommendations: {
    title: string;
    detail: string;
    tag: string;
  }[];
  promotion: {
    label: string;
    title: string;
    detail: string;
  };
  illustrationKey?: string;
}

export const destinations: Destination[] = [
  {
    key: 'singapore',
    country: 'singapore',
    countryName: 'Singapore',
    name: 'Singapore',
    airport: 'Changi Airport',
    airportCode: 'SIN',
    latitude: 1.3644,
    longitude: 103.9915,
    primary: true,
    accent: '#efbf83',
    deep: '#062c2a',
    sky: '#195451',
    glow: '#f7bd7e',
    cityscapeLabel: 'Home port, drawn in garden light',
    atmosphere: 'rain',
    seasonNote: 'Tropical rain, usually brief — ideal for a late-afternoon reset.',
    recommendations: [
      { title: 'Gardens by the Bay at blue hour', detail: 'Book the cooled conservatories, then stay for the Supertree light show.', tag: 'Evening' },
      { title: 'Katong, unhurried', detail: 'Follow an early walk with kaya toast and Peranakan tiles on Joo Chiat Road.', tag: 'Local ritual' },
      { title: 'A hawker supper loop', detail: 'Let Maxwell, Old Airport Road or East Coast Lagoon decide the final course.', tag: 'Worth the queue' },
    ],
    promotion: { label: 'Atlas pick', title: 'Make room for a rain plan', detail: 'Pair a gallery afternoon with a rooftop dinner; the city feels most cinematic after a warm shower.' },
  },
  {
    key: 'sydney',
    country: 'australia',
    countryName: 'Australia',
    name: 'Sydney',
    airport: 'Sydney Kingsford Smith Airport',
    airportCode: 'SYD',
    latitude: -33.9461,
    longitude: 151.1772,
    primary: true,
    accent: '#f2a76a',
    deep: '#14313b',
    sky: '#2c7291',
    glow: '#ffe1a8',
    cityscapeLabel: 'Sails against a harbour dawn',
    atmosphere: 'sea-spray',
    seasonNote: 'Salt air on the harbour — bring a light layer after sunset.',
    recommendations: [
      { title: 'The Bondi to Coogee walk', detail: 'Start early for the cliff path, ocean pools and a long breakfast after.', tag: 'Coastal morning' },
      { title: 'Opera House backstage', detail: 'Choose a performance or a guided tour, then cross to Circular Quay by dusk.', tag: 'Book ahead' },
      { title: 'Newtown after dark', detail: 'Vinyl bars, small kitchens and a lived-in version of the city.', tag: 'Neighbourhood night' },
    ],
    promotion: { label: 'Seasonal note', title: 'Harbour days, made longer', detail: 'Reserve a late ferry to Manly and let the return journey become the sunset cruise.' },
  },
  {
    key: 'melbourne',
    country: 'australia',
    countryName: 'Australia',
    name: 'Melbourne',
    airport: 'Melbourne Airport',
    airportCode: 'MEL',
    latitude: -37.669,
    longitude: 144.841,
    primary: false,
    accent: '#d9775b',
    deep: '#291b2a',
    sky: '#5c375d',
    glow: '#f2be90',
    cityscapeLabel: 'Race lights, river lines, late coffee',
    atmosphere: 'rain',
    seasonNote: 'Four seasons in a day — a compact umbrella earns its place.',
    recommendations: [
      { title: 'Laneways and espresso', detail: 'Begin at Centre Place, then follow your nose through the city’s tiny bars and bakeries.', tag: 'First morning' },
      { title: 'NGV after lunch', detail: 'Give the international collection a slow, unhurried afternoon.', tag: 'Indoor favourite' },
      { title: 'St Kilda at golden hour', detail: 'Walk the pier, watch for penguins and finish with fish and chips by the water.', tag: 'Sunset' },
    ],
    promotion: { label: 'Atlas pick', title: 'The perfect rainy-day city', detail: 'Keep your schedule loose: an exhibition, a long lunch and one great bar is enough.' },
  },
  {
    key: 'guangzhou',
    country: 'china',
    countryName: 'China',
    name: 'Guangzhou',
    airport: 'Guangzhou Baiyun International Airport',
    airportCode: 'CAN',
    latitude: 23.3924,
    longitude: 113.2988,
    primary: true,
    accent: '#e67555',
    deep: '#321117',
    sky: '#7e3141',
    glow: '#ffc27b',
    cityscapeLabel: 'River heat and a tower of light',
    atmosphere: 'rain',
    seasonNote: 'Warm river weather with passing showers — cool interiors are part of the rhythm.',
    recommendations: [
      { title: 'Cantonese breakfast', detail: 'Order dim sum early, when the tea rooms are full of their best energy.', tag: 'Essential' },
      { title: 'Pearl River at night', detail: 'Take the water after dark for a new angle on the Canton Tower.', tag: 'Night view' },
      { title: 'Shamian Island stroll', detail: 'A quieter pocket of old trees, river air and colonial-era architecture.', tag: 'Slow hour' },
    ],
    promotion: { label: 'Food-first recommendation', title: 'Build the visit around the table', detail: 'A dim sum lunch and late-night congee make a more memorable route than rushing the landmarks.' },
  },
  {
    key: 'hong-kong',
    country: 'china',
    countryName: 'China',
    name: 'Hong Kong',
    airport: 'Hong Kong International Airport',
    airportCode: 'HKG',
    latitude: 22.308,
    longitude: 113.9185,
    primary: false,
    accent: '#e59a65',
    deep: '#17142b',
    sky: '#354878',
    glow: '#ffcf86',
    cityscapeLabel: 'Harbour neon and vertical nights',
    atmosphere: 'mist',
    seasonNote: 'Harbour mist and high humidity give the skyline its soft electric glow.',
    recommendations: [
      { title: 'Star Ferry, both ways', detail: 'Ride at dusk from Central to Tsim Sha Tsui, then return after the lights come up.', tag: 'Classic, still right' },
      { title: 'A temple-to-tea route', detail: 'Start at Man Mo, then take a quiet tea break in Sheung Wan.', tag: 'Morning' },
      { title: 'Sai Kung seafood', detail: 'Trade towers for a ferry, a promenade and a table by the water.', tag: 'Day escape' },
    ],
    promotion: { label: 'Atlas pick', title: 'Stay late on the water', detail: 'The harbour is the city’s best free theatre — plan one open evening around it.' },
  },
  {
    key: 'taipei',
    country: 'taiwan',
    countryName: 'Taiwan',
    name: 'Taipei',
    airport: 'Taiwan Taoyuan International Airport',
    airportCode: 'TPE',
    latitude: 25.0797,
    longitude: 121.2342,
    primary: true,
    accent: '#d7aa62',
    deep: '#172a30',
    sky: '#406e72',
    glow: '#ffdda0',
    cityscapeLabel: 'A jade tower over market warmth',
    atmosphere: 'rain',
    seasonNote: 'Soft rain turns the city glossy; night markets only get better under an awning.',
    recommendations: [
      { title: 'Xiangshan trail to Taipei 101', detail: 'A short climb delivers the skyline before the crowds fully arrive.', tag: 'First light' },
      { title: 'Dadaocheng after tea', detail: 'Browse old shops, then follow the river toward a sunset drink.', tag: 'Slow afternoon' },
      { title: 'Ningxia night market', detail: 'Go hungry and share everything: oyster omelettes, taro balls, grilled skewers.', tag: 'Eat here' },
    ],
    promotion: { label: 'Seasonal note', title: 'Rain is part of the scene', detail: 'Keep a folding umbrella handy and let the city’s arcades and night markets do the rest.' },
  },
  {
    key: 'tokyo',
    country: 'japan',
    countryName: 'Japan',
    name: 'Tokyo',
    airport: 'Tokyo Haneda Airport',
    airportCode: 'HND',
    latitude: 35.5494,
    longitude: 139.7798,
    primary: true,
    accent: '#df8a7e',
    deep: '#30171d',
    sky: '#924f5c',
    glow: '#ffd0a0',
    cityscapeLabel: 'Tower light and a midnight horizon',
    atmosphere: 'snow',
    seasonNote: 'A winter hush with sharp blue evenings — layers make long walks better.',
    recommendations: [
      { title: 'Asakusa before opening time', detail: 'See Senso-ji while the lanes are quiet, then take coffee by the Sumida River.', tag: 'Early start' },
      { title: 'Kissa and record shops in Shimokitazawa', detail: 'Spend an afternoon following small signs and listening rooms.', tag: 'Neighbourhood find' },
      { title: 'Omakase, thoughtfully booked', detail: 'Choose a small counter and reserve well ahead for an unhurried night.', tag: 'Reserve ahead' },
    ],
    promotion: { label: 'Winter recommendation', title: 'Tokyo after the last train', detail: 'Make one night for a warm bowl of ramen and a walk through the quietly lit side streets.' },
  },
  {
    key: 'osaka',
    country: 'japan',
    countryName: 'Japan',
    name: 'Osaka',
    airport: 'Kansai International Airport',
    airportCode: 'KIX',
    latitude: 34.4347,
    longitude: 135.244,
    primary: false,
    accent: '#e69b78',
    deep: '#342022',
    sky: '#9f625b',
    glow: '#ffce99',
    cityscapeLabel: 'Canal glow and kitchen-city energy',
    atmosphere: 'leaves',
    seasonNote: 'Autumn leaves and steam from the grills make evening walks feel theatrical.',
    recommendations: [
      { title: 'Kuromon, then beyond it', detail: 'Snack through the market, then save room for a proper counter lunch nearby.', tag: 'Food route' },
      { title: 'Dotonbori from the water', detail: 'A short canal cruise reveals the neon at its most playful.', tag: 'After dark' },
      { title: 'Minoh Falls detour', detail: 'A gentle escape for maple leaves, forest air and fried maple-leaf treats.', tag: 'Seasonal' },
    ],
    promotion: { label: 'Atlas pick', title: 'Arrive hungry, stay curious', detail: 'Osaka rewards a loose plan: one landmark, several snacks and a long evening by the canal.' },
  },
  {
    key: 'seoul',
    country: 'korea',
    countryName: 'South Korea',
    name: 'Seoul',
    airport: 'Incheon International Airport',
    airportCode: 'ICN',
    latitude: 37.4602,
    longitude: 126.4407,
    primary: true,
    accent: '#b2a8d6',
    deep: '#152330',
    sky: '#485f8a',
    glow: '#ddd1ff',
    cityscapeLabel: 'Mountain silhouettes and city pulse',
    atmosphere: 'snow',
    seasonNote: 'Fine snow can turn palace grounds and side streets beautifully quiet.',
    recommendations: [
      { title: 'Gyeongbokgung in the morning', detail: 'Rent a hanbok or simply take the palace slowly before the city speeds up.', tag: 'Cultural anchor' },
      { title: 'Euljiro after the workshops close', detail: 'Find its hidden bars and tiny restaurants behind old storefronts.', tag: 'Evening' },
      { title: 'Bukhansan skyline break', detail: 'A short hike gives the density of Seoul a striking new scale.', tag: 'Clear-day plan' },
    ],
    promotion: { label: 'Winter recommendation', title: 'Warm up by design', detail: 'Pair a palace morning with jjimjilbang time or a long bowl of seolleongtang.' },
  },
  {
    key: 'busan',
    country: 'korea',
    countryName: 'South Korea',
    name: 'Busan',
    airport: 'Gimhae International Airport',
    airportCode: 'PUS',
    latitude: 35.1795,
    longitude: 128.9382,
    primary: false,
    accent: '#78b9c5',
    deep: '#092733',
    sky: '#276173',
    glow: '#bcecf0',
    cityscapeLabel: 'Coastlines, bridges and open air',
    atmosphere: 'sea-spray',
    seasonNote: 'A sea breeze follows you everywhere — a light jacket is useful by the shore.',
    recommendations: [
      { title: 'Haeundae at first light', detail: 'Walk the sand before breakfast, then take the coastal tram toward Cheongsapo.', tag: 'Coastline' },
      { title: 'Gamcheon, slowly', detail: 'Explore the hillside lanes with time to get deliberately lost.', tag: 'Colour and views' },
      { title: 'Jagalchi and BIFF Square', detail: 'Eat fresh seafood, then graze through the nearby street-food stalls.', tag: 'Food stop' },
    ],
    promotion: { label: 'Atlas pick', title: 'Choose the long way round', detail: 'Busan is best experienced between its neighbourhoods: ferries, coastal walks and the little trains.' },
  },
  {
    key: 'disney-cruise',
    country: 'cruise',
    countryName: 'Disney Cruise',
    name: 'Disney Cruise',
    airport: 'Marina Bay Cruise Centre',
    airportCode: 'MBCCS',
    latitude: 1.2645,
    longitude: 103.8185,
    primary: true,
    accent: '#6fbdd1',
    deep: '#082939',
    sky: '#17617c',
    glow: '#c5f0f3',
    cityscapeLabel: 'A ship of light on an open horizon',
    atmosphere: 'sea-spray',
    seasonNote: 'Open-deck breezes arrive quickly after sunset; keep one warm layer nearby.',
    recommendations: [
      { title: 'Claim the deck at golden hour', detail: 'A quiet promenade walk before dinner is the simplest luxury on board.', tag: 'Daily ritual' },
      { title: 'Book one signature meal', detail: 'Choose the themed evening that feels most special and reserve it early.', tag: 'Plan ahead' },
      { title: 'Keep a sea day unscheduled', detail: 'Leave room for the pool, the spa or a nap without a destination.', tag: 'Best value' },
    ],
    promotion: { label: 'On-board recommendation', title: 'Let the itinerary breathe', detail: 'The most memorable sailing days leave enough space for an unplanned sunset on deck.' },
  },
];

export const destinationByKey = (key: string): Destination | undefined =>
  destinations.find((destination) => destination.key === key);

export const DEFAULT_DESTINATION_KEY = 'melbourne';

export interface Journey {
  label: string;
  dates: string;
  destinationKey: string;
}

export const journeys: Journey[] = [
  { label: 'Disney Cruise', dates: '17–21 Sep', destinationKey: 'disney-cruise' },
  { label: 'Melbourne', dates: '8–17 Oct', destinationKey: 'melbourne' },
  { label: 'China route', dates: '12–21 Nov', destinationKey: 'guangzhou' },
];

export function longitudeToRotationY(longitude: number): number {
  const shifted = ((longitude + 180) * Math.PI) / 180;
  return Math.PI / 2 - shifted;
}

export function latLngToVector3(
  latitude: number,
  longitude: number,
  radius = 1.56,
): [number, number, number] {
  const phi = ((90 - latitude) * Math.PI) / 180;
  const theta = ((longitude + 180) * Math.PI) / 180;
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}
