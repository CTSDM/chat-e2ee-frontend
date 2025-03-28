import { useContext, useEffect, useState, useRef } from "react";
import SearchMessages from "../components/SearchMessages.jsx";
import PreviewMessages from "../components/PreviewMessages.jsx";
import ChatRoom from "../components/ChatRoom.jsx";
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

function Homepage() {
    const {
        publicUsername,
        isLogged,
        privateKey,
        contactList,
        chatMessages,
        setChatMessages,
        userVars,
    } = useContext(Context);

    const [widthSidebar, setWidthSidebar] = useState(400);
    const [errMessages, setErrMessages] = useState(null);
    const isResize = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
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
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setErrMessages(null), 2000);
        return () => clearTimeout(timer);
    }, [errMessages]);

    useEffect(() => {
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
        // for now we empty the message array when a new connection is established
    }, [publicUsername, privateKey, contactList, setChatMessages, isLogged, userVars]);
    const [currentTarget, setCurrentTarget] = useState(null);

    useEffect(() => {
        if (isLogged === false || privateKey === null) {
            navigate("/login");
        }
    });

    if (isLogged === false || privateKey === null) {
        return null;
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
            const targetPublicUsernameOriginalCase = response.publicUsernameOriginalCase;
            const publicKeyJWKArr = dataManipulation.objArrToUint8Arr(response.publicKey);
            const publicKeyJWK = JSON.parse(dataManipulation.Uint8ArrayToStr(publicKeyJWKArr));
            const otherPublicKey = await cryptoUtils.importKey(
                publicKeyJWK,
                { name: "ECDH", namedCurve: "P-256" },
                [],
            );
            const sharedKey = await cryptoUtils.getSymmetricKey(otherPublicKey, privateKey, salt);
            contactList.current[targetPublicUsername] = {
                username: targetPublicUsernameOriginalCase,
                key: sharedKey,
                type: "user",
            };
            setCurrentTarget(targetPublicUsername);
            // we load the chatroom
            // we should receive the messages
            if (chatMessages[targetPublicUsername] === undefined) {
                setChatMessages((previousChatMessages) => {
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[targetPublicUsername] = {
                        name: targetPublicUsernameOriginalCase,
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
        const id = uuidv4();
        setCurrentTarget(id);
        contactList.current[id] = {
            // username will be the group name
            username: groupName,
            type: "group",
        };
        setChatMessages((previousChatMessages) => {
            const newChatMessages = structuredClone(previousChatMessages);
            newChatMessages[id] = {
                name: groupName,
                messages: {},
            };
            return newChatMessages;
        });
        setCurrentTarget(id);
    }

    async function handleSubmitMessage(message) {
        const iv = new Uint8Array(12);
        const id = uuidv4();
        const messageEncrypted = await cryptoUtils.getEncryptedMessage(
            contactList.current[currentTarget].key,
            {
                name: "AES-GCM",
                iv,
            },
            // we encrypt the id and the message together
            id + message,
        );
        contactList.current = {
            [currentTarget]: contactList.current[currentTarget],
            ...contactList.current,
        };
        ws.sendMessage(
            1,
            currentTarget,
            dataManipulation.groupBuffers([iv.buffer, messageEncrypted]),
        );
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
        let changeMade = false;
        for (let key in messages) {
            if (
                messages[key].read === false &&
                messages[key].author === chatMessages[currentTarget].name
            ) {
                changeMade = true;
                const iv = new Uint8Array(12);
                const idEncrypted = await cryptoUtils.getEncryptedMessage(
                    contactList.current[currentTarget].key,
                    { name: "AES-GCM", iv },
                    key,
                );
                messages[key].read = true;
                ws.sendMessage(
                    2,
                    currentTarget,
                    dataManipulation.groupBuffers([iv.buffer, idEncrypted]),
                );
            }
            if (changeMade) {
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
                <ChatRoom
                    target={currentTarget && contactList.current[currentTarget].username}
                    messages={chatRoomMessages}
                    handleOnSubmit={handleSubmitMessage}
                    handleOnRender={readMessages}
                    username={publicUsername}
                />
            </div>
        </div>
    );
}

function getCurrentMessages(target, messagesObj) {
    if (messagesObj && target) {
        if (messagesObj[target]) {
            // we return a deep copy of the object
            return structuredClone(messagesObj[target].messages);
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

export default Homepage;
