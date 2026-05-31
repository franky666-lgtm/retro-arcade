// ═══════════════════════════════════════════
// RETRO OS ARCADE - Auth Gate (Token-Based)
// ═══════════════════════════════════════════

var ARCADE_AUTH = (function() {
    'use strict';

    var SUPABASE_URL = 'https://idgxlmteaucnhkopdqiy.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZ3hsbXRlYXVjbmhrb3BkcWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzE5OTIsImV4cCI6MjA5MTIwNzk5Mn0.7dkp2Nj88x1qtVgOplrOmT-kG1WZ8bkYgAW5Or_vMX0';
    var SBP_URL = 'https://social-boost-pro.com';

    // Check if already verified this session
    function isVerified() {
        return sessionStorage.getItem('arcade_verified') === 'true';
    }

    // Verify token via Supabase RPC
    function verifyToken(token) {
        return fetch(SUPABASE_URL + '/rest/v1/rpc/verify_arcade_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ p_token: token })
        })
        .then(function(resp) {
            if (!resp.ok) throw new Error('Verification failed');
            return resp.json();
        });
    }

    // Clean token from URL without reload
    function cleanUrl() {
        var url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url.toString());
    }

    // Escape HTML to prevent XSS
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Show access denied teaser
    function showAccessDenied(container, message) {
        container.style.display = '';
        container.classList.remove('auth-hidden');
        container.innerHTML = '';
        var denied = document.createElement('div');
        denied.className = 'access-denied';
        denied.innerHTML =
            '<div class="denied-icon">🔒</div>' +
            '<h2>Club-Exclusive Arcade</h2>' +
            '<p class="denied-msg">' + escapeHtml(message || 'Diese Arcade ist exklusiv fuer Social Boost Pro Club-Mitglieder.') + '</p>' +
            '<a href="' + SBP_URL + '/Club" class="btn-join-club">Club beitreten</a>' +
            '<p class="denied-sub">Bereits Mitglied? <a href="' + SBP_URL + '">Einloggen</a> und ueber den Club-Bereich starten.</p>';
        container.appendChild(denied);
    }

    // Show content after verification
    function showContent(container) {
        container.style.display = '';
        container.classList.remove('auth-hidden');
    }

    // Main auth gate logic
    function gate(contentContainer) {
        // Already verified this session
        if (isVerified()) {
            showContent(contentContainer);
            return Promise.resolve(true);
        }

        // Check for token in URL
        var params = new URLSearchParams(window.location.search);
        var token = params.get('token');

        if (!token || token.length < 32) {
            showAccessDenied(contentContainer);
            return Promise.resolve(false);
        }

        // Clean token from URL immediately (before verification)
        cleanUrl();

        // Show loading while verifying
        contentContainer.style.display = '';
        contentContainer.classList.remove('auth-hidden');
        contentContainer.innerHTML = '<div class="auth-loading"><div class="spinner"></div><span>Token wird verifiziert...</span></div>';

        return verifyToken(token).then(function(result) {
            if (result && result.valid) {
                sessionStorage.setItem('arcade_verified', 'true');
                // Reload to show actual content (simplest approach)
                window.location.reload();
                return true;
            } else {
                showAccessDenied(contentContainer, result.error || 'Token ungueltig oder abgelaufen.');
                return false;
            }
        }).catch(function(err) {
            console.error('Auth verification error:', err);
            showAccessDenied(contentContainer, 'Verifizierung fehlgeschlagen. Bitte versuche es erneut.');
            return false;
        });
    }

    // Quick check for emulator page (no full gate, just redirect)
    function requireAuth() {
        if (!isVerified()) {
            window.location.href = '/';
            return false;
        }
        return true;
    }

    return {
        gate: gate,
        isVerified: isVerified,
        requireAuth: requireAuth
    };
})();
