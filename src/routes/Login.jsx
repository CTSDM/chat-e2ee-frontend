import { useState, useContext, useEffect } from "react";
import { useNavigate, useActionData, redirect } from "react-router-dom";
import { Context } from "./utils/globalStateContext.js";
import FormCredentials from "../components/FormCredentials.jsx";
import { cryptoUtils, userUtils } from "../utils/utils.js";
import { env } from "../../config/config.js";
import styles from "./Login.module.css";

export default function Login() {
    const [info, setInfo] = useState("");
    const {
        isLogged,
        setIsLogged,
        setPrivateUsername,
        setPublicUsername,
        setPrivateKey,
        privateKey,
        userVars,
        message: refMessage,
    } = useContext(Context);
    const navigate = useNavigate();
    const response = useActionData();

    // We only want the success signup message to be shown once
    useEffect(() => {
        if (refMessage) {
            refMessage.current = null;
        }
    }, [refMessage]);

    useEffect(() => {
        if (isLogged && privateKey) {
            navigate("/");
            return;
        }
        if (response) {
            if (response.status === 200) {
                setInfo("APE IS IN");
                setIsLogged(true);
                setPrivateUsername(response.privateUsername);
                setPublicUsername(response.publicUsername);
                userUtils.updateOneTimeVariables(userVars, response);
                return;
            } else {
                setInfo("YOU NOT APE");
                setIsLogged(false);
                redirect("/login");
                return;
            }
        }
    }, [response, privateKey]);

    function decryptPassword(e) {
        // obtain the data from the form
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const password = formData.get("keyPassword");
        // set the key
        (async () => {
            try {
                const key = await cryptoUtils.importPrivateKeyEncrypted(
                    userVars.current.privateKeyEncrypted,
                    password,
                    userVars.current.salt,
                    userVars.current.iv,
                );
                setPrivateKey(key);
                navigate("/");
            } catch (err) {
                console.log(err);
                setInfo("Wrong password");
            }
        })();
    }

    return (
        <>
            <div className={styles.container}>
                <div>
                    <div className={styles.message}>{refMessage.current}</div>
                    {isLogged ? (
                        <FormCredentials
                            buttonText={"Decrypt"}
                            inputs={env.inputs.decrypt}
                            validate={false}
                            handleSubmit={decryptPassword}
                        />
                    ) : (
                        <FormCredentials
                            buttonText={"Sign in"}
                            inputs={env.inputs.login}
                            action={"/login"}
                            validate={false}
                        />
                    )}
                    <div>{info}</div>
                </div>
            </div>
        </>
    );
}
