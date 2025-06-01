"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface Proxim8ViewerProps {
  personality: "analytical" | "aggressive" | "diplomatic";
}

export default function Proxim8Viewer({ personality }: Proxim8ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add rim light for cyberpunk effect
    const rimLight1 = new THREE.PointLight(getPersonalityColor(), 2, 10);
    rimLight1.position.set(-2, 1, -1);
    scene.add(rimLight1);

    const rimLight2 = new THREE.PointLight(0x00ffff, 1, 10);
    rimLight2.position.set(2, 0, -1);
    scene.add(rimLight2);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      30,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.3, 1.5);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.outputEncoding = THREE.sRGBEncoding
    containerRef.current.appendChild(renderer.domElement);

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = false;
    controls.minDistance = 1;
    controls.maxDistance = 3;
    controls.target.set(0, 1, 0);

    // Create a placeholder geometry while VRM loads
    const placeholderGeometry = new THREE.CapsuleGeometry(0.2, 0.8, 4, 8);
    const placeholderMaterial = new THREE.MeshStandardMaterial({
      color: getPersonalityColor(),
      emissive: getPersonalityColor(),
      emissiveIntensity: 0.3,
      wireframe: true,
    });
    const placeholder = new THREE.Mesh(
      placeholderGeometry,
      placeholderMaterial
    );
    placeholder.position.set(0, 0.9, 0);
    scene.add(placeholder);

    // Add grid
    const gridHelper = new THREE.GridHelper(10, 20, 0x111111, 0x111111);
    scene.add(gridHelper);

    // Add a circular platform
    const platformGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.8,
      roughness: 0.2,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -0.025;
    scene.add(platform);

    // Add glowing ring around platform
    const ringGeometry = new THREE.TorusGeometry(0.5, 0.02, 16, 100);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: getPersonalityColor(),
      emissive: getPersonalityColor(),
      emissiveIntensity: 1,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = 0.01;
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Load VRM model
    // Note: In a real implementation, you would load an actual VRM file
    // For this example, we'll just use the placeholder

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Animate placeholder
      placeholder.rotation.y += delta * 0.5;

      // Animate ring
      ring.rotation.z += delta * 0.2;

      // Update controls
      controls.update();

      // Render scene
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;

      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (
        containerRef.current &&
        containerRef.current.contains(renderer.domElement)
      ) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [personality]);

  function getPersonalityColor() {
    switch (personality) {
      case "analytical":
        return 0x3b82f6; // blue
      case "aggressive":
        return 0xef4444; // red
      case "diplomatic":
        return 0x22c55e; // green
      default:
        return 0x8b5cf6; // purple
    }
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
