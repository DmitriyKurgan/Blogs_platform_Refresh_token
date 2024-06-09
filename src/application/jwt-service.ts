import {AccessToken, OutputUserType, TokenType} from "../utils/types";
import {ObjectId} from "mongodb";
import jwt from 'jsonwebtoken';
import {settings} from "../settings";

export const jwtService:any = {

    async createJWT(user:OutputUserType):Promise<TokenType>{
        const accessToken: AccessToken = {
            accessToken: jwt.sign({ userId: user.id }, settings.JWT_SECRET, { expiresIn: '200s' })
        };

        const refreshToken = jwt.sign({ userId: user.id }, settings.JWT_SECRET, { expiresIn: '210s' })

        return { accessToken, refreshToken };
    },
    async getUserIdByToken(token:string):Promise<ObjectId | null>{
        try {
           const result:any = jwt.verify(token, settings.JWT_SECRET);
           debugger
           return result.userId;
        } catch (e:unknown) {
            return null
        }
    },
    async verifyToken(token: string) {
        try {
            return jwt.verify(token, settings.JWT_SECRET) as {
                userId: number;
                exp: number;
            };
        } catch (error) {
            return null;
        }
    }

}