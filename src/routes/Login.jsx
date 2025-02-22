import { useState, useContext, useEffect } from "react";
import { useNavigate, useActionData, redirect } from "react-router-dom";
import { Context } from "./utils/globalStateContext.js";
import FormCredentials from "../components/FormCredentials.jsx";
import { env } from "../../config/config.js";
import styles from "./Login.module.css";
import requests from "../utils/requests.js";

export default function Login() {
    const [info, setInfo] = useState("");
    const [
        isLogged,
        setIsLogged,
        ,
        setUsername,
        refMessage,
        setPrivateKey,
        setPublicKey,
        setEncryptionKey,
    ] = useContext(Context);
    const navigate = useNavigate();
    const response = useActionData();

    // We only want the message to be shown once
    useEffect(() => {
        if (refMessage) {
            refMessage.current = null;
        }
    }, [refMessage]);

    useEffect(() => {
        if (isLogged) {
            navigate("/");
            return;
        }
        if (response) {
            if (response.status === 200) {
                setInfo("APE IS IN");
                setIsLogged(true);
                setUsername(response.username);
                setPrivateKey(response.privateKey);
                setPublicKey(response.publicKey);
                setEncryptionKey(response.encryptionKey);
                navigate("/");
                return;
            } else {
                setInfo("YOU NOT APE");
                setIsLogged(false);
                redirect("/login");
                return;
            }
        }
    }, [response]);

    return (
        <>
            <div className={styles.container}>
                <div>
                    <div className={styles.message}>{refMessage.current}</div>
                    <FormCredentials
                        buttonText={"Sign in"}
                        inputs={env.inputs.login}
                        action={"/login"}
                        validate={false}
                    />
                    <div>{info}</div>
                </div>
            </div>
        </>
    );
}

export const action = async ({ request }) => {
    const data = await request.formData();
    const submission = {
        username: data.get("username"),
        password: data.get("password"),
    };
    const response = await requests.submitLogin(submission);
    return response;
};
