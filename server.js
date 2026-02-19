const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// WASM MIME-Type
express.static.mime.define({ 'application/wasm': ['wasm'] });

// Statische Dateien
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.wasm')) {
            res.set('Content-Type', 'application/wasm');
        }
        // SharedArrayBuffer Support
        res.set('Cross-Origin-Opener-Policy', 'same-origin');
        res.set('Cross-Origin-Embedder-Policy', 'require-corp');
    }
}));

app.listen(PORT, () => {
    console.log(`\n  🕹️  Retro OS Arcade läuft!`);
    console.log(`  → http://localhost:${PORT}\n`);
});
