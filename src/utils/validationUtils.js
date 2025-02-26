import { env } from "../../config/config.js";
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

function curriedHandler(f) {
    return function (setMsgArr, msgArr) {
        return function (event) {
            const input = event.currentTarget;
            const value = input.value;
            return f(setMsgArr, value, input, msgArr.slice(), event);
        };
    };
}

const checkFunctions = {
    username: handleChangeUsername,
    password: handleChangePassword,
};

export default {
    curriedHandler,
    handleChangeUsername,
    checkFunctions,
};
