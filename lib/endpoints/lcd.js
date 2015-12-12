var k           = require('../constants'),
    Endpoint    = require('./endpoint'),
    util        = require('util');

module.exports = LCD;
util.inherits(LCD, Endpoint);

function LCD() {
    Endpoint.apply(this, arguments);
}

LCD.prototype.name = 'lcd';
LCD.prototype.describable = false;

LCD.prototype.clear = function(cb) {
	var decoder = null;
	if (cb) {
		decoder = function(err, packet) {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		}
	}
	var packet = this.newPacket();
	packet.writeMessage(this.endpoint, k.LCD_CLEAR, k.ACTION_CALL);
	this.request(packet, decoder);
}

LCD.prototype.setLine = function(line, str, cb) {
	var decoder = null;
	if (cb) {
		decoder = function(err, packet) {
			if (err) {
				cb(err);
			} else {
				cb(null);
			}
		}
	}
	var packet = this.newPacket();
	packet.startMessage(this.endpoint, k.LCD_SET_LINE, k.ACTION_CALL);
	packet.writeUInt8(line);
	var max = str.length;
	if (max > 16) max = 16;
	for (var i = 0; i < max; ++i) {
		packet.writeUInt8(str.charCodeAt(i));
	}
	while (i < 16) {
		packet.writeUInt8(32);
		i++;
	}
	packet.writeUInt8(0);
	packet.endMessage();
	this.request(packet, decoder);
}
