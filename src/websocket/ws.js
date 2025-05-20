import { env } from "../../config/config.js";
import requests from "../utils/requests.js";
import { dataManipulationUtils as dataManipulation } from "../utils/utils.js";
import { cryptoUtils } from "../utils/utils.js";

let socket = null;

function start(publicUsername, selfPrivateKey, symKey, contacts, setChat, userVars) {
    socket = new WebSocket(`${env.wsType}://${env.wsUrl}`);
    // by default the browser handles the data as Blobs
    socket.binaryType = "arraybuffer";
    socket.addEventListener("error", onError);
    socket.addEventListener("open", onOpen);
    socket.addEventListener("close", onClose);
    socket.addEventListener("message", onMessage);
    const reqPromisesHandler = {};
    const cryptoPromisesHandler = {};
    const messageIndexes = {};

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
        // codeMessage: 1 for a message; 2 acknowledge for reading the message
        const data = event.data.slice(1);
        // the first 48 bytes from data are for the context of the message
        if (codeMessage < 4) {
            const context = dataManipulation.arrBufferToString(data.slice(0, 48));
            const contextType = context.length === 36 ? "group" : "user";
            const sender = dataManipulation.arrBufferToString(data.slice(48, 64));
            const msgId = dataManipulation.arrBufferToString(data.slice(64, 100));
            // we create an index to keep track of the message index.
            if (!messageIndexes[context]) messageIndexes[context] = 0;
            let indexMessage;
            if (codeMessage === 1 || codeMessage === 3) {
                indexMessage = messageIndexes[context];
                ++messageIndexes[context];
            }
            // On startup, to avoid that the acknowledge message gets processed before the actual content of the message does
            // we create a pair promise/resolver to manage this
            if (contacts.current[context]) {
                if (codeMessage === 1) {
                    contacts.current = {
                        [context]: contacts.current[context],
                        ...contacts.current,
                    };
                }
            } else {
                // the current context is not in the contact list
                // i need to improve this
                if (contextType === "user") {
                    await createNewContact(
                        [reqPromisesHandler[context], cryptoPromisesHandler[context]],
                        context,
                        contextType,
                        selfPrivateKey,
                        userVars.current.salt,
                        contacts,
                        setChat,
                    );
                } else {
                    const groupInfo = { id: context };
                    await setupNewGroup(
                        groupInfo,
                        reqPromisesHandler,
                        cryptoPromisesHandler,
                        contacts,
                        selfPrivateKey,
                        userVars,
                        setChat,
                        symKey,
                    );
                }
                // we move the current contact to the top
                // for now this is how the preview messages are ordered
                contacts.current = {
                    [context]: contacts.current[context],
                    ...contacts.current,
                };
            }
            // we need to decrypt now!
            const sharedKey = contacts.current[context].key;
            if (codeMessage === 1 || codeMessage === 3) {
                if (sender === publicUsername && contextType === "group") {
                    const { promise, resolver } = promiseHelper();
                    cryptoPromisesHandler[msgId] = { promise, resolver };
                } else {
                    cryptoPromisesHandler[msgId] = {};
                }
                const readStatus = !!dataManipulation.getNumFromBuffer(data.slice(100, 101)); // boolean value
                const messageDate = dataManipulation.getDateFromBuffer(data.slice(101, 117));
                const ivBuffer = data.slice(117, 129);
                cryptoPromisesHandler[msgId].decryptPromise = cryptoUtils.getDecryptedMessage(
                    sharedKey,
                    { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
                    data.slice(129),
                );
                const messageDecrypted = await cryptoPromisesHandler[msgId].decryptPromise;
                cryptoPromisesHandler[msgId].decryptPromise = null;
                setChat((previousChatMessages) => {
                    const newChatMessages = structuredClone(previousChatMessages);
                    const newMessage = {
                        author: sender,
                        content: messageDecrypted,
                        createdAt: messageDate,
                    };
                    // a message just received from the other user through the server is always false
                    // however, if the message comes from the database, we get its state
                    // for now this only work for direct messages
                    if (contextType === "group") {
                        newMessage.read = [];
                    } else {
                        if (codeMessage === 3) {
                            newMessage.read = readStatus;
                        } else {
                            newMessage.read = false;
                        }
                    }
                    newChatMessages[context].messages[msgId] = newMessage;
                    // the if below can be optimized or delegated to a function
                    if (!newChatMessages[context].last) {
                        newChatMessages[context].last = msgId;
                        newChatMessages[context].lastIndex = indexMessage;
                    } else if (indexMessage > newChatMessages[context].lastIndex) {
                        newChatMessages[context].last = msgId;
                        newChatMessages[context].lastIndex = indexMessage;
                    }
                    return newChatMessages;
                });
                if (cryptoPromisesHandler[msgId].promise) {
                    cryptoPromisesHandler[msgId].resolver();
                } else {
                    delete cryptoPromisesHandler[msgId];
                }
            } else if (codeMessage === 2) {
                // we update the read status of our own message
                // that is, only those messages where sender is this user should be accepted, right?
                // we check and manage the promise handlers
                if (cryptoPromisesHandler[msgId] && cryptoPromisesHandler[msgId].promise) {
                    await cryptoPromisesHandler[msgId].promise;
                    delete cryptoPromisesHandler[msgId];
                }
                setChat((previousChatMessages) => {
                    // we update the read status of the message with the given id
                    const newChatMessages = structuredClone(previousChatMessages);
                    if (contextType === "user") {
                        newChatMessages[context].messages[msgId].read = true;
                    } else {
                        // we add the sender of the message to the read array in case it is not already added
                        if (!newChatMessages[context].messages[msgId].read.includes(sender))
                            newChatMessages[context].messages[msgId].read.push(sender);
                    }
                    return newChatMessages;
                });
            }
            return;
        }
        if (codeMessage === 6) {
            // this code below is gold
            // this message is that the current user was added to a group chat
            // we check the key status to know whether or not the key is encrypted with our symmetric key
            // if key status is 0 we check if the creator of the group is in our contact list
            // if not then we request their public key
            const groupInfo = { id: dataManipulation.arrBufferToString(data.slice(0, 48)) };
            // we add the group to the list
            setupNewGroup(
                groupInfo,
                reqPromisesHandler,
                cryptoPromisesHandler,
                contacts,
                selfPrivateKey,
                userVars,
                setChat,
                symKey,
            );
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
    const contact = { type: type, key: sharedKey, name: name };
    if (type === "group") {
        contact.members = members;
    }
    contactList.current[context] = contact;
}

async function setupNewGroup(
    groupInfo,
    reqPromisesHandler,
    cryptoPromisesHandler,
    contacts,
    privateKey,
    userVars,
    setChat,
    symKey,
) {
    const groupAdditionalInfo = await getGroupInfo(groupInfo.id, reqPromisesHandler[groupInfo.id]);
    Object.assign(groupInfo, groupAdditionalInfo);
    const reqHandlerCreator = reqPromisesHandler[groupInfo.creator];
    const cryptoHandlerCreator = cryptoPromisesHandler[groupInfo.creator];
    const cryptoHandlerGroup = cryptoPromisesHandler[groupInfo.id];
    // if there is a final key it means that we can decrypt the key using the symmetric key
    // otherwise the key can de decrypted using the key from the DH exchange with the creator of the group
    // thus, we only fetch the info with the creator if they are not in the contact list.
    if (groupInfo.finalKey) {
        groupInfo.key = await getGroupKey(cryptoHandlerGroup, groupInfo, symKey);
    } else {
        await createNewContact(
            [reqHandlerCreator, cryptoHandlerCreator],
            groupInfo.creator,
            "user",
            privateKey,
            userVars.current.salt,
            contacts,
            setChat,
        );
        const sharedKey = contacts.current[groupInfo.creator].key;
        groupInfo.key = await getGroupKey(cryptoHandlerGroup, groupInfo, sharedKey);
    }
    if (!contacts.current[groupInfo.id]) {
        addToContactList(contacts, groupInfo.key, groupInfo.id, groupInfo.name, groupInfo.members);
        createChatEntry(groupInfo.id, groupInfo.name, setChat);
    }
}

async function getGroupInfo(groupId, reqPromiseHandler) {
    // this function will retrieve the key through the API
    if (!reqPromiseHandler) {
        reqPromiseHandler = requests.getPublicKey("group", groupId);
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
    contextType,
    privateKey,
    salt,
    contactList,
    setMessages,
) {
    if (!promisesHandler[0]) {
        promisesHandler[0] = requests.getPublicKey(contextType, context);
    }
    const response = await promisesHandler[0];
    promisesHandler[0] = null;
    delete promisesHandler[0];
    if (!promisesHandler[1]) {
        const bobSalt = dataManipulation.objArrToUint8Arr(response.salt);
        promisesHandler[1] = getSharedKey(response.publicKey, privateKey, salt, bobSalt);
    }
    const sharedKey = await promisesHandler[1];
    promisesHandler[1] = null;
    delete promisesHandler[1];
    if (!contactList.current[context]) {
        addToContactList(contactList, sharedKey, context, response.publicUsername);
        createChatEntry(context, response.publicUsername, setMessages);
    }
}

async function getSharedKey(bobPublicKeyObj, alicePrivateKey, aliceSalt, bobSalt) {
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
        newChatMessages[context] = { name: username, messages: {}, last: undefined };
        return newChatMessages;
    });
}

function promiseHelper() {
    let resolver;
    const promise = new Promise((resolve) => (resolver = resolve));
    return { promise, resolver };
}

export default { start, getSocket, sendMessage, closeSocket };
