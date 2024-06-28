const { v4: uuidv4 } = require("uuid");
const { openDatabase } = require("../database.js");

const usersDatabase = openDatabase("users", "object");

function generateRandomId() {
    return uuidv4();
}

function generateRandomPublicId() {
    return uuidv4().replace(/-/g, "");
}

function create(user) {
    const id = generateRandomId();
    const publicId = generateRandomPublicId();
    user._id = id;
    user.publicId = publicId;
    if (!user.data.servers) {
        // ! Change
        user.data.servers = ["12fc16da82c144ec8ae9ac9067ebf635", "b90e2c4f6b354eacaede7e9313bfcbe4"];
    }
    if (!user.data.icon) {
        user.data.icon = publicId + ".png";
    }
    usersDatabase.set(publicId, user);

    return user;
}

function findOne({ email, name, id, _id }) {
    let value = usersDatabase.get(id);

    // ! TODO: Speed up with email and username linking
    if (!value) {
        const data = usersDatabase.getAll()
        const values = Object.values(data);
        
        value = values.find((value) => value.data.email === email || value.data.name === name || value._id === _id);
    }
    return value;
}

function addRoomToUser(userId, roomId) {
    const data = usersDatabase.getChild(userId, "data");
    if (!data) return;
    data.servers.push(roomId);
    usersDatabase.setChild(userId, "data", data);
}

function FINAL_SAVE() {
    usersDatabase.save();
}

module.exports = { create, findOne, FINAL_SAVE_USERS: FINAL_SAVE, addRoomToUser };