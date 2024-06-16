import "https://cdn.jsdelivr.net/gh/emn178/js-md5/build/md5.min.js";

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

    if (!data.success) return;
    
    document.cookie = `token=${data.token}; path=/; max-age=${cookieExpiresAfter}`;
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

    if (!data.success) return;

    document.cookie = `token=${data.token}; path=/; max-age=${cookieExpiresAfter}`;
}

async function validate() {
    const token = document.getElementById("token").value;
    const response = await fetch("/validate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
    });
    const data = await response.json();
    console.log(data);
}

const Auth = {
    login,
    register,
    validate,
};

window.Auth = Auth;