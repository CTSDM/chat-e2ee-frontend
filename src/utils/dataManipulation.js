function objArrToUint8Arr(obj) {
    const arr = Object.values(obj);
    return new Uint8Array(arr);
}

function objToArrBuffer(obj) {
    const enc = new TextEncoder();
    const arrUint8 = enc.encode(JSON.stringify(obj));
    return arrUint8.buffer;
}

function stringToArrBuffer(str) {
    const enc = new TextEncoder();
    const arrUint8 = enc.encode(str);
    return arrUint8.buffer;
}

function ArrBufferToJSON(arrBuffer) {
    return JSON.stringify(Array.from(new Uint8Array(arrBuffer)));
}

function UintArrToJson(arr8) {
    return JSON.stringify(Array.from(arr8));
}

function getLengthArrofArr(arrOfArr) {
    return arrOfArr.reduce((acc, arr) => acc + arr.length, 0);
}

function getHrefsInfo(obj, isLogged) {
    const stateObj = isLogged ? obj.loggedIn : obj.loggedOut;
    const entries = Object.entries(stateObj);
    return entries;
}

function getDateFormatted(date) {
    let minutes = date.getMinutes();
    let hours = date.getHours();
    if (minutes <= 9) minutes = "0" + minutes;
    if (hours <= 9) hours = "0" + hours;
    return hours + ":" + minutes;
}

function hexStringToUint8Array(hex) {
    const byteArray = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        byteArray[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return byteArray;
}

export default {
    getLengthArrofArr,
    ArrBufferToJSON,
    UintArrToJson,
    getHrefsInfo,
    getDateFormatted,
    objArrToUint8Arr,
    objToArrBuffer,
    hexStringToUint8Array,
    stringToArrBuffer,
};
