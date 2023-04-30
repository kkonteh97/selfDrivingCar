import React from "react";
import {useGLTF} from "@react-three/drei";
import { useTrimesh } from "@react-three/cannon";
useGLTF.preload(process.env.PUBLIC_URL + '/models/untitled3.glb');

export function Track({position, rotation, scale}) {

    const result = useGLTF(process.env.PUBLIC_URL + '/models/untitled3.glb');
    const geometry = result.scene.children[2].geometry;
    const vertices = geometry.attributes.position.array;
    const indices = geometry.index.array;
    const [ref1] = useTrimesh(() => ({
        mass: 0,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        args: [vertices, indices],
        collisionFilterGroup: 2,
        userData: {isRelevant: true}
    }));

    return (
        <>
            <mesh
                ref={ref1}
                geometry={geometry}
                position={position}
                rotation={rotation}
                scale={scale}
                userData={{isRelevant: true}}
            >
                <meshStandardMaterial
                    attach="material"
                    color="blue"
                    roughness={0.5}
                    metalness={0.5}
                />
            </mesh>
        </>
    );
}