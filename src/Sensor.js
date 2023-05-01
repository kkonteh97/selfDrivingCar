import {BufferGeometry, Line, LineBasicMaterial, Vector3} from "three";

const lineMaterial = new LineBasicMaterial({color: 0xff0000});
const linePool = [];
export function Sensor(chassisBody, state, position, quaternion, raycaster, numRays,rayLength, rayAngle,relevantObjects) {
    position.setFromMatrixPosition(chassisBody.current.matrixWorld);
    quaternion.setFromRotationMatrix(chassisBody.current.matrixWorld);
    const rayDistances = new Array(5).fill(0);
    let damage = false;
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
            let line = linePool;

            const geometry = new BufferGeometry().setFromPoints([position.clone(), intersection.clone()]);
            line = new Line(geometry, lineMaterial);
            state.scene.add(line);
            rayDistances[i] =   1 - raycaster.ray.origin.distanceTo(intersection) / rayLength;

            if (raycaster.ray.origin.distanceTo(intersection) < 0.1) {
                damage = true;
            }

            //remove line
            linePool.push(line);
            if (linePool.length > 5) {
                state.scene.remove(linePool.shift());
            }

        } else {
            rayDistances[i] = 0;
        }
    }
    return [ rayDistances, damage];

}