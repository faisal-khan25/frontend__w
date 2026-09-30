
import { io } from "socket.io-client";
import { SOCKET_URL, normalizeAssetUrls } from "./api";

class SocketService {
  constructor() {
    this._socket = null;
    this._reconnectCallbacks = new Set();
    this._wrapped = new WeakMap();
  }

  connect(token) {
    if (this._socket?.connected) return;
    if (this._socket) {
      this._socket.disconnect();
    }

    this._socket = io(SOCKET_URL, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this._socket.on("connect", () => {
      console.debug("[socket] connected", this._socket.id);
      this._reconnectCallbacks.forEach((cb) => cb());
    });
    this._socket.on("disconnect", (r) =>
      console.debug("[socket] disconnected", r)
    );
    this._socket.on("connect_error", (e) =>
      console.warn("[socket] error", e.message)
    );
  }

  disconnect() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
    this._reconnectCallbacks.clear();
  }

  emit(event, data) {
    if (!this._socket?.connected) {
      console.warn(`[socket] emit '${event}' — not connected`);
      return;
    }
    this._socket.emit(event, data);
  }

  on(event, cb) {
    if (!this._socket) return;
    if (typeof cb !== "function") return this._socket.on(event, cb);
    let wrapped = this._wrapped.get(cb);
    if (!wrapped) {
      // Rewrite "/uploads/..." image paths in incoming payloads so avatars work cross-origin.
      wrapped = (...args) => cb(...args.map((a) => normalizeAssetUrls(a)));
      this._wrapped.set(cb, wrapped);
    }
    this._socket.on(event, wrapped);
  }

  off(event, cb) {
    if (cb) this._socket?.off(event, (typeof cb === "function" && this._wrapped.get(cb)) || cb);
    else this._socket?.removeAllListeners(event);
  }

  onReconnect(cb) {
    this._reconnectCallbacks.add(cb);
    return () => this._reconnectCallbacks.delete(cb);
  }

  get connected() {
    return this._socket?.connected ?? false;
  }

  get id() {
    return this._socket?.id ?? null;
  }
}

const socketService = new SocketService();
export default socketService;