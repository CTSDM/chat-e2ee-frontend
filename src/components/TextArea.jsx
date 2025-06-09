import ButtonSubmit from "./ButtonSubmit.jsx";
import PropTypes from "prop-types";
import { useState, useLayoutEffect } from "react";
import styles from "./TextArea.module.css";

const MIN_HEIGHT = 18;

export default function TextArea({ input, handleSubmit, buttonText, innerRef, limit }) {
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [value, setValue] = useState("");

    useLayoutEffect(() => {
        // Reset height - important to shrink on delete
        innerRef.current.style.height = "inherit";
        // Set height
        innerRef.current.style.height = `${Math.max(innerRef.current.scrollHeight, MIN_HEIGHT)}px`;
    }, [value]);

    function onChange(e) {
        const newValue = e.currentTarget.value;
        const newValueLength = newValue.length;
        if (newValueLength === 0) {
            setButtonDisabled(true);
        } else {
            setButtonDisabled(false);
        }
        setValue(newValue);
    }

    function onKeyDown(e) {
        if (e.keyCode === 13) {
            if (e.shiftKey) {
                return;
            }
            e.preventDefault();
            setValue("");
            const form = e.currentTarget.closest("form");
            form.requestSubmit();
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} name="form">
            <div className={styles.textAreaContainer}>
                <textarea
                    type={input.type}
                    name={input.name}
                    placeholder={input.placeholder}
                    onChange={onChange}
                    className={styles.simple}
                    autoComplete="off"
                    maxLength={limit}
                    rows={1}
                    value={value}
                    ref={innerRef}
                    onKeyDown={onKeyDown}
                />
            </div>
            <ButtonSubmit
                text={buttonText}
                style={styles.input}
                disabled={buttonDisabled}
                onClick={() => setValue("")}
            />
        </form>
    );
}

TextArea.propTypes = {
    innerRef: PropTypes.object,
    handleSubmit: PropTypes.func,
    buttonText: PropTypes.string.isRequired,
    input: PropTypes.shape({
        type: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        placeholder: PropTypes.string.isRequired,
    }).isRequired,
    limit: PropTypes.number.isRequired,
};
