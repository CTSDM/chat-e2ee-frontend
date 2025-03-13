import { dataManipulationUtils } from "./utils";

function updateOneTimeVariables(userVars, response) {
    userVars.current.privateKeyEncrypted = response.privateKeyEncrypted;
    userVars.current.salt = dataManipulationUtils.objArrToUint8Arr(response.salt);
    userVars.current.iv = dataManipulationUtils.objArrToUint8Arr(response.iv);
}

export default { updateOneTimeVariables };
