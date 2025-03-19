import ButtonSubmit from "./ButtonSubmit.jsx";
import PropTypes from "prop-types";
import { useState } from "react";
import styles from "./FormSimple.module.css";

export default function FormCredentials({ input, handleSubmit, buttonText, innerRef }) {
    const [buttonDisabled, setButtonDisabled] = useState(true);
    function onChange(e) {
        if (e.currentTarget.value.length === 0) {
            setButtonDisabled(true);
        } else {
            setButtonDisabled(false);
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} name="form">
            <input
                type={input.type}
                name={input.name}
                placeholder={input.placeholder}
                onChange={onChange}
                className={styles.simple}
                autoComplete="off"
                ref={innerRef}
            />
            <ButtonSubmit text={buttonText} style={styles.input} disabled={buttonDisabled} />
        </form>
    );
}

FormCredentials.propTypes = {
    innerRef: PropTypes.object,
    handleSubmit: PropTypes.func,
    buttonText: PropTypes.string.isRequired,
    input: PropTypes.shape({
        type: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        placeholder: PropTypes.string.isRequired,
    }).isRequired,
};
