import PropTypes from "prop-types";
import InputText from "./InputComp";
import { validationUtils as validation } from "../utils/utils.js";
import { Form } from "react-router-dom";
import { useState } from "react";
import styles from "./ButtonDialog.module.css";

function ButtonDialog({ text, textModal, input, onSubmit }) {
    const [msgArray, setMsgArray] = useState([]);

    function openDialog() {
        const dialog = document.querySelector("dialog");
        dialog.classList.add(styles.dialogContent);
        dialog.showModal();
    }

    function closeDialog(e) {
        const dialog = document.querySelector("dialog");
        if (e.target === dialog) {
            dialog.classList.remove(styles.dialogContent);
            dialog.close();
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (msgArray[0].length === 0) {
            const form = e.currentTarget;
            const formData = new FormData(form);
            const value = formData.get(input.name);
            onSubmit(value);
            const dialog = document.querySelector("dialog");
            dialog.classList.remove(styles.dialogContent);
            dialog.close();
            form.reset();
        }
    }

    function handleOnCloseDialog(e) {
        const dialog = e.currentTarget;
        const form = dialog.querySelector("form");
        dialog.classList.remove(styles.dialogContent);
        form.reset();
    }

    return (
        <div className={styles.container}>
            <dialog onClick={closeDialog} onClose={handleOnCloseDialog}>
                <Form onSubmit={handleSubmit}>
                    <div className={styles.dialogContent}>
                        <InputText
                            type={input.type}
                            name={input.name}
                            placeholder={input.placeholder}
                            minLength={input.minLength}
                            maxLength={input.maxLength}
                            handleOnChange={validation.curriedHandler(
                                validation.checkFunctions[input.validation],
                            )(setMsgArray, msgArray)}
                        />
                        <button type="submit">{textModal}</button>
                    </div>
                </Form>
            </dialog>
            <button type="button" onClick={openDialog}>
                {text}
            </button>
        </div>
    );
}

ButtonDialog.propTypes = {
    text: PropTypes.string.isRequired,
    textModal: PropTypes.string.isRequired,
    input: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
};

export default ButtonDialog;
