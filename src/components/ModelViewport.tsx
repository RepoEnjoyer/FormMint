import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  GridHelper,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  SphereGeometry,
  Vector2,
  WebGLRenderer,
  WireframeGeometry,
  LineBasicMaterial,
  LineSegments,
  type BufferGeometry,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HAT_BOUNDS } from '../specs';
import type { ProjectBrief } from '../types';

interface ModelViewportProps {
  geometry: BufferGeometry;
  project: ProjectBrief;
  showBounds: boolean;
  onCanvas: (canvas: HTMLCanvasElement | null) => void;
}

export function ModelViewport({ geometry, project, showBounds, onCanvas }: ModelViewportProps) {
  const host = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const boundsRef = useRef<LineSegments | null>(null);

  useEffect(() => {
    const container = host.current;
    if (container === null) return undefined;
    const scene = new Scene();
    scene.background = new Color('#121018');
    sceneRef.current = scene;
    const camera = new PerspectiveCamera(34, 1, 0.01, 100);
    camera.position.set(3.1, 2.15, 3.35);

    const renderer = new WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    container.append(renderer.domElement);
    onCanvas(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.35, 0);
    controls.minDistance = 1.6;
    controls.maxDistance = 7;

    scene.add(new AmbientLight('#beb6d1', 1.4));
    const key = new DirectionalLight('#fff3de', 5.5);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new DirectionalLight('#8d6cff', 4.2);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    const headMaterial = new MeshPhysicalMaterial({ color: '#3c3745', roughness: 0.8, metalness: 0, transparent: true, opacity: 0.82 });
    const head = new Mesh(new SphereGeometry(0.5, 24, 16), headMaterial);
    head.scale.set(1, 0.82, 0.88);
    head.position.y = -0.18;
    scene.add(head);
    const shoulders = new Mesh(new BoxGeometry(1.65, 0.36, 0.72), headMaterial);
    shoulders.position.y = -0.86;
    scene.add(shoulders);
    const grid = new GridHelper(7, 14, '#40384c', '#292430');
    grid.position.y = -1.05;
    scene.add(grid);

    const resize = () => {
      const size = new Vector2(container.clientWidth, container.clientHeight);
      renderer.setSize(size.x, size.y, false);
      camera.aspect = Math.max(0.1, size.x / Math.max(size.y, 1));
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    let animation = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      animation = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(animation);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      head.geometry.dispose();
      shoulders.geometry.dispose();
      headMaterial.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
      onCanvas(null);
    };
  }, [onCanvas]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (scene === null) return undefined;
    if (meshRef.current !== null) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as MeshStandardMaterial).dispose();
    }
    const material = new MeshStandardMaterial({ color: project.parameters.color, roughness: project.parameters.roughness, metalness: project.parameters.metalness });
    const mesh = new Mesh(geometry.clone(), material);
    mesh.name = 'AccessoryMesh';
    scene.add(mesh);
    meshRef.current = mesh;
    return () => {
      if (meshRef.current === mesh) meshRef.current = null;
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
    };
  }, [geometry, project.parameters.color, project.parameters.metalness, project.parameters.roughness]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (scene === null) return undefined;
    if (boundsRef.current !== null) {
      scene.remove(boundsRef.current);
      boundsRef.current.geometry.dispose();
      (boundsRef.current.material as LineBasicMaterial).dispose();
      boundsRef.current = null;
    }
    if (!showBounds) return undefined;
    const limits = HAT_BOUNDS[project.bodyScale];
    const geometryBounds = new WireframeGeometry(new BoxGeometry(limits.width, limits.height, limits.depth));
    const material = new LineBasicMaterial({ color: '#ff7b61', transparent: true, opacity: 0.7 });
    const box = new LineSegments(geometryBounds, material);
    scene.add(box);
    boundsRef.current = box;
    return () => {
      if (boundsRef.current === box) boundsRef.current = null;
      scene.remove(box);
      geometryBounds.dispose();
      material.dispose();
    };
  }, [project.bodyScale, showBounds]);

  return <div className="viewport-host" ref={host} aria-label="Interactive 3D accessory preview" />;
}
