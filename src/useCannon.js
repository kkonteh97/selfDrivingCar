import * as CANNON from 'cannon'
import React, { useState, useEffect, useContext, useRef } from 'react'


// Cannon-world context provider
const context = React.createContext()
export function Provider({ children }) {
    // Set up physics
    const [world] = useState(() => new CANNON.World())
    useEffect(() => {
        world.broadphase = new CANNON.NaiveBroadphase()
        world.solver.iterations = 10
        world.gravity.set(0, 0, -25)
    }, [world])

    // Run world stepper every frame
    // Distribute world via context
    return <context.Provider value={world} children={children} />
}

// Custom hook to maintain a world physics body
export function useCannon({ bodyProps: { ...props } }, fn, deps = []) {
    const ref = useRef()
    // Get cannon world object
    const world = useContext(context)
    // Instanciate a physics body
    const [body] = useState(() => new CANNON.Body(props))
    useEffect(() => {
        // Call function so the user can add shapes
        fn(body)
        // Add body to world on mount
        world.addBody(body)
        // Remove body on unmount
        return () => world.removeBody(body)
    }, deps)

    return {
        ref,
        body
    }
}