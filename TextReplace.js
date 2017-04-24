// Node imports


// External imports
const robot = require('robotjs');
const {copy, paste} = require('copy-paste');
const {BrowserWindow, ipcMain} = require('electron');
const ejs = require('ejs');

// Internal imports
const logger = require('./logger.js');
// Constants


// Application
// let win;

function generateElement(name, option) {
    let htmlString = '<div class="row"><div class="input-field col s12">';
    if(option.type.toLowerCase() === 'string' || option.type.toLowerCase() === 'number') {
        if(option.selection) {
            htmlString += `<select id="${name}" name="${name}" ${option.multiple ? 'multiple ' : ''}${option.required ? 'required ' : ''}>`;
            option.selection.forEach(e => {
                htmlString += `<option value="${e}">${e}</option>`;
            });
            htmlString += `</select>`;
        } else {
            htmlString += `<input class="single-data" type="${option.type.toLowerCase() === 'string' ? 'text' : 'number'}" id="${name}" name="${name}" ${option.required ? 'required ' : ''}>`;
        }
    } else if(option.type.toLowerCase() === 'date') {
        htmlString += `<input type="date" class="datepicker" id="${name}" name="${name}" ${option.required ? 'required ' : ''}>`;
    } else if(option.type.toLowerCase() === 'boolean') {
        htmlString += `<input type="checkbox" class="boolean-data" id="${name}" name="${name}" ${option.required ? 'required ' : ''}>`
    }
    htmlString += `<label for="${name}">${option.name}</label></div></div>`;
    logger.trace({htmlString, name, option}, 'Created element for option');
    return htmlString;
}
function generateForm(map) {
    let htmlString = `<form name="expansionForm" id="expansionForm" novalidate>`
    for(let name in map.options) {
        htmlString += generateElement(name, map.options[name]);
    }
    htmlString += `<div class="row"><div class="col s12"><button class="btn waves-effect waves-light text-expansion-btn" name="action">Expand<i class="material-icons right">send</i></button></div></div></form>`;
    logger.trace({htmlString}, 'Created form');
    return htmlString;
}

function generateHTML(map) {
    return `
    <html>
    <head>
    <title>${map.name}</title>
    <link href="http://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.98.2/css/materialize.min.css">
    </head>
    <body>
    ${generateForm(map)}
    <script>window.$ = window.jQuery = require('${__dirname}/node_modules/jquery/dist/jquery.min.js');</script>
    <script>window.Hammer = require('${__dirname}/node_modules/hammerjs/hammer.min.js');</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.98.2/js/materialize.min.js"></script>
    <script>require('${__dirname}/static/form.js');</script>
    </body>
    </html>`
}
function generateDataURI(map) {
    return `data:text/html;charset=utf-8,${encodeURI(generateHTML(map))}`;
}

class TextReplace {
    constructor (eventEmitter) {
        robot.setKeyboardDelay(1);
        this.eventEmitter = eventEmitter;
        this.currentlyExpanding = false;
        this.eventEmitter.on('expansion', this.replaceText.bind(this));
        logger.debug('Finished TextReplace event registration');
    }
    replaceText(alias, map) {
        if(this.currentlyExpanding === false) {
            this.currentlyExpanding = true;
            logger.info({alias, map}, 'Received expansion event. Locked.');
            const argumentCallback = function(options) {
                let expansion;
                try {
                    expansion = ejs.render(map.expansion, {options: options, vars: map.vars});
                } catch (err) {
                    logger.error({err});
                    this.eventEmitter.emit('finished');
                    this.currentlyExpanding = false;
                    return;
                }
                logger.debug({expansion}, 'EJS parsed expansion successfully');
                setTimeout(() => {
                    for(let i = 0; i < alias.length; i++) {
                        robot.keyTap('backspace');
                    }
                    paste((error, contents) => {
                        copy(expansion, () => {
                            robot.keyTap('v', 'control');
                            logger.info('Finished expanding snippet');
                            setTimeout(() => {
                                if(contents) {
                                    copy(contents);
                                }
                                logger.debug('Sending finished event. Unlocked.');
                                this.eventEmitter.emit('finished');
                                this.currentlyExpanding = false;
                            }, 20);
                        });
                    });
                }, 100);
            }.bind(this);
            if(map.options) {
                logger.debug('Map options specified. Using getArguments');
                this.getArguments(map, argumentCallback);
            } else {
                logger.debug('Map options not found. Using quick route');
                argumentCallback(undefined);
            }
        }
    }

    getArguments(map, callback) {
        let ipcHandler, closeHandler;
        ipcHandler = (event, args) => {
            logger.debug({args}, 'Received expansion information from BrowserWindow');
            this.win.removeListener('closed', closeHandler);
            this.win.once('closed', () => {
                this.win = null;
            });
            try {
                this.win.close();
            } catch (err) {
                logger.error({err});
                return;
            }
            for(let x in args) {
                const schemaElement = map.options[x];
                const type = schemaElement.type;
                if(type.toLowerCase() === 'number') {
                    if(Array.isArray(args[x])) {
                        args[x].forEach((e, i) => {
                            args[x][i] = Number.parseFloat(e);
                        });
                    } else {
                        args[x] = Number.parseFloat(args[x]);
                    }
                } else if(type.toLowerCase() === 'date') {
                    args[x] = new Date(args[x]);
                }
            }
            logger.debug({args}, 'Finished type conversions');
            callback(args);
        }
        closeHandler = () => {
            this.win = null;
            ipcMain.removeListener('expansion-data', ipcHandler);
            this.currentlyExpanding = false;
            this.eventEmitter.emit('finished');
        }
        try {
            this.win = new BrowserWindow();
            this.win.once('closed', closeHandler);
            this.win.loadURL(generateDataURI(map));
            ipcMain.once('expansion-data', ipcHandler);
            logger.info('Requesting expansion data from user');
        } catch (err) {
            logger.error({err});
            this.currentlyExpanding = false;
            this.eventEmitter.emit('finished');
            ipcMain.removeListener('expansion-data', ipcHandler);
            this.win.removeListener('closed', closeHandler);
            try {
                this.win.close();
            } catch (err) {
                logger.error({err});
                return;
            }
            this.win = null;
        }
    }
}

// Exports

module.exports = TextReplace;
