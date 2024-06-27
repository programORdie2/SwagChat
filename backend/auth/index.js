const { sign, verify } = require("jsonwebtoken");
const { genSalt, hash, compare } = require("bcryptjs");

const md5 = require("md5-js");

const { findOne, create } = require("./userModel.js");
const { handleAvatar } = require("../imageProccessor.js");
const { validateEmail, validatePassword, validateUsername } = require("./validator.js");

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

    if (!validateEmail(email)) {
        return sendError("Invalid email");
    }

    if (!validatePassword(password)) {
        return sendError("Invalid password");
    }

    if (!validateUsername(data.name)) {
        return sendError("Invalid username");
    }

    // check if user exists
    const userExists = await findOne({ email });
    if (userExists) {
        return sendError("User already exists");
    }

    const userNameExists = await findOne({ name: data.name });
    if (userNameExists) {
        return sendError("Username already exists");
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
        handleAvatar(icon, user.publicId);

        return sendSuccess({
            data: user.data,
            token: generateToken(user._id),
        });
    } else {
        return sendError("Invalid user data", email);
    }
};

async function loginUser(emailorname, password) {
    if (!emailorname || !password) {
        return sendError("Please add all fields", emailorname);
    }

    if (loginRateLimiterData[emailorname]) {
        if (loginRateLimiterData[emailorname] >= 5) {
            return sendError("Too many login attempts", emailorname);
        }
    }

    // Check for user email
    let user = await findOne({ email: emailorname });
    if (!user) {
        // Check for user name
        user = await findOne({ name: emailorname });
        if (!user) {
            return sendError("Invalid credentials", emailorname);
        }
    }

    if (await compare(password, user.password)) {
        return sendSuccess({
            data: user.data,
            token: generateToken(user._id),
        });
    } else {
        return sendError("Invalid credentials", emailorname);
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