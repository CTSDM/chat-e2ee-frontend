import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import requests from "../utils/requests.js";
import { Context } from "./utils/globalStateContext.js";
import NavigationBar from "../components/NavigationBar.jsx";
import { env } from "../../config/config.js";
import { dataManipulationUtils as dataManipulation, userUtils } from "../utils/utils.js";
import routes from "../routes.jsx";
import { cryptoUtils } from "../utils/utils.js";
import styles from "./Root.module.css";

function GlobalContextProvider() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLogged, setIsLogged] = useState(false);
    const [privateUsername, setPrivateUsername] = useState(null);
    const [publicUsername, setPublicUsername] = useState(null);
    const [privateKey, setPrivateKey] = useState(null);
    const [publicKey, setPublicKey] = useState(null);
    const [symmetricKey, setSymmetricKey] = useState(null);
    const [chatMessages, setChatMessages] = useState({});
    const contactList = useRef({});
    const message = useRef();
    const userVars = useRef({});
    const isError = useRef(false);

    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            setIsLoading(true);
            try {
                const response = await requests.getLogin(controller);
                if (response === undefined) {
                    setIsLoading(false);
                    return;
                }

                if (env.dev.status) {
                    await sleep(env.dev.delay);
                }
                if (response.status === 200) {
                    // all this code is repeated also in login when we do a post
                    // we should encapsulate all this code into its own function
                    // i think so
                    setIsLogged(true);
                    setPrivateUsername(response.privateUsername);
                    setPublicUsername(response.publicUsername);
                    (async () => {
                        const publicKeyJWKArr = dataManipulation.objArrToUint8Arr(
                            response.publicKey,
                        );
                        const publicKeyJWK = JSON.parse(
                            dataManipulation.Uint8ArrayToStr(publicKeyJWKArr),
                        );
                        const publicKey = await cryptoUtils.importKey(
                            publicKeyJWK,
                            { name: "ECDH", namedCurve: "P-256" },
                            [],
                        );
                        setPublicKey(publicKey);
                    })();
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

    useEffect(() => {
        if (isLogged === false || privateKey === null) {
            if (isError.current === false) {
                routes.navigate("/login");
                return;
            }
        }
    }, [isLogged, privateKey]);

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
                publicKey,
                setPublicKey,
                contactList,
                userVars,
                message,
                chatMessages,
                setChatMessages,
                symmetricKey,
                setSymmetricKey,
                isError,
            }}
        >
            {isLoading ? (
                <div>loading</div>
            ) : (
                <div className={styles.container}>
                    <header>
                        <NavigationBar isLogged={isLogged} publicUsername={publicUsername} />
                    </header>
                    <Outlet />
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
