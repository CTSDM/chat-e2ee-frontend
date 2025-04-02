import PropTypes from "prop-types";
import { dataManipulationUtils as dataManipulation } from "../utils/utils";
import { useEffect, useRef } from "react";
import notReadImg from "../assets/notRead.svg";
import readImg from "../assets/read.svg";
import styles from "./MessageBubble.module.css";

export default function MessageBubble({ id, message, author, username, date, isRead, showAuthor }) {
    const messageRef = useRef(null);
    const dateFormatted = dataManipulation.getDateFormatted(date);
    let content;
    if (typeof message === "object") {
        content = message.content;
    } else {
        content = message;
    }

    const isAuthSender = username === author;

    const classApplied = isAuthSender ? "sender" : "receiver";
    const classMessage = `${styles.bubble} ${styles[classApplied]}`;

    useEffect(() => {
        messageRef.current.scrollIntoView();
    }, []);

    const readStatusObj = { src: notReadImg, alt: "not yet read" };

    if (isRead === true) {
        readStatusObj.src = readImg;
        readStatusObj.alt = "read";
    }

    return (
        <div className={styles.container} ref={messageRef}>
            <div id={id} data-testid={id} className={classMessage}>
                {showAuthor && !isAuthSender ? <div className={styles.author}>{author}</div> : null}
                <div className={styles.content}>{content}</div>
                <div className={styles.info}>
                    <div className={styles.time}>{dateFormatted}</div>
                    {isAuthSender ? <img src={readStatusObj.src} alt={readStatusObj.alt} /> : null}
                </div>
            </div>
            {isAuthSender ? null : (
                <div className={`${styles.panson} ${styles.receiver}`}>
                    <div className={`${styles.invBlock} ${styles.receiver}`}></div>
                    <div className={`${styles.block} ${styles.receiver}`}></div>
                </div>
            )}
            {isAuthSender ? (
                <div className={`${styles.panson} ${styles.sender}`}>
                    <div className={`${styles.invBlock} ${styles.sender}`}></div>
                    <div className={`${styles.block} ${styles.sender}`}></div>
                </div>
            ) : null}
        </div>
    );
}

MessageBubble.propTypes = {
    id: PropTypes.string.isRequired,
    date: PropTypes.object.isRequired,
    username: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    isRead: PropTypes.bool.isRequired,
    // In case the message is an image we check if the message is an object.
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    showAuthor: PropTypes.bool.isRequired,
};
