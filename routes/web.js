const Product = require("../app/models/product");
const Address = require("../app/models/address");
const flash = require("express-flash");
const User = require("../app/models/user");
const bcrypt = require("bcrypt");
const passport = require("passport");
const guest = require("../app/middleware/guest");
const admin = require("../app/middleware/admin");
const auth = require("../app/middleware/auth");
const Order = require("../app/models/order");
const moment = require("moment");
const Emitter = require("events");

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
        Product.find( { _id : req.params.id }).then(async(product)=> {
            let address='';
            if(req.user) 
            address = await Address.find({customerId: req.user._id}) 
            res.render("customers/cart" , {product : product[0] , addresses : address})
        })
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
            if(req.user) 
            address = await Address.find({customerId: req.user._id}) 
            res.render("oneProduct" , {product : product[0] , addresses : address})
        })
    })

    app.post("/address/:id" , (req,res) => {
        const {phone , pincode , address} = req.body;
        const addressA = new Address({
            customerId : req.user._id,
            phone: phone,
            pincode : pincode,
            address : address,
        })
        addressA.save().then(()=> {
            req.flash("success" , "Address saved");
            res.redirect("/product/"+req.params.id);
        }).catch((e)=> {
            req.flash("error" , "Something went wrong");
            res.redirect("/");
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
            res.redirect("/cart");
        }).catch((e)=> {
            req.flash("error" , "Something went wrong");
            res.redirect("/");
        })
    })

    app.post("/changeaddress/:id" , async(req,res)=> {
        await Address.deleteOne({customerId: req.user._id})
        res.redirect("/product/"+req.params.id);
    })

    app.post("/changeaddress" , async(req,res)=> {
        await Address.deleteOne({customerId: req.user._id})
        res.redirect("/cart");
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

    app.post("/placeanorder" , (req,res)=> {
        const paymentType = req.body.payment;
        const orders = new Order ({
            customerId : req.user._id,
            items : req.session.cart.items
        })
        orders.save().then((result)=> {
            Order.populate(result , {path : 'customerId'} , (err , placedOrder)=> {
                req.flash("success" , "Order placed successfully")
                delete req.session.cart

                const eventEmitter = req.app.get("eventEmitter")
                eventEmitter.emit('orderPlaced', placedOrder)
                    return res.redirect("/customers/orders");
                // return res.status(200).redirect("/")
            }) 
        }).catch((e)=> {
            console.log(e)
            req.flash('error' , 'something went wrong')
            return res.redirect("/cart");
        })
    })

    app.get("/customers/orders" ,auth , async (req,res)=> {
        const orders = await Order.find({customerId : req.user._id} , null , {sort : {'createdAt' : -1}});
        res.render("customers/orders" , {orders:orders , moment: moment});
    })

    app.get("/customers/orders/:id" ,auth, async(req,res)=> {
        const order = await Order.findById(req.params.id);
        if(req.user._id.toString() === order.customerId.toString()) {
            res.render("customers/singleOrder" , {order : order});
        }else {
            res.redirect("/");
        }
    })

    //admin 
    app.get("/admin/orders" ,admin, (req,res)=> {
        Order.find({status : { $ne : 'completed'}} , null , {sort : {'createdAt' : -1}} )
        .populate('customerId' , '-password').exec((err , orders)=> {
            //check if there is any ajax call or not
            if(req.xhr) {
                return res.json(orders)
            }
            return res.render("admin/orders");
        })
    })

    app.post("/admin/order/status" , admin , (req,res)=> {
        Order.updateOne({_id : req.body.orderId} , {status : req.body.status} , (err , data)=> {
            const eventEmitter = req.app.get('eventEmitter');
            eventEmitter.emit('orderUpdated' , {id : req.body.orderId , status : req.body.status})
            res.redirect("/admin/orders");
        })
    })
}

module.exports = initRoutes