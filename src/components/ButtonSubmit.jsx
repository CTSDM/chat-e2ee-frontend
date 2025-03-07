import PropTypes from "prop-types";
import { useRef, useEffect } from "react";
import styles from "./ButtonSubmit.module.css";

export default function ButtonSubmit({ text = "Submit", style, disabled }) {
    const buttonRef = useRef(null);

    useEffect(() => {
        if (disabled === true) {
            buttonRef.current.setAttribute("disabled", "true");
        } else if (disabled === false) {
            buttonRef.current.removeAttribute("disabled");
        }
    }, [disabled]);

    return (
        <button ref={buttonRef} type="submit" className={style || styles.input}>
            {text}
        </button>
    );
}

ButtonSubmit.propTypes = {
    style: PropTypes.string,
    text: PropTypes.string,
    disabled: PropTypes.bool,
};
