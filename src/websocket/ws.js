import { env } from "../../config/config.js";
import requests from "../utils/requests.js";
import { dataManipulationUtils as dataManipulation } from "../utils/utils.js";
import { cryptoUtils } from "../utils/utils.js";

let socket = null;

function setup(publicUsername) {
    const msgSetup = {
        type: "register",
        publicUsername: publicUsername.toLowerCase(),
    };
    const msgSetupBuffer = dataManipulation.objToArrBuffer(msgSetup);
    // we add a byte 0 at the beginning to show that it is setup message
    socket.send(dataManipulation.addByteFlag(msgSetupBuffer, 0));
}

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
        socket.send(dataManipulation.addByteFlag(msgBuffer, 0));
    });
    socket.addEventListener("message", async (event) => {
        // the server will always send an array buffer
        let codeMessage;
        let offset = 0;
        const tempData = event.data;
        if (tempData.byteLength === 2) {
            codeMessage = 0;
        } else {
            codeMessage = dataManipulation.getNumFromBuffer(tempData.slice(0, 1));
            ++offset;
        }
        const codeStatus = new Uint16Array(tempData.slice(offset, 2 + offset))[0];
        if (codeStatus === 200 && codeMessage >= 1) {
            const data = event.data.slice(1);
            // 16 first bytes for the user
            // the next 512 bytes for the message
            // at this point we check if we have the user in the contact list
            // if we dont have we request the key through the api
            // we decode the incoming messages with our private key; we dont need the sender's public key
            const username = dataManipulation.ArrBufferToString(data.slice(2, 18));
            let sharedKey;
            if (contactList.current[username]) {
                sharedKey = contactList.current[username];
                contactList.current = { [username]: sharedKey, ...contactList.current };
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
                contactList.current = { [username]: sharedKey, ...contactList.current };
                // since this would be the first message, we prepare the object
                setChatMessages((previousChatMessages) => {
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[username] = { username: targetOriginal, messages: {} };
                    return newChatMessages;
                });
            }
            // we need to decrypt now!
            const ivBuffer = data.slice(18, 30);
            const messageDecrypted = await cryptoUtils.getDecryptedMessage(
                sharedKey,
                { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
                data.slice(30),
            );
            const id = messageDecrypted.slice(0, 36);
            if (codeMessage === 1) {
                const message = messageDecrypted.slice(36);
                setChatMessages((previousChatMessages) => {
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[username].messages[id] = {
                        author: newChatMessages[username].username,
                        content: message,
                        createdAt: new Date(),
                        // receiving a message does not mean the message has been read
                        read: false,
                    };
                    return newChatMessages;
                });
            } else {
                // we update the read status of our own message
                setChatMessages((previousChatMessages) => {
                    // we update the read status of the message with the given id
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[username].messages[id].read = true;
                    return newChatMessages;
                });
            }
        } else {
            console.log(getCodeMessage(codeStatus));
        }
    });
}

function getCodeMessage(code) {
    if (code === 401) {
        return "you don't have access to setup the websocket connection";
    } else if (code === 404) {
        return "not found";
    } else if (code > 404 && code < 500) {
        return "data handling error on the server";
    } else {
        return "server error";
    }
}

// this function expects ArrBuffer
function sendMessage(message, flagByte) {
    // make an assert on what type of data I expect here!
    // flagbyte = 1: regular message; 2: acknowledge read
    // each sent message should also have an id
    // the id is encoded nex to the message
    socket.send(dataManipulation.addByteFlag(message, flagByte));
}

function getSocket() {
    return socket;
}

function closeSocket() {
    socket.close();
}

export default { setup, start, getSocket, sendMessage, closeSocket };
