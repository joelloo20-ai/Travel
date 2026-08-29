import { useGlobeAvailability } from '../hooks/useGlobeAvailability';
import { Globe } from './Globe';
import { StaticAtlas } from './StaticAtlas';

interface GlobeStageProps {
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function GlobeStage({ selectedKey, onSelect }: GlobeStageProps) {
  const { canRenderGlobe } = useGlobeAvailability();

  return (
    <div className="globe-footprint">
      {canRenderGlobe ? (
        <Globe selectedKey={selectedKey} onSelect={onSelect} />
      ) : (
        <StaticAtlas selectedKey={selectedKey} />
      )}
    </div>
  );
}
