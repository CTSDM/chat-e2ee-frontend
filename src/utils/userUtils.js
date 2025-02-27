function updateOneTimeVariables(userVars, response) {
    userVars.current.privateKeyEncrypted = response.privateKeyEncrypted;
    userVars.current.salt = response.salt;
    userVars.current.iv = response.iv;
}

export default { updateOneTimeVariables };
