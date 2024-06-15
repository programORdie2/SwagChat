const avaterSize = 400;

function createResizeForm(imgUrl) {
    const outer = document.getElementById('avatar');
    const wrapper = document.createElement('div');
    wrapper.className = 'avatarUpload';

    const img = document.createElement('img');
    img.className = 'avatar';
    img.src = imgUrl;
    wrapper.appendChild(img);

    const overlay = document.createElement('div');
    wrapper.appendChild(overlay);
    overlay.className = 'overlay';

    outer.appendChild(wrapper);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 100;
    slider.value = 0;
    slider.className = 'slider';
    outer.appendChild(slider);

    let scale = 1;

    function updateSize() {
        scale = slider.value / 100 + 1;
        update();
    }

    function update() {
        img.style.transform = `scale(${scale})`;
    }

    slider.addEventListener('input', updateSize);
    update();

    function applySizeAndConvertToBase64() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = avaterSize;
        canvas.height = avaterSize;
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
         const dataUrl = canvas.toDataURL('image/png');
        return dataUrl;
    }

    return applySizeAndConvertToBase64;
}

function createAvatarUploadForm() {
    const outer = document.getElementById('avatar');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    outer.appendChild(fileInput);
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length === 0 || !e.target.files[0].type.startsWith('image/')) {
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = () => {
            outer.innerHTML = '<h2>Resize your avatar:</h2>';

            const base64 = reader.result;
            const applySizeAndConvertToBase64 = createResizeForm(base64);
            
            const button = document.createElement('button');
            button.textContent = 'Upload avatar';
            outer.appendChild(button);

            button.addEventListener('click', () => {
                const base64 = applySizeAndConvertToBase64();
                outer.innerHTML = '<h2>Avatar:</h2>';
                const img = document.createElement('img');
                img.src = base64;
                img.className = 'avatarFinal';
                outer.appendChild(img);
            });
        }
    });
}

createAvatarUploadForm();