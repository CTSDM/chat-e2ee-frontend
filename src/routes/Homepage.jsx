import { useContext, useEffect, useState, useRef } from "react";
import SearchMessages from "../components/SearchMessages.jsx";
import PreviewMessages from "../components/PreviewMessages.jsx";
import ChatRoom from "../components/ChatRoom.jsx";
import GroupChatRoom from "../components/GroupChatRoom.jsx";
import ButtonDialog from "../components/ButtonDialog.jsx";
import PopupMessage from "../components/PopupMessage.jsx";
import CreateGroup from "../components/CreateGroup.jsx";
import { Context } from "./utils/globalStateContext.js";
import { env } from "../../config/config.js";
import requests from "../utils/requests.js";
import { cryptoUtils } from "../utils/utils.js";
import ws from "../websocket/ws.js";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import dataManipulation from "../utils/dataManipulation.js";
import styles from "./Homepage.module.css";

export default function Homepage() {
    const {
        publicUsername,
        isLogged,
        privateKey,
        contactList,
        chatMessages,
        setChatMessages,
        symmetricKey,
        userVars,
    } = useContext(Context);

    const [widthSidebar, setWidthSidebar] = useState(400);
    const [errMessages, setErrMessages] = useState(null);
    const isResize = useRef(false);
    const [currentTarget, setCurrentTarget] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // resizing the handler
        const handleMouseMove = (e) => {
            if (isResize.current) {
                setWidthSidebar((previousWidth) => previousWidth + e.movementX);
            }
        };
        const handleMouseUp = () => {
            isResize.current = false;
        };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        // retry the websocket connection
        const intervalId = setInterval(startWebSocket, 2000);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.clearTimeout(intervalId);
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setErrMessages(null), 2000);
        return () => clearTimeout(timer);
    }, [setErrMessages]);

    useEffect(() => {
        startWebSocket(
            publicUsername,
            privateKey,
            contactList,
            setChatMessages,
            userVars,
            ws,
            isLogged,
        );
        // for now we empty the message array when a new connection is established
    }, [publicUsername, privateKey, contactList, setChatMessages, userVars, isLogged]);

    useEffect(() => {
        if (isLogged === false || privateKey === null) {
            navigate("/login");
        }
    });

    if (isLogged === false || privateKey === null) {
        return null;
    }

    function startWebSocket() {
        if (ws.getSocket() === null && isLogged) {
            ws.start(
                publicUsername,
                privateKey,
                // we want to return the latest value of contact list
                contactList,
                setChatMessages,
                userVars,
            );
        }
    }

    async function handleNewConnection(typedPublicUsername) {
        // here we have to make sure that the response handles beautifully all the different options
        const response = await requests.getPublicKey(typedPublicUsername.toLowerCase());
        if (response.status === 200) {
            const salt = dataManipulation.xorArray(
                userVars.current.salt,
                dataManipulation.objArrToUint8Arr(response.salt),
            );
            const targetPublicUsername = response.publicUsername;
            const targetPublicUsernameLC = targetPublicUsername.toLowerCase();
            const publicKeyJWKArr = dataManipulation.objArrToUint8Arr(response.publicKey);
            const publicKeyJWK = JSON.parse(dataManipulation.Uint8ArrayToStr(publicKeyJWKArr));
            const otherPublicKey = await cryptoUtils.importKey(
                publicKeyJWK,
                { name: "ECDH", namedCurve: "P-256" },
                [],
            );
            const sharedKey = await cryptoUtils.getSymmetricKey(otherPublicKey, privateKey, salt);
            contactList.current[targetPublicUsernameLC] = {
                username: targetPublicUsername,
                key: sharedKey,
                type: "user",
            };
            setCurrentTarget(targetPublicUsernameLC);
            // we load the chatroom
            // we should receive the messages
            if (chatMessages[targetPublicUsernameLC] === undefined) {
                setChatMessages((previousChatMessages) => {
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[targetPublicUsernameLC] = {
                        name: targetPublicUsername,
                        messages: {},
                    };
                    return newChatMessages;
                });
            }
        } else if (response.status === 404) {
            setErrMessages("The user requested does not exist.");
        } else if (response.status === 400) {
            setErrMessages("The username is not valid.");
        }
    }

    function previewOnClick(name) {
        // we change the current target, and thus the shown messages will change
        // the chat will be ready to send messages to that contact
        setCurrentTarget(name);
    }

    async function onSubmitCreateGroup(usernamesArr, groupName) {
        //we add the group to the contact list, we use a uuid as the id
        //at the end we update the target
        const groupId = uuidv4();
        // the current user will register itself to the group
        // and then it will send a new symmetric key encrypted to the server for storage
        // flagbyte 3 register, flagbyte 4 send encrypted key with DH to the database
        // flagbyte 5 save encrypted key to the database. Each user will do this step from their front end
        const userMaxLength = env.validation.users.username.maxLength;
        const groupMaxLength = env.validation.group.maxLength;
        const groupNameArr = dataManipulation.stringToUint8Array(groupName, groupMaxLength);
        const dateArr = dataManipulation.stringToUint8Array(new Date().getTime().toString(), 16);
        let data = dataManipulation.groupBuffers([groupNameArr, dateArr]);
        ws.sendMessage(4, groupId, data);
        // create new symmetric key
        const keySymmetricGroup = await cryptoUtils.getAESGCMkey();
        contactList.current[groupId] = {
            // username will be the group name
            username: groupName,
            members: [publicUsername, ...usernamesArr],
            type: "group",
            key: keySymmetricGroup,
        };
        const keyRAW = await cryptoUtils.getExportedKeyRaw(keySymmetricGroup);
        usernamesArr.splice(0, 0, publicUsername.toLowerCase());
        usernamesArr.forEach(async (username) => {
            // the current user will encrypt this keyRAW with his own symmetric key (the same that uses to encrypt their key pair)
            // encrypt the key with the current symmetric key --> send to the server
            // for other users we first derive the shared key and then encrypt the new raw key with that
            const iv = cryptoUtils.getRandomValues(12);
            let rawKeyEnc;
            const keyType = [0];
            if (username === publicUsername.toLowerCase()) {
                rawKeyEnc = await cryptoUtils.getEncryptedMessage(
                    symmetricKey,
                    { name: "AES-GCM", iv: iv },
                    keyRAW,
                );
                keyType[0] = 1;
            } else {
                rawKeyEnc = await cryptoUtils.getEncryptedMessage(
                    contactList.current[username].key,
                    { name: "AES-GCM", iv: iv },
                    keyRAW,
                );
            }
            const keyUserData = dataManipulation.groupBuffers([iv, rawKeyEnc, keyType]);
            const usernameArr = dataManipulation.stringToUint8Array(username, 16);
            const data = dataManipulation.groupBuffers([usernameArr, keyUserData]);
            ws.sendMessage(5, groupId, data);
        });
        setCurrentTarget(groupId);
        setChatMessages((previousChatMessages) => {
            const newChatMessages = structuredClone(previousChatMessages);
            newChatMessages[groupId] = {
                name: groupName,
                messages: {},
            };
            return newChatMessages;
        });
    }

    async function handleSubmitMessage(message) {
        const dateString = new Date().getTime().toString();
        const dateBuff = dataManipulation.stringToUint8Array(dateString, 16);
        const iv = cryptoUtils.getRandomValues(12);
        const id = uuidv4();
        const messageEncrypted = await cryptoUtils.getEncryptedMessage(
            contactList.current[currentTarget].key,
            {
                name: "AES-GCM",
                iv,
            },
            // we encrypt the id and the message together
            message,
        );
        contactList.current = {
            [currentTarget]: contactList.current[currentTarget],
            ...contactList.current,
        };
        const usernameBuff = dataManipulation.stringToUint8Array(publicUsername, 16);
        const idBuff = dataManipulation.stringToUint8Array(id);
        const padding = [0]; // used for the bit that will eventually used for the read status when retrieving data from the server
        const data = dataManipulation.groupBuffers([
            usernameBuff.buffer,
            idBuff.buffer,
            padding,
            dateBuff.buffer,
            iv.buffer,
            messageEncrypted,
        ]);
        let flagByte = contactList.current[currentTarget].type === "user" ? 1 : 6;
        ws.sendMessage(flagByte, currentTarget, data);
        setChatMessages((previousMessages) => {
            const newMessages = structuredClone(previousMessages);
            newMessages[currentTarget].messages[id] = {
                author: publicUsername,
                content: message,
                createdAt: new Date(),
                // the message we sent is by default false
                read: false,
            };
            return newMessages;
        });
    }

    async function readMessages(messages) {
        // messages is an obj
        // we are reading the messages of the currentTarget
        for (let i = 0; i < messages.length; ++i) {
            const message = messages[i];
            if (message.read === false && message.author === chatMessages[currentTarget].name) {
                message.read = true;
                const usernameBuff = dataManipulation.stringToUint8Array(
                    publicUsername.toLowerCase(),
                    16,
                );
                const messageIdBuff = dataManipulation.stringToUint8Array(message.id);
                const data = dataManipulation.groupBuffers([usernameBuff, messageIdBuff]);
                ws.sendMessage(2, currentTarget, data);
                setChatMessages((previousChatMessages) => {
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[currentTarget].messages = messages;
                    return newChatMessages;
                });
            }
        }
    }

    const contactNames = getContacts(contactList.current);
    const chatRoomMessages = getCurrentMessages(currentTarget, chatMessages);
    orderChatRoom(chatRoomMessages);

    return (
        <div className={styles.container}>
            {errMessages ? <PopupMessage message={errMessages} /> : null}
            <div className={styles.leftSide} style={{ width: `${widthSidebar}px` }}>
                <ButtonDialog
                    text={"Add connection"}
                    textModal={"Connect"}
                    onSubmit={handleNewConnection}
                    input={env.inputs.signup[1]}
                />
                <CreateGroup
                    contactList={contactList.current}
                    setErrorMessage={setErrMessages}
                    onSubmit={onSubmitCreateGroup}
                />
                <SearchMessages />
                {contactNames.length === 0 ? <div>No users yet...</div> : null}
                {contactNames.map((contact) => {
                    let message = undefined;
                    if (
                        chatMessages[contact] &&
                        Object.keys(chatMessages[contact].messages).length > 0
                    ) {
                        message = Object.values(chatMessages[contact].messages).at(-1);
                    }
                    return (
                        <PreviewMessages
                            key={contact}
                            id={contact}
                            contact={contactList.current[contact].username}
                            username={publicUsername}
                            message={message}
                            target={currentTarget}
                            handleOnClick={previewOnClick}
                        />
                    );
                })}
            </div>
            <div
                className={styles.resizeHandler}
                onMouseDown={() => (isResize.current = true)}
            ></div>
            <div className={styles.rightSide}>
                {currentTarget ? (
                    contactList.current[currentTarget].type === "group" ? (
                        <GroupChatRoom
                            groupName={currentTarget && contactList.current[currentTarget].username}
                            members={currentTarget && contactList.current[currentTarget].members}
                            messages={chatRoomMessages}
                            handleOnSubmit={handleSubmitMessage}
                            handleOnRender={readMessages}
                            username={publicUsername}
                        />
                    ) : (
                        <ChatRoom
                            target={currentTarget && contactList.current[currentTarget].username}
                            messages={chatRoomMessages}
                            handleOnSubmit={handleSubmitMessage}
                            handleOnRender={readMessages}
                            username={publicUsername}
                        />
                    )
                ) : (
                    <div></div>
                )}
            </div>
        </div>
    );
}

function getCurrentMessages(target, messagesObj) {
    if (messagesObj && target) {
        if (messagesObj[target]) {
            // we return an array ordered by date
            // we are comparing dates, should be done with quicksort
            const messages = messagesObj[target].messages;
            const messagesArr = [];
            for (let key in messages) {
                const message = messages[key];
                message.id = key;
                messagesArr.push(message);
            }
            messagesArr.sort((a, b) => {
                if (a.createdAt > b.createdAt) return 1;
                else if (a.createdAt < b.createdAt) return -1;
                return 0;
            });
            return messagesArr;
        }
    } else return undefined;
}

function getContacts(obj) {
    // the expected object should be as follows
    // {id1: {key: ..., username: ...}, ..., {idn: {key: ..., username: ...}}
    const arr = [];
    for (let key in obj) {
        arr.push(key);
    }
    return arr;
}

function orderChatRoom() {
    // the chatrooms will be ordered by date
}
