/**
 * 房间 Store - 多人同步（M3 实现完整逻辑，M1 先占位）
 */

type Listener = () => void;

export class RoomStore {
  currentRoom: any = null;
  members: any[] = [];
  you: any = null;
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  protected notify() {
    this.listeners.forEach(l => l());
  }

  get isInRoom(): boolean {
    return !!this.currentRoom;
  }

  // M3 中补充 WebSocket 接入逻辑
}
