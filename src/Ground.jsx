import { usePlane } from "@react-three/cannon";
import { useRef } from "react";


export function Ground({ position}) {
  const [ref] = usePlane(
    () => ({
      type: 'Static',
      rotation: [-Math.PI / 2, 0, 0],
        position: [0, -.5, 0],
    }

    ),
    useRef(null)
  );
  return (
    <>
        <planeGeometry args={[100, 100]} />
    </>
  );
}
