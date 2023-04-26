import React, {Suspense, useRef, useState} from "react";
import {
    PerspectiveCamera,
    Environment,
    OrbitControls, MeshReflectorMaterial
} from '@react-three/drei'
import { useLoader} from "@react-three/fiber";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {TextureLoader} from "three/src/loaders/TextureLoader";
import {Ground} from "./Ground";

function Track() {
    const result = useLoader(
        GLTFLoader,
        process.env.PUBLIC_URL + "/models/gummy_bear.glb"
    );

    let geometry = result.scene.children[0].geometry;

    return (
        <>
            <mesh
                geometry={geometry}
                scale={[2, 2, 2]}
            >
                <meshStandardMaterial
                    color="red"
                    ></meshStandardMaterial>
            </mesh>
        </>


    );
}
function Box() {
    return (
        <mesh>
            <boxBufferGeometry />
            <meshStandardMaterial color="blue" />
        </mesh>
    );
}
export function Scene() {
    const [cameraPosition, setCameraPosition] = useState([-6, 3.9, 6.21]);

    return (
        <Suspense fallback={null}>
            <PerspectiveCamera
            />
            <ambientLight intensity={0.5}/>
            <Environment preset="sunset" background/>
            <OrbitControls target={cameraPosition}/>
        </Suspense>
    );
}