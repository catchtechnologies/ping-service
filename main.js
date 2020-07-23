const argv = require('yargs').argv;
const repl = require('repl');
var Messaging = require('catch-messaging');
var pjson = require('./package.json');
var ping = require('ping');

var messaging;

/* Service Parameters*/
var serviceName = argv.serviceName || 'Ping Service';   //The serviceName parameter gets passed in from Service Node.
var timeout = argv.timeout || 2;
var hostsParameter = argv.hosts || '';
var debug = argv.debug;

// Sample commands for testing.
var serviceCommands = pjson.commands || [];

// Sample responses for testing.
var serviceResponses = pjson.responses || [];

/**
 * Prints the Service Name and a message to the console.
 * @param {string} message - The message to print.
 */
function log(message) {
  if (debug) {
    console.log(serviceName + ': ' + message);
  }
}

/* Initialize commands and responses */

try {
  if (argv.serviceCommands) {
    serviceCommands = JSON.parse(argv.serviceCommands);
  }
} catch (e) {
  log('Exception parsing serviceCommands: ' + e);
}

try {
  if (argv.serviceResponses) {
    serviceResponses = JSON.parse(argv.serviceResponses);
  }
} catch (e) {
  log('Exception parsing serviceResponses: ' + e);
}

/* Catch Messaging */
// This is where commands defined in package.json will arrive from catch-messaging.
messaging = new Messaging(serviceName, serviceCommands, serviceResponses, debug, (message) => {
  processCommand(message);
});

/* Command Line Interface */

repl.start({ prompt: '> ', eval: evaulateCliCommands });
function evaulateCliCommands(command, context, filename, callback) {
  processCommand(command);
  callback(null, 'OK');
}

/* Parse Service Commands */

function processCommand(command) {
  log('Processing command: ' + command);
  switch (command) {
    case 'pingHosts':
      pingHosts();
      break;
    default:
      if (command.includes('ping:')) {
        pingDirect(command);
      }
      break;
  }
}

/* Parent Process */

process.on("message", (data) => {
  if (data === 'catch-service-close') {
    log('Exiting on catch-service-close message received from parent process.');
    exit();
  }
});

/* Exit cleanly */

function exit() {
  log('Exiting');
  messaging.publish(serviceName + '.disconnected', null);
  setTimeout(() => messaging.exit(), 100);
  // Add any other pre-exit tasks here.
}

function exitHandler(options, exitCode) {
  if (options.cleanup) {
    log('exitHandler cleanup');
    exit();
  }
  if (exitCode || exitCode === 0) {
    log('exitHandler exitCode: ' + exitCode);
  }
  if (options.exit) {
    process.exit();
  }
}

// Do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

// Catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// Catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

// Catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));


/* Custom Service Code */
var hosts = hostsParameter.split(',');

function pingHosts() {
  log('Pinging hosts supplied from hosts parameter.');
  hosts.forEach((host) => {
    pingHost(host);
  });
}

function pingDirect(command) {
  command = command.split(':');
  if (command.length > 1) {
    log('Pinging hosts supplied from direct ping command.');
    var hosts = command[1].split(',');
    hosts.forEach((host) => {
      pingHost(host);
    });
  }
}

async function pingHost(host) {
  host = host.trim();
  if (host) {
    log('pinging ' + host)

    let res = await ping.promise.probe(host, {
      timeout: timeout
    });
    parsePingResponse(res);
  }
}

function parsePingResponse(res) {
  if (res.host) {
    if (res.alive) {
      publish('isAlive:' + res.host);
      return;
    }
    publish('isNotAlive:' + res.host);
  }
}

/**
 * Publish to catch-messaging. 
 * Looks for a match in package.json responses and publishes to the appropriate channel.
 * @param {string} message - The string to match in package.json responses.
 */
function publish(message) {
  messaging.publish(message);
}
