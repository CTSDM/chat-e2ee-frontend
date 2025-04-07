import PropTypes from "prop-types";
import FormSimple from "./FormSimple.jsx";
import { env } from "../../config/config.js";
import MessageBubble from "./MessageBubble.jsx";
import styles from "./ChatRoom.module.css";
import { useEffect, useRef } from "react";

function ChatRoom({ messages, handleOnSubmit, handleOnRender, username, target }) {
    const input = env.inputs.message;
    const messagesLength = useRef(0);
    const refForm = useRef(null);

    useEffect(() => {
        if (messages) {
            const len = messages.length;
            if (messagesLength.current !== len) {
                messagesLength.current = len;
                handleOnRender(messages);
            }
        }
        // we focus the input
        if (refForm.current) {
            refForm.current.focus();
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
            <div className={styles.contact}>{target}</div>
            <div className={styles.messagesContainer}>
                {messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        id={message.id}
                        message={message.content}
                        author={message.author}
                        date={message.createdAt}
                        isRead={message.read}
                        username={username}
                        showAuthor={false}
                    />
                ))}
            </div>
            <div className={styles.form}>
                <FormSimple
                    innerRef={refForm}
                    buttonText={"Send"}
                    input={input}
                    handleSubmit={handleSubmit}
                />
            </div>
        </div>
    );
}

ChatRoom.propTypes = {
    target: PropTypes.string,
    username: PropTypes.string.isRequired,
    messages: PropTypes.objectOf(
        PropTypes.shape({
            author: PropTypes.string.isRequired,
            content: PropTypes.string.isRequired,
            createdAt: PropTypes.object.isRequired,
            read: PropTypes.bool.isRequired,
        }).isRequired,
    ).isRequired,
    handleOnSubmit: PropTypes.func.isRequired,
    handleOnRender: PropTypes.func.isRequired,
};

export default ChatRoom;
