import PropTypes from "prop-types";
import FormSimple from "./FormSimple.jsx";
import { env } from "../../config/config.js";
import MessageBubble from "./MessageBubble.jsx";
import styles from "./GroupChatRoom.module.css";
import { useEffect, useRef } from "react";

function GroupChatRoom({ messages, handleOnSubmit, handleOnRender, username, groupName, members }) {
    const input = env.inputs.message;
    const messagesLength = useRef(0);
    const refForm = useRef(null);

    useEffect(() => {
        if (messages) {
            const len = Object.keys(messages).length;
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

    // we need to convert an object into an array
    // we only need the values
    const messagesArr = Object.values(messages);
    const messagesId = Object.keys(messages);

    return (
        <div className={styles.container}>
            <div className={styles.contact}>
                {groupName} / {`${members.length} members`}
            </div>
            <div className={styles.messagesContainer}>
                {messagesArr.map((message, index) => {
                    const readBy = message.readBy;
                    const isRead =
                        typeof readBy === "object" && readBy.length === members.length - 1;
                    return (
                        <MessageBubble
                            id={messagesId[index]}
                            key={messagesId[index]}
                            message={message.content}
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
    groupName: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    messages: PropTypes.objectOf(
        PropTypes.shape({
            author: PropTypes.string.isRequired,
            content: PropTypes.string.isRequired,
            createdAt: PropTypes.object.isRequired,
            readBy: PropTypes.oneOfType([PropTypes.array, PropTypes.string]).isRequired,
        }),
    ).isRequired,
    handleOnSubmit: PropTypes.func.isRequired,
    handleOnRender: PropTypes.func.isRequired,
};

export default GroupChatRoom;
