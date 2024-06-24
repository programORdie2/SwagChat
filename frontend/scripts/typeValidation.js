function checkEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function checkPassword(password) {
    const re = /^(?=.*\d)(?=.*[a-zA-Z]).{8,20}$/;
    return re.test(String(password).toLowerCase());
}

function checkUsername(username) {
    const re = /^[a-zA-Z0-9]{3,20}$/;
    return re.test(String(username).toLowerCase());
}