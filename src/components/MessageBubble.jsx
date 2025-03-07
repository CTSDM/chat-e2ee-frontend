import PropTypes from "prop-types";
import { dataManipulationUtils as dataManipulation } from "../utils/utils";
import { useEffect, useRef } from "react";
import styles from "./MessageBubble.module.css";

export default function MessageBubble({ message, author, username, date }) {
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

    return (
        <div className={styles.container} ref={messageRef}>
            <div className={classMessage}>
                <div className={styles.content}>{content}</div>
                <div className={styles.time}>{dateFormatted}</div>
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
    date: PropTypes.object.isRequired,
    username: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
};
