const mavlink = require('./mavlibrary/mavlink.js');
const MAVLink20Processor = require('./mavlibrary/mavlink20.js');

let mavPort = null;
let mavPortNum = 'COM18';
let mavBaudrate = '115200';

let my_system_id = 1;

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


let heartbeat_msg = '';

let mavData = {};
mavData.Pitch_angle = 0;
mavData.Yaw_angle = 0;
mavData.Pitch_rate = 0;
mavData.Yaw_rate = 0;
mavData.Gimbal_manager_flags = 0;
mavData.Gimbal_device_ID = 0;

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
            // let rollImuAngle = roll.substring(0, 4);
            // rollImuAngle = Buffer.from(rollImuAngle, 'hex').readInt16LE() * unit;
            // console.log('rollImuAngle: ', rollImuAngle);
            // let rollRcTargetAngle = roll.substring(4, 8);
            // rollRcTargetAngle = Buffer.from(rollRcTargetAngle, 'hex').readInt16LE() * unit;
            // console.log('rollRcTargetAngle: ', rollRcTargetAngle);

            let rollStatorRelAngle = roll.substring(8, 16);
            rollStatorRelAngle = Buffer.from(rollStatorRelAngle, 'hex').readInt32LE() * unit;
            console.log('rollStatorRelAngle: ', rollStatorRelAngle);

            // let pitchImuAngle = pitch.substring(0, 4);
            // pitchImuAngle = Buffer.from(pitchImuAngle, 'hex').readInt16LE() * unit;
            // console.log('pitchImuAngle: ', pitchImuAngle);
            // let pitchRcTargetAngle = pitch.substring(4, 8);
            // pitchRcTargetAngle = Buffer.from(pitchRcTargetAngle, 'hex').readInt16LE() * unit;
            // console.log('pitchRcTargetAngle: ', pitchRcTargetAngle);

            let pitchStatorRelAngle = pitch.substring(8, 16);
            pitchStatorRelAngle = Buffer.from(pitchStatorRelAngle, 'hex').readInt32LE() * unit;
            console.log('pitchStatorRelAngle: ', pitchStatorRelAngle);

            // let yawImuAngle = yaw.substring(0, 4);
            // yawImuAngle = Buffer.from(yawImuAngle, 'hex').readInt16LE() * unit;
            // console.log('yawImuAngle: ', yawImuAngle);
            // let yawRcTargetAngle = yaw.substring(4, 8);
            // yawRcTargetAngle = Buffer.from(yawRcTargetAngle, 'hex').readInt16LE() * unit;
            // console.log('yawRcTargetAngle: ', yawRcTargetAngle);

            let yawStatorRelAngle = yaw.substring(8, 16);
            yawStatorRelAngle = Buffer.from(yawStatorRelAngle, 'hex').readInt32LE() * unit;
            console.log('yawStatorRelAngle: ', yawStatorRelAngle);

            if (-50 < pitchStatorRelAngle < 95 && -300 < yawStatorRelAngle < 300) {
                mavData.Pitch_angle = pitchStatorRelAngle;
                mavData.Yaw_angle = yawStatorRelAngle;


                setTimeout(createMAVLinkData, 1, my_system_id, mavData);
            }

            console.log('----------------------------');
            strFromGimbal = '';

        }
        else {
            strFromGimbal = strFromGimbal.substr(2);
        }
    }
}

function createMAVLinkData(sys_id, mavdata) {
    // 






    // #0, HEARTBEAT
    let params = {}
    params.target_system = sys_id;
    params.target_component = 1;
    params.type = 6;
    params.autopilot = 8; // MAV_AUTOPILOT_INVALID
    params.base_mode = 128;
    params.custom_mode = 0;
    params.system_status = 3;
    params.mavlink_version = 1;

    try {
        heartbeat_msg = mavlinkGenerateMessage(params.target_system, params.target_component, mavlink.MAVLINK_MSG_ID_HEARTBEAT, params);
        if (heartbeat_msg == null) {
            console.log("mavlink message(MAVLINK_MSG_ID_HEARTBEAT) is null");
        } else {
            // console.log(heartbeat_msg)
        }
    } catch (ex) {
        console.log('[ERROR (HEARTBEAT)] ' + ex);
    }
    send_aggr_to_Mobius(my_cnt_name, heartbeat_msg.toString('hex'), 1000);
    mqtt_client.publish(my_cnt_name, Buffer.from(heartbeat_msg, 'hex'));
}

function mavlinkGenerateMessage(src_sys_id, src_comp_id, type, params) {
    const mavlinkParser = new MAVLink(null/*logger*/, src_sys_id, src_comp_id);
    try {
        var mavMsg = null;
        var genMsg = null;

        switch (type) {
            case mavlink.MAVLINK_MSG_ID_HEARTBEAT:
                mavMsg = new mavlink.messages.heartbeat(params.type,
                    params.autopilot,
                    params.base_mode,
                    params.custom_mode,
                    params.system_status,
                    params.mavlink_version
                );
                break;
        }
    } catch (e) {
        console.log('MAVLINK EX:' + e);
    }

    if (mavMsg) {
        genMsg = Buffer.from(mavMsg.pack(mavlinkParser));
        //console.log('>>>>> MAVLINK OUTGOING MSG: ' + genMsg.toString('hex'));
    }

    return genMsg;
}

var aggr_content = {};

function send_aggr_to_Mobius(topic, content_each, gap) {
    if (aggr_content.hasOwnProperty(topic)) {
        var timestamp = moment().format('YYYY-MM-DDTHH:mm:ssSSS');
        aggr_content[topic][timestamp] = content_each;
    } else {
        aggr_content[topic] = {};
        timestamp = moment().format('YYYY-MM-DDTHH:mm:ssSSS');
        aggr_content[topic][timestamp] = content_each;

        setTimeout(function () {
            sh_adn.crtci(topic + '?rcn=0', 0, aggr_content[topic], null, function () {

            });

            delete aggr_content[topic];
        }, gap, topic);
    }
}

mavPortOpening()