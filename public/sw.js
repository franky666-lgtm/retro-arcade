// ServiceWorker: Inject COOP/COEP headers for SharedArrayBuffer support
// Required for v86 emulator on GitHub Pages (which doesn't set these headers)
// Only modifies same-origin responses - cross-origin (CDN) requests pass through

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
    if (e.request.cache === "only-if-cached" && e.request.mode !== "same-origin") {
        return;
    }

    // Cross-origin Requests (z.B. CDN-Chunks von i.copy.sh) nicht modifizieren
    // Sonst gehen CORS-Headers verloren und der Browser blockiert die Response
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) {
        return;
    }

    e.respondWith(
        fetch(e.request).then((response) => {
            const headers = new Headers(response.headers);
            headers.set("Cross-Origin-Opener-Policy", "same-origin");
            headers.set("Cross-Origin-Embedder-Policy", "credentialless");

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
        }).catch((err) => {
            console.error("ServiceWorker fetch error:", err);
            return new Response("ServiceWorker fetch failed", { status: 500 });
        })
    );
});
