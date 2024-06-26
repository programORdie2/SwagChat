const { v4: uuidv4 } = require("uuid");
const { openDatabase } = require("./database.js");

const { addRoomToUser } = require("./auth/userModel.js");

const { CACHE_MESSAGES } = require("./constants.js");

const roomsDatabase = openDatabase("rooms", "object");

function generateRandomId() {
    return uuidv4();
}

function generateRandomPublicId() {
    return uuidv4().replace(/-/g, "");
}

function createRoom({name, ownerId}) {
    const id = generateRandomId();
    const publicId = generateRandomPublicId();
    const room = {
        _id: id,
        publicId,
        name: name || "New Room",
        userIds: [],
        admins: [ownerId],
        messages: [],
        online: [],
        chatBg: null
    };
    roomsDatabase.set(publicId, room);

    addUserToRoom(publicId, ownerId);

    return room;
}

function addUserToRoom(roomId, userId) {
    roomsDatabase.pushChild(roomId, "userIds", userId);
    addRoomToUser(userId, roomId);
}

function addMessage({roomId, user, message}) {
    roomsDatabase.pushChild(roomId,"messages", {
        user: user.username,
        icon: user.icon,
        message
    }, maxLength = CACHE_MESSAGES);
}

function getRoom(publicId) {
    return roomsDatabase.get(publicId);
}

function deleteRoom(publicId) {
    roomsDatabase.deleteItem(publicId);
}

function removeUserFromOnlineList(roomId, userId) {
    roomsDatabase.deleteItemChild(roomId, "online", userId);
}

function addOnlineUser(roomId, user) {
    roomsDatabase.pushChild(roomId, "online", user);
}

function getMessages(roomId) {
    return roomsDatabase.get(roomId).messages;
}

function getOnlineList(roomId) {
    return roomsDatabase.get(roomId).online;
}

function getChatBg(roomId) {
    return roomsDatabase.get(roomId).chatBg;
}

function setChatBg(roomId, chatBg) {
    roomsDatabase.get(roomId).chatBg = chatBg;
}

function getBasicRoomInfo(roomId) {
    const data = roomsDatabase.get(roomId);
    return {
        name: data.name,
        id: data.publicId,
    };
}

function getBasicRoomInfos(rooms) {
    return rooms.map(getBasicRoomInfo);
}

function checkUserIsInRoom(roomId, userId) {
    return roomsDatabase.getChild(roomId, "userIds").includes(userId);
}

function FINAL_SAVE() {
    roomsDatabase.setAllChild("online", []);
    roomsDatabase.save();
}

const roomManager = {
    createRoom,
    getRoom,
    deleteRoom,
    addMessage,
    removeUserFromOnlineList,
    addOnlineUser,
    getMessages,
    getOnlineList,
    getChatBg,
    setChatBg,
    getBasicRoomInfos,
    checkUserIsInRoom,
    addUserToRoom,
}

module.exports = { roomManager, FINAL_SAVE_ROOMS: FINAL_SAVE };