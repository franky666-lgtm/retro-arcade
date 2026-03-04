// ═══════════════════════════════════════════
// RETRO OS ARCADE - Save/Restore State (IndexedDB)
// ═══════════════════════════════════════════

var ARCADE_SAVE = (function() {
    'use strict';

    var DB_NAME = 'retro-arcade-saves';
    var DB_VERSION = 1;
    var STORE_NAME = 'states';

    function openDB() {
        return new Promise(function(resolve, reject) {
            var request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = function(e) { resolve(e.target.result); };
            request.onerror = function(e) { reject(e.target.error); };
        });
    }

    function saveState(osKey, emulator) {
        return new Promise(function(resolve, reject) {
            emulator.save_state(function(err, stateData) {
                if (err) {
                    reject(err);
                    return;
                }
                openDB().then(function(db) {
                    var tx = db.transaction(STORE_NAME, 'readwrite');
                    var store = tx.objectStore(STORE_NAME);
                    var entry = {
                        data: stateData,
                        timestamp: Date.now(),
                        os: osKey
                    };
                    var req = store.put(entry, osKey);
                    req.onsuccess = function() { resolve(true); };
                    req.onerror = function(e) { reject(e.target.error); };
                }).catch(reject);
            });
        });
    }

    function loadState(osKey) {
        return openDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(STORE_NAME, 'readonly');
                var store = tx.objectStore(STORE_NAME);
                var req = store.get(osKey);
                req.onsuccess = function(e) { resolve(e.target.result || null); };
                req.onerror = function(e) { reject(e.target.error); };
            });
        });
    }

    function hasState(osKey) {
        return loadState(osKey).then(function(entry) {
            return entry !== null;
        }).catch(function() {
            return false;
        });
    }

    function deleteState(osKey) {
        return openDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(STORE_NAME, 'readwrite');
                var store = tx.objectStore(STORE_NAME);
                var req = store.delete(osKey);
                req.onsuccess = function() { resolve(true); };
                req.onerror = function(e) { reject(e.target.error); };
            });
        });
    }

    function formatTimestamp(ts) {
        var d = new Date(ts);
        return d.toLocaleDateString('de-DE') + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }

    return {
        saveState: saveState,
        loadState: loadState,
        hasState: hasState,
        deleteState: deleteState,
        formatTimestamp: formatTimestamp
    };
})();
