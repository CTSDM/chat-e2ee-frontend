import { env } from "../../config/config.js";

async function getLogin(controller) {
    const url = `${env.serverUrl}/login`;
    const response = await fetch(url, {
        signal: controller.signal,
        mode: "cors",
        credentials: "include",
        method: "get",
    });
    if (response.ok) {
        const json = await response.json();
        return {
            status: response.status,
            username: json.username,
        };
    }
    return { status: response.status };
}

async function submitLogin(data) {
    const url = `${env.serverUrl}/login`;
    const response = await fetch(url, {
        mode: "cors",
        credentials: "include",
        method: "post",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
        },
    });
    const userData = await response.json();
    return { status: response.status, ...userData };
}

async function submitSignup(data) {
    const url = `${env.serverUrl}/signup`;
    const response = await fetch(url, {
        mode: "cors",
        credentials: "include",
        method: "post",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (response.ok) {
        return { status: response.status };
    } else {
        const json = await response.json();
        return { status: response.status, data: json };
    }
}

async function getPublicKey(data) {
    const url = `${env.serverUrl}/users/keys`;
    const response = await fetch(url, {
        mode: "cors",
        credentials: "include",
        method: "post",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (response.ok) {
        const json = await response.json();
        return { status: response.status, publicKey: json.publicKey };
    } else if (response.status === 400) {
        const json = await response.json();
        return { status: response.status, errMsg: json.errMsg };
    } else {
        return { status: response.status };
    }
}

export default { getLogin, submitSignup, submitLogin, getPublicKey };
