var transport = require('imp-serial-transport')("/dev/tty.usbserial-A901JW58", {
    baudrate: 115200
});

var Client = require('../').Client;
var K = require('../').constants;

var client = new Client(transport);
client.on('ready', function() {
	console.log("client ready!");

	var gpio = client.getEndpointByName('gpio');
	// gpio.setMode(1, K.GPIO_MODE_OUTPUT);
	// gpio.write(1, false);
	// gpio.setMode(5, K.GPIO_MODE_OUTPUT);
	// gpio.write(5, true);

	var pwm = client.getEndpointByName('pwm8');
	// pwm.write(0, 0);

	var lcd = client.getEndpointByName('lcd');
	lcd.clear();
	lcd.setLine(0, "hello from");
	lcd.setLine(1, "javascript!");
	
	setTimeout(function() {
		lcd.clear();
		lcd.setLine(0, "this is awesome");
		lcd.setLine(1, "vroooooom");
	}, 1000);

	//console.log(gpio, pwm, lcd);

});