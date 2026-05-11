import { useAppBridge } from '@shopify/app-bridge-react';
import axios from 'axios';
import { useMemo } from 'react';

export function useAuthenticatedFetch() {
    const shopify = useAppBridge();

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: window.location.origin,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': 'true',
            },
        });

        instance.interceptors.request.use(async (config) => {
            const token = await shopify.idToken();
            config.headers['Authorization'] = `Bearer ${token}`;
            return config;
        });

        // On 400 (invalid token) or 403 (expired token), get a fresh session
        // token from App Bridge and retry the request once.
        instance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const status = error.response?.status;
                if ((status === 400 || status === 403) && !error.config._retried) {
                    error.config._retried = true;
                    const token = await shopify.idToken();
                    error.config.headers['Authorization'] = `Bearer ${token}`;
                    return instance.request(error.config);
                }
                return Promise.reject(error);
            }
        );

        return instance;
    }, [shopify]);

    return api;
}
