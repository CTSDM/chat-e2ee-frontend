import PropTypes from "prop-types";
import styles from "./Room.module.css";
import MessageBubble from "./MessageBubble";

function PrivateRoom({ messagesArr, username, refContainer, onScroll }) {
    const messagesArrLen = messagesArr.length;
    return (
        <div className={styles.messagesContainer} ref={refContainer} onScroll={onScroll}>
            {messagesArr.map((message, index) => {
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
                        scrollToLast={index === messagesArrLen - 1 ? true : false}
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
};

export default PrivateRoom;
