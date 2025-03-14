import { useEffect, useContext } from "react";
import { Context } from "./utils/globalStateContext.js";
import routes from "../routes.jsx";
import requests from "../utils/requests.js";
import ws from "../websocket/ws.js";

function Logout() {
    const { setIsLogged, setPublicUsername, setPrivateUsername, setPrivateKey } =
        useContext(Context);
    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            try {
                const response = await requests.submitLogout(controller);
                if (response.error) {
                    console.log(response.error);
                }
                // we should also close the ws connection!
                setIsLogged(false);
                ws.closeSocket();
                setPublicUsername(null);
                setPrivateUsername(null);
                setPrivateKey(null);
                routes.navigate("/");
                return;
            } catch (err) {
                console.log(err);
            }
        })();
        return () => {
            controller.abort("Cancelled because of React StrictMode it gets called twice.");
        };
    }, [setIsLogged, setPrivateUsername, setPublicUsername, setPrivateKey]);

    return;
}

export default Logout;
