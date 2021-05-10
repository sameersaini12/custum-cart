const LocalStatergy = require("passport-local").Strategy;
const User = require("../models/user");
const bcrypt = require("bcrypt");


const init =async (passport) => {
    passport.use(new LocalStatergy({usernameField : 'email'},async (email , password ,done)=> {
        const user = await  User.findOne({email : email});
       if(!user) {
           return done(null , false , {message : 'No user with this email'});
       }

       bcrypt.compare(password , user.password).then(match => {
           if(match) {
               return done (null , user , {message : 'Logged in succesfully'});
           }
           return done(null , false , {message : "wrong username or password"})
       }).catch(e => {
           return done(null , false , {message : "something went wrong"})
       });
    }))

    //session me store karne ke liye taki badd me use kar sake 
    passport.serializeUser((user , done)=> {
        done(null , user._id);
    })

    passport.deserializeUser((id , done)=> {
        User.findById(id , (err , user )=> {
            done(err , user )
        })
    })
}

module.exports = init;