import React, {useRef, useEffect} from "react";
import {useLoader} from "@react-three/fiber";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {TextureLoader, MeshBasicMaterial} from "three";
import {useFrame} from "@react-three/fiber";

import { useBox } from "@react-three/cannon";
import {useGLTF} from "@react-three/drei";

const debug = false;

useGLTF.preload(process.env.PUBLIC_URL + '/models/untitled3.glb');
export function Track({position, rotation, scale}) {
    const {nodes} = useLoader(
        GLTFLoader,
        process.env.PUBLIC_URL + '/models/untitled3.glb');
    const geometry1 = nodes.Plane.geometry;
    const geometry2 = nodes.Plane001.geometry;
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
                    color="black"
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
                    color="black"
                    roughness={0.5}
                    metalness={0.5}
                />
            </mesh>

        </>
    );
}