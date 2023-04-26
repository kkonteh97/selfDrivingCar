import { useBox } from "@react-three/cannon";

const debug = false;

export function ColliderBox({ position, scale }) {
  useBox(() => ({
    args: scale,
    position,
    type: "Static",
  }));


  return (
    debug && (
      <mesh position={position} userData={{ isRelevant: true }}>
        <boxGeometry args={scale} />
        <meshBasicMaterial transparent={true} opacity={0.25} />
      </mesh>
    )
  );
}
