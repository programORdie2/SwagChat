const { readFileSync, writeFileSync } = require("fs");
const { v4: uuidv4 } = require("uuid");

const users = JSON.parse(readFileSync("./backend/auth/users.json"));

function generateRandomId() {
    return uuidv4();
}

function create(user) {
    const id = generateRandomId();
    user._id = id;
    if (!user.data.servers) {
        user.data.servers = ["hello people", "global chat"];
    }
    users.push(user);
    writeFileSync("./backend/auth/users.json", JSON.stringify(users));

    return user;
}

function findOne({ email, id }) {
    if (id) return users.find((user) => user._id === id);
    if (email) return users.find((user) => user.email === email);

    return { data: "No user found" };
}

module.exports = { create, findOne };