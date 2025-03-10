import { env } from "../../config/config.js";
import requests from "../utils/requests.js";
import { dataManipulationUtils as dataManipulation } from "../utils/utils.js";
import { cryptoUtils } from "../utils/utils.js";
import { v4 as uuidv4 } from "uuid";

let socket = null;

function setup(publicUsername) {
    const msg = {
        type: "register",
        publicUsername,
    };
    const messageToSend = dataManipulation.objToArrBuffer(msg);
    socket.send(messageToSend);
}

function start(publicUsername, privateKey, contactList, setContactList, setChatMessages) {
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
        const messageToSent = dataManipulation.objToArrBuffer(msg);
        socket.send(messageToSent);
    });
    socket.addEventListener("message", async (event) => {
        // the server will always send an array buffer
        const data = event.data;
        const code = new Uint16Array(data.slice(0, 2))[0];
        if ((code === 200) & (data.byteLength >= 512)) {
            // 16 first bytes for the user
            // the next 512 bytes for the message
            // at this point we check if we have the user in the contact list
            // if we dont have we request the key through the api
            // we decode the incoming messages with our private key; we dont need the sender's public key
            const username = dataManipulation.ArrBufferToString(data.slice(2, 18));
            if (contactList[username]) {
                setContactList((contactInfo) => {
                    return { [username]: contactInfo[username], ...contactInfo };
                });
            } else {
                // we request the contactList through the API
                // we can do this synchronously // it shouldnt take that much time either way
                // or we do it async and just calculate it in the background
                const response = await requests.getPublicKey(username);
                const publicKeyJWKArr = dataManipulation.objArrToUint8Arr(response.publicKey);
                const publicKeyJWK = JSON.parse(dataManipulation.Uint8ArrayToStr(publicKeyJWKArr));
                const publicKey = await cryptoUtils.importKey(
                    publicKeyJWK,
                    { name: "RSA-OAEP", hash: "SHA-256" },
                    ["encrypt"],
                );
                setContactList((contactInfo) => {
                    return { [username]: publicKey, ...contactInfo };
                });
            }
            // we need to decrypt now!
            const message = await cryptoUtils.getDecryptedMessage(
                privateKey,
                { name: "RSA-OAEP" },
                data.slice(18),
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
            console.log(getCodeMessage(code));
        }
    });
}

function getCodeMessage(code) {
    if (code === 401) {
        return "you don't have access to setup the websocket connection";
    } else if (code < 500) {
        return "data handling error on the server";
    } else {
        return "server error";
    }
}

// this function expects ArrBuffer
function sendMessage(message) {
    // make an assert on what type of data I expect here!
    socket.send(message);
}

function getSocket() {
    return socket;
}

function closeSocket() {
    socket.close();
}

export default { setup, start, getSocket, sendMessage, closeSocket };
