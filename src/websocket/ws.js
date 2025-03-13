import { env } from "../../config/config.js";
import requests from "../utils/requests.js";
import {
    dataManipulationUtils as dataManipulation,
    dataManipulationUtils,
} from "../utils/utils.js";
import { cryptoUtils } from "../utils/utils.js";
import { v4 as uuidv4 } from "uuid";

let socket = null;

function setup(publicUsername) {
    const msgSetup = {
        type: "register",
        publicUsername,
    };
    const msgSetupBuffer = dataManipulation.objToArrBuffer(msgSetup);
    // we add a byte 0 at the beginning to show that it is setup message
    socket.send(dataManipulation.addByteFlag(msgSetupBuffer, 0));
}

function start(
    publicUsername,
    selfPrivateKey,
    contactList,
    setContactList,
    setChatMessages,
    userVars,
) {
    socket = new WebSocket(`${env.wsType}://${env.wsUrl}`);
    socket.binaryType = "arraybuffer";
    socket.addEventListener("error", (err) => {
        console.error("WebSocket error: ", err);
    });
    socket.addEventListener("open", () => {
        const msg = {
            type: "start",
            publicUsername,
        };
        const msgBuffer = dataManipulation.objToArrBuffer(msg);
        // we add a byte 0 at the beginning to show that it is setup message
        socket.send(dataManipulation.addByteFlag(msgBuffer, 0));
    });
    socket.addEventListener("message", async (event) => {
        // the server will always send an array buffer
        let codeMessage;
        const tempData = event.data;
        if (tempData.byteLength === 2) {
            codeMessage = 0;
        } else {
            codeMessage = dataManipulation.getNumFromBuffer(tempData.slice(0, 1));
        }
        const codeStatus = new Uint16Array(tempData.slice(codeMessage, 2 + codeMessage))[0];
        if (codeStatus === 200 && codeMessage === 1) {
            const data = event.data.slice(1);
            // 16 first bytes for the user
            // the next 512 bytes for the message
            // at this point we check if we have the user in the contact list
            // if we dont have we request the key through the api
            // we decode the incoming messages with our private key; we dont need the sender's public key
            const username = dataManipulation.ArrBufferToString(data.slice(2, 18));
            let sharedKey;
            if (contactList[username]) {
                sharedKey = contactList[username];
                setContactList((contactInfo) => {
                    // we put the contact at the beginning so it reorders the message list
                    // this really should be ordered in the message and not here...
                    return { [username]: contactInfo[username], ...contactInfo };
                });
            } else {
                // we request the contactList through the API
                // we can do this synchronously // it shouldnt take that much time either way
                // or we do it async and just calculate it in the background
                const response = await requests.getPublicKey(username);
                const commonSalt = dataManipulationUtils.xorArray(
                    userVars.current.salt,
                    response.salt,
                );
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
                setContactList((contactInfo) => {
                    // we calculate the key from the output of the Diffie Hellman exchange
                    return { [username]: sharedKey, ...contactInfo };
                });
            }
            // we need to decrypt now!
            const ivBuffer = data.slice(18, 30);
            const message = await cryptoUtils.getDecryptedMessage(
                sharedKey,
                { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
                data.slice(30),
            );
            setChatMessages((messages) => {
                let arrOriginal;
                if (!messages[username]) {
                    arrOriginal = [];
                } else {
                    arrOriginal = messages[username];
                }
                return {
                    ...messages,
                    [username]: [
                        ...arrOriginal,
                        {
                            id: uuidv4(),
                            author: username,
                            content: message,
                            createdAt: new Date(),
                        },
                    ],
                };
            });
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
function sendMessage(message) {
    // make an assert on what type of data I expect here!
    // we add a byte 1 at the beginning to show that it is regular message
    socket.send(dataManipulation.addByteFlag(message, 1));
}

function getSocket() {
    return socket;
}

function closeSocket() {
    socket.close();
}

export default { setup, start, getSocket, sendMessage, closeSocket };
