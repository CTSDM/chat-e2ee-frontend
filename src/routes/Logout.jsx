import { useEffect, useContext } from "react";
import { Context } from "./utils/globalStateContext.js";
import routes from "../routes.jsx";
import requests from "../utils/requests.js";

function Logout() {
    const { setIsLogged, setPublicUsername, setPrivateUsername } = useContext(Context);
    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            try {
                const response = await requests.submitLogout(controller);
                if (response.error) {
                    console.log(response.error);
                }
                setIsLogged(false);
                setPublicUsername(null);
                setPrivateUsername(null);
                routes.navigate("/");
                return;
            } catch (err) {
                console.log(err);
            }
        })();
        return () => {
            controller.abort("Cancelled because of React StrictMode it gets called twice.");
        };
    }, [setIsLogged, setPrivateUsername, setPublicUsername]);

    return;
}

export default Logout;
