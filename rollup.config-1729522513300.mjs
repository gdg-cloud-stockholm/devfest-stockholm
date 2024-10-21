import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { rollupPluginHTML } from '@web/rollup-plugin-html';
import fs from 'fs';
import copy from 'rollup-plugin-copy';
import livereload from 'rollup-plugin-livereload';
import { generateSW } from 'rollup-plugin-workbox';
import n from 'nunjucks';

/* eslint-env node */
const { BUILD_ENV, NODE_ENV, ROLLUP_WATCH } = process.env;
const production = NODE_ENV === 'production';
const watch = !!ROLLUP_WATCH;
const buildTarget = BUILD_ENV ? BUILD_ENV : production ? 'production' : 'development';
const webVitalsPolyfill = fs.readFileSync('./node_modules/web-vitals/dist/polyfill.js').toString();
const getConfigPath = () => {
    const path = `./config/${buildTarget}.json`;
    if (!fs.existsSync(path)) {
        throw new Error(`
      ERROR: Config path '${path}' does not exists.
      Please, use production|development.json files or add a configuration file at '${path}'.
    `);
    }
    console.log(`File path ${path} selected as config...`);
    return path;
};
const getData = () => {
    const settingsFiles = [
        './public/data/resources.json',
        './public/data/settings.json',
        getConfigPath(),
    ];
    const combineSettings = (currentData, path) => {
        const settingsData = JSON.parse(fs.readFileSync(path).toString());
        return {
            ...currentData,
            ...settingsData,
        };
    };
    return settingsFiles.reduce(combineSettings, {
        NODE_ENV: NODE_ENV || 'production',
        webVitalsPolyfill,
    });
};
const cleanupData = (data) => {
    if (!data.image.startsWith('http')) {
        data.image = `${data.url}${data.image}`;
    }
    return data;
};
const data = cleanupData(getData());
const nunjucks = n.configure({ throwOnUndefined: true });
const compileTemplate = (template) => nunjucks.renderString(template, data);
const compileBufferTemplate = (body) => compileTemplate(body.toString());

/* eslint-env node */
const ONE_WEEK = 60 * 60 * 24 * 7;
// Firebase Reserved URLs https://firebase.google.com/docs/hosting/reserved-urls
const FIREBASE_RESERVED_URLS = /^\/__\/.*/;
const FIREBASE_COFIG_URL = '/__/firebase/init.json';
const STATIC_EXPIRATION = {
    maxAgeSeconds: ONE_WEEK,
    maxEntries: 200,
};
const workboxConfig = {
    mode: 'debug', // TODO: Remove mode
    swDest: 'dist/service-worker.js',
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [FIREBASE_RESERVED_URLS],
    skipWaiting: true,
    clientsClaim: true,
    offlineGoogleAnalytics: true,
    globDirectory: 'dist',
    globPatterns: ['**/*.{html,js,css,json,svg,md}'],
    runtimeCaching: [
        {
            urlPattern: /\/images\/.*/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'images-cache',
                expiration: STATIC_EXPIRATION,
            },
        },
        {
            urlPattern: /https:\/\/maps\.googleapis\.com\/maps.*/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'google-maps-cache',
                expiration: STATIC_EXPIRATION,
            },
        },
        {
            urlPattern: FIREBASE_COFIG_URL,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'firebase-cache',
                expiration: {
                    maxAgeSeconds: ONE_WEEK,
                    maxEntries: 10,
                },
            },
        },
        {
            urlPattern: /https:\/\/firebasestorage\.googleapis\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'firebase-storage-cache',
                expiration: STATIC_EXPIRATION,
            },
        },
        {
            urlPattern: /https:\/\/storage\.googleapis\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'google-storage-cache',
                cacheableResponse: {
                    statuses: [0, 200],
                },
                expiration: STATIC_EXPIRATION,
            },
        },
    ],
};

/* eslint-env node */
const config = [
    {
        input: 'src/firebase-messaging-sw.ts',
        treeshake: production,
        output: {
            file: 'dist/firebase-messaging-sw.js',
            sourcemap: production,
        },
        plugins: [
            nodeResolve(),
            typescript({
                noEmitOnError: true,
                sourceMap: production,
            }),
            production && terser(),
        ],
    },
    {
        treeshake: production,
        output: {
            dir: 'dist',
            entryFileNames: production ? '[name]-[hash].js' : '[name].js',
            chunkFileNames: production ? '[name]-[hash].js' : '[name].js',
            sourcemap: production,
        },
        plugins: [
            nodeResolve(),
            json(),
            typescript({
                noEmitOnError: true,
                sourceMap: production,
            }),
            rollupPluginHTML({
                input: {
                    html: compileBufferTemplate(fs.readFileSync('index.html')),
                },
                extractAssets: false,
                minify: production,
            }),
            copy({
                targets: [
                    {
                        src: 'public/*',
                        dest: 'dist',
                    },
                    {
                        src: 'public/manifest.json',
                        dest: 'dist',
                        transform: compileBufferTemplate,
                    },
                    {
                        src: 'public/data/*.md',
                        dest: 'dist/data',
                        transform: compileBufferTemplate,
                    },
                ],
            }),
            production && generateSW(workboxConfig),
            production && terser(),
            watch && livereload({ watch: 'dist' }),
        ],
    },
];

export { config as default };
