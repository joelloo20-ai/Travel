import fs from 'node:fs';
import path from 'node:path';

const palette = [
  { accent: '#e7a879', deep: '#18323a', sky: '#3b7086', glow: '#ffdfab' },
  { accent: '#d9a66e', deep: '#2b2538', sky: '#66507e', glow: '#ffd7a5' },
  { accent: '#d88370', deep: '#34202e', sky: '#7b4a68', glow: '#ffd4ac' },
  { accent: '#8cc8cb', deep: '#12343d', sky: '#397184', glow: '#c8f2ec' },
];

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const token = process.argv[index];
  if (!token.startsWith('--')) continue;
  const key = token.slice(2);
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) {
    args.set(key, true);
    continue;
  }
  args.set(key, value);
  index += 1;
}

if (args.has('help')) {
  console.log(`Usage:\n  node scripts/add-country.mjs --key paris --country france --country-name France --name Paris --airport "Charles de Gaulle Airport" --code CDG --lat 49.0097 --lng 2.5479 [--illustration metropolis]\n\nIllustration presets: metropolis (default), or a destination key with a matching illustration profile.`);
  process.exit(0);
}

const required = ['key', 'country', 'country-name', 'name', 'airport', 'code', 'lat', 'lng'];
const missing = required.filter((key) => !args.get(key));
if (missing.length) {
  throw new Error(`Missing required options: ${missing.map((key) => `--${key}`).join(', ')}. Run with --help for an example.`);
}

const key = String(args.get('key')).toLowerCase();
if (!/^[a-z0-9-]+$/.test(key)) throw new Error('--key must use lowercase letters, digits, and hyphens only.');

const latitude = Number(args.get('lat'));
const longitude = Number(args.get('lng'));
if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('--lat and --lng must be valid numbers.');

const file = path.resolve('src/data/destinations.ts');
const source = fs.readFileSync(file, 'utf8');
if (source.includes(`key: '${key}'`)) throw new Error(`A destination with key '${key}' already exists.`);

const paletteIndex = [...key].reduce((sum, character) => sum + character.charCodeAt(0), 0) % palette.length;
const colors = palette[paletteIndex];
const quote = (value) => String(value).replaceAll("'", "\\'");
const illustrationKey = args.get('illustration') || 'metropolis';
const atmosphere = args.get('atmosphere') || 'mist';
const name = quote(args.get('name'));
const entry = `  {\n    key: '${quote(key)}',\n    country: '${quote(args.get('country'))}',\n    countryName: '${quote(args.get('country-name'))}',\n    name: '${name}',\n    airport: '${quote(args.get('airport'))}',\n    airportCode: '${quote(args.get('code')).toUpperCase()}',\n    latitude: ${latitude},\n    longitude: ${longitude},\n    primary: false,\n    accent: '${colors.accent}',\n    deep: '${colors.deep}',\n    sky: '${colors.sky}',\n    glow: '${colors.glow}',\n    cityscapeLabel: 'Explore ${name} through a cinematic illustration',\n    atmosphere: '${quote(atmosphere)}',\n    seasonNote: 'A quiet visual field for discovering ${name}.',\n    recommendations: [{ title: 'Start with the centre', detail: 'Build your first day around one neighbourhood and leave room to wander.', tag: 'First look' }],\n    promotion: { label: 'Atlas pick', title: 'Follow the local rhythm', detail: 'Use this page as a starting point, then shape the route around your own pace.' },\n    illustrationKey: '${quote(illustrationKey)}',\n  },\n`;

const marker = '];\n\nexport const destinationByKey';
const position = source.indexOf(marker);
if (position === -1) throw new Error('Could not find the destination insertion point in src/data/destinations.ts.');

fs.writeFileSync(file, `${source.slice(0, position)}${entry}${source.slice(position)}`);
console.log(`Added ${args.get('name')} with the '${illustrationKey}' interactive illustration preset.`);
