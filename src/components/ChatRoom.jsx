import PropTypes from "prop-types";
import TextArea from "./TextArea.jsx";
import { env } from "../../config/config.js";
import MessageBubble from "./MessageBubble.jsx";
import styles from "./ChatRoom.module.css";
import { useEffect, useRef } from "react";
import { chatUtils } from "../utils/utils.js";

function ChatRoom({ messages, handleOnSubmit, handleOnRender, username, target }) {
    const input = env.inputs.message;
    const messagesLength = useRef(0);
    const refForm = useRef(null);
    const messagesArr = chatUtils.getCurrentMessages(messages, target.toLowerCase());
    const refScrollbar = useRef(null);

    useEffect(() => {
        if (messagesArr) {
            const len = messagesArr.length;
            if (messagesLength.current !== len) {
                messagesLength.current = len;
                handleOnRender(messagesArr);
            }
        }
        // we focus the input
    }, [handleOnRender, messagesArr]);

    useEffect(() => {
        if (refForm.current) {
            refForm.current.focus();
        }
    }, []);

    if (!messagesArr) {
        return <div></div>;
    }

    function handleSubmitTextArea(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const message = formData.get(input.name);
        if (message.length > 0) {
            form.reset();
            handleOnSubmit(message);
        }
    }

    function onMouseOver() {
        refScrollbar.current.style["background-color"] = "blue";
    }

    function onMouseOut() {
        refScrollbar.current.style["background-color"] = "";
    }

    return (
        <div className={styles.container}>
            <div className={styles.contact}>{target}</div>
            <div className={styles.subContainer} onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
                <div className={styles.messagesContainer}>
                    {messagesArr.map((message) => (
                        <MessageBubble
                            key={message.id}
                            id={message.id}
                            content={message.content}
                            author={message.author}
                            date={message.createdAt}
                            isRead={message.read}
                            username={username}
                            showAuthor={false}
                        />
                    ))}
                </div>
                <div className={styles.scrollbar} ref={refScrollbar}></div>
            </div>
            <div className={styles.form}>
                <TextArea
                    innerRef={refForm}
                    buttonText={"Send"}
                    input={input}
                    handleSubmit={handleSubmitTextArea}
                    limit={env.inputs.message.limit}
                />
            </div>
        </div>
    );
}

ChatRoom.propTypes = {
    target: PropTypes.string,
    username: PropTypes.string.isRequired,
    messages: PropTypes.oneOfType([
        PropTypes.objectOf(
            PropTypes.shape({
                id: PropTypes.string.isRequired,
                author: PropTypes.string.isRequired,
                content: PropTypes.string.isRequired,
                createdAt: PropTypes.object.isRequired,
                read: PropTypes.bool.isRequired,
            }).isRequired,
        ),
        PropTypes.object.isRequired,
    ]),
    handleOnSubmit: PropTypes.func.isRequired,
    handleOnRender: PropTypes.func.isRequired,
};

export default ChatRoom;
