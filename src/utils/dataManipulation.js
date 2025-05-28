function objArrToUint8Arr(obj) {
    const arr = Object.values(obj);
    return new Uint8Array(arr);
}

function objToArrBuffer(obj) {
    const enc = new TextEncoder();
    const arrUint8 = enc.encode(JSON.stringify(obj));
    return arrUint8.buffer;
}

function stringToUint8Array(str, targetLength) {
    const enc = new TextEncoder();
    const arr = enc.encode(str);
    if (targetLength) {
        // we pad with array of 0 a new uint8array, in case it is needed
        return new Uint8Array([...new Array(targetLength - arr.length), ...arr]);
    } else {
        return arr;
    }
}

function arrBufferToString(arrBuffer) {
    const arr = new Uint8Array(arrBuffer);
    const strEncodedArr = arr.filter((value) => value !== 0);
    const dec = new TextDecoder();
    const str = dec.decode(strEncodedArr);
    return str;
}

function ArrBufferToJSON(arrBuffer) {
    return JSON.stringify(Array.from(new Uint8Array(arrBuffer)));
}

function Uint8ArrayToJSON(arr) {
    return JSON.stringify(Array.from(arr));
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

function getHoursMinutes(date) {
    let minutes = date.getMinutes();
    let hours = date.getHours();
    if (minutes <= 9) minutes = "0" + minutes;
    if (hours <= 9) hours = "0" + hours;
    return hours + ":" + minutes;
}

function getDateFormatted(date) {
    const currentTime = Date.now();
    const time = date.getTime();
    if (Math.abs(currentTime - time) <= 1000 * 60 * 60 * 24) {
        // at most 1 day of difference
        return getHoursMinutes(date);
    } else if (currentTime - time <= 1000 * 60 * 60 * 24 * 7) {
        // between 1 and 7 days of difference
        const weekday = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const dayIndex = date.getDay(); // 0 is Sunday
        return weekday[dayIndex];
    } else {
        return date.toLocalteDateString();
    }
}

function hexStringToUint8Array(hex) {
    const byteArray = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        byteArray[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return byteArray;
}

function Uint8ArrayToStr(arr) {
    const dec = new TextDecoder();
    return dec.decode(arr);
}

function xorArray(arr1, arr2) {
    const newArr = [];
    for (let i = 0; i < arr1.length; ++i) {
        newArr.push(arr1[i] ^ arr2[i]);
    }
    return new Uint8Array(newArr);
}

function addByteFlag(flag, arr, buff) {
    return new Uint8Array([flag, ...arr, ...new Uint8Array(buff)]).buffer;
}

function getNumFromBuffer(buff) {
    // the buffer is considered to be 1 byte
    const view = new DataView(buff);
    return view.getUint8(0);
}

function groupBuffers(buffArr) {
    const arr = [];
    for (let i = 0; i < buffArr.length; ++i) {
        arr.push(...new Uint8Array(buffArr[i]));
    }
    return new Uint8Array(arr).buffer;
}

function getDateFromBuffer(buff) {
    const dateStr = arrBufferToString(buff);
    return new Date(parseInt(dateStr));
}

export default {
    groupBuffers,
    getDateFromBuffer,
    getNumFromBuffer,
    addByteFlag,
    getLengthArrofArr,
    ArrBufferToJSON,
    UintArrToJson,
    getHrefsInfo,
    getHoursMinutes,
    objArrToUint8Arr,
    objToArrBuffer,
    hexStringToUint8Array,
    arrBufferToString,
    stringToUint8Array,
    Uint8ArrayToJSON,
    Uint8ArrayToStr,
    xorArray,
    getDateFormatted,
};
