import { env } from "../config/config";
import { dataManipulationUtils as dataManipulations } from "../src/utils/utils";
import { v4 as uuidv4 } from "uuid";

const messages = {
    valid: [
        {
            id: uuidv4(),
            author: "felix",
            content: "hello there, open the door.",
            createdAt: new Date(0),
        },
        {
            id: uuidv4(),
            author: "lima",
            content: "no, as soon as you enter here you will eat my food.",
            createdAt: new Date(1000 * 60),
        },
        {
            id: uuidv4(),
            author: "felix",
            content: "i'm hungry, open the doooor!",
            createdAt: new Date(1000 * 60 * 2),
        },
    ],
    username: "felix",
};

// i also need my public key to do stuff...
const user = {
    privateUsername: "felix",
    publicUsername: "chano",
    privateKeyEncrypted: dataManipulations.hexStringToUint8Array(env.test.privateKeyEncrypted),
    salt: dataManipulations.hexStringToUint8Array(env.test.salt),
    iv: dataManipulations.hexStringToUint8Array(env.test.iv),
};

export default { messages, user };
