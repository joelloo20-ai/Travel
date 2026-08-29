import { useSceneAvailability } from '../hooks/useSceneAvailability';
import { Globe } from './Globe';
import { StaticAtlas } from './StaticAtlas';

interface GlobeStageProps {
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function GlobeStage({ selectedKey, onSelect }: GlobeStageProps) {
  const { canRenderScene } = useSceneAvailability();

  return (
    <div className="globe-footprint">
      {canRenderScene ? (
        <Globe selectedKey={selectedKey} onSelect={onSelect} />
      ) : (
        <StaticAtlas selectedKey={selectedKey} />
      )}
    </div>
  );
}
