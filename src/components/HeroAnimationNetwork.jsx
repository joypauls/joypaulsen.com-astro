import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const NetworkBackground = ({ 
  nodeCount = 80, 
  lineOpacity = 0.15, 
  nodeSize = 0.3,
  nodeColor = 0xafa4eb,
  maxDistance = 20,
  maxConnections = 4
}) => {
  const mountRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Use window dimensions directly for full screen coverage
    const getSize = () => ({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    const { width, height } = getSize();
    
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    
    // Force canvas to fill container
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    
    mountRef.current.appendChild(renderer.domElement);

    // Particle system
    const particles = [];
    // Increase sphere geometry detail for smoother nodes
    const particleGeometry = new THREE.SphereGeometry(nodeSize, 16, 16); // Increased from 8,8
    const particleMaterial = new THREE.MeshBasicMaterial({ 
      color: nodeColor,
      transparent: true,
      opacity: 0.8
    });

    // Create particles with initial positions and velocities
    for (let i = 0; i < nodeCount; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
      
      // Distribute particles across the view
      particle.position.x = (Math.random() - 0.5) * 100;
      particle.position.y = (Math.random() - 0.5) * 60;
      particle.position.z = 0; // Keep it planar
      
      // Add velocity for slow drift
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        0
      );
      
      particles.push(particle);
      scene.add(particle);
    }

    // Line connections
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: nodeColor,
      transparent: true,
      opacity: lineOpacity
    });

    // K-nearest neighbor connection system - each node always connects to N closest neighbors
    const connectionMap = new Map(); // Track connections per particle pair
    
    function getConnectionKey(p1, p2) {
      const id1 = particles.indexOf(p1);
      const id2 = particles.indexOf(p2);
      return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
    }
    
    function createOrGetConnection(p1, p2) {
      const key = getConnectionKey(p1, p2);
      
      if (connectionMap.has(key)) {
        return connectionMap.get(key);
      }
      
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(6);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const line = new THREE.Line(geometry, lineMaterial);
      scene.add(line);
      
      const connection = { p1, p2, line, geometry, key };
      connectionMap.set(key, connection);
      
      return connection;
    }
    
    function updateNearestConnections() {
      // Track which connections should be active this frame
      const activeKeys = new Set();
      
      // For each particle, find its N closest neighbors
      particles.forEach(particle => {
        // Calculate distances to all other particles
        const distances = particles
          .filter(other => other !== particle)
          .map(other => ({
            particle: other,
            distance: particle.position.distanceTo(other.position)
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, maxConnections); // Take only N closest
        
        // Create/activate connections to closest neighbors
        distances.forEach(({ particle: other }) => {
          const connection = createOrGetConnection(particle, other);
          activeKeys.add(connection.key);
        });
      });
      
      // Update all connections - show active ones, hide inactive ones
      connectionMap.forEach((connection, key) => {
        const { p1, p2, line, geometry } = connection;
        
        if (activeKeys.has(key)) {
          // Update line position
          line.visible = true;
          const positions = geometry.attributes.position.array;
          positions[0] = p1.position.x;
          positions[1] = p1.position.y;
          positions[2] = p1.position.z;
          positions[3] = p2.position.x;
          positions[4] = p2.position.y;
          positions[5] = p2.position.z;
          geometry.attributes.position.needsUpdate = true;
        } else {
          line.visible = false;
        }
      });
    }

    // Initial connection setup
    updateNearestConnections();

    // Mouse interaction
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let hoveredParticle = null;

    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(particles);

      // Reset previous hovered particle
      if (hoveredParticle) {
        hoveredParticle.material.opacity = 0.8;
        hoveredParticle.scale.set(1, 1, 1);
      }

      // Highlight new hovered particle
      if (intersects.length > 0) {
        hoveredParticle = intersects[0].object;
        hoveredParticle.material.opacity = 1;
        hoveredParticle.scale.set(1.5, 1.5, 1.5);
      } else {
        hoveredParticle = null;
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    // Animation loop
    let frameCount = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      frameCount++;

      // Update particle positions with gentle drift
      particles.forEach((particle) => {
        particle.position.add(particle.velocity);

        // Bounce off boundaries
        if (Math.abs(particle.position.x) > 50) {
          particle.velocity.x *= -1;
        }
        if (Math.abs(particle.position.y) > 30) {
          particle.velocity.y *= -1;
        }

        // Add subtle pulsing (only update scale, not create new objects)
        if (particle !== hoveredParticle) {
          const scale = 1 + Math.sin(frameCount * 0.02 + particle.position.x) * 0.1;
          particle.scale.setScalar(scale);
        }
      });

      // Recalculate nearest connections every 10 frames for smooth transitions
      if (frameCount % 10 === 0) {
        updateNearestConnections();
      }

      // Subtle camera movement
      camera.position.x = Math.sin(frameCount * 0.0005) * 2;
      camera.position.y = Math.cos(frameCount * 0.0003) * 1;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      const { width, height } = getSize();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      
      // Dispose of geometries and materials
      particles.forEach(particle => {
        particle.geometry.dispose();
        particle.material.dispose();
      });
      connectionMap.forEach(({ geometry }) => {
        geometry.dispose();
      });
      lineMaterial.dispose();
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [nodeCount, lineOpacity, nodeSize, nodeColor, maxDistance, maxConnections]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'auto',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    />
  );
};

export default NetworkBackground;