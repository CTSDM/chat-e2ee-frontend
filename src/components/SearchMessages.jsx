import PropTypes from "prop-types";
import { useEffect } from "react";
import { chatUtils } from "../utils/utils.js";
import styles from "./SearchMessages.module.css";

function SearchMessages({ chatList, searchTerm, setSearchTerm, setResult }) {
    useEffect(() => {
        if (searchTerm) {
            // we filter the message and return an array with reverse order
            const contexts = Object.keys(chatList);
            const matches = [];
            contexts.forEach((context) => {
                const contextMessages = chatList[context].messages;
                for (const messageId in contextMessages) {
                    const content = contextMessages[messageId].content;
                    if (content.includes(searchTerm)) {
                        const message = structuredClone(contextMessages[messageId]);
                        message.id = messageId;
                        message.context = context;
                        matches.push(message);
                    }
                }
            });
            chatUtils.orderMessages(matches, true);
            setResult(matches);
        } else {
            setResult([]);
        }
    }, [searchTerm, setResult, chatList]);

    function onChange(event) {
        setSearchTerm(event.target.value);
    }

    function onClickCancel() {
        setSearchTerm("");
        setResult({});
    }

    const cancelButton = searchTerm ? (
        <button type="button" className={styles.cancelButton} onClick={onClickCancel}>
            x
        </button>
    ) : null;

    return (
        <div className={styles.container}>
            <input
                type="text"
                name="search"
                placeholder="Search"
                value={searchTerm}
                onChange={onChange}
                className={styles.searchBar}
            />
            {cancelButton}
        </div>
    );
}

SearchMessages.propTypes = {
    chatList: PropTypes.objectOf(
        PropTypes.shape({
            last: PropTypes.string,
            lastIndex: PropTypes.number,
            messages: PropTypes.object.isRequired,
            name: PropTypes.string.isRequired,
        }),
    ).isRequired,
    searchTerm: PropTypes.string.isRequired,
    setSearchTerm: PropTypes.func.isRequired,
    setResult: PropTypes.func.isRequired,
};

export default SearchMessages;
