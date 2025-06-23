function getCurrentMessages(messagesObj, target) {
    if (messagesObj && target) {
        if (messagesObj[target]) {
            // we return an array ordered by date
            // we are comparing dates, should be done with quicksort
            const messages = messagesObj[target].messages;
            const messagesArr = orderChatRoom(messages);
            return messagesArr;
        }
    } else return undefined;
}

function orderChatRoom(messages, desc) {
    // the chatrooms will be ordered by date
    const messagesArr = [];
    for (let key in messages) {
        const message = messages[key];
        message.id = key;
        messagesArr.push(message);
    }
    orderMessages(messagesArr, desc);
    return messagesArr;
}

function orderMessages(messagesArr, desc) {
    // order an array of messages by date
    // desc === true, otherwise the order is asc
    const order = desc ? -1 : 1;
    if (messagesArr.length > 1) {
        messagesArr.sort((a, b) => {
            if (a.createdAt > b.createdAt) return order;
            else if (a.createdAt < b.createdAt) return -1 * order;
            return 0;
        });
    }
}

function checkRead(contextObj, message) {
    if (message) {
        if (contextObj.type === "group") {
            return message.read.length === contextObj.members.length - 1;
        } else {
            return message.read;
        }
    } else {
        return false;
    }
}

function updateContactLastMessage(contactObj, time) {
    // only update if the new time is newer than the curren stored time
    if (contactObj.lastTime === undefined) {
        contactObj.lastTime = time;
    } else if (contactObj.lastTime < time) {
        contactObj.lastTime = time;
    }
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

function getUnread(messages, context, username) {
    if (context.length === 36) {
        const count = getUnreadGroups(messages, context, username);
        return count;
    } else {
        const count = getUnreadPrivate(messages);
        return count;
    }
}

function getUnreadPrivate(messages) {
    const messagesArr = orderChatRoom(messages);
    if (messagesArr && messagesArr.length) {
        let count = 0;
        for (let i = messagesArr.length - 1; i > 0; --i) {
            if (messagesArr[i].read === false) {
                ++count;
            } else {
                break;
            }
        }
        return count;
    }
}

function getUnreadGroups(messages, contact, username) {
    const messagesArr = orderChatRoom(messages);
    if (messagesArr && messagesArr.length) {
        let count = 0;
        for (let i = messagesArr.length - 1; i > 0; --i) {
            const message = messagesArr[i];
            if (message.read.length === 0) {
                ++count;
            } else {
                if (checkRead(contact, message)) break;
                else if (message.author === username) break;
                ++count;
            }
        }
        return count;
    }
}

function getAllUsersId(contactList) {
    const contactsId = getKeys(contactList);
    const usersId = contactsId.filter((id) => contactList[id].type === "user");
    return usersId;
}

function getUsersId(contactList, search) {
    const allUsersId = getAllUsersId(contactList);
    if (!search) {
        return allUsersId;
    } else {
        const searchLength = search.length;
        const filteredIds = allUsersId.filter((id) => {
            if (search.length > id.length) {
                return false;
            } else {
                for (let i = 0; i < searchLength; ++i) {
                    if (search[i] !== id[i]) {
                        return false;
                    }
                }
            }
            return true;
        });
        return filteredIds;
    }
}

export default {
    getCurrentMessages,
    orderChatRoom,
    orderMessages,
    checkRead,
    updateContactLastMessage,
    getContactsOrdered,
    getUnread,
    getUsersId,
};
