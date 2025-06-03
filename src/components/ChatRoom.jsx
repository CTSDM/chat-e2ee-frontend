import PropTypes from "prop-types";
import TextArea from "./TextArea.jsx";
import { env } from "../../config/config.js";
import MessageBubble from "./MessageBubble.jsx";
import { useEffect, useRef } from "react";
import { chatUtils } from "../utils/utils.js";
import styles from "./ChatRoom.module.css";

function ChatRoom({ messages, handleOnSubmit, handleOnRender, username, target }) {
    const input = env.inputs.message;
    const messagesLength = useRef(0);
    const refForm = useRef(null);
    const messagesArr = chatUtils.getCurrentMessages(messages, target.toLowerCase());
    const refScrollbar = useRef(null);
    const refMessagesContainer = useRef(null);
    const refSubcontainer = useRef(null);
    const refAuxMsgContainer = useRef({
        active: false,
        initialPosition: { scrollTop: null, clickY: null },
    });

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
        window.addEventListener("mouseup", disableState);
        window.addEventListener("mousemove", updateMsgContainerPosition);
        function disableState() {
            refAuxMsgContainer.current.active = false;
        }
        function updateMsgContainerPosition(e) {
            if (refAuxMsgContainer.current.active === true) {
                // we calculate the new scrollTop according to the saved coordinates
                // we have to translate these coordinates to the dimensions of the scrollbar
                // or something similar I think like
                const diff = (e.clientY - refAuxMsgContainer.current.initialPosition.clickY) * 3;
                const newScroll = refAuxMsgContainer.current.initialPosition.scrollTop + diff;
                const maxScroll =
                    refMessagesContainer.current.scrollHeight -
                    refMessagesContainer.current.clientHeight;
                refMessagesContainer.current.scrollTop = Math.min(
                    Math.max(0, newScroll),
                    maxScroll,
                );
            }
        }
        return () => {
            window.removeEventListener("mouseup", disableState);
            window.removeEventListener("mousemove", updateMsgContainerPosition);
        };
    }, []);

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
        // we obtain the height of the message container
        const [newHeight, bottomMargin] = getSizePositionScrollbar(
            refSubcontainer.current,
            refMessagesContainer.current,
        );
        if (newHeight === 0) {
            refScrollbar.current.style["opacity"] = "0";
            refScrollbar.current.style["margin-bottom"] = "0px";
            refScrollbar.current.classList.remove(`${styles.active}`);
        } else {
            // we get the size and where we should place the scroll bar;
            refScrollbar.current.style["min-height"] = `${newHeight}px`;
            refScrollbar.current.style["opacity"] = "1";
            refScrollbar.current.style["bottom"] = `${bottomMargin}%`;
            refScrollbar.current.classList.add(`${styles.active}`);
        }
    }

    function onMouseOut() {
        refScrollbar.current.style["opacity"] = "0";
    }

    function onMouseDown(e) {
        // only works for left click
        if (e.button === 0) {
            refAuxMsgContainer.current.initialPosition.scrollTop =
                refMessagesContainer.current.scrollTop;
            refAuxMsgContainer.current.initialPosition.clickY = e.clientY;
            refAuxMsgContainer.current.active = true;
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.contact}>{target}</div>
            <div
                className={styles.subContainer}
                onMouseOver={onMouseOver}
                onMouseOut={onMouseOut}
                ref={refSubcontainer}
            >
                <div
                    className={styles.messagesContainer}
                    ref={refMessagesContainer}
                    onScroll={onMouseOver}
                >
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
                <div
                    className={styles.scrollbar}
                    ref={refScrollbar}
                    onMouseDown={onMouseDown}
                ></div>
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

function getSizePositionScrollbar(container, messageContainer) {
    const messagesContainerHeight = messageContainer.scrollHeight;
    const visibleHeight = container.clientHeight;
    const ratio = visibleHeight / messagesContainerHeight;
    let newHeight, offsetBottom; // ofsetBottom in percentage
    if (ratio >= 1) {
        newHeight = 0;
        offsetBottom = 0;
    } else {
        newHeight = ratio * visibleHeight;
        const verticalOffset = messageContainer.scrollTop;
        const ratio2 =
            (messagesContainerHeight - verticalOffset - visibleHeight) / messagesContainerHeight;
        if (ratio2 >= 1) offsetBottom = 100;
        else {
            // offsetBottom = 100 * (1 - ratio2);
            offsetBottom = ratio2 * 100;
        }
    }
    return [newHeight, offsetBottom];
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
