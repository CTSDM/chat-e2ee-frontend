import PropTypes from "prop-types";
import TextArea from "./TextArea.jsx";
import { env } from "../../config/config.js";
import { useEffect, useRef, useState } from "react";
import { chatUtils, domUtils } from "../utils/utils.js";
import styles from "./Chat.module.css";
import PrivateRoom from "./PrivateRoom.jsx";
import GroupRoom from "./GroupRoom.jsx";

function Chat({ messages, handleOnSubmit, handleOnRender, username, contactInfo, id }) {
    const input = env.inputs.message;
    // isEnd is used to make a new message is not scrolled into view unless the scroll is at the end
    const [isEnd, setIsEnd] = useState(true);
    const [justSubmited, setJustSubmited] = useState(false);
    const messagesLength = useRef(0);
    const refForm = useRef(null);
    const refScrollbar = useRef(null);
    const refMessagesContainer = useRef(null);
    const refSubcontainer = useRef(null);
    const refAuxMsgContainer = useRef({
        active: false,
        initialPosition: { scrollTop: null, clickY: null },
    });
    const refScrollbarContainer = useRef({
        active: false,
        handlerTI: null,
        coordY: null,
    });
    const isGroup = id.length === 36;

    let messagesArr;
    if (isGroup) {
        messagesArr = chatUtils.getCurrentMessages(messages, id);
    } else {
        messagesArr = chatUtils.getCurrentMessages(messages, contactInfo.name.toLowerCase());
    }

    useEffect(() => {
        if (messagesArr) {
            if (isGroup) {
                const len = messagesArr.length;
                if (messagesLength.current !== len) {
                    messagesLength.current = len;
                    handleOnRender(messagesArr, id);
                }
            } else {
                const len = messagesArr.length;
                if (messagesLength.current !== len) {
                    messagesLength.current = len;
                    handleOnRender(messagesArr);
                }
            }
        }
    }, [handleOnRender, id]);

    useEffect(() => {
        // we put a blank state every time we change the room
        refAuxMsgContainer.current = {
            active: false,
            initialPosition: { scrollTop: null, clickY: null },
        };
        refScrollbar.current.style["min-height"] = `0px`;
        refScrollbar.current.style["opacity"] = "0";
        // refScrollbar.current.classList.remove("scrollbar-dynamics");
        refScrollbar.current.style["transform"] = "translateY(0px)";
    }, [id]);

    useEffect(() => {
        window.addEventListener("mouseup", disableState);
        window.addEventListener("mousemove", updatePositions);
        function disableState() {
            refAuxMsgContainer.current.active = false;
            refScrollbarContainer.current.active = false;
            clearInterval(refScrollbarContainer.current.handlerTI);
            refScrollbarContainer.current.handlerTI = null;
        }
        function updatePositions(e) {
            if (refAuxMsgContainer.current.active === true) {
                // we calculate the new scrollTop according to the saved coordinates
                // we have to translate these coordinates to the dimensions of the scrollbar
                // or something similar I think like
                const diff = (e.clientY - refAuxMsgContainer.current.initialPosition.clickY) * 5;
                const newScroll = refAuxMsgContainer.current.initialPosition.scrollTop + diff;
                const maxScroll =
                    refMessagesContainer.current.scrollHeight -
                    refMessagesContainer.current.clientHeight;
                refMessagesContainer.current.scrollTop = Math.min(
                    Math.max(0, newScroll),
                    maxScroll,
                );
            }
            if (refScrollbarContainer.current.active === true) {
                refScrollbarContainer.current.coordY = e.clientY;
            }
        }
        return () => {
            window.removeEventListener("mouseup", disableState);
            window.removeEventListener("mousemove", updatePositions);
        };
    }, []);

    useEffect(() => {
        if (refForm.current) {
            refForm.current.focus();
        }
    }, [id]);

    useEffect(() => {
        if (justSubmited === true) {
            setJustSubmited(false);
        }
    }, [justSubmited]);

    function handleSubmitTextArea(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const message = formData.get(input.name);
        if (message.length > 0) {
            form.reset();
            handleOnSubmit(message);
            setJustSubmited(true);
        }
    }

    function onMouseOver() {
        // we obtain the height of the message container
        const [newHeight, bottom] = getSizePositionScrollbar(
            refSubcontainer.current,
            refMessagesContainer.current,
        );
        if (newHeight === 0) {
            //useful when removing messages or resizing the page
            // refScrollbar.current.classList.remove("scrollbar-dynamics");
            refScrollbar.current.style["opacity"] = "0";
            refScrollbar.current.style["transform"] = "translateY(0px)";
            refScrollbar.current.style["min-height"] = `0px`;
        } else {
            // we get the size and where we should place the scroll bar;
            refScrollbar.current.classList.add("scrollbar-dynamics");
            refScrollbar.current.style["min-height"] = `${newHeight}px`;
            refScrollbar.current.style["opacity"] = "1";
            refScrollbar.current.style["transform"] = `translateY(${bottom}px)`;
            // we check if the scrollbar is at the end
            if (bottom + newHeight >= refMessagesContainer.current.clientHeight) {
                setIsEnd(true);
            } else {
                setIsEnd(false);
            }
        }
    }

    function onWheelScrollbar(e) {
        // we force a scroll on the message container
        // and then call onMouseOver to update the scrollbar position
        refMessagesContainer.current.scrollBy({ top: e.deltaY });
        onMouseOver();
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

    function onMouseDownScrollbarContainer(e) {
        // only for desktop environments, not for phones or tablets
        // if we click the scrollbar we do nothing
        // otherwise we move up/down the scrollbar a relative percentage of the container.
        // we set a timeout to keep moving the scrollbar until it meets the cursor
        if (e.target !== refScrollbar.current) {
            const messagesContainer = refMessagesContainer.current;
            const coordY = e.clientY;
            const boxContainer = refScrollbar.current.getBoundingClientRect();
            const relativePosition = domUtils.getRelativePosition(coordY, boxContainer);
            const previousScrollTop = messagesContainer.scrollTop;
            const step = messagesContainer.scrollHeight / 6;
            if (relativePosition === "in-between") {
                throw new Error("invalid condition reached");
            } else {
                const direction = relativePosition === "bottom" ? 1 : -1;
                messagesContainer.scrollTop = previousScrollTop + step * direction;
                refScrollbarContainer.current.active = true;
                refScrollbarContainer.current.coordY = e.clientY;
                refScrollbarContainer.current.handlerTI = domUtils.setMovementScrollBar(
                    refScrollbarContainer.current,
                    refScrollbar.current,
                    refMessagesContainer.current,
                    relativePosition,
                    direction,
                    step,
                );
            }
        }
    }

    if (!messagesArr) {
        return <div></div>;
    }

    return (
        <div className={styles.container}>
            {id.length === 36 ? (
                <div className={styles.contact}>
                    {contactInfo.name} / {`${contactInfo.members.length} members`}
                </div>
            ) : (
                <div className={styles.contact}>{contactInfo.name}</div>
            )}
            <div
                className={styles.subContainer}
                onMouseOver={onMouseOver}
                onMouseOut={onMouseOut}
                ref={refSubcontainer}
            >
                {id.length === 36 ? (
                    <GroupRoom
                        messagesArr={messagesArr}
                        username={username}
                        members={contactInfo.members}
                        refContainer={refMessagesContainer}
                        onScroll={onMouseOver}
                        isEnd={isEnd}
                        submited={justSubmited}
                    />
                ) : (
                    <PrivateRoom
                        messagesArr={messagesArr}
                        username={username}
                        refContainer={refMessagesContainer}
                        onScroll={onMouseOver}
                        isEnd={isEnd}
                        submited={justSubmited}
                    />
                )}
                <div
                    className={styles.scrollbarContainer}
                    onMouseDown={onMouseDownScrollbarContainer}
                    onWheel={onWheelScrollbar}
                >
                    <div
                        className={styles.scrollbar}
                        ref={refScrollbar}
                        onMouseDown={onMouseDown}
                    ></div>
                </div>
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
    let newHeight, offsetBottom; // ofsetBottom in px
    if (ratio >= 1) {
        newHeight = 0;
        offsetBottom = 0;
    } else {
        newHeight = ratio * visibleHeight - 10; // slightly smaller to not touch top and bottom inside the container
        const verticalOffset = messageContainer.scrollTop;
        const ratio2 =
            (messagesContainerHeight - verticalOffset - visibleHeight) / messagesContainerHeight;
        if (ratio2 >= 1) offsetBottom = -newHeight;
        else {
            offsetBottom = (1 - ratio2) * visibleHeight - newHeight;
        }
    }
    return [newHeight, offsetBottom];
}

Chat.propTypes = {
    contactInfo: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
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

export default Chat;
