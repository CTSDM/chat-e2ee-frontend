import { http, HttpResponse } from "msw";
import { env } from "../../config/config.js";
import { user, messages } from "../validEntries.js";
import { cryptoUtils } from "../../src/utils/utils.js";

export const handlers = [
    http.post(env.serverUrl + "/login", () => {
        return HttpResponse.json({
            privateUsername: user.privateUsername,
            publicUsername: user.publicUsername,
            privateKeyEncrypted: user.privateKeyEncrypted,
            salt: user.salt,
            iv: user.iv,
        });
    }),

    http.post(env.serverUrl, "/users/keys", () => {
        return HttpResponse.json({
            privateKeyEncrypted: user.privateKeyEncrypted,
            message: messages.valid,
        });
    }),
];

export const handlerAlternative = {
    loginGet401: http.get(env.serverUrl + "/login", () => {
        return new HttpResponse(null, { status: 401 });
    }),
};
