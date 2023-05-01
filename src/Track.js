import React from "react";
import {useGLTF} from "@react-three/drei";
useGLTF.preload(process.env.PUBLIC_URL + '/models/untitled3.glb');

export function Track({position, rotation, scale}) {

    const result = useGLTF(process.env.PUBLIC_URL + '/models/untitled3.glb');
    const geometry1 = result.scene.children[2].geometry;
    const geometry2 = result.scene.children[3].geometry;


    return (
        <>
            <mesh
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