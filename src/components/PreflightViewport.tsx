import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  Box3,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  GridHelper,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PreflightOverlay, OverlayKind } from '../preflight';
import { HAT_BOUNDS } from '../specs';
import type { BodyScale } from '../types';

interface PreflightViewportProps {
  geometry: BufferGeometry;
  overlay: PreflightOverlay;
  activeOverlay: OverlayKind;
  bodyScale: BodyScale;
  showBounds: boolean;
  wireframe: boolean;
  onCanvas: (canvas: HTMLCanvasElement | null) => void;
}

export function PreflightViewport({ geometry, overlay, activeOverlay, bodyScale, showBounds, wireframe, onCanvas }: PreflightViewportProps) {
  const host = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const boundsRef = useRef<LineSegments | null>(null);
  const overlayRef = useRef<LineSegments | null>(null);

  useEffect(() => {
    const container = host.current;
    if (container === null) return undefined;
    const scene = new Scene();
    scene.background = new Color('#090d13');
    sceneRef.current = scene;
    const camera = new PerspectiveCamera(34, 1, 0.01, 500);
    camera.position.set(3.2, 2.25, 3.4);
    cameraRef.current = camera;
    const renderer = new WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    container.append(renderer.domElement);
    onCanvas(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 0.2;
    controls.maxDistance = 50;
    controlsRef.current = controls;
    scene.add(new AmbientLight('#a8b4c7', 1.7));
    const key = new DirectionalLight('#f6ffd9', 5.2);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new DirectionalLight('#8376ff', 4.4);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    const fill = new DirectionalLight('#67e0c0', 2.3);
    fill.position.set(1, -2, 3);
    scene.add(fill);
    const grid = new GridHelper(12, 24, '#273343', '#17212c');
    grid.position.y = -1.5;
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
      renderer.domElement.remove();
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      onCanvas(null);
    };
  }, [onCanvas]);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (scene === null || camera === null || controls === null) return undefined;
    if (meshRef.current !== null) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as MeshStandardMaterial).dispose();
    }
    const material = new MeshStandardMaterial({
      color: wireframe ? '#78e3c5' : '#c9f15b',
      roughness: 0.38,
      metalness: 0.18,
      wireframe,
    });
    const mesh = new Mesh(geometry.clone(), material);
    mesh.name = 'InspectedAccessory';
    scene.add(mesh);
    meshRef.current = mesh;

    mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox?.clone() ?? new Box3();
    const center = bounds.getCenter(new Vector3());
    const radius = Math.max(bounds.getSize(new Vector3()).length() / 2, 0.5);
    controls.target.copy(center);
    camera.position.copy(center).add(new Vector3(radius * 1.55, radius * 1.05, radius * 1.7));
    camera.near = Math.max(radius / 500, 0.001);
    camera.far = Math.max(radius * 30, 100);
    camera.updateProjectionMatrix();
    controls.minDistance = Math.max(radius * 0.35, 0.05);
    controls.maxDistance = Math.max(radius * 12, 10);
    controls.update();

    return () => {
      if (meshRef.current === mesh) meshRef.current = null;
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
    };
  }, [geometry, wireframe]);

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
    const limits = HAT_BOUNDS[bodyScale];
    const boundsGeometry = new WireframeGeometry(new BoxGeometry(limits.width, limits.height, limits.depth));
    const material = new LineBasicMaterial({ color: '#65e2c0', transparent: true, opacity: 0.6 });
    const lines = new LineSegments(boundsGeometry, material);
    scene.add(lines);
    boundsRef.current = lines;
    return () => {
      if (boundsRef.current === lines) boundsRef.current = null;
      scene.remove(lines);
      boundsGeometry.dispose();
      material.dispose();
    };
  }, [bodyScale, showBounds]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (scene === null) return undefined;
    if (overlayRef.current !== null) {
      scene.remove(overlayRef.current);
      overlayRef.current.geometry.dispose();
      (overlayRef.current.material as LineBasicMaterial).dispose();
      overlayRef.current = null;
    }
    const positions = activeOverlay === 'boundary' ? overlay.boundary : activeOverlay === 'degenerate' ? overlay.degenerate : null;
    if (positions === null || positions.length === 0) return undefined;
    const lineGeometry = new BufferGeometry();
    lineGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = new LineBasicMaterial({ color: activeOverlay === 'degenerate' ? '#ffb657' : '#ff6d6d', depthTest: false });
    const lines = new LineSegments(lineGeometry, material);
    lines.renderOrder = 5;
    scene.add(lines);
    overlayRef.current = lines;
    return () => {
      if (overlayRef.current === lines) overlayRef.current = null;
      scene.remove(lines);
      lineGeometry.dispose();
      material.dispose();
    };
  }, [activeOverlay, overlay]);

  return <div className="preflight-viewport-host" ref={host} aria-label="Interactive imported accessory inspection viewport" />;
}
