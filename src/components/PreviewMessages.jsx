import PropTypes from "prop-types";
import styles from "./PreviewMessages.module.css";

function PreviewMessages({ name, message, handleOnClick }) {
    return (
        <button type="button" className={styles.container} onClick={() => handleOnClick(name)}>
            <div>{name}: </div>
            {message ? <div>{message}</div> : <div>no messages yet</div>}
        </button>
    );
}

PreviewMessages.propTypes = {
    name: PropTypes.string.isRequired,
    message: PropTypes.string,
    handleOnClick: PropTypes.func.isRequired,
};

export default PreviewMessages;
