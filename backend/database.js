const fs = require('fs');

const basePath = './backend/storage/';

if (!fs.existsSync(basePath)) {
    console.log('Creating folder:', basePath);
    fs.mkdirSync(basePath);
}

function _database(databaseName, type = 'array') {
    let changed = false;
    let data = getAll();

    function getAll() {
        return JSON.parse(fs.readFileSync(`${basePath}${databaseName}.json`));
    }

    /**
     * Retrieves the value associated with the given key or index from the database.
     *
     * @param {any} keyOrIndex - The key or index in the database.
     * @return {any} The value associated with the given key or index.
     */
    function get(keyOrIndex) {
        return data[keyOrIndex];
    }
    /**
     * Sets a value in the database for a given key or index.
     *
     * @param {any} keyOrIndex - The key or index in the database.
     * @param {any} value - The value to set in the database.
     * @return {void} This function does not return anything.
     */
    function set(keyOrIndex, value) {
        data[keyOrIndex] = value;
        changed = true;
    }

    /**
     * Adds a value to an array database.
     *
     * @param {any} value - The value to be added to the database.
     * @throws {Error} If the database is not an array database.
     * @return {void} This function does not return anything.
     */
    function push(value) {
        if (!type === 'array') throw new Error('Cannot push to non-array database');
        data.push(value);
        changed = true;
    }

    /**
     * Finds a user in the database based on either their ID or email.
     *
     * @param {Object} options - An object containing either an ID or email.
     * @param {string} options.id - The ID of the user to find.
     * @param {string} options.email - The email of the user to find.
     * @return {Object|null} The user object if found, or an object with a "data" property set to "No user found" if not found.
     */
    function findOne({ email, id }) {
        if (id) return data.find((user) => user._id === id);
        if (email) return data.find((user) => user.email === email);

        return { data: "No user found" };
    }

    function _save() {
        fs.writeFileSync(`${basePath}${databaseName}.json`, JSON.stringify(data));

        console.log(`Database ${databaseName} saved.`);
    }

    setInterval(() => {
        if (changed) {
            _save();
            changed = false;
        }
    }, 60000);

    return {
        getAll,
        get,
        set,
        push,
        findOne
    };
}

/**
 * Opens a database with the given name and type.
 * If the database does not exist, it is created with an empty object or array.
 *
 * @param {string} databaseName - The name of the database to open.
 * @param {string} [type='array'] - The type of the database. Defaults to 'array'.
 * @return {Object} - An object containing methods to interact with the database.
 */
function openDatabase(databaseName, type = 'array') {
    if (!fs.existsSync(`${basePath}${databaseName}.json`)) {
        fs.writeFileSync(`${basePath}${databaseName}.json`, JSON.stringify(type === 'array' ? [] : {}));
    }

    return _database(databaseName, type);
}

function justSaveData(databaseName, data) {
    fs.writeFileSync(`${basePath}${databaseName}.json`, JSON.stringify(data));
}

function justLoadData(databaseName) {
    if (!fs.existsSync(`${basePath}${databaseName}.json`)) {
        fs.writeFileSync(`${basePath}${databaseName}.json`, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(`${basePath}${databaseName}.json`));
}

module.exports = {
    openDatabase,
    justSaveData,
    justLoadData
}