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

        instance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const status = error.response?.status;

                // Expired/invalid token — get a fresh one and retry once
                if ((status === 400 || status === 403) && !error.config._retried) {
                    error.config._retried = true;
                    const token = await shopify.idToken();
                    error.config.headers['Authorization'] = `Bearer ${token}`;
                    return instance.request(error.config);
                }

                // App not installed / access token missing — redirect to OAuth
                if (status === 401) {
                    const shop = window.__shopDomain || new URLSearchParams(window.location.search).get('shop');
                    if (shop) {
                        window.top.location.href = `/auth/shopify/begin?shop=${shop}`;
                    }
                }

                return Promise.reject(error);
            }
        );

        return instance;
    }, [shopify]);

    return api;
}
