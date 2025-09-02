export class PartyWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  
  connect(partyId: string) {
    // console.log(`Connecting to party ${partyId}`);
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }
  
  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }
  
  emit(event: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }
}

export const partySocket = new PartyWebSocket();
