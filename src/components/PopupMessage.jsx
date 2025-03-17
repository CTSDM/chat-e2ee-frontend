import PropTypes from "prop-types";
import styles from "./PopupMessage.module.css";

export default function PopupMessage({ message }) {
    return (
        <div className={styles.container}>
            <span>{message}</span>
        </div>
    );
}

PopupMessage.propTypes = {
    message: PropTypes.string.isRequired,
};
