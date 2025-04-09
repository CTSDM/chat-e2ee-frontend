import { env } from "../../config/config.js";

async function getLogin(controller) {
    const url = `${env.serverUrl}/login`;
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            mode: "cors",
            credentials: "include",
            method: "get",
        });
        if (response.ok) {
            const userData = await response.json();
            return { status: response.status, ...userData };
        }
        return { status: response.status };
    } catch {
        return;
    }
}

async function submitLogin(data) {
    const url = `${env.serverUrl}/login`;
    try {
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
    } catch (err) {
        console.log(err);
        return { message: "The server looks like is down, please try again later." };
    }
}

async function submitSignup(data) {
    const url = `${env.serverUrl}/signup`;
    try {
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
    } catch {
        return { message: "The server looks like is down, please try again later." };
    }
}

async function getPublicKey(endPoint, user) {
    const url = `${env.serverUrl}/${endPoint}/${user}/keys`;
    try {
        const response = await fetch(url, {
            mode: "cors",
            credentials: "include",
            method: "get",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.ok) {
            const json = await response.json();
            return {
                status: response.status,
                ...json,
            };
        } else if (response.status === 400) {
            const json = await response.json();
            return { status: response.status, errMsg: json.errMsg };
        } else {
            return { status: response.status };
        }
    } catch {
        return { message: "The server looks like is down, please try again later." };
    }
}

async function submitLogout(controller) {
    const url = `${env.serverUrl}/logout`;
    try {
        const response = await fetch(url, {
            mode: "cors",
            method: "post",
            credentials: "include",
            signal: controller.signal,
        });
        return response;
    } catch {
        return { message: "The server looks like is down, please try again later." };
    }
}

export default { getLogin, submitSignup, submitLogin, submitLogout, getPublicKey };
