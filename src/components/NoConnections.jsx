import PropTypes from "prop-types";
import styles from "./NoConnection.module.css";

export default function NoConnections({ imgSrc, text }) {
    return (
        <div className={styles.container}>
            <div className={styles.img}>
                <img src={imgSrc} alt="image of a group" />
            </div>
            <div className={styles.text}>
                <div className={styles.title}>
                    <h2>{text.title}</h2>
                </div>
                <div className={styles.body}>{text.body}</div>
            </div>
        </div>
    );
}

NoConnections.propTypes = {
    imgSrc: PropTypes.string.isRequired,
    text: PropTypes.shape({
        title: PropTypes.string,
        body: PropTypes.string.isRequired,
    }).isRequired,
};
