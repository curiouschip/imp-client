var k           = require('../constants'),
    Endpoint    = require('./endpoint'),
    util        = require('util');

module.exports = ADC16;
util.inherits(ADC16, Endpoint);

function ADC16() {
    Endpoint.apply(this, arguments);
    this.channelCount = null;
    this.bitDepth = null;
}

ADC16.prototype.name = 'adc16';
ADC16.prototype.describable = true;

ADC16.prototype._handleDescribe = function(response) {
    this.channelCount = response.body.readUInt8(0);
    this.bitDepth = response.body.readUInt8(1);
}

ADC16.prototype.read = function(channel, cb) {
    var decoder = null;
    if (cb) {
        decoder = function(err, packet) {
            if (err) return cb(err);
            var msg = packet.firstMessage();
            cb(msg.body.readUInt16BE(0));
        }
    }
    var packet = this.newPacket();
    packet.writeMessage(this.endpoint, channel+1, k.ACTION_READ);
    this.request(packet, decoder);
}
