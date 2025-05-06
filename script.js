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

        const groupIndex = Math.floor(i / 10) + 1; // Group of 10
        if (groupIndex % 2 === 0) {
            label.style.color = '#FCF259;'; 
        } else {
            label.style.color = '#F0F0F0'; 
        }
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
