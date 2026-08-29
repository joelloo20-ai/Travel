export type LandmarkKind =
  | 'merlion'
  | 'opera-house'
  | 'eureka-tower'
  | 'canton-tower'
  | 'hk-skyline'
  | 'taipei-101'
  | 'tokyo-tower'
  | 'osaka-castle'
  | 'seoul-tower'
  | 'gwangan-bridge'
  | 'cruise-ship';

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
  /** IANA timezone used to compute the city's real local time and day/night state. */
  timezone: string;
  /** Which procedural 3D landmark to render on the destination detail page. */
  landmark: LandmarkKind;
  /** Landmark name shown in the scene HUD. */
  landmarkName: string;
  /** Whether the scene should render a water plane (harbour/bay/river) under the landmark. */
  hasWater: boolean;
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
    timezone: 'Asia/Singapore',
    landmark: 'merlion',
    landmarkName: 'The Merlion',
    hasWater: true,
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
    timezone: 'Australia/Sydney',
    landmark: 'opera-house',
    landmarkName: 'Sydney Opera House',
    hasWater: true,
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
    timezone: 'Australia/Melbourne',
    landmark: 'eureka-tower',
    landmarkName: 'Eureka Tower',
    hasWater: true,
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
    timezone: 'Asia/Shanghai',
    landmark: 'canton-tower',
    landmarkName: 'Canton Tower',
    hasWater: true,
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
    timezone: 'Asia/Hong_Kong',
    landmark: 'hk-skyline',
    landmarkName: 'Victoria Harbour Skyline',
    hasWater: true,
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
    timezone: 'Asia/Taipei',
    landmark: 'taipei-101',
    landmarkName: 'Taipei 101',
    hasWater: false,
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
    timezone: 'Asia/Tokyo',
    landmark: 'tokyo-tower',
    landmarkName: 'Tokyo Tower',
    hasWater: false,
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
    timezone: 'Asia/Tokyo',
    landmark: 'osaka-castle',
    landmarkName: 'Osaka Castle',
    hasWater: true,
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
    timezone: 'Asia/Seoul',
    landmark: 'seoul-tower',
    landmarkName: 'N Seoul Tower',
    hasWater: false,
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
    timezone: 'Asia/Seoul',
    landmark: 'gwangan-bridge',
    landmarkName: 'Gwangandaegyo Bridge',
    hasWater: true,
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
    timezone: 'Asia/Singapore',
    landmark: 'cruise-ship',
    landmarkName: 'Disney Cruise Liner',
    hasWater: true,
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
