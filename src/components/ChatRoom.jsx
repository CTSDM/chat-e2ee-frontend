import PropTypes from "prop-types";
import FormSimple from "./FormSimple.jsx";
import { env } from "../../config/config.js";
import MessageBubble from "./MessageBubble.jsx";
import styles from "./ChatRoom.module.css";
import { useEffect, useRef } from "react";

function ChatRoom({ messages, handleOnSubmit, handleOnRender, username, targetContact }) {
    const input = env.inputs.message;
    const messagesLength = useRef(0);

    useEffect(() => {
        if (messages && messagesLength.current !== messages.length) {
            messagesLength.current = messages.length;
            handleOnRender(messages);
        }
    }, [handleOnRender, messages]);

    if (!messages) {
        return <div></div>;
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
            <div className={styles.contact}>{targetContact}</div>
            <div className={styles.messagesContainer}>
                {messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        message={message.content}
                        author={message.author}
                        date={message.createdAt}
                        isRead={message.read}
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
    targetContact: PropTypes.string,
    username: PropTypes.string.isRequired,
    messages: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            author: PropTypes.string.isRequired,
            content: PropTypes.string.isRequired,
            createdAt: PropTypes.object.isRequired,
            read: PropTypes.bool.isRequired,
        }),
    ),
    handleOnSubmit: PropTypes.func.isRequired,
    handleOnRender: PropTypes.func.isRequired,
};

export default ChatRoom;
