import { env } from "../../config/config.js";
import { dataManipulationUtils as dataManipulation } from "./utils.js";

async function getKeyMaterial(password) {
    const enc = new TextEncoder();
    return await window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
        "deriveBits",
        "deriveKey",
    ]);
}

async function deriveAESkey(keyMaterial, salt) {
    const key = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: env.crypto.iterations, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"],
    );

    return key;
}

async function getEncryptionKey(password, salt) {
    const keyMaterial = await getKeyMaterial(password);
    return deriveAESkey(keyMaterial, salt);
}

async function getKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"],
    );

    return keyPair;
}

async function getKeyPairPrivateEncrypted(key, iv) {
    // we return both public and private keys in a stringified version
    // the private key is encrypted
    const keyPair = await getKeyPair();
    const [publicKeyExported, privateKeyExported] = await Promise.all([
        getExportedKeyString(keyPair.publicKey),
        getExportedKeyString(keyPair.privateKey),
    ]);
    const privateKeyEncrypted = await getEncryptedMessage(key, iv, privateKeyExported);
    const privateKeyEncryptedExported = dataManipulation.ArrBufferToJSON(privateKeyEncrypted);

    return [publicKeyExported, privateKeyEncryptedExported];
}

async function getEncryptedMessage(key, iv, dataString) {
    // the data coming here comes as string
    const enc = new TextEncoder();
    const data = enc.encode(dataString);
    return await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
}

async function getDecryptedMessage(key, iv, data) {
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    const dec = new TextDecoder();
    return dec.decode(decrypted);
}

async function getExportedKeyString(key) {
    const keyExported = await window.crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(keyExported);
}

function getRandomValues(length) {
    return window.crypto.getRandomValues(new Uint8Array(length));
}

async function importKey(keyToBeImported, options) {
    const key = await window.crypto.subtle.importKey(
        "jwk",
        keyToBeImported,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        options,
    );
    return key;
}

async function importPrivateKeyEncrypted(keyEncrypted, password, salt, iv) {
    const dataArr = dataManipulation.objToArrBuffer(keyEncrypted);
    const key = await getEncryptionKey(password, dataManipulation.objToArrBuffer(salt));
    const ivArr = dataManipulation.objToArrBuffer(iv);
    const privateKeyJWK = JSON.parse(await getDecryptedMessage(key, ivArr, dataArr));
    const privateKey = await importKey(privateKeyJWK, ["decrypt"]);
    return privateKey;
}

export default {
    getRandomValues,
    getDecryptedMessage,
    getEncryptionKey,
    getKeyPairPrivateEncrypted,
    importKey,
    importPrivateKeyEncrypted,
};
