const { openDatabase } = require('./database.js');
const { v4: uuidv4 } = require('uuid');

const { invite_url, invite_path } = require('./constants.js');

const inviteDatabase = openDatabase('invites', 'object');

function createKey() {
    return uuidv4().replace('-', '').slice(0, 10);
}

function getInvite(key) {
    const invite = inviteDatabase.get(key);
    if (!invite) return null;
    if (Date.now() > invite.expires) {
        deleteInvite(key);
        return null;
    }
    return invite;
}

function createInvite(room, byUser) {
    const key = createKey();
    const invite = {
        key,
        room,
        createdBy: byUser,
        created: Date.now(),
        expires: Date.now() + 1000 * 60 * 60 * 24 * 30, // one month
    };
    inviteDatabase.set(key, invite);
    return invite_url + key;
}

function deleteInvite(key) {
    inviteDatabase.deleteItem(key);
}

function getInviteFromUrlPath(path) {
    const key = path.split('/').pop();
    if (key[0] === invite_path && key[1]) {
        return getInvite(key[1]);
    }
    return null;
}

function FINAL_SAVE() {
    inviteDatabase.save();
}

const inviteManager = {
    getInvite,
    createInvite,
    deleteInvite,
    getInviteFromUrlPath
}

module.exports = {
    inviteManager,
    FINAL_SAVE_INVITES: FINAL_SAVE
}