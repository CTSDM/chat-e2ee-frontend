import { useState, useEffect, useContext } from "react";
import { Context } from "./utils/globalStateContext.js";
import requests from "../utils/requests.js";
import ws from "../websocket/ws.js";

function Logout() {
    const {
        setIsLogged,
        setPublicUsername,
        setPrivateUsername,
        setPrivateKey,
        isError,
        contactList,
        userVars,
    } = useContext(Context);
    const [errorMessage, setErrorMessage] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            const response = await requests.submitLogout(controller);
            contactList.current = {};
            userVars.current = {};
            setIsLogged(false);
            if (ws.getSocket()) {
                ws.closeSocket();
            }
            setPublicUsername(null);
            setPrivateUsername(null);
            setPrivateKey(null);
            const errorMsg = response.message || response.error;
            if (errorMsg) {
                isError.current = true;
                setErrorMessage(errorMsg);
            } else {
                isError.current = false;
            }
        })();
        // because this route is ephimeral we don't add a return to cancel the request
        // otherwise, the request will never be made!
    }, []);

    if (errorMessage) {
        throw new Error(errorMessage);
    }
}

export default Logout;
