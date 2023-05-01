import React from "react";
import {useGLTF} from "@react-three/drei";
import { useTrimesh } from "@react-three/cannon";
useGLTF.preload(process.env.PUBLIC_URL + '/models/untitled3.glb');

export function Track({position, rotation, scale}) {

    const result = useGLTF(process.env.PUBLIC_URL + '/models/untitled3.glb');
    const geometry1 = result.scene.children[2].geometry;
    const vertices1 = geometry1.attributes.position.array;
    const indices1 = geometry1.index.array;
    const geometry2 = result.scene.children[3].geometry;
    const vertices2 = geometry1.attributes.position.array;
    const indices2 = geometry1.index.array;
    const [ref1] = useTrimesh(() => ({
        mass: 0,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        args: [vertices1, indices1],
        collisionFilterGroup: 2,
        userData: {isRelevant: true}
    }));
    const [ref2] = useTrimesh(() => ({
        mass: 0,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        args: [vertices2, indices2],
        collisionFilterGroup: 2,
        userData: {isRelevant: true}
    }));

    return (
        <>
            <mesh
                ref={ref1}
                geometry={geometry1}
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
            <mesh
                ref={ref2}
                geometry={geometry2}
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