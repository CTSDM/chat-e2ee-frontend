import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import MessageBubble from "./MessageBubble.jsx";
import styles from "./Room.module.css";

function GroupRoom({ messagesArr, username, members, refContainer, onScroll, isEnd, submited }) {
    const [enableScroll, setEnableScroll] = useState(true);

    useEffect(() => {
        setEnableScroll(false);
    }, []);

    useEffect(() => {
        if (isEnd === true) {
            setEnableScroll(true);
        } else {
            setEnableScroll(false);
        }
    }, [isEnd]);

    let scrollToLast = false;

    const messagesArrLen = messagesArr.length;
    return (
        <div className={styles.messagesContainer} ref={refContainer} onScroll={onScroll}>
            {messagesArr.map((message, index) => {
                const isRead = message.read.length === members.length - 1;
                if (index === messagesArrLen - 1) {
                    if (submited) scrollToLast = true;
                    else scrollToLast = enableScroll;
                }
                return (
                    <MessageBubble
                        id={message.id}
                        key={message.id}
                        content={message.content}
                        author={message.author}
                        date={message.createdAt}
                        isRead={isRead}
                        username={username}
                        showAuthor={true}
                        scrollToLast={scrollToLast}
                    />
                );
            })}
        </div>
    );
}

GroupRoom.propTypes = {
    messagesArr: PropTypes.array.isRequired,
    username: PropTypes.string.isRequired,
    members: PropTypes.array.isRequired,
    refContainer: PropTypes.object.isRequired,
    onScroll: PropTypes.func.isRequired,
    isEnd: PropTypes.bool.isRequired,
    submited: PropTypes.bool.isRequired,
};

export default GroupRoom;
