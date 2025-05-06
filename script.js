document.addEventListener('DOMContentLoaded', () => {
    loadStudentFormFromLocalStorage();
    setupFormAutoSave();
    setupImageUploadAndDisplay();
    setupImageReordering();
    setupModeToggle();
});

function loadStudentFormFromLocalStorage() {
    const formData = JSON.parse(localStorage.getItem('studentFormData'));
    if (formData) {
        Object.keys(formData).forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = formData[id];
            }
        });
    }
}

function saveStudentFormToLocalStorage() {
    const form = document.getElementById('studentForm');
    const inputs = form.querySelectorAll('input, select');
    const formData = {};
    inputs.forEach(input => {
        formData[input.id] = input.value;
    });
    localStorage.setItem('studentFormData', JSON.stringify(formData));
}

function setupFormAutoSave() {
    const form = document.getElementById('studentForm');
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', saveStudentFormToLocalStorage);
        input.addEventListener('change', saveStudentFormToLocalStorage);
    });
}

function setupImageUploadAndDisplay() {
    const imageUploader = document.getElementById('imageUploader');
    const album = document.getElementById('album');
    const uploadWrapper = document.getElementById('uploadWrapper');

    imageUploader.addEventListener('change', function (event) {
        const files = event.target.files;
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'image';
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                imgDiv.appendChild(img);

                // Insert after the upload wrapper
                album.insertBefore(imgDiv, uploadWrapper.nextSibling);

                updateLabels();
                applyGroupStyling();
            };
            reader.readAsDataURL(file);
        });
        this.value = null;
    });
}

function setupImageReordering() {
    const album = document.getElementById('album');
    const uploadWrapper = document.getElementById('uploadWrapper');

    new Sortable(album, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        filter: '#uploadLabel',
        preventOnFilter: false,
        onEnd: () => {
            updateLabels();
            applyGroupStyling();
        },
        onMove: function (evt) {
            // Prevent moving any image *before* the uploader
            const to = evt.to;
            const related = evt.related;

            // If trying to insert before uploadWrapper, block it
            if (related === uploadWrapper) {
                return false;
            }
        }
    });
}

function updateLabels() {
    const items = document.querySelectorAll('#album .image');
    items.forEach((el, i) => {
        const pageNum = Math.floor(i / 10) + 1;
        const pageIndex = i % 10;
        const pairNum = Math.floor(pageIndex / 2) + 1;
        const suffix = (i % 2 === 0) ? 'ภาพกับคุณครู' : 'ภาพกิจกรรม';
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
    const items = document.querySelectorAll('#album .image');
    items.forEach((el, i) => {
        const label = el.querySelector('.image-label');
        if (!label) return;
        const groupIndex = Math.floor(i / 10);
        label.style.color = groupIndex % 2 === 0 ? '#F0F0F0' : '#FCF259';
    });
}

function setupModeToggle() {
    const modeToggle = document.getElementById('modeToggle');
    const monthlySections = document.querySelectorAll('.mode-monthly');
    const semesterSections = document.querySelectorAll('.mode-semester');

    modeToggle.addEventListener('change', function () {
        const isSemesterMode = this.checked;
        monthlySections.forEach(el => {
            el.style.display = isSemesterMode ? 'none' : 'flex';
        });
        semesterSections.forEach(el => {
            el.style.display = isSemesterMode ? 'flex' : 'none';
        });
        localStorage.setItem('gradeMode', isSemesterMode ? 'semester' : 'monthly');
    });

    const savedMode = localStorage.getItem('gradeMode');
    if (savedMode === 'semester') {
        modeToggle.checked = true;
        modeToggle.dispatchEvent(new Event('change'));
    }
}

function generateFromAlbum() {
    const albumImages = document.querySelectorAll('#album .image img');
    if (!albumImages || albumImages.length === 0) {
        alert("No images in the album to generate a PDF.");
        return;
    }

    const files = Array.from(albumImages).map(img =>
        fetch(img.src)
            .then(response => response.blob())
            .then(blob => new File([blob], 'album_image.jpg', { type: blob.type }))
    );

    Promise.all(files)
        .then(fileObjects => {
            const chunkedFiles = chunkArray(fileObjects, 10);
            return Promise.all(chunkedFiles.map((chunk, i) => createCanvasWithImages(chunk, i)));
        })
        .then(canvases => {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('portrait', 'px', [1654, 2339]);

            canvases.forEach((canvas, i) => {
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, 1654, 2339);
            });

            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const currentTime = new Date().toISOString().replace(/[:.]/g, '').replace('T', '_').slice(0, 15);
            const fileName = `${firstName}-${lastName}-${currentTime}.pdf`;

            pdf.save(fileName);
        })
        .catch(error => {
            alert("Error generating PDF: " + error);
        });
}

// Function to chunk an array
function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}

function createCanvasWithImages(files, chunkIndex) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1654;
        canvas.height = 2339;
        const ctx = canvas.getContext('2d');

        const background = new Image();
        background.src = 'A.png';

        background.onload = () => {
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            const positions = [
                { x: 200, y: 370 }, { x: 826, y: 370 },
                { x: 200, y: 673 }, { x: 826, y: 673 },
                { x: 200, y: 976 }, { x: 826, y: 976 },
                { x: 200, y: 1280 }, { x: 826, y: 1280 },
                { x: 200, y: 1580 }, { x: 826, y: 1580 }
            ];

            Promise.all(files.map(file => loadImageFromFile(file)))
                .then(images => {
                    images.forEach((img, i) => {
                        if (img && positions[i]) {
                            const { x, y } = positions[i];
                            ctx.drawImage(img, x, y, 626, 303);
                        }
                    });
                    drawThaiText(ctx);
                    resolve(canvas);
                })
                .catch(reject);
        };
        background.onerror = reject;
    });
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function drawThaiText(ctx) {
    const prefix = document.getElementById('prefix').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const studentId = document.getElementById('studentId').value;
    const classValue = document.getElementById('class').value;
    const points = document.getElementById('points').value;
    const month = document.getElementById('months').value;
    const semeter = document.getElementById('semeter').value;
    const semeterYear = document.getElementById('semeter-year').value;
    const dateTEMP = document.getElementById('date');

    const fullName = prefix + " " + firstName;
    ctx.font = "24pt TH Sarabun";
    ctx.fillStyle = "black";

    ctx.fillText(fullName, 256, 200);
    ctx.fillText(lastName, 830, 200);
    ctx.fillText(studentId, 1270, 200);
    ctx.fillText(classValue, 1375, 200);
    ctx.fillText(points, 1390, 255);
    ctx.fillText(month, 585, 255);
    ctx.fillText(semeter, 1020, 255);
    ctx.fillText(semeterYear, 1080, 255);

    if (month !== "") {
        ctx.fillText('\u2713', 420, 255);
    }

    if (semeter !== "") {
        ctx.fillText('\u2713', 770, 255);
    }

    let submissionDateText = "";
    if (dateTEMP.value) {
        submissionDateText = dateTEMP.value;
    } else {
        const date = new Date();
        const thaiMonths = [
            "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
            "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
            "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
        ];
        const day = date.getDate();
        const monthThai = thaiMonths[date.getMonth()];
        const yearBE = date.getFullYear() + 543;
        const yearShortBE = yearBE.toString();
        submissionDateText = `${day} ${monthThai} ${yearShortBE}`;
    }
    ctx.fillText(submissionDateText, 750, 2070);

    const fullNameWithSpaces = fullName + "    " + lastName;
    const boxX = 580;
    const boxY = 1995;
    const boxWidth = 1075 - 580;
    const boxHeight = 2025 - 1995;
    const textWidth = ctx.measureText(fullNameWithSpaces).width;
    const xPos = boxX + (boxWidth - textWidth) / 2;
    const yPos = boxY + (boxHeight / 2) + 8;
    ctx.fillText(fullNameWithSpaces, xPos, yPos);
}

function downloadAsPDF() {
    const contentsElement = document.getElementById('contents');
    const canvasContainers = contentsElement.querySelectorAll('[id^="canvas-container-"]');

    if (canvasContainers.length === 0) {
        alert("No documents to download.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('portrait', 'px', [1654, 2339]);

    const addPagesPromises = []; // Array to hold promises for adding pages

    canvasContainers.forEach((container, i) => {
        const canvas = container.querySelector('canvas');
        if (canvas) {
            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            // Use a promise to handle addPage and addImage asynchronously
            const addPagePromise = new Promise((resolve) => {
                if (i > 0) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'JPEG', 0, 0, 1654, 2339);
                resolve(); // Resolve the promise when the image is added
            });

            addPagesPromises.push(addPagePromise); // Add promise to the array
        }
    });

    // *After* all pages and images are added, save the PDF
    Promise.all(addPagesPromises).then(() => {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const currentTime = new Date().toISOString().replace(/[:.]/g, '').replace('T', '_').slice(0, 15);
        const fileName = `${firstName}-${lastName}-${currentTime}.pdf`;

        pdf.save(fileName, { returnPromise: true })
            .then(() => {
                // console.log('PDF downloaded successfully!');
            })
            .catch(error => {
                console.error('Error downloading PDF:', error);
            });
    });
}
