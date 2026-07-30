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

function handleFingerprintUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const previewContainer = document.getElementById('afis-query-preview');
    const img = document.createElement('img');
    img.src = e.target.result;
    
    // Add scanning effect class
    previewContainer.innerHTML = '';
    previewContainer.appendChild(img);
    previewContainer.classList.add('scan-active');
    
    // Simulate quality calculation
    setTimeout(() => {
      previewContainer.classList.remove('scan-active');
      
      const qualityEl = document.getElementById('afis-query-quality-val');
      const stars = document.getElementById('afis-query-stars').children;
      
      // Random quality between Good and Excellent
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
      
      // Enable compare button
      document.getElementById('afis-compare-btn').disabled = false;
      
    }, 1200);
  }
  reader.readAsDataURL(file);
}

function startComparison() {
  const btn = document.getElementById('afis-compare-btn');
  btn.disabled = true;
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Procesando...`;
  
  // Add scanning overlay to whole panel
  const resultsPanel = document.getElementById('afis-results-panel');
  const scanningOverlay = document.createElement('div');
  scanningOverlay.className = 'afis-scanning';
  scanningOverlay.innerHTML = `
    <div class="afis-scanning-text">EXTRAYENDO MINUCIAS</div>
    <div class="afis-scanning-bar"></div>
  `;
  resultsPanel.appendChild(scanningOverlay);

  // Phase 1: Extract Minutiae
  setTimeout(() => {
    scanningOverlay.querySelector('.afis-scanning-text').textContent = 'CONSULTANDO BASE DE DATOS';
    
    // Phase 2: Match DB
    setTimeout(() => {
      // Setup DB preview side
      const dbPreview = document.getElementById('afis-db-preview');
      dbPreview.classList.add('scan-active');
      
      scanningOverlay.querySelector('.afis-scanning-text').textContent = 'CALCULANDO COINCIDENCIA';
      
      // Phase 3: Results
      setTimeout(() => {
        dbPreview.classList.remove('scan-active');
        resultsPanel.removeChild(scanningOverlay);
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Nueva Comparación`;
        btn.disabled = false;
        
        // Show Live Badge
        document.getElementById('afis-live-badge').style.display = 'flex';
        
        // Set DB Quality (Excellent)
        const dbQuality = document.getElementById('afis-db-quality-val');
        dbQuality.textContent = 'EXCELENTE';
        dbQuality.className = 'value excellent';
        const dbStars = document.getElementById('afis-db-stars').children;
        for(let i=0; i<5; i++) dbStars[i].className = 'quality-star';
        
        // Generate Results
        const score = (75 + Math.random() * 24.5).toFixed(2);
        let confText = 'ALTA';
        let confColor = 'var(--low)';
        if(score > 90) { confText = 'MUY ALTA'; }
        else if (score < 80) { confText = 'MODERADA'; confColor = 'var(--medium)'; }
        
        document.getElementById('afis-score').textContent = score + '%';
        
        const confSpan = document.getElementById('afis-confidence');
        confSpan.textContent = confText;
        confSpan.style.color = confColor;
        
        // Populate random minutiae data
        document.getElementById('afis-minutiae-match').textContent = Math.floor(60 + Math.random() * 40);
        document.getElementById('afis-minutiae-disc').textContent = Math.floor(2 + Math.random() * 6);
        document.getElementById('afis-rotation').textContent = (Math.random() * 5).toFixed(1) + '°';
        document.getElementById('afis-translation').textContent = Math.floor(5 + Math.random() * 15) + ' px';
        document.getElementById('afis-scale').textContent = (95 + Math.random() * 5).toFixed(1) + '%';
        
        const qQual = document.getElementById('afis-query-quality-val').textContent;
        const qQEl = document.getElementById('afis-q-quality');
        qQEl.textContent = qQual;
        qQEl.className = 'afis-result-value ' + (qQual === 'EXCELENTE' ? 'highlight' : '');
        
        document.getElementById('afis-m-quality').textContent = 'EXCELENTE';
        document.getElementById('afis-time').textContent = (0.1 + Math.random() * 0.4).toFixed(2) + ' seg';
        
        // Show detail button
        document.getElementById('afis-detail-btn').style.display = 'flex';
        
        // Add to recent activity
        addRecentActivity('Comparación Biométrica AFIS', 'blue', `${score}% MATCH`);
        
      }, 1000);
    }, 1000);
  }, 1000);
}

// ==========================================
// Drag and Drop Logic
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('afis-dropzone');
  
  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const fileInput = document.getElementById('afis-file-input');
        // We can't directly assign to FileList, so we manually trigger the upload logic
        const fakeEvent = { target: { files: [e.dataTransfer.files[0]] } };
        handleFingerprintUpload(fakeEvent);
      }
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
async function runOSINT(event) {
  event.preventDefault();
  const query = document.getElementById('osint-query').value;
  if (!query) return;

  const btn = document.getElementById('osint-btn');
  const loading = document.getElementById('osint-loading');
  const detailsPanel = document.getElementById('osint-details-panel');
  const detailsContent = document.getElementById('osint-node-details');
  
  btn.disabled = true;
  loading.classList.remove('hidden');
  detailsPanel.style.display = 'block';
  detailsContent.innerHTML = 'Analizando red...';
  
  addRecentActivity('Rastreo OSINT', 'yellow', `Objetivo: ${query}`);

  try {
    const res = await fetch('/api/osint/analyze', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: query })
    });

    if (res.ok) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const consoleDiv = document.getElementById('osint-console');
      consoleDiv.innerHTML = ''; // Limpiar consola

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
              
              if (text.includes('[+]')) {
                text = text.replace('[+]', '✅ [OK]');
                p.style.color = '#4ade80'; // verde brillante
                p.style.fontWeight = 'bold';
              } else if (text.includes('[-]')) {
                text = text.replace('[-]', '❌ [OFF]');
                p.style.color = '#ef4444'; // rojo suave
              } else if (text.startsWith('[*]')) {
                p.style.color = '#facc15'; // amarillo
              } else {
                p.style.color = '#94a3b8'; // gris
              }
              
              p.textContent = text;
              consoleDiv.appendChild(p);
              consoleDiv.scrollTop = consoleDiv.scrollHeight;
            }
          } catch (e) {
            console.error('Error parsing NDJSON line:', e);
          }
        }
      }
      
    } else {
      alert("Error en el análisis OSINT");
      detailsContent.innerHTML = 'Error en el análisis.';
    }
  } catch (err) {
    console.error(err);
    alert("Error de conexión");
    detailsContent.innerHTML = 'Error de conexión.';
  }

  loading.classList.add('hidden');
  btn.disabled = false;
}
