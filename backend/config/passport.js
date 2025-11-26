const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with google_id
      let user = await User.findOne({ 
        where: { google_id: profile.id } 
      });

      if (user) {
        return done(null, user);
      }

      // Check if email already exists
      user = await User.findOne({ 
        where: { email: profile.emails[0].value } 
      });

      if (user) {
        // Link Google account to existing user
        user.google_id = profile.id;
        user.oauth_provider = 'google';
        user.profile_picture = profile.photos[0]?.value;
        await user.save();
        return done(null, user);
      }

      // Create new user (OAuth users have verified emails)
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        google_id: profile.id,
        oauth_provider: 'google',
        profile_picture: profile.photos[0]?.value,
        hospital_name: 'Pending Hospital Assignment',
        role: 'staff',
        password: null,
        email_verified: true // OAuth users have verified emails
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));

module.exports = passport;