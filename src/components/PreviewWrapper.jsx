import PropTypes from "prop-types";
import PreviewSearch from "./PreviewSearch.jsx";
import PreviewMessages from "./PreviewMessages.jsx";
import { chatUtils } from "../utils/utils.js";

function PreviewSearchWrapper({
    searchTerm,
    searchResult,
    username,
    contactList,
    chatMessages,
    target,
    setTarget,
    setTargetMessage,
}) {
    const contactsOrdered = chatUtils.getContactsOrdered(contactList);
    if (contactsOrdered.length === 0) {
        return <div>No users yet...</div>;
    }

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

    return searchTerm
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
          });
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
};

export default PreviewSearchWrapper;
