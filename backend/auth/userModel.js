const { v4: uuidv4 } = require("uuid");
const { openDatabase } = require("../database.js");

const usersDatabase = openDatabase("users", "array");

function generateRandomId() {
    return uuidv4();
}

function create(user) {
    const id = generateRandomId();
    user._id = id;
    if (!user.data.servers) {
        user.data.servers = ["hello people", "global chat"];
    }
    if (!user.data.icon) {
        user.data.icon = id + ".png";
    }
    usersDatabase.push(user);

    return user;
}

function findOne({ email, name, id }) {
    return usersDatabase.findOne({ email, name, id });
}

function FINAL_SAVE() {
    usersDatabase.save();
}

module.exports = { create, findOne, FINAL_SAVE };