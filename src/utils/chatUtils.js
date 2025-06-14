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

export default {
    getCurrentMessages,
    orderChatRoom,
    orderMessages,
    checkRead,
    updateContactLastMessage,
};
