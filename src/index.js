import "./index.css";
import {createRoot} from "react-dom/client";
import React, {Suspense, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    OrbitControls, PerspectiveCamera,
    Sky,
    Stats
} from '@react-three/drei';
import {Canvas, useFrame, useLoader, useThree} from "@react-three/fiber";
import {Physics, Debug, useBox, useRaycastVehicle} from "@react-three/cannon";
import {Visualizer} from './visualizer';
import {Ground} from "./Ground";
import {Track} from "./Track";
import {NeuralNetwork} from "./NeuralNetwork";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {Car} from "./Car";
import {useControls} from "./useControls";
import {Vector3, Quaternion, Euler} from "three";

useLoader.preload(GLTFLoader, process.env.PUBLIC_URL + "/models/car.glb");


function Scene({gltfLoader, canvas, brain}) {
    const [carModel, setCarModel] = useState(null);
    const [carModel2, setCarModel2] = useState(null);
    if (localStorage.getItem("bestBrain")) {
        brain = JSON.parse(
            localStorage.getItem("bestBrain")
        );
    }
    // camera
    const {camera} = useThree();
    const positionRef = useRef(new Vector3(0, 0, 0));
    const quaternionRef = useRef(new Quaternion(0, 0, 0, 0));
    const wDirRef = useRef(new Vector3(0, 0, 1));

    const handleCarChassisApiUpdate = useCallback((chassisBody, carId) => {
        if (carId !== 0) return;
        positionRef.current.setFromMatrixPosition(chassisBody.current.matrixWorld);
        quaternionRef.current.setFromRotationMatrix(chassisBody.current.matrixWorld);
        wDirRef.current.set(0, 0, 1).applyQuaternion(quaternionRef.current);
        const offset = new Vector3(0, .2, 0);
        let cameraPosition = positionRef.current.clone().add(wDirRef.current.clone().multiplyScalar(1).add(new Vector3(0, 0.3, 0)));
        wDirRef.current.add(new Vector3(0, 0.2, 0));
        camera.position.copy(cameraPosition)
        camera.lookAt(positionRef.current)
        }, []);

    useEffect(() => {
        gltfLoader.load(process.env.PUBLIC_URL + "/models/car.glb", (gltf) => {
            setCarModel(gltf.scene);
            setCarModel2(gltf.scene.clone());
        });
    }, []);


    const N = 2
    const cars = useMemo(() => {
        const result = [];
        for (let i = 0; i < N; i++) {
            if (i===0){
                result.push(
                    <Car
                        key={i}
                        position={[-10, 0.1, 3]}
                        rotation={[0, Math.PI, 0]}
                        scale={[1, 1, 1]}
                        brain={brain}
                        controlsType="Keys"
                        carModel={carModel}
                        id={i}
                        onChassisBodyUpdate={(chassisBody) => handleCarChassisApiUpdate(chassisBody, i)}
                    />
                );
            } else {
                const mutatedBrain = i === 0 ? brain : NeuralNetwork.mutate(brain, 0.1);
                result.push(
                    <Car
                        key={i}
                        position={[-10, 0.1, 3]}
                        rotation={[0, Math.PI, 0]}
                        scale={[1, 1, 1]}
                        brain={mutatedBrain}
                        controlsType="AI"
                        carModel={carModel2}
                        id={i}
                        onChassisBodyUpdate={(chassisBody) => handleCarChassisApiUpdate(chassisBody, i)}
                    />
                );
            }
        }
        return result;
    }, [brain, carModel, carModel2, handleCarChassisApiUpdate]);

    useEffect(() => {
        const saveButton = document.getElementById("saveButton");
        const handleSaveClick = () => {
            localStorage.setItem("bestBrain", JSON.stringify(brain));
        };
        saveButton.addEventListener("click", handleSaveClick);
        return () => saveButton.removeEventListener("click", handleSaveClick);
    }, [brain]);

    const contextRef = useRef(null);
    useEffect(() => {
        const context = canvas.getContext("2d");
        contextRef.current = context;
        canvas.width = 300;
        canvas.height = 400;
        function animate(time) {
            contextRef.current.lineDashOffset = -time / 50;
            Visualizer.drawNetwork(contextRef.current, brain);
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    }, [brain, canvas]);
    if (!carModel) {
        return null;
    }
    return (
        <>
            //camera
            <primitive object={camera} />
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
                <Physics
                    gravity={[0, -2.6, 0]}
                    broadphase="SAP"
                    defaultContactMaterial={{ friction: 0.4, restitution: 0 }}
                    allowSleep
                    iterations={20}
                    tolerance={0.0001}
                >
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