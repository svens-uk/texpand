// Node imports
const {EventEmitter} = require('events');
const path = require('path');


// External imports
const CSON = require('cson');
const {app, BrowserWindow, globalShortcut, Menu, Tray} = require('electron');
const iohook = require('iohook');

// Internal imports
const CharacterCache = require('./CharacterCache.js');
const TextReplace = require('./TextReplace.js');
const logger = require('./logger.js');


// Constants

// Application

let win, tray;

// Wait for electron to be ready

function quit() {
    app.quit();
    process.exit();
}
function quitError(err) {
    logger.fatal({err});
    quit();
}

app.on('ready', () => {
    // Create the base window
    try {
        win = new BrowserWindow({show: false});
        win.on('closed', () => {
            win = null;
        });
    } catch (e) {
        quitError(e);
    }
    logger.debug('Created hidden base window');
    
    try {
        tray = new Tray(path.join(__dirname, 'static', 'texpand.png'));
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Quit',
                type: 'normal',
                click: () => {
                    logger.info('Quit button in tray pressed. Quitting!');
                    win.close();
                    quit();
                }
            }
        ]);
        tray.setToolTip('texpand');
        tray.setContextMenu(contextMenu);
    } catch (e) {
        quitError(e);
    }
    logger.debug('Created tray');
    
    // Register handler
    try {
        const ret = globalShortcut.register('Shift+Tab+Q', () => {
            logger.info('Detected exit key combination. Quitting!');
            win.close();
            quit();
        });
        if (!ret) {
            throw new Error('Failed to register exit keybinding');
        }
    } catch (err) {
        quitError(err);
    }
    logger.info('Successfully registered exit keybinding');

    // Read the configuration file
    let maps;
    try {
        maps = CSON.load(path.join(__dirname, 'ConfigurationFile.cson'));
    } catch (err) {
        quitError(err);
    }
    logger.debug({maps}, 'Successfully loaded maps');

    const eventEmitter = new EventEmitter();
    logger.trace('Created EventEmitter');

    const textReplace = new TextReplace(eventEmitter);
    logger.trace('Created TextReplace');

    const characterCache = new CharacterCache(maps, iohook, eventEmitter);
    logger.trace('Created CharacterCache');

    try {
        iohook.start();
    } catch (err) {
        quitError(err);
    }
    logger.info('Started iohook listener');
});

// Exports
