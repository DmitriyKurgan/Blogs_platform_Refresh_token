import {AccessToken, OutputUserType, RefreshToken, TokenType} from "../utils/types";
import {ObjectId} from "mongodb";
import jwt from 'jsonwebtoken';
import {settings} from "../settings";

export const jwtService:any = {

    async createJWT(user:OutputUserType):Promise<TokenType>{
        const accessToken: AccessToken = {
            accessToken: jwt.sign({ userId: user.id }, settings.JWT_SECRET, { expiresIn: '10s' })
        };

        const refreshToken: RefreshToken = {
            refreshToken: jwt.sign({ userId: user.id }, settings.JWT_SECRET, { expiresIn: '20s' })
        };
        return { accessToken, refreshToken };
    },
    async getUserIdByToken(token:string):Promise<ObjectId | null>{
        try {
           const result:any = jwt.verify(token, settings.JWT_SECRET);
           return result.userId;
        } catch (e:unknown) {
            return null
        }
    }

}