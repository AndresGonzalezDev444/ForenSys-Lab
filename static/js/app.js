let currentToken = null;
let cameraActive = false;
let cachedCameraDevices = [];

// ==========================================
// FORENSYSLAB v2.0 - Core UI Logic
// ==========================================

// --- Navigation & View State ---
function navigateTo(viewId) {
  if (viewId === 'login') {
    document.getElementById('view-login').classList.remove('hidden');
    document.getElementById('app-layout').classList.add('hidden');
    return;
  }

  // Handle specific navigation rules
  if (viewId === 'dashboard') {
    document.getElementById('header-page-title').textContent = 'DASHBOARD';
    document.getElementById('header-page-sub').textContent = 'Centro de Control Forense';
  } else if (viewId === 'suspects') {
    document.getElementById('header-page-title').textContent = 'CASOS ACTIVOS';
    document.getElementById('header-page-sub').textContent = 'Gestión de Sospechosos';
  } else if (viewId === 'suite') {
    document.getElementById('header-page-title').textContent = 'SUITE FORENSYS';
    document.getElementById('header-page-sub').textContent = 'Herramientas de Análisis';
  } else if (viewId === 'about') {
    document.getElementById('header-page-title').textContent = 'SISTEMA';
    document.getElementById('header-page-sub').textContent = 'Configuración y Acerca De';
  } else if (viewId === 'cyber') {
    document.getElementById('header-page-title').textContent = 'METAINSPECT';
    document.getElementById('header-page-sub').textContent = 'Análisis de Evidencia Digital';
  } else if (viewId === 'osint') {
    document.getElementById('header-page-title').textContent = 'NETTRACKER';
    document.getElementById('header-page-sub').textContent = 'Ciberinteligencia Digital';
  }

  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('app-layout').classList.remove('hidden');

  document.querySelectorAll('.main-area .view').forEach(el => {
    el.classList.remove('active');
  });

  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.add('active');
  }

  document.querySelectorAll('.sidebar-nav a').forEach(el => el.classList.remove('active'));
  
  // Map specific modules to their parent sidebar items if they don't have one
  let activeNavId = `nav-${viewId}`;
  if (viewId === 'cyber' || viewId === 'osint') {
    activeNavId = 'nav-herramientas';
  }
  
  const navLink = document.getElementById(activeNavId);
  if (navLink) navLink.classList.add('active');
}

function toggleSidebar() {
  const sidebar = document.getElementById('main-sidebar');
  if (sidebar.style.display === 'flex') {
    sidebar.style.display = 'none';
  } else {
    sidebar.style.display = 'flex';
  }
}

// --- Real-time Clock ---
function updateClock() {
  const now = new Date();
  
  // Format Time (HH:MM:SS)
  const timeStr = now.toLocaleTimeString('es-ES', { 
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
  });
  
  // Format Date (DD MMM YYYY)
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  const dateStr = now.toLocaleDateString('es-ES', options).toUpperCase();
  
  const clockEl = document.getElementById('header-clock');
  const dateEl = document.getElementById('header-date');
  
  if (clockEl) clockEl.textContent = timeStr;
  if (dateEl) dateEl.textContent = dateStr;
}

setInterval(updateClock, 1000);
updateClock(); // Initial call

// ==========================================
// AFIS - Biometric Fingerprint System (Simulated)
// ==========================================

let afisMode = 'sim'; // sim, real, usb
let afisFile1 = null;
let afisFile2 = null;

function switchAFISMode(mode) {
  afisMode = mode;
  document.querySelectorAll('.upload-method-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btn-mode-${mode}`).classList.add('active');
  
  if (mode === 'usb') {
    document.getElementById('afis-dropzone-query').style.display = 'none';
    document.getElementById('afis-usb-container').style.display = 'block';
  } else {
    document.getElementById('afis-dropzone-query').style.display = 'flex';
    document.getElementById('afis-usb-container').style.display = 'none';
  }
  
  checkAFISReady();
}

function simulateUSBDetection() {
  alert("Lector USB no detectado.\nPor favor, asegúrese de que el dispositivo esté conectado correctamente y que los drivers estén actualizados.");
}

function handleFingerprintUpload(event, panel) {
  const file = event.target.files[0];
  if (!file) return;

  if (panel === 1) afisFile1 = file;
  if (panel === 2) afisFile2 = file;

  const reader = new FileReader();
  reader.onload = function(e) {
    const previewContainer = panel === 1 ? document.getElementById('afis-query-preview') : document.getElementById('afis-db-preview');
    const img = document.createElement('img');
    img.src = e.target.result;
    
    previewContainer.innerHTML = '';
    previewContainer.appendChild(img);
    previewContainer.classList.add('scan-active');
    
    setTimeout(() => {
      previewContainer.classList.remove('scan-active');
      
      const qualityEl = panel === 1 ? document.getElementById('afis-query-quality-val') : document.getElementById('afis-db-quality-val');
      const stars = panel === 1 ? document.getElementById('afis-query-stars').children : document.getElementById('afis-db-stars').children;
      
      const isExcellent = Math.random() > 0.3;
      
      if (isExcellent) {
        qualityEl.textContent = 'EXCELENTE';
        qualityEl.className = 'value excellent';
        for(let i=0; i<5; i++) stars[i].className = 'quality-star';
      } else {
        qualityEl.textContent = 'BUENA';
        qualityEl.className = 'value good';
        for(let i=0; i<4; i++) stars[i].className = 'quality-star';
        stars[4].className = 'quality-star empty';
      }
      
      checkAFISReady();
      
    }, 1000);
  }
  reader.readAsDataURL(file);
}

function checkAFISReady() {
  const btn = document.getElementById('afis-compare-btn');
  if (afisMode === 'sim' || afisMode === 'real') {
    if (afisFile1 && afisFile2) {
      btn.disabled = false;
    } else {
      btn.disabled = true;
    }
  } else {
    btn.disabled = true;
  }
}

async function startComparison() {
  const btn = document.getElementById('afis-compare-btn');
  btn.disabled = true;
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Procesando...`;
  
  const resultsPanel = document.getElementById('afis-results-panel');
  const scanningOverlay = document.createElement('div');
  scanningOverlay.className = 'afis-scanning';
  scanningOverlay.innerHTML = `
    <div class="afis-scanning-text">EXTRAYENDO MINUCIAS</div>
    <div class="afis-scanning-bar"></div>
  `;
  resultsPanel.appendChild(scanningOverlay);

  if (afisMode === 'real') {
    try {
      scanningOverlay.querySelector('.afis-scanning-text').textContent = 'ANALIZANDO CON OPENCV (ORB)...';
      const formData = new FormData();
      formData.append('file1', afisFile1);
      formData.append('file2', afisFile2);
      
      const response = await fetch('/api/fingerprint/compare', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error("Error en la comparación");
      const data = await response.json();
      
      renderAFISResults(data.score, data.matched_points, data.total_points_1, "real", scanningOverlay, btn);
      
    } catch (err) {
      alert("Error: " + err.message);
      resultsPanel.removeChild(scanningOverlay);
      btn.innerHTML = `Iniciar Comparación`;
      btn.disabled = false;
    }
  } else {
    // Simulated Mode
    setTimeout(() => {
      scanningOverlay.querySelector('.afis-scanning-text').textContent = 'COMPARANDO HUELLAS';
      setTimeout(() => {
        const score = (75 + Math.random() * 24.5).toFixed(2);
        const pts = Math.floor(60 + Math.random() * 40);
        renderAFISResults(score, pts, 120, "sim", scanningOverlay, btn);
      }, 1500);
    }, 1000);
  }
}

function renderAFISResults(score, matchPts, totalPts, mode, overlay, btn) {
  const resultsPanel = document.getElementById('afis-results-panel');
  resultsPanel.removeChild(overlay);
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Nueva Comparación`;
  btn.disabled = false;
  
  document.getElementById('afis-live-badge').style.display = 'flex';
  
  let confText = 'ALTA';
  let confColor = 'var(--low)';
  if(score > 85) { confText = 'MUY ALTA'; }
  else if (score < 50) { confText = 'BAJA'; confColor = 'var(--danger)'; }
  else if (score < 75) { confText = 'MODERADA'; confColor = 'var(--medium)'; }
  
  document.getElementById('afis-score').textContent = score + '%';
  const confSpan = document.getElementById('afis-confidence');
  confSpan.textContent = confText;
  confSpan.style.color = confColor;
  
  document.getElementById('afis-minutiae-match').textContent = matchPts;
  document.getElementById('afis-minutiae-disc').textContent = totalPts - matchPts;
  document.getElementById('afis-rotation').textContent = (Math.random() * 5).toFixed(1) + '°';
  document.getElementById('afis-translation').textContent = Math.floor(5 + Math.random() * 15) + ' px';
  document.getElementById('afis-scale').textContent = (95 + Math.random() * 5).toFixed(1) + '%';
  
  const qQual = document.getElementById('afis-query-quality-val').textContent;
  const qQEl = document.getElementById('afis-q-quality');
  qQEl.textContent = qQual;
  qQEl.className = 'afis-result-value ' + (qQual === 'EXCELENTE' ? 'highlight' : '');
  
  document.getElementById('afis-m-quality').textContent = document.getElementById('afis-db-quality-val').textContent;
  document.getElementById('afis-time').textContent = (0.1 + Math.random() * 0.4).toFixed(2) + ' seg';
  
  document.getElementById('afis-detail-btn').style.display = 'flex';
  document.getElementById('afis-reset-btn').style.display = 'flex';
  addRecentActivity('Comparación Biométrica AFIS', mode==='real'?'purple':'blue', `${score}% MATCH`);
}

function resetComparison() {
  // Reset files
  afisFile1 = null;
  afisFile2 = null;
  
  // Clear previews
  const queryPreview = document.getElementById('afis-query-preview');
  const dbPreview = document.getElementById('afis-db-preview');
  queryPreview.innerHTML = '';
  dbPreview.innerHTML = `<div id="afis-db-placeholder" style="text-align:center;cursor:pointer;padding:2rem;" onclick="document.getElementById('afis-file-input-2').click()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;margin-bottom:0.5rem;color:rgba(255,255,255,0.3)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><p style="font-size:0.8rem;color:var(--muted)">Sube la huella de referencia</p></div><input type="file" id="afis-file-input-2" style="display:none;" accept="image/*" onchange="handleFingerprintUpload(event, 2)">`;
  
  // Reset quality indicators
  document.getElementById('afis-query-quality-val').textContent = '—';
  document.getElementById('afis-query-quality-val').className = 'value';
  document.getElementById('afis-db-quality-val').textContent = '—';
  document.getElementById('afis-db-quality-val').className = 'value';
  
  const resetStars = (id) => {
    const stars = document.getElementById(id).children;
    for (let i = 0; i < 5; i++) stars[i].className = 'quality-star empty';
  };
  resetStars('afis-query-stars');
  resetStars('afis-db-stars');
  
  // Reset results
  document.getElementById('afis-score').textContent = '—';
  document.getElementById('afis-confidence').textContent = '—';
  document.getElementById('afis-minutiae-match').textContent = '—';
  document.getElementById('afis-minutiae-disc').textContent = '—';
  document.getElementById('afis-rotation').textContent = '—';
  document.getElementById('afis-translation').textContent = '—';
  document.getElementById('afis-scale').textContent = '—';
  document.getElementById('afis-q-quality').textContent = '—';
  document.getElementById('afis-m-quality').textContent = '—';
  document.getElementById('afis-time').textContent = '—';
  
  // Hide badges and buttons
  document.getElementById('afis-live-badge').style.display = 'none';
  document.getElementById('afis-detail-btn').style.display = 'none';
  document.getElementById('afis-reset-btn').style.display = 'none';
  
  // Reset file inputs
  const inp1 = document.getElementById('afis-file-input');
  if (inp1) inp1.value = '';
  
  // Disable compare button
  document.getElementById('afis-compare-btn').disabled = true;
  document.getElementById('afis-compare-btn').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Iniciar Comparación`;
}

// ==========================================
// Drag and Drop Logic
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const dropzoneQuery = document.getElementById('afis-dropzone-query');
  if (dropzoneQuery) {
    dropzoneQuery.addEventListener('dragover', (e) => { e.preventDefault(); dropzoneQuery.classList.add('dragover'); });
    dropzoneQuery.addEventListener('dragleave', (e) => { e.preventDefault(); dropzoneQuery.classList.remove('dragover'); });
    dropzoneQuery.addEventListener('drop', (e) => {
      e.preventDefault(); dropzoneQuery.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFingerprintUpload({ target: { files: [e.dataTransfer.files[0]] } }, 1);
    });
  }

});
// ==========================================
// ACTIVITY LOGIC (Simulated)
// ==========================================
function addRecentActivity(text, color, meta = null) {
  const container = document.querySelector('.sidebar-activity');
  if(!container) return;
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  const item = document.createElement('div');
  item.className = 'sidebar-activity-item fade-in';
  
  let metaHtml = '';
  if (meta) {
    metaHtml = `<div style="font-size:0.5rem;font-family:monospace;color:var(--accent-bright);margin-top:2px;">${meta}</div>`;
  }
  
  item.innerHTML = `
    <div class="sidebar-activity-dot ${color}"></div>
    <div>
      <div class="sidebar-activity-text">${text}</div>
      ${metaHtml}
      <span class="sidebar-activity-time">${timeStr}</span>
    </div>
  `;
  
  // Insert after the title
  const title = container.querySelector('.sidebar-activity-title');
  title.insertAdjacentElement('afterend', item);
  
  // Remove oldest if more than 3
  const items = container.querySelectorAll('.sidebar-activity-item');
  if(items.length > 3) {
    items[items.length - 1].remove();
  }
}

// Initialize dynamic footer data on load
document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('footer-cases')) {
    document.getElementById('footer-cases').textContent = Math.floor(Math.random() * 10) + 1;
    document.getElementById('footer-evidence').textContent = (1000 + Math.floor(Math.random() * 500)).toLocaleString();
    document.getElementById('footer-analysis').textContent = Math.floor(Math.random() * 50);
  }
});

// ==========================================
// CORE AUTH LOGIC
// ==========================================
async function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;

  try {
    const formData = new URLSearchParams();
    formData.append('username', u);
    formData.append('password', p);

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      currentToken = data.access_token;
      document.getElementById('login-error').classList.add('hidden');
      
      // Update UI elements with user data
      const avatar = document.getElementById('header-avatar');
      if (avatar) avatar.textContent = u.charAt(0).toUpperCase();
      
      const nameEl = document.getElementById('header-user-name');
      if (nameEl) nameEl.textContent = u.toUpperCase();
      
      const sidebarAvatar = document.getElementById('sidebar-avatar');
      if(sidebarAvatar) sidebarAvatar.textContent = u.charAt(0).toUpperCase();
      
      const sidebarName = document.getElementById('sidebar-username');
      if(sidebarName) sidebarName.textContent = u.toUpperCase();
      
      navigateTo('dashboard');
      loadSuspects();
      
      addRecentActivity('Inicio de sesión en el sistema', 'green');
    } else {
      document.getElementById('login-error').classList.remove('hidden');
    }
  } catch (err) {
    console.error("Login failed", err);
    document.getElementById('login-error').classList.remove('hidden');
  }
}

function logout() {
  currentToken = null;
  navigateTo('login');
}

// ==========================================
// SUSPECTS LOGIC
// ==========================================
async function loadSuspects() {
  if (!currentToken) return;
  try {
    const res = await fetch('/api/suspects', { headers: { 'Authorization': `Bearer ${currentToken}` } });
    if (res.ok) {
      const suspects = await res.json();
      const list = document.getElementById('suspects-list');
      if (suspects.length === 0) {
        list.innerHTML = "<p class='text-muted'>No hay sospechosos registrados.</p>";
        return;
      }
      list.innerHTML = suspects.map(s => {
        const photos = s.face_photos || [];
        const photoCount = photos.length;
        return `
        <div class="suspect-item">
          <div style="flex:1;min-width:0;">
            <div class="suspect-name">${s.first_name} ${s.last_name}</div>
            <div class="suspect-meta">— Céd: ${s.identification}</div>
            <div class="suspect-behavior">Antecedentes: ${s.behavior_profile || 'N/A'}</div>
            <div style="color:${photoCount > 0 ? 'var(--low)' : 'var(--medium)'};font-size:0.75rem;">
              ${photoCount > 0 ? '● ' + photoCount + ' foto(s) facial(es) registrada(s)' : '○ Sin fotos faciales'}
            </div>
            <div class="photo-gallery">
              ${photos.map(p => `
                <div class="photo-thumb">
                  <img src="${p.file_path}" alt="Foto" onerror="this.style.display='none'">
                  <button class="photo-del" onclick="deletePhoto(${p.id}, event)" title="Eliminar foto">✕</button>
                </div>
              `).join('')}
              <button class="photo-add-btn" onclick="openWebcamModal(${s.id})" title="Agregar foto facial">+</button>
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;flex-shrink:0;margin-top:0.5rem;">
            <button onclick="editSuspect(${s.id}, '${(s.behavior_profile||'').replace(/'/g,"\\'")}')"
              class="btn btn-secondary" style="font-size:0.75rem;padding:0.3rem 0.6rem;">
              ✎ Editar
            </button>
            <button onclick="deleteSuspect(${s.id}, '${s.first_name} ${s.last_name}')"
              class="btn btn-danger" style="font-size:0.75rem;padding:0.3rem 0.6rem;">
              ✕ Eliminar
            </button>
          </div>
        </div>
      `}).join('');
    }
  } catch (err) {
    console.error("Error loading suspects", err);
  }
}

async function handleAddSuspect(e) {
  e.preventDefault();
  const fname = document.getElementById('s-fname').value;
  const lname = document.getElementById('s-lname').value;
  const id = document.getElementById('s-id').value;
  const behavior = document.getElementById('s-behavior').value;
  const photoInput = document.getElementById('s-photo');

  try {
    const res = await fetch('/api/suspects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        first_name: fname,
        last_name: lname,
        identification: id,
        behavior_profile: behavior
      })
    });

    if (res.ok) {
      const newSuspect = await res.json();

      if (capturedPhotoBase64) {
        await uploadBase64Photo(newSuspect.id, capturedPhotoBase64);
        capturedPhotoBase64 = null;
      } else if (photoInput && photoInput.files && photoInput.files[0]) {
        const photoData = new FormData();
        photoData.append('file', photoInput.files[0]);
        await fetch(`/api/suspects/${newSuspect.id}/photo`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}` },
          body: photoData
        });
      }

      document.getElementById('suspect-form').reset();
      if (document.getElementById('s-photo-name')) {
        document.getElementById('s-photo-name').innerText = '';
      }
      loadSuspects();
      alert("Sujeto Registrado Correctamente");
    }
  } catch(err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const photoInput = document.getElementById('s-photo');
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        document.getElementById('s-photo-name').innerText = 'Foto seleccionada: ' + e.target.files[0].name;
        capturedPhotoBase64 = null;
      }
    });
  }
  loadCameraDevices();
});

async function deleteSuspect(id, name) {
  if (!confirm(`¿Eliminar a "${name}" de la base de datos? Esta acción no se puede deshacer.`)) return;
  try {
    const res = await fetch(`/api/suspects/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (res.ok) {
      alert(`¡"${name}" eliminado y la IA ha sido actualizada.`);
      loadSuspects();
    } else {
      alert('No se pudo eliminar.');
    }
  } catch(err) { console.error(err); }
}

async function deletePhoto(photoId, event) {
  if (event) event.stopPropagation();
  if (!confirm('¿Eliminar esta foto facial? La IA se reentrenará sin ella.')) return;
  try {
    const res = await fetch(`/api/photos/${photoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (res.ok) {
      loadSuspects();
    } else {
      alert('No se pudo eliminar la foto.');
    }
  } catch(err) { console.error(err); }
}

async function editSuspect(id, currentBehavior) {
  const newBehavior = prompt('Editar antecedentes / conductas del sujeto:', currentBehavior);
  if (newBehavior === null) return;
  try {
    const res = await fetch(`/api/suspects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ behavior_profile: newBehavior })
    });
    if (res.ok) {
      loadSuspects();
    } else {
      alert('No se pudo guardar la edición.');
    }
  } catch(err) { console.error(err); }
}



async function loadBrowserCameraDevices() {
  const select = document.getElementById('webcam-device-select');
  if (!select || !navigator.mediaDevices?.enumerateDevices) return;
  try {
    const currentValue = select.value;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    select.innerHTML = '<option value="">Camara predeterminada</option>' + videoDevices.map((device, index) =>
      `<option value="${device.deviceId}">${device.label || `Camara ${index + 1}`}</option>`
    ).join('');
    if (currentValue) select.value = currentValue;
  } catch (err) {
    console.error(err);
  }
}

async function startWebcamPreview() {
  const video = document.getElementById('webcam-video');
  const select = document.getElementById('webcam-device-select');
  const deviceId = select?.value || '';
  const constraints = {
    video: deviceId ? { deviceId: { exact: deviceId } } : true
  };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  webcamStream = stream;
  video.srcObject = stream;
  await loadBrowserCameraDevices();
  if (deviceId && select) select.value = deviceId;
}

async function restartWebcamPreview() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop());
    webcamStream = null;
  }
  try {
    await startWebcamPreview();
  } catch (err) {
    alert('No se pudo cambiar la camara: ' + err.message);
  }
}

// ---- WEBCAM MODAL ----
let webcamStream = null;
let capturedPhotoBase64 = null;
let pendingSuspectIdForPhoto = null;

async function openWebcamModal(suspectId = null) {
  pendingSuspectIdForPhoto = suspectId;
  capturedPhotoBase64 = null;
  const modal = document.getElementById('webcam-modal');
  const video = document.getElementById('webcam-video');
  const preview = document.getElementById('webcam-preview');
  if (modal) modal.classList.add('active');
  preview.style.display = 'none';
  video.style.display = 'block';
  document.getElementById('retake-btn').style.display = 'none';
  document.getElementById('confirm-btn').style.display = 'none';
  try {
    await startWebcamPreview();
  } catch (err) {
    alert('No se pudo acceder a la camara: ' + err.message);
    closeWebcamModal();
  }
}

function takeWebcamPhoto() {
  const video = document.getElementById('webcam-video');
  const canvas = document.getElementById('webcam-canvas');
  const preview = document.getElementById('webcam-preview');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);
  capturedPhotoBase64 = canvas.toDataURL('image/jpeg');
  preview.src = capturedPhotoBase64;
  preview.style.display = 'block';
  video.style.display = 'none';
  document.getElementById('retake-btn').style.display = 'inline-flex';
  document.getElementById('confirm-btn').style.display = 'inline-flex';
}

function retakeWebcamPhoto() {
  capturedPhotoBase64 = null;
  const video = document.getElementById('webcam-video');
  const preview = document.getElementById('webcam-preview');
  video.style.display = 'block';
  preview.style.display = 'none';
  document.getElementById('retake-btn').style.display = 'none';
  document.getElementById('confirm-btn').style.display = 'none';
}

async function confirmWebcamPhoto() {
  if (!capturedPhotoBase64) return;
  closeWebcamModal();
  if (pendingSuspectIdForPhoto) {
    await uploadBase64Photo(pendingSuspectIdForPhoto, capturedPhotoBase64);
    capturedPhotoBase64 = null;
    pendingSuspectIdForPhoto = null;
    loadSuspects();
  } else {
    document.getElementById('s-photo-name').innerText = '¡Foto capturada con la cámara! Se guardará al registrar.';
  }
}

async function uploadBase64Photo(suspectId, base64Data) {
  try {
    const res = await fetch(`/api/suspects/${suspectId}/photo_base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
      body: JSON.stringify({ image_base64: base64Data })
    });
    return res.ok;
  } catch(err) { console.error(err); return false; }
}

function closeWebcamModal() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop());
    webcamStream = null;
  }
  const modal = document.getElementById('webcam-modal');
  if (modal) modal.classList.remove('active');
}

async function exportDB() {
  if (!currentToken) return;
  try {
    const res = await fetch('/api/database/export', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ciberforense.db';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      alert("Error al exportar la base de datos.");
    }
  } catch (err) {
    console.error(err);
  }
}

async function importDB(event) {
  if (!currentToken) return;
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/database/import', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${currentToken}` },
      body: formData
    });
    if (res.ok) {
      alert("Base de datos importada exitosamente. Recargando...");
      window.location.reload();
    } else {
      alert("Error al importar la base de datos.");
    }
  } catch (err) {
    console.error(err);
  }
  event.target.value = '';
}

// ==========================================
// FORENSYS CYBER & METAINSPECT LOGIC
// ==========================================
let currentCyberData = null;

async function analyzeCyberFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const dropzone = document.getElementById('cyber-dropzone');
  const loading = document.getElementById('cyber-loading');
  const resultsPanel = document.getElementById('cyber-results-panel');
  
  dropzone.style.display = 'none';
  loading.classList.remove('hidden');
  resultsPanel.style.display = 'none';

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/cyber/extract_metadata', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${currentToken}` },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      currentCyberData = data;
      
      addRecentActivity('Análisis MetaInspect', 'green', file.name);
      
      // Update File Integrity info
      const basicList = document.getElementById('cyber-basic-info');
      basicList.innerHTML = `
        <li style="margin-bottom:0.5rem;"><strong style="color:var(--text);">Archivo:</strong> ${data.file_info.filename}</li>
        <li style="margin-bottom:0.5rem;"><strong style="color:var(--text);">MIME Type:</strong> ${data.file_info.mime_type}</li>
        <li style="margin-bottom:0.5rem;"><strong style="color:var(--text);">Tamaño:</strong> ${(data.file_info.size_bytes / 1024).toFixed(2)} KB</li>
        <li style="margin-bottom:0.5rem;"><strong style="color:var(--text);">MD5:</strong> <span style="font-family:monospace; font-size:0.8rem;">${data.file_info.md5}</span></li>
        <li style="margin-bottom:0.5rem;"><strong style="color:var(--text);">SHA-256:</strong> <span style="font-family:monospace; font-size:0.8rem; word-break:break-all;">${data.file_info.sha256}</span></li>
      `;

      // Update Hardware info
      const hwList = document.getElementById('cyber-hardware-info');
      hwList.innerHTML = `
        <li style="margin-bottom:0.5rem;"><strong style="color:var(--text);">Fabricante:</strong> ${data.hardware.Make || 'N/A'}</li>
        <li style="margin-bottom:0.5rem;"><strong style="color:var(--text);">Modelo:</strong> ${data.hardware.Model || 'N/A'}</li>
        <li style="margin-bottom:0.5rem;"><strong style="color:var(--text);">Software:</strong> ${data.hardware.Software || 'N/A'}</li>
        <li style="margin-bottom:0.5rem;"><strong style="color:var(--text);">Resolución Orig:</strong> ${data.hardware.ImageWidth || '?'} x ${data.hardware.ImageLength || '?'}</li>
        <li style="margin-bottom:0.5rem;"><strong style="color:var(--text);">DPI:</strong> ${data.hardware.XResolution || '?'} x ${data.hardware.YResolution || '?'}</li>
        <li style="margin-bottom:0.5rem;"><strong style="color:var(--text);">Captura:</strong> ${data.capture.DateTimeOriginal || 'N/A'}</li>
        <li style="margin-bottom:0.5rem;"><strong style="color:var(--text);">Exposición:</strong> ${data.capture.ExposureTime || '?'}s, f/${data.capture.FNumber || '?'}, ISO ${data.capture.ISOSpeedRatings || '?'}</li>
      `;

      // Update GPS info
      const gpsDiv = document.getElementById('cyber-gps-info');
      if (data.gps && data.gps.gps_present) {
        gpsDiv.innerHTML = `
          <div style="background:rgba(16,185,129,0.1); border:1px solid #10b981; border-radius:8px; padding:1rem; font-size:0.9rem;">
            <p style="color:#10b981; font-weight:600; margin-bottom:0.5rem;">Ubicación Encontrada (Status: ${data.gps.status})</p>
            <p style="margin-bottom:0.25rem;"><strong>Latitud (DD):</strong> ${data.gps.latitude_dd.toFixed(6)}</p>
            <p style="margin-bottom:0.25rem;"><strong>Longitud (DD):</strong> ${data.gps.longitude_dd.toFixed(6)}</p>
            <p style="margin-bottom:0.25rem;"><strong>DMS:</strong> ${data.gps.latitude_dms}, ${data.gps.longitude_dms}</p>
            <p style="margin-bottom:0.25rem;"><strong>Altitud:</strong> ${data.gps.altitude_meters ? data.gps.altitude_meters.toFixed(2) + 'm' : 'N/A'}</p>
            <p style="margin-bottom:0.25rem;"><strong>Timestamp GPS:</strong> ${data.gps.timestamp || 'N/A'}</p>
            <p style="margin-bottom:0.75rem;"><strong>Precisión (DOP):</strong> ${data.gps.precision_dop || 'N/A'}</p>
            <a href="${data.gps.map_url}" target="_blank" class="btn btn-primary" style="font-size:0.8rem; padding:0.4rem 0.8rem;">Ver en Mapa</a>
          </div>
        `;
      } else {
        gpsDiv.innerHTML = `
          <div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; border-radius:8px; padding:1rem; font-size:0.9rem;">
             <p style="color:#ef4444; font-weight:600; margin-bottom:0.5rem;">GPS_PRESENT: FALSE</p>
             <p style="margin-bottom:0;">STATUS: ${data.gps ? data.gps.status : 'METADATA_NOT_FOUND'}</p>
             <p style="margin-top:0.5rem; color:var(--text-muted);">El archivo carece de metadatos GPS o fueron limpiados.</p>
          </div>
        `;
      }

      // Update EXIF table
      const tbody = document.querySelector('#cyber-exif-table tbody');
      tbody.innerHTML = '';
      if (Object.keys(data.raw_metadata).length > 0) {
        for (const [key, value] of Object.entries(data.raw_metadata)) {
          const tr = document.createElement('tr');
          tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
          tr.innerHTML = `
            <td style="padding:0.5rem 0; color:var(--text-muted); font-family:monospace;">${key}</td>
            <td style="padding:0.5rem 0; word-break:break-all;">${value}</td>
          `;
          tbody.appendChild(tr);
        }
      } else {
        tbody.innerHTML = `<tr><td colspan="2" style="padding:1rem 0; text-align:center;" class="text-muted">No se encontraron etiquetas EXIF.</td></tr>`;
      }

      loading.classList.add('hidden');
      resultsPanel.style.display = 'block';
    } else {
      const err = await res.json();
      alert("Error al analizar archivo: " + (err.detail || "Error desconocido"));
      dropzone.style.display = 'block';
      loading.classList.add('hidden');
    }
  } catch (error) {
    console.error(error);
    alert("Error de conexión al analizar archivo.");
    dropzone.style.display = 'block';
    loading.classList.add('hidden');
  }

  event.target.value = '';
}

function resetCyber() {
  document.getElementById('cyber-dropzone').style.display = 'block';
  document.getElementById('cyber-results-panel').style.display = 'none';
  document.getElementById('cyber-loading').classList.add('hidden');
  currentCyberData = null;
}

function exportCyber() {
  if (!currentCyberData) return;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentCyberData, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "forensys_metainspect_" + currentCyberData.file_info.filename + ".json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// ==========================================
// FORENSYS OSINT & NETTRACKER LOGIC
// ==========================================

let activeOSINTModule = 'username';
let currentOSINTReportPath = '';

const osintModules = {
  username: {
    title: 'Analizar Username',
    placeholder: 'Ej: johndoe',
    endpoint: '/api/osint/analyze',
    key: 'query'
  },
  email: {
    title: 'Analizar Email',
    placeholder: 'Ej: objetivo@gmail.com',
    endpoint: '/api/osint/email',
    key: 'email'
  },
  phone: {
    title: 'Analizar Teléfono',
    placeholder: 'Ej: +573001234567',
    endpoint: '/api/osint/phone',
    key: 'phone'
  },
  cedula: {
    title: 'Analizar Cédula (COL)',
    placeholder: 'Ej: 1020304050',
    endpoint: '/api/osint/cedula',
    key: 'cedula'
  },
  name: {
    title: 'Analizar Nombre Completo',
    placeholder: 'Ej: Juan Perez Garcia',
    endpoint: '/api/osint/name',
    key: 'name'
  }
};

function selectOSINTModule(moduleName) {
  activeOSINTModule = moduleName;
  
  // Actualizar UI de tarjetas
  document.querySelectorAll('.osint-module-card').forEach(el => el.classList.remove('active'));
  document.getElementById(`osint-mod-${moduleName}`).classList.add('active');
  
  // Actualizar formulario
  const config = osintModules[moduleName];
  document.getElementById('osint-active-title').textContent = config.title;
  document.getElementById('osint-query').placeholder = config.placeholder;
  document.getElementById('osint-query').value = '';
  
  // Resetear resultados
  document.getElementById('osint-console-title').textContent = `Console Output - ${moduleName.toUpperCase()}`;
  document.getElementById('osint-console').innerHTML = '<div style="color:#666;">Esperando ejecución...</div>';
  document.getElementById('osint-details-panel').style.display = 'none';
  document.getElementById('osint-node-details').innerHTML = '';
  document.getElementById('osint-download-btn').classList.add('hidden');
  currentOSINTReportPath = '';
}

function renderOSINTReport(reportData) {
  const container = document.getElementById('osint-node-details');
  let html = '';
  
  if (activeOSINTModule === 'username' || activeOSINTModule === 'email') {
    const findings = reportData.findings || [];
    if (findings.length === 0) {
      html = '<p>No se encontraron resultados.</p>';
    } else {
      findings.forEach(f => {
        html += `
          <div class="osint-result-card">
            <div class="osint-result-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;color:var(--low);"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div style="font-weight:600; color:var(--text);">${f.platform}</div>
              <div style="font-size:0.8rem; color:var(--muted);">${f.detail || f.url || 'Cuenta encontrada'}</div>
            </div>
          </div>
        `;
      });
    }
  } 
  else if (activeOSINTModule === 'phone') {
    const info = reportData.phone_info;
    if (info) {
      html += `
        <div style="background:var(--bg-alt); padding:1rem; border-radius:6px; border:1px solid var(--border); margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
            <span style="color:var(--muted);">Válido:</span>
            <span style="color:${info.valid ? 'var(--low)' : 'var(--high)'}; font-weight:600;">${info.valid ? 'SÍ' : 'NO'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span style="color:var(--muted);">País:</span> <span>${info.country}</span></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span style="color:var(--muted);">Operador:</span> <span>${info.carrier}</span></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span style="color:var(--muted);">Tipo:</span> <span>${info.line_type}</span></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:var(--muted);">E.164:</span> <span>${info.number_e164}</span></div>
        </div>
      `;
    }
    const dorks = reportData.dorks || [];
    if (dorks.length > 0) {
      html += '<h4 style="margin:1rem 0 0.5rem; color:var(--text); font-size:0.9rem;">Búsquedas Recomendadas</h4><div class="osint-link-grid">';
      dorks.forEach(d => {
        html += `<a href="${d.url}" target="_blank" class="osint-link-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> ${d.description}</a>`;
      });
      html += '</div>';
    }
  }
  else if (activeOSINTModule === 'cedula' || activeOSINTModule === 'name') {
    const siri = reportData.siri_results || [];
    if (siri.length > 0) {
      html += '<h4 style="margin-bottom:0.5rem; color:var(--high);">¡Atención! Registros encontrados en SIRI (Procuraduría)</h4>';
      siri.forEach(r => {
        const name = r.nombre_completo || r.nombre || 'N/A';
        const sancion = r.clase_de_falta || r.sanci_n || 'N/A';
        html += `
          <div class="osint-result-card" style="border-left: 3px solid var(--high);">
            <div>
              <div style="font-weight:600; color:var(--text);">${name}</div>
              <div style="font-size:0.8rem; color:var(--high); margin-top:4px;">Sanción: ${sancion}</div>
              <div style="font-size:0.8rem; color:var(--muted);">${r.entidad || ''}</div>
            </div>
          </div>
        `;
      });
    } else {
      html += `
        <div class="osint-result-card" style="border-left: 3px solid var(--low);">
          <div style="color:var(--low); font-weight:600;">Sin registros negativos en Datos Abiertos SIRI.</div>
        </div>
      `;
    }

    const links = reportData.portals || reportData.social_links || [];
    if (links.length > 0) {
      html += '<h4 style="margin:1rem 0 0.5rem; color:var(--text); font-size:0.9rem;">Enlaces de Búsqueda</h4><div class="osint-link-grid">';
      links.forEach(l => {
        // Fallback for icon if it's text like [Portal]
        const iconSvg = l.icon === '[Social]' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
        
        html += `<a href="${l.url}" target="_blank" class="osint-link-item">${iconSvg} ${l.name || l.platform}</a>`;
      });
      html += '</div>';
    }
    
    const dorks = reportData.dorks || [];
    if (dorks.length > 0) {
      html += '<h4 style="margin:1rem 0 0.5rem; color:var(--text); font-size:0.9rem;">Google Dorks</h4><div class="osint-link-grid">';
      dorks.forEach(d => {
        html += `<a href="${d.url}" target="_blank" class="osint-link-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> ${d.description}</a>`;
      });
      html += '</div>';
    }
  }
  
  container.innerHTML = html;
}

function downloadOSINTReport() {
  if (!currentOSINTReportPath) return;
  const filename = currentOSINTReportPath.split('/').pop().split('\\').pop();
  window.open(`/api/osint/report/${filename}`, '_blank');
}

async function runOSINTAnalysis(event) {
  event.preventDefault();
  const queryInput = document.getElementById('osint-query').value;
  if (!queryInput) return;

  const config = osintModules[activeOSINTModule];
  const payload = {};
  payload[config.key] = queryInput;

  const btn = document.getElementById('osint-btn');
  const loading = document.getElementById('osint-loading');
  const detailsPanel = document.getElementById('osint-details-panel');
  const detailsContent = document.getElementById('osint-node-details');
  const downloadBtn = document.getElementById('osint-download-btn');
  const consoleDiv = document.getElementById('osint-console');
  
  btn.disabled = true;
  loading.classList.remove('hidden');
  detailsPanel.style.display = 'block';
  detailsContent.innerHTML = '<div style="color:var(--muted);">Procesando inteligencia...</div>';
  downloadBtn.classList.add('hidden');
  consoleDiv.innerHTML = '';
  currentOSINTReportPath = '';
  
  addRecentActivity('Rastreo OSINT', 'yellow', `Módulo: ${activeOSINTModule}, Objetivo: ${queryInput}`);

  try {
    const res = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop(); // Keep incomplete line
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'log') {
              const p = document.createElement('div');
              let text = data.data;
              
              if (text.includes('[+]') || text.includes('✅')) {
                p.style.color = '#4ade80'; // verde
                p.style.fontWeight = 'bold';
              } else if (text.includes('[-]') || text.includes('[!]') || text.includes('❌')) {
                p.style.color = '#ef4444'; // rojo
              } else if (text.startsWith('[*]')) {
                p.style.color = '#facc15'; // amarillo
              } else {
                p.style.color = '#94a3b8'; // gris
              }
              
              p.textContent = text;
              consoleDiv.appendChild(p);
              consoleDiv.scrollTop = consoleDiv.scrollHeight;
            } 
            else if (data.type === 'report') {
               // Procesar JSON final
               if (data.data.report_file) {
                 currentOSINTReportPath = data.data.report_file;
                 downloadBtn.classList.remove('hidden');
               }
               renderOSINTReport(data.data);
            }
          } catch (e) {
            console.error('Error parsing NDJSON line:', e);
          }
        }
      }
      
    } else {
      let errTxt = "Error en el análisis OSINT";
      try {
          const errData = await res.json();
          if (errData.detail) errTxt = errData.detail;
      } catch (e) {}
      alert(errTxt);
      detailsContent.innerHTML = `<div style="color:var(--high);">${errTxt}</div>`;
      consoleDiv.innerHTML += `<div style="color:var(--high);">[!] ${errTxt}</div>`;
    }
  } catch (err) {
    console.error(err);
    alert("Error de conexión");
    detailsContent.innerHTML = '<div style="color:var(--high);">Error de conexión.</div>';
    consoleDiv.innerHTML += '<div style="color:var(--high);">[!] Error de conexión con el servidor.</div>';
  }

  loading.classList.add('hidden');
  btn.disabled = false;
}
function openMobileDownloadModal() { document.getElementById('mobile-download-modal').classList.remove('hidden'); }
function closeMobileDownloadModal() { document.getElementById('mobile-download-modal').classList.add('hidden'); }
async function openBallisticsModule() {
  try {
    const res = await fetch('/api/tools/ballistics', { method: 'POST' });
    if (res.ok) {
      console.log('Ballistics module started');
      alert('Iniciando Mdulo de Balstica 3D...');
    } else {
      alert('Error al iniciar el mdulo.');
    }
} catch(e) {
    console.error(e);
    alert('Error de red al iniciar el mdulo.');
  }
}

// ==========================================
// EVIDENCE MANAGEMENT
// ==========================================

let currentCaseId = null;

async function loadCasesList() {
  try {
    const res = await fetch('/api/cases', { headers: { 'Authorization': `Bearer ${currentToken}` } });
    const cases = await res.json();
    
    const grid = document.getElementById('cases-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    cases.forEach(c => {
      const card = document.createElement('div');
      card.className = 'panel';
      card.style.cursor = 'pointer';
      card.style.transition = '0.2s';
      card.onmouseover = () => card.style.transform = 'translateY(-2px)';
      card.onmouseout = () => card.style.transform = 'translateY(0)';
      card.onclick = () => openCaseDetail(c);
      
      const date = new Date(c.created_at).toLocaleDateString();
      
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.5rem;">
          <h3 style="color:var(--accent-bright); font-size:1.1rem; margin:0;">${c.case_name}</h3>
          <span style="background:var(--accent); color:#000; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold;">${c.status}</span>
        </div>
        <p style="color:var(--text-secondary); font-size:0.8rem; font-family:monospace; margin-bottom:1rem;">ID: ${c.case_hash}</p>
        <p style="color:var(--text); font-size:0.9rem; margin-bottom:1rem;">${c.description || 'Sin descripción'}</p>
        <div style="display:flex; justify-content:space-between; color:var(--text-secondary); font-size:0.8rem; border-top:1px solid var(--border); padding-top:0.5rem;">
          <span>Autor: ${c.created_by}</span>
          <span>${date}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (e) {
    console.error("Error loading cases", e);
  }
}

function openCreateCaseModal() {
  document.getElementById('create-case-modal').style.display = 'block';
  document.getElementById('modal-overlay').style.display = 'block';
}

function closeCreateCaseModal() {
  document.getElementById('create-case-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('new-case-name').value = '';
  document.getElementById('new-case-desc').value = '';
  document.getElementById('new-case-author').value = '';
}

async function submitCreateCase() {
  const name = document.getElementById('new-case-name').value;
  const desc = document.getElementById('new-case-desc').value;
  const author = document.getElementById('new-case-author').value;
  
  if (!name) return alert("Nombre del caso es requerido");
  
  try {
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
      body: JSON.stringify({ case_name: name, description: desc, created_by: author })
    });
    
    if (res.ok) {
      closeCreateCaseModal();
      loadCasesList();
    } else {
      alert("Error al crear caso");
    }
  } catch(e) {
    console.error(e);
  }
}

async function openCaseDetail(c) {
  currentCaseId = c.id;
  document.getElementById('cases-list-panel').style.display = 'none';
  document.getElementById('case-detail-panel').style.display = 'block';
  
  document.getElementById('detail-case-name').textContent = c.case_name;
  document.getElementById('detail-case-hash').textContent = `Hash: ${c.case_hash}`;
  
  loadEvidences(c.id);
}

function backToCasesList() {
  currentCaseId = null;
  document.getElementById('cases-list-panel').style.display = 'block';
  document.getElementById('case-detail-panel').style.display = 'none';
  loadCasesList();
}

async function deleteCurrentCase() {
  if (!currentCaseId) return;
  if (!confirm("¿Está seguro de eliminar este caso y TODAS sus evidencias de forma permanente?")) return;
  
  try {
    const res = await fetch(`/api/cases/${currentCaseId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${currentToken}` } });
    if (res.ok) {
      backToCasesList();
    }
  } catch(e) {
    console.error(e);
  }
}

async function loadEvidences(caseId) {
  try {
    const res = await fetch(`/api/cases/${caseId}`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
    const data = await res.json();
    
    const list = document.getElementById('evidences-list');
    list.innerHTML = '';
    
    if (data.evidences.length === 0) {
      list.innerHTML = '<p class="text-muted" style="font-size:0.9rem; text-align:center; padding:2rem;">No hay evidencias registradas en este caso.</p>';
      return;
    }
    
    data.evidences.forEach(e => {
      const el = document.createElement('div');
      el.style.background = 'rgba(255,255,255,0.03)';
      el.style.border = '1px solid var(--border)';
      el.style.borderRadius = '8px';
      el.style.padding = '0.75rem';
      el.style.display = 'flex';
      el.style.justifyContent = 'space-between';
      el.style.alignItems = 'center';
      
      const date = new Date(e.upload_timestamp).toLocaleString();
      
      el.innerHTML = `
        <div style="flex:1;">
          <h4 style="margin:0; color:var(--text); font-size:0.9rem; word-break:break-all;">${e.original_name}</h4>
          <p style="margin:0.25rem 0; font-family:monospace; font-size:0.75rem; color:var(--text-secondary);">SHA256: ${e.sha256_hash.substring(0, 16)}...</p>
          <p style="margin:0; font-size:0.75rem; color:var(--text-secondary);">Subido por: ${e.uploaded_by || 'Sistema'} | ${date}</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <a href="/${e.file_path}" target="_blank" class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.8rem;">Ver</a>
          <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.8rem;" onclick="deleteEvidence(${e.id})">Del</button>
        </div>
      `;
      list.appendChild(el);
    });
  } catch(e) {
    console.error(e);
  }
}

async function uploadEvidenceFile(e) {
  if (!currentCaseId) return;
  const file = e.target.files[0];
  if (!file) return;
  
  const uploader = document.getElementById('ev-uploader-name').value;
  const notes = document.getElementById('ev-notes').value;
  
  const formData = new FormData();
  formData.append('file', file);
  if (uploader) formData.append('uploaded_by', uploader);
  if (notes) formData.append('notes', notes);
  
  try {
    const btn = document.querySelector('#case-detail-panel .dropzone-text');
    if (btn) btn.textContent = 'Subiendo...';
    
    const res = await fetch(`/api/cases/${currentCaseId}/evidence`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${currentToken}` },
      body: formData
    });
    
    if (btn) btn.textContent = 'Subir Archivo';
    
    if (res.ok) {
      document.getElementById('ev-uploader-name').value = '';
      document.getElementById('ev-notes').value = '';
      document.getElementById('ev-file-input').value = '';
      loadEvidences(currentCaseId);
    } else {
      const errData = await res.json().catch(() => ({}));
      console.error("Upload error:", res.status, errData);
      alert(`Error al subir archivo (${res.status}): ${errData.detail || 'Error desconocido'}`);
    }
  } catch(err) {
    console.error(err);
    alert("Error de red al subir archivo");
  }
}


async function deleteEvidence(evId) {
  if (!confirm("¿Eliminar evidencia?")) return;
  try {
    await fetch(`/api/evidence/${evId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${currentToken}` } });
    if(currentCaseId) loadEvidences(currentCaseId);
  } catch(e) {
    console.error(e);
  }
}

// ==========================================
// REPORTS MANAGEMENT
// ==========================================

let signatureMode = 'draw';
let sigCanvas, sigCtx;
let isDrawing = false;
let uploadedSigImage = null;
let reportEvidences = [];
let allCasesCache = [];

function setSignatureMode(mode) {
  signatureMode = mode;
  document.getElementById('btn-sig-draw').classList.remove('active');
  document.getElementById('btn-sig-upload').classList.remove('active');
  document.getElementById('btn-sig-' + mode).classList.add('active');
  
  if (mode === 'draw') {
    document.getElementById('sig-draw-container').style.display = 'block';
    document.getElementById('sig-upload-container').style.display = 'none';
  } else {
    document.getElementById('sig-draw-container').style.display = 'none';
    document.getElementById('sig-upload-container').style.display = 'block';
  }
}

function initReports() {
  sigCanvas = document.getElementById('signature-canvas');
  if (sigCanvas) {
    sigCtx = sigCanvas.getContext('2d');
    sigCtx.strokeStyle = '#000000';
    sigCtx.lineWidth = 2;
    sigCtx.lineCap = 'round';
    
    sigCanvas.addEventListener('mousedown', startDraw);
    sigCanvas.addEventListener('mousemove', draw);
    sigCanvas.addEventListener('mouseup', endDraw);
    sigCanvas.addEventListener('mouseout', endDraw);
    
    sigCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e.touches[0]); });
    sigCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e.touches[0]); });
    sigCanvas.addEventListener('touchend', endDraw);
  }
  
  loadSystemInfoForReport();
}

function startDraw(e) {
  isDrawing = true;
  draw(e);
}
function draw(e) {
  if (!isDrawing) return;
  const rect = sigCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  sigCtx.lineTo(x, y);
  sigCtx.stroke();
  sigCtx.beginPath();
  sigCtx.moveTo(x, y);
}
function endDraw() {
  isDrawing = false;
  if(sigCtx) sigCtx.beginPath();
}
function clearSignature() {
  if (sigCtx) sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
}

function handleSignatureUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    uploadedSigImage = ev.target.result;
    const img = document.getElementById('sig-preview');
    img.src = uploadedSigImage;
    img.style.display = 'block';
  }
  reader.readAsDataURL(file);
}

async function loadSystemInfoForReport() {
  try {
    const res = await fetch('/api/system/info');
    const data = await res.json();
    document.getElementById('rep-sys-ip').textContent = data.ip;
    document.getElementById('rep-sys-mac').textContent = data.mac;
    document.getElementById('rep-sys-plat').textContent = data.platform;
    document.getElementById('rep-sys-date').textContent = data.timestamp;
    
    const randomId = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    document.getElementById('rep-sys-id').textContent = randomId + '-' + randomLetter;
    
  } catch(e) {
    console.error(e);
  }
}

async function populateReportCasesDropdown() {
  try {
    const res = await fetch('/api/cases', { headers: { 'Authorization': `Bearer ${currentToken}` } });
    allCasesCache = await res.json();
    const select = document.getElementById('rep-case-select');
    select.innerHTML = '<option value="">-- No incluir evidencias --</option>';
    allCasesCache.forEach(c => {
      select.innerHTML += '<option value="' + c.id + '">' + c.case_name + '</option>';
    });
  } catch(e) {}
}

function loadReportEvidences() {
  const select = document.getElementById('rep-case-select');
  const container = document.getElementById('rep-evidences-container');
  container.innerHTML = '';
  reportEvidences = [];
  
  if (!select.value) {
    container.style.display = 'none';
    return;
  }
  
  const c = allCasesCache.find(x => x.id == select.value);
  if (c && c.evidences && c.evidences.length > 0) {
    container.style.display = 'flex';
    c.evidences.forEach(ev => {
      container.innerHTML += '<label style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:var(--text); cursor:pointer;">' +
          '<input type="checkbox" value="' + ev.id + '" onchange="toggleReportEvidence(this, ' + JSON.stringify(ev).replace(/"/g, '&quot;') + ')">' +
          ev.original_name + ' (SHA256: ' + ev.sha256_hash.substring(0,8) + '...)</label>';
    });
  } else {
    container.style.display = 'none';
  }
}

function toggleReportEvidence(checkbox, ev) {
  if (checkbox.checked) {
    reportEvidences.push(ev);
  } else {
    reportEvidences = reportEvidences.filter(x => x.id !== ev.id);
  }
}

async function generateReportPDF() {
  const officer = document.getElementById('rep-officer').value;
  const title = document.getElementById('rep-title').value;
  const desc = document.getElementById('rep-desc').value;
  
  if (!officer || !title || !desc) {
    return alert("Por favor complete Oficial, Título y Narración.");
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const sysId = document.getElementById('rep-sys-id').textContent;
  const sysDate = document.getElementById('rep-sys-date').textContent;
  const sysIp = document.getElementById('rep-sys-ip').textContent;
  const sysMac = document.getElementById('rep-sys-mac').textContent;
  
  doc.setFillColor(15, 23, 42); 
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("FORENSYS LAB", 10, 20);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("REPORTE PERICIAL", 150, 18);
  doc.setFontSize(10);
  doc.text(sysId, 150, 24);
  
  doc.setTextColor(0, 0, 0);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("1. METADATOS DEL SISTEMA", 10, 40);
  doc.setFont("helvetica", "normal");
  doc.text('Fecha de Generación: ' + sysDate, 15, 47);
  doc.text('IP de Origen: ' + sysIp, 15, 53);
  doc.text('MAC Address: ' + sysMac, 15, 59);
  
  doc.setFont("helvetica", "bold");
  doc.text("2. DATOS DEL INVESTIGADOR", 10, 75);
  doc.setFont("helvetica", "normal");
  doc.text('Oficial: ' + officer, 15, 82);
  doc.text('Rango/Cargo: ' + document.getElementById('rep-rank').value, 15, 88);
  
  doc.setFont("helvetica", "bold");
  doc.text("3. NARRACIÓN DE LOS HECHOS", 10, 105);
  doc.text('Título: ' + title, 15, 112);
  doc.setFont("helvetica", "normal");
  const splitDesc = doc.splitTextToSize(desc, 180);
  doc.text(splitDesc, 15, 120);
  
  let currentY = 120 + (splitDesc.length * 5) + 15;
  
  if (reportEvidences.length > 0) {
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    
    doc.setFont("helvetica", "bold");
    doc.text("4. CADENA DE CUSTODIA (EVIDENCIAS)", 10, currentY);
    currentY += 10;
    
    doc.setFont("helvetica", "normal");
    reportEvidences.forEach(ev => {
      if (currentY > 270) { doc.addPage(); currentY = 20; }
      doc.text('- Archivo: ' + ev.original_name, 15, currentY); currentY += 5;
      doc.text('  Subido: ' + new Date(ev.upload_timestamp).toLocaleString(), 15, currentY); currentY += 5;
      doc.text('  SHA256: ' + ev.sha256_hash, 15, currentY); currentY += 8;
    });
  }
  
  if (currentY > 230) { doc.addPage(); currentY = 20; }
  currentY += 20;
  
  doc.line(70, currentY, 140, currentY);
  doc.text("Firma de Responsabilidad", 105, currentY + 5, { align: 'center' });
  
  if (signatureMode === 'draw') {
    const sigData = sigCanvas.toDataURL();
    doc.addImage(sigData, 'PNG', 70, currentY - 30, 70, 25);
  } else if (signatureMode === 'upload' && uploadedSigImage) {
    doc.addImage(uploadedSigImage, 'PNG', 70, currentY - 30, 70, 25);
  }
  
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text('Generado por ForenSys Lab v2.0 - Página ' + i + ' de ' + totalPages, 105, 290, { align: 'center' });
  }
  
  doc.save('ForenSys_Reporte_' + sysId + '.pdf');
}

const originalNavigateTo = navigateTo;
navigateTo = function(viewId) {
  originalNavigateTo(viewId);
  if (viewId === 'evidencias') loadCasesList();
  if (viewId === 'reportes') {
    initReports();
    populateReportCasesDropdown();
  }
}

