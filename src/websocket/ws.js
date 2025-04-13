import { env } from "../../config/config.js";
import requests from "../utils/requests.js";
import { dataManipulationUtils as dataManipulation } from "../utils/utils.js";
import { cryptoUtils } from "../utils/utils.js";

let socket = null;

function start(publicUsername, selfPrivateKey, symKey, contactList, setChatMessages, userVars) {
    socket = new WebSocket(`${env.wsType}://${env.wsUrl}`);
    // by default the browser handles the data as Blobs
    socket.binaryType = "arraybuffer";
    socket.addEventListener("error", onError);
    socket.addEventListener("open", onOpen);
    socket.addEventListener("close", onClose);
    socket.addEventListener("message", onMessage);
    const reqPromisesHandler = {};
    const cryptoPromisesHandler = {};

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
        if (codeMessage < 4) {
            const username = dataManipulation.arrBufferToString(data.slice(0, 48));
            const sender = dataManipulation.arrBufferToString(data.slice(48, 64));
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
                sharedKey = await createNewContact(
                    [reqPromisesHandler[username], cryptoPromisesHandler[username]],
                    username,
                    selfPrivateKey,
                    userVars.current.salt,
                    contactList,
                    setChatMessages,
                );
                const usernameOC = contactList.current[username].username;
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
            }
            // we need to decrypt now!
            const messageId = dataManipulation.arrBufferToString(data.slice(64, 100));
            if (codeMessage === 1 || codeMessage === 3) {
                const readStatus = !!dataManipulation.getNumFromBuffer(data.slice(100, 101)); // boolean value
                const messageDate = dataManipulation.getDateFromBuffer(data.slice(101, 117));
                const ivBuffer = data.slice(117, 129);
                const messageDecrypted = await cryptoUtils.getDecryptedMessage(
                    sharedKey,
                    { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
                    data.slice(129),
                );
                // we need to make sure that the current context is in our contactlist
                if (contactList.current[username] === undefined) {
                    const response = await requests.getPublicKey("users", username);
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
                    contactList.current[username] = {
                        type: "user",
                        key: key,
                        username: usernameOC,
                    };
                }
                setChatMessages((previousChatMessages) => {
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[username].messages[messageId] = {
                        author: sender,
                        content: messageDecrypted,
                        createdAt: messageDate,
                        // when first receiving a message it is always unread
                        read: codeMessage === 3 ? readStatus : false,
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
        if (codeMessage === 6) {
            // this message is that the current user was added to a group chat
            // we check the key status to know whether or not the key is encrypted with our symmetric key
            // if key status is 0 we check if the creator of the group is in our contact list
            // if not then we request their public key
            const groupInfo = { id: dataManipulation.arrBufferToString(data.slice(0, 48)) };
            const promisesObj = {
                req: reqPromisesHandler[groupInfo.id],
                crypto: cryptoPromisesHandler[groupInfo.id],
            };
            // we add the group to the list
            const groupAdditionalInfo = await getGroupInfo(
                groupInfo.id,
                reqPromisesHandler[groupInfo.id],
            );
            Object.assign(groupInfo, groupAdditionalInfo);
            if (groupInfo.finalKey) {
                groupInfo.key = await getGroupKey(promisesObj.crypto, groupInfo, symKey);
            } else {
                const sharedKey = await createNewContact(
                    [
                        reqPromisesHandler[groupInfo.creator],
                        cryptoPromisesHandler[groupInfo.creator],
                    ],
                    groupInfo.creator,
                    selfPrivateKey,
                    userVars.current.salt,
                    contactList,
                    setChatMessages,
                );
                groupInfo.key = await getGroupKey(promisesObj.crypto, groupInfo, sharedKey);
            }
            if (!contactList.current[groupInfo.id]) {
                addToContactList(
                    contactList,
                    groupInfo.key,
                    groupInfo.id,
                    groupInfo.name,
                    groupInfo.members,
                );
                createChatEntry(groupInfo.id, groupInfo.name, setChatMessages);
            }
        }
    }
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

function addToContactList(contactList, sharedKey, context, name, members) {
    const type = context.length === 36 ? "group" : "user";
    const contact = { type: type, key: sharedKey, username: name };
    if (type === "group") {
        contact.members = members;
    }
    contactList.current[context] = contact;
}

async function getGroupInfo(groupId, reqPromiseHandler) {
    // this function will retrieve the key through the API
    if (!reqPromiseHandler) {
        reqPromiseHandler = requests.getPublicKey("groups", groupId);
    }
    const response = await reqPromiseHandler;
    reqPromiseHandler = null;
    return {
        name: response.name,
        creator: response.creator,
        keyEncrypted: dataManipulation.objArrToUint8Arr(response.key),
        iv: dataManipulation.objArrToUint8Arr(response.iv),
        finalKey: response.finalKey,
        members: response.members,
    };
}

async function getGroupKey(cryptoPromiseHandler, groupInfo, keyToUse) {
    if (!cryptoPromiseHandler) {
        cryptoPromiseHandler = cryptoUtils.getDecryptedKey(
            keyToUse,
            groupInfo.iv,
            groupInfo.keyEncrypted,
        );
    }
    const key = await cryptoUtils.importKeyAESGCM(await cryptoPromiseHandler);
    cryptoPromiseHandler = null;
    return key;
}

async function createNewContact(
    promisesHandler,
    context,
    privateKey,
    salt,
    contactList,
    setMessages,
) {
    if (!promisesHandler[0]) {
        promisesHandler[0] = requests.getPublicKey("users", context);
    }
    const response = await promisesHandler[0];
    promisesHandler[0] = null;
    if (!promisesHandler[1]) {
        const bobSalt = dataManipulation.objArrToUint8Arr(response.salt);
        promisesHandler[1] = getSharedKey(response.publicKey, privateKey, salt, bobSalt);
    }
    const sharedKey = await promisesHandler[1];
    promisesHandler[1] = null;
    if (!contactList.current[context]) {
        addToContactList(contactList, sharedKey, context, response.publicUsername);
        createChatEntry(context, response.publicUsername, setMessages);
    }
    return sharedKey;
}

async function getSharedKey(bobPublicKeyObj, alicePrivateKey, aliceSalt, bobSalt) {
    //response.publicKey
    const commonSalt = dataManipulation.xorArray(aliceSalt, bobSalt);
    const bobPublicKeyJWKArr = dataManipulation.objArrToUint8Arr(bobPublicKeyObj);
    const bobPublicKeyJWK = JSON.parse(dataManipulation.Uint8ArrayToStr(bobPublicKeyJWKArr));
    const bobPublicKey = await cryptoUtils.importKey(
        bobPublicKeyJWK,
        { name: "ECDH", namedCurve: "P-256" },
        [],
    );
    return await cryptoUtils.getSymmetricKey(bobPublicKey, alicePrivateKey, commonSalt);
}

function createChatEntry(context, username, setMessages) {
    setMessages((previousChatMessages) => {
        const newChatMessages = structuredClone(previousChatMessages);
        newChatMessages[context] = { name: username, messages: {} };
        return newChatMessages;
    });
}

export default { start, getSocket, sendMessage, closeSocket };
