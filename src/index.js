import "./index.css";
import {createRoot} from "react-dom/client";
import React, {Suspense, useEffect, useState} from "react";
import {
    PerspectiveCamera,
    OrbitControls,
    Sky,
    Stats
} from '@react-three/drei';
import {Canvas} from "@react-three/fiber";
import {Car} from "./Car";
import {Physics, Debug} from "@react-three/cannon";
import {Geometry} from "three-stdlib";
import {Visualizer} from './visualizer';
import {Ground} from "./Ground";
import {Track} from "./Track";
import {NeuralNetwork, mutate} from "./NeuralNetwork";

let brain = new NeuralNetwork(
    [5,6,4]
);
if (localStorage.getItem("bestBrain")) {
    brain = JSON.parse(
        localStorage.getItem("bestBrain")
    );
}
function Scene() {

    const [thirdPerson, setThirdPerson] = useState(false);
    const [cameraPosition, setCameraPosition] = useState([-6, 3.9, 6.21]);

    useEffect(() => {
        function keydownHandler(e) {
            if (e.key === "k") {
                // random is necessary to trigger a state change
                if(thirdPerson) setCameraPosition([-6, 3.9, 6.21 + Math.random() * 0.01]);
                setThirdPerson(!thirdPerson);
            }
        }

        window.addEventListener("keydown", keydownHandler);
        return () => window.removeEventListener("keydown", keydownHandler);
    }, [thirdPerson]);

    const canvas = document.getElementById('myCanvas');
    const N = 2;
    const cars = [];
    for(let i=0;i<N;i++){
        if(i===0 && brain){
             cars.push(<Car
                key={i}
                position={[-10, 0.5, 1]}
                rotation={[0, Math.PI, 0]}
                scale={[1, 1, 1]}
                brain={brain}
            />);
        }else{
            const Mutated = mutate(brain,0.5);
            cars.push(<Car
                key={i}
                position={[-10, 0.5, 3]}
                rotation={[0, Math.PI, 0]}
                scale={[1, 1, 1]}
                brain={Mutated}
            />);
        }
    }



    function animate(time){
        const context = canvas.getContext('2d');
        canvas.width=300;
        canvas.height=350;
        context.lineDashOffset = -time / 50;
        Visualizer.drawNetwork(context,brain);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    return (
        <>
            <PerspectiveCamera makeDefault position={cameraPosition} fov={40} />
            {!thirdPerson && (
                <OrbitControls target={[-2.64, -0.71, 0.03]} />
            )}
            <Ground/>
            {cars}
            <Stats/>
            <Track position={[0, 0, -3]} rotation={[0, 0, 0]} scale={[1, 1, 1]}/>
        </>
    );
}
function App() {

    return (
        <Canvas dpr={[1, 1.5]} shadows camera={{position: [0, 7, 12.21], fov: 60}}>

        <Sky sunPosition={[100, 10, 100]} scale={1000}/>
            <ambientLight intensity={0.1}/>

            <Suspense fallback={null}>
                <Physics gravity={[0, -2.6, 0]} broadphase="SAP" allowSleep>
                    <Debug color="black" scale={1}>
                        <Scene/>
                    </Debug>
                </Physics>
            </Suspense>

        </Canvas>
    );
}


function save(){
    localStorage.setItem("bestBrain",JSON.stringify(brain));
}
function discard(){
    localStorage.removeItem("bestBrain");
}

createRoot(document.getElementById("root")).render(
    <>
        <App/>
        <canvas id="myCanvas" />
        <div className="verticalButtons">
            <button
                onClick={save}
            >💾</button>
            <button onClick={discard}>🗑️</button>
        </div>
    </>
);