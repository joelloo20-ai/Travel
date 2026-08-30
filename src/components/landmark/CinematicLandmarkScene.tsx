import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from 'react';
import type { Destination } from '../../data/destinations';
import { GlobeErrorBoundary } from '../GlobeErrorBoundary';
import type { LiveWeather, WeatherCondition } from '../../hooks/useLiveWeather';
import type { LocalTimeState } from '../../hooks/useLocalTime';
import { useSceneAvailability } from '../../hooks/useSceneAvailability';
import { ShaderAtmosphere, type ScenePointer } from './ShaderAtmosphere';
import guangzhouPainted from '../../assets/landmarks/guangzhou-painted.png';
import hongKongPainted from '../../assets/landmarks/hong-kong-painted.png';
import melbournePainted from '../../assets/landmarks/melbourne-painted.png';
import busanPainted from '../../assets/landmarks/busan-painted.png';
import osakaPainted from '../../assets/landmarks/osaka-painted.png';
import seoulPainted from '../../assets/landmarks/seoul-painted.png';
import singaporePainted from '../../assets/landmarks/singapore-painted.png';
import sydneyPainted from '../../assets/landmarks/sydney-painted.png';
import taipeiPainted from '../../assets/landmarks/taipei-painted.png';
import tokyoPainted from '../../assets/landmarks/tokyo-painted.png';

interface CinematicLandmarkSceneProps {
  destination: Destination;
  weather: LiveWeather | null;
  localTime: LocalTimeState;
  loading: boolean;
}

const WEATHER_PARTICLES = Array.from({ length: 32 }, (_, index) => ({
  id: index,
  left: `${(index * 29 + 7) % 103}%`,
  top: `${-18 - (index * 11) % 50}%`,
  delay: `${-((index * 0.43) % 5.6)}s`,
  duration: `${1.35 + (index % 7) * 0.16}s`,
  opacity: 0.28 + (index % 5) * 0.09,
}));

const WEATHER_PARTICLE_COUNT: Record<WeatherCondition, number> = {
  clear: 0,
  cloudy: 0,
  fog: 0,
  drizzle: 18,
  rain: 30,
  snow: 24,
  thunderstorm: 32,
};

// Each plate is an original landmark-directed editorial illustration. The same
// lightweight plane system gives every city the same depth treatment without
// loading a separate WebGL model or a large video file for each route.
const PAINTED_CITY_PLATES: Record<string, string> = {
  singapore: singaporePainted,
  sydney: sydneyPainted,
  melbourne: melbournePainted,
  guangzhou: guangzhouPainted,
  'hong-kong': hongKongPainted,
  taipei: taipeiPainted,
  tokyo: tokyoPainted,
  osaka: osakaPainted,
  seoul: seoulPainted,
  busan: busanPainted,
};

const SKY_BIRDS = [
  { id: 'a', top: '24%', delay: '-8s', duration: '32s', scale: 0.78 },
  { id: 'b', top: '31%', delay: '-21s', duration: '38s', scale: 0.54 },
  { id: 'c', top: '18%', delay: '-29s', duration: '42s', scale: 0.62 },
];

const PROMENADE_WALKERS = [
  { id: 'a', bottom: '10%', delay: '-4s', duration: '27s', scale: 0.72 },
  { id: 'b', bottom: '15%', delay: '-17s', duration: '34s', scale: 0.54 },
];

function WeatherLayer({ weather }: { weather: LiveWeather | null }) {
  const condition = weather?.condition ?? 'clear';
  const wind = weather ? Math.min(weather.windKph / 42, 1) : 0.2;
  const windDirection = weather ? Math.sin((weather.windDirectionDeg * Math.PI) / 180) : 0.3;
  const intensity = weather ? Math.min(1, 0.28 + weather.precipitationMm / 3 + weather.cloudCoverPct / 260) : 0.2;
  const drift = windDirection * (42 + wind * 72);
  const particles = WEATHER_PARTICLES.slice(0, WEATHER_PARTICLE_COUNT[condition]);

  return (
    <div
      className={`cinematic-weather cinematic-weather--${condition}`}
      style={{
        '--weather-drift': `${drift.toFixed(1)}px`,
        '--weather-reverse-drift': `${(-drift * 0.22).toFixed(1)}px`,
        '--weather-rain-drift': `${(drift * 1.7).toFixed(1)}px`,
        '--weather-snow-mid': `${(drift * 0.44 + 20).toFixed(1)}px`,
        '--weather-snow-final': `${(drift * 0.76 - 18).toFixed(1)}px`,
        '--weather-angle': `${(windDirection * 14).toFixed(1)}deg`,
        '--weather-strength': intensity.toFixed(3),
      } as CSSProperties}
      aria-hidden="true"
    >
      <div className="cinematic-weather__clouds" />
      <div className="cinematic-weather__mist" />
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="cinematic-weather__particle"
          style={{
            left: particle.left,
            top: particle.top,
            opacity: particle.opacity,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
      {condition === 'thunderstorm' ? <span className="cinematic-weather__lightning" /> : null}
    </div>
  );
}

interface OperaShell {
  d: string;
  fill: string;
  ribs: string[];
  highlight: string;
  opacity?: number;
}

// East-facing shell silhouettes are derived from the repeating spherical
// geometry rather than a set of generic triangular sails. The high, paired
// concert-hall shells sit behind the lower opera-theatre and restaurant shells.
const OPERA_SHELLS: OperaShell[] = [
  {
    d: 'M 490 662 C 505 450 642 246 824 132 C 806 387 731 571 657 662 Z',
    fill: 'url(#opera-shell-rear)',
    ribs: ['M 531 654 C 554 471 668 302 795 193', 'M 570 657 C 604 480 700 339 776 245'],
    highlight: 'M 509 649 C 531 452 661 269 812 151',
    opacity: 0.82,
  },
  {
    d: 'M 638 663 C 657 395 835 151 1020 76 C 997 358 909 570 805 663 Z',
    fill: 'url(#opera-shell-tall)',
    ribs: ['M 681 656 C 702 418 858 206 994 111', 'M 724 660 C 751 435 871 252 972 151', 'M 766 661 C 805 459 887 304 949 201'],
    highlight: 'M 659 648 C 683 404 846 175 1005 96',
  },
  {
    d: 'M 798 663 C 839 447 1003 268 1187 182 C 1146 449 1021 585 919 663 Z',
    fill: 'url(#opera-shell-middle)',
    ribs: ['M 840 657 C 882 466 1016 316 1157 210', 'M 878 660 C 925 491 1038 357 1132 242'],
    highlight: 'M 822 650 C 866 456 1016 292 1171 196',
  },
  {
    d: 'M 939 663 C 1013 499 1144 378 1323 332 C 1271 516 1153 611 1068 663 Z',
    fill: 'url(#opera-shell-front)',
    ribs: ['M 981 658 C 1056 516 1161 412 1291 354', 'M 1019 660 C 1088 537 1176 447 1264 375'],
    highlight: 'M 965 653 C 1039 511 1162 397 1306 346',
  },
  {
    d: 'M 1082 662 C 1147 554 1264 479 1415 457 C 1354 570 1244 633 1170 664 Z',
    fill: 'url(#opera-shell-front)',
    ribs: ['M 1125 658 C 1189 560 1280 501 1384 471'],
    highlight: 'M 1105 655 C 1170 562 1272 491 1400 467',
    opacity: 0.9,
  },
];

function OperaShell({ shell }: { shell: OperaShell }) {
  return (
    <g opacity={shell.opacity ?? 1} filter="url(#opera-shell-texture)">
      <path d={shell.d} fill={shell.fill} stroke="#f9f4e5" strokeOpacity="0.88" strokeWidth="2.6" />
      <path d={shell.d} fill="url(#opera-tile-chevrons)" opacity="0.46" />
      <path d={shell.highlight} fill="none" stroke="#ffffff" strokeOpacity="0.72" strokeWidth="3" />
      {shell.ribs.map((rib) => <path key={rib} d={rib} fill="none" stroke="#6e8790" strokeOpacity="0.38" strokeWidth="2.2" />)}
    </g>
  );
}

interface SydneyIllustrationRefs {
  skyRef: RefObject<SVGSVGElement | null>;
  horizonRef: RefObject<SVGGElement | null>;
  landmarkRef: RefObject<SVGGElement | null>;
  promenadeRef: RefObject<SVGGElement | null>;
}

/** A layered, front-facing vector study of the Sydney Opera House's tiled shell geometry. */
function SydneyOperaIllustration({ dayPhase, sceneRefs }: { dayPhase: number; sceneRefs: SydneyIllustrationRefs }) {
  const daylight = Math.round(dayPhase * 100);

  return (
    <svg ref={sceneRefs.skyRef} className="sydney-illustration" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="opera-sky" x1="0" y1="0" x2="0.88" y2="1">
          <stop offset="0%" stopColor="#7ec2d0" />
          <stop offset="46%" stopColor="#b4d9d5" />
          <stop offset="100%" stopColor="#f0d4aa" />
        </linearGradient>
        <linearGradient id="opera-haze" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6997a1" stopOpacity="0" />
          <stop offset="48%" stopColor="#f8e0ba" stopOpacity="0.54" />
          <stop offset="100%" stopColor="#89b3b9" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="opera-shell-rear" x1="0" y1="0" x2="0.95" y2="1">
          <stop offset="0%" stopColor="#fffdf5" />
          <stop offset="38%" stopColor="#eeeadd" />
          <stop offset="100%" stopColor="#819ba3" />
        </linearGradient>
        <linearGradient id="opera-shell-tall" x1="0.16" y1="0" x2="0.92" y2="1">
          <stop offset="0%" stopColor="#fffef8" />
          <stop offset="33%" stopColor="#f7f4e9" />
          <stop offset="70%" stopColor="#d9ddd6" />
          <stop offset="100%" stopColor="#78929c" />
        </linearGradient>
        <linearGradient id="opera-shell-middle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fffdf2" />
          <stop offset="49%" stopColor="#e6e7de" />
          <stop offset="100%" stopColor="#6e8994" />
        </linearGradient>
        <linearGradient id="opera-shell-front" x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#fefcf2" />
          <stop offset="54%" stopColor="#e4e6df" />
          <stop offset="100%" stopColor="#77949d" />
        </linearGradient>
        <linearGradient id="opera-podium" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a6e71" />
          <stop offset="34%" stopColor="#354c51" />
          <stop offset="100%" stopColor="#182d32" />
        </linearGradient>
        <linearGradient id="opera-stone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#829194" />
          <stop offset="30%" stopColor="#5d7377" />
          <stop offset="100%" stopColor="#263e44" />
        </linearGradient>
        <linearGradient id="opera-glass" x1="0.08" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#f7ce91" stopOpacity="0.92" />
          <stop offset="27%" stopColor="#98c7c9" stopOpacity="0.82" />
          <stop offset="65%" stopColor="#355d69" stopOpacity="0.94" />
          <stop offset="100%" stopColor="#132e37" stopOpacity="0.98" />
        </linearGradient>
        <radialGradient id="opera-foyer-glow" cx="0.44" cy="0.24" r="0.8">
          <stop offset="0%" stopColor="#ffe4b0" stopOpacity="0.8" />
          <stop offset="48%" stopColor="#efbb75" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1a3a43" stopOpacity="0" />
        </radialGradient>
        <pattern id="opera-tile-chevrons" width="18" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
          <path d="M0 10.8 L9 1.5 L18 10.8 M0 1.2 L9 10.5 L18 1.2" fill="none" stroke="#64808b" strokeOpacity="0.52" strokeWidth="0.72" />
          <path d="M0 11.5 H18" fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.45" />
        </pattern>
        <filter id="opera-shell-texture" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="2" seed="13" result="grain" />
          <feColorMatrix in="grain" type="saturate" values="0" result="monochrome-grain" />
          <feComponentTransfer in="monochrome-grain" result="soft-grain"><feFuncA type="table" tableValues="0 0.1" /></feComponentTransfer>
          <feBlend in="SourceGraphic" in2="soft-grain" mode="soft-light" />
        </filter>
        <filter id="opera-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <rect width="1600" height="900" fill="url(#opera-sky)" opacity="0.7" />
      <circle className="sydney-illustration__celestial" cx="1255" cy="145" r="78" fill="#fff0c9" opacity={0.32 + daylight / 210} />
      <path className="sydney-illustration__cloud sydney-illustration__cloud--far" d="M80 272 C230 170 422 195 568 284 C447 304 233 320 80 272 Z" />
      <path className="sydney-illustration__cloud sydney-illustration__cloud--near" d="M937 249 C1087 144 1329 167 1538 290 C1318 294 1117 312 937 249 Z" />
      <rect y="368" width="1600" height="250" fill="url(#opera-haze)" opacity="0.46" />

      <g ref={sceneRefs.horizonRef} className="sydney-illustration__horizon">
        <path d="M0 548 L0 474 L42 474 L42 447 L88 447 L88 496 L126 496 L126 412 L165 412 L165 532 L218 532 L218 469 L258 469 L258 442 L306 442 L306 528 L357 528 L357 401 L397 401 L397 497 L441 497 L441 451 L494 451 L494 537 L0 537 Z" fill="#5f848b" opacity="0.54" />
        <path d="M1110 538 L1110 454 L1154 454 L1154 400 L1200 400 L1200 510 L1230 510 L1230 448 L1276 448 L1276 388 L1325 388 L1325 526 L1363 526 L1363 467 L1404 467 L1404 427 L1452 427 L1452 534 Z" fill="#5b7f88" opacity="0.58" />
      </g>

      <g ref={sceneRefs.landmarkRef} className="sydney-illustration__landmark">
        {/* The platform is intentionally wide and low: it is a key silhouette, not an afterthought. */}
        <path d="M 418 671 C 600 637 1125 631 1452 670 L 1399 747 C 1095 712 667 713 451 747 Z" fill="#173137" opacity="0.9" />
        <path d="M 474 648 C 663 613 1145 609 1407 646 L 1450 685 C 1117 654 671 655 429 686 Z" fill="url(#opera-podium)" />
        <path d="M 448 685 C 675 656 1115 657 1428 685 L 1413 710 C 1106 684 689 684 461 711 Z" fill="url(#opera-stone)" />

        {/* Glass foyers sit behind the shells; the fanning mullions are a decisive Opera House detail. */}
        <path d="M 552 649 C 575 529 691 414 812 350 C 830 454 833 564 810 649 Z" fill="url(#opera-glass)" opacity="0.96" />
        <path d="M 825 651 C 854 504 1005 386 1152 303 C 1167 450 1134 568 1076 651 Z" fill="url(#opera-glass)" opacity="0.98" />
        <path d="M 1068 651 C 1113 543 1222 468 1337 430 C 1322 538 1268 612 1211 652 Z" fill="url(#opera-glass)" opacity="0.92" />
        <path d="M 558 648 C 611 564 702 459 807 365 M 590 649 C 637 558 715 465 809 365 M 629 649 C 669 557 730 467 809 365 M 675 649 C 704 555 755 466 810 365 M 834 649 C 892 537 1003 414 1149 317 M 872 650 C 931 536 1031 412 1151 309 M 920 650 C 977 540 1058 414 1152 305 M 972 650 C 1024 546 1085 431 1153 303 M 1083 649 C 1146 555 1229 482 1330 437 M 1124 650 C 1182 561 1247 492 1333 433" fill="none" stroke="#f5dda8" strokeOpacity="0.48" strokeWidth="3.2" />
        <path d="M 557 649 C 735 627 976 627 1329 649" fill="none" stroke="#1b3c46" strokeOpacity="0.86" strokeWidth="9" />
        <path d="M 562 646 C 758 608 1090 601 1334 638" fill="none" stroke="url(#opera-foyer-glow)" strokeWidth="32" opacity="0.54" filter="url(#opera-glow)" />

        {/* Three groups of interlocking spherical shells, with tiled skins and precast-rib shadows. */}
        {OPERA_SHELLS.map((shell) => <OperaShell key={shell.d} shell={shell} />)}

        <path d="M 466 676 C 690 650 1129 648 1421 677" fill="none" stroke="#f9f6e9" strokeOpacity="0.55" strokeWidth="3" />
        <path d="M 498 696 C 707 671 1093 671 1384 698" fill="none" stroke="#a8c4c3" strokeOpacity="0.4" strokeWidth="2" />
        <path d="M 584 703 L 1326 703 L 1281 739 L 628 739 Z" fill="#233f45" />
        <path d="M 601 710 L 1303 710 M 613 718 L 1292 718 M 626 727 L 1279 727 M 639 736 L 1266 736" fill="none" stroke="#9bb2ae" strokeOpacity="0.38" strokeWidth="2" />
      </g>

      <g ref={sceneRefs.promenadeRef} className="sydney-illustration__promenade">
        <path d="M0 718 C330 685 1130 687 1600 733 L1600 900 L0 900 Z" fill="#17333a" />
        <path d="M0 760 C455 716 1150 728 1600 766" fill="none" stroke="#6b9ca0" strokeOpacity="0.48" strokeWidth="3" />
        <path d="M0 824 C505 773 1112 789 1600 826" fill="none" stroke="#6b9ca0" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M95 900 L302 714 M276 900 L455 708 M470 900 L605 703 M675 900 L774 699 M875 900 L942 700 M1080 900 L1111 706 M1295 900 L1290 712 M1500 900 L1465 722" stroke="#294a51" strokeWidth="3" opacity="0.7" />
        <g className="sydney-illustration__lamps">
          {[295, 495, 1305, 1432].map((x) => <g key={x} transform={`translate(${x} 664)`}><path d="M0 54 V0" stroke="#15343e" strokeWidth="6" /><circle r="10" fill="#ffe1a1" /><circle r="21" fill="#ffe1a1" opacity="0.14" /></g>)}
        </g>
      </g>
    </svg>
  );
}

function PendingIllustration({ destination, loading }: Pick<CinematicLandmarkSceneProps, 'destination' | 'loading'>) {
  return (
    <div className="cinematic-landmark-scene__pending" aria-label={`${destination.landmarkName} cinematic scene`}>
      <div className="cinematic-landmark-scene__pending-sky" />
      <div className="cinematic-landmark-scene__pending-horizon" />
      <p>{loading ? 'Preparing landmark film' : `${destination.landmarkName} · illustrated landmark film in preparation`}</p>
    </div>
  );
}

interface PaintedCitySceneRefs {
  skyRef: RefObject<HTMLDivElement | null>;
  horizonRef: RefObject<HTMLDivElement | null>;
  landmarkRef: RefObject<HTMLDivElement | null>;
  foregroundRef: RefObject<HTMLDivElement | null>;
}

function PaintedCityIllustration({
  destination,
  source,
  sceneRefs,
}: {
  destination: Destination;
  source: string;
  sceneRefs: PaintedCitySceneRefs;
}) {
  const backgroundImage = `url(${source})`;

  return (
    <div className="cinematic-landmark-scene__painted" aria-label={`${destination.landmarkName} illustrated cityscape`}>
      <div
        ref={sceneRefs.skyRef}
        className="cinematic-landmark-scene__painted-plane cinematic-landmark-scene__painted-plane--sky"
        style={{ backgroundImage }}
      />
      <div
        ref={sceneRefs.horizonRef}
        className="cinematic-landmark-scene__painted-plane cinematic-landmark-scene__painted-plane--horizon"
        style={{ backgroundImage }}
      />
      <div className="cinematic-landmark-scene__time-grade" />
      <div className="cinematic-landmark-scene__celestial" aria-hidden="true">
        <span className="cinematic-landmark-scene__moon" />
        <span className="cinematic-landmark-scene__sun" />
      </div>
      <div className="cinematic-landmark-scene__birds" aria-hidden="true">
        {SKY_BIRDS.map((bird) => (
          <span
            key={bird.id}
            className="cinematic-landmark-scene__bird"
            style={{ top: bird.top, animationDelay: bird.delay, animationDuration: bird.duration, '--bird-scale': bird.scale } as CSSProperties}
          >
            <i /><i />
          </span>
        ))}
      </div>
      <div className="cinematic-landmark-scene__painted-glow" />
      <div
        ref={sceneRefs.landmarkRef}
        className="cinematic-landmark-scene__painted-plane cinematic-landmark-scene__painted-plane--landmark"
        style={{ backgroundImage }}
      />
      <div
        ref={sceneRefs.foregroundRef}
        className="cinematic-landmark-scene__painted-plane cinematic-landmark-scene__painted-plane--foreground"
        style={{ backgroundImage }}
      />
      <div className="cinematic-landmark-scene__walkers" aria-hidden="true">
        {PROMENADE_WALKERS.map((walker) => (
          <span
            key={walker.id}
            className="cinematic-landmark-scene__walker"
            style={{ bottom: walker.bottom, animationDelay: walker.delay, animationDuration: walker.duration, '--walker-scale': walker.scale } as CSSProperties}
          >
            <i /><b />
          </span>
        ))}
      </div>
      <div className="cinematic-landmark-scene__painted-vignette" />
    </div>
  );
}

/**
 * A code-native architectural film composition. The landmark is SVG geometry;
 * a single low-resolution WebGL pass adds only atmosphere, not a model or video.
 */
export function CinematicLandmarkScene({ destination, weather, localTime, loading }: CinematicLandmarkSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const skyRef = useRef<SVGSVGElement>(null);
  const horizonRef = useRef<SVGGElement>(null);
  const landmarkRef = useRef<SVGGElement>(null);
  const promenadeRef = useRef<SVGGElement>(null);
  const paintedSkyRef = useRef<HTMLDivElement>(null);
  const paintedHorizonRef = useRef<HTMLDivElement>(null);
  const paintedLandmarkRef = useRef<HTMLDivElement>(null);
  const paintedForegroundRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<ScenePointer>({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const heldRef = useRef(false);
  const [held, setHeld] = useState(false);
  const { canRenderScene, reason: sceneUnavailableReason } = useSceneAvailability();
  const isOperaHouse = destination.landmark === 'opera-house';
  const paintedPlate = PAINTED_CITY_PLATES[destination.key];

  const applyParallax = () => {
    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const motionScale = sceneUnavailableReason === 'reduced-motion' ? 0.16 : 1;
      const x = pointerRef.current.x * motionScale;
      const y = pointerRef.current.y * motionScale;
      const heldScale = heldRef.current ? 1.07 : 1.055;

      // The four planes deliberately travel at different rates. These are
      // concrete pixel transforms (rather than invalid CSS multiplication),
      // batched once per frame without a React render on pointer movement.
      if (skyRef.current) {
        skyRef.current.style.transform = `translate3d(${(-x * 11).toFixed(2)}px, ${(-y * 6).toFixed(2)}px, 0) scale(1.035)`;
      }
      if (horizonRef.current) {
        horizonRef.current.style.transform = `translate3d(${(-x * 27).toFixed(2)}px, ${(-y * 9).toFixed(2)}px, 0)`;
      }
      if (landmarkRef.current) {
        landmarkRef.current.style.transform = `translate3d(${(-x * 51).toFixed(2)}px, ${(-y * 16 - (heldRef.current ? 8 : 0)).toFixed(2)}px, 0) scale(${heldScale})`;
      }
      if (promenadeRef.current) {
        promenadeRef.current.style.transform = `translate3d(${(x * 94).toFixed(2)}px, ${(y * 31).toFixed(2)}px, 0) scale(1.045)`;
      }
      if (paintedSkyRef.current) {
        paintedSkyRef.current.style.transform = `translate3d(${(-x * 2).toFixed(2)}px, ${(-y * 1).toFixed(2)}px, 0) scale(1.055)`;
      }
      if (paintedHorizonRef.current) {
        paintedHorizonRef.current.style.transform = 'translate3d(0, 0, 0) scale(1.055)';
      }
      if (paintedLandmarkRef.current) {
        paintedLandmarkRef.current.style.transform = `translate3d(${(-x * 7).toFixed(2)}px, ${(-y * 3 - (heldRef.current ? 4 : 0)).toFixed(2)}px, 0) scale(${heldScale})`;
      }
      if (paintedForegroundRef.current) {
        paintedForegroundRef.current.style.transform = `translate3d(${(x * 11).toFixed(2)}px, ${(y * 4).toFixed(2)}px, 0) scale(1.055)`;
      }
    });
  };

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  const setScenePointer = (clientX: number, clientY: number, target?: HTMLDivElement) => {
    const root = rootRef.current;
    if (!root) return;

    const bounds = boundsRef.current ?? target?.getBoundingClientRect() ?? root.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((clientX - bounds.left) / bounds.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((clientY - bounds.top) / bounds.height - 0.5) * 2));
    pointerRef.current.x = x;
    pointerRef.current.y = y;
    applyParallax();
  };

  const moveScene = (event: PointerEvent<HTMLDivElement>) => {
    setScenePointer(event.clientX, event.clientY, event.currentTarget);
  };

  const resetScene = () => {
    const root = rootRef.current;
    if (!root) return;
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
    applyParallax();
  };

  return (
    <div
      ref={rootRef}
      className={`cinematic-landmark-scene cinematic-landmark-scene--vector ${paintedPlate ? 'cinematic-landmark-scene--painted' : ''} ${held ? 'is-held' : ''}`}
      style={{
        '--scene-deep': destination.deep,
        '--scene-sky': destination.sky,
        '--scene-glow': destination.glow,
        '--scene-daylight': localTime.dayPhase.toFixed(3),
        '--scene-golden': localTime.goldenPhase.toFixed(3),
      } as CSSProperties}
      onPointerEnter={(event) => { boundsRef.current = event.currentTarget.getBoundingClientRect(); }}
      onPointerMove={moveScene}
      onPointerLeave={resetScene}
    >
      {canRenderScene ? (
        <GlobeErrorBoundary fallback={null}>
          <ShaderAtmosphere destination={destination} weather={weather} localTime={localTime} pointerRef={pointerRef} />
        </GlobeErrorBoundary>
      ) : null}
      {paintedPlate ? (
        <PaintedCityIllustration
          destination={destination}
          source={paintedPlate}
          sceneRefs={{
            skyRef: paintedSkyRef,
            horizonRef: paintedHorizonRef,
            landmarkRef: paintedLandmarkRef,
            foregroundRef: paintedForegroundRef,
          }}
        />
      ) : isOperaHouse ? (
        <SydneyOperaIllustration dayPhase={localTime.dayPhase} sceneRefs={{ skyRef, horizonRef, landmarkRef, promenadeRef }} />
      ) : <PendingIllustration destination={destination} loading={loading} />}
      <WeatherLayer weather={weather} />
      <button
        type="button"
        className="cinematic-landmark-scene__hotspot"
        aria-label={`Focus ${destination.landmarkName}`}
        aria-pressed={held}
        onClick={() => setHeld((value) => {
          const nextValue = !value;
          heldRef.current = nextValue;
          applyParallax();
          return nextValue;
        })}
        onFocus={() => rootRef.current?.classList.add('is-focused')}
        onBlur={() => rootRef.current?.classList.remove('is-focused')}
      />
      <p className="cinematic-landmark-scene__credit">{paintedPlate ? `Original ${destination.name} city illustration` : `Illustrated ${destination.landmarkName}`} · {localTime.clock} local</p>
    </div>
  );
}
