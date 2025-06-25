import PropTypes from "prop-types";
import { useRef } from "react";
import PreviewSearch from "./PreviewSearch.jsx";
import PreviewMessages from "./PreviewMessages.jsx";
import { chatUtils } from "../utils/utils.js";
import styles from "./PreviewWrapper.module.css";
import SearchMessages from "./SearchMessages.jsx";
import NoConnections from "./NoConnections.jsx";
import connectionSvg from "../assets/connections.svg";
import { texts } from "../../config/config.js";

function PreviewSearchWrapper({
    searchTerm,
    searchResult,
    username,
    contactList,
    chatMessages,
    target,
    setTarget,
    setTargetMessage,
    active,
    setSearchTerm,
    setResult,
    chatList,
}) {
    const refContainer = useRef(null);
    const contactsOrdered = chatUtils.getContactsOrdered(contactList);

    function handlePreviewMessage(target) {
        // we change the current target, and thus the shown messages will change
        // the chat will be ready to send messages to that contact
        setTarget(target);
    }

    function handlePreviewSearch(context, messageId) {
        setTarget(context);
        setTargetMessage((previousId) => {
            if (previousId === messageId) {
                setTimeout(() => setTargetMessage(messageId), 0);
                return "";
            } else {
                return messageId;
            }
        });
    }

    if (refContainer.current) {
        if (active) {
            refContainer.current.style["z-index"] = 0;
            refContainer.current.style["opacity"] = 1;
        } else {
            refContainer.current.style["z-index"] = -1;
            refContainer.current.style["opacity"] = 0;
        }
    }

    const showEmpty = contactsOrdered.length === 0;
    return (
        <div className={styles.chatContainer} ref={refContainer}>
            <SearchMessages
                setSearchTerm={setSearchTerm}
                searchTerm={searchTerm}
                setResult={setResult}
                chatList={chatList}
            />
            {searchTerm
                ? searchResult.map((message) => {
                      const context = message.context;
                      return (
                          <PreviewSearch
                              key={message.id}
                              id={context}
                              contact={contactList[context]}
                              username={username}
                              message={message}
                              handleOnClick={handlePreviewSearch}
                              active={active}
                          />
                      );
                  })
                : contactsOrdered.map((contact) => {
                      return (
                          <PreviewMessages
                              key={contact}
                              id={contact}
                              contact={contactList[contact]}
                              username={username}
                              messages={chatMessages[contact].messages}
                              target={target}
                              handleOnClick={handlePreviewMessage}
                              lastId={chatMessages[contact].last}
                          />
                      );
                  })}
            {showEmpty ? <NoConnections imgSrc={connectionSvg} text={texts.noChat} /> : null}
        </div>
    );
}

PreviewSearchWrapper.propTypes = {
    searchTerm: PropTypes.string.isRequired,
    searchResult: PropTypes.array.isRequired,
    username: PropTypes.string.isRequired,
    contactList: PropTypes.object.isRequired,
    chatMessages: PropTypes.object.isRequired,
    target: PropTypes.string.isRequired,
    setTarget: PropTypes.func.isRequired,
    setTargetMessage: PropTypes.func.isRequired,
    active: PropTypes.bool.isRequired,
    setSearchTerm: PropTypes.func.isRequired,
    setResult: PropTypes.func.isRequired,
    chatList: PropTypes.objectOf(
        PropTypes.shape({
            last: PropTypes.string,
            lastIndex: PropTypes.number,
            messages: PropTypes.object.isRequired,
            name: PropTypes.string.isRequired,
        }),
    ).isRequired,
};

export default PreviewSearchWrapper;
