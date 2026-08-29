import { useEffect, useRef, useState, type PointerEvent, type Ref } from 'react';
import type { Destination } from '../data/destinations';
import type { WeatherAtmosphere } from '../hooks/useCurrentWeather';

type Landmark =
  | 'marina-bay'
  | 'opera-house'
  | 'melbourne-spire'
  | 'canton-tower'
  | 'victoria-harbour'
  | 'taipei-101'
  | 'skytree'
  | 'osaka-castle'
  | 'namsan'
  | 'gwangan-bridge'
  | 'cruise'
  | 'metropolis';

type Landscape = 'harbour' | 'river' | 'mountain' | 'canal' | 'ocean' | 'city';
type Foliage = 'garden' | 'eucalyptus' | 'bamboo' | 'maple' | 'pine' | 'coastal';

interface IllustrationProfile {
  landmark: Landmark;
  label: string;
  landscape: Landscape;
  foliage: Foliage;
  moonX: number;
  photo: string;
}

const cityIllustrations: Record<string, IllustrationProfile> = {
  singapore: { landmark: 'marina-bay', label: 'Marina Bay Sands', landscape: 'harbour', foliage: 'garden', moonX: 720, photo: 'https://images.unsplash.com/photo-1628933978021-818a464f9f5d?auto=format&fit=crop&w=2200&q=86' },
  sydney: { landmark: 'opera-house', label: 'Sydney Opera House', landscape: 'harbour', foliage: 'eucalyptus', moonX: 682, photo: 'https://images.unsplash.com/photo-1490443849367-d12c30dbf95c?auto=format&fit=crop&w=2200&q=86' },
  melbourne: { landmark: 'melbourne-spire', label: 'Melbourne Arts Centre Spire', landscape: 'river', foliage: 'eucalyptus', moonX: 676, photo: 'https://commons.wikimedia.org/wiki/Special:FilePath/ACM%20Spire%20in%20blue.jpg?width=1800' },
  guangzhou: { landmark: 'canton-tower', label: 'Canton Tower', landscape: 'river', foliage: 'bamboo', moonX: 706, photo: 'https://images.unsplash.com/photo-1663428697529-a91da288bc04?auto=format&fit=crop&w=2200&q=86' },
  'hong-kong': { landmark: 'victoria-harbour', label: 'Victoria Harbour skyline', landscape: 'mountain', foliage: 'bamboo', moonX: 178, photo: 'https://images.unsplash.com/photo-1559697147-19a08abf5e32?auto=format&fit=crop&w=2200&q=86' },
  taipei: { landmark: 'taipei-101', label: 'Taipei 101', landscape: 'mountain', foliage: 'bamboo', moonX: 694, photo: 'https://images.unsplash.com/photo-1599578705716-8d3d9246f53b?auto=format&fit=crop&w=2200&q=86' },
  tokyo: { landmark: 'skytree', label: 'Tokyo Skytree', landscape: 'city', foliage: 'maple', moonX: 716, photo: 'https://images.unsplash.com/photo-1768711353256-bb39d942e764?auto=format&fit=crop&w=2200&q=86' },
  osaka: { landmark: 'osaka-castle', label: 'Osaka Castle', landscape: 'canal', foliage: 'maple', moonX: 170, photo: 'https://images.unsplash.com/photo-1742702330015-519532be721a?auto=format&fit=crop&w=2200&q=86' },
  seoul: { landmark: 'namsan', label: 'N Seoul Tower', landscape: 'mountain', foliage: 'pine', moonX: 701, photo: 'https://images.unsplash.com/photo-1645451350581-2aebd3932286?auto=format&fit=crop&w=2200&q=86' },
  busan: { landmark: 'gwangan-bridge', label: 'Gwangan Bridge', landscape: 'harbour', foliage: 'coastal', moonX: 682, photo: 'https://images.unsplash.com/photo-1655829184043-34819d7dfeb6?auto=format&fit=crop&w=2200&q=86' },
  'disney-cruise': { landmark: 'cruise', label: 'Disney Cruise liner', landscape: 'ocean', foliage: 'coastal', moonX: 690, photo: 'https://images.unsplash.com/photo-1541850393501-daef64bdccd9?auto=format&fit=crop&w=2200&q=86' },
  metropolis: { landmark: 'metropolis', label: 'City skyline', landscape: 'city', foliage: 'garden', moonX: 710, photo: 'https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?auto=format&fit=crop&w=2200&q=86' },
};

const fallbackIllustration: IllustrationProfile = cityIllustrations.metropolis;
const skyline = [
  [32, 312, 34], [74, 271, 56], [141, 335, 34], [185, 245, 48], [242, 305, 32], [636, 294, 50], [695, 248, 38], [744, 322, 46], [802, 274, 40], [850, 312, 36],
] as const;
const weatherParticles = Array.from({ length: 16 }, (_, index) => index);

function WeatherOverlay({ atmosphere, isDaytime }: { atmosphere: WeatherAtmosphere; isDaytime: boolean }) {
  const hasParticles = atmosphere === 'rain' || atmosphere === 'snow' || atmosphere === 'storm';

  return (
    <div className={`weather-overlay weather-overlay--${atmosphere} weather-overlay--${isDaytime ? 'day' : 'night'}`} aria-hidden="true">
      <div className="weather-overlay__sky-motion"><span /><span /><span /></div>
      {atmosphere === 'clear' ? <span className="weather-overlay__sun" /> : null}
      <div className="weather-overlay__clouds"><span /><span /><span /></div>
      {hasParticles ? (
        <div className="weather-overlay__particles">
          {weatherParticles.map((index) => (
            <i
              key={index}
              style={{
                '--weather-left': `${(index * 37 + 9) % 101}%`,
                '--weather-delay': `${-((index * 0.37) % 2)}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      ) : null}
      {atmosphere === 'mist' ? <div className="weather-overlay__mist"><span /><span /><span /></div> : null}
      {atmosphere === 'wind' ? <div className="weather-overlay__wind"><span /><span /><span /></div> : null}
      {atmosphere === 'storm' ? <div className="weather-overlay__lightning"><span /><span /></div> : null}
    </div>
  );
}

function Backdrop({ landscape, destination, waterId, elementRef }: { landscape: Landscape; destination: Destination; waterId: string; elementRef: Ref<SVGGElement> }) {
  const mountain = landscape === 'mountain';
  const water = landscape === 'harbour' || landscape === 'river' || landscape === 'canal' || landscape === 'ocean';
  return <g ref={elementRef} className="country-illustration__backdrop">
    {mountain ? <path className="country-illustration__mountains" d="M0 354L74 286l55 45 62-98 72 111 63-54 60 59 77-142 70 122 65-72 69 107 68-69 79 95v170H0Z" fill={destination.deep} opacity="0.78" /> : null}
    <g className="country-illustration__skyline" opacity={landscape === 'ocean' ? 0.22 : 0.47}>
      {skyline.map(([x, y, width], index) => <rect key={index} x={x} y={y} width={width} height={430 - y} rx="2" fill={destination.deep} />)}
    </g>
    {water ? <path className="country-illustration__water" d="M0 442C91 404 177 478 263 440S426 405 512 442s173 42 258 0 130-12 130-12v170H0Z" fill={`url(#${waterId})`} /> : null}
    {!water ? <path d="M0 458C128 432 214 491 342 458s236-18 350 2 157 3 208-6v146H0Z" fill={destination.deep} opacity="0.92" /> : null}
  </g>;
}

function SceneSky({ destination, moonX, skyId, starsId, moonId, daySkyId, isDaytime }: { destination: Destination; moonX: number; skyId: string; starsId: string; moonId: string; daySkyId: string; isDaytime: boolean }) {
  if (isDaytime) {
    return <>
      <rect width="900" height="600" fill={`url(#${daySkyId})`} />
      <circle cx={moonX} cy="126" r="52" fill="#fff4c4" opacity="0.92" />
      <circle cx={moonX} cy="126" r="91" fill="#fff1bd" opacity="0.12" />
      <path d="M0 300C155 267 288 289 410 255s294 0 490-38v148H0Z" fill="#d7eff1" opacity="0.24" />
    </>;
  }

  return <>
    <rect width="900" height="600" fill="#03060b" />
    <rect width="900" height="600" fill={`url(#${skyId})`} />
    <rect width="900" height="600" fill={`url(#${starsId})`} opacity="0.76" />
    <ellipse className="country-illustration__moon-aura" cx={moonX} cy="137" rx="168" ry="151" fill={`url(#${moonId})`} />
    <circle className="country-illustration__moon" cx={moonX} cy="137" r="53" fill="#f5d7af" />
    <circle cx={moonX - 15} cy="120" r="8" fill="#c5997d" opacity="0.21" />
    <circle cx={moonX + 17} cy="151" r="12" fill="#c5997d" opacity="0.16" />
    <path d="M0 282C162 252 260 270 402 243s286-8 498-32v123H0Z" fill={destination.deep} opacity="0.2" />
  </>;
}

function Foreground({ foliage, glow, accent, water, elementRef }: { foliage: Foliage; glow: string; accent: string; water: boolean; elementRef: Ref<SVGGElement> }) {
  const botanical = foliage === 'bamboo'
    ? <><path d="M42 600c-4-120 22-202 52-295M90 600c-3-150 31-234 72-333M822 600c10-118-16-202-42-275" /><path d="m48 360 47-30m-36-17 50-23m-19 90 47-31m657 25-45-30m38 86-55-36" /></>
    : foliage === 'maple'
      ? <><path d="M0 600c35-98 72-177 151-250M900 600c-44-113-88-184-171-251" /><path d="m41 454 53-36m-12-26 55-36m-77 128 64-36m701 3-58-43m14-35-57-37m105 128-62-37" /></>
      : foliage === 'pine'
        ? <><path d="M0 600 83 337l31 263M900 600l-74-282-33 282" /><path d="m18 493 73-81m-61 132 68-72m739 25-65-86m80 130-74-71" /></>
        : <><path d="M0 600c29-122 74-203 152-272M900 600c-35-130-84-207-165-280" /><path d="m13 493 86-88m-42 34 87-70m-92 144 107-79m691 57-97-92m57 32-87-74m91 143-107-79" /></>;

  return <g ref={elementRef} className={`country-illustration__foreground country-illustration__foreground--${foliage}`}>
    {water ? <g className="country-illustration__reflections" stroke={glow} opacity="0.34"><path d="M297 466h306M250 495h370M322 526h260M378 555h176" /></g> : null}
    <g className="country-illustration__branches" fill="none" stroke={accent} strokeWidth="10" strokeLinecap="round" opacity="0.82">{botanical}</g>
    <g className="country-illustration__fireflies" fill={glow}>
      <circle cx="161" cy="427" r="3" /><circle cx="239" cy="506" r="2" /><circle cx="762" cy="434" r="3" /><circle cx="697" cy="521" r="2" /><circle cx="104" cy="538" r="2" />
    </g>
  </g>;
}

function MarinaBaySands({ accent, glow, deep }: { accent: string; glow: string; deep: string }) {
  return <>
    <path d="M304 430V198c1-36 39-44 47-6l10 238ZM404 430V170c2-43 42-45 49 0l9 260ZM504 430V193c2-39 43-41 49-1l8 238Z" fill={deep} stroke={accent} strokeWidth="5" />
    <path d="M280 173c77-23 212-25 302-2l-8 27c-83-14-200-13-286 3Z" fill={accent} />
    <path d="M610 429c3-48 42-75 84-65 37 9 51 37 66 65Z" fill={accent} opacity="0.82" />
    <path d="M649 410c11-28 26-45 41-45 21 0 31 21 40 45" fill="none" stroke={glow} strokeWidth="3" />
  </>;
}

function OperaHouse({ accent, glow, deep }: { accent: string; glow: string; deep: string }) {
  return <>
    <path d="M250 432c11-105 72-173 154-192-38 65-52 129-55 192Z" fill={accent} />
    <path d="M350 432c17-140 86-218 176-242-45 79-61 160-65 242Z" fill={glow} />
    <path d="M478 432c19-111 81-170 149-191-31 62-44 127-43 191Z" fill={accent} />
    <path d="M206 432h475l37 30H180Z" fill={deep} stroke={accent} strokeWidth="3" />
  </>;
}

function MelbourneSpire({ accent, glow, deep }: { accent: string; glow: string; deep: string }) {
  return <>
    <path d="M451 438 459 140 486 438Z" fill={deep} stroke={accent} strokeWidth="4" />
    <path d="M460 142 483 438M469 242 450 331M475 296 492 382M455 278 487 206M456 363 488 290" fill="none" stroke={glow} strokeWidth="3" />
    <path d="M360 438V315h164v123Z" fill={deep} stroke={accent} strokeWidth="3" />
    <path d="M312 438c34-77 87-108 150-108 69 0 123 37 154 108Z" fill={accent} opacity="0.46" />
  </>;
}

function CantonTower({ accent, glow, deep }: { accent: string; glow: string; deep: string }) {
  return <>
    <path d="M429 438c4-102 34-183 71-235 43 52 66 133 69 235Z" fill={deep} stroke={accent} strokeWidth="5" />
    <ellipse cx="499" cy="269" rx="70" ry="104" fill="none" stroke={glow} strokeWidth="5" />
    <path d="M475 192 499 89l24 103M499 89v-47" fill="none" stroke={accent} strokeWidth="5" />
    <path d="M450 322h99M441 361h118" stroke={glow} strokeWidth="3" opacity="0.78" />
  </>;
}

function VictoriaHarbour({ accent, glow, deep }: { accent: string; glow: string; deep: string }) {
  return <>
    <path d="M336 438V195l51-74v317ZM399 438V271l58-55v222ZM480 438V154l46 60v224ZM541 438V232l62-89v295Z" fill={deep} stroke={accent} strokeWidth="4" />
    <path d="m346 202 32 27m-32 21 32 28m-32 20 32 29m114-157 27 33m-27 19 27 34m-27 20 27 34m38-72 42-52m-42 82 42-52" stroke={glow} strokeWidth="3" opacity="0.72" />
    <path d="M271 438c23-73 69-112 134-117M587 438c22-64 58-101 113-115" fill="none" stroke={accent} strokeWidth="4" />
  </>;
}

function Taipei101({ accent, glow, deep }: { accent: string; glow: string; deep: string }) {
  return <>
    {Array.from({ length: 8 }, (_, index) => {
      const width = 157 - index * 15;
      const x = 450 - width * 0.5;
      const y = 414 - index * 38;
      return <path key={index} d={`M${x} ${y + 38}h${width}l-9-10v-18l9-10H${x}l9 10v18Z`} fill={index % 2 ? accent : deep} stroke={glow} strokeWidth="2" />;
    })}
    <path d="M450 105v-53m0 53 14 37h-28Z" fill={accent} stroke={glow} strokeWidth="3" />
  </>;
}

function Skytree({ accent, glow, deep }: { accent: string; glow: string; deep: string }) {
  return <>
    <path d="M426 438 450 84l25 354Z" fill={deep} stroke={accent} strokeWidth="5" />
    <path d="M405 282h90l-9 24h-72ZM417 204h67l-7 22h-53Z" fill={accent} />
    <path d="M432 393 469 119m-38 239 42-175m-34 105 29-69" stroke={glow} strokeWidth="3" />
  </>;
}

function OsakaCastle({ accent, glow, deep }: { accent: string; glow: string; deep: string }) {
  return <>
    <path d="M305 438h300l-25-47H331ZM337 385h235l-18-45H355ZM367 340h172l-16-43H383ZM397 296h113l-14-40h-84Z" fill={deep} stroke={accent} strokeWidth="4" />
    <path d="M288 391c44-14 89-13 135 0 49-13 99-13 150 0 49-13 95-13 139 0M338 343c31-13 62-13 95 0 34-13 68-13 103 0" fill="none" stroke={glow} strokeWidth="7" />
    <path d="M446 256h9v-64h-9Z" fill={accent} />
  </>;
}

function NamsanTower({ accent, glow, deep }: { accent: string; glow: string; deep: string }) {
  return <>
    <path d="M235 438c58-119 139-177 215-177s160 58 218 177Z" fill={deep} stroke={accent} strokeWidth="3" />
    <path d="M433 306h34l-6-170h-22ZM421 309h58v28h-58Z" fill={accent} stroke={glow} strokeWidth="3" />
    <path d="M450 136V82" stroke={glow} strokeWidth="5" />
  </>;
}

function GwanganBridge({ accent, glow, deep }: { accent: string; glow: string; deep: string }) {
  return <>
    <path d="M123 438h654" stroke={deep} strokeWidth="21" />
    <path d="M138 430h625" stroke={accent} strokeWidth="5" />
    <path d="M260 430V224h22v206M618 430V224h22v206" fill={deep} stroke={accent} strokeWidth="4" />
    <path d="M137 430c68-148 157-190 235-115 50 48 101 48 156 0 78-75 167-33 236 115" fill="none" stroke={glow} strokeWidth="5" />
    <path d="m202 399 58-113m35 80 72-65m193 63 71-67m38 100 57-113" stroke={accent} strokeWidth="3" opacity="0.75" />
  </>;
}

function Cruise({ accent, glow, deep }: { accent: string; glow: string; deep: string }) {
  return <>
    <path d="M190 371h531l-48 59H243Z" fill={deep} stroke={accent} strokeWidth="4" />
    <path d="M273 369v-110h332l45 110Z" fill="#e6f2ef" stroke={accent} strokeWidth="4" />
    <path d="M346 260v-71h173v71M383 189v-37h97v37" fill={accent} stroke={glow} strokeWidth="3" />
    {Array.from({ length: 9 }, (_, index) => <rect key={index} x={300 + index * 35} y="299" width="18" height="12" rx="2" fill={deep} stroke={glow} strokeWidth="2" />)}
  </>;
}

function Metropolis({ accent, glow, deep }: { accent: string; glow: string; deep: string }) {
  return <>
    <path d="M287 438V273h89v165ZM390 438V167h115v271ZM521 438V236h95v202Z" fill={deep} stroke={accent} strokeWidth="4" />
    <path d="M448 167V86" stroke={glow} strokeWidth="5" />
  </>;
}

function LandmarkShape({ landmark, accent, glow, deep }: { landmark: Landmark; accent: string; glow: string; deep: string }) {
  if (landmark === 'marina-bay') return <MarinaBaySands accent={accent} glow={glow} deep={deep} />;
  if (landmark === 'opera-house') return <OperaHouse accent={accent} glow={glow} deep={deep} />;
  if (landmark === 'melbourne-spire') return <MelbourneSpire accent={accent} glow={glow} deep={deep} />;
  if (landmark === 'canton-tower') return <CantonTower accent={accent} glow={glow} deep={deep} />;
  if (landmark === 'victoria-harbour') return <VictoriaHarbour accent={accent} glow={glow} deep={deep} />;
  if (landmark === 'taipei-101') return <Taipei101 accent={accent} glow={glow} deep={deep} />;
  if (landmark === 'skytree') return <Skytree accent={accent} glow={glow} deep={deep} />;
  if (landmark === 'osaka-castle') return <OsakaCastle accent={accent} glow={glow} deep={deep} />;
  if (landmark === 'namsan') return <NamsanTower accent={accent} glow={glow} deep={deep} />;
  if (landmark === 'gwangan-bridge') return <GwanganBridge accent={accent} glow={glow} deep={deep} />;
  if (landmark === 'cruise') return <Cruise accent={accent} glow={glow} deep={deep} />;
  return <Metropolis accent={accent} glow={glow} deep={deep} />;
}

export function CountryIllustration({ destination, atmosphere, isDaytime = false }: { destination: Destination; atmosphere?: WeatherAtmosphere; isDaytime?: boolean }) {
  const profile = cityIllustrations[destination.illustrationKey ?? destination.key] ?? fallbackIllustration;
  const frame = useRef<HTMLButtonElement>(null);
  const bounds = useRef<DOMRect | null>(null);
  const backdropRef = useRef<SVGGElement>(null);
  const landmarkRef = useRef<SVGGElement>(null);
  const foregroundRef = useRef<SVGGElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState(false);
  const id = destination.key.replaceAll(/[^a-z0-9]/gi, '');
  const waterId = `water-${id}`;
  const skyId = `sky-${id}`;
  const daySkyId = `day-sky-${id}`;
  const moonId = `moon-${id}`;
  const starsId = `stars-${id}`;
  const glowId = `glow-${id}`;
  const photoToneId = `photo-tone-${id}`;
  const photoVignetteId = `photo-vignette-${id}`;
  const hasWater = profile.landscape === 'harbour' || profile.landscape === 'river' || profile.landscape === 'canal' || profile.landscape === 'ocean';

  const setScenePosition = (x: number, y: number) => {
    if (backdropRef.current) backdropRef.current.style.transform = `translate(${(x * -4).toFixed(1)}px, ${(y * -2).toFixed(1)}px)`;
    if (landmarkRef.current) {
      const scale = landmarkRef.current.classList.contains('country-illustration__photo-plane') ? ' scale(1.045)' : '';
      landmarkRef.current.style.transform = `translate(${(x * 11).toFixed(1)}px, ${(y * 7).toFixed(1)}px)${scale}`;
    }
    if (foregroundRef.current) foregroundRef.current.style.transform = `translate(${(x * 20).toFixed(1)}px, ${(y * 12).toFixed(1)}px)`;
  };

  const queueScenePosition = (x: number, y: number) => {
    pendingPointerRef.current = { x, y };
    if (animationFrameRef.current !== null) return;
    animationFrameRef.current = window.requestAnimationFrame(() => {
      const pointer = pendingPointerRef.current;
      animationFrameRef.current = null;
      if (pointer) setScenePosition(pointer.x, pointer.y);
    });
  };

  const resetPosition = () => {
    pendingPointerRef.current = null;
    if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    setScenePosition(0, 0);
  };

  useEffect(() => () => {
    if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
    bounds.current = event.currentTarget.getBoundingClientRect();
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const box = bounds.current;
    if (!box) return;
    const x = ((event.clientX - box.left) / box.width - 0.5) * 2;
    const y = ((event.clientY - box.top) / box.height - 0.5) * 2;
    queueScenePosition(x, y);
  };

  return <div className={`country-illustration${isDaytime ? ' country-illustration--day' : ''}`} aria-hidden="false">
    <button
      ref={frame}
      className="country-illustration__frame"
      type="button"
      style={{ '--destination-accent': destination.accent, '--destination-glow': destination.glow } as React.CSSProperties}
      aria-label={`Explore the ${profile.label} illustration`}
      aria-pressed={selected}
      onClick={() => setSelected((value) => !value)}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPosition}
      onPointerCancel={resetPosition}
      onBlur={resetPosition}
    >
      <svg className="country-illustration__svg" viewBox="0 0 900 600" role="img" aria-label={`${profile.label} illustrated skyline`}>
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0.65" y2="1"><stop stopColor="#050914" /><stop offset="0.52" stopColor={destination.sky} stopOpacity="0.48" /><stop offset="1" stopColor={destination.deep} stopOpacity="0.98" /></linearGradient>
          <linearGradient id={daySkyId} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9edcf2" /><stop offset="0.54" stopColor={destination.sky} stopOpacity="0.72" /><stop offset="1" stopColor="#e1f4e8" /></linearGradient>
          <linearGradient id={waterId} x1="0" y1="0" x2="0" y2="1"><stop stopColor={destination.sky} stopOpacity="0.4" /><stop offset="1" stopColor="#03070c" stopOpacity="0.98" /></linearGradient>
          <linearGradient id={photoToneId} x1="0" y1="0" x2="0.8" y2="1"><stop stopColor="#01050e" stopOpacity="0.14" /><stop offset="0.55" stopColor={destination.deep} stopOpacity="0.28" /><stop offset="1" stopColor="#02050a" stopOpacity="0.84" /></linearGradient>
          <radialGradient id={photoVignetteId} cx="61%" cy="42%" r="72%"><stop offset="0.36" stopColor="#000000" stopOpacity="0" /><stop offset="1" stopColor="#000000" stopOpacity="0.68" /></radialGradient>
          <radialGradient id={moonId}><stop stopColor={destination.glow} stopOpacity="0.42" /><stop offset="0.36" stopColor={destination.accent} stopOpacity="0.12" /><stop offset="1" stopColor="#02040a" stopOpacity="0" /></radialGradient>
          <pattern id={starsId} width="113" height="101" patternUnits="userSpaceOnUse"><circle cx="12" cy="16" r="0.85" fill="#f7e5c8" /><circle cx="56" cy="27" r="0.62" fill="#f7e5c8" /><circle cx="88" cy="9" r="1" fill="#fff1da" /><circle cx="102" cy="72" r="0.65" fill="#fff1da" /><circle cx="37" cy="81" r="0.6" fill="#f7e5c8" /></pattern>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="13" /></filter>
        </defs>
        {profile.photo ? <g ref={landmarkRef} className="country-illustration__photo-plane">
          <image href={profile.photo} x="0" y="0" width="900" height="600" preserveAspectRatio="xMidYMid slice" />
          <rect width="900" height="600" fill={`url(#${photoToneId})`} />
          <rect width="900" height="600" fill={`url(#${photoVignetteId})`} />
        </g> : <>
          <SceneSky destination={destination} moonX={profile.moonX} skyId={skyId} starsId={starsId} moonId={moonId} daySkyId={daySkyId} isDaytime={isDaytime} />
          <Backdrop landscape={profile.landscape} destination={destination} waterId={waterId} elementRef={backdropRef} />
          <g className="country-illustration__landmark-aura" filter={`url(#${glowId})`} opacity="0.31">
            <LandmarkShape landmark={profile.landmark} accent={destination.glow} glow={destination.glow} deep={destination.glow} />
          </g>
          <g ref={landmarkRef} className="country-illustration__landmark">
            <LandmarkShape landmark={profile.landmark} accent={destination.accent} glow={destination.glow} deep={destination.deep} />
          </g>
        </>}
        <Foreground foliage={profile.foliage} glow={destination.glow} accent={destination.accent} water={hasWater} elementRef={foregroundRef} />
      </svg>
      <WeatherOverlay atmosphere={atmosphere ?? 'cloudy'} isDaytime={isDaytime} />
      <span className="country-illustration__label"><b>{profile.label}</b><i>{selected ? 'Focused light · click to release' : 'Move your pointer or tap to explore'}</i></span>
    </button>
  </div>;
}
