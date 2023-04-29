import {useBox, useRaycastVehicle} from "@react-three/cannon";
import {useFrame} from "@react-three/fiber";
import React, {useEffect, useRef, useState} from "react";
import {useControls} from "./useControls";
import {NeuralNetwork} from "./NeuralNetwork";
import {useWheels} from "./useWheels";
import {Sensor} from "./Sensor";
import { Quaternion, Raycaster, Vector3} from "three";

export function Car({brain, position, controlsType, carModel,onChassisBodyUpdate, id  }) {
    const width = 0.15;
    const height = 0.07;
    const front = 0.15;
    const wheelRadius = 0.05;
    const [useBrain, setUseBrain] = useState(controlsType === "AI");
    const controls = useControls("KEYS");
    useEffect(() => {
        let mesh = carModel;
        mesh.scale.set(0.0012, 0.0012, 0.0012);
        mesh.children[0].position.set(-365, -18, -67);
    }, [carModel]);

    const chassisBodyArgs = [width, height, front * 2];
    const [chassisBody, chassisApi] = useBox(
        () => ({
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

    const [damage, setDamage] = useState(false);
    let position1 = new Vector3(0, 0, 0);
    let quaternion = new Quaternion(0, 0, 0, 0);
    const numRays = 5; // set the number of rays to cast
    const rayLength = 1.5; // set the length of the rays
    const rayAngle = Math.PI / 6; // set the angle between the rays

    const raycaster = new Raycaster();

    const relevantObjectsRef = useRef([]);
    useFrame((state) => {
        onChassisBodyUpdate(chassisBody, state);
        if (relevantObjectsRef.current.length === 0) {
            relevantObjectsRef.current = state.scene.children.filter((obj) => obj.userData.isRelevant);
        }
        const rayDistances  = Sensor(chassisBody, state, position1, quaternion, raycaster, numRays, rayLength, rayAngle, relevantObjectsRef.current);
        const outputs = NeuralNetwork.feedForward(rayDistances, brain);

        if (useBrain) {
            controls.forward =  outputs[0] > .5
            controls.backward = outputs[1] > .5
            controls.left = outputs[2] > .5
            controls.right = outputs[3] > .5
        }

        if (controls.forward) {
            vehicleApi.applyEngineForce(150, 2);
            vehicleApi.applyEngineForce(150, 3);
        } else if (controls.backward ) {
            vehicleApi.applyEngineForce(-100, 2);
            vehicleApi.applyEngineForce(-100, 3);
        } else {
            vehicleApi.applyEngineForce(0, 2);
            vehicleApi.applyEngineForce(0, 3);
        }
        if (controls.left) {
            vehicleApi.setSteeringValue(0.35, 2);
            vehicleApi.setSteeringValue(0.35, 3);
        } else if (controls.right) {
            vehicleApi.setSteeringValue(-0.35, 2);
            vehicleApi.setSteeringValue(-0.35, 3);
        } else {
            for (let i = 0; i < 4; i++) {
                vehicleApi.setSteeringValue(0, i);
            }

        }
    });
    return (
        <group ref={vehicle} name={`vehicle-${id}`}>
            <group ref={chassisBody} name={`chassisBody-${id}`}>
                <primitive object={carModel} rotation-y={Math.PI} position={[0, -0.09, 0]}/>
            </group>
        </group>
    );
}

