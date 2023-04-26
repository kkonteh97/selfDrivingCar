import React, {useRef, useEffect} from "react";
import {useLoader} from "@react-three/fiber";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {TextureLoader, MeshBasicMaterial} from "three";
import {useFrame} from "@react-three/fiber";

import { useBox } from "@react-three/cannon";

const debug = false;


export function Track() {
    const trackRef = useRef();
    useFrame(() => {
        // Manipulate the track element in some way
        trackRef.current.rotation.y += 0.01;
    });
    const result = useLoader(
        GLTFLoader,
        process.env.PUBLIC_URL + "/models/gummy_bear.glb"
    );


    let geometry = result.scene.children[0].geometry;

    return (
        <>
            <mesh
                geometry={geometry}
                ref={trackRef}
            />
            <meshStandardMaterial
                attach="material"
                color="white"
                roughness={0.5}
                metalness={0.5}
            />
        </>


    );
}