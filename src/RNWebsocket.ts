import { DEFAULT_CONFIG, WebSocketStatus } from "./constants";
import { WebSocketError, WebSocketOptions } from "./types";


export class RNWebocket {
    private url: string;
    private ws: WebSocket | null;
    private config: WebSocketOptions;
    private status: WebSocketStatus;
    private manualClose: boolean;
    private reconnectTimeout: NodeJS.Timeout | null;

    constructor(url: string, config: WebSocketOptions) {
        this.url = url;
        this.config = config ? {...DEFAULT_CONFIG, ...config} : {...DEFAULT_CONFIG};
        this.ws = null;
        this.manualClose = false;
        this.status = WebSocketStatus.DISCONNECTED;
        this.reconnectTimeout = null;
    }

    private updateStatus(newStatus: WebSocketStatus) {
        this.status = newStatus;
    }

    public connect(): void {
        if (this.status === WebSocketStatus.CONNECTING || this.status === WebSocketStatus.CONNECTED) {
            return;
        }

        this.manualClose = false;
        this.updateStatus(WebSocketStatus.CONNECTING);

        try {
            this.ws = new WebSocket(this.url, this.config.protocols);
            this.setupEventListeners();
        } catch (error) {
            this.handleError({
                code: 0,
                message: "Websocket connection error",
                timestamp: Date.now(),
            });
        }
    }

    private setupEventListeners(): void {
        if (!this.ws) return;

        this.ws.onopen = () => {
            this.clearConnectionTimeout();
            this.updateStatus(WebSocketStatus.CONNECTED);
        };

        this.ws.onclose = (event) => {
            this.updateStatus(WebSocketStatus.DISCONNECTED);
            if (!this.manualClose) {
                this.handleReconnection();
            } else {
                this.updateStatus(WebSocketStatus.DISCONNECTED)
            }
        };

        this.ws.onerror = (error) => {
            this.handleError({
                code: 0,
                message: 'WebSocket error',
                timestamp: Date.now(),
            });
        }
    }

    private handleError(error: WebSocketError): void {
        console.error('WebSocket error: ', error);
    }

    public disconnect(): void {
        this.manualClose = true;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    private handleReconnection(): void {
        if (this.manualClose) return;

        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, this.config.reconnectInterval);
    }

    private clearConnectionTimeout(): void {
    
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
      }
}