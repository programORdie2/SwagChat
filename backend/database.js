const fs = require('fs');

const basePath = './backend/storage/';

if (!fs.existsSync(basePath)) {
    console.log('Creating folder:', basePath);
    fs.mkdirSync(basePath);
}

function _database(databaseName, type = 'array') {
    let changed = false;
    let data = _getAll();

    function _getAll() {
        return JSON.parse(fs.readFileSync(`${basePath}${databaseName}.json`));
    }

    function getAll() {
        return data;
    }

    function setAllChild(key2, value) {
        const keys = Object.keys(data);
        keys.forEach((key) => data[key][key2] = value);
        changed = true;
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

    function getChild(key1, key2) {
        return data[key1][key2];
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

    function setChild(key1, key2, value) {
        data[key1][key2] = value;
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

    function pushChild(key1, parentKey, value, maxLength=-1) {
        if (!data[key1]) {
            console.error("No such key in database:", key1);
            return;
        }

        data[key1][parentKey].push(value);
        if (maxLength > 0 && data[key1][parentKey].length > maxLength) {
            data[key1][parentKey].shift();
        }
        changed = true;
    }

    function deleteItem(keyOrIndex) {
        delete data[keyOrIndex];
        changed = true;
    }

    function deleteItemChild(key1, parentKey, index) {
        data[key1][parentKey].splice(index, 1);
        changed = true;
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
        pushChild,
        save: _save,
        deleteItem,
        deleteItemChild,
        setAllChild,
        getChild,
        setChild
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