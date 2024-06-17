const { sign, verify } = require("jsonwebtoken");
const { genSalt, hash, compare } = require("bcryptjs");

const md5 = require("md5-js");

const { findOne, create } = require("./userModel.js");

const { handleAvatar } = require("../imageProccessor.js");

let loginRateLimiterData = {};

// Generate JWT
function generateToken(id) {
    return sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

function sendError(message, email = "") {
    console.error(message);

    if (email !== "") {
        if (loginRateLimiterData[email]) {
            loginRateLimiterData[email] += 1;
        } else {
            loginRateLimiterData[email] = 1;
        }
    }

    return { success: false, message };
}
function sendSuccess(message) {
    return { success: true, ...message };
}

async function registerUser(email, password, data) {
    if (!email || !password) {
        return sendError("Please add all fields");
    }

    // check if user exists
    const userExists = await findOne({ email });
    if (userExists) {
        return sendError("User already exists");
    }

    // create hash password
    const salt = await genSalt(10);
    const hashedPassword = await hash(md5(password), salt);

    const icon = data.icon;
    delete data.icon;

    // create user
    const user = await create({
        data,
        email,
        password: hashedPassword,
    });

    if (user) {
        handleAvatar(icon, user._id);

        return sendSuccess({
            data: user.data,
            token: generateToken(user._id),
        });
    } else {
        return sendError("Invalid user data", email);
    }
};

async function loginUser(email, password) {
    if (!email || !password) {
        return sendError("Please add all fields", email);
    }

    if (loginRateLimiterData[email]) {
        if (loginRateLimiterData[email] >= 5) {
            return sendError("Too many login attempts", email);
        }
    }

    // Check for user email
    const user = await findOne({ email });

    if (user && (await compare(password, user.password))) {
        return sendSuccess({
            data: user.data,
            token: generateToken(user._id),
        });
    } else {
        return sendError("Invalid credentials", email);
    }
};

function validateToken(token, allData = false) {
    try {
        const user = verify(token, process.env.JWT_SECRET);
        const data = findOne({ id: user.id });

        if (!data) {
            console.warn("User not found");
            return {
                success: false,
                resetCookie: true,
            };
        }

        console.log('Successfully validated token.');

        if (allData) {
            return sendSuccess({ data });
        }

        return sendSuccess({ data: data.data });
    } catch (error) {
        return sendError("Invalid token:" + token);
    }
};

setInterval(() => {
    loginRateLimiterData = {};
}, 5*60*1000);

module.exports = { loginUser, registerUser, validateToken };