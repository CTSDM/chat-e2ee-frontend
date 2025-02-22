import PropTypes from "prop-types";
import styles from "./ErrMsg.module.css";

function ErrMsg({ messages }) {
    return (
        <div className={styles.container}>
            <div>Please, fix the following:</div>
            <div className={styles.error}>
                {messages.map((message) => (
                    <div key={message}>- {message}</div>
                ))}
            </div>
        </div>
    );
}

ErrMsg.propTypes = {
    messages: PropTypes.array.isRequired,
};

export default ErrMsg;
