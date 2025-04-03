import { env } from "../../config/config.js";
import requests from "../utils/requests.js";
import { dataManipulationUtils as dataManipulation } from "../utils/utils.js";
import { cryptoUtils } from "../utils/utils.js";

let socket = null;

function start(publicUsername, selfPrivateKey, contactList, setChatMessages, userVars) {
    socket = new WebSocket(`${env.wsType}://${env.wsUrl}`);
    // by default the browser handles the data as Blobs
    socket.binaryType = "arraybuffer";
    socket.addEventListener("error", onError);
    socket.addEventListener("open", onOpen);
    socket.addEventListener("close", onClose);
    socket.addEventListener("message", onMessage);

    function onError(err) {
        console.error("Websocket error: ", err);
    }

    function onOpen() {
        console.log("Connection established.");
        const msg = {
            type: "start",
            publicUsername: publicUsername.toLowerCase(),
        };
        const msgBuffer = dataManipulation.objToArrBuffer(msg);
        // we add a byte 0 at the beginning to show that it is setup message
        socket.send(dataManipulation.addByteFlag(0, [], msgBuffer));
    }

    function onClose() {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("close", onClose);
        socket.removeEventListener("message", onMessage);
        socket = null;
    }

    async function onMessage(event) {
        // the server will always send an array buffer
        const tempData = event.data;
        const codeMessage = dataManipulation.getNumFromBuffer(tempData.slice(0, 1));
        // codeMessage: 1 for direct message; 2 acknowledge for reading the message
        const data = event.data.slice(1);
        // the first 48 bytes from data are for the context of the message
        if (codeMessage < 3) {
            const username = dataManipulation.arrBufferToString(data.slice(0, 48));
            let sharedKey;
            if (contactList.current[username]) {
                sharedKey = contactList.current[username].key;
                if (codeMessage === 1) {
                    contactList.current = {
                        [username]: contactList.current[username],
                        ...contactList.current,
                    };
                }
            } else {
                // we request the contactList through the API
                const response = await requests.getPublicKey(username);
                const commonSalt = dataManipulation.xorArray(userVars.current.salt, response.salt);
                const usernameOC = response.publicUsername;
                const publicKeyJWKArr = dataManipulation.objArrToUint8Arr(response.publicKey);
                const publicKeyJWK = JSON.parse(dataManipulation.Uint8ArrayToStr(publicKeyJWKArr));
                const publicKey = await cryptoUtils.importKey(
                    publicKeyJWK,
                    { name: "ECDH", namedCurve: "P-256" },
                    [],
                );
                sharedKey = await cryptoUtils.getSymmetricKey(
                    publicKey,
                    selfPrivateKey,
                    commonSalt,
                );
                if (codeMessage === 1) {
                    contactList.current = {
                        [username]: { key: sharedKey, username: usernameOC, type: "user" },
                        ...contactList.current,
                    };
                } else if (codeMessage === 2) {
                    contactList.current[username] = {
                        key: sharedKey,
                        username: usernameOC,
                        type: "user",
                    };
                }
                // since this would be the first message, we prepare the object
                setChatMessages((previousChatMessages) => {
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[username] = { name: usernameOC, messages: {} };
                    return newChatMessages;
                });
            }
            // we need to decrypt now!
            const sender = dataManipulation.arrBufferToString(data.slice(48, 64));
            const messageId = dataManipulation.arrBufferToString(data.slice(64, 100));
            if (codeMessage === 1) {
                const messageDate = dataManipulation.getDateFromBuffer(data.slice(100, 116));
                const ivBuffer = data.slice(116, 128);
                const messageDecrypted = await cryptoUtils.getDecryptedMessage(
                    sharedKey,
                    { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
                    data.slice(128),
                );
                const message = messageDecrypted;
                // we need to make sure that the current sender is in our contactlist
                if (contactList.current[sender] === undefined) {
                    const response = await requests.getPublicKey(sender);
                    const commonSalt = dataManipulation.xorArray(
                        userVars.current.salt,
                        response.salt,
                    );
                    const usernameOC = response.publicUsername;
                    const publicKeyJWKArr = dataManipulation.objArrToUint8Arr(response.publicKey);
                    const publicKeyJWK = JSON.parse(
                        dataManipulation.Uint8ArrayToStr(publicKeyJWKArr),
                    );
                    const publicKey = await cryptoUtils.importKey(
                        publicKeyJWK,
                        { name: "ECDH", namedCurve: "P-256" },
                        [],
                    );
                    const key = await cryptoUtils.getSymmetricKey(
                        publicKey,
                        selfPrivateKey,
                        commonSalt,
                    );
                    contactList.current[sender] = {
                        type: "user",
                        key: key,
                        username: usernameOC,
                    };
                }
                setChatMessages((previousChatMessages) => {
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[username].messages[messageId] = {
                        author: contactList.current[sender].username,
                        content: message,
                        createdAt: messageDate,
                        // receiving a message does not mean the message has been read
                        read: false,
                    };
                    return newChatMessages;
                });
            } else if (codeMessage === 2) {
                // we update the read status of our own message
                setChatMessages((previousChatMessages) => {
                    // we update the read status of the message with the given id
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[username].messages[messageId].read = true;
                    return newChatMessages;
                });
            }
            return;
        }
        if (codeMessage === 4) {
            // this message is that the current user was added to a group chat
            // first we retrieve the key
            const [name, sender, iv, keyEncrypted] = getInfoSetupGroup(data.slice(48));
            if (contactList.current[sender] === undefined) {
                const response = await requests.getPublicKey(sender);
                const commonSalt = dataManipulation.xorArray(userVars.current.salt, response.salt);
                const usernameOC = response.publicUsername;
                const publicKeyJWKArr = dataManipulation.objArrToUint8Arr(response.publicKey);
                const publicKeyJWK = JSON.parse(dataManipulation.Uint8ArrayToStr(publicKeyJWKArr));
                const publicKey = await cryptoUtils.importKey(
                    publicKeyJWK,
                    { name: "ECDH", namedCurve: "P-256" },
                    [],
                );
                sharedKey = await cryptoUtils.getSymmetricKey(
                    publicKey,
                    selfPrivateKey,
                    commonSalt,
                );
                contactList.current = {
                    [sender]: { key: sharedKey, username: usernameOC, type: "user" },
                    ...contactList.current,
                };
            }
            const keyRaw = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: new Uint8Array(iv) },
                contactList.current[sender].key,
                keyEncrypted,
            );
            const key = await cryptoUtils.importKeyAESGCM(new Uint8Array(keyRaw));
            contactList.current[username] = {
                members: [],
                type: "group",
                username: name,
                key: key,
            };
            setChatMessages((previousChatMessages) => {
                const newChatMessages = structuredClone(previousChatMessages);
                newChatMessages[username] = { messages: {}, name: name };
                newChatMessages[sender] = {
                    messages: {},
                    name: contactList.current[sender].username,
                };
                return newChatMessages;
            });
        }
    }
}

function getInfoSetupGroup(data) {
    const groupNameBuffer = data.slice(0, 50);
    let cumSumLength = groupNameBuffer.byteLength;
    const senderBuffer = data.slice(cumSumLength, cumSumLength + 16);
    cumSumLength += senderBuffer.byteLength;
    const ivBuffer = data.slice(cumSumLength, cumSumLength + 12);
    cumSumLength += ivBuffer.byteLength;
    const keyEncryptedBuffer = data.slice(cumSumLength);
    const groupName = dataManipulation.arrBufferToString(groupNameBuffer);
    const sender = dataManipulation.arrBufferToString(senderBuffer);
    return [groupName, sender, ivBuffer, keyEncryptedBuffer];
}

// this function expects ArrBuffer
function sendMessage(flagByte, target, message) {
    // make an assert on what type of data I expect here!
    // flagbyte = 1: regular message; 2: acknowledge read
    // each sent message should also have an id
    // the id is encoded nex to the message
    const strArr = dataManipulation.stringToUint8Array(target, env.metaInfo.target);
    socket.send(dataManipulation.addByteFlag(flagByte, strArr, message));
}

function getSocket() {
    return socket;
}

function closeSocket() {
    console.log("Closing the websocket connection.");
    socket.close();
}

export default { start, getSocket, sendMessage, closeSocket };
