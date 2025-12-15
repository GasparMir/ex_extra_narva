// --- DOM---
const openCameraBtn = document.getElementById('openCamera');
const cameraContainer = document.getElementById('cameraContainer');
const video = document.getElementById('video');
const takePhotoBtn = document.getElementById('takePhoto');
const switchCameraBtn = document.getElementById('switchCamera');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gallery = document.getElementById('gallery');
let stream = null;
let usingFrontCamera = false; 
let closeBtn = null;

// --- DOM Geo ---
const permissionStatusEl = document.getElementById('permission-status');
const lastPositionEl = document.getElementById('last-position');

let currentPosition = null; 
let watchId = null; 

// Geolocalización

function updateLocationDisplay(position) {
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = new Date(position.timestamp).toLocaleTimeString();
    
    lastPositionEl.innerHTML = `
        Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)} 
        (±${accuracy.toFixed(0)}m)<br>
        Actualizado a las ${timestamp}
    `;
    currentPosition = position;
}

function onPositionSuccess(position) {
    console.log('Posición actualizada:', position);
    updateLocationDisplay(position);
}

function onPositionError(error) {
    let message = '';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'Permiso denegado: Por favor, activa la geolocalización.';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Posición no disponible.';
            break;
        case error.TIMEOUT:
            message = 'Tiempo de espera agotado.';
            break;
        default:
            message = 'Error desconocido al obtener la posición.';
            break;
    }
    console.error('Error de Geolocalización:', message);
    lastPositionEl.textContent = `Error: ${message}`;
}

function startLocationWatch() {
    if (watchId === null) {
        watchId = navigator.geolocation.watchPosition(
            onPositionSuccess, 
            onPositionError, 
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
        console.log('Seguimiento de ubicación iniciado.');
    }
}

function checkPermissionStatus() {
    if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then(result => {
            permissionStatusEl.textContent = result.state;
            if (result.state === 'granted' || result.state === 'prompt') {
                startLocationWatch();
            }
            result.onchange = () => {
                permissionStatusEl.textContent = result.state;
                if (result.state === 'granted') {
                    startLocationWatch();
                } else {
                    navigator.geolocation.clearWatch(watchId);
                    watchId = null;
                    lastPositionEl.textContent = 'Seguimiento detenido.';
                }
            };
        });
    } else {
        permissionStatusEl.textContent = 'API no compatible. Iniciando seguimiento...';
        startLocationWatch();
    }
}

// Cámara

async function openCamera() {
    try {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                facingMode: usingFrontCamera ? 'user' : 'environment',
                width: { ideal: 320 },
                height: { ideal: 240 }
            },
            audio: false
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        cameraContainer.style.display = 'block';
        openCameraBtn.textContent = 'Cámara Abierta';
        openCameraBtn.disabled = true;

        if (!closeBtn) {
            closeBtn = document.createElement('button');
            closeBtn.textContent = 'X';
            closeBtn.classList.add('close-camera-btn');
            closeBtn.addEventListener('click', closeCamera);
            cameraContainer.appendChild(closeBtn);
            cameraContainer.style.position = 'relative';
        }

        console.log('Cámara abierta', usingFrontCamera ? 'frontal' : 'trasera');
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        alert('No se pudo acceder a la cámara. Revisa los permisos.');
        openCameraBtn.textContent = 'Abrir Cámara';
        openCameraBtn.disabled = false;
    }
}

async function switchCamera() {
    usingFrontCamera = !usingFrontCamera;
    await openCamera();
}


function takePhoto() {
    if (!stream) {
        alert('Primero debes abrir la cámara');
        return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataURL = canvas.toDataURL('image/png');

    const photoContainer = document.createElement('div');
    photoContainer.classList.add('photo-item');

    const img = document.createElement('img');
    img.src = imageDataURL;
    photoContainer.appendChild(img);

    const geoInfo = document.createElement('p');
    if (currentPosition) {
        const { latitude, longitude } = currentPosition.coords;
        const geoTimestamp = new Date(currentPosition.timestamp).toLocaleTimeString(); 
        const mapUrl = `http://maps.google.com/?q=${latitude},${longitude}`; 
        geoInfo.innerHTML = `
            Latitud: ${latitude.toFixed(5)}<br>
            Longitud: ${longitude.toFixed(5)}<br>
            Hora de Geo: ${geoTimestamp}
            <a href="${mapUrl}" target="_blank">Ver en Google Maps</a>
        `;
    } else {
        geoInfo.textContent = 'Ubicación no disponible al momento de la captura.';
        geoInfo.style.color = 'red';
    }
    photoContainer.appendChild(geoInfo);

    gallery.prepend(photoContainer); 
}

function closeCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        video.srcObject = null;
    }
    cameraContainer.style.display = 'none';
    openCameraBtn.textContent = 'Abrir Cámara';
    openCameraBtn.disabled = false;
    if (closeBtn) {
        closeBtn.remove();
        closeBtn = null;
    }
}

// Event Listeners

openCameraBtn.addEventListener('click', openCamera);
takePhotoBtn.addEventListener('click', takePhoto);
switchCameraBtn.addEventListener('click', switchCamera);
window.addEventListener('beforeunload', closeCamera);

document.addEventListener('DOMContentLoaded', () => {
    checkPermissionStatus(); 
    
    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker registrado'))
            .catch(err => console.error('Error registrando SW:', err));
    }
});