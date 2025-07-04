const elementsNavBar = {
    loggedIn: { Home: "/", Logout: "/logout" },
    loggedOut: { Home: "/", Signup: "/signup", Login: "/login" },
};

const texts = {
    noChat: {
        title: "Your chats will appear here",
        body: "Add contacts now to start a conversation!",
    },
    noContacts: {
        title: "Your contacts will appear here",
        body: "Add contacts now to start a conversation!",
    },
};

const env = {
    inputs: {
        message: {
            type: "text",
            name: "message",
            placeholder: "Message",
            limit: 4096,
        },
        decrypt: [
            {
                type: "password",
                name: "keyPassword",
                placeholder: import.meta.env.VITE_PASSWORD_KEY_PLACEHOLDER,
            },
        ],
        login: [
            {
                type: "text",
                name: "username",
                placeholder: import.meta.env.VITE_USERNAME_PRIVATE_PLACEHOLDER,
                validation: "username",
            },
            {
                type: "password",
                name: "password",
                placeholder: import.meta.env.VITE_PASSWORD_PLACEHOLDER,
                validation: "password",
            },
        ],
        signup: [
            {
                type: "text",
                name: "privateUsername",
                placeholder: import.meta.env.VITE_USERNAME_PRIVATE_PLACEHOLDER,
                validation: "username",
            },
            {
                type: "text",
                name: "publicUsername",
                placeholder: import.meta.env.VITE_USERNAME_PUBLIC_PLACEHOLDER,
                validation: "username",
            },
            {
                type: "password",
                name: "password",
                placeholder: import.meta.env.VITE_PASSWORD_PLACEHOLDER,
                validation: "password",
            },
            {
                type: "password",
                name: "keyPassword",
                placeholder: import.meta.env.VITE_PASSWORD_KEY_PLACEHOLDER,
                validation: "password",
            },
        ],
    },
    validation: {
        users: {
            username: {
                minLength: import.meta.env.VITE_USERNAME_MIN_LENGTH,
                maxLength: import.meta.env.VITE_USERNAME_MAX_LENGTH,
                regex: import.meta.env.VITE_USERNAME_REGEX,
                message: import.meta.env.VITE_USERNAME_REGEX_MESSAGE,
            },
            password: {
                minLength: import.meta.env.VITE_PASSWORD_MIN_LENGTH,
                maxLength: import.meta.env.VITE_PASSWORD_MAX_LENGTH,
                regex: import.meta.env.VITE_PASSWORD_REGEX,
                message: import.meta.env.VITE_PASSWORD_REGEX_MESSAGE,
            },
        },
        group: {
            maxLength: 50,
        },
    },
    serverUrl: import.meta.env.VITE_SERVER,
    wsUrl: import.meta.env.VITE_WS_SERVER,
    dev: {
        status: import.meta.env.VITE_DEV_STATUS,
        delay: import.meta.env.VITE_DELAY,
    },
    crypto: {
        iterations: 250000,
    },
    test: {
        privateKeyEncrypted: import.meta.env.VITE_TEST_PRIVATE_KEY_ENCRYPTED,
        salt: import.meta.env.VITE_TEST_SALT,
        iv: import.meta.env.VITE_TEST_IV,
    },
    metaInfo: {
        target: 48, // bytes
    },
};

env.wsType = env.dev.status ? "ws" : "wss";

export { env, elementsNavBar, texts };
