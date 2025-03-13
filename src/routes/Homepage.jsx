import { useContext, useEffect, useState } from "react";
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
import styles from "./Homepage.module.css";
import dataManipulation from "../utils/dataManipulation.js";

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
        // order contactList...
        // the above function to order the list will be the same for when a new connection is opened
        // load the messages on the chat room
        // send the message object (if any to the name)
        // how will the messages object be stored?
        // the messages should be a global variable, since we dont want to fetch the messages all the time
        // hmmmm, not so sure if we should do this
        // in any case the structure will be
        // {receiver, sender, content, time}
        // we will fetch the data using websockets
        setCurrentTarget(name);
        ws.setup(name);
    }

    async function handleSubmitMessage(message) {
        const iv = new Uint8Array(12);
        const messageEncrypted = await cryptoUtils.getEncryptedMessage(
            contactList[currentTarget],
            {
                name: "AES-GCM",
                iv,
            },
            message,
        );
        setContactList((contactInfo) => {
            return { [currentTarget]: contactInfo[currentTarget], ...contactInfo };
        });
        ws.sendMessage(dataManipulation.groupBuffers([iv.buffer, messageEncrypted]));
        setChatMessages((messages) => {
            const arrOriginal = messages[currentTarget];
            return {
                ...messages,
                [currentTarget]: [
                    ...arrOriginal,
                    {
                        id: uuidv4(),
                        author: publicUsername,
                        content: message,
                        createdAt: new Date(),
                    },
                ],
            };
        });
    }

    if (isLogged === false || privateKey === null) {
        routes.navigate("/login");
        return;
    }

    const contactNames = Object.keys(contactList);
    const chatRoomMessages = getCurrentMessages(currentTarget, chatMessages);

    return (
        <div className={styles.container}>
            <div className={styles.leftSide}>
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
                        message = chatMessages[contact].at(-1).content;
                    }
                    return (
                        <PreviewMessages
                            key={contact}
                            name={contact}
                            message={message}
                            handleOnClick={previewOnClick}
                        />
                    );
                })}
            </div>
            <div className={styles.rightSide}>
                <ChatRoom
                    messages={chatRoomMessages}
                    handleOnSubmit={handleSubmitMessage}
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
