import {BufferGeometry, Line, LineBasicMaterial, Vector3} from "three";

const lineGeometry = new BufferGeometry();
const lineMaterial1 = new LineBasicMaterial({color: 0xff0000});
const lineMaterial2 = new LineBasicMaterial({color: 0x000000});
const linePool = [];
export function Sensor(chassisBody, state, position, quaternion, raycaster, numRays,rayLength, rayAngle,relevantObjects) {
    position.setFromMatrixPosition(chassisBody.current.matrixWorld);
    quaternion.setFromRotationMatrix(chassisBody.current.matrixWorld);
    const rayDistances = new Array(5).fill(0);
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
            let line1 = linePool.pop();
            let line2 = linePool.pop();
            if (!line1) {
                const geometry1 = lineGeometry.clone();
                line1 = new Line(geometry1, lineMaterial1);
            }
            if (!line2) {
                const geometry2 = lineGeometry.clone();
                line2 = new Line(geometry2, lineMaterial2);
            }

            line1.geometry.setFromPoints([position.clone(), intersection.clone()]);
            line2.geometry.setFromPoints([intersection.clone(), raycaster.ray.origin.clone().add(raycaster.ray.direction)]);
            state.scene.add(line1, line2);

            rayDistances[i] = 1 - raycaster.ray.origin.distanceTo(intersection) / rayLength;
            setTimeout(() => {
                state.scene.remove(line1, line2);
                linePool.push(line1, line2);
            }, 5);
        } else {
            rayDistances[i] = 0;
        }
    }
    return rayDistances;

}