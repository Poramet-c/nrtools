function saveStudentFormToLocalStorage() {
    const form = document.getElementById('studentForm');
    const inputs = form.querySelectorAll('input, select');

    const formData = {};

    inputs.forEach(input => {
        formData[input.id] = input.value;
    });

    localStorage.setItem('studentFormData', JSON.stringify(formData));
}

function loadStudentFormFromLocalStorage() {
    const formData = JSON.parse(localStorage.getItem('studentFormData'));
    if (!formData) return;

    Object.keys(formData).forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.value = formData[id];
        }
    });
}

window.addEventListener('DOMContentLoaded', loadStudentFormFromLocalStorage);

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

        const groupIndex = Math.floor(i / 10) ; 


        label.style.color = groupIndex % 2 === 0 ? '#F0F0F0' : '#FCF259';

        // el.style.marginTop = (i % 10 === 0 && i !== 0) ? '24px' : '0';
    });
}


document.getElementById('imageUploader').addEventListener('change', function(event) {
    const files = event.target.files;
    const album = document.getElementById('album');

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'image';

            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = file.name;

            imgDiv.appendChild(img);
            album.appendChild(imgDiv);
            
            updateLabels();
            applyGroupStyling();
        };
        reader.readAsDataURL(file);      
    });
});
