import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from '../../helpers/findOrCreate.js';

const googleStrategy = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
                scope: ['profile', 'email'],
            },
            function (accessToken, refreshToken, profile, done) {
                findOrCreate(profile, done);
            }
        )
    );
};

export default googleStrategy;
