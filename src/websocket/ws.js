import { env } from "../../config/config.js";
import requests from "../utils/requests.js";
import { dataManipulationUtils as dataManipulation } from "../utils/utils.js";
import { cryptoUtils } from "../utils/utils.js";

let socket = null;

function start(publicUsername, selfPrivateKey, contactList, setChatMessages, userVars) {
    socket = new WebSocket(`${env.wsType}://${env.wsUrl}`);
    socket.binaryType = "arraybuffer";
    socket.addEventListener("error", (err) => {
        console.error("WebSocket error: ", err);
    });
    socket.addEventListener("open", () => {
        const msg = {
            type: "start",
            publicUsername: publicUsername.toLowerCase(),
        };
        const msgBuffer = dataManipulation.objToArrBuffer(msg);
        // we add a byte 0 at the beginning to show that it is setup message
        socket.send(dataManipulation.addByteFlag(0, [], msgBuffer));
    });
    socket.addEventListener("message", async (event) => {
        // the server will always send an array buffer
        let codeMessage;
        const tempData = event.data;
        if (tempData.byteLength === 2) {
            const code = dataManipulation.getNumFromBuffer(tempData.slice(0, 1));
            if (code === 100) {
                console.log("Connection not allowed");
                return;
            } else {
                console.log("connection set");
                return;
            }
        } else {
            codeMessage = dataManipulation.getNumFromBuffer(tempData.slice(0, 1));
        }
        if (codeMessage > 100) {
            console.log("Unspecified code.");
            return;
        }
        const data = event.data.slice(1);
        // 16 first bytes for the user
        // the next 512 bytes for the message
        // at this point we check if we have the user in the contact list
        // if we dont have we request the key through the api
        // we decode the incoming messages with our private key; we dont need the sender's public key
        const username = dataManipulation.arrBufferToString(data.slice(0, 48));
        let sharedKey;
        if (codeMessage < 3) {
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
                // we can do this synchronously // it shouldnt take that much time either way
                // or we do it async and just calculate it in the background
                const response = await requests.getPublicKey(username);
                const commonSalt = dataManipulation.xorArray(userVars.current.salt, response.salt);
                const targetOriginal = response.publicUsernameOriginalCase;
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
                        [username]: { key: sharedKey, username: targetOriginal, type: "user" },
                        ...contactList.current,
                    };
                } else if (codeMessage === 2) {
                    contactList.current[username] = {
                        key: sharedKey,
                        username: targetOriginal,
                        type: "user",
                    };
                }
                // since this would be the first message, we prepare the object
                setChatMessages((previousChatMessages) => {
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[username] = { name: targetOriginal, messages: {} };
                    return newChatMessages;
                });
            }
            // we need to decrypt now!
            const ivBuffer = data.slice(48, 60);
            const messageDecrypted = await cryptoUtils.getDecryptedMessage(
                sharedKey,
                { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
                data.slice(60),
            );
            const id = messageDecrypted.slice(0, 36);
            if (codeMessage === 1) {
                const message = messageDecrypted.slice(36);
                setChatMessages((previousChatMessages) => {
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[username].messages[id] = {
                        author: newChatMessages[username].name,
                        content: message,
                        createdAt: new Date(),
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
                    newChatMessages[username].messages[id].read = true;
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
                const targetOriginal = response.publicUsernameOriginalCase;
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
                    [sender]: { key: sharedKey, username: targetOriginal, type: "user" },
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
    });
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
    socket.close();
}

export default { start, getSocket, sendMessage, closeSocket };
