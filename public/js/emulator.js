// ═══════════════════════════════════════════
// RETRO OS ARCADE - Emulator Konfiguration
// ═══════════════════════════════════════════

var OS_CONFIGS = {
    win203: {
        name: "Windows 2.03",
        memory_size: 4 * 1024 * 1024,
        vga_memory_size: 512 * 1024,
        hda: { url: "images/windows2.img", size: 4 * 1024 * 1024 },
        boot_order: 0x132
    },
    win31: {
        name: "Windows 3.1",
        memory_size: 32 * 1024 * 1024,
        vga_memory_size: 2 * 1024 * 1024,
        hda: { url: "images/win31.img", size: 33 * 1024 * 1024 },
        boot_order: 0x132
    },
    win95: {
        name: "Windows 95",
        memory_size: 64 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        hda: { url: "https://pub-a5fee473aa4446a4a4f67fa9142c22a1.r2.dev/windows95.img", async: true, size: 471859200 },
        boot_order: 0x132,
        network_relay_url: "wss://relay.widgetry.org/"
    },
    kolibri: {
        name: "KolibriOS",
        memory_size: 64 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        fda: { url: "images/kolibri.img", size: 1474560 },
        boot_order: 0x321
    },
    freedos: {
        name: "FreeDOS",
        memory_size: 16 * 1024 * 1024,
        vga_memory_size: 512 * 1024,
        fda: { url: "images/freedos722.img", size: 737280 },
        boot_order: 0x321
    },
    msdos: {
        name: "MS-DOS",
        memory_size: 16 * 1024 * 1024,
        vga_memory_size: 512 * 1024,
        hda: { url: "images/msdos.img", size: 8 * 1024 * 1024 },
        boot_order: 0x132
    }
};

// OS aus URL-Parameter lesen (mit Validierung gegen XSS + Prototype Pollution)
var params = new URLSearchParams(window.location.search);
var osKey = params.get("os");
var config = osKey && Object.prototype.hasOwnProperty.call(OS_CONFIGS, osKey) ? OS_CONFIGS[osKey] : null;

if (!config) {
    document.getElementById("os-title").textContent = "Unbekanntes OS";
    var errorSpan = document.createElement("span");
    errorSpan.style.color = "var(--neon-pink)";
    errorSpan.textContent = 'Fehler: Unbekanntes Betriebssystem "' + (osKey || '') + '"';
    var loadingEl = document.getElementById("loading");
    loadingEl.textContent = "";
    loadingEl.appendChild(errorSpan);
    throw new Error("Unknown OS: " + osKey);
}

// Titel setzen
document.getElementById("os-title").textContent = config.name;
document.title = "Retro OS Arcade - " + config.name;

// v86 Emulator Konfiguration
var emulatorConfig = {
    wasm_path: "v86/v86.wasm",
    bios: { url: "bios/seabios.bin" },
    vga_bios: { url: "bios/vgabios.bin" },
    screen_container: document.getElementById("screen_container"),
    memory_size: config.memory_size,
    vga_memory_size: config.vga_memory_size,
    boot_order: config.boot_order,
    autostart: true
};

// Disk Image zuweisen (HDA oder FDA)
if (config.hda) {
    emulatorConfig.hda = config.hda;
}
if (config.fda) {
    emulatorConfig.fda = config.fda;
}
if (config.network_relay_url) {
    emulatorConfig.network_relay_url = config.network_relay_url;
}

// Sound state
var soundEnabled = false;

// Emulator starten
var emulator;

try {
    emulator = new V86(emulatorConfig);
} catch (e) {
    var errSpan = document.createElement("span");
    errSpan.style.color = "var(--neon-pink)";
    errSpan.textContent = "Fehler beim Laden: " + e.message;
    var loadEl = document.getElementById("loading");
    loadEl.textContent = "";
    loadEl.appendChild(errSpan);
    throw e;
}

// ── Progress Bar ──
var progressBar = document.getElementById("progressBar");
var loadingText = document.getElementById("loadingText");

emulator.add_listener("download-progress", function(e) {
    if (e.loaded && e.total) {
        loadedBytes = e.loaded;
        var pct = Math.min(100, Math.round((e.loaded / e.total) * 100));
        if (progressBar) {
            progressBar.style.width = pct + '%';
        }
        if (loadingText) {
            var mb = (e.loaded / 1024 / 1024).toFixed(1);
            var totalMb = (e.total / 1024 / 1024).toFixed(1);
            loadingText.textContent = 'Lade ' + config.name + '... ' + mb + ' / ' + totalMb + ' MB (' + pct + '%)';
        }
    }
});

// Events
emulator.add_listener("emulator-ready", function () {
    document.getElementById("loading").style.display = "none";
    document.getElementById("screen_container").style.display = "block";
    document.getElementById("controls").style.display = "flex";
    document.getElementById("status").innerHTML = 'Status: <span class="running">Laeuft</span>';

    // Check for saved state
    if (typeof ARCADE_SAVE !== 'undefined') {
        ARCADE_SAVE.hasState(osKey).then(function(has) {
            if (has) {
                document.getElementById("btnRestore").style.display = '';
            }
        });
    }
});

// Vollbild
function toggleFullscreen() {
    var container = document.getElementById("screen_container");
    if (!document.fullscreenElement) {
        container.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Sound Toggle
function toggleSound() {
    var btn = document.getElementById("btnSound");
    if (soundEnabled) {
        // Mute - v86 doesn't have a direct mute, but we can set speaker adapter
        soundEnabled = false;
        btn.innerHTML = '&#128264; Sound Aus';
    } else {
        soundEnabled = true;
        btn.innerHTML = '&#128266; Sound An';
    }
    // v86 speaker_adapter volume control if available
    if (emulator && emulator.speaker_adapter) {
        emulator.speaker_adapter.mixer && emulator.speaker_adapter.mixer.set_volume &&
            emulator.speaker_adapter.mixer.set_volume(soundEnabled ? 1.0 : 0.0);
    }
}

// Save State
function doSaveState() {
    if (typeof ARCADE_SAVE === 'undefined') return;
    var btn = document.querySelector('.btn-save');
    btn.textContent = 'Speichere...';
    btn.disabled = true;
    ARCADE_SAVE.saveState(osKey, emulator).then(function() {
        btn.innerHTML = '&#10004; Gespeichert!';
        document.getElementById("btnRestore").style.display = '';
        setTimeout(function() {
            btn.innerHTML = '&#128190; Speichern';
            btn.disabled = false;
        }, 2000);
    }).catch(function(err) {
        console.error('Save failed:', err);
        btn.innerHTML = '&#10008; Fehler';
        btn.disabled = false;
        setTimeout(function() {
            btn.innerHTML = '&#128190; Speichern';
        }, 2000);
    });
}

// Restore State
function doRestoreState() {
    if (typeof ARCADE_SAVE === 'undefined') return;
    var btn = document.getElementById("btnRestore");
    btn.textContent = 'Lade...';
    btn.disabled = true;
    ARCADE_SAVE.loadState(osKey).then(function(entry) {
        if (entry && entry.data) {
            // v86 requires stop -> restore -> run sequence
            return emulator.stop().then(function() {
                return emulator.restore_state(entry.data);
            }).then(function() {
                emulator.run();
                btn.innerHTML = '&#10004; Wiederhergestellt!';
                setTimeout(function() {
                    btn.innerHTML = '&#128194; Wiederherstellen';
                    btn.disabled = false;
                }, 2000);
            });
        }
    }).catch(function(err) {
        console.error('Restore failed:', err);
        btn.innerHTML = '&#10008; Fehler';
        btn.disabled = false;
        // Try to restart emulator if it was stopped
        try { emulator.run(); } catch(_) {}
        setTimeout(function() {
            btn.innerHTML = '&#128194; Wiederherstellen';
        }, 2000);
    });
}
