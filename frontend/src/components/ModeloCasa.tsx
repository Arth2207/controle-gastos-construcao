import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ModeloCasa, EtapaCasa, Comodo } from '../types';
import { api } from '../api';
import {
  Home, Plus, Trash2, Box, Layers, DoorOpen, Frame, Palette,
  Save, X, Eye, EyeOff, CheckCircle2, Circle, Ruler, Building2,
  RotateCcw,
} from 'lucide-react';

const ETAPAS_INFO: Record<EtapaCasa, { label: string; icon: any; color: string; desc: string }> = {
  fundacao: { label: 'Fundacao', icon: Box, color: '#78716c', desc: 'Base, sapatas, viga, radier' },
  paredes: { label: 'Paredes', icon: Layers, color: '#d6d3d1', desc: 'Alvenaria e estruturas' },
  laje: { label: 'Laje', icon: Building2, color: '#a8a29e', desc: 'Laje e cobertura' },
  portas: { label: 'Portas', icon: DoorOpen, color: '#92400e', desc: 'Portas internas e externas' },
  janelas: { label: 'Janelas', icon: Frame, color: '#0ea5e9', desc: 'Janelas e ventiluzen' },
  decoracao: { label: 'Decoracao', icon: Palette, color: '#8b5cf6', desc: 'Acabamento e pintura' },
};

interface Scene3DState {
  fundacao: boolean;
  paredes: boolean;
  laje: boolean;
  portas: boolean;
  janelas: boolean;
  decoracao: boolean;
}

function use3DViewer(
  containerRef: React.RefObject<HTMLDivElement>,
  modelo: ModeloCasa | null,
  visibleEtapas: Scene3DState,
) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number>(0);
  const groupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);
    scene.fog = new THREE.Fog(0x1e293b, 30, 80);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(15, 12, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 5;
    controls.maxDistance = 60;

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 30, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.3);
    fillLight.position.set(-15, 10, -10);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(50, 50, 0x475569, 0x334155);
    (grid.material as any).opacity = 0.3;
    (grid.material as any).transparent = true;
    scene.add(grid);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    controlsRef.current = controls;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [containerRef]);

  const buildHouse = useCallback(() => {
    if (!sceneRef.current || !modelo) return;
    const scene = sceneRef.current;

    if (groupRef.current) {
      scene.remove(groupRef.current);
      groupRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    const group = new THREE.Group();
    groupRef.current = group;

    const W = modelo.largura;
    const D = modelo.comprimento;
    const H = modelo.altura_pe_direito;
    const T = modelo.espessura_parede;
    const floors = modelo.num_andares;

    if (visibleEtapas.fundacao) {
      const fundMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
      const fundGeo = new THREE.BoxGeometry(W + 0.6, 0.4, D + 0.6);
      const fund = new THREE.Mesh(fundGeo, fundMat);
      fund.position.set(0, -0.2, 0);
      fund.castShadow = true;
      fund.receiveShadow = true;
      group.add(fund);

      const sapataGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
      const sapataMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.95 });
      const sapataPositions = [
        [W / 2 - 0.2, 0.1, D / 2 - 0.2],
        [-W / 2 + 0.2, 0.1, D / 2 - 0.2],
        [W / 2 - 0.2, 0.1, -D / 2 + 0.2],
        [-W / 2 + 0.2, 0.1, -D / 2 + 0.2],
      ];
      sapataPositions.forEach(([x, y, z]) => {
        const sapata = new THREE.Mesh(sapataGeo, sapataMat);
        sapata.position.set(x, y, z);
        sapata.castShadow = true;
        group.add(sapata);
      });

      const vigaGeo = new THREE.BoxGeometry(W + 0.4, 0.3, 0.3);
      const vigaMat = new THREE.MeshStandardMaterial({ color: 0x6b6560, roughness: 0.9 });
      const vigaF = new THREE.Mesh(vigaGeo, vigaMat);
      vigaF.position.set(0, 0.15, D / 2 - 0.1);
      vigaF.castShadow = true;
      group.add(vigaF);
      const vigaB = new THREE.Mesh(vigaGeo, vigaMat);
      vigaB.position.set(0, 0.15, -D / 2 + 0.1);
      vigaB.castShadow = true;
      group.add(vigaB);
      const vigaLatGeo = new THREE.BoxGeometry(0.3, 0.3, D + 0.4);
      const vigaL = new THREE.Mesh(vigaLatGeo, vigaMat);
      vigaL.position.set(W / 2 - 0.1, 0.15, 0);
      vigaL.castShadow = true;
      group.add(vigaL);
      const vigaR = new THREE.Mesh(vigaLatGeo, vigaMat);
      vigaR.position.set(-W / 2 + 0.1, 0.15, 0);
      vigaR.castShadow = true;
      group.add(vigaR);

      const floorGeo = new THREE.BoxGeometry(W, 0.1, D);
      const floorMat = new THREE.MeshStandardMaterial({ color: 0x8b7d6b, roughness: 0.8 });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.set(0, 0.35, 0);
      floor.receiveShadow = true;
      group.add(floor);
    }

    if (visibleEtapas.paredes) {
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.85 });
      const wallMat2 = new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.8 });

      for (let f = 0; f < floors; f++) {
        const yBase = 0.4 + f * H;

        const wallFront = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), wallMat);
        wallFront.position.set(0, yBase + H / 2, D / 2 - T / 2);
        wallFront.castShadow = true;
        wallFront.receiveShadow = true;
        group.add(wallFront);

        const wallBack = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), wallMat2);
        wallBack.position.set(0, yBase + H / 2, -D / 2 + T / 2);
        wallBack.castShadow = true;
        wallBack.receiveShadow = true;
        group.add(wallBack);

        const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(T, H, D - 2 * T), wallMat2);
        wallLeft.position.set(-W / 2 + T / 2, yBase + H / 2, 0);
        wallLeft.castShadow = true;
        wallLeft.receiveShadow = true;
        group.add(wallLeft);

        const wallRight = new THREE.Mesh(new THREE.BoxGeometry(T, H, D - 2 * T), wallMat);
        wallRight.position.set(W / 2 - T / 2, yBase + H / 2, 0);
        wallRight.castShadow = true;
        wallRight.receiveShadow = true;
        group.add(wallRight);

        if (modelo.dados?.comodos && modelo.dados.comodos.length > 0) {
          for (const comodo of modelo.dados.comodos) {
            if (comodo.comprimento > 0.5 && comodo.largura > 0.5) {
              const intWallH = H * 0.95;
              if (comodo.x + comodo.largura < W - T) {
                const intWall = new THREE.Mesh(
                  new THREE.BoxGeometry(T, intWallH, comodo.comprimento),
                  wallMat2,
                );
                intWall.position.set(comodo.x + comodo.largura - W / 2 + T / 2, yBase + intWallH / 2, comodo.y + comodo.comprimento / 2 - D / 2);
                intWall.castShadow = true;
                group.add(intWall);
              }
              if (comodo.y + comodo.comprimento < D - T) {
                const intWall2 = new THREE.Mesh(
                  new THREE.BoxGeometry(comodo.largura, intWallH, T),
                  wallMat,
                );
                intWall2.position.set(comodo.x + comodo.largura / 2 - W / 2, yBase + intWallH / 2, comodo.y + comodo.comprimento - D / 2 + T / 2);
                intWall2.castShadow = true;
                group.add(intWall2);
              }
            }
          }
        }
      }
    }

    if (visibleEtapas.laje) {
      const lajeMat = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.7 });
      for (let f = 1; f <= floors; f++) {
        const yLaje = 0.4 + f * H;
        const lajeGeo = new THREE.BoxGeometry(W + 0.3, 0.2, D + 0.3);
        const laje = new THREE.Mesh(lajeGeo, lajeMat);
        laje.position.set(0, yLaje, 0);
        laje.castShadow = true;
        laje.receiveShadow = true;
        group.add(laje);
      }
      if (floors === 1) {
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x6b6560, roughness: 0.85 });
        const roofGeo = new THREE.BoxGeometry(W + 0.5, 0.15, D + 0.5);
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, 0.4 + H + 0.15, 0);
        roof.castShadow = true;
        group.add(roof);
      }
    }

    if (visibleEtapas.portas && modelo.dados?.portas) {
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6, metalness: 0.1 });
      const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
      for (const porta of modelo.dados.portas) {
        const doorGeo = new THREE.BoxGeometry(porta.largura, porta.altura, T + 0.05);
        const door = new THREE.Mesh(doorGeo, doorMat);
        const y = 0.4 + porta.altura / 2;
        if (porta.parede === 'frente') {
          door.position.set(porta.x - W / 2, y, D / 2);
        } else if (porta.parede === 'fundo') {
          door.position.set(porta.x - W / 2, y, -D / 2);
        } else if (porta.parede === 'esquerda') {
          door.rotation.y = Math.PI / 2;
          door.position.set(-W / 2, y, porta.x - D / 2);
        } else if (porta.parede === 'direita') {
          door.rotation.y = Math.PI / 2;
          door.position.set(W / 2, y, porta.x - D / 2);
        }
        door.castShadow = true;
        group.add(door);

        const frameGeo = new THREE.BoxGeometry(porta.largura + 0.1, 0.1, T + 0.1);
        const frame = new THREE.Mesh(frameGeo, doorFrameMat);
        frame.position.copy(door.position);
        frame.position.y = 0.4 + porta.altura + 0.05;
        if (door.rotation.y) frame.rotation.y = door.rotation.y;
        group.add(frame);
      }
    }

    if (visibleEtapas.janelas && modelo.dados?.janelas) {
      const winMat = new THREE.MeshPhysicalMaterial({
        color: 0x0ea5e9, roughness: 0.1, metalness: 0.2,
        transmission: 0.8, transparent: true, opacity: 0.6,
      });
      const winFrameMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4, metalness: 0.3 });
      for (const janela of modelo.dados.janelas) {
        const winGeo = new THREE.BoxGeometry(janela.largura, janela.altura, T + 0.08);
        const win = new THREE.Mesh(winGeo, winMat);
        const y = 0.4 + 1.0 + janela.altura / 2;
        if (janela.parede === 'frente') {
          win.position.set(janela.x - W / 2, y, D / 2);
        } else if (janela.parede === 'fundo') {
          win.position.set(janela.x - W / 2, y, -D / 2);
        } else if (janela.parede === 'esquerda') {
          win.rotation.y = Math.PI / 2;
          win.position.set(-W / 2, y, janela.x - D / 2);
        } else if (janela.parede === 'direita') {
          win.rotation.y = Math.PI / 2;
          win.position.set(W / 2, y, janela.x - D / 2);
        }
        win.castShadow = true;
        group.add(win);

        const frGeoH = new THREE.BoxGeometry(janela.largura + 0.08, 0.06, T + 0.1);
        const frTop = new THREE.Mesh(frGeoH, winFrameMat);
        frTop.position.copy(win.position);
        frTop.position.y += janela.altura / 2 + 0.03;
        if (win.rotation.y) frTop.rotation.y = win.rotation.y;
        group.add(frTop);
        const frBot = new THREE.Mesh(frGeoH, winFrameMat);
        frBot.position.copy(win.position);
        frBot.position.y -= janela.altura / 2 + 0.03;
        if (win.rotation.y) frBot.rotation.y = win.rotation.y;
        group.add(frBot);
        const frMid = new THREE.Mesh(new THREE.BoxGeometry(0.04, janela.altura, T + 0.08), winFrameMat);
        frMid.position.copy(win.position);
        if (win.rotation.y) frMid.rotation.y = win.rotation.y;
        group.add(frMid);
      }
    }

    if (visibleEtapas.decoracao) {
      const paintMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.6 });
      const trimMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.5 });
      const baseTrimGeo = new THREE.BoxGeometry(W + 0.1, 0.15, D + 0.1);
      const baseTrim = new THREE.Mesh(baseTrimGeo, trimMat);
      baseTrim.position.set(0, 0.48, 0);
      group.add(baseTrim);

      const paintFloorGeo = new THREE.BoxGeometry(W - 0.3, 0.02, D - 0.3);
      const paintFloor = new THREE.Mesh(paintFloorGeo, paintMat);
      paintFloor.position.set(0, 0.41, 0);
      group.add(paintFloor);

      const plantMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });
      const potMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
      for (let i = 0; i < 3; i++) {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4), potMat);
        pot.position.set(W / 2 + 0.5, 0.2, -D / 2 + 1 + i * 2);
        pot.castShadow = true;
        group.add(pot);
        const plant = new THREE.Mesh(new THREE.SphereGeometry(0.3), plantMat);
        plant.position.set(W / 2 + 0.5, 0.55, -D / 2 + 1 + i * 2);
        plant.castShadow = true;
        group.add(plant);
      }
    }

    scene.add(group);
  }, [modelo, visibleEtapas]);

  useEffect(() => {
    buildHouse();
  }, [buildHouse]);

  const resetCamera = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(15, 12, 18);
      controlsRef.current.target.set(0, 2, 0);
      controlsRef.current.update();
    }
  }, []);

  return { resetCamera };
}

function Viewer3D({ modelo, visibleEtapas, onResetCameraRef }: { modelo: ModeloCasa; visibleEtapas: Scene3DState; onResetCameraRef: (fn: () => void) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resetCamera } = use3DViewer(containerRef, modelo, visibleEtapas);

  useEffect(() => {
    onResetCameraRef(resetCamera);
  }, [resetCamera, onResetCameraRef]);

  return <div ref={containerRef} className="w-full h-[500px] bg-slate-900" />;
}

export function ModeloCasaPage() {
  const [resetCameraFn, setResetCameraFn] = useState<() => void>(() => () => {});
  const [modelos, setModelos] = useState<ModeloCasa[]>([]);
  const [selectedModelo, setSelectedModelo] = useState<ModeloCasa | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showComodoForm, setShowComodoForm] = useState(false);
  const [showPortaForm, setShowPortaForm] = useState(false);
  const [showJanelaForm, setShowJanelaForm] = useState(false);

  const [visibleEtapas, setVisibleEtapas] = useState<Scene3DState>({
    fundacao: true, paredes: true, laje: true,
    portas: true, janelas: true, decoracao: false,
  });

  const [form, setForm] = useState({
    nome: '', largura: 10, comprimento: 12, altura_pe_direito: 2.8,
    num_andares: 1, num_comodos: 0, espessura_parede: 0.15,
  });

  const [comodoForm, setComodoForm] = useState<Comodo>({ nome: '', x: 0, y: 0, largura: 4, comprimento: 4 });
  const [portaForm, setPortaForm] = useState({ x: 2, y: 0, largura: 0.9, altura: 2.1, parede: 'frente' as 'frente' | 'fundo' | 'esquerda' | 'direita' });
  const [janelaForm, setJanelaForm] = useState({ x: 2, y: 0, largura: 1.2, altura: 1.0, parede: 'frente' as 'frente' | 'fundo' | 'esquerda' | 'direita' });

  useEffect(() => {
    loadModelos();
  }, []);

  const loadModelos = async () => {
    setLoading(true);
    try {
      const data = await api.getModelos();
      setModelos(data);
      if (data.length > 0 && !selectedModelo) {
        setSelectedModelo(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar modelos:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const novo = await api.createModelo(form);
    setShowForm(false);
    await loadModelos();
    setSelectedModelo(novo);
  };

  const removeModelo = async (id: number) => {
    if (confirm('Excluir este modelo?')) {
      await api.deleteModelo(id);
      if (selectedModelo?.id === id) setSelectedModelo(null);
      loadModelos();
    }
  };

  const toggleEtapa = async (etapa: EtapaCasa) => {
    setVisibleEtapas((prev) => ({ ...prev, [etapa]: !prev[etapa] }));
    if (selectedModelo?.id) {
      const etapaRow = selectedModelo.etapas?.find((e) => e.etapa === etapa);
      const novoStatus = etapaRow ? etapaRow.concluida === 0 : false;
      await api.updateEtapa(selectedModelo.id, etapa, novoStatus);
      loadModelos();
    }
  };

  const toggleEtapaVisibility = (etapa: EtapaCasa) => {
    setVisibleEtapas((prev) => ({ ...prev, [etapa]: !prev[etapa] }));
  };

  const addComodo = async () => {
    if (!selectedModelo?.id) return;
    const dados = selectedModelo.dados || {};
    const comodos = dados.comodos || [];
    comodos.push({ ...comodoForm });
    dados.comodos = comodos;
    await api.updateModelo(selectedModelo.id, { ...selectedModelo, dados });
    setShowComodoForm(false);
    setComodoForm({ nome: '', x: 0, y: 0, largura: 4, comprimento: 4 });
    loadModelos();
  };

  const addPorta = async () => {
    if (!selectedModelo?.id) return;
    const dados = selectedModelo.dados || {};
    const portas = dados.portas || [];
    portas.push({ ...portaForm });
    dados.portas = portas;
    await api.updateModelo(selectedModelo.id, { ...selectedModelo, dados });
    setShowPortaForm(false);
    loadModelos();
  };

  const addJanela = async () => {
    if (!selectedModelo?.id) return;
    const dados = selectedModelo.dados || {};
    const janelas = dados.janelas || [];
    janelas.push({ ...janelaForm });
    dados.janelas = janelas;
    await api.updateModelo(selectedModelo.id, { ...selectedModelo, dados });
    setShowJanelaForm(false);
    loadJanelas();
  };

  const loadJanelas = async () => {
    loadModelos();
  };

  const etapasConcluidas = selectedModelo?.etapas?.filter((e) => e.concluida === 1).length || 0;
  const totalEtapas = 6;
  const progressoGeral = (etapasConcluidas / totalEtapas) * 100;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-40 rounded-3xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Cabecalho */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Modelo 3D</span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Modelo da Casa</h1>
          <p className="text-slate-500 mt-1">Crie e visualize o modelo 3D da sua obra por etapas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Modelo
        </button>
      </div>

      {/* Form Novo Modelo */}
      {showForm && (
        <div className="card animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Novo Modelo</h2>
            <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <form onSubmit={submitForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Nome do Modelo</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="input" required placeholder="Ex: Casa 10x12" />
              </div>
              <div>
                <label className="label">Largura (m)</label>
                <input type="number" value={form.largura} onChange={(e) => setForm({ ...form, largura: parseFloat(e.target.value) || 0 })} className="input" required min="1" step="0.5" />
              </div>
              <div>
                <label className="label">Comprimento (m)</label>
                <input type="number" value={form.comprimento} onChange={(e) => setForm({ ...form, comprimento: parseFloat(e.target.value) || 0 })} className="input" required min="1" step="0.5" />
              </div>
              <div>
                <label className="label">Pe Direito (m)</label>
                <input type="number" value={form.altura_pe_direito} onChange={(e) => setForm({ ...form, altura_pe_direito: parseFloat(e.target.value) || 0 })} className="input" required min="2" step="0.1" />
              </div>
              <div>
                <label className="label">Andares</label>
                <input type="number" value={form.num_andares} onChange={(e) => setForm({ ...form, num_andares: parseInt(e.target.value) || 1 })} className="input" required min="1" max="3" />
              </div>
              <div>
                <label className="label">Num. Comodos</label>
                <input type="number" value={form.num_comodos} onChange={(e) => setForm({ ...form, num_comodos: parseInt(e.target.value) || 0 })} className="input" min="0" />
              </div>
              <div>
                <label className="label">Espessura Parede (m)</label>
                <input type="number" value={form.espessura_parede} onChange={(e) => setForm({ ...form, espessura_parede: parseFloat(e.target.value) || 0.15 })} className="input" required min="0.05" step="0.05" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                Criar Modelo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Seletor de modelos */}
      {modelos.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {modelos.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModelo(m)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                selectedModelo?.id === m.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Home className="w-4 h-4" />
              {m.nome}
              <span className="text-xs opacity-70">{m.largura}x{m.comprimento}m</span>
              <span onClick={(e) => { e.stopPropagation(); removeModelo(m.id!); }} className="ml-1 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>
      )}

      {modelos.length === 0 && !showForm && (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-semibold">Nenhum modelo criado</p>
          <p className="text-slate-400 text-sm">Clique em "Novo Modelo" para comecar.</p>
        </div>
      )}

      {/* Viewer 3D + Controles */}
      {selectedModelo && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Viewer 3D */}
          <div className="lg:col-span-3 card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-primary-500" />
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{selectedModelo.nome}</h2>
                  <p className="text-xs text-slate-400">
                    {selectedModelo.largura}m x {selectedModelo.comprimento}m | {selectedModelo.altura_pe_direito}m pe direito | {selectedModelo.num_andares} andar(es)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <p className="text-xs text-slate-400">Progresso</p>
                  <p className="font-bold text-primary-600">{progressoGeral.toFixed(0)}%</p>
                </div>
                <button onClick={() => resetCameraFn()} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center" title="Resetar camera">
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            <Viewer3D modelo={selectedModelo} visibleEtapas={visibleEtapas} onResetCameraRef={setResetCameraFn} />
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> Arraste para girar | Scroll para zoom</span>
            </div>
          </div>

          {/* Painel de Etapas */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-500" />
                Etapas da Obra
              </h3>
              <div className="space-y-2">
                {(Object.keys(ETAPAS_INFO) as EtapaCasa[]).map((etapa) => {
                  const info = ETAPAS_INFO[etapa];
                  const Icon = info.icon;
                  const etapaData = selectedModelo.etapas?.find((e) => e.etapa === etapa);
                  const concluida = etapaData?.concluida === 1;
                  const visivel = visibleEtapas[etapa];
                  return (
                    <div key={etapa} className={`rounded-xl border transition-all ${concluida ? 'border-success-200 bg-success-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center gap-2 p-3">
                        <button onClick={() => toggleEtapa(etapa)} className="flex-shrink-0">
                          {concluida ? <CheckCircle2 className="w-5 h-5 text-success-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
                        </button>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: info.color + '20' }}>
                          <Icon className="w-4 h-4" style={{ color: info.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-700">{info.label}</p>
                          <p className="text-xs text-slate-400 truncate">{info.desc}</p>
                        </div>
                        <button onClick={() => toggleEtapaVisibility(etapa)} className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                          {visivel ? <Eye className="w-3.5 h-3.5 text-slate-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-300" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Adicionar elementos */}
            <div className="card">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary-500" />
                Elementos
              </h3>
              <div className="space-y-2">
                <button onClick={() => setShowComodoForm(!showComodoForm)} className="w-full btn btn-secondary text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2"><Home className="w-4 h-4" /> Comodo</span>
                  <Plus className="w-3 h-3" />
                </button>
                <button onClick={() => setShowPortaForm(!showPortaForm)} className="w-full btn btn-secondary text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2"><DoorOpen className="w-4 h-4" /> Porta</span>
                  <Plus className="w-3 h-3" />
                </button>
                <button onClick={() => setShowJanelaForm(!showJanelaForm)} className="w-full btn btn-secondary text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2"><Frame className="w-4 h-4" /> Janela</span>
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Form Comodo */}
              {showComodoForm && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-2">
                  <input type="text" placeholder="Nome do comodo" value={comodoForm.nome} onChange={(e) => setComodoForm({ ...comodoForm, nome: e.target.value })} className="input text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="X (m)" value={comodoForm.x} onChange={(e) => setComodoForm({ ...comodoForm, x: parseFloat(e.target.value) || 0 })} className="input text-sm" />
                    <input type="number" placeholder="Y (m)" value={comodoForm.y} onChange={(e) => setComodoForm({ ...comodoForm, y: parseFloat(e.target.value) || 0 })} className="input text-sm" />
                    <input type="number" placeholder="Largura" value={comodoForm.largura} onChange={(e) => setComodoForm({ ...comodoForm, largura: parseFloat(e.target.value) || 0 })} className="input text-sm" />
                    <input type="number" placeholder="Comprimento" value={comodoForm.comprimento} onChange={(e) => setComodoForm({ ...comodoForm, comprimento: parseFloat(e.target.value) || 0 })} className="input text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowComodoForm(false)} className="btn btn-secondary text-sm flex-1">Cancelar</button>
                    <button onClick={addComodo} className="btn btn-primary text-sm flex-1">Add</button>
                  </div>
                </div>
              )}

              {/* Form Porta */}
              {showPortaForm && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-2">
                  <select value={portaForm.parede} onChange={(e) => setPortaForm({ ...portaForm, parede: e.target.value as any })} className="input text-sm">
                    <option value="frente">Parede Frente</option>
                    <option value="fundo">Parede Fundo</option>
                    <option value="esquerda">Parede Esquerda</option>
                    <option value="direita">Parede Direita</option>
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" placeholder="Pos X" value={portaForm.x} onChange={(e) => setPortaForm({ ...portaForm, x: parseFloat(e.target.value) || 0 })} className="input text-sm" />
                    <input type="number" placeholder="Largura" value={portaForm.largura} onChange={(e) => setPortaForm({ ...portaForm, largura: parseFloat(e.target.value) || 0 })} className="input text-sm" />
                    <input type="number" placeholder="Altura" value={portaForm.altura} onChange={(e) => setPortaForm({ ...portaForm, altura: parseFloat(e.target.value) || 0 })} className="input text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowPortaForm(false)} className="btn btn-secondary text-sm flex-1">Cancelar</button>
                    <button onClick={addPorta} className="btn btn-primary text-sm flex-1">Add</button>
                  </div>
                </div>
              )}

              {/* Form Janela */}
              {showJanelaForm && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-2">
                  <select value={janelaForm.parede} onChange={(e) => setJanelaForm({ ...janelaForm, parede: e.target.value as any })} className="input text-sm">
                    <option value="frente">Parede Frente</option>
                    <option value="fundo">Parede Fundo</option>
                    <option value="esquerda">Parede Esquerda</option>
                    <option value="direita">Parede Direita</option>
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" placeholder="Pos X" value={janelaForm.x} onChange={(e) => setJanelaForm({ ...janelaForm, x: parseFloat(e.target.value) || 0 })} className="input text-sm" />
                    <input type="number" placeholder="Largura" value={janelaForm.largura} onChange={(e) => setJanelaForm({ ...janelaForm, largura: parseFloat(e.target.value) || 0 })} className="input text-sm" />
                    <input type="number" placeholder="Altura" value={janelaForm.altura} onChange={(e) => setJanelaForm({ ...janelaForm, altura: parseFloat(e.target.value) || 0 })} className="input text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowJanelaForm(false)} className="btn btn-secondary text-sm flex-1">Cancelar</button>
                    <button onClick={addJanela} className="btn btn-primary text-sm flex-1">Add</button>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de elementos */}
            <div className="card">
              <h3 className="font-bold text-slate-800 mb-3 text-sm">Resumo</h3>
              <div className="space-y-1 text-xs text-slate-500">
                <p>Comodos: {selectedModelo.dados?.comodos?.length || 0}</p>
                <p>Portas: {selectedModelo.dados?.portas?.length || 0}</p>
                <p>Janelas: {selectedModelo.dados?.janelas?.length || 0}</p>
                <p>Area total: {(selectedModelo.largura * selectedModelo.comprimento * selectedModelo.num_andares).toFixed(0)} m2</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
