import { destinations } from '../data/destinations';

interface StaticAtlasProps {
  loading?: boolean;
  selectedKey: string;
}

/**
 * Convincing non-WebGL fallback: a radial teal globe with a faint lat/long
 * grid, dashed gold routes, and pins for at least two destinations.
 */
export function StaticAtlas({ loading = false, selectedKey }: StaticAtlasProps) {
  const pins = destinations.filter((destination) => destination.primary).slice(0, 4);
  const selected = destinations.find((destination) => destination.key === selectedKey);

  return (
    <div className="static-atlas" role="img" aria-label="Stylised static travel atlas">
      <div className="static-atlas__orb">
        <svg viewBox="0 0 400 400" className="static-atlas__grid" aria-hidden="true">
          <defs>
            <radialGradient id="atlas-orb" cx="35%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#1f5852" />
              <stop offset="55%" stopColor="#0c3634" />
              <stop offset="100%" stopColor="#051a1b" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="196" fill="url(#atlas-orb)" stroke="#ffffff26" strokeWidth="1" />
          {Array.from({ length: 7 }).map((_, index) => (
            <ellipse
              key={`lat-${index}`}
              cx="200"
              cy="200"
              rx={196}
              ry={196 - index * 26 === 0 ? 4 : Math.abs(196 - index * 56)}
              fill="none"
              stroke="#f7f0e51f"
              strokeWidth="0.75"
            />
          ))}
          {Array.from({ length: 6 }).map((_, index) => (
            <ellipse
              key={`lng-${index}`}
              cx="200"
              cy="200"
              rx={Math.abs(196 * Math.cos((index * Math.PI) / 6)) || 2}
              ry="196"
              fill="none"
              stroke="#f7f0e51f"
              strokeWidth="0.75"
            />
          ))}
          {pins.map((destination, index) => {
            const angle = (index / pins.length) * Math.PI * 2 - Math.PI / 2;
            const x = 200 + Math.cos(angle) * 118;
            const y = 200 + Math.sin(angle) * 118;
            const isSelected = destination.key === selectedKey || destination.key === selected?.key;
            return (
              <g key={destination.key}>
                {index > 0 && (
                  <line
                    x1={200 + Math.cos(angle - 0.9) * 118}
                    y1={200 + Math.sin(angle - 0.9) * 118}
                    x2={x}
                    y2={y}
                    stroke="#efbf8394"
                    strokeWidth="1.4"
                    strokeDasharray="3 6"
                    strokeLinecap="round"
                  />
                )}
                <circle cx={x} cy={y} r={isSelected ? 7 : 4.5} fill={destination.accent} opacity={isSelected ? 1 : 0.75} />
                {isSelected && (
                  <circle cx={x} cy={y} r="12" fill="none" stroke={destination.accent} strokeWidth="1" opacity="0.6" />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="static-atlas__caption">
        {loading ? 'Loading the interactive travel globe' : 'Stylised static travel atlas'}
      </p>
    </div>
  );
}
