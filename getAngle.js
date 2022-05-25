let mavPort = null;
let mavPortNum = 'COM18';
let mavBaudrate = '115200';

const unit = 0.02197265625;
let strFromGimbal = '';

var SerialPort = require('serialport');

function mavPortOpening() {
    if (mavPort == null) {
        mavPort = new SerialPort(mavPortNum, {
            baudRate: parseInt(mavBaudrate, 10),
        });

        mavPort.on('open', mavPortOpen);
        mavPort.on('close', mavPortClose);
        mavPort.on('error', mavPortError);
        mavPort.on('data', mavPortData);

    } else {
        if (mavPort.isOpen) {

        } else {
            mavPort.open();
        }
    }
}

function mavPortSend() {
    let sendData = Buffer.from('3E3D003D00', 'hex');
    if (mavPort !== null) {
        mavPort.write(sendData, (err) => {
            if (err)
                return console.log('Error on write: ', err.message);
            // console.log('Data Send...');
        });
    }
    else {
        setTimeout(mavPortOpening, 2000);
    }
};
setInterval(mavPortSend, 100);

function mavPortOpen() {
    console.log('mavPort open. ' + mavPortNum + ' Data rate: ' + mavBaudrate);
}

function mavPortClose() {
    console.log('mavPort closed.');

    setTimeout(mavPortOpening, 2000);
}

function mavPortError(error) {
    var error_str = error.toString();
    console.log('[mavPort error]: ' + error.message);
    if (error_str.substring(0, 14) == "Error: Opening") {

    } else {
        console.log('mavPort error : ' + error);
    }

    setTimeout(mavPortOpening, 2000);
}

function mavPortData(data) {
    strFromGimbal += data.toString('hex').toLowerCase();

    if (strFromGimbal.length > 118) {
        let index = 8;
        let header = strFromGimbal.substring(0, index);;
        let roll = strFromGimbal.substring(index, index + 36);
        index += 36;
        let pitch = strFromGimbal.substring(index, index + 36);
        index += 36;
        let yaw = strFromGimbal.substring(index, index + 36);

        if (header === '3e3d3673') {
            let rollImuAngle = roll.substring(0, 4);
            rollImuAngle = Buffer.from(rollImuAngle, 'hex').readInt16LE() * unit;
            // console.log('rollImuAngle: ', rollImuAngle);

            let rollRcTargetAngle = roll.substring(4, 8);
            rollRcTargetAngle = Buffer.from(rollRcTargetAngle, 'hex').readInt16LE() * unit;
            // console.log('rollRcTargetAngle: ', rollRcTargetAngle);

            let rollStatorRelAngle = roll.substring(8, 16);
            rollStatorRelAngle = Buffer.from(rollStatorRelAngle, 'hex').readInt32LE() * unit;
            console.log('rollStatorRelAngle: ', rollStatorRelAngle);

            let pitchImuAngle = pitch.substring(0, 4);
            pitchImuAngle = Buffer.from(pitchImuAngle, 'hex').readInt16LE() * unit;
            // console.log('pitchImuAngle: ', pitchImuAngle);

            let pitchRcTargetAngle = pitch.substring(4, 8);
            pitchRcTargetAngle = Buffer.from(pitchRcTargetAngle, 'hex').readInt16LE() * unit;
            // console.log('pitchRcTargetAngle: ', pitchRcTargetAngle);

            let pitchStatorRelAngle = pitch.substring(8, 16);
            pitchStatorRelAngle = Buffer.from(pitchStatorRelAngle, 'hex').readInt32LE() * unit;
            console.log('pitchStatorRelAngle: ', pitchStatorRelAngle);

            let yawImuAngle = yaw.substring(0, 4);
            yawImuAngle = Buffer.from(yawImuAngle, 'hex').readInt16LE() * unit;
            // console.log('yawImuAngle: ', yawImuAngle);

            let yawRcTargetAngle = yaw.substring(4, 8);
            yawRcTargetAngle = Buffer.from(yawRcTargetAngle, 'hex').readInt16LE() * unit;
            // console.log('yawRcTargetAngle: ', yawRcTargetAngle);

            let yawStatorRelAngle = yaw.substring(8, 16);
            yawStatorRelAngle = Buffer.from(yawStatorRelAngle, 'hex').readInt32LE() * unit;
            console.log('yawStatorRelAngle: ', yawStatorRelAngle);
            console.log('----------------------------');
            strFromGimbal = '';
        }
        else {
            strFromGimbal = strFromGimbal.substr(2);
        }
    }
}

mavPortOpening()
