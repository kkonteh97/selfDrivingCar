import {useBox, useRaycastVehicle} from "@react-three/cannon";
import {useFrame, useLoader} from "@react-three/fiber";
import React, {useEffect, useRef, useState} from "react";
import {BufferGeometry, Line, LineBasicMaterial, Quaternion, Raycaster, Vector3} from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {useControls} from "./useControls";
import {NeuralNetwork} from "./NeuralNetwork";
import {useWheels} from "./useWheels";

export function Car({ brain, position}) {
    // thanks to the_86_guy!
    // https://sketchfab.com/3d-models/low-poly-car-muscle-car-2-ac23acdb0bd54ab38ea72008f3312861
    let result = useLoader(
        GLTFLoader,
        process.env.PUBLIC_URL + "/models/car.glb"
    ).scene;
    const width = 0.15;
    const height = 0.07;
    const front = 0.15;
    const wheelRadius = 0.05;

    const chassisBodyArgs = [width, height, front * 2];
    const [chassisBody, chassisApi] = useBox(
        () => ({
            allowSleep: false,
            args: chassisBodyArgs,
            mass: 150,
            position,
            collisionFilterGroup: 1,
            collisionFilterMask: 2,
        }),
        useRef(null),
    );
    const [wheels, wheelInfos] = useWheels(width, height, front, wheelRadius);

    const [vehicle, vehicleApi] = useRaycastVehicle(
        () => ({
            chassisBody,
            wheelInfos,
            wheels,
        }),
        useRef(null),
    );
    const controls = useControls("KEYS");
    const [forward, setForward] = useState(false);
    const [backward, setBackward] = useState(false);
    const [left, setLeft] = useState(false);
    const [right, setRight] = useState(false);

    const rayDistances = new Array(5).fill(0);
    const [damage, setDamage] = useState(false);

    useFrame((state) => {
        let position = new Vector3(0, 0, 0);
        position.setFromMatrixPosition(chassisBody.current.matrixWorld);

        let quaternion = new Quaternion(0, 0, 0, 0);
        quaternion.setFromRotationMatrix(chassisBody.current.matrixWorld);

        let wDir = new Vector3(0,0,1);
        wDir.applyQuaternion(quaternion);
        wDir.normalize();

        state.camera.lookAt(position);
    });
    useFrame((state) => {
        const relevantObjects = state.scene.children.filter((obj) => obj.userData.isRelevant);
        const numRays = 5; // set the number of rays to cast
        const rayLength = 1.5; // set the length of the rays
        const rayAngle = Math.PI / 6; // set the angle between the rays

        for (let i = 0; i < numRays; i++) {
            const raycaster = new Raycaster();
            const position = new Vector3();
            position.setFromMatrixPosition(chassisBody.current.matrixWorld);
            const quaternion = new Quaternion();
            quaternion.setFromRotationMatrix(chassisBody.current.matrixWorld);

            const wDir = new Vector3(0, 0, -1);
            wDir.applyQuaternion(quaternion);
            const direction = wDir.clone();
            direction.applyAxisAngle(new Vector3(0, 1, 0), (i - (numRays - 1) / 2) * rayAngle);
            raycaster.ray.origin.copy(position);
            raycaster.ray.direction.copy(direction);
            raycaster.ray.direction.normalize();
            raycaster.ray.direction.multiplyScalar(rayLength);
            // cast ray and check for intersection
            const intersects = raycaster.intersectObjects(relevantObjects);
            if (intersects.length > 0 && intersects[0].distance < rayLength) {
                const intersection = intersects[0].point.clone();

                // create two line segments with different colors
                const points1 = [position.clone(), intersection.clone()];
                const points2 = [intersection.clone(), raycaster.ray.origin.clone().add(raycaster.ray.direction)];
                const geometry1 = new BufferGeometry().setFromPoints(points1);
                const geometry2 = new BufferGeometry().setFromPoints(points2);
                const material1 = new LineBasicMaterial({color: 0xff0000});
                const material2 = new LineBasicMaterial({color: 0x000000});
                const line1 = new Line(geometry1, material1);
                const line2 = new Line(geometry2, material2);
                state.scene.add(line1, line2);
                // calculate the distance between each ray and the intersection point
                const distance = raycaster.ray.origin.distanceTo(intersection);
                rayDistances[i] = distance;
                if (distance < 0.1) {
                    setDamage(true);
                }

                // remove lines after a delay
                setTimeout(() => {
                    state.scene.remove(line1, line2);
                }, 10);
            } else {
                // visualize entire ray in red if no intersection
                const points = [position.clone(), raycaster.ray.origin.clone().add(raycaster.ray.direction)];
                const geometry = new BufferGeometry().setFromPoints(points);
                const material = new LineBasicMaterial({color: 0xff0000});
                const line = new Line(geometry, material);
                state.scene.add(line);

                // remove line after a delay
                setTimeout(() => {
                    state.scene.remove(line);
                }, 10);
            }
        }
        if (damage) {
            // freeze the car if it is damaged
            chassisApi.velocity.set(0, 0, 0);
            chassisApi.angularVelocity.set(0, 0, 0);
            vehicleApi.setBrake(100, 0);
            vehicleApi.setBrake(100, 1);
            vehicleApi.setBrake(100, 2);
            vehicleApi.setBrake(100, 3);

        } else {
        const outputs=NeuralNetwork.feedForward(rayDistances, brain);
        setForward(outputs[0] >.5)
        setRight(outputs[1] > .5)
        setLeft(outputs[2] > .5)
        setBackward(outputs[3] > .5)

            if (controls.forward || forward){
                vehicleApi.applyEngineForce(150, 2);
                vehicleApi.applyEngineForce(150, 3);
            }else if (controls.backward || backward){
                vehicleApi.applyEngineForce(-100, 2);
                vehicleApi.applyEngineForce(-100, 3);
            } else {
                vehicleApi.applyEngineForce(0, 2);
                vehicleApi.applyEngineForce(0, 3);
            }
            if (controls.left || left){
                vehicleApi.setSteeringValue(0.35, 2);
                vehicleApi.setSteeringValue(0.35, 3);
                vehicleApi.setSteeringValue(-0.1, 0);
                vehicleApi.setSteeringValue(-0.1, 1);
            } else if (controls.right || right){
                vehicleApi.setSteeringValue(-0.35, 2);
                vehicleApi.setSteeringValue(-0.35, 3);
                vehicleApi.setSteeringValue(0.1, 0);
                vehicleApi.setSteeringValue(0.1, 1);
            } else {
                for(let i = 0; i < 4; i++) {
                    vehicleApi.setSteeringValue(0, i);
                }
            }
        }
    });

    useEffect(() => {
        if (!result) return;

        let mesh = result;
        mesh.scale.set(0.0012, 0.0012, 0.0012);

        mesh.children[0].position.set(-365, -18, -67);
    }, [result]);



    return (
        <group ref={vehicle} name="vehicle">
            <group ref={chassisBody} name="chassisBody">
                <primitive object={result} rotation-y={Math.PI} position={[0, -0.09, 0]}/>
                <raycaster/>
            </group>
        </group>
    );
}



