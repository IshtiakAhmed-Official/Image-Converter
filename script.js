const helpButton = document.getElementById('helpButton');
const instructionsNote = document.getElementById('instructionsNote');
const pasteBox = document.getElementById('pasteBox');

helpButton.addEventListener('click', () => {
  instructionsNote.classList.toggle('show');
});

function saveImageBlob(blob) {
  const format = document.querySelector('input[name="format"]:checked').value;
  const img = new Image();
  const url = URL.createObjectURL(blob);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    let mimeType = 'image/png';
    if (format === 'jpeg') mimeType = 'image/jpeg';
    else if (format === 'webp') mimeType = 'image/webp';
    canvas.toBlob((newBlob) => {
      if (!newBlob) {
        alert('Could not process the image.');
        return;
      }
      const downloadLink = document.createElement('a');
      const filename = `pasted-image.${format === 'jpeg' ? 'jpg' : format}`;
      downloadLink.download = filename;
      downloadLink.href = URL.createObjectURL(newBlob);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      URL.revokeObjectURL(downloadLink.href);
      document.body.removeChild(downloadLink);
    }, mimeType, 0.92);
  };
  img.onerror = () => {
    alert('Failed to load image from clipboard, selection, or drop.');
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

window.addEventListener('paste', async (event) => {
  if (!event.clipboardData) return;
  const items = event.clipboardData.items;
  let imageFile = null;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image')) {
      imageFile = items[i].getAsFile();
      break;
    }
  }
  if (!imageFile) {
    alert('No image found in clipboard.');
    return;
  }
  event.preventDefault();
  saveImageBlob(imageFile);
});

document.getElementById('pasteButton').addEventListener('click', async () => {
  try {
    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
      const imageType = clipboardItem.types.find(type => type.startsWith('image/'));
      if (imageType) {
        const blob = await clipboardItem.getType(imageType);
        saveImageBlob(blob);
        return;
      }
    }
    alert('No image found on clipboard.');
  } catch (error) {
    alert('Failed to read clipboard. Please try pressing Ctrl+V or Cmd+V to paste.');
    console.error('Clipboard read error:', error);
  }
});

const selectImageButton = document.getElementById('selectImageButton');
const selectImageInput = document.getElementById('selectImageInput');

selectImageButton.addEventListener('click', () => {
  selectImageInput.click();
});

selectImageInput.addEventListener('change', () => {
  if (selectImageInput.files.length === 0) return;
  const imageFile = selectImageInput.files[0];
  if (!imageFile.type.startsWith('image')) {
    alert('Please select a valid image file.');
    selectImageInput.value = '';
    return;
  }
  saveImageBlob(imageFile);
  selectImageInput.value = '';
});

let dragCounter = 0; // To ensure highlight stays when dragging inside pasteBox
pasteBox.addEventListener('dragenter', (event) => {
  event.preventDefault();
  dragCounter++;
  pasteBox.classList.add('highlight');
});
pasteBox.addEventListener('dragleave', (event) => {
  event.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    pasteBox.classList.remove('highlight');
  }
});
pasteBox.addEventListener('dragover', (event) => {
  event.preventDefault();
});
pasteBox.addEventListener('drop', (event) => {
  event.preventDefault();
  dragCounter = 0;
  pasteBox.classList.remove('highlight');
  const files = event.dataTransfer.files;
  if (files.length === 0) {
    alert('No file found in drop.');
    return;
  }
  const imageFile = Array.from(files).find(file => file.type.startsWith('image'));
  if (!imageFile) {
    alert('No image file found in drop.');
    return;
  }
  saveImageBlob(imageFile);
});

window.onload = () => {
  pasteBox.focus();
};
