import { useState, useContext, useEffect } from "react";
import { useNavigate, useActionData } from "react-router-dom";
import { Context } from "./utils/globalStateContext.js";
import { env } from "../../config/config.js";
import ErrMsg from "../components/ErrMsg.jsx";
import routes from "../routes.jsx";
import { dataManipulationUtils as dataManipulation } from "../utils/utils.js";
import styles from "./Signup.module.css";
import FormCredentials from "../components/FormCredentials.jsx";

export default function Signup() {
    const [info, setInfo] = useState("");
    const [msgArr, setMsgArr] = useState([[], [], []]);
    const { isLogged, setIsLogged, message: refMessage } = useContext(Context);
    const navigate = useNavigate();
    const response = useActionData();

    useEffect(() => {
        if (!response) {
            refMessage.current = null;
        }
        if (response && response.status) {
            if (response.status === 200) {
                setInfo("Success");
                refMessage.current = "You have successfully created an account";
                navigate("/login");
                return;
            } else if (response.status >= 400 && response.status < 500) {
                setInfo("Something went wrong with your form, please correct the errors.");
                setIsLogged(false);
                return;
            }
        }
    }, [response, navigate, refMessage, setIsLogged]);

    useEffect(() => {
        const errCount = dataManipulation.getLengthArrofArr(msgArr);
        if (errCount === 0) {
            setInfo(null);
        }
    }, [msgArr]);

    function handleSubmit(e) {
        const errCount = dataManipulation.getLengthArrofArr(msgArr);
        if (errCount > 0) {
            setInfo("The following errors where found while validating the data on the front-end");
            e.preventDefault();
        }
    }

    if (isLogged === true) {
        routes.navigate("/");
        return;
    }

    return (
        <>
            <div className={styles.container}>
                <div className={styles["container-information"]}>
                    <div className={styles.instructions}>
                        <div>
                            The username must have between {env.validation.users.username.minLength}{" "}
                            and {env.validation.users.username.maxLength} characters.
                        </div>
                        <div>
                            The password must have between {env.validation.users.password.minLength}{" "}
                            and {env.validation.users.password.maxLength} characters.
                        </div>
                    </div>
                    {info ? (
                        <div className={styles.errors}>
                            <>
                                <div>{info}</div>
                                {response && response.status >= 400 ? (
                                    <ErrMsg
                                        messages={response.data.errMsg || [].concat(...msgArr)}
                                    />
                                ) : null}
                                {dataManipulation.getLengthArrofArr(msgArr) ? (
                                    <ErrMsg messages={[].concat(...msgArr)} />
                                ) : null}
                            </>
                        </div>
                    ) : null}
                </div>
                <FormCredentials
                    inputs={env.inputs.signup}
                    msgArr={msgArr}
                    setMsgArr={setMsgArr}
                    handleSubmit={handleSubmit}
                    action={"/signup"}
                    validate={true}
                    buttonText="Create account"
                />
            </div>
        </>
    );
}
