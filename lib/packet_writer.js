var k = require('./constants');
var Buffer = require('buffer/').Buffer;

var DEFAULT_SIZE = 128;

module.exports = PacketWriter;

function PacketWriter(size) {
    var buf = Buffer.isBuffer(size)
                ? size
                : (new Buffer(size || DEFAULT_SIZE));

    buf.writeUInt8(k.PACKET_ID_GENERAL, 0); // 0 packet ID
    buf.writeUInt8(k.VERSION, 1); // protocol version
    buf.writeUInt16BE(0, 4); // source address
    buf.writeUInt16BE(0, 6); // destination address

    this.buffer = buf;
    this.length = 8; 
    this.correlationId = 0;
    this.reply = false;
    this.noReply = false;
    this.closed = false;
}

PacketWriter.prototype.setCorrelationId = function(id) {
    this.correlationId = id;
    return this;
}

PacketWriter.prototype.setReply = function(isReply) {
    this.reply = !!isReply;
    return this;
}

PacketWriter.prototype.setNoReply = function(noReply) {
    this.noReply = !!noReply;
    return this;
}

PacketWriter.prototype.end = function() {
    if (!this.closed) {
        var buf = this.buffer;
        var correlationId = this.correlationId & k.CORRELATION_ID_MASK;
        if (this.reply) correlationId |= k.REPLY_BIT;
        if (this.noReply) correlationId |= k.NO_REPLY_BIT;
        buf.writeUInt16BE(correlationId, 2);
        this.closed = true;
    }
    return this;
}

PacketWriter.prototype.toBuffer = function() {
    return this.buffer.slice(0, this.length);
}

PacketWriter.prototype.writeMessage = function(endpoint, resource, action) {
    var buf = this.buffer;
    buf.writeUInt8(endpoint, this.length++);
    buf.writeUInt8(resource, this.length++);
    buf.writeUInt8(action,   this.length++);
    buf.writeUInt8(0,        this.length++);
    return this;
}

PacketWriter.prototype.startMessage = function(endpoint, resource, action) {
    var buf = this.buffer;
    buf.writeUInt8(endpoint, this.length++);
    buf.writeUInt8(resource, this.length++);
    buf.writeUInt8(action,   this.length++);
    buf.writeUInt8(0,        this.length++);
    this._messageStart = this.length;
    return this;
}

PacketWriter.prototype.endMessage = function() {
    var buf = this.buffer;
    buf.writeUInt8(this.length - this._messageStart, this._messageStart - 1);
    while (this.length & 0x03)
        buf.writeUInt8(0x00, this.length++);
    return this;
}

PacketWriter.prototype.writeUInt8 = function(v) {
    this.buffer.writeUInt8(v, this.length);
    this.length++;
    return this;
}

PacketWriter.prototype.writeUInt16 = function(v) {
    this.buffer.writeUInt16BE(v, this.length);   
    this.length += 2;
    return this;
}

PacketWriter.prototype.writeUInt32 = function(v) {
    this.buffer.writeUInt32BE(v, this.length);
    this.length += 4;
    return this;
}

PacketWriter.prototype.writeInt8 = function(v) {
    this.buffer.writeInt8(v, this.length);
    this.length++;
    return this;
}

PacketWriter.prototype.writeInt16 = function(v) {
    this.buffer.writeInt16BE(v, this.length);
    this.length += 2;
    return this;
}

PacketWriter.prototype.writeInt32 = function(v) {
    this.buffer.writeInt32BE(v, this.length);
    this.length += 4;
    return this;
}
