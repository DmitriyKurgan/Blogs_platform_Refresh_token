import {Request, Response, Router} from "express";
import {usersService} from "../services/users-service";
import {CodeResponsesEnum} from "../utils/utils";
import {
    authMiddleware,
    validateAuthRequests,
    validateEmailResendingRequests,
    validateErrorsMiddleware,
    validateRegistrationConfirmationRequests,
    validateUsersRequests,
    validationEmailConfirm,
    validationEmailResend,
    validationRefreshToken,
    validationUserUnique
} from "../middlewares/middlewares";
import {jwtService} from "../application/jwt-service";
import {authService} from "../services/auth-service";
import {emailService} from "../services/email-service";
import {OutputUserType} from "../utils/types";
import {usersRepository} from "../repositories/users-repository";

export const authRouter = Router({});

authRouter.post('/login', validateAuthRequests, validateErrorsMiddleware, async (req: Request, res: Response) => {
    const user = await usersService.checkCredentials(req.body.loginOrEmail, req.body.password)
    if (!user) {
        return res.sendStatus(CodeResponsesEnum.Unauthorized_401)
    }
    const token = await jwtService.createJWT(user);
    res
        .cookie('refreshToken', token.refreshToken, {
            httpOnly: true,
            secure: true,
            maxAge: 20 * 1000,
            sameSite: 'strict'
        })
        .status(CodeResponsesEnum.OK_200)
        .send(token.accessToken);

});

authRouter.post('/refresh-token', validationRefreshToken, async (req: Request, res: Response) => {
debugger
    const cookieRefreshToken = req.cookies.refreshToken;
    const cookieRefreshTokenObj = await jwtService.verifyToken(
        cookieRefreshToken
    );

    const userId = cookieRefreshTokenObj!.userId.toString();
    const user = await usersRepository.findUserByID(userId);

    const newAccessToken = (await jwtService.createJWT(user)).accessToken;
    const newRefreshToken = (await jwtService.createJWT(user)).refreshToken;

    res
        .cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
        })
        .status(200)
        .json(newAccessToken);
});


    authRouter.post('/registration',
        validateUsersRequests,
        validationUserUnique("email"),
        validationUserUnique("login"),
        validateErrorsMiddleware,
        async (req: Request, res: Response) => {
            const userAccount: OutputUserType | null = await usersService.createUser(req.body.login, req.body.email, req.body.password);
            if (!userAccount || !userAccount.emailConfirmation.confirmationCode) {
                return res.sendStatus(CodeResponsesEnum.Not_found_404)
            }
            const gmailResponse = await emailService.sendEmail(userAccount, userAccount.emailConfirmation.confirmationCode);
            if (!gmailResponse) {
                return res.sendStatus(CodeResponsesEnum.Not_found_404)
            }
            res.sendStatus(CodeResponsesEnum.Not_content_204)
        });
    authRouter.post('/registration-confirmation',
        validateRegistrationConfirmationRequests,
        validationEmailConfirm,
        validateErrorsMiddleware,
        async (req: Request, res: Response) => {
            const confirmationCode = req.body.code;
            const confirmationResult = authService.confirmRegistration(confirmationCode);
            if (!confirmationResult) {
                return res.sendStatus(CodeResponsesEnum.Incorrect_values_400);
            }
            res.sendStatus(CodeResponsesEnum.Not_content_204);
        });
    authRouter.post('/registration-email-resending',
        validateEmailResendingRequests,
        validationEmailResend,
        validateErrorsMiddleware, async (req: Request, res: Response) => {
            debugger
            const userEmail = req.body.email;
            const confirmationCodeUpdatingResult = await authService.resendEmail(userEmail);
            debugger
            if (!confirmationCodeUpdatingResult) return;
            res.sendStatus(CodeResponsesEnum.Not_content_204);
        });

    authRouter.get('/me', authMiddleware, async (req: Request, res: Response) => {
        const myID = req.userId
        if (!myID) {
            return res.sendStatus(CodeResponsesEnum.Unauthorized_401);
        }
        const user = await usersRepository.findUserByID(myID);
        if (!user) {
            return res.sendStatus(CodeResponsesEnum.Unauthorized_401)
        }
        res.status(CodeResponsesEnum.OK_200).send({
            email: user.accountData.email,
            login: user.accountData.userName,
            userId: myID
        })
    });

