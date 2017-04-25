const bunyan = require('bunyan');
const path = require('path');

const minimist = require('minimist');
const argv = minimist(process.argv.slice(process.defaultApp ? 2 : 1));


function checkOrDefault(input, defaultValue, acceptableValues) {
    if(acceptableValues.includes(input)) {
        return input;
    } else {
        return defaultValue;
    }
}

const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

module.exports = bunyan.createLogger({
    name: 'texpand',
    serializers: {err: bunyan.stdSerializers.err},
    src: true,
    streams: [
        {
            level: checkOrDefault(argv.consolelevel, 'info', logLevels),
            stream: process.stdout
        },
        {
            level: checkOrDefault(argv.filelevel, 'info', logLevels),
            path: path.join(__dirname, argv.logfile || 'texpand.log')
        }
    ]
});
