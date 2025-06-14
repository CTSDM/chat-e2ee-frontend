import PropTypes from "prop-types";
import styles from "./PreviewMessages.module.css";
import { dataManipulationUtils as dataManipulation, chatUtils } from "../utils/utils";
import notReadImg from "../assets/notRead.svg";
import readImg from "../assets/read.svg";

function PreviewSearch({ contact, id, target, message, handleOnClick, username }) {
    let divContentPreview;
    let dateFormatted;
    let isAuthorUser;
    let readStatusObj;
    let readStatus;

    readStatus = chatUtils.checkRead(contact, message);
    isAuthorUser = message.author === username;
    dateFormatted = dataManipulation.getDateFormatted(message.createdAt);
    const spanContent = <span className={styles.text}>{message.content}</span>;
    if (isAuthorUser) {
        if (readStatus) readStatusObj = { src: readImg, alt: "read" };
        else readStatusObj = { src: notReadImg, alt: "not yet read" };
        divContentPreview = (
            <div>
                <span className={styles.self}>You:&nbsp;</span>
                {spanContent}
            </div>
        );
    } else {
        if (id.length > 16) {
            divContentPreview = (
                <div>
                    <span className={styles.otherWithinGroup}>{message.author}:&nbsp;</span>
                    {spanContent}
                </div>
            );
        } else {
            divContentPreview = <div>{spanContent}</div>;
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
            onClick={() => {
                handleOnClick(id.toLowerCase(), message && message.id);
            }}
        >
            <div className={styles.row}>
                <div className={styles.other}>{contact.name}</div>
                <div className={styles.date}>{dateFormatted}</div>
            </div>
            <div className={styles.row}>
                {divContentPreview}
                {readStatus !== null && isAuthorUser ? (
                    <img className={styles.img} src={readStatusObj.src} alt={readStatusObj.alt} />
                ) : null}
            </div>
        </button>
    );
}

PreviewSearch.propTypes = {
    id: PropTypes.string.isRequired,
    target: PropTypes.string,
    contact: PropTypes.object.isRequired,
    username: PropTypes.string.isRequired,
    message: PropTypes.shape({
        author: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        createdAt: PropTypes.object.isRequired,
        id: PropTypes.string,
    }),
    handleOnClick: PropTypes.func.isRequired,
};

export default PreviewSearch;
