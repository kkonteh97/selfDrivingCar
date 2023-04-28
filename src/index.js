import "./index.css";
import {createRoot} from "react-dom/client";
import React, {Suspense, useEffect, useRef, useState} from "react";
import {
    OrbitControls,
    Sky,
    Stats
} from '@react-three/drei';
import {Canvas, useFrame, useLoader, useThree} from "@react-three/fiber";
import {Physics, Debug, useBox, useRaycastVehicle} from "@react-three/cannon";
import {Visualizer} from './visualizer';
import {Ground} from "./Ground";
import {Track} from "./Track";
import {NeuralNetwork, mutate} from "./NeuralNetwork";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {Car} from "./Car";

useLoader.preload(GLTFLoader, process.env.PUBLIC_URL + "/models/car.glb");

function Scene({gltfLoader, canvas, brain}) {


    if (localStorage.getItem("bestBrain")) {
        brain = JSON.parse(
            localStorage.getItem("bestBrain")
        );
    }

    const [carModel, setCarModel] = useState(null);
    const [carModel2, setCarModel2] = useState(null);


    useEffect(() => {
        const loader = new GLTFLoader();
        gltfLoader.load(process.env.PUBLIC_URL + "/models/car.glb", (gltf) => {
            setCarModel(gltf.scene);
            setCarModel2(gltf.scene.clone());
        });
    }, []);
    const chassisBodyRef = useRef();

    const N = 1;
    const cars = [];


    for (let i = 0; i < N; i++) {
        if (i === 0) {
            cars[i] = (<Car
                key={i}
                position={[-10, 0.1, 3]}
                rotation={[0, Math.PI, 0]}
                scale={[1, 1, 1]}
                brain={brain}
                controlsType={'AI'}
                carModel={carModel}
                chassisBodyRef={chassisBodyRef}
            />);
        } else {
            const mutatedBrain = NeuralNetwork.mutate(brain, 0.1);
            cars[i] = (<Car
                key={i}
                position={[-10, 0.1, 3]}
                rotation={[0, Math.PI, 0]}
                scale={[1, 1, 1]}
                brain={mutatedBrain}
                controlsType={'AI'}
                carModel={carModel2}
            />);
        }
    }
    const saveButton = document.getElementById("saveButton");
    saveButton.addEventListener("click", () => {
        localStorage.setItem("bestBrain", JSON.stringify(brain));
    });

    function animate(time) {
        const context = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 350;
        context.lineDashOffset = -time / 50;
        Visualizer.drawNetwork(context, brain);
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    if (!carModel) {
        return null;
    }
    return (
        <>
            <OrbitControls/>
            <Ground/>
            {cars}
            <Stats/>
            <Track position={[0, 0, -3]} rotation={[0, 0, 0]} scale={[1, 1, 1]}/>
        </>
    );
}





function App() {
    let brain = new NeuralNetwork(
        [5, 6, 4]
    );
    const [gltfLoader, setGltfLoader] = useState(new GLTFLoader());
    const [canvas, setCanvas] = useState(document.getElementById('myCanvas'));
    useEffect(() => {
        setGltfLoader(new GLTFLoader());
        setCanvas(document.getElementById('myCanvas'));
    }, []);
    return (
        <>
            <Sky sunPosition={[100, 10, 100]} scale={100}/>
            <ambientLight intensity={0.1}/>
            <Suspense fallback={null}>
                <Physics gravity={[0, -2.6, 0]} broadphase="SAP" allowSleep>
                    <Debug color="black" scale={1}>
                        <Scene
                            gltfLoader={gltfLoader}
                            canvas={canvas}
                            brain={brain}

                        />
                    </Debug>
                </Physics>
            </Suspense>
        </>

    );
}


function discard() {
    localStorage.removeItem("bestBrain");
}

createRoot(document.getElementById("root")).render(
    <>
        <Canvas>
            <App/>
        </Canvas>
        <canvas id="myCanvas"/>
        <div className="verticalButtons">
            <button
                id="saveButton"
            >💾
            </button>
            <button onClick={discard}>🗑️</button>
        </div>
    </>
);