import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Ambient "commit graph" starfield: a drifting cloud of nodes with thin
// connecting lines, echoing the GitHub contribution-graph / dependency-graph
// motif without being literal about it. Purely decorative, pointer-events
// disabled, and paused when the tab isn't visible or the user prefers
// reduced motion.
export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // --- Nodes ---
    const NODE_COUNT = window.innerWidth < 640 ? 55 : 110;
    const positions = new Float32Array(NODE_COUNT * 3);
    const velocities = [];
    const spread = { x: 32, y: 18, z: 12 };

    for (let i = 0; i < NODE_COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * spread.x * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z * 2;
      velocities.push({
        x: (Math.random() - 0.5) * 0.006,
        y: (Math.random() - 0.5) * 0.006,
        z: (Math.random() - 0.5) * 0.004
      });
    }

    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const nodeMaterial = new THREE.PointsMaterial({
      color: 0x58a6ff,
      size: 0.16,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true
    });
    const points = new THREE.Points(nodeGeometry, nodeMaterial);
    scene.add(points);

    // --- Connections (redrawn each frame based on proximity) ---
    const MAX_LINKS = NODE_COUNT * 4;
    const linePositions = new Float32Array(MAX_LINKS * 2 * 3);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x3fb950,
      transparent: true,
      opacity: 0.12
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    const LINK_DIST = 6.2;
    const LINK_DIST_SQ = LINK_DIST * LINK_DIST;

    const mouse = { x: 0, y: 0 };
    function handlePointerMove(e) {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    window.addEventListener('pointermove', handlePointerMove);

    let visible = !document.hidden;
    function handleVisibility() {
      visible = !document.hidden;
    }
    document.addEventListener('visibilitychange', handleVisibility);

    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    let frameId;
    let t = 0;

    function animate() {
      frameId = requestAnimationFrame(animate);
      if (!visible) return;

      t += prefersReducedMotion ? 0.0008 : 0.003;

      const pos = nodeGeometry.attributes.position.array;
      if (!prefersReducedMotion) {
        for (let i = 0; i < NODE_COUNT; i += 1) {
          pos[i * 3] += velocities[i].x;
          pos[i * 3 + 1] += velocities[i].y;
          pos[i * 3 + 2] += velocities[i].z;

          if (pos[i * 3] > spread.x || pos[i * 3] < -spread.x) velocities[i].x *= -1;
          if (pos[i * 3 + 1] > spread.y || pos[i * 3 + 1] < -spread.y) velocities[i].y *= -1;
          if (pos[i * 3 + 2] > spread.z || pos[i * 3 + 2] < -spread.z) velocities[i].z *= -1;
        }
        nodeGeometry.attributes.position.needsUpdate = true;
      }

      // Rebuild links among nearby nodes (capped to MAX_LINKS segments)
      let linkCount = 0;
      outer: for (let i = 0; i < NODE_COUNT; i += 1) {
        for (let j = i + 1; j < NODE_COUNT; j += 1) {
          if (linkCount >= MAX_LINKS) break outer;
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < LINK_DIST_SQ) {
            const base = linkCount * 6;
            linePositions[base] = pos[i * 3];
            linePositions[base + 1] = pos[i * 3 + 1];
            linePositions[base + 2] = pos[i * 3 + 2];
            linePositions[base + 3] = pos[j * 3];
            linePositions[base + 4] = pos[j * 3 + 1];
            linePositions[base + 5] = pos[j * 3 + 2];
            linkCount += 1;
          }
        }
      }
      lineGeometry.setDrawRange(0, linkCount * 2);
      lineGeometry.attributes.position.needsUpdate = true;

      // Gentle whole-scene drift + subtle parallax toward the pointer
      scene.rotation.y = Math.sin(t * 0.3) * 0.08 + mouse.x * 0.06;
      scene.rotation.x = Math.cos(t * 0.3) * 0.04 + mouse.y * 0.04;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      nodeGeometry.dispose();
      lineGeometry.dispose();
      nodeMaterial.dispose();
      lineMaterial.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(88,166,255,0.06), transparent 60%), #0d1117'
      }}
    />
  );
}
