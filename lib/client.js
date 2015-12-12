var events          = require('events'),
    util            = require('util');

var k               = require('./constants'),
    PacketReader    = require('./packet_reader');

var ADC16           = require('./endpoints/adc16'),
    Device          = require('./endpoints/device'),
    GPIO            = require('./endpoints/gpio'),
    LCD             = require('./endpoints/lcd'),
    PWM8            = require('./endpoints/pwm8');

var endpointCtors = {};
endpointCtors[k.ENDPOINT_CLASS_GPIO]    = GPIO;
endpointCtors[k.ENDPOINT_CLASS_PWM8]    = PWM8;
endpointCtors[k.ENDPOINT_CLASS_PWM16]   = null;
endpointCtors[k.ENDPOINT_CLASS_ADC8]    = null;
endpointCtors[k.ENDPOINT_CLASS_ADC16]   = ADC16;
endpointCtors[k.ENDPOINT_CLASS_LCD]     = LCD;

module.exports = Client;
util.inherits(Client, events.EventEmitter);

function Client(transport) {
    this.transport = transport;
    this.endpoints = [new Device(this, 0)];
    this.endpointsByName = {};
    this.device = this.endpoints[0];
    
    this._handlers = {};
    this._error = false;
    this._nextCorrelationId = 1;

    var self = this;
    
    this.transport.onready = function() {
        self._inspect();
    }

    this.transport.onpacket = function(buffer) {
        console.log("packet", buffer);
        var reader = new PacketReader(buffer);
        if (reader.error) {
            // nothing we can do - corrupt packet means we can't parse it
            // to work out its correlation ID
            self.emit('error', {
                message: "couldn't parse response packet",
                packet: packet
            });
            return;
        }
        var cid = reader.correlationId,
            cb  = self._handlers[cid];
        if (cb) {
            delete self._handlers[cid];
            cb(null, reader);
        }
    }
}

Client.prototype.getEndpointByName = function(name) {
    if (!(name in this.endpointsByName)) {
        this.endpointsByName[name] = [];
        for (var i = 0; i < this.endpoints.length; ++i) {
            if (this.endpoints[i] && this.endpoints[i].name === name) {
                this.endpointsByName[name].push(this.endpoints[i]);
            }
        }
    }
    return this.endpointsByName[name][0];
}

Client.prototype.close = function() {
    this.transport.close();
}

Client.prototype.request = function(packet, cb) {
    if (this._nextCorrelationId === 16384) {
        this._nextCorrelationId = 1;
    }
    var cid = this._nextCorrelationId++;
    packet.setCorrelationId(cid);
    this.transport.send(packet.end().toBuffer());
    if (cb) {
        this._handlers[cid] = cb;
    }
}

Client.prototype._inspect = function() {
    var d = this.device;
    var self = this;

    d.getBufferSizes(function(err, bufferSizes) {
        d.getDeviceId(function(err, deviceId) {
            d.getProductString(function(err, productString) {
                d.getDeviceEndpoints(function(err, endpoints) {
                    d.getDeviceEndpointClasses(function(err, endpointClasses) {
                        
                        self.rxBufferSize   = bufferSizes.rx;
                        self.txBufferSize   = bufferSizes.tx;
                        self.vendorId       = deviceId.vendorId;
                        self.productId      = deviceId.productId;
                        self.serialNumber   = deviceId.serialNumber;
                        self.productString  = productString;

                        var endpointsToDescribe = [];
                        
                        for (var i = 0; i < endpoints.length; ++i) {
                            var eid     = endpoints[i],
                                ec      = endpointClasses[i],
                                ctor    = endpointCtors[ec];
                            
                            if (eid === 0) {
                                continue; // device endpoint
                            }
                            
                            if (typeof ctor === 'function') {
                                var endpoint = new ctor(self, eid);
                                self.endpoints[eid] = endpoint;
                                endpointsToDescribe.push(endpoint);
                            }
                        }

                        var pendingDescribes = endpointsToDescribe.length;

                        endpointsToDescribe.forEach(function(ep) {
                            ep.describe(function(err) {
                                if (err) {
                                    self.emit('error', err);
                                    return;
                                }

                                if (--pendingDescribes === 0) {
                                    self.emit('ready');
                                }
                            });
                        });
                    });
                });
            });
        });
    });
};
