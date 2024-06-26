require("dotenv").config();

const { existsSync, mkdirSync } = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const { exec } = require('child_process');
const readline = require('node:readline');

const asyncHandler = require("express-async-handler");

const Auth = require('./auth/index.js');
const { uploadBg } = require('./imageProccessor.js');
const { justSaveData, justLoadData } = require('./database.js');
const { FINAL_SAVE } = require("./auth/userModel.js");

const requests_timout = {
    join: 0.5,
    send: 0.5,
    bgUpload: 60
}

const timeout_info = {
    join: "Whoa, not so fast! Please wait a bit before joining",
    send: "Whoa, not so fast! Please wait a bit before sending another message",
    bgUpload: "Whoa, not so fast! Please wait a bit before uploading a new background"
}

// If the system is linux, set the NODE_ENV to production
if (process.platform === 'linux') {
    process.env.NODE_ENV = 'production';
}

// Create a new Express server
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

app.use((req, res, next) => {
    const time = new Date();
    const message = `[${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}] [${req.method}] - ${req.path}`;
    console.log(message);
    next();
});

// custom error handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
});

// Disable the X-Powered-By header
app.disable('x-powered-by')

__dirname = join(__dirname, '../frontend');

const server = createServer(app);

// Create a new WebSocket server, listening on port 5000 of localhost, and with the path '/ws'
const wss = new Server(server, {
    path: '/ws',
    cors: {
        origin: "*"
    },
    maxHttpBufferSize: 1e7
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
    const { email, password } = req.body;
    const user = await Auth.loginUser(email, password);
    if (user.success) {
        res.cookie('token', user.token);
    }
    res.json(user);
}));

app.post('/register', asyncHandler(async (req, res) => {
    const { email, password, data } = req.body;
    const user = await Auth.registerUser(email, password, data);
    if (user.success) {
        res.cookie('token', user.token);
    }
    res.json(user);
}));

app.post('/validate', asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = Auth.validateToken(token);
    if (!user.success) {
        res.clearCookie('token');
    }
    res.json(user);
}));

// Client Routes
app.get('/', asyncHandler(async (req, res) => {
    const { token } = req.cookies;

    if (!token) {
        res.sendFile(join(__dirname, '/notAuthorized.html'));
        return;
    }

    const user = Auth.validateToken(token);

    if (!user || !user.success) {
        res.clearCookie('token');

        res.sendFile(join(__dirname, '/notAuthorized.html'));
        return;
    }

    res.sendFile(join(__dirname, '/index.html'));
}));

app.get('/uploads/*', (req, res) => {
    if (req.path.indexOf('..') > -1) { res.status(403).end(); return; }
    let filename = decodeURIComponent(join(join(__dirname, '../backend'), req.path));
    if (filename.endsWith('/')) { filename += 'index.html'; }
    const fileExists = existsSync(filename);
    if (!fileExists) { console.warn('File not found:', filename); res.status(404).sendFile(join(__dirname, '/404.html')); return; }
    res.sendFile(filename);
});

app.get('*', (req, res) => {
    if (req.path.indexOf('..') > -1) { res.status(403).end(); return; }
    let filename = decodeURIComponent(join(__dirname, req.path));
    if (filename.endsWith('/')) { filename += 'index.html'; }
    const fileExists = existsSync(filename);
    if (!fileExists) { console.warn('File not found:', filename); res.status(404).sendFile(join(__dirname, '/404.html')); return; }
    res.sendFile(filename);
});

// Maximum number of messages to keep in memory to prevent memory leaks
const CACHE_MESSAGES = 20;

// Doesn't need a real db, since all the users rejoin anyway when the connection is lost
let currentUsers = {};

// Load the rooms from the database
let rooms = justLoadData('rooms');

// Save the rooms to the database every minute
setInterval(() => {
    justSaveData('rooms', rooms);
}, 60000);

function sanitize(message) {
    const entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
      };

    return String(message).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}

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
    const user = Auth.validateToken(TOKEN, allData = true);

    if (!user || !user.success) {
        ws.disconnect();
        return;
    }

    let sendRequests = {};

    const currentUser = {
        username: user.data.data.name,
        icon: user.data.data.icon,
        servers: user.data.data.servers
    };

    ws.on('join', ({ roomname }) => {
        if (!shouldHandleEvent('join')) return;

        if (!roomname) return;
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
    });

    ws.on('send', ({ message }) => {
        if (!shouldHandleEvent('send')) return;

        message = sanitize(message);
        const user = currentUsers[ws.id];
        sendInRoom(message, user);
    });

    ws.on('bgUpload', (dataUrl) => {
        if (!shouldHandleEvent('bgUpload')) return;

        const user = currentUsers[ws.id];
        if (!dataUrl) return;
        if (!user) return;

        uploadBg(dataUrl, user.room, (location) => {
            rooms[user.room].chatBg = location;
            wss.to(user.room).emit('bg', location);
        });
    });

    ws.on('disconnect', () => {
        const user = currentUsers[ws.id];
        if (!user) return;

        wss.to(user.room).emit('userLeft', { username: user.username, icon: user.icon });
        delete currentUsers[ws.id];
        rooms[user.room].users = rooms[user.room].users.filter(u => u.username !== user.username);

        console.log('User disconnected:', user.username);
    });

    const denyHandlingEvent = (event) => {
        const message = timeout_info[event] || 'Request timed out, please try again.';
        ws.emit('timeout', message);
    };

    const shouldHandleEvent = ((event) => {
        if (!requests_timout[event]) {
            console.warn('Cannot handle event:', event);
            return true; // No timeout
        }

        if (!sendRequests[event]) {
            sendRequests[event] = Date.now();
            return true;
        }

        const timeleft = (sendRequests[event] + requests_timout[event] * 1000) - Date.now();

        if (timeleft < 0) {
            sendRequests[event] = Date.now();
            return true;
        }

        denyHandlingEvent(event);

        return false;
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

process.stdin.resume();

let saved = false;
async function exitHandler() {
    if (saved) return;
    saved = true;
    console.log('Closing server...');
    console.log('Saving user data...');
    FINAL_SAVE();
    console.log('Saving rooms...');
    justSaveData('rooms', rooms);
    console.log('Bye bye!');
    wss.close();
    server.close();
    process.exit();
}

process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);
process.on('uncaughtException', exitHandler);