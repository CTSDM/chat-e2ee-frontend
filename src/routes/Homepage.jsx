import { useContext, useEffect, useState, useRef } from "react";
import SearchMessages from "../components/SearchMessages.jsx";
import PreviewMessages from "../components/PreviewMessages.jsx";
import Chat from "../components/Chat.jsx";
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
import { chatUtils } from "../utils/utils.js";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResult, setSearchResult] = useState({});
    const isResize = useRef(false);
    const [currentTarget, setCurrentTarget] = useState(null);
    const [targetMessage, setTargetMessage] = useState("");
    const timeoutHandler = useRef({});
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
    }, [errMessages]);

    useEffect(() => {
        startWebSocket();
        // for now we empty the message array when a new connection is established
    }, [publicUsername, privateKey, contactList, setChatMessages, userVars, isLogged]);

    useEffect(() => {
        if (isLogged === false || privateKey === null) {
            navigate("/login");
        }
    });

    // scroll into view the message that comes back from the result
    useEffect(() => {
        let divContainer;
        let bubbleHack;
        if (targetMessage) {
            const t = 1000;
            const divMessage = document.getElementById(targetMessage);
            divContainer = divMessage.parentElement.parentElement;
            bubbleHack = divMessage.parentElement.childNodes[1].childNodes[0];
            divContainer.classList.remove(styles.fade);
            divContainer.classList.add(styles.view);
            // we also change the background color of the hack to shape the message bubble
            bubbleHack.classList.add(styles.view);
            bubbleHack.classList.remove(styles.fade);
            divContainer.scrollIntoView();
            // we check if there is another timeout handler, we clear it first
            if (timeoutHandler.current[targetMessage]) {
                clearTimeout(timeoutHandler.current[targetMessage]);
                delete timeoutHandler.current[targetMessage];
            }
            timeoutHandler.current[targetMessage] = setTimeout(() => {
                divContainer.classList.add(styles.fade);
                divContainer.classList.remove(styles.view);
                bubbleHack.classList.add(styles.fade);
                bubbleHack.classList.remove(styles.view);
            }, t);
        }
        return () => {
            if (!targetMessage) {
                const keys = Object.keys(timeoutHandler.current);
                keys.forEach((key) => {
                    clearTimeout(timeoutHandler.current[key]);
                });
                timeoutHandler.current = {};
            }
        };
    }, [targetMessage, setTargetMessage]);

    if (isLogged === false || privateKey === null) {
        return null;
    }

    function startWebSocket() {
        if (ws.getSocket() === null && isLogged) {
            ws.start(
                publicUsername,
                privateKey,
                // we want to return the latest value of contact list
                symmetricKey,
                contactList,
                setChatMessages,
                userVars,
            );
        }
    }

    async function handleNewConnection(typedPublicUsername) {
        // here we have to make sure that the response handles beautifully all the different options
        const response = await requests.getPublicKey("user", typedPublicUsername.toLowerCase());
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
                name: targetPublicUsername,
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

    function handlePreviewSearch(name, messageId) {
        setCurrentTarget(name);
        setTargetMessage((previousId) => {
            if (previousId === messageId) {
                setTimeout(() => setTargetMessage(messageId), 0);
                return "";
            } else {
                return messageId;
            }
        });
    }

    async function onSubmitCreateGroup(usernamesArr, groupName) {
        // the current user will register itself to the group
        // and then it will send a new symmetric key encrypted to the server for storage
        // flagByte 3 send a message to the server to create the group
        // flagByte 4 send encrypted key with DH to the database
        // flagByte 5 signals the end of the group creation
        const [groupId, key, keyRaw] = await createGroup(groupName);
        // add the new group to the contactList
        contactList.current[groupId] = {
            // username will be the group name
            name: groupName,
            members: [publicUsername, ...usernamesArr],
            type: "group",
            key: key,
        };
        usernamesArr.splice(0, 0, publicUsername.toLowerCase());
        // send encrypted keys to users and database
        await addMemberToGroup(usernamesArr, groupId, keyRaw, symmetricKey, contactList);
        ws.sendMessage(5, groupId, cryptoUtils.getRandomValues(12));
        // we update the states at the end after the async operations
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
        const flagByte = 1;
        const dateString = new Date().getTime().toString();
        const dateArr = dataManipulation.stringToUint8Array(dateString, 16);
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
            dateArr.buffer,
            iv.buffer,
            messageEncrypted,
        ]);
        ws.sendMessage(flagByte, currentTarget, data);
        const isGroup = currentTarget.length === 36;
        setChatMessages((previousMessages) => {
            const newMessages = structuredClone(previousMessages);
            const newMessage = {
                author: publicUsername,
                content: message,
                createdAt: new Date(),
                // the message we sent is by default false
                read: false,
            };
            if (isGroup) {
                newMessage.read = [];
            } else {
                newMessage.read = false;
            }
            newMessages[currentTarget].messages[id] = newMessage;
            newMessages[currentTarget].last = id;
            return newMessages;
        });
    }

    async function readMessages(messages, groupId) {
        // messages is an obj
        // we are reading the messages of the currentTarget
        // the read status does not have a time stamp
        for (let i = 0; i < messages.length; ++i) {
            const message = messages[i];
            if (groupId) {
                if (message.author !== publicUsername && !message.read.includes(publicUsername)) {
                    message.read.push(publicUsername);
                    const usernameBuff = dataManipulation.stringToUint8Array(publicUsername, 16);
                    const messageIdBuff = dataManipulation.stringToUint8Array(message.id);
                    const dateArr = dataManipulation.stringToUint8Array(
                        new Date().getTime().toString(),
                        16,
                    );
                    const data = dataManipulation.groupBuffers([
                        usernameBuff,
                        messageIdBuff,
                        dateArr,
                    ]);
                    ws.sendMessage(2, currentTarget, data);
                    setChatMessages((previousChatMessages) => {
                        const newChatMessages = structuredClone(previousChatMessages);
                        newChatMessages[currentTarget].messages[message.id] = message;
                        return newChatMessages;
                    });
                }
            } else {
                if (message.author === chatMessages[currentTarget].name && message.read === false) {
                    message.read = true;
                    const usernameBuff = dataManipulation.stringToUint8Array(
                        publicUsername.toLowerCase(),
                        16,
                    );
                    const messageIdBuff = dataManipulation.stringToUint8Array(message.id);
                    const data = dataManipulation.groupBuffers([usernameBuff, messageIdBuff]);
                    ws.sendMessage(2, currentTarget, data);
                    // we need to update the message.read so it persists
                    setChatMessages((previousChatMessages) => {
                        const newChatMessages = structuredClone(previousChatMessages);
                        newChatMessages[currentTarget].messages[message.id] = message;
                        return newChatMessages;
                    });
                }
            }
        }
    }

    // these results are recalculated for every rerender of the homepage...
    const results = getKeys(searchResult);
    const contactsOrdered = getContactsOrdered(contactList.current);

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
                <SearchMessages
                    setSearchTerm={setSearchTerm}
                    searchTerm={searchTerm}
                    setResult={setSearchResult}
                    result={searchResult}
                    chatList={chatMessages}
                />
                <div className={styles.chatContainer}>
                    {contactsOrdered.length === 0 ? <div>No users yet...</div> : null}
                    {searchTerm
                        ? results.map((messageId) => {
                              const message = searchResult[messageId];
                              const context = message.context;
                              return (
                                  <PreviewMessages
                                      key={messageId}
                                      id={context}
                                      contact={contactList.current[context].name}
                                      username={publicUsername}
                                      message={message}
                                      readStatus={chatUtils.checkRead(
                                          contactList.current[context],
                                          message,
                                      )}
                                      handleOnClick={handlePreviewSearch}
                                  />
                              );
                          })
                        : contactsOrdered.map((contact) => {
                              const lastMessageId = chatMessages[contact].last;
                              const message = chatMessages[contact].messages[lastMessageId];
                              return (
                                  <PreviewMessages
                                      key={contact}
                                      id={contact}
                                      contact={contactList.current[contact].name}
                                      username={publicUsername}
                                      message={message}
                                      readStatus={chatUtils.checkRead(
                                          contactList.current[contact],
                                          message,
                                      )}
                                      target={currentTarget}
                                      handleOnClick={previewOnClick}
                                  />
                              );
                          })}
                </div>
            </div>
            <div
                className={styles.resizeHandler}
                onMouseDown={() => (isResize.current = true)}
            ></div>
            <div className={styles.rightSide}>
                {currentTarget ? (
                    <Chat
                        contactInfo={contactList.current[currentTarget]}
                        messages={chatMessages}
                        handleOnSubmit={handleSubmitMessage}
                        handleOnRender={readMessages}
                        username={publicUsername}
                        id={currentTarget} // If the string is uuidv4 then we have a group
                    />
                ) : (
                    <div></div>
                )}
            </div>
        </div>
    );
}

function getKeys(obj) {
    // the expected object should be as follows
    // {id1: {key: ..., username: ...}, ..., {idn: {key: ..., username: ...}}
    const arr = [];
    for (let key in obj) {
        arr.push(key);
    }
    return arr;
}

async function createGroup(groupName) {
    const groupId = uuidv4();
    const groupMaxLength = env.validation.group.maxLength;
    const groupNameArr = dataManipulation.stringToUint8Array(groupName, groupMaxLength);
    const dateArr = dataManipulation.stringToUint8Array(new Date().getTime().toString(), 16);
    const data = dataManipulation.groupBuffers([groupNameArr, dateArr]);
    const key = await cryptoUtils.getAESGCMkey();
    const keyRaw = await cryptoUtils.getExportedKeyRaw(key);
    ws.sendMessage(3, groupId, data);
    return [groupId, key, keyRaw];
}

async function addMemberToGroup(usersArr, groupId, keyRaw, symmetricKey, contactList) {
    for (let i = 0; i < usersArr.length; ++i) {
        const username = usersArr[i];
        // the current user will encrypt this keyRAW with his own symmetric key (the same that uses to encrypt their key pair)
        // encrypt the key with the current symmetric key --> send to the server
        // for other users we first derive the shared key and then encrypt the new raw key with that
        const iv = cryptoUtils.getRandomValues(12);
        let rawKeyEnc;
        const keyType = [0];
        if (i == 0) {
            // the first index corresponds to the current user
            rawKeyEnc = await cryptoUtils.getEncryptedMessage(
                symmetricKey,
                { name: "AES-GCM", iv: iv },
                keyRaw,
            );
            keyType[0] = 1;
        } else {
            rawKeyEnc = await cryptoUtils.getEncryptedMessage(
                contactList.current[username].key,
                { name: "AES-GCM", iv: iv },
                keyRaw,
            );
        }
        const keyUserData = dataManipulation.groupBuffers([iv, rawKeyEnc, keyType]);
        const usernameArr = dataManipulation.stringToUint8Array(username, 16);
        const data = dataManipulation.groupBuffers([usernameArr, keyUserData]);
        ws.sendMessage(4, groupId, data);
    }
}

function getContactsOrdered(contactList) {
    const contactsId = getKeys(contactList);
    contactsId.sort((a, b) => {
        const timeA = contactList[a].lastTime;
        const timeB = contactList[b].lastTime;
        if (timeA === undefined) {
            return 1;
        } else if (timeB === undefined) {
            return -1;
        }
        return timeB - timeA;
    });
    return contactsId;
}
