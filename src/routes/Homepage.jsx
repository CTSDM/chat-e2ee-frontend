import { useContext, useEffect, useState, useRef } from "react";
import SearchMessages from "../components/SearchMessages.jsx";
import PreviewMessages from "../components/PreviewMessages.jsx";
import ChatRoom from "../components/ChatRoom.jsx";
import ButtonDialog from "../components/ButtonDialog.jsx";
import PopupMessage from "../components/PopupMessage.jsx";
import { Context } from "./utils/globalStateContext.js";
import { env } from "../../config/config.js";
import requests from "../utils/requests.js";
import { cryptoUtils } from "../utils/utils.js";
import ws from "../websocket/ws.js";
import routes from "../routes.jsx";
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
            };
            setCurrentTarget(targetPublicUsername);
            // we tell the server through the ws to pair the connection to the desired user
            // since this is only used for sending messages and not receiving it
            // Thus, there is not a problem to wait for the API  to respond.
            ws.setup(targetPublicUsername);
            // we load the chatroom
            // we should receive the messages
            if (chatMessages[targetPublicUsername] === undefined) {
                setChatMessages((previousChatMessages) => {
                    const newChatMessages = structuredClone(previousChatMessages);
                    newChatMessages[targetPublicUsername] = {
                        username: targetPublicUsernameOriginalCase,
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
        // the line below is not bueno against offline updates
        // if the server is not available when setting up the websocket, it could happen that we send messages to another party
        // due to the nature of the encryption the other party wouldn't be able to read the messages (but nonetheless this is terrible)
        ws.setup(name);
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
        ws.sendMessage(dataManipulation.groupBuffers([iv.buffer, messageEncrypted]), 1);
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
                messages[key].author === chatMessages[currentTarget].username
            ) {
                changeMade = true;
                const iv = new Uint8Array(12);
                const idEncrypted = await cryptoUtils.getEncryptedMessage(
                    contactList.current[currentTarget].key,
                    { name: "AES-GCM", iv },
                    key,
                );
                messages[key].read = true;
                ws.sendMessage(dataManipulation.groupBuffers([iv.buffer, idEncrypted]), 2);
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

    if (isLogged === false || privateKey === null) {
        return routes.navigate("/login");
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
                <SearchMessages />
                {contactNames.length === 0 ? <div>No users yet...</div> : null}
                {contactNames.map((contact) => {
                    const contactLC = contact.toLowerCase();
                    let message = undefined;
                    if (
                        chatMessages[contactLC] &&
                        Object.keys(chatMessages[contactLC].messages).length > 0
                    ) {
                        message = Object.values(chatMessages[contactLC].messages).at(-1);
                    }
                    return (
                        <PreviewMessages
                            key={contact}
                            contact={contact}
                            contactOriginalUsername={chatMessages[contactLC].username}
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
        arr.push(obj[key].username);
    }
    return arr;
}

export default Homepage;
