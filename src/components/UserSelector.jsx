import PropTypes from "prop-types";
import styles from "./UserSelector.module.css";

export default function UserSelector({ id, name }) {
    return (
        <label htmlFor={id} className={styles.user}>
            <span>{name}</span>
            <input type="checkbox" name={id} id={id} defaultChecked={false}></input>
        </label>
    );
}

UserSelector.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
};
