import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import requests from "../utils/requests.js";
import { Context } from "./utils/globalStateContext.js";
import NavigationBar from "../components/NavigationBar.jsx";
import styles from "./GlobalStateProvider.module.css";
import { env } from "../../config/config.js";

function GlobalContextProvider() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLogged, setIsLogged] = useState(false);
    const [username, setUsername] = useState(null);
    const [privateKey, setPrivateKey] = useState(null);
    const [publicKey, setPublicKey] = useState(null);
    const [encryptionKey, setEncryptionKey] = useState(null);
    const message = useRef();

    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            setIsLoading(true);
            try {
                const response = await requests.getLogin(controller);

                if (env.dev.status) {
                    await sleep(env.dev.delay);
                }
                if (response.status === 200) {
                    setIsLogged(true);
                    setUsername(response.username);
                } else {
                    setIsLogged(false);
                    setUsername(null);
                }
                setIsLoading(false);
            } catch (err) {
                console.log(err);
            }
        })();
        return () => {
            controller.abort("Cancelled because of React StrictMode it gets called twice.");
        };
    }, []);

    return (
        <Context.Provider
            value={[
                isLogged,
                setIsLogged,
                username,
                setUsername,
                message,
                setPrivateKey,
                setPublicKey,
                setEncryptionKey,
            ]}
        >
            {isLoading ? (
                <div>loading</div>
            ) : (
                <>
                    <header>
                        <NavigationBar isLogged={isLogged} username={username} />
                    </header>
                    <div className={styles.container}>
                        <Outlet />
                    </div>
                </>
            )}
        </Context.Provider>
    );
}

GlobalContextProvider.propTypes = {
    children: PropTypes.element,
};

// function to mimic rount trip form the server
async function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

export default GlobalContextProvider;
