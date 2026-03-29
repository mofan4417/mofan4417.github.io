import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const Particles = ({ count = 3000 }) => {
  const points = useRef<THREE.Points>(null!);
  const { mouse, viewport } = useThree();

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      particle.mx += (mouse.x * viewport.width - particle.mx) * 0.01;
      particle.my += (mouse.y * viewport.height - particle.my) * 0.01;
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      
      const pos = points.current.geometry.attributes.position;
      pos.setXYZ(i, dummy.position.x / 15, dummy.position.y / 15, dummy.position.z / 15);
    });
    points.current.geometry.attributes.position.needsUpdate = true;
    points.current.rotation.y += 0.001;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(count * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#7B1FA2"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 z-0 bg-[#0A0505]">
      {/* 4K Gradient Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(123,31,162,0.15)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1A0707]/50 to-[#0A0505]" />
      
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Particles />
          <fog attach="fog" args={['#0A0505', 0, 10]} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ParticleBackground;
