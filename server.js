const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000
const path = require("path")
const ejs = require("ejs")
const expressLayout = require("express-ejs-layouts")
const mongoose = require("mongoose")
const flash = require("express-flash")
const session = require("express-session");
const MongoDbStore = require("connect-mongo")
const passport = require("passport")



mongoose.connect("mongodb://localhost/custom-cart" , {
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true,
    useFindAndModify:true
}).then(()=> {
    console.log("Successful connection");
}).catch(()=> {
    console.log("Connection failed");
})




app.use(session({
    secret: "mynameissameer",
    resave :false,
    //by defalt memory sessions kaha store kare
    store : MongoDbStore.create({
        mongoUrl : "mongodb://localhost/custom-cart"
    }),
    saveUninitialized:false,
    cookie :  { maxAge: 1000*24*60*60 } //24 hrs
}))

//passport config 
require("./app/config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());


//set template engine
app.use(flash())
app.use(express.static("public"))
app.use(expressLayout);
app.set("views" , path.join(__dirname , "/resources/views"));
app.set("view engine" , "ejs");
app.use(express.json()); //for requesting json data
app.use(express.urlencoded({extended : false})) //for requesting array string obejcts 

//global middleware
app.use((req,res,next)=> {
    res.locals.session = req.session;
    res.locals.user = req.user;
    next();
})

require("./routes/web")(app);


app.listen(PORT , ()=> {
    console.log(`Listening on port ${PORT}`)
})