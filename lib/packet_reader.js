var k = require('./constants');
var Buffer = require('buffer/').Buffer;

module.exports = PacketReader;

var EMPTY = new Buffer(0);

function Message(endpoint, resource, actionStatus, errorCode, body) {
    this.endpoint = endpoint;
    this.resource = resource;
    this.action = actionStatus;
    this.status = actionStatus;
    this.errorCode = errorCode;
    this.body = body;
    this.length = body.length;
    this.isError = (actionStatus & k.MASK_ERROR) === k.MASK_ERROR;
}

function PacketReader(buf) {
    this.error = false;
    this._buffer = buf;
    
    // size must be multiple of 4
    if (buf.length & 0x03) {
        this._error = "packet size is not multiple of 4";
        return;
    }

    // packet ID must be correct
    if (buf.readUInt8(0) !== k.PACKET_ID_GENERAL) {
        this._error = "incorrect IMP packet ID";
        return;
    }
        
    // version must be correct
    if (buf.readUInt8(1) !== k.VERSION) {
        this._error = "incorrect IMP version";
        return;
    }

    // extract IDs
    var cid = buf.readUInt16BE(2);
    this.correlationId = cid & k.CORRELATION_ID_MASK;
    this.isReply = (cid & k.REPLY_BIT) > 0;
    this.noReply = (cid & k.NO_REPLY_BIT) > 0;

    // TODO: check message sizes fit within packet
}

PacketReader.prototype.firstMessage = function() {
    return this.messageAtOffset(8);
}

PacketReader.prototype.messageAtOffset = function(offset) {
    var buf         = this._buffer,
        endpoint    = buf.readUInt8(offset + 0),
        resource    = buf.readUInt8(offset + 1),
        action      = buf.readUInt8(offset + 2),
        length      = buf.readUInt8(offset + 3),
        errorCode   = null;

    if (action === k.STATUS_ERROR) {
        errorCode = length;
        length = 0;
    }

    var buffer = (length > 0)
                    ? buf.slice(offset + 4, offset + 4 + length)
                    : EMPTY;

    return new Message(
        endpoint,
        resource,
        action,
        errorCode,
        buffer
    );
}