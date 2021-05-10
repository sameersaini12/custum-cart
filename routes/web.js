const Product = require("../app/models/product");
const Address = require("../app/models/address");
const flash = require("express-flash");
const User = require("../app/models/user");
const bcrypt = require("bcrypt");
const passport = require("passport");
const guest = require("../app/middleware/guest");
const admin = require("../app/middleware/admin");
const auth = require("../app/middleware/auth")

function initRoutes(app) {

    app.get("/addproduct" , (req,res)=> {
        res.render("addproduct");
    })
    
    app.post("/addproduct" ,async (req,res)=> {
        const newProduct = new Product({
            title : req.body.title,
            price: req.body.price,
            rating : req.body.rating,
            image : req.body.image,
        });
        await newProduct.save();
        res.send("data send")
    })

    app.get("/" , (req,res)=> {
        Product.find().then((products)=> {
            res.render("home" , { products : products});
        })
    })

    app.get("/cart", (req,res)=> {
        res.render("customers/cart");
    })
    
    app.get("/login" ,guest , (req,res)=> {
        res.render("auth/login");
    })
    
    app.get("/register" , guest , (req,res)=> {
        res.render("auth/register");
    })

    app.get("/add-to-cart" , (req,res)=> {
        res.render("customers/add-to-cart")
    })

    app.get("/product/:id" , async(req , res) => {
        Product.find( { _id : req.params.id }).then(async(product)=> {
            let address='';
            address = await Address.find({customerId: req.user._id}) 
            res.render("oneProduct" , {product : product[0] , addresses : address})
        })
    })

    app.post("/address" , (req,res) => {
        const {phone , pincode , address} = req.body;
        const addressA = new Address({
            customerId : req.user._id,
            phone: phone,
            pincode : pincode,
            address : address,
        })
        addressA.save().then(()=> {
            req.flash("success" , "Address saved");
            res.redirect("/checkout");
        }).catch((e)=> {
            req.flash("error" , "Something went wrong");
            res.redirect("/");
        })
    })

    app.post("/changeaddress" , async(req,res)=> {
        await Address.deleteOne({customerId: req.user._id})
        res.redirect("/product/:id");
    })
    
    const generateRedirectUrl = (req)=> {
        return req.user.role === 'admin' ? '/admin/orders' : '/'
    }
    
    app.post("/login" , (req,res,next)=> {
        const {email , password} = req.body;
        if(!email || !password) {
            req.flash("error" , 'All fiels are required');
            return res.redirect("/login");
        }
        passport.authenticate('local' , (err , user , info)=> {
            if(err) {
                req.flash('error' , info.message);
                next(err)
            } 
            if(!user) {
                req.flash('error' , info.message);
                return res.redirect("/login");
            }
            req.logIn(user ,(err)=> {
                if(err) {
                    req.flash('error' , info.message);
                    next(err);
                }
                return res.redirect(generateRedirectUrl(req))
            })
        })(req,res,next)
    })
    
    
    app.post("/register", async(req,res)=> {
        const {name , email ,password} = req.body;
    
        if(!name || !email || !password) {
            req.flash('error' , 'All fields are required');
            req.flash('name' , name);
            req.flash('email', email);
            return res.redirect("/register");
        }
    
         //check if email exits 
         User.exists({email : email }, (err,result)=>{
            if(result) {
                req.flash('error' , 'Email already taken');
                req.flash('name', name);
                req.flash('email', email);
                return res.redirect('/register')
            }
        })
    
        const hashPassword = await bcrypt.hash(password , 10);
    
        const newUser = new User({
            name : req.body.name,
            email: req.body.email,
            password : hashPassword
        })
        await newUser.save().then((user)=> {
            return res.redirect("/");
        }).catch((e)=> {
            req.flash("error" , "Something went wrong");
            return res.redirect("/register")
        });
    })
    
    app.post("/logout" , (req,res)=> {
        req.logout();
        res.redirect("/"); 
    })

    app.post("/update-cart" , (req,res)=> {
        if(!req.session.cart) {
            req.session.cart = {
                items: {},
                totalQty: 0,
                totalPrice: 0
            }
        }
        let cart = req.session.cart
            //check if item doesnot exist in cart
            if(!cart.items[req.body._id]) {
               cart.items[req.body._id] = {
                   item :req.body,
                   qty: 1
               }
               cart.totalQty = cart.totalQty +1
               cart.totalPrice = cart.totalPrice + req.body.price
            } else {
                cart.items[req.body._id].qty += 1;
                cart.totalQty = cart.totalQty +1
                cart.totalPrice = cart.totalPrice + req.body.price 
            }
        res.json({totalQty : req.session.cart.totalQty})
    })


}

module.exports = initRoutes