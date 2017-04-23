// Node imports


// External imports
const robot = require('robotjs');
const {copy, paste} = require('copy-paste');
const {BrowserWindow, ipcMain} = require('electron');
const ejs = require('ejs');

// Internal imports

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
    return htmlString;
}
function generateForm(map) {
    let htmlString = `<form name="expansionForm" id="expansionForm" novalidate>`
    for(let name in map.options) {
        htmlString += generateElement(name, map.options[name]);
    }
    htmlString += `<div class="row"><div class="col s12"><button class="btn waves-effect waves-light text-expansion-btn" name="action">Expand<i class="material-icons right">send</i></button></div></div></form>`;
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
    }
    replaceText(alias, map) {
        if(this.currentlyExpanding === false) {
            this.currentlyExpanding = true;
            const argumentCallback = function(options) {
                let expansion;
                try {
                    expansion = ejs.render(map.expansion, {options: options, vars: map.vars});
                } catch (e) {
                    console.error(e);
                    this.eventEmitter.emit('finished');
                    this.currentlyExpanding = false;
                    return;
                }
                setTimeout(() => {
                    for(let i = 0; i < alias.length; i++) {
                        robot.keyTap('backspace');
                    }
                    paste((error, contents) => {
                        copy(expansion, () => {
                            robot.keyTap('v', 'control');
                            setTimeout(() => {
                                if(contents) {
                                    copy(contents);
                                }
                                this.eventEmitter.emit('finished');
                                this.currentlyExpanding = false;
                            }, 20);
                        });
                    });
                }, 100);
            }.bind(this);
            if(map.options) {
                this.getArguments(map, argumentCallback);
            } else {
                argumentCallback();
            }
        }
    }

    getArguments(map, callback) {
        this.win = new BrowserWindow();
        const closeHandler = () => {
            this.currentlyExpanding = false;
            this.eventEmitter.emit('finished');
            this.win = null;
        }
        this.win.on('closed', closeHandler);
        this.win.loadURL(generateDataURI(map));
        ipcMain.once('expansion-data', (event, args) => {
            this.win.removeListener('closed', closeHandler);
            this.win.on('closed', () => {
                this.win = null;
            })
            this.win.close();
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
            callback(args);
        });
    }
}

// Exports

module.exports = TextReplace;
