const messages = {
    "User already exists": "This email is already registered!",
    "Invalid email": "Invalid email address!",
    "Invalid password": "Invalid password!",
    "Invalid username": "Invalid username!",
    "Too many login attempts": "Too many login attempts, try again later!",
    "Please add all fields": "Please add all fields!",
    "Invalid credentials": "Email or password is incorrect!",
    "Username already exists": "Username already exists!",
}

function showHTTPError(data) {
    console.log(data);

    if (data.message) {
        document.getElementById("error").innerHTML = messages[data.message];
        document.getElementById("error").classList.remove("hidden");
    } else {
        document.getElementById("error").innerHTML = "An unexpected error occurred!";
        document.getElementById("error").classList.remove("hidden");
    }

    if (document.getElementById("register")) {
        document.getElementById("register").disabled = false;
        document.getElementById("register").value = "Register";
    } else {
        document.getElementById("login").disabled = false;
        document.getElementById("login").value = "Login";
    }
}

export { showHTTPError };
