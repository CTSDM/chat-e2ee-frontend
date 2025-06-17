import PropTypes from "prop-types";
import { useRef, useState } from "react";
import { Form } from "react-router-dom";
import InputText from "./InputComp";
import styles from "./DialogNewGroup.module.css";

export default function DialogNewGroup({ state, contactList, setErrMessage, onSubmit }) {
    const usernameArr = [];
    const usernameOCArr = [];
    const [info, setInfo] = useState("");
    const refDialog = useRef(null);

    for (let key in contactList) {
        if (contactList[key].type === "user") {
            usernameArr.push(key);
            usernameOCArr.push(contactList[key].name);
        }
    }

    if (state) {
        if (usernameArr.length === 0) {
            return setErrMessage("You don't have any contacts yet.");
        }
        refDialog.current.classList.add(styles.dialogContent);
        refDialog.current.showModal();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        // this gives us an array
        const valuesArr = formData.getAll("username");
        if (valuesArr.length > 0) {
            const groupName = formData.get("group");
            await onSubmit(valuesArr, groupName);
            cancelSubmit(e);
        } else {
            setInfo("Please select at least one contact");
        }
    }

    function cancelSubmit() {
        const form = refDialog.current.querySelector(`.${styles.container} form`);
        refDialog.current.classList.remove(styles.dialogContent);
        refDialog.current.close();
        form.reset();
    }

    function closeDialog(e) {
        if (e.target === refDialog.current) {
            refDialog.current.classList.remove(styles.dialogContent);
            refDialog.current.close();
            setInfo("");
        }
    }

    function handleOnCloseDialog() {
        const form = refDialog.current.querySelector("form");
        refDialog.current.classList.remove(styles.dialogContent);
        setInfo("");
        form.reset();
    }

    return (
        <div className={styles.container}>
            <dialog onClick={closeDialog} onClose={handleOnCloseDialog} ref={refDialog}>
                <Form onSubmit={handleSubmit}>
                    <div className={styles.dialogContent}>
                        <div className={styles.optionsContainer}>
                            {usernameArr.map((username, index) => {
                                return (
                                    <label
                                        className={styles.label}
                                        key={username}
                                        htmlFor={username}
                                    >
                                        <div>{usernameOCArr[index]}</div>
                                        <input
                                            id={username}
                                            type="checkbox"
                                            name="username"
                                            value={username}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                        <InputText type="text" name="group" placeholder="Group name" />
                        <div className={styles.info}>{info}</div>
                        <div className={styles.buttonsContainer}>
                            <button type="submit">{"Create group"}</button>
                            <button type="button" onClick={cancelSubmit}>
                                {"Cancel"}
                            </button>
                        </div>
                    </div>
                </Form>
            </dialog>
        </div>
    );
}

DialogNewGroup.propTypes = {
    state: PropTypes.bool.isRequired,
    contactList: PropTypes.object.isRequired,
    setErrMessage: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
};
