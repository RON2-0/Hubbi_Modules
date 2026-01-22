import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function WmsView() {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const mountNode = mountRef.current;
        if (!mountNode) return;

        // Scene Setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#0f172a'); // Hubbi Dark BG

        // Camera
        const camera = new THREE.PerspectiveCamera(75, mountNode.clientWidth / mountNode.clientHeight, 0.1, 1000);
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
        mountNode.appendChild(renderer.domElement);

        // Grid
        const gridHelper = new THREE.GridHelper(10, 10, '#3b82f6', '#1e293b');
        scene.add(gridHelper);

        // Cube (Placeholder for Ratio)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: '#f1d592', wireframe: true });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.y = 0.5;
        scene.add(cube);

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        };
        animate();

        // Handle Resize
        const handleResize = () => {
            if (!mountNode) return;
            const width = mountNode.clientWidth;
            const height = mountNode.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountNode && renderer.domElement && mountNode.contains(renderer.domElement)) {
                mountNode.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div className="w-full h-full relative">
            <div ref={mountRef} className="absolute inset-0" />

            {/* Overlay Controls */}
            <div className="absolute top-4 left-4 bg-hubbi-card/80 backdrop-blur p-4 rounded-xl border border-hubbi-border max-w-sm">
                <h3 className="font-bold text-hubbi-text mb-2">Vista WMS (3D)</h3>
                <p className="text-sm text-hubbi-dim">
                    Visualización en tiempo real de la bodega. Usa el mouse para navegar (Próximamente controles completos).
                </p>
            </div>
        </div>
    );
}
