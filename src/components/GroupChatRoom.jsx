import PropTypes from "prop-types";
import FormSimple from "./FormSimple.jsx";
import { env } from "../../config/config.js";
import MessageBubble from "./MessageBubble.jsx";
import styles from "./ChatRoom.module.css";
import { useEffect, useRef } from "react";
import { chatUtils } from "../utils/utils.js";

function GroupChatRoom({ messages, handleOnSubmit, handleOnRender, username, name, id, members }) {
    const input = env.inputs.message;
    const messagesLength = useRef(0);
    const refForm = useRef(null);
    const messagesArr = chatUtils.getCurrentMessages(messages, id);

    useEffect(() => {
        if (messagesArr) {
            const len = messagesArr.length;
            if (messagesLength.current !== len) {
                messagesLength.current = len;
                handleOnRender(messagesArr, id);
            }
        }
    }, [handleOnRender, messagesArr, id]);

    useEffect(() => {
        // we focus the input only on the first render
        if (refForm.current) {
            refForm.current.focus();
        }
    }, []);

    if (!messagesArr) {
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
            <div className={styles.contact}>
                {name} / {`${members.length} members`}
            </div>
            <div className={styles.messagesContainer}>
                {messagesArr.map((message) => {
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
                        />
                    );
                })}
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

GroupChatRoom.propTypes = {
    members: PropTypes.array,
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    messages: PropTypes.oneOfType([
        PropTypes.objectOf(
            PropTypes.shape({
                author: PropTypes.string.isRequired,
                content: PropTypes.string.isRequired,
                createdAt: PropTypes.object.isRequired,
                read: PropTypes.array.isRequired,
            }).isRequired,
        ),
        PropTypes.object.isRequired,
    ]),
    handleOnSubmit: PropTypes.func.isRequired,
    handleOnRender: PropTypes.func.isRequired,
};

export default GroupChatRoom;
