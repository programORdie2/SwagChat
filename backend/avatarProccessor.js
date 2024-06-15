const fs = require('fs');
const sharp = require('sharp');

function handleAvatar(base64, userid) {
    const ext = base64.split(';')[0].split('/')[1];
    // const ext = 'png';
    const path = `./backend/uploads/icons/${userid}_processing.${ext}`;
    const data = base64.replace(/^data:image\/\w+;base64,/, '');

    if (data.length > 10000000) {
        console.log('Avatar size exceeds 1MB');
        return;
    }

    fs.writeFile(path, data, 'base64', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log('File saved:', path);

        sharp(path).resize({ width: 256, height: 256 }).png().toFile(`./backend/uploads/icons/${userid}.png`, (err) => {
            if (err) {
                console.error('Error resizing file:', err);
                return;
            }
            console.log('File resized:', `./backend/uploads/icons/${userid}.png`);

            fs.unlink(path, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                    return;
                }
                console.log('File deleted:', path);
            });
        });
    });
}

module.exports = {
    handleAvatar
}