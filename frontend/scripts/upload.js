function UploadForm(element, callback) {
  const accept = allowedExtensions.join(',');

  dropbox = document.createElement('div');
  dropbox.className = 'dropbox';
  dropbox.addEventListener('click', openFileMenu, false);
  dropbox.addEventListener("dragenter", dragenter, false);
  dropbox.addEventListener("dragover", dragover, false);
  dropbox.addEventListener("dragleave", dragleave, false);
  dropbox.addEventListener("drop", drop, false);
  element.appendChild(dropbox);
  input = document.createElement('input');
  input.type = 'file';
  input.hidden = true;
  input.accept = accept;
  element.appendChild(input);

  const extra = '<div class="flex center"><span>Upload a file</span><a title="Upload" class="uploadFile hidden">Upload</a></div>';
  dropbox.innerHTML += extra;

  function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
    dropbox.classList.add('dropbox-active');
    dropbox.querySelector('span').innerHTML = 'Drop it like it\'s hot';
  }

  function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function dragleave(e) {
    e.stopPropagation();
    e.preventDefault();
    dropbox.classList.remove('dropbox-active');
    dropbox.querySelector('span').innerHTML = 'Upload a file';
  }

  function drop(e) {
    e.stopPropagation();
    e.preventDefault();

    const dt = e.dataTransfer;
    const files = dt.files;

    handleFile(files[0]);
  }

  input.addEventListener('change', function (e) {
    handleFile(e.target.files[0]);
  })

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    })
  }

  async function handleFile(file) {
    let filetype = (file.name).split('.');
    filetype = '.'+filetype[filetype.length - 1];
    if (!allowedExtensions.includes(filetype)) {
      alert("File type not allowed. Allowed extensions: " + allowedExtensions.join(', '));
      return;
    }
    const maxBgSize = 1024 * 1024 * 20;
    if (file.size > maxBgSize) {
      alert("File is too big. Max size is " + maxBgSize / 1024 / 1024 + " MB.");
      return;
    }
    dropbox.removeEventListener('click', openFileMenu);
    dropbox.classList.remove('dropbox-active');
    dropbox.classList.add('withFile')
    const fileImg = await fileToBase64(file);
    dropbox.querySelector('span').innerHTML = file.name;
    dropbox.innerHTML = '<div class="preview"><div class="desktop-wrapper"><img class="desktop" src="' + fileImg + '" alt="' + file.name + '"></div><img class="mobile" src="' + fileImg + '" alt="' + file.name + '"></div>' + dropbox.innerHTML;
    dropbox.querySelector('.uploadFile').classList.remove('hidden');
    callback(file);
  }

  function openFileMenu() {
    input.click()
  }
}