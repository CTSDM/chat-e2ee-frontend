import { env } from "../../config/config.js";
import { dataManipulationUtils as dataManipulation } from "./utils.js";

async function getKeyMaterial(password) {
    const enc = new TextEncoder();
    return await window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
        "deriveBits",
        "deriveKey",
    ]);
}

async function deriveAESkey(algorithm, keyMaterial) {
    const key = await window.crypto.subtle.deriveKey(
        algorithm,
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"],
    );
    return key;
}

async function getEncryptionKey(password, algo) {
    const keyMaterial = await getKeyMaterial(password);
    return deriveAESkey(algo, keyMaterial);
}

// generation of the public and private key
async function getKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        ["deriveKey", "deriveBits"],
    );
    return keyPair;
}

async function getKeyPairPrivateEncrypted(key, iv) {
    // we return both public and private keys in a stringified version
    // the public key is JWK but encoded in an array that is later on stringified
    // the private key is encrypted and thus is already in an array
    const keyPair = await getKeyPair();
    const [publicJWT, privateKeyJWT] = await Promise.all([
        getExportedKeyString(keyPair.publicKey),
        getExportedKeyString(keyPair.privateKey),
    ]);
    const privateKeyEncrypted = await getEncryptedMessage(
        key,
        { name: "AES-GCM", iv },
        privateKeyJWT,
    );
    const privateKeyEncryptedExported = dataManipulation.ArrBufferToJSON(privateKeyEncrypted);
    const publicKeyExported = dataManipulation.Uint8ArrayToJSON(
        dataManipulation.stringToUint8Array(publicJWT),
    );

    return [publicKeyExported, privateKeyEncryptedExported];
}

async function getEncryptedMessage(key, algorithmObj, data) {
    // the data coming here can be either string or Uint8Array
    if (typeof data === "string") {
        const enc = new TextEncoder();
        const dataFormatted = enc.encode(data);
        return await window.crypto.subtle.encrypt(algorithmObj, key, dataFormatted);
    } else {
        return await window.crypto.subtle.encrypt(algorithmObj, key, data);
    }
}

async function getDecryptedMessage(key, algorithmObj, data) {
    const decrypted = await window.crypto.subtle.decrypt(algorithmObj, key, data);
    const dec = new TextDecoder();
    return dec.decode(decrypted);
}

async function getExportedKeyString(key) {
    const keyExported = await window.crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(keyExported);
}

async function getExportedKeyRaw(key) {
    return await window.crypto.subtle.exportKey("raw", key);
}

function getRandomValues(length) {
    return window.crypto.getRandomValues(new Uint8Array(length));
}

async function importKey(keyToBeImported, algorithm, options) {
    const key = await window.crypto.subtle.importKey(
        "jwk",
        keyToBeImported,
        algorithm,
        true,
        options,
    );
    return key;
}

async function importPrivateKeyEncrypted(keyEncrypted, password, salt, iv) {
    const dataArr = dataManipulation.objArrToUint8Arr(keyEncrypted);
    const algo = {
        name: "PBKDF2",
        salt: salt,
        iterations: env.crypto.iterations,
        hash: "SHA-256",
    };
    const key = await getEncryptionKey(password, algo);
    const privateKeyJWK = JSON.parse(
        await getDecryptedMessage(key, { name: "AES-GCM", iv: iv }, dataArr),
    );
    const privateKey = await importKey(privateKeyJWK, { name: "ECDH", namedCurve: "P-256" }, [
        "deriveKey",
        "deriveBits",
    ]);
    return { privateKey, symmetricKey: key };
}

async function deriveSecretKey(privateKey, publicKey) {
    const secret = await window.crypto.subtle.deriveBits(
        {
            name: "ECDH",
            public: publicKey,
        },
        privateKey,
        256,
    );

    return await window.crypto.subtle.importKey("raw", secret, { name: "HKDF" }, false, [
        "deriveKey",
    ]);
}

async function getSymmetricKey(publicKey, selfPrivateKey, salt) {
    const sharedSecret = await deriveSecretKey(selfPrivateKey, publicKey);
    const algo = {
        name: "HKDF",
        hash: "SHA-256",
        info: new TextEncoder().encode("lamba theta omega sigma delta"),
        salt,
    };
    const key = await deriveAESkey(algo, sharedSecret);
    return key;
}

async function getAESGCMkey() {
    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"],
    );
}

async function importKeyAESGCM(key) {
    return await window.crypto.subtle.importKey("raw", key, "AES-GCM", true, [
        "encrypt",
        "decrypt",
    ]);
}

export default {
    getRandomValues,
    getAESGCMkey,
    getDecryptedMessage,
    getEncryptionKey,
    getKeyPairPrivateEncrypted,
    importKey,
    importPrivateKeyEncrypted,
    getEncryptedMessage,
    getSymmetricKey,
    getExportedKeyRaw,
    importKeyAESGCM,
};
