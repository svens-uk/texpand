const keycode = require('keycode');
const keysym = require('keysym');

const acceptableCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`0123456789-=¬!"£$%^&*()_+[];\'#\\,./{}:@~|<>? ';

const conversionTable = {
    keysym: [
        'BackSpace',        'Tab',              'Return',
        'Shift_L',          'Control_L',        'Alt_L',
        'Pause',            'Caps_Lock',        'Escape',
        'space',            'Prior',            'Next',


        'End',              'Home',             'Left',
        'Up',               'Right',            'Down',
        'Insert',           'Delete',           'Super_L',
        'Super_L',          'Super_R',          'KP_Multiply',


        'KP_Add',           'KP_Subtract',      'KP_Decimal',
        'KP_Divide',        'Num_Lock',         'Scroll_Lock',
        null,               null,               'semicolon',
        'equal',            'comma',            'minus',


        'period',           'slash',            'grave',
        'bracketleft',      'backslash',        'bracketright',
        'apostrophe',       'Super_L',          'Shift_L',
        'Alt_L',            'Control_L',        'Super_L',

        'Control_L',        'Control_L',        'Alt_L',
        'Pause',            'Break',            'Caps_Lock',
        'Return',           'Escape',           'space',
        'Prior',            'Next',             'Insert',

        'Delete',           'Super_L'
    ],
    keycode: [
        'backspace',        'tab',              'enter',
        'shift',            'ctrl',             'alt',
        'pause/break',      'caps lock',        'esc',
        'space',            'page up',          'page down',


        'end',              'home',             'left',
        'up',               'right',            'down',
        'insert',           'delete',           'command',
        'left command',     'right command',    'numpad *',


        'numpad +',         'numpad -',         'numpad .',
        'numpad /',         'num lock',         'scroll lock',
        'my computer',      'my calculator',    ';',
        '=',                ',',                '-',


        '.',                '/',                '`',
        '[',                '\\',               ']',
        '\'',               'windows',          '⇧',
        '⌥',                '⌃',                '⌘',


        'ctl',              'control',          'option',
        'pause',            'break',            'caps',
        'return',           'escape',           'spc',
        'pgup',             'pgdn',             'ins',


        'del',              'cmd'
    ]
}
function keycodeToKeysym(keyCode) {
    const keyCodeAlias = keycode(keyCode);
    const keySymAlias = conversionTable.keysym[conversionTable.keycode.indexOf(keyCodeAlias)];
    const keySym = (keySymAlias ? keysym.fromName(keySymAlias).keysym : (keyCodeAlias ? keyCodeAlias.charCodeAt(0) : undefined));
    return keySym;
}
function keysymToKeycode(keySym) {
    const keySymObject = keysym.fromKeysym(keySym);
    const keySymAlias = (keySymObject ? keySymObject.names[0] : undefined);
    const keyCodeAlias = conversionTable.keycode[conversionTable.keysym.indexOf(keySymAlias)];
    const keyCode = (keyCodeAlias ? keycode(keyCodeAlias) : (keySymObject ? keycode(String.fromCharCode(keySymObject.unicode)) : undefined));
    return keyCode;
}

module.exports.keysymToKeycode = keysymToKeycode;
module.exports.keycodeToKeysym = keycodeToKeysym;
