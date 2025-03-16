import { useContext, useEffect, useState, useRef } from "react";
import SearchMessages from "../components/SearchMessages.jsx";
import PreviewMessages from "../components/PreviewMessages.jsx";
import ChatRoom from "../components/ChatRoom.jsx";
import ButtonDialog from "../components/ButtonDialog.jsx";
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
        setContactList,
        chatMessages,
        setChatMessages,
        userVars,
    } = useContext(Context);

    const [widthSidebar, setWidthSidebar] = useState(400);
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
        if (ws.getSocket() === null && isLogged) {
            ws.start(
                publicUsername,
                privateKey,
                contactList,
                setContactList,
                setChatMessages,
                userVars,
            );
        }
        // for now we empty the message array when a new connection is established
    }, [
        publicUsername,
        privateKey,
        contactList,
        setContactList,
        setChatMessages,
        isLogged,
        userVars,
    ]);
    const [currentTarget, setCurrentTarget] = useState(null);

    async function handleNewConnection(publicUsername) {
        // here we have to make sure that the response handles beautifully all the different options
        const response = await requests.getPublicKey(publicUsername);
        const salt = dataManipulation.xorArray(
            userVars.current.salt,
            dataManipulation.objArrToUint8Arr(response.salt),
        );
        if (response.status === 200) {
            const publicKeyJWKArr = dataManipulation.objArrToUint8Arr(response.publicKey);
            const publicKeyJWK = JSON.parse(dataManipulation.Uint8ArrayToStr(publicKeyJWKArr));
            const otherPublicKey = await cryptoUtils.importKey(
                publicKeyJWK,
                { name: "ECDH", namedCurve: "P-256" },
                [],
            );
            const sharedKey = await cryptoUtils.getSymmetricKey(otherPublicKey, privateKey, salt);
            setContactList((contactInfo) => {
                return { [publicUsername]: sharedKey, ...contactInfo };
            });
            setCurrentTarget(publicUsername);
            // we tell the server through the ws to pair the connection to the desired user
            // since this is only used for sending messages and not receiving it
            // Thus, there is not a problem to wait for the API  to respond.
            ws.setup(publicUsername);
            // we load the chatroom
            // we should receive the messages
            if (chatMessages[publicUsername] === undefined) {
                setChatMessages((chatMessages) => {
                    return { ...chatMessages, [publicUsername]: [] };
                });
            }
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
            contactList[currentTarget],
            {
                name: "AES-GCM",
                iv,
            },
            // we encrypt the id and the message together
            id + message,
        );
        setContactList((contactInfo) => {
            return { [currentTarget]: contactInfo[currentTarget], ...contactInfo };
        });
        ws.sendMessage(dataManipulation.groupBuffers([iv.buffer, messageEncrypted]), 1);
        setChatMessages((messages) => {
            const arrOriginal = messages[currentTarget];
            return {
                ...messages,
                [currentTarget]: [
                    ...arrOriginal,
                    {
                        id: id,
                        author: publicUsername,
                        content: message,
                        createdAt: new Date(),
                        // the message we sent is by default false
                        read: false,
                    },
                ],
            };
        });
    }

    function readMessages(messages) {
        let changeMade = false;
        messages.forEach(async (message) => {
            if (message.read === false && message.author === currentTarget) {
                changeMade = true;
                const iv = new Uint8Array(12);
                const idEncrypted = await cryptoUtils.getEncryptedMessage(
                    contactList[currentTarget],
                    { name: "AES-GCM", iv },
                    message.id,
                );
                message.read = true;
                ws.sendMessage(dataManipulation.groupBuffers([iv.buffer, idEncrypted]), 2);
            }
            if (changeMade) {
                setChatMessages((chatMessages) => {
                    return { ...chatMessages, [currentTarget]: messages };
                });
            }
        });
    }

    if (isLogged === false || privateKey === null) {
        return routes.navigate("/login");
    }

    const contactNames = Object.keys(contactList);
    const chatRoomMessages = getCurrentMessages(currentTarget, chatMessages);

    return (
        <div className={styles.container}>
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
                    let message = undefined;
                    if (chatMessages[contact] && chatMessages[contact].length > 0) {
                        message = chatMessages[contact].at(-1);
                    }
                    return (
                        <PreviewMessages
                            key={contact}
                            contact={contact}
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
                    targetContact={currentTarget}
                    messages={chatRoomMessages}
                    handleOnSubmit={handleSubmitMessage}
                    handleOnRender={readMessages}
                    username={publicUsername}
                />
            </div>
        </div>
    );
}

function getCurrentMessages(target, allMessages) {
    return allMessages[target];
}

export default Homepage;
