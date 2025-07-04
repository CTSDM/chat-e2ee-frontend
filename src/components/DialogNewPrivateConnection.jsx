import PropTypes from "prop-types";
import InputText from "./InputComp";
import { validationUtils as validation } from "../utils/utils.js";
import { Form } from "react-router-dom";
import { useRef, useState } from "react";
import styles from "./DialogNewPrivateConnection.module.css";

function DialogNewPrivateConnection({ state, setState, textModal, input, onSubmit }) {
    const [msgArray, setMsgArray] = useState([]);
    const refDialog = useRef(null);

    if (state) {
        refDialog.current.classList.add(styles.dialogContent);
        refDialog.current.showModal();
    }

    function handleOnClick(e) {
        const dialog = document.querySelector("dialog");
        if (e.target === dialog) {
            dialog.classList.remove(styles.dialogContent);
            dialog.close();
            setState(false);
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
            setState(false);
        }
    }

    function handleOnClose(e) {
        const dialog = e.currentTarget;
        const form = dialog.querySelector("form");
        dialog.classList.remove(styles.dialogContent);
        form.reset();
        setState(false);
    }

    return (
        <div className={styles.container}>
            <dialog
                onClick={handleOnClick}
                onClose={handleOnClose}
                ref={refDialog}
                className={"add"}
            >
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
        </div>
    );
}

DialogNewPrivateConnection.propTypes = {
    state: PropTypes.bool.isRequired,
    textModal: PropTypes.string.isRequired,
    input: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    setState: PropTypes.func.isRequired,
};

export default DialogNewPrivateConnection;
