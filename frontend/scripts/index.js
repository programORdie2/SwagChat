// Define the maximum number of saved messages to prevent memory leaks.
const maxSavedMessages = 100;

// Define the maximum number of bytes of the background image.
const maxBgSize = 500 * 1024;

const BG_SIZE_PX = 1600;

// Define the allowed file extensions.
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

let username = "Loading ...";
let icon = 0;
let thisUser = { username, icon };

// Arrays to store the messages, online users and user icons.
let messages = [];
let usersOnline = [];

// Array to store the rooms
let rooms = [];
// Define the current room
let roomID = '';

const cachedUserData = {};

function main() {
    const TOKEN = document.cookie.split(";").find(row => row.startsWith("token=")).split("=")[1] || '';

    // Create a WebSocket connection.
    const socket = io({ path: '/ws', auth: { token: TOKEN } });

    // Connection opened
    console.log("Connection open ");

    // Makes it easier to add/remove data from all messages.
    function socket_emit(event, data) {
        socket.emit(event, data);
    }

    function switchToRoom(roomId, roomName) {
        socket_emit('join', { roomname: roomId });
        setUrl(`/chat/${roomId}`);
        setTitle(roomName);
    }

    function setTitle(title) {
        if (!title) {
            document.title = `SwagChat`;
            return;
        }
        document.title = `SwagChat - ${title}`;
    }

    function setUrl(url) {
        if (window.history && window.history.pushState) {
            window.history.pushState({ path: url }, '', url);
        }
    }

    function getUrlPath() {
        return window.location.pathname.split('/').slice(1);
    }

    function showRooms() {
        document.getElementById("rooms").innerHTML = rooms.map(r => createRoomDisplay(r)).join("\n");
        const elements = document.getElementById('rooms').querySelectorAll('a');
        elements.forEach(element => {
            element.addEventListener('click', () => {
                roomID = element.dataset.roomid;
                const roomName = element.dataset.roomname;

                switchToRoom(roomID, roomName);

                document.querySelectorAll('.active').forEach(element => {
                    element.classList.remove('active');
                });
                element.classList.add('active');
            });
        });
    }

    function handleFile(file) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;

            const ratio = imgWidth / imgHeight;

            if (imgWidth > imgHeight) {
                canvas.width = BG_SIZE_PX;
                canvas.height = BG_SIZE_PX / ratio;
            } else {
                canvas.height = BG_SIZE_PX;
                canvas.width = BG_SIZE_PX / ratio;
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            uploadFile(dataUrl);
        };
    }

    function uploadFile(dataUrl) {
        socket_emit('bgUpload', dataUrl);
        console.log('Uploaded bg');
    }

    // Send a new message
    document.getElementById("messageButton").addEventListener("click", () => {
        // Makes sure the message is not empty.
        const inputValue = document.getElementById("messageInput").value;
        if (inputValue.trim() === "") {
            return;
        }
        if (inputValue.length > 250) {
            showError('Message too long', 'The message is too long. Max length is 250 characters.');
            return;
        }
        // Send the message to the server.
        socket_emit("send", { message: inputValue });
        // Clear the message input, set focus back to the message input and change the button color.
        document.getElementById("messageInput").value = "";
        document.getElementById("messageInput").focus();
        document.getElementById("messageButton").style.backgroundColor = "var(--highligh-ops)";
    });

    function fetchUserDatas(userids) {
        return new Promise((resolve, reject) => {
            socket.emit('userDatas', userids, (otherUsers) => {
                resolve(otherUsers);
            });
        });
    }

    async function getUserDatas(userids) {
        const data = {};
        const toFetch = [];
        userids.forEach(username => {
            if (data[username]) return;
            if (cachedUserData[username]) {
                data[username] = cachedUserData[username];
                return;
            }
            toFetch.push(username);
        });

        if (toFetch.length === 0) return data;

        const otherUsers = await fetchUserDatas(toFetch);
        Object.assign(data, otherUsers);

        return data;
    }

    // Listen for messages
    socket.on("message", (received) => {
        console.log("Message from server ", received);
        messages.push(received);
        addMessage(received);

        // Remove the oldest message if the array is too long to prevent memory leaks.
        if (messages.length > maxSavedMessages) {
            messages.shift();
        }
    });

    socket.on('allMessages', (data) => {
        console.log('last messages:');
        console.log(data);
        messages = data;
        renderMessages();
    });

    socket.on('users', async (data) => {
        console.log('users:');
        console.log(data);

        const userDatas = await getUserDatas(data);

        console.log(userDatas);

        usersOnline = [];
        data.forEach(user => {
            console.log(userDatas[user]);
            usersOnline.push(userDatas[user]);
        });

        console.log(usersOnline);

        renderUsersOnline();
    });

    socket.on('userJoined', (data) => {
        console.log('userJoined:');
        console.log(data);
        if (!usersOnline.includes(data)) {
            usersOnline.push(data);
        }
        addUser(data);
        // addMessage({"icon": data.icon, "message": data.username + " joined the chat.", "user": data.username, "username": data.username});
    });

    socket.on('userLeft', (data) => {
        console.log('userLeft:');
        console.log(data);
        usersOnline = usersOnline.filter(user => user.username !== data.username);
        renderUsersOnline();
        // addMessage({"icon": data.icon, "message": data.username + " left the chat.", "user": data.username, "username": data.username});
    });

    socket.on('bg', (data) => {
        console.log('bg:');
        console.log(data);

        if (!data) {
            document.body.style.backgroundImage = "";
            return;
        };
        document.body.style.backgroundImage = `url('${data}?randomId=${Math.random()}')`;
    });

    socket.on('load', (userData, roomsData) => {
        icon = userData.icon;
        username = userData.username;
        thisUser = { username, icon };

        console.log('load:', userData, roomsData);

        document.getElementById('currentUser').innerHTML = createUser(thisUser);
        rooms = roomsData;

        const roomIds = roomsData.map(room => room.id);
        let roomName;

        const url = getUrlPath();
        if (url.length >= 2 && url[0] === 'chat' && roomIds.includes(url[1])) {
            console.log('Room specified, using room ' + url[1]);

            roomID = url[1];
            roomName = rooms.find(room => room.id === roomID).name;
        } else {
            console.log('No room specified, using first room');

            if (roomIds.length === 0) {
                showError('No rooms found', 'Create or join a room first.');
                return;
            }

            roomID = roomIds[0];
            roomName = rooms[0].name;
        }

        switchToRoom(roomID, roomName);
        showRooms();
    });

    socket.on('timeout', (message) => {
        showError('Request timed out', message);
    });

    // Reconnect
    socket.io.on('reconnect', () => {
        console.log('reconnected');
        socket_emit("join", { roomname: roomID });
    });

    // Error
    socket.on('error', (data) => {
        console.error("Socket.IO error: " + data);
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.warn('disconnected');
        showOverlay();
    });

    // Connection
    socket.on('connect', () => {
        console.log('connected');
        hideOverlay();
    });

    // Unhandled event
    socket.on("*", (data) => {
        console.warn('unhandled event: ' + data);
    });

    function createRoom(roomName) {
        socket.emit("createRoom", roomName, (data) => {
            if (data.success) {
                console.log("Created room: " + data.id);
                rooms.push({ name: roomName, id: data.id });
                roomID = data.id;

                switchToRoom(roomID, roomName);
                showRooms();

                return;
            }

            showError("Could not create room", data.message);
            return;
        });
    }

    document.getElementById("createRoomButton").addEventListener("click", async () => {
        const roomName = await askInput("Create room", "Room name", createRoom);
        if (roomName) {
            createRoom(roomName);
        }
    });

    function createInviteForRoom(roomName) {
        socket.emit("createInvite", roomName, (data) => {
            if (data.success) {
                console.log("Created invite for room: " + data.invite);
            }
        });
    }

    document.getElementById("createInviteButton").addEventListener("click", () => {
        createInviteForRoom(roomID);
    });

    function showOverlay() {
        document.getElementById("overlay").classList.remove("hidden");
        document.getElementById("overlay").classList.add("show");

        setTitle();
    }

    function hideOverlay() {
        document.getElementById("overlay").classList.remove("show");
        document.getElementById("overlay").classList.add("hidden");
    }

    // Makes you able to press enter to send the message or focus on the input.
    document.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();

            if (document.activeElement.id === "messageInput") {
                document.getElementById("messageButton").click();
            } else {
                document.getElementById("messageInput").focus();
            }
        }
    });
    document.getElementById("messageInput").addEventListener("keyup", (event) => {
        if (document.getElementById("messageInput").value.trim() !== "") {
            document.getElementById("messageButton").style.backgroundColor = "var(--message-button-color)";
        } else {
            document.getElementById("messageButton").style.backgroundColor = "var(--highligh-ops)";
        }
    });
    document.getElementById("changeWallpaper").addEventListener("click", () => {
        showMessage("Change chat wallpaper", "Change the background of the chat. <br>(Everyone can see it!)", "", 'Cancel', withFile = handleFile);
    });

    function makeResponsible() {
        console.log("makeResponsible");
        if (window.innerWidth < 900) {
            document.getElementById('usersOnlineContainer').classList.add('collapsed');
            document.getElementById('usersCollapse').classList.add('collapsed');
        } else {
            document.getElementById('usersOnlineContainer').classList.remove('collapsed');
            document.getElementById('usersCollapse').classList.remove('collapsed');
        }
        if (window.innerWidth < 600) {
            document.getElementById('menu').classList.add('collapsed');
            document.getElementById('menuCollapse').classList.add('collapsed');
        } else {
            document.getElementById('menu').classList.remove('collapsed');
            document.getElementById('menuCollapse').classList.remove('collapsed');
        }

        if (navigator.userAgent.indexOf('iPhone') !== -1 && navigator.userAgent.indexOf('CriOS') !== -1) {
            showError('Mobile device not supported', 'Please use a desktop browser, this site is not optimized for mobile devices.');
        }
    }
    document.addEventListener('resize', makeResponsible);
    makeResponsible();

    document.getElementById('menuCollapse').addEventListener('click', () => {
        document.getElementById('menu').classList.toggle('collapsed');
        document.getElementById('menuCollapse').classList.toggle('collapsed');
    });
    document.getElementById('usersCollapse').addEventListener('click', () => {
        document.getElementById('usersOnlineContainer').classList.toggle('collapsed');
        document.getElementById('usersCollapse').classList.toggle('collapsed');
    });

    document.getElementById("currentUser").addEventListener("click", () => {
        document.getElementById("userMenu").classList.toggle('collapsed');
    });

    document.addEventListener("click", (event) => {
        if (!document.getElementById('userMenu').contains(event.target) && !document.getElementById('currentUser').contains(event.target)) {
            document.getElementById("userMenu").classList.add('collapsed');
        }
    });

    document.getElementById("signOutButton").addEventListener("click", () => {
        document.cookie = "token=; path=/; max-age=0";
        if (window.parent !== window) {
            window.parent.location.reload();
        }
        window.location = "/";
    });
}

// Makes sure the page is loaded before running the code.
document.addEventListener('DOMContentLoaded', function () {
    main();
});