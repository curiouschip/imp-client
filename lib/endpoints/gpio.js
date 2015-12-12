var k           = require('../constants'),
    Endpoint    = require('./endpoint'),
    util        = require('util');

module.exports = GPIO;
util.inherits(GPIO, Endpoint);

function GPIO() {
    Endpoint.apply(this, arguments);
    this.gpioCount = null;
}

GPIO.prototype.name = 'gpio';

GPIO.prototype._handleDescribe = function(response) {
    this.gpioCount = response.body.readUInt8(0);
}

GPIO.prototype.setMode = function(pin, mode, cb) {
    var packet = this.newPacket();
    packet.startMessage(this.endpoint, pin+1, k.ACTION_CONFIGURE);
    packet.writeUInt8(mode);
    packet.endMessage();
    this.request(packet, cb);
}

GPIO.prototype.write = function(pin, value, cb) {
    var packet = this.newPacket();
    packet.startMessage(this.endpoint, pin+1, k.ACTION_WRITE);
    packet.writeUInt8(value ? 1 : 0);
    packet.endMessage();
    this.request(packet, cb);
}

GPIO.prototype.read = function(pin, cb) {
    var decoder = null;
    if (cb) {
        decoder = function(err, packet) {
            if (err) {
                cb(err);
            } else {
                var msg = packet.firstMessage();
                cb(null, msg.body.readUInt8(0) ? true : false);
            }
        }
    }
    var packet = this.newPacket();
    packet.writeMessage(this.endpoint, pin+1, k.ACTION_READ);
    this.request(packet, decoder);
}
