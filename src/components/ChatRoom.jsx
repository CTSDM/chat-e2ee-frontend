import PropTypes from "prop-types";
import FormSimple from "./FormSimple.jsx";
import { env } from "../../config/config.js";
import MessageBubble from "./MessageBubble.jsx";
import styles from "./ChatRoom.module.css";

function ChatRoom({ messages, handleOnSubmit, username }) {
    const input = env.inputs.message;
    if (!messages) {
        return <div>{"No messages yet..."}</div>;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const message = formData.get(input.name);
        if (message.length > 0) {
            form.reset();
            handleOnSubmit(message);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.messagesContainer}>
                {messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        message={message.content}
                        author={message.author}
                        date={message.createdAt}
                        username={username}
                    />
                ))}
            </div>
            <div className={styles.form}>
                <FormSimple buttonText={"Send"} input={input} handleSubmit={handleSubmit} />
            </div>
        </div>
    );
}

ChatRoom.propTypes = {
    username: PropTypes.string.isRequired,
    messages: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            author: PropTypes.string.isRequired,
            content: PropTypes.string.isRequired,
            createdAt: PropTypes.object.isRequired,
        }),
    ),
    handleOnSubmit: PropTypes.func.isRequired,
};

export default ChatRoom;
