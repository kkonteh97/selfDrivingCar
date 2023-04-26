import "./index.css";
import {createRoot} from "react-dom/client";
import React, {Suspense, useEffect, useMemo, useRef, useState} from "react";
import {
    PerspectiveCamera,
    OrbitControls,
    Sky,
    useGLTF,
    Stats
} from '@react-three/drei';
import {Canvas, useLoader, useThree} from "@react-three/fiber";
import {Car} from "./Car";
import {Physics, Debug, useConvexPolyhedron, usePlane, useBox} from "@react-three/cannon";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {Geometry} from "three-stdlib";
function Ground() {
    usePlane(
        () => ({
                type: 'Static',
                rotation: [-Math.PI / 2, 0, 0],
                position: [0, 0, 0],
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
function toConvexProps(bufferGeometry) {
    const geo = new Geometry().fromBufferGeometry(bufferGeometry);
    // Merge duplicate vertices resulting from glTF export.
    // Cannon assumes contiguous, closed meshes to work
    geo.mergeVertices();
    return [geo.vertices.map((v) => [v.x, v.y, v.z]), geo.faces.map((f) => [f.a, f.b, f.c]), []]; // prettier-ignore
}
const debug = false;

function ColliderBox({ position, scale }) {
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

useGLTF.preload(process.env.PUBLIC_URL + '/models/untitled3.glb');
function Track({position, rotation, scale}) {
    const {nodes} = useLoader(
        GLTFLoader,
        process.env.PUBLIC_URL + '/models/untitled3.glb');
    const geometry = nodes.Cube.geometry;
    return (
        <>
            <mesh
                geometry={geometry}
                position={position}
                rotation={rotation}
                scale={scale}
                userData={{ isRelevant: true }}
                >
                <meshStandardMaterial
                    attach="material"
                    color="red"
                    roughness={0.5}
                    metalness={0.5}
                />
            </mesh>

        </>
    );
}


function Scene() {
    const [thirdPerson, setThirdPerson] = useState(false);
    const [cameraPosition, setCameraPosition] = useState([-6, 3.9, 6.21]);
    return (
        <>
            <PerspectiveCamera
                position={cameraPosition}
                fov={60}
                near={1}
                far={100}
                makeDefault
            >
                <pointLight position={[0, 0, 0]}/>
            </PerspectiveCamera>
            <OrbitControls Target={[0, 0, 0]}/>
            <Ground/>
            <Car/>
            <Stats/>
            <Track position={[0, 0, -3]} rotation={[0, 0, 0]} scale={[1, 1, 1]}/>
        </>
    );
}
 function App() {
    return (
        <>
                <Sky sunPosition={[100, 10, 100]} scale={1000}/>
                <ambientLight intensity={0.1}/>
                <Suspense fallback={null}>
                    <Physics gravity={[0, -2.6, 0]} broadphase="SAP" allowSleep>
                        <Debug color="black" scale={1}>
                            <Scene/>
                        </Debug>
                    </Physics>
                </Suspense>

        </>
    );
}

createRoot(document.getElementById("root")).render(            <Canvas dpr={[1, 1.5]} shadows camera={{position: [0, 7, 12.21], fov: 60}}>
    <App/></Canvas>);