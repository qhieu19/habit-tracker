// ─── STATE (shared across pages) ─────────────────────
let habits = [];
let logs = {};
let userProfile = null;

// ─── FIREBASE HELPERS ─────────────────────────────────
function hasFirebase() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
}

function getUserId() {
    return hasFirebase() && firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;
}

function getUserDataRef() {
    const uid = getUserId();
    if (!uid || !hasFirebase()) return null;
    return firebase.firestore().collection('users').doc(uid);
}

async function loadFromFirebase() {
    const ref = getUserDataRef();
    if (!ref) { habits = []; logs = {}; userProfile = null; return; }
    try {
        const doc = await ref.get();
        if (doc.exists) {
            const d = doc.data();
            habits = d.habits || [];
            logs = d.logs || {};
            userProfile = d.profile || null;
        } else {
            habits = []; logs = {}; userProfile = null;
        }
    } catch (e) {
        console.error('Firebase load error:', e);
        habits = []; logs = {}; userProfile = null;
    }
}

function save() {
    if (!hasFirebase()) {
        localStorage.setItem('hf_habits', JSON.stringify(habits));
        localStorage.setItem('hf_logs', JSON.stringify(logs));
        if (userProfile) localStorage.setItem('hf_profile', JSON.stringify(userProfile));
        return;
    }
    const ref = getUserDataRef();
    if (!ref) return;
    const data = { habits, logs };
    if (userProfile) data.profile = userProfile;
    ref.set(data).catch(e => console.error('Firebase save error:', e));
}

// ─── PROFILE ──────────────────────────────────────────
function updateGreeting() {
    const el = document.getElementById('userGreeting');
    const avatarBtn = document.getElementById('profileAvatarBtn');
    if (userProfile && userProfile.name) {
        if (el) { el.textContent = 'Xin chào, ' + userProfile.name; el.style.display = ''; }
        if (avatarBtn) avatarBtn.textContent = userProfile.name.charAt(0);
    } else {
        if (el) { el.textContent = ''; el.style.display = 'none'; }
        if (avatarBtn) avatarBtn.textContent = '?';
    }
}

function showProfileModal() {
    const overlay = document.getElementById('profileOverlay');
    if (overlay) overlay.classList.add('open');
}

function closeProfileModal() {
    const overlay = document.getElementById('profileOverlay');
    if (overlay) overlay.classList.remove('open');
}

function saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const age = parseInt(document.getElementById('profileAge').value) || null;
    const gender = document.getElementById('profileGender').value || null;
    if (!name) {
        document.getElementById('profileName').focus();
        document.getElementById('profileName').style.borderColor = 'var(--danger)';
        return;
    }
    userProfile = { name, age, gender };
    save();
    closeProfileModal();
    updateGreeting();
    if (typeof onAuthReady === 'function') onAuthReady();
}

// ─── AUTH ─────────────────────────────────────────────
async function signInWithGoogle() {
    if (!hasFirebase()) {
        document.getElementById('loginError').textContent = 'Firebase chưa được cấu hình. Xem SETUP.md.';
        document.getElementById('loginError').style.display = 'block';
        return;
    }
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginLoading').style.display = 'block';
    document.getElementById('googleSignInBtn').disabled = true;
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().signInWithPopup(provider);
    } catch (e) {
        document.getElementById('loginError').textContent = e.message || 'Đăng nhập thất bại';
        document.getElementById('loginError').style.display = 'block';
    }
    document.getElementById('loginLoading').style.display = 'none';
    document.getElementById('googleSignInBtn').disabled = false;
}

async function signOut() {
    if (hasFirebase() && firebase.auth().currentUser) {
        await firebase.auth().signOut();
    }
    window.location.href = 'index.html';
}

function initAuth() {
    if (!hasFirebase()) {
        habits = JSON.parse(localStorage.getItem('hf_habits') || '[]');
        logs = JSON.parse(localStorage.getItem('hf_logs') || '{}');
        userProfile = JSON.parse(localStorage.getItem('hf_profile') || 'null');
        const loginOverlay = document.getElementById('loginOverlay');
        const appContent = document.getElementById('appContent');
        if (loginOverlay) loginOverlay.classList.add('hidden');
        if (appContent) appContent.classList.remove('hidden');
        if (!userProfile) {
            showProfileModal();
        } else {
            updateGreeting();
            if (typeof onAuthReady === 'function') onAuthReady();
        }
        return;
    }
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            await loadFromFirebase();
            const loginOverlay = document.getElementById('loginOverlay');
            const appContent = document.getElementById('appContent');
            if (loginOverlay) loginOverlay.classList.add('hidden');
            if (appContent) appContent.classList.remove('hidden');
            if (!userProfile) {
                showProfileModal();
            } else {
                updateGreeting();
                if (typeof onAuthReady === 'function') onAuthReady();
            }
        } else {
            const loginOverlay = document.getElementById('loginOverlay');
            const appContent = document.getElementById('appContent');
            if (loginOverlay) loginOverlay.classList.remove('hidden');
            if (appContent) appContent.classList.add('hidden');
        }
    });
}
