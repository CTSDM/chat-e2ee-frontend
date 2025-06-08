import PropTypes from "prop-types";
import MessageBubble from "./MessageBubble.jsx";
import styles from "./Room.module.css";

function GroupRoom({ messagesArr, username, members, refContainer, onScroll }) {
    const messagesArrLen = messagesArr.length;
    return (
        <div className={styles.messagesContainer} ref={refContainer} onScroll={onScroll}>
            {messagesArr.map((message, index) => {
                const isRead = message.read.length === members.length - 1;
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
                        last={index === messagesArrLen - 1 ? true : false}
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
};

export default GroupRoom;
