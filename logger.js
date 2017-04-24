const bunyan = require('bunyan');
const path = require('path');

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
            level: checkOrDefault(process.argv[2], 'trace', logLevels),
            stream: process.stdout
        },
        {
            level: checkOrDefault(process.argv[3], 'trace', logLevels),
            path: path.join(__dirname, 'texpand.log')
        }
    ]
});
