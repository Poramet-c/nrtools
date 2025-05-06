new Sortable(document.getElementById('album'), {
    animation: 150,
    ghostClass: 'sortable-ghost',
});


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
        };
        reader.readAsDataURL(file);
    });
});
