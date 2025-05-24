import PropTypes from "prop-types";
import styles from "./SearchMessages.module.css";

function SearchMessages({ messages, searchTerm, setSearchTerm, setResult }) {
    function onChange(event) {
        const value = event.target.value;
        setSearchTerm(value);

        if (value) {
            // we just filter the messages
            const contexts = Object.keys(messages);
            const matches = {};
            contexts.forEach((context) => {
                const contextMessages = messages[context].messages;
                for (const messageId in contextMessages) {
                    const content = contextMessages[messageId].content;
                    if (content.includes(value)) {
                        const message = structuredClone(contextMessages[messageId]);
                        message.id = messageId;
                        message.context = context;
                        matches[messageId] = message;
                    }
                }
            });
            setResult(matches);
        } else {
            setResult({});
        }
    }

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
        </div>
    );
}

SearchMessages.propTypes = {
    messages: PropTypes.object,
    setSearchTerm: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
    setResult: PropTypes.func.isRequired,
};

export default SearchMessages;
