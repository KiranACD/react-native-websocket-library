import { useState, useEffect, useCallback, useRef } from "react";
import { RNWebSocket } from "../RNWebsocket";
import { WebSocketOptions, WebSocketError } from "../types";
import { WebSocketStatus } from "../constants";

export interface UseWebSocketOptions extends WebSocketOptions {
    onConnect?: () => void;
    onDisconnect?: (code?: number) => void;
    onMessage?: (data: any) => void;
    onError?: (error: WebSocketError) => void;
    onStatusChange?: (status: WebSocketStatus) => void;
    autoConnect?: boolean;
}

export function useWebSocket(url: string, options: UseWebSocketOptions) {
    const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
    const wsRef = useRef<RNWebSocket | null>(null);

    const connect = useCallback(() => {
       if (!wsRef.current) {
            const config: WebSocketOptions = {
                protocols: options.protocols,
                timeout: options.timeout,
                reconnect: options.reconnect,
                maxReconnectAttempts: options.maxReconnectAttempts, 
                reconnectInterval: options.reconnectInterval,
            };

            wsRef.current = new RNWebSocket(url, config);

            wsRef.current.on('connect', () => {
                options.onConnect?.();
            });

            wsRef.current.on('disconnect', (code) => {
                options.onDisconnect?.(code);
            });

            wsRef.current.on('message', (data) => {
                options.onMessage?.(data);
            });

            wsRef.current.on('error', (error) => {
                options.onError?.(error);
            });

            wsRef.current.on('statusChange', (newStatus) => {
                setStatus(newStatus);
                options.onStatusChange?.(newStatus);
            });
        }
        wsRef.current.connect();
    }, [options]);

    const disconnect = useCallback(() => {
        wsRef.current?.close();
    }, []);

    const send = useCallback((data: string | ArrayBuffer) => {
        wsRef.current?.send(data);
    }, []);

    useEffect(() => {
        if (options.autoConnect === true) {
            connect();
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connect, options.autoConnect]);

    return {
        status,
        connect,
        disconnect,
        send,
    };
}