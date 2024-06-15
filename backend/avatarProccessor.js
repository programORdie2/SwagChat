const fs = require('fs');

function handleAvatar(base64, userid) {
    const ext = base64.split(';')[0].split('/')[1];
    const path = `./backend/uploads/icons/${userid}.${ext}`;
    const data = base64.replace(/^data:image\/\w+;base64,/, '');

    fs.writeFile(path, data, 'base64', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log('File saved:', path);
    });
}

module.exports = {
    handleAvatar
}