import { DEFAULT_CONFIG, WebSocketStatus, WSEventMap } from "./constants";
import { WebSocketError, WebSocketEventMap, WebSocketMessage, WebSocketOptions } from "./types";


/**
 * Core WebSocket client implementation.
 * This class handles all the low-level WebSocket operations and provides a clean API.
*/

export class RNWebSocket {
    private url: string;
    private ws: WebSocket | null;
    private config: WebSocketOptions;
    private eventListeners: Partial<Record<keyof WebSocketEventMap, Set<Function>>>;
    private status: WebSocketStatus;
    private manualClose: boolean; // prevents automatic reconnection when the user closes the connection
    private connectionTimeout: NodeJS.Timeout | null;
    private reconnectCount: number;

    // Merges user config with default values to ensure all required settings exist.
    constructor(url: string, config: WebSocketOptions) {

        this.url = url;
        this.config = config ? {...DEFAULT_CONFIG, ...config} : {...DEFAULT_CONFIG};
        this.ws = null;
        this.eventListeners = {};
        this.manualClose = false;
        this.status = WebSocketStatus.DISCONNECTED;
        this.connectionTimeout = null;
        this.reconnectCount = 0;

        this.initializeEventListeners();
    }


    private initializeEventListeners(): void {
        Object.keys(WSEventMap).forEach((event) => {
            this.eventListeners[event as keyof WebSocketEventMap] = new Set();
        })
    }

    public on<K extends keyof WebSocketEventMap>(event: K, listener: WebSocketEventMap[K]): void {
        this.eventListeners[event]?.add(listener);
    }

    public off<K extends keyof WebSocketEventMap>(event: K, listener: WebSocketEventMap[K]): void {
        this.eventListeners[event]?.delete(listener);
    }

    public emit<K extends keyof WebSocketEventMap>(event: K, ...args: Parameters<WebSocketEventMap[K]>): void {
        this.eventListeners[event]?.forEach((listener) => {
            listener(...args)
        })
    }

    /**
     * Updates the WebSocket connection status.
     * Centralized to ensure consistent state management and enable future event handling.
    */
    private updateStatus(newStatus: WebSocketStatus) {
        this.status = newStatus;
        this.emit('statusChange', newStatus);
    }

    /**
     * Initiates a WebSocket connection.
     * Includes guards against invalid state transitions and handles connection errors.
    */
    public connect(): void {
        if (this.status === WebSocketStatus.CONNECTING || this.status === WebSocketStatus.CONNECTED) {
            return;
        }

        this.manualClose = false;
        this.updateStatus(WebSocketStatus.CONNECTING);

        try {
            this.ws = new WebSocket(this.url, this.config.protocols);
            this.setupEventListeners();
            this.startConnectionTimeout();
        } catch (error) {
            this.handleError({
                code: 0,
                message: "Websocket connection error",
                timestamp: Date.now(),
            });
        }
    }
    /**
     * Sets up event listeners for the WebSocket instance.
     * Private to ensure consistent event handling throughout the library.
    */
    private setupEventListeners(): void {
        if (!this.ws) return;

        this.ws.onopen = () => {
            this.clearConnectionTimeout();
            this.updateStatus(WebSocketStatus.CONNECTED);
            this.resetReconnectCount();
            this.emit('connect');
        };

        this.ws.onclose = (event) => {
            this.updateStatus(WebSocketStatus.DISCONNECTED);
            this.emit('disconnect');

            // Only attempt reconnection if the connection wasn't manually closed
            if (!this.manualClose) {
                this.handleReconnection();
            }
        };

        this.ws.onerror = (error) => {
            this.handleError({
                code: 0,
                message: 'WebSocket error',
                timestamp: Date.now(),
            });
        }

        this.ws.onmessage = (event) => {
            const message = {
                data: event.data,
                timestamp: Date.now(),
            }
            this.handleMessage(message);
        }
    }

    private handleMessage(message: WebSocketMessage) {
        this.emit('message', message);
    }

    public send(data: string | ArrayBuffer): void {
        if (this.status !== WebSocketStatus.CONNECTED) {
            this.handleError({
                code: -1,
                message: 'Cannot send message: WebSocket is not connected',
                timestamp: Date.now(),
            });
            return;
        }

        try {
            this.ws?.send(data);
        } catch (error) {
            this.handleError({
                code: -1,
                message: 'Failed to send message',
                timestamp: Date.now(),
            });
        }
    }

    /**
     * Centralizes error handling for the WebSocket client.
    */
    private handleError(error: WebSocketError): void {
        this.emit('error', error);
    }

    private disconnect(): void {
        this.clearConnectionTimeout();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.status = WebSocketStatus.DISCONNECTED;
    }

    /**
     * Cleanly closes the WebSocket connection.
     * Sets manual close flag to prevent automatic reconnection attempts.
    */
    public close(): void {
        this.manualClose = true;
        this.disconnect();
    }

    /**
     * Handles reconnection attempts after connection loss.
    */
    private handleReconnection(): void {
        if (this.manualClose || (this.config.maxReconnectAttempts && this.config.maxReconnectAttempts < this.reconnectCount)) {
            this.handleError({
                code: 1,
                message: 'Reconnect attempts exceeded',
                timestamp: Date.now(),
            })
            return;
        };
        this.reconnectCount++;        
        this.connect();
    }

    private startConnectionTimeout(): void {
        this.connectionTimeout = setTimeout(() => {
            if (this.status !== WebSocketStatus.CONNECTED) {
                this.handleError({
                    code: 0,
                    message: 'Connection timeout',
                    timestamp: Date.now(),
                });
                this.disconnect();
            }
        }, this.config.reconnectInterval);
    }

    /**
     * Clears any pending timeout functions.
    */
    private clearConnectionTimeout(): void {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
    }

    private resetReconnectCount(): void {
        this.reconnectCount = 0;
    }
}