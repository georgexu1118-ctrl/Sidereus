'use client'

import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  atmosphereVertexShader,
  atmosphereFragmentShader,
  particleVertexShader,
  particleFragmentShader,
} from './shaders'

// ── Full-screen atmospheric shader plane ──────────────────────
function AtmospherePlane() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { size } = useThree()

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    if (matRef.current) {
      matRef.current.uniforms.u_resolution.value.set(size.width, size.height)
    }
  }, [size])

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.u_time.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh position={[0, 0, -1]}>
      {/* Large enough plane to fill the camera view */}
      <planeGeometry args={[4, 4]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}

// ── Particle system — atmospheric dust / light scatter ────────
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { gl } = useThree()

  const COUNT = 2800

  const { positions, sizes, alphas, colors } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    const alphas = new Float32Array(COUNT)
    const colors = new Float32Array(COUNT * 3)

    // Monet palette (3 hues, very desaturated)
    const palette = [
      [0.56, 0.66, 0.847],  // Morning Blue #8FA9D8
      [0.71, 0.65, 0.847],  // Lavender    #B5A6D8
      [0.88, 0.73, 0.42],   // Gold        #E0B96A
      [0.37, 0.44, 0.64],   // Indigo      #5E6FA3
    ]

    for (let i = 0; i < COUNT; i++) {
      // Spread across a wide volume
      positions[i * 3]     = (Math.random() - 0.5) * 14
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2

      // Very small points
      sizes[i] = 0.4 + Math.random() * 1.8

      // Very faint — layers of depth
      const depthFade = 1.0 - Math.abs(positions[i * 3 + 2] + 2) / 8
      alphas[i] = (0.06 + Math.random() * 0.18) * depthFade

      // Pick a palette color with slight variation
      const paletteIdx = Math.floor(Math.random() * palette.length)
      const base = palette[paletteIdx]
      const variation = 0.05
      colors[i * 3]     = Math.min(1, base[0] + (Math.random() - 0.5) * variation)
      colors[i * 3 + 1] = Math.min(1, base[1] + (Math.random() - 0.5) * variation)
      colors[i * 3 + 2] = Math.min(1, base[2] + (Math.random() - 0.5) * variation)
    }

    return { positions, sizes, alphas, colors }
  }, [])

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_pixelRatio: { value: gl.getPixelRatio() },
    }),
    [gl]
  )

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.u_time.value = clock.getElapsedTime()
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-a_size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-a_alpha" args={[alphas, 1]} />
        <bufferAttribute attach="attributes-a_color" args={[colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ── Main export — full-screen fixed canvas ────────────────────
export default function AtmosphereBackground() {
  return (
    <div className="atmosphere-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}  // cap pixel ratio for performance
        camera={{ position: [0, 0, 2], fov: 60 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: false,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Locked orthographic-ish perspective on a full-screen plane */}
        <AtmospherePlane />
        <ParticleField />
      </Canvas>
    </div>
  )
}
