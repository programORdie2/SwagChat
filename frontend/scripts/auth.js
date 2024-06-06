import "https://cdn.jsdelivr.net/gh/emn178/js-md5/build/md5.min.js"

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const hash = md5(password);
    const response = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: hash }),
    });
    const data = await response.json();
    console.log(data);

    if (!data.success) return;
    
    document.cookie = `token=${data.token}; path=/; max-age=30`;
}

async function register() {
    const icon = Math.round(Math.random() * 3);
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const response = await fetch("/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, data: { name, email, icon } }),
    });
    const data = await response.json();
    
    console.log(data);

    if (!data.success) return;

    document.cookie = `token=${data.token}; path=/; max-age=30`;
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