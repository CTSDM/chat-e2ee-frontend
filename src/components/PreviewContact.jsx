import PropTypes from "prop-types";

export default function PreviewContact({ something }) {
    return <div>{something}</div>;
}

PreviewContact.propTypes = {
    something: PropTypes.string.isRequired,
};
