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

function orderChatRoom(messages) {
    // the chatrooms will be ordered by date
    const messagesArr = [];
    for (let key in messages) {
        const message = messages[key];
        message.id = key;
        messagesArr.push(message);
    }
    if (messagesArr.length > 1) {
        messagesArr.sort((a, b) => {
            if (a.createdAt > b.createdAt) return 1;
            else if (a.createdAt < b.createdAt) return -1;
            return 0;
        });
    }
    return messagesArr;
}

function checkRead(context, message) {
    console.log(context);
    console.log(message);
    if (message) {
        if (context > 16) {
            return message.read.length === context.members.length - 1;
        } else {
            return message.read;
        }
    } else {
        return false;
    }
}

export default { getCurrentMessages, orderChatRoom, checkRead };
