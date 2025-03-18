import PropTypes from "prop-types";
import styles from "./PreviewMessages.module.css";

function PreviewMessages({ contact, target, username, message, handleOnClick }) {
    let divContentLastMessage = <div>No messages yet...</div>;
    if (message) {
        const spanContent = <span className={styles.text}>{message.content}</span>;
        if (message.author === username) {
            divContentLastMessage = (
                <div>
                    <span className={styles.self}>You: </span>
                    {spanContent}
                </div>
            );
        } else {
            divContentLastMessage = <div>{spanContent}</div>;
        }
    }

    let stylesContainer;
    if (target === contact) {
        stylesContainer = `${styles.container} ${styles.selected}`;
    } else {
        stylesContainer = `${styles.container}`;
    }

    return (
        <button type="button" className={stylesContainer} onClick={() => handleOnClick(contact)}>
            <div className={styles.row}>
                <div className={styles.other}>{contact}</div>
                <div>date here</div>
            </div>
            <div className={styles.row}>
                {divContentLastMessage}
                <div>status message here</div>
            </div>
        </button>
    );
}

PreviewMessages.propTypes = {
    target: PropTypes.string,
    contact: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    message: PropTypes.shape({
        author: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        createdAt: PropTypes.object.isRequired,
    }),
    handleOnClick: PropTypes.func.isRequired,
};

export default PreviewMessages;
