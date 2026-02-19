// ═══════════════════════════════════════════
// RETRO OS ARCADE - Emulator Konfiguration
// ═══════════════════════════════════════════

const OS_CONFIGS = {
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

// OS aus URL-Parameter lesen
const params = new URLSearchParams(window.location.search);
const osKey = params.get("os");
const config = OS_CONFIGS[osKey];

if (!config) {
    document.getElementById("os-title").textContent = "Unbekanntes OS";
    document.getElementById("loading").innerHTML = '<span style="color: var(--neon-pink);">Fehler: Unbekanntes Betriebssystem "' + (osKey || '') + '"</span>';
    throw new Error("Unknown OS: " + osKey);
}

// Titel setzen
document.getElementById("os-title").textContent = config.name;
document.title = "Retro OS Arcade - " + config.name;

// v86 Emulator Konfiguration
const emulatorConfig = {
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

// Emulator starten
let emulator;

try {
    emulator = new V86(emulatorConfig);
} catch (e) {
    document.getElementById("loading").innerHTML =
        '<span style="color: var(--neon-pink);">Fehler beim Laden: ' + e.message + '</span>';
    throw e;
}

// Events
emulator.add_listener("emulator-ready", function () {
    document.getElementById("loading").style.display = "none";
    document.getElementById("screen_container").style.display = "block";
    document.getElementById("controls").style.display = "flex";
    document.getElementById("status").innerHTML = 'Status: <span class="running">Läuft</span>';
});

// Vollbild
function toggleFullscreen() {
    const container = document.getElementById("screen_container");
    if (!document.fullscreenElement) {
        container.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}
