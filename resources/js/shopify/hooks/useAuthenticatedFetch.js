import { useAppBridge } from '@shopify/app-bridge-react';
import axios from 'axios';
import { useMemo } from 'react';

/**
 * Returns an axios instance that automatically injects the Shopify
 * session token into every request's Authorization header.
 * Required by the verify.shopify middleware on the Laravel backend.
 */
export function useAuthenticatedFetch() {
    const shopify = useAppBridge();

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: window.location.origin,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                // Bypass ngrok browser warning interstitial
                'ngrok-skip-browser-warning': 'true',
            },
        });

        instance.interceptors.request.use(async (config) => {
            const token = await shopify.idToken();
            config.headers['Authorization'] = `Bearer ${token}`;
            return config;
        });

        return instance;
    }, [shopify]);

    return api;
}
