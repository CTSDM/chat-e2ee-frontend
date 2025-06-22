import PropTypes from "prop-types";
import styles from "./SearchContacts.module.css";

export default function SearchContacts({ value, setValue }) {
    function onChange(e) {
        setValue(e.currentTarget.value);
    }

    function onClickCancel() {
        setValue("");
    }

    const cancelButton = value ? (
        <button type="button" className={styles.cancelButton} onClick={onClickCancel}>
            x
        </button>
    ) : null;

    return (
        <div className={styles.container}>
            <input
                autoFocus={true}
                type="text"
                name="search"
                placeholder="Search contacts"
                value={value}
                onChange={onChange}
                className={styles.searchBar}
            />
            {cancelButton}
        </div>
    );
}

SearchContacts.propTypes = {
    value: PropTypes.string.isRequired,
    setValue: PropTypes.func.isRequired,
};
