import {useBox, useRaycastVehicle} from "@react-three/cannon";
import {useFrame} from "@react-three/fiber";
import React, {useRef, useState} from "react";
import {useControls} from "./useControls";
import {NeuralNetwork} from "./NeuralNetwork";
import {useWheels} from "./useWheels";
import {Sensor} from "./Sensor";
import {Box3} from "three";

export function Car({brain, position, controlsType, carModel}) {
    const width = 0.15;
    const height = 0.07;
    const front = 0.15;
    const wheelRadius = 0.05;
    const [useBrain, setUseBrain] = useState(controlsType === "AI");
    const controls = useControls("KEYS");
    let mesh = carModel;
    mesh.scale.set(0.0012, 0.0012, 0.0012);
    mesh.children[0].position.set(-365, -18, -67);

    const chassisBodyArgs = [width, height, front * 2];
    const [chassisBody, chassisApi] = useBox(() => ({
            allowSleep: false,
            args: chassisBodyArgs,
            mass: 150,
            position: position,
            collisionFilterGroup: 1,
            collisionFilterMask: 0,
        }),
        useRef(null),
    );

    const [wheels, wheelInfos] = useWheels(width, height, front, wheelRadius);
    const [vehicle, vehicleApi] = useRaycastVehicle(() => ({
            chassisBody,
            wheelInfos,
            wheels,
            position: [0, 0, 0],
        }),
        useRef(null),
    );
    const [forward, setForward] = useState(false);
    const [backward, setBackward] = useState(false);
    const [left, setLeft] = useState(false);
    const [right, setRight] = useState(false);

    const [damage, setDamage] = useState(false);


    useFrame((state) => {
        const [rayDistances, relevantObjects] = Sensor(chassisBody, state);
        const outputs = NeuralNetwork.feedForward(rayDistances, brain);

        // loop through relevant objects and if intersects with car, set damage to true
        for (let i = 0; i < relevantObjects.length; i++) {
            const object = relevantObjects[i];
            const box = new Box3().setFromObject(object);
            const carBox = new Box3().setFromObject(mesh);
            if (box.intersectsBox(carBox)) {
                setDamage(true);
            }
        }
        if (useBrain) {
            setForward(outputs[0] > .5)
            setRight(outputs[1] > .5)
            setLeft(outputs[2] > .5)
            setBackward(outputs[3] > .5)
        }

        if (controls.forward || forward) {
            vehicleApi.applyEngineForce(150, 2);
            vehicleApi.applyEngineForce(150, 3);
        } else if (controls.backward || backward) {
            vehicleApi.applyEngineForce(-100, 2);
            vehicleApi.applyEngineForce(-100, 3);
        } else {
            vehicleApi.applyEngineForce(0, 2);
            vehicleApi.applyEngineForce(0, 3);
        }
        if (controls.left || left) {
            vehicleApi.setSteeringValue(0.35, 2);
            vehicleApi.setSteeringValue(0.35, 3);
            vehicleApi.setSteeringValue(-0.1, 0);
            vehicleApi.setSteeringValue(-0.1, 1);
        } else if (controls.right || right) {
            vehicleApi.setSteeringValue(-0.35, 2);
            vehicleApi.setSteeringValue(-0.35, 3);
            vehicleApi.setSteeringValue(0.1, 0);
            vehicleApi.setSteeringValue(0.1, 1);
        } else {
            for (let i = 0; i < 4; i++) {
                vehicleApi.setSteeringValue(0, i);
            }

        }
    });


    return (
        <group ref={vehicle} name="vehicle">
            <group ref={chassisBody} name="chassisBody">
                <primitive object={carModel} rotation-y={Math.PI} position={[0, -0.09, 0]}/>
            </group>
        </group>
    );
}

