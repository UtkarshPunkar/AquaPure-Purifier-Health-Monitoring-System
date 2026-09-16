// In-memory snapshot and live streaming activity store for ESP32-CAM frames
export interface StoredSnapshot {
  id: string;
  buffer: Buffer;
  contentType: string;
  timestamp: Date;
  deviceId: string;
  purifierCode: string;
}

class SnapshotStore {
  private snapshots: Map<string, StoredSnapshot> = new Map();
  private latestLiveFrame: Buffer | null = null;
  private latestLiveContentType: string = 'image/jpeg';
  private latestLiveTime: Date | null = null;
  private lastStreamActivityTime: number = 0;

  public markStreamActivity() {
    this.lastStreamActivityTime = Date.now();
    this.latestLiveTime = new Date();
  }

  public isStreamActive(withinMs = 12000): boolean {
    return Date.now() - this.lastStreamActivityTime < withinMs;
  }

  public setLatestLiveFrame(buffer: Buffer, contentType = 'image/jpeg') {
    this.latestLiveFrame = buffer;
    this.latestLiveContentType = contentType;
    this.latestLiveTime = new Date();
    this.lastStreamActivityTime = Date.now();
  }

  public getLatestLiveFrame(): { buffer: Buffer; contentType: string; timestamp: Date } | null {
    if (!this.latestLiveFrame) return null;
    return {
      buffer: this.latestLiveFrame,
      contentType: this.latestLiveContentType,
      timestamp: this.latestLiveTime || new Date(),
    };
  }

  public saveSnapshot(id: string, buffer: Buffer, contentType = 'image/jpeg', deviceId = 'ESP32-CAM-1', purifierCode = 'WP-1'): StoredSnapshot {
    const snap: StoredSnapshot = {
      id,
      buffer,
      contentType,
      timestamp: new Date(),
      deviceId,
      purifierCode,
    };
    this.snapshots.set(id, snap);
    return snap;
  }

  public getSnapshot(id: string): StoredSnapshot | null {
    return this.snapshots.get(id) || null;
  }

  public getAllSnapshots(): StoredSnapshot[] {
    return Array.from(this.snapshots.values());
  }
}

export const snapshotStore = new SnapshotStore();
