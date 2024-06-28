import "https://cdn.jsdelivr.net/gh/emn178/js-md5/build/md5.min.js";
import { showHTTPError } from "./signinupError.js";

const cookieExpiresAfter = 30 * 24 * 60 * 60;

async function login() {
    const { email, password } = getAllForms();
    const hash = md5(password);
    const body = { email, password: hash };

    const response = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    const data = await response.json();
    console.log(data);

    if (!data.success) {
        showHTTPError(data);
        return;
    }

    document.cookie = `token=${data.token}; path=/; max-age=${cookieExpiresAfter}`;

    if (window.parent !== window) {
        window.parent.location.reload();
    }

    if (window.location.pathname === "/") {
        window.location.reload();
    }
    window.location = "/";
}

async function register() {
    const { name, email, password, avatar } = getAllForms();
    const body = { email, password, data: { name, email, icon: avatar } };
    const response = await fetch("/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log(data);

    if (!data.success) {
        showHTTPError(data);
        return;
    }

    document.cookie = `token=${data.token}; path=/; max-age=${cookieExpiresAfter}`;

    if (window.parent !== window) {
        window.parent.location.reload();
    }

    if (window.location.pathname === "/") {
        window.location.reload();
    }
    window.location = "/";
}

async function validate() {
    let token
    try {
        const cookies = document.cookie.split(";");
        token = cookies.find((cookie) => cookie.trim().startsWith("token=")).split("=")[1];
    } catch (error) {
        console.log(error);
        return { success: false };
    }
    const response = await fetch("/validate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
    });
    const data = await response.json();
    data.token = token;
    console.log(data);

    return data;
}

function signOut() {
    document.cookie = "token=; path=/; max-age=0";
    if (window.parent !== window) {
        window.parent.location.reload();
    }
    window.location = "/";
}

const Auth = {
    login,
    register,
    validate,
    signOut,
};

window.Auth = Auth;