/**
 * Generates HTML for a user with a specified username.
 *
 * @param {string} username - The username of the user.
 * @return {string} The HTML code for displaying the user.
 */
function createUser(user) {
    const username = user.username;
    const icon = user.icon;
    const userHtml = '<div class="user"><img src="/uploads/icons/' + icon + '" alt="" /><span>' + username + '</span></div>';
    return userHtml;
}

/**
 * Creates a message HTML element based on the message and user information.
 *
 * @param {object} message - The message object containing the message content and user information.
 * @param {object} lastMessage - The last message object to compare with the current message.
 * @return {string} The HTML content representing the message with user details.
 */
function createMessage(message) {
    const messageContent = message.message;
    const user = message.user;
    const userIcon = message.icon;
    const messageHTML = '<div class="message flex"><img class="user" alt="" src="/uploads/icons/' + userIcon + '" /><div><span class="user">' + user + '</span><span class="messageContent">' + messageContent + '</span></div></div>';
    return messageHTML;
}


function createRoom(room) {
    const name = room;
    let extraClass = '';
    if (name === roomID) {
        extraClass = 'active';
    }
    const HTML = '<a class="room ' + extraClass + '" title="' + name + '" data-roomid="' + name + '"><span>' + name + '</span></a>';
    return HTML;
}

function addUser(user) {
    document.getElementById("usersOnline").innerHTML += createUser(user);
}

function renderUsersOnline() {
    document.getElementById("usersOnline").innerHTML = usersOnline.map(u => createUser(u)).join("\n");
}

function addMessage(message) {
    const scrolledBefore = document.getElementById("messages").scrollTop;
    const couldScroll = document.getElementById("messages").scrollHeight - document.getElementById("messages").clientHeight;

    document.getElementById("messages").innerHTML += createMessage(message);

    // Scroll to bottom if the user was on bottom before the render
    const needToScroll = document.getElementById("messages").scrollHeight - document.getElementById("messages").clientHeight;
    if (Math.abs(Math.round(couldScroll) - Math.round(scrolledBefore)) < 3) {
        document.getElementById("messages").scrollTop = needToScroll;
    }
}

function renderMessages() {
    const scrolledBefore = document.getElementById("messages").scrollTop;
    const couldScroll = document.getElementById("messages").scrollHeight - document.getElementById("messages").clientHeight;

    document.getElementById("messages").innerHTML = messages.map(m => createMessage(m)).join("\n");

    // Scroll to bottom if the user was on bottom before the render
    const needToScroll = document.getElementById("messages").scrollHeight - document.getElementById("messages").clientHeight;
    if (Math.abs(Math.round(couldScroll) - Math.round(scrolledBefore)) < 3) {
        document.getElementById("messages").scrollTop = needToScroll;
    }
}