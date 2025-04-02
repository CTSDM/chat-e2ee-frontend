import { env } from "../config/config";
import { dataManipulationUtils as dataManipulations } from "../src/utils/utils";
import { v4 as uuidv4 } from "uuid";

const contactList = ["Lima", "Chisa", "야옹이"];
const user = {
    privateUsername: "felix",
    publicUsername: "Chano",
    privateKeyEncrypted: dataManipulations.hexStringToUint8Array(env.test.privateKeyEncrypted),
    salt: dataManipulations.hexStringToUint8Array(env.test.salt),
    iv: dataManipulations.hexStringToUint8Array(env.test.iv),
};
const groupList = [
    {
        id: uuidv4(),
        members: [user.publicUsername, contactList[0], contactList[1]],
        name: "Chanos OG",
    },
    {
        id: uuidv4(),
        members: [user.publicUsername, contactList[0], contactList[1], contactList[2]],
        name: "International friends",
    },
];

const groupMessages = {
    valid: {
        [groupList[0].id]: {
            [uuidv4()]: {
                author: user.publicUsername,
                content: "hello there, welcome to my group.",
                createdAt: new Date(0),
                readBy: [contactList[0], contactList[1]],
            },
            [uuidv4()]: {
                author: contactList[0],
                content: "wassup",
                createdAt: new Date(0),
                readBy: "unknown",
            },
            [uuidv4()]: {
                author: contactList[1],
                content: "what's going on?",
                createdAt: new Date(0),
                readBy: "unknown",
            },
            [uuidv4()]: {
                author: user.publicUsername,
                content: "let's just get it over with.",
                createdAt: new Date(0),
                readBy: "unknown",
            },
        },
        [groupList[1].id]: {
            [uuidv4()]: {
                author: user.publicUsername,
                content: "hello, 안녕하세요!",
                createdAt: new Date(0),
                readBy: [contactList[0], contactList[1], contactList[2]],
            },
            [uuidv4()]: {
                author: user.publicUsername,
                content: "test test",
                createdAt: new Date(0),
                readBy: [contactList[0], contactList[1]],
            },
            [uuidv4()]: {
                author: contactList[2],
                content: "하이",
                createdAt: new Date(0),
                readBy: "unknown",
            },
            [uuidv4()]: {
                author: contactList[1],
                content: "i don't speak korean, friendo",
                createdAt: new Date(0),
                readBy: "unknown",
            },
        },
    },
};

const privateMessages = {
    valid: {
        [contactList[0]]: {
            [uuidv4()]: {
                author: user.publicUsername,
                content: "hello there, open the door.",
                createdAt: new Date(0),
                read: false,
            },
            [uuidv4()]: {
                author: contactList[0],
                content: "no, as soon as you enter here you will eat my food.",
                createdAt: new Date(1000 * 60),
                read: true,
            },
            [uuidv4()]: {
                author: user.publicUsername,
                content: "i'm hungry, open the doooor!",
                createdAt: new Date(1000 * 60 * 5),
                read: false,
            },
        },
        [contactList[1]]: {
            [uuidv4()]: {
                author: user.publicUsername,
                content: "hello there",
                createdAt: new Date(0),
                read: false,
            },
            [uuidv4()]: {
                author: contactList[1],
                content: "what door",
                createdAt: new Date(1000 * 60 * 10),
                read: true,
            },
            [uuidv4()]: {
                author: user.publicUsername,
                content: "wrong chat",
                createdAt: new Date(1000 * 60 * 5 * 3),
                read: false,
            },
        },
    },
};

export default { privateMessages, groupMessages, user, contactList, groupList };
