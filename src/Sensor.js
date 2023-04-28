import {BufferGeometry, Line, LineBasicMaterial, Quaternion, Raycaster, Vector3} from "three";
import {useFrame} from "@react-three/fiber";

export function Sensor(chassisBody, state) {
    let position = new Vector3(0, 0, 0);
    let quaternion = new Quaternion(0, 0, 0, 0);
    const numRays = 5; // set the number of rays to cast
    const rayLength = 1.5; // set the length of the rays
    const rayAngle = Math.PI / 6; // set the angle between the rays
    const rayDistances = new Array(5).fill(0);
    position.setFromMatrixPosition(chassisBody.current.matrixWorld);
    quaternion.setFromRotationMatrix(chassisBody.current.matrixWorld);
    const raycaster = new Raycaster();
    const relevantObjects = state.scene.children.filter((obj) => obj.userData.isRelevant);
    for (let i = 0; i < numRays; i++) {


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
            const distance = 1 - raycaster.ray.origin.distanceTo(intersection)/ rayLength;
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
    return [rayDistances, relevantObjects];

}