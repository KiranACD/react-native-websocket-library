/*
- Defines the type of configuration object accepted by the websocket client
- Choosing a configuration object over individual parameters for flexibility, extensibility, storability
*/

import { WebSocketStatus } from "./constants";

export interface WebSocketOptions {
    protocols?: string | string[]; // Optional sub-protocols for WebSocket handshake
    headers?: { [key: string]: string }; 
    timeout?: number; 
    reconnect?: boolean;
    maxReconnectAttempts?: number; 
    reconnectInterval?: number;

}

/*
Standardized error for all types of errors
- Predictable error handling across the library
- Proper error categorization
- Provides context for debugging while staying simple
*/ 
export type WebSocketError = {
    code: number;
    message: string;
    timestamp: number;
    type?: string;
}

/*
Standardized message when the websocket recieves a message
- Predicatable message handling
- Combines timestamp and data and makes logging them simple
*/

export interface WebSocketMessage {
    data: string | ArrayBuffer;
    timestamp: number;
}

/*
Standardized type object for websocket events. 
- Predictable websocket open and close event handling and logging
- The reconnectCount object is applicable to open events. 
*/

export type WebSocketEvent = {
    type: 'open' | 'close';
    timestamp: number;
    reconnectCount?: number;
}

export type WebSocketEventMap = {
    connect: () => void;
    disconnect: (code?: number) => void;
    message: (data: WebSocketMessage) => void;
    error: (error: WebSocketError) => void;
    statusChange: (status: WebSocketStatus) => void;
};


