import PropTypes from "prop-types";
import styles from "./PreviewMessages.module.css";

function PreviewMessages({ name, message }) {
    return (
        <div className={styles.container}>
            <div>{name}: </div>
            {message ? <div>{message}</div> : <div>no messages yet</div>}
        </div>
    );
}

PreviewMessages.propTypes = {
    name: PropTypes.string.isRequired,
    message: PropTypes.string,
};

export default PreviewMessages;
