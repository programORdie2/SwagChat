const fs = require('fs');
const sharp = require('sharp');
const sizeOf = require('image-size');

/**
 * Handles the processing and storage of a user's avatar image.
 *
 * @param {string} base64 - The base64-encoded avatar image data.
 * @param {string} userid - The unique identifier of the user.
 * @return {void} This function does not return anything.
 */
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

/**
 * Uploads a background image to the server and resizes it to a specific size.
 *
 * @param {string} dataUrl - The base64-encoded data URL of the image.
 * @param {string} room - The room identifier.
 * @return {void} This function does not return anything.
 */
function uploadBg(dataUrl, room, callback) {
    const filetype = 'png';
    const data = dataUrl.replace(/^data:image\/\w+;base64,/, '');

    const location_processing = `/uploads/wallpaper/${room}_processing.${filetype}`;
    const location = `/uploads/wallpaper/${room}.${filetype}`;

    fs.writeFile(`./backend${location_processing}`, data, 'base64', (err) => {
        if (err) {
            console.error('Error uploading file:', err);
            return;
        }
        console.log('File uploaded:', location_processing);

        const dimensions = sizeOf(`./backend${location_processing}`);
        console.log('Dimensions:', dimensions.width, dimensions.height);

        let width = 1024;
        let height = 1024;

        const ratio = dimensions.width / dimensions.height;

        if (dimensions.width > dimensions.height) {
            width = 1024;
            height = 1024 / ratio;
        } else {
            width = 1024 / ratio;
            height = 1024;
        }

        width = Math.round(width);
        height = Math.round(height);

        console.log('New dimensions:', width, height);

        sharp(`./backend${location_processing}`).resize({ width: width, height: height }).png().toFile(`./backend/${location}`, (err) => {
            if (err) {
                console.error('Error resizing file:', err);
                return;
            }
            console.log('File resized:', `./backend/uploads/wallpaper/${room}.${filetype}`);

            callback(location);

            fs.unlink(`./backend${location_processing}`, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                    return;
                }
                console.log('File deleted:', location_processing);
            });
        });
    });
}

module.exports = {
    handleAvatar,
    uploadBg
}