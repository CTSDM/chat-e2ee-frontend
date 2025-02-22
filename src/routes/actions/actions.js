import requests from "../../utils/requests.js";
import cryptoUtils from "../../utils/crypto.js";

const actionLogin = async ({ request }) => {
    const data = await request.formData();
    const submission = {
        privateUsername: data.get("username"),
        password: data.get("password"),
    };
    const response = await requests.submitLogin(submission);
    return response;
};

const actionSignup = async ({ request }) => {
    const data = await request.formData();
    const keyPassword = data.get("keyPassword");
    const salt = cryptoUtils.getRandomValues(16);
    const iv = cryptoUtils.getRandomValues(12);
    const encryptionKey = await cryptoUtils.getEncryptionKey(keyPassword, salt);
    const [publicKey, privateKeyEncripted] = await cryptoUtils.getKeyPairPrivateEncrypted(
        encryptionKey,
        iv,
    );
    const submission = {
        username: data.get("username"),
        password: data.get("password"),
        publicKey: publicKey,
        privateKeyEncrypted: privateKeyEncripted,
        salt,
        iv,
    };
    return await requests.submitSignup(submission);
};

export { actionLogin, actionSignup };
