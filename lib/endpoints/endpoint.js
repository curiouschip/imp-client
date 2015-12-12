var PacketWriter    = require('../packet_writer'),
    k               = require('../constants');

module.exports = Endpoint;

function Endpoint(imp, endpoint) {
    this.imp = imp;
    this.endpoint = endpoint;
}

Endpoint.prototype.name = '(unknown)';
Endpoint.prototype.describable = true;

Endpoint.prototype.describe = function(cb) {
    if (!this.describable) {
        setTimeout(cb, 0);
        return;
    }
    var pw = this.newPacket(), self = this;
    pw.writeMessage(this.endpoint, k.ENDPOINT_MASTER_RESOURCE, k.ACTION_DESCRIBE);
    this.request(pw, function(err, response) {
        if (err) {
            if (cb) cb(err);
            return;
        }
        var message = response.firstMessage();
        if (message.isError) {
            cb(message);
        } else {
            self._handleDescribe(message);
            cb();
        }
    });
}

Endpoint.prototype._handleDescribe = function(message) {}

Endpoint.prototype.request = function(packet, cb) {
    this.imp.request(packet, cb);
}

Endpoint.prototype.newPacket = function() {
    return new PacketWriter();
}
