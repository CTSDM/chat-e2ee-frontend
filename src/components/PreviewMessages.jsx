import PropTypes from "prop-types";
import { useMemo } from "react";
import styles from "./PreviewMessages.module.css";
import { dataManipulationUtils as dataManipulation, chatUtils } from "../utils/utils";
import notReadImg from "../assets/notRead.svg";
import readImg from "../assets/read.svg";

function PreviewMessages({ contact, id, target, messages, handleOnClick, username, lastId }) {
    let divContentPreview = <div>No messages yet...</div>;
    let dateFormatted;
    let isAuthorUser;
    let readStatusObj;
    let readStatus;

    let readState;
    if (lastId) {
        const read = messages[lastId].read;
        readState = typeof read === "boolean" ? read : read.length;
    }

    const isChatOpen = target === id;

    const unreadCount = useMemo(() => {
        if (isChatOpen) {
            return 0;
        }
        if (lastId) {
            return chatUtils.getUnread(messages, id, username);
        }
    }, [lastId, readState, isChatOpen]);

    const message = messages[lastId];
    if (message) {
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
                ) : unreadCount ? (
                    <div className={styles.unreadCount}>{unreadCount}</div>
                ) : null}
            </div>
        </button>
    );
}

PreviewMessages.propTypes = {
    id: PropTypes.string.isRequired,
    target: PropTypes.string,
    contact: PropTypes.object.isRequired,
    username: PropTypes.string.isRequired,
    messages: PropTypes.oneOfType([
        PropTypes.object.isRequired,
        PropTypes.shape({
            author: PropTypes.string.isRequired,
            content: PropTypes.string.isRequired,
            createdAt: PropTypes.object.isRequired,
            id: PropTypes.string.isRequired,
        }),
    ]),
    handleOnClick: PropTypes.func.isRequired,
    lastId: PropTypes.string,
};

export default PreviewMessages;
