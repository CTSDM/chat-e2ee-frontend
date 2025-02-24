const elementsNavBar = {
    loggedIn: { Home: "/", Logout: "/logout" },
    loggedOut: { Home: "/", Signup: "/signup", Login: "/login" },
};

const env = {
    inputs: {
        login: [
            {
                type: "text",
                name: "username",
                placeholder: import.meta.env.VITE_USERNAME_PLACEHOLDER,
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
                placeholder: import.meta.env.VITE_USERNAME_PLACEHOLDER,
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
    },
    serverUrl: import.meta.env.VITE_SERVER,
    dev: {
        status: import.meta.env.VITE_DEV_STATUS,
        delay: import.meta.env.VITE_DELAY,
    },
    crypto: {
        iterations: import.meta.env.VITE_CRYPTO_ITERATIONS,
    },
};

export { env, elementsNavBar };
