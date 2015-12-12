var k           = require('../constants'),
    Endpoint    = require('./endpoint'),
    util        = require('util');

module.exports = PWM8;
util.inherits(PWM8, Endpoint);

function PWM8() {
    Endpoint.apply(this, arguments);
}

PWM8.prototype.name = 'pwm8';
PWM8.prototype.describable = true;

PWM8.prototype._handleDescribe = function(response) {
    this.pwmCount = response.body.readUInt8(0);
}

PWM8.prototype.write = function(pin, value, cb) {
    var packet = this.newPacket();
    packet.startMessage(this.endpoint, pin+1, k.ACTION_WRITE);
    packet.writeUInt8(value);
    packet.endMessage();
    this.request(packet, cb);
}
