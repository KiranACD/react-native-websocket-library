export interface WebSocketOptions {
    protocols?: string | string[];
    headers?: { [key: string]: string };
    timeout?: number;
    reconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectInterval?: number;

}

export type WebSocketState = {
    isManualClose: boolean;
    isConnected: boolean;
    isConnecting: boolean;
    reconnectCount: number;
    lastError: WebSocketError | null;
}

export type WebSocketError = {
    code: number;
    message: string;
    timestamp: number;
    type?: string;
}

export interface WebSocketMessage {
    data: string | ArrayBuffer;
    timestamp: number;
}

export type WebSocketEvent = {
    type: 'open' | 'close' | 'error';
    timestamp: number;
    reconnectCount?: number;
}

