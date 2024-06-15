require("dotenv").config();

const { writeFile, existsSync, mkdirSync } = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const { exec } = require('child_process');
const readline = require('node:readline');

const asyncHandler = require("express-async-handler");

const Auth = require('./auth/index.js');

// Create a new Express server
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

__dirname = join(__dirname, '../frontend');

const server = createServer(app);

// Create a new WebSocket server, listening on port 5000 of localhost, and with the path '/ws'
const wss = new Server(server, {
    path: '/ws', cors: {
        origin: "*"
    }
});

function createFolder(path) {
    if (!existsSync(path)) {
        console.log('Creating folder:', path);
        mkdirSync(path);
    }
}

createFolder('./backend/uploads');
createFolder('./backend/uploads/wallpaper');
createFolder('./backend/uploads/icons');

// API Routes
app.post('/login', asyncHandler(async (req, res) => {
    console.log('POST /login');
    const { email, password } = req.body;
    const user = await Auth.loginUser(email, password);
    if (user.success) {
        res.cookie('token', user.token);
    }
    res.json(user);
}));

app.post('/register', asyncHandler(async (req, res) => {
    console.log('POST /register');
    const { email, password, data } = req.body;
    const user = await Auth.registerUser(email, password, data);
    if (user.success) {
        res.cookie('token', user.token);
    }
    res.json(user);
}));

app.post('/validate', asyncHandler(async (req, res) => {
    console.log('POST /validate');
    const { token } = req.body;
    const user = Auth.validateToken(token);
    if (!user.success) {
        res.clearCookie('token');
    }
    res.json(user);
}));

// Client Routes
app.get('/', asyncHandler(async (req, res) => {
    console.log('GET /');

    const { token } = req.cookies;

    if (!token) {
        res.sendFile(join(__dirname, '/notAuthorized.html'));
        return;
    }

    const user = Auth.validateToken(token);
    console.log('User:', user);

    if (!user || !user.success) {
        console.log('Clearing cookie');
        res.clearCookie('token');

        res.sendFile(join(__dirname, '/notAuthorized.html'));
        return;
    }

    res.sendFile(join(__dirname, '/index.html'));
}));

app.get('/uploads/*', (req, res) => {
    if (req.path.indexOf('..') > -1) { res.status(403).end(); return; }
    let filename = decodeURIComponent(join(join(__dirname, '../backend'), req.path));
    console.log('GET', filename);
    if (filename.endsWith('/')) { filename += 'index.html'; }
    const fileExists = existsSync(filename);
    if (!fileExists) { console.warn('File not found:', filename); res.status(404).end(); return; }
    res.sendFile(filename);
});

app.get('*', (req, res) => {
    if (req.path.indexOf('..') > -1) { res.status(403).end(); return; }
    let filename = decodeURIComponent(join(__dirname, req.path));
    console.log('GET', filename);
    if (filename.endsWith('/')) { filename += 'index.html'; }
    const fileExists = existsSync(filename);
    if (!fileExists) { console.warn('File not found:', filename); res.status(404).end(); return; }
    res.sendFile(filename);
});

// Maximum number of messages to keep in memory to prevent memory leaks
const CACHE_MESSAGES = 20;
const MAX_BG_SIZE = 512 * 1024;

// Holds the last users and messages sent to the clients
let currentUsers = {};

// ! CHANGE TO REAL DATABASE
let rooms = {};

/**
 * Adds a user to the users object and returns the user object.
 *
 * @param {string} id - The unique identifier of the user.
 * @param {string} username - The username of the user.
 * @param {string} room - The room the user belongs to.
 * @param {string} icon - The icon associated with the user.
 * @return {object} The user object with the id, username, room, and icon.
 */
function addUser(id, room, userData) {
    const icon = userData.icon;
    const username = userData.username;
    currentUsers[id] = { username, room, icon };
    return { id, username, room, icon };
}

/**
 * Sends a message to all clients in the specified room.
 *
 * @param {string} message - The message to be sent.
 * @param {object} user - The user object containing information about the user.
 * @return {void} This function does not return a value.
 */
function sendInRoom(message, user) {
    wss.to(user.room).emit('message', { message, user: user.username, icon: user.icon });
    rooms[user.room].lastMessages.push({ user: user.username, message, icon: user.icon });
    if (rooms[user.room].lastMessages.length > CACHE_MESSAGES) {
        rooms[user.room].lastMessages.shift();
    }
}

/**
 * Uploads a file as a background for a specified room.
 *
 * @param {Buffer} file - the file to upload as a background
 * @param {string} filetype - the type of the file
 * @param {string} room - the room for which the background is uploaded
 * @return {void} 
 */
async function uploadBg(file, filetype, room) {
    file = Buffer.from(file);
    if (file.size > MAX_BG_SIZE) {
        console.log('File is too big');
        return;
    }

    const location = `/uploads/wallpaper/${room}${filetype}`;
    writeFile("./backend" + location, file, (err) => {
        if (err) {
            console.error('Error uploading file:', err);
            return;
        }
        rooms[room].chatBg = location;
        wss.to(room).emit('bg', location);
    });

    console.log('File uploaded:', location);
}

/**
 * Retrieves user data from the users array.
 *
 * @return {Array} An array of objects containing the username and icon of each user.
 */
function publicUsers(users) {
    return users.map(u => ({ username: u.username, icon: u.icon }));
}

/**
 * Event listener for when a new WebSocket connection is established.
 */
wss.on('connection', function connection(ws) {
    console.log('connected from:', ws.handshake.address);

    const TOKEN = ws.handshake.auth.token || ws.handshake.query.token || '';
    const user = Auth.validateToken(TOKEN, allData=true);

    if (!user || !user.success) {
        console.log('Invalid token:', TOKEN);
        ws.disconnect();
        return;
    }

    console.log('Authenticated:', user);

    const currentUser = {
        username: user.data.data.name,
        icon: user.data.data.icon,
        servers: user.data.data.servers
    };

    ws.on('join', ({ roomname }) => {
        if (currentUsers[ws.id]) {
            const user = currentUsers[ws.id];
            wss.to(user.room).emit('userLeft', { username: user.username, icon: user.icon });
            rooms[user.room].users = rooms[user.room].users.filter(u => u.username !== user.username);
            ws.leave(user.room);
        }
        let user = addUser(ws.id, roomname, {
            username: currentUser.username.toLocaleLowerCase(),
            icon: currentUser.icon
        });
        ws.join(user.room);

        if (!rooms[user.room]) {
            rooms[user.room] = {
                lastMessages: [],
                chatBg: '',
                users: []
            }
        }

        rooms[user.room].users.push(user);
        wss.to(user.room).emit('userJoined', { username: user.username, icon: user.icon });
        ws.emit('load', { username: user.username, icon: user.icon }, currentUser.servers);
        ws.emit('users', publicUsers(rooms[user.room].users));
        ws.emit('allMessages', rooms[user.room].lastMessages);
        ws.emit('bg', rooms[user.room].chatBg);
        // sendInRoom('Hi! I joined the chat', user);

        console.log('User joined:', user, ' in room:', user.room);
    });

    ws.on('send', ({ message }) => {
        const user = currentUsers[ws.id];
        sendInRoom(message, user);
        console.log('User sent message:', message, ' in room:', user.room);
    });

    ws.on('bgUpload', ({ filetype, file }) => {
        const user = currentUsers[ws.id];
        if (!file) return;
        if (!user) return;

        uploadBg(file, filetype, user.room);
    });

    ws.on('disconnect', () => {
        const user = currentUsers[ws.id];
        if (!user) return;

        wss.to(user.room).emit('userLeft', { username: user.username, icon: user.icon });
        delete currentUsers[ws.id];
        rooms[user.room].users = rooms[user.room].users.filter(u => u.username !== user.username);

        console.log('User disconnected:', user.username);
    });
});

const PORT = process.env.PORT || 5083;

server.listen(PORT, () => {
    console.log('Server started on port ' + PORT + '\n');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });



    rl.question('Do you want to open the browser? [Y/N] \n', (answer) => {
        if (answer.toLowerCase() === 'y') {
            exec('start http://localhost:' + PORT + '\n');
        };
    });
});