import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import requests from "../utils/requests.js";
import { Context } from "./utils/globalStateContext.js";
import NavigationBar from "../components/NavigationBar.jsx";
import { env } from "../../config/config.js";
import { userUtils } from "../utils/utils.js";
import styles from "./Root.module.css";

function GlobalContextProvider() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLogged, setIsLogged] = useState(false);
    const [privateUsername, setPrivateUsername] = useState(null);
    const [publicUsername, setPublicUsername] = useState(null);
    const [contactList, setContactList] = useState({});
    const [privateKey, setPrivateKey] = useState(null);
    const message = useRef();
    const userVars = useRef({});

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
                    setPrivateUsername(response.privateUsername);
                    setPublicUsername(response.publicUsername);
                    userUtils.updateOneTimeVariables(userVars, response);
                } else {
                    setIsLogged(false);
                    setPrivateUsername(null);
                    setPublicUsername(null);
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
            value={{
                isLogged,
                setIsLogged,
                privateUsername,
                setPrivateUsername,
                publicUsername,
                setPublicUsername,
                privateKey,
                setPrivateKey,
                contactList,
                setContactList,
                userVars,
                message,
            }}
        >
            {isLoading ? (
                <div>loading</div>
            ) : (
                <div className={styles.container}>
                    <header>
                        <NavigationBar isLogged={isLogged} publicUsername={publicUsername} />
                    </header>
                    <div className={styles.container}>
                        <Outlet />
                    </div>
                </div>
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
