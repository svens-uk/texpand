// Node imports
const {EventEmitter} = require('events');
const fs = require('fs');
const path = require('path');


// External imports
const CSON = require('cson');
const {app, BrowserWindow, globalShortcut} = require('electron');
const iohook = require('iohook');


// Internal imports
const CharacterCache = require('./CharacterCache.js');
const TextReplace = require('./TextReplace.js');


// Constants
const iconPath = path.join(__dirname, 'static', 'texpand.png');

// Application

// let win;
let appIcon;

// Wait for electron to be ready
app.on('ready', () => {
    // Create the base window
    win = new BrowserWindow({show: false});
    win.on('closed', () => {
        win = null;
    });
    const ret = globalShortcut.register('Shift+Tab+Q', () => {
        console.log('exit');
        app.quit();
        process.exit();
    });

    if (!ret) {
        console.log('registration failed');
        return;
    }


    // Register whole app closing event
    // app.on('window-all-closed', () => {
    //     app.quit();
    //     process.exit();
    // });
    // Read the configuration file
    const maps = CSON.load('ConfigurationFile.cson');

    const eventEmitter = new EventEmitter();

    const textReplace = new TextReplace(eventEmitter);

    const characterCache = new CharacterCache(maps, iohook, eventEmitter);

    iohook.start();
});

// Exports
