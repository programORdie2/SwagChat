function makeMessage(html, outsideClick=true, extraClass=null) {
    const message = document.createElement("div");
    message.className = "_popup notReady";
    message.innerHTML = '<div>' + html + '</div>';
    message.addEventListener('click', (e) => {
        if (e.target === message && outsideClick) {
            closePopup(message);
        }
    });
    if (extraClass) message.classList.add(extraClass);
    document.body.appendChild(message);
    setTimeout(() => {
        message.classList.remove("notReady");
    }, 0)
}

function closePopup(popup) {
    popup.classList.add('notReady');
    setTimeout(() => {
        popup.remove();
    }, 200);
}

function showError(title, message) {
    console.error(title, message);
    // alert(title + ": " + message);
    makeMessage('<h1>' + title + '</h1><p>' + message + '</p><a title="Close" class="closeMessage">Close</a>', true, 'errorMessage');
    
    const closes = document.querySelectorAll('.closeMessage');
    const close = closes[closes.length - 1];
    close.addEventListener('click', () => {
        closePopup(close.parentElement.parentElement);
    });
}

function showMessage(title, text, html, closeText = 'Close', withFile = false, outsideClick=true, callback=null) {
    let extraButton = '';
    let currentFile = null;
    if (withFile !== false) {
        extraButton = '';
    }
    let htmlData = '<h1>' + title + '</h1><p>' + text + '</p>' + html + '<div class="filesHere"></div><div class="flex"><a title="' + closeText + '" class="closeMessage">' + closeText + '</a>' + extraButton + '</div>';
    makeMessage(htmlData, outsideClick);
    const closes = document.querySelectorAll('.closeMessage');
    const close = closes[closes.length - 1];
    close.addEventListener('click', () => {
        if (callback !== null) {
            callback();
        }
        closePopup(close.parentElement.parentElement.parentElement);
    });
    if (withFile !== false) {
        const elems = document.querySelectorAll('.filesHere');
        const elem = elems[elems.length - 1];
        UploadForm(elem, function (file) {
            currentFile = file;
            const uploads = document.querySelectorAll('.uploadFile');
            const upload = uploads[uploads.length - 1];
            upload.addEventListener('click', () => {
                upload.innerHTML = '<div class="flex"><span class="spinner"></span>Uploading...</div>';
                withFile(currentFile);
                closePopup(close.parentElement.parentElement.parentElement);
            });
        });
    }
}

async function askInput(title, text) {
    return new Promise((resolve, reject) => {
        const input = prompt(title, text);
        resolve(input);
    });
}