const BASE_URL = "http://localhost:5000";

// Image resizing constants
const BG_SIZE_PX = 1600;
const AVATAR_SIZE_PX = 256;

// WS timeout constants
const requests_timout = {
    join: 0,
    send: 0.5,
    bgUpload: 60,
    userDatas: 0.5,
    createRoom: 5,
    createInvite: 5
}
const timeout_info = {
    join: "Whoa, not so fast! Please wait a bit before joining",
    send: "Whoa, not so fast! Please wait a bit before sending another message",
    bgUpload: "Whoa, not so fast! Please wait a bit before uploading a new background"
}

// RoomManager
const CACHE_MESSAGES = 20;

// InviteManager
const invite_path = "invite";
const invite_url = `${BASE_URL}/${invite_path}/`;

// Exports
module.exports = {
    BG_SIZE_PX,
    AVATAR_SIZE_PX,
    requests_timout,
    timeout_info,
    CACHE_MESSAGES,
    invite_url,
    invite_path
}