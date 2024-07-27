import * as express from "express";
import * as jwt from "jsonwebtoken";
import { ISecurityDto } from "../../application/security/Dtos/securityDto";
import { IUserDto } from "../../application/users/userDto";
import constants from "./../config/constants";

declare global {
    namespace Express {
        interface Request {
            user?: IUserDto;
        }
    }
}

export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {

    if (securityName !== "jwt")  return Promise.reject(new Error("Unsupported security name"));

    const token =
      request.body.token ||
      request.query.token ||
      request.headers?.authorization   ||
      request.headers["x-access-token"]

    if (!token) return Promise.reject(new Error("No token provided"));

    const cleanToken = token.split("Bearer")[1].trim();

    return new Promise((resolve, reject) => {
        jwt.verify(cleanToken, constants.CRYPTO.secret, function (err: any, decoded: ISecurityDto) {
            if (err) return reject(err);

            if (!scopes || !decoded || !decoded.role || decoded.role === "" || !scopes.includes(decoded.role))
                reject(new Error("JWT does not contain required scope."));
            else {
                request.user = decoded;
                resolve(decoded as IUserDto);
            }
        });
    });
}
