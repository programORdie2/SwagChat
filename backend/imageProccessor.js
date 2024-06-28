const fs = require('fs');
const sharp = require('sharp');
const sizeOf = require('image-size');

const { AVATAR_SIZE_PX, BG_SIZE_PX } = require('./constants.js');

/**
 * Handles the processing and storage of a user's avatar image.
 *
 * @param {string} base64 - The base64-encoded avatar image data.
 * @param {string} userid - The unique identifier of the user.
 * @return {void} This function does not return anything.
 */
function handleAvatar(base64, userid) {
    const ext = 'png';
    const path = `./backend/uploads/icons/${userid}_processing.${ext}`;
    const data = base64.replace(/^data:image\/\w+;base64,/, '');

    if (data.length > 10000000) {
        console.warn('Avatar size exceeds 1MB');
        return;
    }

    fs.writeFile(path, data, 'base64', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }

        sharp(path).resize({ width: AVATAR_SIZE_PX, height: AVATAR_SIZE_PX }).png().toFile(`./backend/uploads/icons/${userid}.png`, (err) => {
            if (err) {
                console.error('Error resizing file:', err);
                return;
            }

            fs.unlink(path, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                    return;
                }
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

        const dimensions = sizeOf(`./backend${location_processing}`);

        let width = BG_SIZE_PX;
        let height = BG_SIZE_PX;

        const ratio = dimensions.width / dimensions.height;

        if (dimensions.width > dimensions.height) {
            width = BG_SIZE_PX;
            height = BG_SIZE_PX / ratio;
        } else {
            width = BG_SIZE_PX / ratio;
            height = BG_SIZE_PX;
        }

        width = Math.round(width);
        height = Math.round(height);

        sharp(`./backend${location_processing}`).resize({ width: width, height: height }).png().toFile(`./backend/${location}`, (err) => {
            if (err) {
                console.error('Error resizing file:', err);
                return;
            }

            callback(location);

            fs.unlink(`./backend${location_processing}`, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                    return;
                }
            });
        });
    });
}

module.exports = {
    handleAvatar,
    uploadBg
}