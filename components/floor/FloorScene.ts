import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";

import { composeCharacterCanvas } from "@/scripts/characters/compose-character";
import {
  resolveAnim,
  resolveFrame,
} from "@/scripts/characters/layers-manifest";
import {
  ANNEX_W,
  FURNITURE,
  GRID_H,
  HALL_W,
  spawnPoint,
} from "@/simulation/map";
import type { RenderAgent } from "@/simulation/types";

const CELL = 0.5;
/**
 * Échelle personnages vs décor (murs ~6.9, bibs ~5.5, comptoir ~1.3) :
 * le plateau du comptoir doit arriver à la taille (~50 % du sprite utile).
 */
const SPRITE_W = 2.0;
const SPRITE_H = 2.85;
/** Décale le plan vers la caméra pour le depth vs rayons. */
const SPRITE_DEPTH_BIAS = 0.48;

/** Caméra management : vue penchée plus aérienne — centrée salle de vente. */
const CAM_POS = new THREE.Vector3(0.5, 22.5, 26.5);
const CAM_TARGET = new THREE.Vector3(0, 0.2, -1.2);
const CAM_MIN_DIST = 9;
const CAM_MAX_DIST = 48;
const PAN_MARGIN = 1.5;

/** Origine monde = centre salle (HALL_W), pas le centre GRID_W élargi. */
function toWorld(x: number, y: number) {
  return new THREE.Vector3(
    (x - HALL_W / 2) * CELL,
    0,
    (y - GRID_H / 2) * CELL,
  );
}

/** U des travées (textures v3). Vide = pilier ; bibs en largeur naturelle. */
const ANNEX_SHELF_BAYS: Record<string, [number, number]> = {
  annex_shelf_b0: [0.167, 0.395],
  annex_shelf_b1: [0.395, 0.608],
  annex_shelf_b2: [0.608, 0.837],
  /** Gauche : U 0 = entrée. Angle fond (U>0.81) vide. */
  annex_shelf_l0: [0.581, 0.809],
  annex_shelf_l1: [0.337, 0.581],
  /** Est : U 0 = fond. Angles vides ; 0.37–0.64 = vitre. */
  annex_shelf_r0: [0.118, 0.365],
  annex_shelf_r1: [0.635, 0.872],
};

function baySpanU(u0: number, u1: number) {
  return { u: (u0 + u1) / 2 };
}

const DESK_CODES = new Set(["counter", "dock", "reserve"]);

/**
 * Repousse le sprite hors des volumes meubles (rayons + bureaux).
 * Aligné sur l’épaisseur visuelle des bibs (~0.42+).
 */
function clearFurnitureOverlap(wx: number, wz: number): { x: number; z: number } {
  let x = wx;
  let z = wz;
  for (let pass = 0; pass < 4; pass += 1) {
    let moved = false;
    for (const rect of FURNITURE) {
      const cx = rect.x + (rect.w - 1) / 2;
      const cy = rect.y + (rect.h - 1) / 2;
      const center = toWorld(cx, cy);
      const isDesk = DESK_CODES.has(rect.code);
      const isShelf =
        rect.code.startsWith("shelf_") ||
        rect.code.startsWith("annex_shelf_") ||
        rect.code.startsWith("annex_corner_");
      const longIsX = rect.w >= rect.h;
      const meshThick = Math.max(0.42, Math.min(rect.w, rect.h) * CELL);
      const halfLong =
        Math.max(rect.w, rect.h) * CELL * 0.5 +
        SPRITE_W * (isDesk ? 0.4 : isShelf ? 0.22 : 0.28);
      const halfThick =
        meshThick * 0.5 + SPRITE_W * (isDesk ? 0.4 : isShelf ? 0.45 : 0.32);
      const halfW = longIsX ? halfLong : halfThick;
      const halfD = longIsX ? halfThick : halfLong;
      const dx = x - center.x;
      const dz = z - center.z;
      if (Math.abs(dx) > halfW || Math.abs(dz) > halfD) continue;
      const ox = halfW - Math.abs(dx);
      const oz = halfD - Math.abs(dz);
      if (ox < oz) {
        x += Math.sign(dx || 1) * (ox + 0.06);
      } else {
        z += Math.sign(dz || 1) * (oz + 0.06);
      }
      moved = true;
    }
    if (!moved) break;
  }
  return { x, z };
}

type SpriteEntry = {
  mesh: THREE.Mesh;
  lastKey: string;
  display: THREE.Vector3;
};

export class FloorScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: MapControls;
  private sprites = new Map<string, SpriteEntry>();
  private raf = 0;
  private getAgents: () => RenderAgent[];
  private clock = new THREE.Clock();
  private selectedId: string | null = null;
  private textures: THREE.Texture[] = [];
  private charTextures = new Map<string, THREE.CanvasTexture>();

  /** Invalide les textures perso (ex. après changement de DNA). */
  invalidateCharacterTextures() {
    for (const tex of this.charTextures.values()) {
      tex.dispose();
    }
    this.charTextures.clear();
    for (const entry of this.sprites.values()) {
      entry.lastKey = "";
    }
  }
  private resizeObserver: ResizeObserver | null = null;
  private onClick: ((event: MouseEvent) => void) | null = null;
  private onContextMenu: ((event: Event) => void) | null = null;
  private onControlsStart: (() => void) | null = null;
  private onControlsEnd: (() => void) | null = null;
  private canvas: HTMLCanvasElement;
  private panMinX = -12;
  private panMaxX = 12;
  private panHalfD = 12;
  onSelect: ((agent: RenderAgent | null) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, getAgents: () => RenderAgent[]) {
    this.getAgents = getAgents;
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x2a1c12, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.55;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x2a1c12, 36, 72);
    this.scene.background = new THREE.Color(0x2a1c12);

    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
    this.camera.position.copy(CAM_POS);

    this.controls = new MapControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enableRotate = false;
    this.controls.screenSpacePanning = false;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.minDistance = CAM_MIN_DIST;
    this.controls.maxDistance = CAM_MAX_DIST;
    this.controls.zoomSpeed = 1.05;
    this.controls.panSpeed = 0.85;
    // Gauche libre pour le pick ; droit = déplacer ; molette = zoom
    this.controls.mouseButtons = {
      LEFT: -1 as THREE.MOUSE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    this.controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    this.controls.target.copy(CAM_TARGET);
    this.controls.update();

    this.onControlsStart = () => {
      canvas.style.cursor = "grabbing";
    };
    this.onControlsEnd = () => {
      canvas.style.cursor = "pointer";
    };
    this.controls.addEventListener("start", this.onControlsStart);
    this.controls.addEventListener("end", this.onControlsEnd);

    this.onContextMenu = (event) => event.preventDefault();
    canvas.addEventListener("contextmenu", this.onContextMenu);

    this.buildRoom();
    this.bindResize(canvas);
    this.bindPick(canvas);
    this.loop();
  }

  /** Remet la caméra à la vue aérienne par défaut (salle de vente). */
  resetView() {
    this.camera.position.copy(CAM_POS);
    this.controls.target.copy(CAM_TARGET);
    this.controls.update();
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    if (this.onClick) {
      this.canvas.removeEventListener("click", this.onClick);
    }
    if (this.onContextMenu) {
      this.canvas.removeEventListener("contextmenu", this.onContextMenu);
    }
    if (this.onControlsStart) {
      this.controls.removeEventListener("start", this.onControlsStart);
    }
    if (this.onControlsEnd) {
      this.controls.removeEventListener("end", this.onControlsEnd);
    }
    this.controls.dispose();
    for (const tex of this.textures) {
      tex.dispose();
    }
    for (const tex of this.charTextures.values()) {
      tex.dispose();
    }
    this.charTextures.clear();
    this.renderer.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
        obj.geometry?.dispose?.();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((item) => item.dispose());
        else mat?.dispose?.();
      }
    });
  }

  private loadTex(
    url: string,
    onLoad: (texture: THREE.Texture) => void,
    options?: { repeat?: [number, number]; flipX?: boolean },
  ) {
    const loader = new THREE.TextureLoader();
    loader.load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      if (options?.repeat) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(options.repeat[0], options.repeat[1]);
      }
      if (options?.flipX) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.x = -1;
        texture.offset.x = 1;
      }
      this.textures.push(texture);
      onLoad(texture);
    });
  }

  private bindResize(canvas: HTMLCanvasElement) {
    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth ?? 800;
      const h = parent?.clientHeight ?? 500;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / Math.max(1, h);
      this.camera.updateProjectionMatrix();
    };
    resize();
    this.resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) {
      this.resizeObserver.observe(canvas.parentElement);
    }
  }

  private bindPick(canvas: HTMLCanvasElement) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    this.onClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, this.camera);
      const meshes = [...this.sprites.values()].map((row) => row.mesh);
      const hits = raycaster.intersectObjects(meshes);
      if (hits[0]) {
        const id = hits[0].object.userData.agentId as string;
        const agents = this.getAgents();
        const agent = agents.find((row) => row.id === id) ?? null;
        this.selectedId = agent?.id ?? null;
        this.onSelect?.(agent);
      } else {
        this.selectedId = null;
        this.onSelect?.(null);
      }
    };
    canvas.addEventListener("click", this.onClick);
  }

  private std(color: number, extras?: THREE.MeshStandardMaterialParameters) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.82,
      metalness: 0.04,
      ...extras,
    });
  }

  private applyWallMap(mat: THREE.MeshStandardMaterial, tex: THREE.Texture) {
    mat.map = tex;
    mat.color.setHex(0xffffff);
    mat.emissiveMap = tex;
    mat.emissive = new THREE.Color(0xffc080);
    mat.emissiveIntensity = 0.08;
    mat.needsUpdate = true;
  }

  private buildRoom() {
    const margin = 1.2;
    const hallHalfW = (HALL_W / 2) * CELL + margin;
    const hallHalfD = (GRID_H / 2) * CELL + margin;
    const hallD = hallHalfD * 2;
    const WALL_THICK = 0.55;
    /** Mur mitoyen = cellules 53/54. */
    const partitionX = (53.5 - HALL_W / 2) * CELL;
    const hallFloorRight = partitionX - WALL_THICK / 2;
    const annexFloorLeft = partitionX + WALL_THICK / 2;
    /** Mur est = bord grille annexe, sans double marge (sinon bibs flottent). */
    const annexEastX = annexFloorLeft + ANNEX_W * CELL;
    const hallFloorW = hallFloorRight + hallHalfW;
    const hallFloorCenterX = (-hallHalfW + hallFloorRight) / 2;
    const annexInnerW = annexEastX - annexFloorLeft;
    const annexInnerCenterX = annexFloorLeft + annexInnerW / 2;

    this.panMinX = -hallHalfW + PAN_MARGIN;
    this.panMaxX = annexEastX - PAN_MARGIN;
    this.panHalfD = hallHalfD - PAN_MARGIN;

    const floorMat = this.std(0xc4b49a, { roughness: 0.9 });
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(hallFloorW, hallD),
      floorMat,
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(hallFloorCenterX, 0, 0);
    this.scene.add(floor);
    this.loadTex(
      "/img/floor/wood_parquet.png",
      (tex) => {
        floorMat.map = tex;
        floorMat.color.setHex(0xffffff);
        floorMat.needsUpdate = true;
      },
      { repeat: [8, 5] },
    );

    const annexFloorMat = this.std(0xb8a890, { roughness: 0.92 });
    const annexFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(annexInnerW, hallD),
      annexFloorMat,
    );
    annexFloor.rotation.x = -Math.PI / 2;
    annexFloor.position.set(annexInnerCenterX, 0, 0);
    this.scene.add(annexFloor);
    this.loadTex(
      "/img/floor/wood_parquet.png",
      (tex) => {
        annexFloorMat.map = tex;
        annexFloorMat.color.setHex(0xd4c4a8);
        annexFloorMat.needsUpdate = true;
      },
      { repeat: [4, 5] },
    );

    this.scene.add(new THREE.AmbientLight(0xfff1d6, 1.05));
    this.scene.add(new THREE.HemisphereLight(0xffe8c8, 0x8a6a50, 0.75));

    const key = new THREE.DirectionalLight(0xfff6e8, 1.35);
    key.position.set(8, 16, 18);
    this.scene.add(key);

    const dusk = new THREE.DirectionalLight(0xff9a58, 0.28);
    dusk.position.set(0.4, 8, -14);
    this.scene.add(dusk);

    const hall = new THREE.PointLight(0xffe4c4, 8, 28, 1);
    hall.position.set(0, 5, 2);
    this.scene.add(hall);

    const annexLampA = new THREE.PointLight(0xffd4a8, 5.5, 16, 1.2);
    annexLampA.position.set(annexInnerCenterX - 1.2, 4.2, -2);
    this.scene.add(annexLampA);
    const annexLampB = new THREE.PointLight(0xe8b878, 4.2, 14, 1.2);
    annexLampB.position.set(annexInnerCenterX + 1.5, 3.8, 4);
    this.scene.add(annexLampB);

    const wallTexW = 5120;
    const wallTexH = 1200;
    /** Hauteur mur = proportion 5120×1200 sur la largeur salle historique. */
    const hallWRef = hallHalfW * 2;
    const backWallH = hallWRef * (wallTexH / wallTexW);

    const backMat = this.std(0x6a5344, { roughness: 0.78 });
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(hallFloorW, backWallH),
      backMat,
    );
    back.position.set(hallFloorCenterX, backWallH / 2 - 0.04, -hallHalfD);
    this.scene.add(back);
    this.loadTex("/img/floor/shop_back_wall_v16.png", (tex) => {
      this.applyWallMap(backMat, tex);
    });

    const leftMat = this.std(0x5a4638, { roughness: 0.9 });
    const left = new THREE.Mesh(
      new THREE.PlaneGeometry(hallD, backWallH),
      leftMat,
    );
    left.rotation.y = Math.PI / 2;
    left.position.set(-hallHalfW, backWallH / 2 - 0.04, 0);
    this.scene.add(left);
    this.loadTex("/img/floor/shop_side_wall_left.png", (tex) => {
      this.applyWallMap(leftMat, tex);
    });

    /**
     * Mur mitoyen épais salle ↔ annexe (vraie séparation de pièces)
     * + ouverture alignée porte grille y∈[20,25].
     */
    const doorZ0 = (20 - GRID_H / 2) * CELL;
    const doorZ1 = (25 - GRID_H / 2) * CELL;
    const doorGap = doorZ1 - doorZ0;
    const doorMidZ = (doorZ0 + doorZ1) / 2;
    const doorOpenH = backWallH * 0.68;
    const lintelH = Math.max(0.4, backWallH - doorOpenH);
    const southLen = hallHalfD - doorZ1;
    const northLen = doorZ0 + hallHalfD;

    const coreMat = this.std(0x3a2c22, { roughness: 0.88 });
    const revealMat = this.std(0x5a4638, { roughness: 0.82 });
    const jambMat = this.std(0x2e241c, { roughness: 0.75, metalness: 0.08 });
    type WallPart = {
      mat: THREE.MeshStandardMaterial;
      uOffset: number;
      uRepeat: number;
      vOffset: number;
      vRepeat: number;
    };
    const hallFaceParts: WallPart[] = [];
    const annexFaceParts: WallPart[] = [];

    const addPartitionSlab = (
      depth: number,
      z: number,
      height: number,
      yCenter: number,
      uOffset: number,
      uRepeat: number,
      vOffset: number,
      vRepeat: number,
    ) => {
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_THICK, height, depth),
        coreMat,
      );
      core.position.set(partitionX, yCenter, z);
      this.scene.add(core);

      const hallMat = this.std(0x5a4638, { roughness: 0.9 });
      const hallFace = new THREE.Mesh(
        new THREE.PlaneGeometry(depth, height),
        hallMat,
      );
      hallFace.rotation.y = -Math.PI / 2;
      hallFace.position.set(partitionX - WALL_THICK / 2 - 0.01, yCenter, z);
      this.scene.add(hallFace);
      hallFaceParts.push({
        mat: hallMat,
        uOffset,
        uRepeat,
        vOffset,
        vRepeat,
      });

      /**
       * Côté annexe : même découpe UV (porte au même endroit).
       * Vue depuis l’annexe (regard −X) : U 0 = entrée (+Z), U 1 = fond (−Z).
       */
      const annexMat = this.std(0x524438, { roughness: 0.88 });
      const annexFace = new THREE.Mesh(
        new THREE.PlaneGeometry(depth, height),
        annexMat,
      );
      annexFace.rotation.y = Math.PI / 2;
      annexFace.position.set(partitionX + WALL_THICK / 2 + 0.01, yCenter, z);
      this.scene.add(annexFace);
      annexFaceParts.push({
        mat: annexMat,
        uOffset,
        uRepeat,
        vOffset,
        vRepeat,
      });
    };

    if (northLen > 0.05) {
      addPartitionSlab(
        northLen,
        -hallHalfD + northLen / 2,
        backWallH,
        backWallH / 2 - 0.02,
        (southLen + doorGap) / hallD,
        northLen / hallD,
        0,
        1,
      );
    }
    if (southLen > 0.05) {
      addPartitionSlab(
        southLen,
        doorZ1 + southLen / 2,
        backWallH,
        backWallH / 2 - 0.02,
        0,
        southLen / hallD,
        0,
        1,
      );
    }
    if (lintelH > 0.05) {
      addPartitionSlab(
        doorGap,
        doorMidZ,
        lintelH,
        doorOpenH + lintelH / 2 - 0.02,
        southLen / hallD,
        doorGap / hallD,
        doorOpenH / backWallH,
        lintelH / backWallH,
      );
    }

    /** Intérieur de l’ouverture (tableaux / jambage) — textures bois. */
    const revealN = new THREE.Mesh(
      new THREE.PlaneGeometry(WALL_THICK, doorOpenH),
      revealMat,
    );
    revealN.position.set(partitionX, doorOpenH / 2, doorZ0 + 0.015);
    this.scene.add(revealN);

    const revealS = new THREE.Mesh(
      new THREE.PlaneGeometry(WALL_THICK, doorOpenH),
      revealMat,
    );
    revealS.rotation.y = Math.PI;
    revealS.position.set(partitionX, doorOpenH / 2, doorZ1 - 0.015);
    this.scene.add(revealS);

    const revealTop = new THREE.Mesh(
      new THREE.PlaneGeometry(WALL_THICK, doorGap),
      revealMat,
    );
    revealTop.rotation.x = Math.PI / 2;
    revealTop.position.set(partitionX, doorOpenH - 0.015, doorMidZ);
    this.scene.add(revealTop);

    /** Encadrement de porte (montants). */
    const jambDepth = 0.22;
    for (const zJamb of [doorZ0 + jambDepth / 2, doorZ1 - jambDepth / 2]) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_THICK + 0.12, doorOpenH, jambDepth),
        jambMat,
      );
      jamb.position.set(partitionX, doorOpenH / 2, zJamb);
      this.scene.add(jamb);
    }
    const header = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_THICK + 0.12, 0.2, doorGap + 0.08),
      jambMat,
    );
    header.position.set(partitionX, doorOpenH + 0.05, doorMidZ);
    this.scene.add(header);

    this.loadTex("/img/floor/shelf_wood.png", (tex) => {
      for (const mat of [revealMat, jambMat, coreMat]) {
        mat.map = tex;
        mat.color.setHex(0xb08968);
        mat.needsUpdate = true;
      }
    });

    const applyWallParts = (url: string, parts: WallPart[]) => {
      this.loadTex(url, (tex) => {
        for (const part of parts) {
          const mapped = tex.clone();
          mapped.wrapS = THREE.ClampToEdgeWrapping;
          mapped.wrapT = THREE.ClampToEdgeWrapping;
          mapped.offset.set(part.uOffset, part.vOffset);
          mapped.repeat.set(part.uRepeat, part.vRepeat);
          mapped.needsUpdate = true;
          this.textures.push(mapped);
          this.applyWallMap(part.mat, mapped);
        }
      });
    };
    applyWallParts("/img/floor/shop_side_wall_right.png", hallFaceParts);
    applyWallParts("/img/floor/annex_left_wall_v3.png", annexFaceParts);

    /** Murs annexe : fond (étagères), est (étagères + fenêtre), sud. */
    const annexBackMat = this.std(0x5a4a3c, { roughness: 0.82 });
    const annexBack = new THREE.Mesh(
      new THREE.PlaneGeometry(annexInnerW, backWallH),
      annexBackMat,
    );
    annexBack.position.set(
      annexInnerCenterX,
      backWallH / 2 - 0.04,
      -hallHalfD,
    );
    this.scene.add(annexBack);
    this.loadTex("/img/floor/annex_back_wall_v3.png", (tex) => {
      this.applyWallMap(annexBackMat, tex);
    });

    const annexEastMat = this.std(0x524438, { roughness: 0.88 });
    const annexEast = new THREE.Mesh(
      new THREE.PlaneGeometry(hallD, backWallH),
      annexEastMat,
    );
    annexEast.rotation.y = -Math.PI / 2;
    annexEast.position.set(annexEastX, backWallH / 2 - 0.04, 0);
    this.scene.add(annexEast);
    this.loadTex("/img/floor/annex_side_wall_v3.png", (tex) => {
      this.applyWallMap(annexEastMat, tex);
    });

    const annexSouthMat = this.std(0x4a3c30, { roughness: 0.9 });
    const annexSouth = new THREE.Mesh(
      new THREE.PlaneGeometry(annexInnerW, backWallH),
      annexSouthMat,
    );
    annexSouth.rotation.y = Math.PI;
    annexSouth.position.set(
      annexInnerCenterX,
      backWallH / 2 - 0.04,
      hallHalfD,
    );
    this.scene.add(annexSouth);
    this.loadTex("/img/floor/annex_back_wall_v3.png", (tex) => {
      this.applyWallMap(annexSouthMat, tex);
    });

    const wood = this.std(0xb08968, { roughness: 0.72 });
    const gold = this.std(0xe2c48a, {
      roughness: 0.45,
      metalness: 0.18,
      emissive: 0x5a4018,
      emissiveIntensity: 0.12,
    });
    const shelfWood = this.std(0x8a6a4a, { roughness: 0.8 });
    const shelfKeys = ["a", "b", "c", "d", "e", "f"] as const;
    const shelfFrontVariants = shelfKeys.map(() =>
      this.std(0x6a5344, {
        roughness: 0.68,
        transparent: true,
        alphaTest: 0.15,
        depthWrite: true,
      }),
    );
    const cornerFaceL = this.std(0x6a5344, {
      roughness: 0.68,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: true,
    });
    const cornerFaceR = this.std(0x6a5344, {
      roughness: 0.68,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: true,
    });
    const shelfHeight = backWallH * 0.8;

    this.loadTex("/img/floor/brass_wood_counter.png", (tex) => {
      gold.map = tex;
      gold.color.setHex(0xc9a882);
      gold.needsUpdate = true;
    });
    this.loadTex("/img/floor/shelf_wood.png", (tex) => {
      wood.map = tex;
      wood.color.setHex(0xf2d2a8);
      wood.needsUpdate = true;
      shelfWood.map = tex;
      shelfWood.color.setHex(0xffffff);
      shelfWood.needsUpdate = true;
    });
    this.loadTex("/img/floor/shelf_corner_face.png", (tex) => {
      cornerFaceL.map = tex;
      cornerFaceL.color.setHex(0xffffff);
      cornerFaceL.needsUpdate = true;
    });
    this.loadTex("/img/floor/shelf_corner_face_b_v2.png", (tex) => {
      cornerFaceR.map = tex;
      cornerFaceR.color.setHex(0xffffff);
      cornerFaceR.needsUpdate = true;
    });
    shelfKeys.forEach((key, i) => {
      this.loadTex(`/img/floor/shelf_unit_${key}_v3.png`, (tex) => {
        const mat = shelfFrontVariants[i]!;
        mat.map = tex;
        mat.color.setHex(0xffffff);
        mat.needsUpdate = true;
      });
    });

    let shelfIndex = 0;
    for (const rect of FURNITURE) {
      const cx = rect.x + (rect.w - 1) / 2;
      const cy = rect.y + (rect.h - 1) / 2;
      const pos = toWorld(cx, cy);
      const worldW = rect.w * CELL * 0.98;
      const worldD = rect.h * CELL * 0.9;
      if (rect.code.startsWith("annex_corner_")) {
        if (rect.code.endsWith("_s")) {
          this.placeAnnexCorner(
            rect.code.includes("_nw") ? "nw" : "ne",
            Math.max(0.42, CELL),
            shelfHeight,
            cornerFaceL,
            cornerFaceR,
            shelfWood,
            annexFloorLeft,
            annexEastX,
            hallHalfD,
          );
        }
      } else if (
        rect.code.startsWith("shelf_") ||
        rect.code.startsWith("annex_shelf_")
      ) {
        const variant = shelfFrontVariants[shelfIndex % 6]!;
        const facing =
          rect.facing ?? (rect.h > rect.w ? "east" : "south");
        const isAnnexShelf = rect.code.startsWith("annex_shelf_");
        let longW = Math.max(rect.w, rect.h) * CELL * 0.98;
        const thick = Math.max(0.42, Math.min(rect.w, rect.h) * CELL);
        let sx = pos.x;
        let sz = pos.z;
        /** Coller aux murs et centrer dans les travées (vide = pilier). */
        if (isAnnexShelf) {
          const bay = ANNEX_SHELF_BAYS[rect.code];
          const span = bay ? baySpanU(bay[0], bay[1]) : null;
          if (facing === "east") {
            sx = annexFloorLeft + thick / 2;
            if (span) {
              sz = hallHalfD - span.u * hallD;
            }
          } else if (facing === "west") {
            sx = annexEastX - thick / 2;
            if (span) {
              sz = -hallHalfD + span.u * hallD;
            }
          } else {
            sz = -hallHalfD + thick / 2;
            if (span) {
              sx = annexFloorLeft + span.u * annexInnerW;
            }
          }
        }
        this.placeShelf(
          sx,
          sz,
          longW,
          thick,
          shelfHeight,
          variant,
          shelfWood,
          facing,
          facing !== "east" || rect.code.startsWith("annex_shelf_"),
        );
        if (shelfIndex % 7 === 3) {
          const lamp = new THREE.PointLight(0xffe0b0, 4.2, 10, 1);
          lamp.position.set(sx, shelfHeight * 0.85, sz + 1.4);
          this.scene.add(lamp);
        }
        shelfIndex += 1;
      } else if (rect.code === "counter") {
        /**
         * Échelle Reliquary : hauteur ~taille de taille du sprite,
         * calée sur shelfHeight (pas un coffre bas).
         */
        const deskH = Math.max(1.25, shelfHeight * 0.24);
        const topH = deskH * 0.06;
        const counterW = rect.w * CELL * 0.98;
        /** Peu profond : évite que le billboard staff coupe le volume. */
        const counterD = Math.min(rect.h * CELL * 0.55, deskH * 0.62);
        const desk = new THREE.Mesh(
          new THREE.BoxGeometry(counterW, deskH, counterD),
          gold,
        );
        desk.position.set(pos.x, deskH / 2, pos.z);
        this.scene.add(desk);
        const top = new THREE.Mesh(
          new THREE.BoxGeometry(counterW + 0.14, topH, counterD + 0.12),
          gold,
        );
        top.position.set(pos.x, deskH + topH / 2, pos.z);
        this.scene.add(top);
        /** Panneau face clients pour masser le volume. */
        const apron = new THREE.Mesh(
          new THREE.BoxGeometry(counterW * 0.96, deskH * 0.72, 0.08),
          gold,
        );
        if (rect.w >= rect.h) {
          apron.position.set(pos.x, deskH * 0.4, pos.z - counterD * 0.5 - 0.02);
        } else {
          apron.rotation.y = Math.PI / 2;
          apron.position.set(pos.x - counterW * 0.5 - 0.02, deskH * 0.4, pos.z);
        }
        this.scene.add(apron);
        /** Lampe côté clients (nord si horizontal, ouest si vertical). */
        const lampDx = rect.w >= rect.h ? -counterW * 0.32 : -counterW * 0.15;
        const lampDz = rect.w >= rect.h ? -counterD * 0.12 : -counterD * 0.2;
        const lampY = deskH + topH + 0.18;
        const lamp = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 10, 10),
          new THREE.MeshStandardMaterial({
            color: 0xffedc1,
            emissive: 0xffc978,
            emissiveIntensity: 1.1,
            roughness: 0.35,
          }),
        );
        lamp.position.set(pos.x + lampDx, lampY, pos.z + lampDz);
        this.scene.add(lamp);
        const candle = new THREE.PointLight(0xffc978, 3.2, 9, 1);
        candle.position.set(pos.x + lampDx, lampY + 0.25, pos.z + lampDz);
        this.scene.add(candle);
      } else if (rect.code === "dock" || rect.code === "reserve") {
        const deskH = Math.max(1.1, shelfHeight * 0.22);
        const topH = deskH * 0.06;
        const deskW = rect.w * CELL * 0.98;
        const deskD = Math.min(rect.h * CELL * 0.55, deskH * 0.62);
        const desk = new THREE.Mesh(
          new THREE.BoxGeometry(deskW, deskH, deskD),
          gold,
        );
        desk.position.set(pos.x, deskH / 2, pos.z);
        this.scene.add(desk);
        const top = new THREE.Mesh(
          new THREE.BoxGeometry(deskW + 0.1, topH, deskD + 0.1),
          gold,
        );
        top.position.set(pos.x, deskH + topH / 2, pos.z);
        this.scene.add(top);
      }
    }

    const entrance = toWorld(spawnPoint().x, spawnPoint().y);
    const rugMat = this.std(0xa45a42, { roughness: 0.92 });
    const rug = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.05, 2.1), rugMat);
    rug.position.set(entrance.x, 0.03, entrance.z);
    this.scene.add(rug);
    this.loadTex("/img/floor/entrance_rug.png", (tex) => {
      rugMat.map = tex;
      rugMat.color.setHex(0xffffff);
      rugMat.needsUpdate = true;
    });
  }

  private placeAnnexCorner(
    kind: "nw" | "ne",
    thick: number,
    height: number,
    faceLeftPost: THREE.MeshStandardMaterial,
    faceRightPost: THREE.MeshStandardMaterial,
    wood: THREE.MeshStandardMaterial,
    annexFloorLeft: number,
    annexEastX: number,
    hallHalfD: number,
  ) {
    const D = Math.max(0.42, thick);
    const arm = 4 * CELL * 0.98;
    const zBack = -hallHalfD + D / 2;
    if (kind === "nw") {
      this.placeShelf(
        annexFloorLeft + arm / 2,
        zBack,
        arm,
        D,
        height,
        faceLeftPost,
        wood,
        "south",
        true,
      );
      this.placeShelf(
        annexFloorLeft + D / 2,
        -hallHalfD + arm / 2,
        arm,
        D,
        height,
        faceRightPost,
        wood,
        "east",
        true,
      );
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(D * 0.9, height, D * 0.9),
        wood,
      );
      post.position.set(
        annexFloorLeft + D * 0.95,
        height / 2,
        -hallHalfD + D * 0.95,
      );
      this.scene.add(post);
      return;
    }
    this.placeShelf(
      annexEastX - arm / 2,
      zBack,
      arm,
      D,
      height,
      faceRightPost,
      wood,
      "south",
      true,
    );
    this.placeShelf(
      annexEastX - D / 2,
      -hallHalfD + arm / 2,
      arm,
      D,
      height,
      faceLeftPost,
      wood,
      "west",
      true,
    );
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(D * 0.9, height, D * 0.9),
      wood,
    );
    post.position.set(
      annexEastX - D * 0.95,
      height / 2,
      -hallHalfD + D * 0.95,
    );
    this.scene.add(post);
  }

  private placeShelf(
    x: number,
    z: number,
    longW: number,
    thick: number,
    height: number,
    front: THREE.MeshStandardMaterial,
    wood: THREE.MeshStandardMaterial,
    facing: "south" | "east" | "west" = "south",
    singleFace = false,
  ) {
    const D = Math.max(0.42, thick);
    if (facing === "east" || facing === "west") {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(D, height, longW),
        wood,
      );
      body.position.set(x, height / 2, z);
      this.scene.add(body);
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(longW * 0.98, height * 0.98),
        front,
      );
      if (facing === "east") {
        face.rotation.y = Math.PI / 2;
        face.position.set(x + D * 0.52, height / 2, z);
        this.scene.add(face);
        if (!singleFace) {
          const back = new THREE.Mesh(
            new THREE.PlaneGeometry(longW * 0.98, height * 0.98),
            front,
          );
          back.rotation.y = -Math.PI / 2;
          back.position.set(x - D * 0.52, height / 2, z);
          this.scene.add(back);
        }
      } else {
        face.rotation.y = -Math.PI / 2;
        face.position.set(x - D * 0.52, height / 2, z);
        this.scene.add(face);
      }
      return;
    }
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(longW, height, D),
      wood,
    );
    body.position.set(x, height / 2, z);
    this.scene.add(body);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(longW * 0.98, height * 0.98),
      front,
    );
    face.position.set(x, height / 2, z + D * 0.52);
    this.scene.add(face);
  }

  private clampPanTarget() {
    const t = this.controls.target;
    const ox = this.camera.position.x - t.x;
    const oy = this.camera.position.y - t.y;
    const oz = this.camera.position.z - t.z;
    const nx = THREE.MathUtils.clamp(t.x, this.panMinX, this.panMaxX);
    const nz = THREE.MathUtils.clamp(t.z, -this.panHalfD, this.panHalfD);
    if (nx !== t.x || nz !== t.z || t.y !== CAM_TARGET.y) {
      t.set(nx, CAM_TARGET.y, nz);
      this.camera.position.set(t.x + ox, t.y + oy, t.z + oz);
    }
  }

  private loop = () => {
    this.raf = window.requestAnimationFrame(this.loop);
    const t = this.clock.getElapsedTime();
    this.controls.update();
    this.clampPanTarget();
    this.syncSprites(t);
    this.renderer.render(this.scene, this.camera);
  };

  private syncSprites(time: number) {
    const agents = this.getAgents();
    const seen = new Set<string>();
    const cam = this.camera.position;
    for (const agent of agents) {
      seen.add(agent.id);
      let entry = this.sprites.get(agent.id);
      const anim = resolveAnim(agent.walking);
      const frame = resolveFrame(anim, time);
      const selected = this.selectedId === agent.id;
      const key = `${agent.dna.seed}-${agent.facing}-${anim}-${frame}-${selected ? 1 : 0}`;
      if (!entry) {
        // Plan vertical : rotation = face caméra (jamais de tranche).
        // La direction se lit dans le dessin (face / profil / dos).
        const geo = new THREE.PlaneGeometry(SPRITE_W, SPRITE_H);
        geo.translate(0, SPRITE_H / 2, 0);
        const mat = new THREE.MeshBasicMaterial({
          transparent: true,
          depthWrite: false,
          depthTest: true,
          alphaTest: 0.35,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = 2;
        mesh.userData.agentId = agent.id;
        this.scene.add(mesh);
        entry = {
          mesh,
          lastKey: "",
          display: toWorld(agent.x, agent.y),
        };
        this.sprites.set(agent.id, entry);
      }
      const target = toWorld(agent.x, agent.y);
      const cleared = clearFurnitureOverlap(target.x, target.z);
      target.x = cleared.x;
      target.z = cleared.z;
      entry.display.lerp(target, 0.28);
      const kept = clearFurnitureOverlap(entry.display.x, entry.display.z);
      entry.display.x = kept.x;
      entry.display.z = kept.z;

      const px = entry.display.x;
      const pz = entry.display.z;
      let bx = cam.x - px;
      let by = cam.y - 0.02;
      let bz = cam.z - pz;
      const blen = Math.hypot(bx, by, bz) || 1;
      bx /= blen;
      by /= blen;
      bz /= blen;
      entry.mesh.position.set(
        px + bx * SPRITE_DEPTH_BIAS,
        0.02 + by * SPRITE_DEPTH_BIAS * 0.15,
        pz + bz * SPRITE_DEPTH_BIAS,
      );
      // Canvas toujours lisible : yaw vers la caméra (pas vers la marche)
      entry.mesh.rotation.set(0, Math.atan2(bx, bz), 0);
      entry.mesh.renderOrder = 2;

      const mat = entry.mesh.material as THREE.MeshBasicMaterial;
      mat.color.set(selected ? 0xffedc1 : 0xffffff);
      if (entry.lastKey !== key) {
        let texture = this.charTextures.get(key);
        if (!texture) {
          const canvas = composeCharacterCanvas(agent.dna, {
            facing: agent.facing,
            anim,
            frame,
          });
          texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          texture.needsUpdate = true;
          this.charTextures.set(key, texture);
        }
        mat.map = texture;
        mat.needsUpdate = true;
        entry.lastKey = key;
      }
    }
    for (const [id, entry] of this.sprites) {
      if (seen.has(id)) continue;
      this.scene.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      (entry.mesh.material as THREE.Material).dispose();
      this.sprites.delete(id);
    }
  }
}
