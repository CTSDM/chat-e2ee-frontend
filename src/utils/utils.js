import { env } from "../../config/config";
import styles from "../components/InputComp.module.css";

function checkLength(value, type, msgArr) {
    const min = env.validation.users[type].minLength;
    const max = env.validation.users[type].maxLength;
    if (value.length < min || value.length > max) {
        msgArr.push(`The ${type} should be between ${min} and ${max} characters.`);
    }
}

function checkRegExp(value, type, msgArr) {
    const reg = new RegExp(String.raw`${env.validation.users[type].regex}`);
    if (!reg.test(value)) {
        msgArr.push(env.validation.users[type].message);
    }
}

function checkWhiteSpaces(value, type, msgArr) {
    if (/\s/.test(value)) {
        msgArr.push(`The ${type} cannot contain white spaces.`);
    }
}

function checkAlphanumerical(value, msgArr) {
    for (let i = 0; i < value.length; ++i) {
        let code = value.charCodeAt(i);
        if (!(code > 47 && code < 58) && !(code > 64 && code < 91) && !(code > 96 && code < 123)) {
            msgArr.push("The username can only be composed of letter and numbers.");
        }
    }
}

function checkUsername(value, msgArr) {
    checkLength(value, "username", msgArr);
    checkWhiteSpaces(value, "username", msgArr);
    checkRegExp(value, "username", msgArr);
    checkAlphanumerical(value, msgArr);
}

function checkPassword(value, msgArr) {
    checkLength(value, "password", msgArr);
    checkWhiteSpaces(value, "password", msgArr);
    checkRegExp(value, "password", msgArr);
}

function handleChangeUsername(setMsgArr, value, element, msgArr) {
    // The msgArr is composed of 3 arrays: users, password and repassword
    const userArr = [];
    checkUsername(value, userArr);
    if (userArr.length > 0) {
        element.classList.add(styles.wrong);
        element.classList.remove(styles.correct);
    } else {
        element.classList.add(styles.correct);
        element.classList.remove(styles.wrong);
    }
    msgArr[0] = userArr;
    setMsgArr(msgArr);
    return;
}

function handleChangePassword(setMsgArr, value, element, msgArr) {
    const passwordArr = [];
    checkPassword(value, passwordArr);
    if (passwordArr.length > 0) {
        element.classList.add(styles.wrong);
        element.classList.remove(styles.correct);
    } else {
        element.classList.add(styles.correct);
        element.classList.remove(styles.wrong);
    }
    msgArr[1] = passwordArr;
    setMsgArr(msgArr);
    return;
}

function handleChangeRePassword(setMsgArr, value, element, msgArr) {
    const rePasswordArr = [];
    // we only check that the password confirmation matches the passwor
    const passwordInput = document.querySelector("#input-password");
    if (passwordInput.classList.contains(styles.correct)) {
        if (value.length >= 0 && value !== passwordInput.value) {
            element.classList.add(styles.wrong);
            element.classList.remove(styles.correct);
            rePasswordArr.push("The passwords do not match");
        } else {
            element.classList.add(styles.correct);
            element.classList.remove(styles.wrong);
        }
    } else {
        element.classList.remove(styles.correct);
        element.classList.remove(styles.wrong);
    }
    msgArr[2] = rePasswordArr;
    setMsgArr(msgArr);
    return;
}

function curriedHandler(f) {
    return function (setMsgArr, msgArr) {
        return function (event) {
            const input = event.currentTarget;
            const value = input.value;
            return f(setMsgArr, value, input, msgArr.slice(), event);
        };
    };
}

function getHrefsInfo(obj, isLogged) {
    const stateObj = isLogged ? obj.loggedIn : obj.loggedOut;
    const entries = Object.entries(stateObj);
    return entries;
}

const checkFunctions = {
    username: handleChangeUsername,
    password: handleChangePassword,
};

export function getLengthArrofArr(arrOfArr) {
    return arrOfArr.reduce((acc, arr) => acc + arr.length, 0);
}

export function getDateFormatted(date) {
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

export function validateData(submission) {
    const messages = [];
    if (submission.content.length === 0) {
        messages.push("The comment can't be empty");
    }
    if (typeof +submission.postId !== "number") {
        messages.push("Something went wrong with the post identifier, please refresh the page.");
    }
    return messages;
}

function JSONtoArrBuffer(jsonString) {}

function ArrBufferToJSON(arrBuffer) {
    return JSON.stringify(Array.from(new Uint8Array(arrBuffer)));
}

function UintArrToJson(arr8) {
    return JSON.stringify(Array.from(arr8));
}

export default {
    curriedHandler,
    handleChangeUsername,
    checkFunctions,
    validateData,
    JSONtoArrBuffer,
    ArrBufferToJSON,
    UintArrToJson,
};

export { checkUsername, checkPassword, getHrefsInfo };
