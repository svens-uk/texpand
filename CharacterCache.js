const logger = require('./logger.js');
const keyConvert = require('./keyConvert.js');

const acceptableCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`0123456789-=¬!"£$%^&*()_+[];\'#\\,./{}:@~|<>? ';
const acceptableCodes = acceptableCharacters.split('').map(character => character.charCodeAt(0));

function processEventPlatform(event) {
    if(process.platform !== 'linux') {
        event.rawcode = keyConvert.keycodeToKeysym(event.rawcode);
    }
    const keycode = keyConvert.keysymToKeycode(event.rawcode);
    event.keychar = (keycode || keycode === 0 ? String.fromCharCode(keycode) : undefined);
}

function keyevent(event) {
    processEventPlatform(event);
    logger.trace({event}, 'Key event');
    // if we are currently locked, return early.
    if(this.lock) {
        return;
    }

    // if control is pressed
    if(event.rawcode === 65507 || event.rawcode === 65508) {
        this.ctrl = (event.type === 'keydown');
        return;
    }

    // if shift is pressed
    if(event.rawcode === 65505 || event.rawcode === 65506) {
        this.shift = (event.type === 'keydown');
        return;
    }

    // if alt is pressed
    if(event.rawcode === 65513) {
        this.alt = (event.type === 'keydown');
        return;
    }

    // if keyup event, then return early
    if(event.type === 'keyup') {
        return;
    }

    // check that we have an acceptable character. If not, reset if not another acceptable character (e.g. shift or escape).
    if(acceptableCodes.includes(event.rawcode) && !this.ctrl) {
        const character = String.fromCharCode(event.rawcode);
        this.characterCache.push(character);
        this.checkPerfectMatch();
        return;
    } else if(event.rawcode === 65288 && !(this.shift && this.ctrl)) {
        if(this.ctrl) {
            this.removeLastWord();
        } else if(this.alt) {
            this.reset();
        } else {
            this.removeLastCharacter();
        }
        return;
    } else if(event.rawcode !== 65509 && event.rawcode !== 65507 && event.rawcode !== 65407 && event.rawcode !== 65300) {
        this.reset();
        return;
    }
}

function mousedown(event) {
    logger.trace({event}, 'Mouse event');
    // if we are currently locked, return early.
    if(this.lock) {
        return;
    }
    this.reset();
}

function finished() {
    this.lock = false;
    logger.info('Received finished event. Unlocked.');
}

class CharacterCache {
    constructor (maps, iohook, eventEmitter) {
        this.characterCache = [];
        this.maps = maps;
        this.iohook = iohook;
        this.eventEmitter = eventEmitter;
        this.lock = false;

        this.ctrl = false;
        this.shift = false;
        this.alt = false;

        this.iohook.on('keydown', keyevent.bind(this));
        this.iohook.on('keyup', keyevent.bind(this));
        this.iohook.on('mousedown', mousedown.bind(this));
        this.eventEmitter.on('finished', finished.bind(this));
        logger.debug('Finished CharacterCache event registration');
    }

    checkPerfectMatch() {
        const totalString = this.characterCache.join('');
        logger.trace({totalString}, 'Total typed string');
        for(let alias in this.maps) {
            if(totalString.endsWith(alias)) {
                const e = this.maps[alias];
                this.lock = true;
                logger.debug({match: e}, 'Found match. Locked.');
                this.eventEmitter.emit('expansion', alias, e);
                this.reset();
                return;
            }
        }
    }
    reset() {
        logger.debug('Resetting string');
        this.characterCache = [];
    }

    removeLastCharacter() {
        logger.debug('Removing last character');
        this.characterCache.pop();
    }

    removeLastWord() {
        logger.debug('Removing last word');
        const lastOccurence = this.characterCache.lastIndexOf(' ');
        this.characterCache = this.characterCache.slice(0, lastOccurence >= 0 ? lastOccurence : 0);
    }
}

module.exports = CharacterCache;
