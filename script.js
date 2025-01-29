/* 
  script.js
  ------------
  1) Drag & drop logic
  2) Basic validation (README file must be .txt or .md)
  3) On submit: POST files + data to Raspberry Pi
*/

/* Globals to store user-selected files */
let readmeFile = null;
let mainFiles = [];

/* === Utility Functions === */
function isReadmeFileValid(file) {
  const allowedExtensions = ['.txt', '.md'];
  const fileName = file.name.toLowerCase();
  return allowedExtensions.some(ext => fileName.endsWith(ext));
}

function updateReadmeFeedback() {
  const feedbackEl = document.getElementById('readmeFeedback');
  if (readmeFile) {
    feedbackEl.textContent = `Selected: ${readmeFile.name}`;
    feedbackEl.classList.remove('text-danger');
  } else {
    feedbackEl.textContent = 'No file selected';
    feedbackEl.classList.remove('text-danger');
  }
}

function updateMainFilesFeedback() {
  const feedbackEl = document.getElementById('mainFilesFeedback');
  if (mainFiles.length > 0) {
    const fileNames = mainFiles.map(f => f.name).join(', ');
    feedbackEl.textContent = `Selected (${mainFiles.length}): ${fileNames}`;
    feedbackEl.classList.remove('text-danger');
  } else {
    feedbackEl.textContent = 'No files selected';
    feedbackEl.classList.remove('text-danger');
  }
}
function setupDropzone(dropzoneId, fileInputId, onDropCallback) {
  const dropzone = document.getElementById(dropzoneId);
  const fileInput = document.getElementById(fileInputId);
  // Click on dropzone => open file dialog
  dropzone.addEventListener('click', () => fileInput.click());
  // Input change (user selected files via dialog)
  fileInput.addEventListener('change', (e) => {
    onDropCallback(e.target.files);
    // Clear the file input so user can re-select same file if needed
    fileInput.value = '';
  });
  // Drag/Drop events
  dropzone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    onDropCallback(e.dataTransfer.files);
  });
}
// Specific handling for README
function handleReadmeDrop(files) {
  const file = files[0];
  if (file && isReadmeFileValid(file)) {
    readmeFile = file;
  } else {
    readmeFile = null;
    const feedbackEl = document.getElementById('readmeFeedback');
    feedbackEl.textContent = 'Invalid file type. Please select .txt or .md only.';
    feedbackEl.classList.add('text-danger');
  }
  updateReadmeFeedback();
}
function handleMainFilesDrop(files) {
  mainFiles = [...mainFiles, ...files];
  updateMainFilesFeedback();
}
document.addEventListener('DOMContentLoaded', () => {
  setupDropzone('readmeDropzone', 'readmeInput', handleReadmeDrop);
  setupDropzone('mainFilesDropzone', 'mainFilesInput', handleMainFilesDrop);
  // Initialize feedback text
  updateReadmeFeedback();
  updateMainFilesFeedback();
  // Submit event: Send data to Pi
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.addEventListener('click', async () => {
    const repoName = document.getElementById('repoName').value.trim();
    const scheduleValue = document.getElementById('scheduleUpload').value;
    // Basic checks
    if (!repoName) {
      alert('Please enter a repository name!');
      return;
    }
    if (!readmeFile) {
      alert('Please select a valid README file (.txt or .md)!');
      return;
    }
    if (!scheduleValue) {
      alert('Please select a schedule date/time!');
      return;
    }
    // Build FormData
    const formData = new FormData();
    formData.append('repoName', repoName);
    formData.append('scheduleTime', scheduleValue);
    formData.append('readmeFile', readmeFile);
    mainFiles.forEach((file) => formData.append('mainFiles[]', file));
    const piEndpoint = 'http://192.168.1.123:8080/upload';    // Replace with Pi's actual IP/port
    try {
      const response = await fetch(piEndpoint, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      const result = await response.json();
      alert('Submission successful! ' + JSON.stringify(result));
    } catch (err) {
      console.error(err);
      alert('Failed to upload: ' + err.message);
    }
  });
});
