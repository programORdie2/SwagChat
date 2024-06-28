let token;
try {
    const cookies = document.cookie.split(";");
    token = cookies.find((cookie) => cookie.trim().startsWith("token=")).split("=")[1];
} catch (error) {
    console.error(error);
    window.location = "/";
}

const inviteId = window.location.pathname.split('/').slice(1)[1];

async function checkInviteValid() {
    const response = await fetch(`/invite/${inviteId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
    });

    if (response.status == 403) {
        window.location = "/";
        return;
    }

    if (response.status == 404) {
        document.getElementById("name").innerHTML = "Invite not found!";
        document.getElementById("home").style.display = "block";
        return;
    }

    const data = await response.json();

    document.getElementById("name").innerHTML = `You have been invited to join ${data.roomName}!`;
    document.querySelector(".invite div").style.display = "block";
}

async function acceptInvite() {
    const response = await fetch(`/accept_invite/${inviteId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
    });

    window.location = "/";
}

checkInviteValid();

document.getElementById("decline").addEventListener("click", () => {
    window.location = "/";
});

document.getElementById("accept").addEventListener("click", async () => {
    document.getElementById("overlay").style.display = "block";
    acceptInvite();
});

document.getElementById("home").addEventListener("click", () => {
    window.location = "/";
});