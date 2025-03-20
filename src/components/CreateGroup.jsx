import PropTypes from "prop-types";
import { useState } from "react";
import { Form } from "react-router-dom";
import styles from "./CreateGroup.module.css";

export default function CreateGroup({ contactList, setErrorMessage, onSubmit }) {
    const usernameArr = [];
    const usernameOCArr = [];
    const [info, setInfo] = useState("");

    for (let key in contactList) {
        usernameArr.push(key);
        usernameOCArr.push(contactList[key].username);
    }

    // for now we can only add users that are already in our contact list
    function createGroup(e) {
        if (usernameArr.length === 0) {
            return setErrorMessage("You don't have any contacts yet.");
        }
        const dialog = e.currentTarget.parentElement.querySelector("dialog");
        dialog.classList.add(styles.dialogContent);
        dialog.showModal();
    }

    function handleSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        // this gives us an array
        const valuesArr = formData.getAll("username");
        if (valuesArr.length > 0) {
            onSubmit(valuesArr);
            cancelSubmit(e);
        } else {
            setInfo("Please select at least one contact");
        }
    }

    function cancelSubmit() {
        const dialog = document.querySelector(`.${styles.container} dialog`);
        const form = document.querySelector(`.${styles.container} form`);
        dialog.classList.remove(styles.dialogContent);
        dialog.close();
        form.reset();
    }

    function closeDialog(e) {
        const dialog = e.currentTarget;
        if (e.target === dialog) {
            dialog.classList.remove(styles.dialogContent);
            dialog.close();
            setInfo("");
        }
    }

    function handleOnCloseDialog(e) {
        const dialog = e.currentTarget;
        const form = dialog.querySelector("form");
        dialog.classList.remove(styles.dialogContent);
        setInfo("");
        form.reset();
    }

    return (
        <div className={styles.container}>
            <dialog onClick={closeDialog} onClose={handleOnCloseDialog}>
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
            <button type="button" onClick={createGroup}>
                {"Create group."}
            </button>
        </div>
    );
}

CreateGroup.propTypes = {
    contactList: PropTypes.object.isRequired,
    setErrorMessage: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
};
