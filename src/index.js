import "./index.css";
import {createRoot} from "react-dom/client";
import React, {Suspense, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Sky, Stats} from '@react-three/drei';
import {Canvas, useLoader, useThree} from "@react-three/fiber";
import {Debug, Physics} from "@react-three/cannon";
import {Visualizer} from './visualizer';
import {Ground} from "./Ground";
import {Track} from "./Track";
import {NeuralNetwork} from "./NeuralNetwork";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {Car} from "./Car";
import {Quaternion, Vector3} from "three";

useLoader.preload(GLTFLoader, process.env.PUBLIC_URL + "/models/car.glb");


function Scene({gltfLoader, canvas}) {
    let brain;
    brain = new NeuralNetwork(
        [5, 6, 4]
    );
    const [carModel, setCarModel] = useState(null);
    const [carModel2, setCarModel2] = useState(null);
    if (localStorage.getItem("bestBrain")) {
        brain = JSON.parse(
            localStorage.getItem("bestBrain")
        );
    }
    const {camera} = useThree();
    const positionRef = useRef(new Vector3(0, 0, 0));
    const quaternionRef = useRef(new Quaternion(0, 0, 0, 0));
    const wDirRef = useRef(new Vector3(0, 0, 1));

    useEffect(() => {
        gltfLoader.load(process.env.PUBLIC_URL + "/models/car.glb", (gltf) => {
            setCarModel(gltf.scene);
            setCarModel2(gltf.scene.clone());
        });
    }, [gltfLoader]);

    const N = 2
    const [carStatus, setCarStatus] = useState(Array(N).fill(true));
    const cars = useMemo(() => {
        const result = [];
        for (let i = 0; i < N; i++) {
            if (i===0){
                result.push(
                    <Car
                        key={i}
                        position={[-10, 0.1, 3]}
                        rotation={[0, Math.PI, 0]}
                        brain={brain}
                        controlsType="AI"
                        carModel={carModel}
                        id={i}
                        distance={0}
                        onChassisBodyUpdate={(chassisBody, distance, damage) => handleCarChassisApiUpdate(chassisBody, distance, damage,i)}
                    />
                );
            } else {
                const mutatedBrain = NeuralNetwork.mutate(brain, 0.1)
                result.push(
                    <Car
                        key={i}
                        position={[-10, 0.1, 3]}
                        rotation={[0, Math.PI, 0]}
                        brain={mutatedBrain}
                        controlsType="Keys"
                        carModel={carModel2}
                        id={i}
                        distance={0}
                        onChassisBodyUpdate={(chassisBody, distance, damage) => handleCarChassisApiUpdate(chassisBody, distance,damage, i)}
                    />
                );
            }
        }
        return result;
    }, [brain, carModel, carModel2]);

    let bestDistance = useRef(0);
    const [activeCar, setActiveCar] = useState(0);
    useEffect(() => {
        // Check if the active car has been removed
        if (!carStatus[activeCar]) {
            // Find the next active car
            const nextActiveCar = carStatus.findIndex((status) => status === true);
            // If there is a next active car, set it as the active car
            if (nextActiveCar !== -1) {
                setActiveCar(nextActiveCar);
            }
        }
    }, [carStatus, activeCar]);
    const handleCarChassisApiUpdate = useCallback((chassisBody, distance,damage, carId) => {
        if (distance > bestDistance.current) {
            bestDistance.current = distance;
            setActiveCar(carId);
        }
        // remove car if damage is true
        if (damage) {
            setCarStatus(prevStatus => {
                const newStatus = [...prevStatus];
                newStatus[carId] = false;
                return newStatus;
            });
            if (carId === activeCar) {
                const nextActiveCar = carStatus.findIndex((status) => status === true);
                if (nextActiveCar !== -1) {
                    setActiveCar(nextActiveCar);
                }
            }
        }
        if (carId === activeCar) {
            positionRef.current.setFromMatrixPosition(chassisBody.current.matrixWorld);
            quaternionRef.current.setFromRotationMatrix(chassisBody.current.matrixWorld);

        }



       wDirRef.current.set(0, 0, 1).applyQuaternion(quaternionRef.current);
        const offset = new Vector3(0, .2, 0);
        let cameraPosition = positionRef.current.clone().add(wDirRef.current.clone().multiplyScalar(1).add(offset));
        wDirRef.current.add(new Vector3(0, 0.2, 0));
        camera.position.copy(cameraPosition)
        camera.lookAt(positionRef.current)
    }, [camera]);
    useEffect(() => {
        const saveButton = document.getElementById("saveButton");
        const handleSaveClick = () => {
            localStorage.setItem("bestBrain", JSON.stringify(brain));
        };
        saveButton.addEventListener("click", handleSaveClick);
        return () => saveButton.removeEventListener("click", handleSaveClick);
    }, [brain]);
    const activeCars = useMemo(() => {
        return cars.filter((_, i) => carStatus[i]);
    }, [cars, carStatus]);

    const contextRef = useRef(null);
    useEffect(() => {
        contextRef.current = canvas.getContext("2d");
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
            <primitive object={camera} />
            <Ground/>
            {activeCars}
            <Stats/>
            <Track position={[0, 0, -3]} rotation={[0, 0, 0]} scale={[1, 1, 1]}/>
        </>
    );
}

function App() {

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