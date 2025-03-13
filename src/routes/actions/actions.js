import requests from "../../utils/requests.js";
import { cryptoUtils } from "../../utils/utils.js";
import { env } from "../../../config/config.js";
import { dataManipulationUtils as dataManipulation } from "../../utils/utils.js";

const actionLogin = async ({ request }) => {
    const data = await request.formData();
    const submission = {
        privateUsername: data.get(env.inputs.login[0].name),
        password: data.get(env.inputs.login[1].name),
    };
    const response = await requests.submitLogin(submission);
    return response;
};

const actionSignup = async ({ request }) => {
    const data = await request.formData();
    const keyPassword = data.get("keyPassword");
    const salt = cryptoUtils.getRandomValues(16);
    const iv = cryptoUtils.getRandomValues(12);
    const algo = {
        name: "PBKDF2",
        salt: salt,
        iterations: env.crypto.iterations,
        hash: "SHA-256",
    };
    const encryptionKey = await cryptoUtils.getEncryptionKey(keyPassword, algo);
    const [publicKey, privateKeyEncrypted] = await cryptoUtils.getKeyPairPrivateEncrypted(
        encryptionKey,
        iv,
    );
    const submission = {
        privateUsername: data.get(env.inputs.signup[0].name),
        publicUsername: data.get(env.inputs.signup[1].name),
        password: data.get(env.inputs.signup[2].name),
        publicKey: publicKey,
        privateKeyEncrypted: privateKeyEncrypted,
        salt: dataManipulation.UintArrToJson(salt),
        iv: dataManipulation.UintArrToJson(iv),
    };
    return await requests.submitSignup(submission);
};

export { actionLogin, actionSignup };
