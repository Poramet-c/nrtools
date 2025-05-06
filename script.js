// Optimized Script for Performance and Maintainability

// Wait until the document is ready
document.addEventListener('DOMContentLoaded', () => {
    loadStudentFormFromLocalStorage();
    setupFormAutoSave();
    setupImageUploadAndDisplay();
    setupImageReordering();
    setupModeToggle();
});

// Load saved form values
function loadStudentFormFromLocalStorage() {
    const formData = JSON.parse(localStorage.getItem('studentFormData'));
    if (!formData) return;

    Object.entries(formData).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) input.value = value;
    });
}

// Save form values
function saveStudentFormToLocalStorage() {
    const form = document.getElementById('studentForm');
    const formData = {};
    form.querySelectorAll('input, select').forEach(input => {
        formData[input.id] = input.value;
    });
    localStorage.setItem('studentFormData', JSON.stringify(formData));
}

// Auto-save on input change
function setupFormAutoSave() {
    document.querySelectorAll('#studentForm input, #studentForm select').forEach(input => {
        input.addEventListener('input', saveStudentFormToLocalStorage);
        input.addEventListener('change', saveStudentFormToLocalStorage);
    });
}

// Handle image uploads
function setupImageUploadAndDisplay() {
    const imageUploader = document.getElementById('imageUploader');
    const album = document.getElementById('album');
    const uploadWrapper = document.getElementById('uploadWrapper');

    imageUploader.addEventListener('change', ({ target }) => {
        const files = Array.from(target.files).filter(file => file.type.startsWith('image/'));

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = ({ target: { result } }) => {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'image';
                imgDiv.innerHTML = `<img src="${result}" alt="${file.name}">`;
                album.insertBefore(imgDiv, uploadWrapper.nextSibling);
            };
            reader.readAsDataURL(file);
        });

        target.value = null;
        setTimeout(() => {
            updateLabels();
            applyGroupStyling();
        }, 100);
    });
}

// Initialize SortableJS
function setupImageReordering() {
    new Sortable(document.getElementById('album'), {
        animation: 150,
        ghostClass: 'sortable-ghost',
        filter: '#uploadLabel',
        preventOnFilter: false,
        onEnd: () => {
            updateLabels();
            applyGroupStyling();
        }
    });
}

function updateLabels() {
    document.querySelectorAll('#album .image').forEach((el, i) => {
        const pageNum = Math.floor(i / 10) + 1;
        const pairNum = Math.floor((i % 10) / 2) + 1;
        const suffix = i % 2 === 0 ? 'ภาพกับคุณครู' : 'ภาพกิจกรรม';

        let label = el.querySelector('.image-label');
        if (!label) {
            label = document.createElement('div');
            label.className = 'image-label';
            el.appendChild(label);
        }

        label.innerHTML = `แถว ${pairNum}<br>${suffix}${pageNum > 1 ? `<br>หน้า ${pageNum}` : ''}`;
    });
}

function applyGroupStyling() {
    document.querySelectorAll('#album .image').forEach((el, i) => {
        const label = el.querySelector('.image-label');
        if (!label) return;
        label.style.color = Math.floor(i / 10) % 2 === 0 ? '#F0F0F0' : '#FCF259';
    });
}

function setupModeToggle() {
    const modeToggle = document.getElementById('modeToggle');
    const monthly = document.querySelectorAll('.mode-monthly');
    const semester = document.querySelectorAll('.mode-semester');

    modeToggle.addEventListener('change', ({ target }) => {
        const isSemester = target.checked;
        monthly.forEach(el => el.style.display = isSemester ? 'none' : 'flex');
        semester.forEach(el => el.style.display = isSemester ? 'flex' : 'none');
        localStorage.setItem('gradeMode', isSemester ? 'semester' : 'monthly');
    });

    if (localStorage.getItem('gradeMode') === 'semester') {
        modeToggle.checked = true;
        modeToggle.dispatchEvent(new Event('change'));
    }
}

function generateFromAlbum() {
    const albumImages = document.querySelectorAll('#album .image img');
    if (albumImages.length === 0) return alert("No images in the album to generate a PDF.");

    Promise.all(
        Array.from(albumImages).map(img => fetch(img.src)
            .then(res => res.blob())
            .then(blob => new File([blob], 'img.jpg', { type: blob.type }))
        )
    ).then(files => {
        return Promise.all(chunkArray(files, 10).map((chunk, i) => createCanvasWithImages(chunk, i)));
    }).then(canvases => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('portrait', 'px', [1654, 2339]);

        canvases.forEach((canvas, i) => {
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, 1654, 2339);
        });

        const name = `${getValue('firstName')}-${getValue('lastName')}-${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}`;
        pdf.save(`${name}.pdf`);
    }).catch(err => alert("Error generating PDF: " + err));
}

function chunkArray(arr, size) {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
}

function createCanvasWithImages(files) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1654;
        canvas.height = 2339;
        const ctx = canvas.getContext('2d');

        const background = new Image();
        background.src = 'A.png';
        background.onload = () => {
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            const positions = [...Array(10)].map((_, i) => ({
                x: 200 + (i % 2) * 626,
                y: 370 + Math.floor(i / 2) * 303
            }));

            Promise.all(files.map(loadImageFromFile)).then(images => {
                images.forEach((img, i) => {
                    if (img && positions[i]) {
                        const { x, y } = positions[i];
                        ctx.drawImage(img, x, y, 626, 303);
                    }
                });
                drawThaiText(ctx);
                resolve(canvas);
            }).catch(reject);
        };
        background.onerror = reject;
    });
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ({ target }) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function drawThaiText(ctx) {
    ctx.font = "24pt TH Sarabun";
    ctx.fillStyle = "black";

    const fullName = `${getValue('prefix')} ${getValue('firstName')}`;
    const lastName = getValue('lastName');

    ctx.fillText(fullName, 256, 200);
    ctx.fillText(lastName, 830, 200);
    ctx.fillText(getValue('studentId'), 1270, 200);
    ctx.fillText(getValue('class'), 1375, 200);
    ctx.fillText(getValue('points'), 1390, 255);
    ctx.fillText(getValue('months'), 585, 255);
    ctx.fillText(getValue('semeter'), 1020, 255);
    ctx.fillText(getValue('semeter-year'), 1080, 255);

    if (getValue('months')) ctx.fillText('\u2713', 420, 255);
    if (getValue('semeter')) ctx.fillText('\u2713', 770, 255);

    const dateValue = getValue('date');
    const date = dateValue || formatThaiDate(new Date());
    ctx.fillText(date, 750, 2070);

    const signedName = `${fullName}    ${lastName}`;
    const boxX = 580, boxY = 1995, width = 495, height = 30;
    const textWidth = ctx.measureText(signedName).width;
    const x = boxX + (width - textWidth) / 2;
    const y = boxY + height / 2 + 8;
    ctx.fillText(signedName, x, y);
}

function getValue(id) {
    return document.getElementById(id)?.value || "";
}

function formatThaiDate(date) {
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function downloadAsPDF() {
    const contents = document.getElementById('contents');
    const canvases = contents.querySelectorAll('[id^="canvas-container-"] canvas');
    if (!canvases.length) return alert("No documents to download.");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('portrait', 'px', [1654, 2339]);

    canvases.forEach((canvas, i) => {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 1654, 2339);
    });

    const name = `${getValue('firstName')}-${getValue('lastName')}-${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}`;
    pdf.save(`${name}.pdf`);
}