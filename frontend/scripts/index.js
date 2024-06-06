// Define the maximum number of saved messages to prevent memory leaks.
const maxSavedMessages = 100;

// Define the maximum number of bytes of the background image.
const maxBgSize = 500 * 1024;

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
let roomID = 'hello people';

// Makes sure the page is loaded before running the code.
document.addEventListener('DOMContentLoaded', function () {
    main();
});

function main() {
    const TOKEN = document.cookie.split(";").find(row => row.startsWith("token=")).split("=")[1] || '';

    // Display the current user.
    document.getElementById('currentUser').innerHTML = createUser(thisUser);

    // Create a WebSocket connection.
    const socket = io({ path: '/ws', auth: { token: TOKEN } });

    // Connection opened
    console.log("Connection open ");
    switchToRoom(roomID);

    // Makes it easier to add/remove data from all messages.
    function socket_emit(event, data) {
        socket.emit(event, data);
    }

    function switchToRoom(roomId) {
        socket_emit('join', { roomname: roomId });
    }

    function showRooms() {
        document.getElementById("rooms").innerHTML = rooms.map(r => createRoom(r)).join("\n");
        const elements = document.getElementById('rooms').querySelectorAll('a');
        elements.forEach(element => {
            element.addEventListener('click', () => {
                switchToRoom(element.dataset.roomid);
                element.classList.remove('active');
                roomID = element.dataset.roomid;
            });
        });
    }

    function handleFile(file) {
        if (file.size > maxBgSize) {
            alert("File is too big. Max size is " + maxBgSize / 1024 + " KB.");
            return;
        }
        console.log('totallt not uploading that file');
        uploadFile(file);
    }

    function uploadFile(file) {
        let filetype = (file.name).split('.');
        filetype = '.' + filetype[filetype.length - 1];
        if (!allowedExtensions.includes(filetype)) {
            alert("File type not allowed. Allowed extensions: " + allowedExtensions.join(', '));
            return;
        }
        socket_emit('bgUpload', { filetype, file });
        console.log('Uploaded', file.name);
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

    socket.on('users', (data) => {
        console.log('users:');
        console.log(data);
        usersOnline = [];
        data.forEach(user => {
            usersOnline.push(user);
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
        document.body.style.backgroundImage = `url('${data}?randomId=${Math.random() * 100000000}')`;
    });

    socket.on('load', (userData, roomsData) => {
        icon = userData.icon;
        username = userData.username;
        thisUser = { username, icon };
        document.getElementById('currentUser').innerHTML = createUser(thisUser);
        rooms = roomsData;

        showRooms();
    });

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
    }
    window.onresize = makeResponsible;
    makeResponsible();

    document.getElementById('menuCollapse').addEventListener('click', () => {
        document.getElementById('menu').classList.toggle('collapsed');
        document.getElementById('menuCollapse').classList.toggle('collapsed');
    });
    document.getElementById('usersCollapse').addEventListener('click', () => {
        document.getElementById('usersOnlineContainer').classList.toggle('collapsed');
        document.getElementById('usersCollapse').classList.toggle('collapsed');
    });
}