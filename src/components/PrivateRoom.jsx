import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import MessageBubble from "./MessageBubble.jsx";
import styles from "./Room.module.css";

function PrivateRoom({ messagesArr, username, refContainer, onScroll, isEnd, submited }) {
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
                if (index === messagesArrLen - 1) {
                    if (submited) scrollToLast = true;
                    else scrollToLast = enableScroll;
                }
                return (
                    <MessageBubble
                        key={message.id}
                        id={message.id}
                        content={message.content}
                        author={message.author}
                        date={message.createdAt}
                        isRead={message.read}
                        username={username}
                        showAuthor={false}
                        scrollToLast={scrollToLast}
                    />
                );
            })}
        </div>
    );
}

PrivateRoom.propTypes = {
    messagesArr: PropTypes.array.isRequired,
    username: PropTypes.string.isRequired,
    refContainer: PropTypes.object,
    onScroll: PropTypes.func.isRequired,
    isEnd: PropTypes.bool.isRequired,
    submited: PropTypes.bool.isRequired,
};

export default PrivateRoom;
