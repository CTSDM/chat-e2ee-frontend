import PropTypes from "prop-types";

export default function CreateGroup({ contactList }) {
    console.log("hey");
    console.log(contactList);
    const username = [];
    const usernameOriginalCase = [];
    for (let key in contactList) {
        username.push(key);
        usernameOriginalCase.push(contactList[key].username);
    }

    console.log(username);
    console.log(usernameOriginalCase);

    return null;
}

CreateGroup.propTypes = {
    contactList: PropTypes.object.isRequired,
};
