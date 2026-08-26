import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeViewer({ design }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(400, 400);
    scene.background = new THREE.Color(0x111111);

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x0099ff, metalness: 0.6, roughness: 0.2 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    camera.position.z = 6;
    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.005;
      cube.rotation.y += 0.007;
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="viewer" style={{ display: 'block', margin: '0 auto' }} />;
}
