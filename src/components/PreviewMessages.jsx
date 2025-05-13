import PropTypes from "prop-types";
import styles from "./PreviewMessages.module.css";
import { dataManipulationUtils as dataManipulation } from "../utils/utils";
import notReadImg from "../assets/notRead.svg";
import readImg from "../assets/read.svg";

function PreviewMessages({ contact, id, target, username, message, handleOnClick, readStatus }) {
    let divContentLastMessage = <div>No messages yet...</div>;
    let dateFormatted;
    let isAuthorUser;
    let readStatusObj;
    if (message) {
        isAuthorUser = message.author === username;
        dateFormatted = dataManipulation.getDateFormatted(message.createdAt);
        const spanContent = <span className={styles.text}>{message.content}</span>;
        if (isAuthorUser) {
            if (readStatus) readStatusObj = { src: notReadImg, alt: "not yet read" };
            else readStatusObj = { src: readImg, alt: "read" };
            divContentLastMessage = (
                <div>
                    <span className={styles.self}>You: </span>
                    {spanContent}
                </div>
            );
        } else {
            if (id.length > 16) {
                divContentLastMessage = (
                    <div>
                        <span className={styles.otherWithinGroup}>{message.author}:</span>
                        {spanContent}
                    </div>
                );
            } else {
                divContentLastMessage = <div>{spanContent}</div>;
            }
        }
    }

    let stylesContainer;
    if (target === id.toLowerCase()) {
        stylesContainer = `${styles.container} ${styles.selected}`;
    } else {
        stylesContainer = `${styles.container}`;
    }

    return (
        <button
            type="button"
            className={stylesContainer}
            onClick={() => handleOnClick(id.toLowerCase())}
        >
            <div className={styles.row}>
                <div className={styles.other}>{contact}</div>
                <div>{dateFormatted}</div>
            </div>
            <div className={styles.row}>
                {divContentLastMessage}
                {readStatus && isAuthorUser ? (
                    <img src={readStatusObj.src} alt={readStatusObj.alt} />
                ) : null}
            </div>
        </button>
    );
}

PreviewMessages.propTypes = {
    id: PropTypes.string,
    target: PropTypes.string,
    contact: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    readStatus: PropTypes.bool,
    message: PropTypes.shape({
        author: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        createdAt: PropTypes.object.isRequired,
    }),
    handleOnClick: PropTypes.func.isRequired,
};

export default PreviewMessages;
