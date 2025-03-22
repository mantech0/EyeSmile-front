declare module '@mediapipe/face_mesh' {
  export class FaceMesh {
    constructor(config?: { locateFile?: (file: string) => string });
    setOptions(options: {
      maxNumFaces?: number;
      refineLandmarks?: boolean;
      minDetectionConfidence?: number;
      minTrackingConfidence?: number;
    }): void;
    onResults(callback: (results: FaceMeshResults) => void): void;
    send(config: { image: HTMLVideoElement }): Promise<void>;
    close(): void;

    static readonly FACEMESH_TESSELATION: any;
  }

  export interface FaceMeshResults {
    image: HTMLVideoElement;
    multiFaceLandmarks?: Array<Array<{ x: number; y: number; z: number }>>;
  }
}

declare module '@mediapipe/camera_utils' {
  export class Camera {
    constructor(
      videoElement: HTMLVideoElement,
      config: {
        onFrame: () => Promise<void>;
        width: number;
        height: number;
      }
    );
    start(): Promise<void>;
    stop(): void;
  }
}

declare module '@mediapipe/drawing_utils' {
  export function drawConnectors(
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number; z: number }>,
    connections: any,
    config: {
      color?: string;
      lineWidth?: number;
    }
  ): void;
} 