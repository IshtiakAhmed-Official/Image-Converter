document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const placeholderContent = document.getElementById('placeholderContent');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const previewGrid = document.getElementById('previewGrid');
    
    // Controls & Settings
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const ratioLockBtn = document.getElementById('ratioLock');
    const widthLockBtn = document.getElementById('widthLockBtn');
    const heightLockBtn = document.getElementById('heightLockBtn');
    const ratioStatus = document.getElementById('ratioStatus');
    const resetDimsBtn = document.getElementById('resetDims');
    const qualityInput = document.getElementById('qualityInput');
    const qualityValue = document.getElementById('qualityValue');
    const qualityContainer = document.getElementById('qualityContainer');
    const autoDownloadToggle = document.getElementById('autoDownloadToggle');
    const zipToggle = document.getElementById('zipToggle');
    const batchModeToggle = document.getElementById('batchModeToggle');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadBtnText = document.getElementById('downloadBtnText');
    const originalInfo = document.getElementById('originalInfo');
    const clearBtn = document.getElementById('clearBtn');

    // UI Utilities
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // --- State ---
    let imagesQueue = [];
    let isRatioLocked = true;
    let isWidthPersisted = false;
    let isHeightPersisted = false;
    let isProcessing = false;
    let toastTimeout;

    // --- Initialization ---
    // Set Footer Year
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Initialize Batch Mode Input
    const updateInputMode = () => {
        if (batchModeToggle.checked) {
            fileInput.setAttribute('multiple', '');
        } else {
            fileInput.removeAttribute('multiple');
        }
    };
    batchModeToggle.addEventListener('change', updateInputMode);
    updateInputMode();

    // --- Event Listeners ---
    
    // Help Modal
    const toggleHelp = () => helpModal.classList.toggle('hidden');
    helpBtn.addEventListener('click', toggleHelp);
    closeHelpBtn.addEventListener('click', toggleHelp);
    helpModal.addEventListener('click', (e) => {
        if(e.target === helpModal) toggleHelp();
    });

    // Format Selection (PNG disables quality slider)
    document.querySelectorAll('input[name="format"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if(radio.value === 'png') {
                qualityContainer.classList.add('opacity-50', 'pointer-events-none');
            } else {
                qualityContainer.classList.remove('opacity-50', 'pointer-events-none');
            }
        });
    });

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drop-active'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drop-active'), false);
    });

    dropZone.addEventListener('drop', handleDrop, false);

    // File Input Trigger
    dropZone.addEventListener('click', (e) => {
        if (e.target !== clearBtn && !clearBtn.contains(e.target) && imagesQueue.length === 0) {
            fileInput.click();
        } else if (e.target.tagName === "BUTTON" && e.target.innerText.includes("Select Files")) {
             fileInput.click();
        }
    });

    fileInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            handleFiles(Array.from(this.files));
        }
    });

    // Paste Support
    window.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        const files = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const f = items[i].getAsFile();
                if(f && (f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))) {
                    files.push(f);
                }
            }
        }
        if(files.length > 0) handleFiles(files);
    });

    // Quality Slider
    qualityInput.addEventListener('input', (e) => {
        qualityValue.innerText = Math.round(e.target.value * 100) + "%";
    });

    // Controls
    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        imagesQueue = [];
        fileInput.value = '';
        updateUI();
    });

    resetDimsBtn.addEventListener('click', () => {
         widthInput.value = '';
         heightInput.value = '';
         if (imagesQueue.length === 1) {
             widthInput.value = imagesQueue[0].originalWidth;
             heightInput.value = imagesQueue[0].originalHeight;
         }
    });

    // --- Core Functions ---

    async function handleDrop(e) {
        const files = Array.from(e.dataTransfer.files || []);
        const validFiles = files.filter(f => 
            f && (f.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|avif|heic|heif)$/i.test(f.name))
        );
        
        const skippedCount = files.length - validFiles.length;
        if (skippedCount > 0) {
            setTimeout(() => showToast(`${skippedCount} file(s) skipped (unsupported type)`), 100);
        }

        if (validFiles.length) {
            handleFiles(validFiles);
        } else if (files.length === 0) {
            showToast("Folders are not supported. Please drop files directly.");
        }
    }

    async function handleFiles(fileList) {
        if (!batchModeToggle.checked) {
            imagesQueue = []; // Clear if not in batch mode
            if (fileList.length > 1) fileList = [fileList[0]];
        }

        let isLongProcess = false;
        const processTimer = setTimeout(() => {
            isLongProcess = true;
            showToast("Processing images...", 0);
            document.body.style.cursor = 'wait';
        }, 500);

        try {
            const filePromises = fileList.map(async (file) => {
                try {
                    // HEIC Conversion
                    if (file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name)) {
                        try {
                            const blob = await heic2any({ blob: file, toType: "image/jpeg" });
                            const finalBlob = Array.isArray(blob) ? blob[0] : blob;
                            file = new File([finalBlob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
                        } catch (e) {
                            console.error("HEIC conversion failed", e);
                            return null;
                        }
                    }
                    return await loadImage(file);
                } catch (e) {
                    console.error("Error loading file", e);
                    return null;
                }
            });

            const newImages = (await Promise.all(filePromises)).filter(img => img !== null);
            
            if (newImages.length > 0) {
                imagesQueue = [...imagesQueue, ...newImages];
                updateUI();
                
                if (autoDownloadToggle.checked && !isProcessing) {
                    downloadBtn.click();
                }
            }
        } finally {
            clearTimeout(processTimer);
            document.body.style.cursor = 'default';
            if(isLongProcess) hideToast();
        }
    }

    function loadImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        file: file,
                        imgObject: img,
                        originalWidth: img.naturalWidth,
                        originalHeight: img.naturalHeight,
                        name: file.name.replace(/\.[^/.]+$/, "")
                    });
                };
                img.onerror = () => resolve(null);
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function updateUI() {
        if (imagesQueue.length === 0) {
            placeholderContent.classList.remove('hidden');
            previewContainer.classList.add('hidden');
            originalInfo.innerText = "No images selected";
            downloadBtnText.innerText = "Download Image";
            downloadBtn.disabled = true;
            imagePreview.src = '';
            previewGrid.innerHTML = '';
            return;
        }

        placeholderContent.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        downloadBtn.disabled = false;

        if (imagesQueue.length === 1) {
            // Single View
            originalInfo.innerText = `${imagesQueue[0].originalWidth} x ${imagesQueue[0].originalHeight} px`;
            downloadBtnText.innerText = "Download Image";
            
            previewGrid.classList.add('hidden');
            previewGrid.innerHTML = '';
            
            imagePreview.src = imagesQueue[0].imgObject.src;
            imagePreview.classList.remove('hidden');
            
            // Auto-populate dims if not locked
            const img = imagesQueue[0];
            const ratio = img.originalWidth / img.originalHeight;

            if (!isWidthPersisted && !isHeightPersisted) {
                widthInput.value = img.originalWidth;
                heightInput.value = img.originalHeight;
            } else if (isWidthPersisted && !isHeightPersisted && isRatioLocked && widthInput.value) {
                heightInput.value = Math.round(widthInput.value / ratio);
            } else if (!isWidthPersisted && isHeightPersisted && isRatioLocked && heightInput.value) {
                widthInput.value = Math.round(heightInput.value * ratio);
            }
        } else {
            // Grid View
            originalInfo.innerText = `${imagesQueue.length} Images Selected`;
            downloadBtnText.innerText = `Download ${imagesQueue.length} Images`;
            
            imagePreview.classList.add('hidden');
            imagePreview.src = '';
            
            previewGrid.classList.remove('hidden');
            renderGrid();
            
            if (!isWidthPersisted && !isHeightPersisted) {
                widthInput.value = '';
                heightInput.value = '';
                widthInput.placeholder = "Auto";
                heightInput.placeholder = "Auto";
            }
        }
    }

    function renderGrid() {
        previewGrid.innerHTML = '';
        imagesQueue.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'grid-item group';
            
            const img = document.createElement('img');
            img.src = item.imgObject.src;
            
            const removeBtn = document.createElement('div');
            removeBtn.className = 'remove-chip';
            removeBtn.innerHTML = '<span class="material-symbols-outlined text-sm">close</span>';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                imagesQueue.splice(index, 1);
                updateUI();
            };
            
            div.appendChild(img);
            div.appendChild(removeBtn);
            previewGrid.appendChild(div);
        });
    }

    // --- Dimension Logic ---

    function toggleLock(btn, type) {
        const icon = btn.querySelector('span');
        let isLocked = false;
        
        if (type === 'width') {
            isWidthPersisted = !isWidthPersisted;
            isLocked = isWidthPersisted;
        } else {
            isHeightPersisted = !isHeightPersisted;
            isLocked = isHeightPersisted;
        }

        if (isLocked) {
            icon.innerText = 'lock';
            btn.classList.add('locked');
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} locked for batch`);
        } else {
            icon.innerText = 'lock_open';
            btn.classList.remove('locked');
        }
    }

    widthLockBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleLock(widthLockBtn, 'width'); });
    heightLockBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleLock(heightLockBtn, 'height'); });
    
    ratioLockBtn.addEventListener('click', () => {
        isRatioLocked = !isRatioLocked;
        const icon = ratioLockBtn.querySelector('span');
        if (isRatioLocked) {
            icon.innerText = 'link';
            ratioLockBtn.classList.add('text-[#0B57D0]');
            ratioLockBtn.classList.remove('text-[#747775]');
            ratioStatus.innerHTML = '<span class="material-symbols-outlined text-[12px]">info</span> Aspect ratio locked';
            
            if(imagesQueue.length === 1 && widthInput.value) {
                 heightInput.value = Math.round(widthInput.value / (imagesQueue[0].originalWidth / imagesQueue[0].originalHeight));
            }
        } else {
            icon.innerText = 'link_off';
            ratioLockBtn.classList.remove('text-[#0B57D0]');
            ratioLockBtn.classList.add('text-[#747775]');
            ratioStatus.innerText = 'Aspect ratio unlocked';
        }
    });

    // Reactive Dimension Inputs
    widthInput.addEventListener('input', () => {
        if (imagesQueue.length !== 1 || !isRatioLocked || !widthInput.value) return;
        const ratio = imagesQueue[0].originalWidth / imagesQueue[0].originalHeight;
        heightInput.value = Math.round(widthInput.value / ratio);
    });

    heightInput.addEventListener('input', () => {
        if (imagesQueue.length !== 1 || !isRatioLocked || !heightInput.value) return;
        const ratio = imagesQueue[0].originalWidth / imagesQueue[0].originalHeight;
        widthInput.value = Math.round(heightInput.value * ratio);
    });

    // --- Download Handling ---

    downloadBtn.addEventListener('click', async () => {
        if (imagesQueue.length === 0 || isProcessing) return;
        
        isProcessing = true;
        const originalBtnText = downloadBtnText.innerText;
        
        const feedbackTimer = setTimeout(() => {
            if (isProcessing) {
                downloadBtnText.innerText = "Processing...";
                downloadBtn.classList.add('opacity-75');
                showToast("Processing... this may take a moment", 0);
            }
        }, 500);
        
        const format = document.querySelector('input[name="format"]:checked').value;
        const quality = parseFloat(qualityInput.value);
        let ext = 'png', mime = 'image/png';
        
        if (format === 'jpeg') { mime = 'image/jpeg'; ext = 'jpg'; }
        else if (format === 'webp') { mime = 'image/webp'; ext = 'webp'; }
        else if (format === 'avif') { mime = 'image/avif'; ext = 'avif'; }

        try {
            const useZip = zipToggle.checked && imagesQueue.length > 1;

            if (useZip) {
                const zip = new JSZip();
                const promises = imagesQueue.map(async (item) => {
                    const dims = calculateDims(item);
                    const blob = await processImageToBlob(item.imgObject, dims.w, dims.h, mime, quality);
                    zip.file(`${item.name}.${ext}`, blob);
                });
                
                await Promise.all(promises);
                const content = await zip.generateAsync({type:"blob"});
                downloadBlob(content, "converted_images.zip");
            } else {
                const promises = imagesQueue.map(async (item) => {
                    try {
                        const dims = calculateDims(item);
                        const blob = await processImageToBlob(item.imgObject, dims.w, dims.h, mime, quality);
                        return { blob, name: `${item.name}_converted.${ext}` };
                    } catch(e) { return null; }
                });

                const results = await Promise.all(promises);
                results.forEach(res => {
                    if(res && res.blob) downloadBlob(res.blob, res.name);
                });
            }

        } catch (err) {
            console.error(err);
            setTimeout(() => showToast("Error processing images"), 100);
        } finally {
            clearTimeout(feedbackTimer);
            isProcessing = false;
            downloadBtnText.innerText = originalBtnText;
            downloadBtn.classList.remove('opacity-75');
            hideToast();
        }
    });

    function calculateDims(item) {
        let w = item.originalWidth;
        let h = item.originalHeight;
        const ratio = w / h;

        const inputW = parseInt(widthInput.value);
        const inputH = parseInt(heightInput.value);

        if (isWidthPersisted && isHeightPersisted) {
             if(inputW) w = inputW;
             if(inputH) h = inputH;
        } else if (isWidthPersisted) {
            if(inputW) {
                w = inputW;
                h = Math.round(w / ratio);
            }
        } else if (isHeightPersisted) {
            if(inputH) {
                h = inputH;
                w = Math.round(h * ratio);
            }
        } else {
            if (inputW && inputH) {
                 w = inputW;
                 h = inputH;
            } else if (inputW) {
                w = inputW;
                h = Math.round(w / ratio);
            } else if (inputH) {
                h = inputH;
                w = Math.round(h * ratio);
            }
        }
        return { w, h };
    }

    function processImageToBlob(img, w, h, mime, quality) {
        return new Promise(resolve => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob(blob => resolve(blob), mime, quality);
        });
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);
    }

    function showToast(msg, duration = 3000) {
        toastMessage.innerText = msg;
        toast.classList.remove('translate-y-20', 'opacity-0');
        clearTimeout(toastTimeout);
        
        if (duration > 0) {
            toastTimeout = setTimeout(() => hideToast(), duration);
        }
    }

    function hideToast() {
        toast.classList.add('translate-y-20', 'opacity-0');
    }
});