import { usePlane } from "@react-three/cannon";
import React, { useRef } from "react";


export function Ground() {
    usePlane(
        () => ({
                type: 'Static',
                rotation: [-Math.PI / 2, 0, 0],
                position: [0, 0, 0],
            }

        ),
        useRef(null)
    );
    return (
        <>
            <planeGeometry args={[100, 100]}/>
        </>
    );
}
