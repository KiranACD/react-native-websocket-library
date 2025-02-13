import { WebSocketEventMap } from "./types";

/*
This is the default config to initialize certain options with default values if none provided
*/
export const DEFAULT_CONFIG = {
    reconnect: false,
    timeout: 5000,
    maxReconnectAttempts: 0,
};

/*
Standardized error messages 
- Single source of truth
*/
export const ERROR_CODES = {
    CONNECTION_FAILED: 'CONNECTION_FAILED',
    CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
    INVALID_URL: 'INVALID_URL',
    MESSAGE_FAILED: 'MESSAGE_FAILED',
    MAX_RETRIES_EXCEEDED: 'MAX_RETRIES_EXCEEDED',
};

/**
 * Standardized websocket status
 * Single source of truth
 * Using an enum ensures we only have valid states.
 */

export enum WebSocketStatus {
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED',
    RECONNECTING = 'RECONNECTING',
    CLOSED = 'CLOSED',
};

export const WSEventMap: Record<keyof WebSocketEventMap, null> = {
    connect: null,
    disconnect: null,
    message: null,
    error: null,
    statusChange: null,
}
