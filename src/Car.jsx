import {useBox, useCompoundBody, useRaycastVehicle, useRaycastAll, useRaycastAny} from "@react-three/cannon";
import {useFrame, useLoader, useThree} from "@react-three/fiber";
import React, {useEffect, useRef, useState} from "react";
import {BufferGeometry, Color, Line, LineBasicMaterial, Quaternion, Raycaster, Vector3} from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";

function useWheels(width, height, front, radius) {
    const wheels = [useRef(null), useRef(null), useRef(null), useRef(null)];


    const wheelInfo = {
        radius,
        directionLocal: [0, -1, 0],
        axleLocal: [1, 0, 0],
        suspensionStiffness: 60,
        suspensionRestLength: 0.1,
        frictionSlip: 5,
        dampingRelaxation: 2.3,
        dampingCompression: 4.4,
        maxSuspensionForce: 100000,
        rollInfluence: 0.01,
        maxSuspensionTravel: 0.1,
        customSlidingRotationalSpeed: -30,
        useCustomSlidingRotationalSpeed: true,
    };

    const wheelInfos = [
        {
            ...wheelInfo,
            chassisConnectionPointLocal: [-width * 0.65, height * 0.4, front],
            isFrontWheel: true,
        },
        {
            ...wheelInfo,
            chassisConnectionPointLocal: [width * 0.65, height * 0.4, front],
            isFrontWheel: true,
        },
        {
            ...wheelInfo,
            chassisConnectionPointLocal: [-width * 0.65, height * 0.4, -front],
            isFrontWheel: false,
        },
        {
            ...wheelInfo,
            chassisConnectionPointLocal: [width * 0.65, height * 0.4, -front],
            isFrontWheel: false,
        },
    ];

    const propsFunc = () => ({
        collisionFilterGroup: 0,
        mass: 1,
        shapes: [
            {
                args: [wheelInfo.radius, wheelInfo.radius, 0.015, 16],
                rotation: [0, 0, -Math.PI / 2],
                type: "Cylinder",
            },
        ],
        type: "Kinematic",
    });

    useCompoundBody(propsFunc, wheels[0]);
    useCompoundBody(propsFunc, wheels[1]);
    useCompoundBody(propsFunc, wheels[2]);
    useCompoundBody(propsFunc, wheels[3]);

    return [wheels, wheelInfos];
};

export function Car() {
    // thanks to the_86_guy!
    // https://sketchfab.com/3d-models/low-poly-car-muscle-car-2-ac23acdb0bd54ab38ea72008f3312861
    let result = useLoader(
        GLTFLoader,
        process.env.PUBLIC_URL + "/models/car.glb"
    ).scene;


    const position = [-1.5, 0.5, 3];
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
    const brain = new NeuralNetwork(
        [5,6,4]
    )

    const rayDistances = new Array(5).fill(0);
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
        const outputs=NeuralNetwork.feedForward(rayDistances, brain);
        setForward(outputs[0] >.5)
        setRight(outputs[1] > .5)
        setLeft(outputs[1] > .5)
        setBackward(outputs[1] > .5)
        console.log(outputs)

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
function useControls(type) {
    const [forward, setForward] = useState(false);
    const [backward, setBackward] = useState(false);
    const [left, setLeft] = useState(false);
    const [right, setRight] = useState(false);

    useEffect(() => {
        const addKeyboardListeners = () => {
            const handleKeyDown = (event) => {
                switch (event.key) {
                    case 'ArrowUp':
                        setForward(true);
                        break;
                    case 'ArrowDown':
                        setBackward(true);
                        break;
                    case 'ArrowLeft':
                        setLeft(true);
                        break;
                    case 'ArrowRight':
                        setRight(true);
                        break;
                    default:
                        break;
                }
            };

            const handleKeyUp = (event) => {
                switch (event.key) {
                    case 'ArrowUp':
                        setForward(false);
                        break;
                    case 'ArrowDown':
                        setBackward(false);
                        break;
                    case 'ArrowLeft':
                        setLeft(false);
                        break;
                    case 'ArrowRight':
                        setRight(false);
                        break;
                    default:
                        break;
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('keyup', handleKeyUp);
            };
        };

        switch (type) {
            case 'KEYS':
                addKeyboardListeners();
                break;
            default:
                break;
        }
    }, []);

    return {
        forward,
        backward,
        left,
        right,
    };
}
class NeuralNetwork {
    constructor(neuronCounts) {
        this.levels = [];
        for (let i = 0; i < neuronCounts.length - 1; i++) {
            this.levels.push(new Level(
                neuronCounts[i], neuronCounts[i+1]
            ));
        }
    }

    static feedForward(givenInputs, network) {
        let outputs = Level.feedForward(
            givenInputs, network.levels[0]
        );
        for (let i = 1; i < network.levels.length; i++) {
            outputs = Level.feedForward(
                outputs, network.levels[i]
            );
        }
        return outputs;
    }
}

class Level {
    constructor(inputCount, outputCount) {
        this.inputs = new Array(inputCount);
        this.outputs = new Array(outputCount);
        this.biases = new Array(outputCount);

        this.weights = [];
        for (let i = 0; i < inputCount; i++) {
            this.weights[i] = new Array(outputCount);
        }

        Level.randomize(this);
    }

    static randomize(level) {
        for (let i = 0; i < level.inputs.length; i++) {
            for (let j = 0; j < level.outputs.length; j++) {
                level.weights[i][j] = Math.random() * 2 - 1;
            }
        }

        for (let i = 0; i < level.biases.length; i++) {
            level.biases[i] = Math.random() * 2 - 1;
        }
    }

    static feedForward(givenInputs, level) {
        for (let i = 0; i < level.inputs.length; i++) {
            level.inputs[i] = givenInputs[i];
        }

        for (let i = 0; i < level.outputs.length; i++) {
            let sum = 0;
            for (let j = 0; j < level.inputs.length; j++) {
                sum += level.inputs[j] * level.weights[j][i];
            }

            if (sum > level.biases[i]) {
                level.outputs[i] = 1;
            } else {
                level.outputs[i] = 0;
            }
        }

        return level.outputs;
    }
}