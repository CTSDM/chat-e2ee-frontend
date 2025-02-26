function objToArrBuffer(obj) {
    const arr = Object.values(obj);
    return new Uint8Array(arr);
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
    const currentTimems = new Date().getTime();
    const commentDatems = date.getTime();
    const diffInDays = (currentTimems - commentDatems) / 1000 / 60 / 60 / 24;
    if (diffInDays * 24 < 1) {
        // less than an hour
        const minutes = Math.floor(diffInDays * 24 * 60);
        return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInDays < 1) {
        // less than a day
        const hours = Math.floor(diffInDays * 24);
        return `${hours} ${hours > 1 ? "hours" : "hour"} ago`;
    } else if (diffInDays < 365) {
        // less than a year
        const days = Math.floor(diffInDays);
        return `${days} ${days > 1 ? "days" : "day"} ago`;
    } else {
        return date.toDateString();
    }
}

export default {
    getLengthArrofArr,
    ArrBufferToJSON,
    UintArrToJson,
    getHrefsInfo,
    getDateFormatted,
    objToArrBuffer,
};
