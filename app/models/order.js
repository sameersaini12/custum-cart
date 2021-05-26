const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    customerId : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required: true
    },
    items : {type : Object , required : true},
    payment: {type:String , default: "Cash-on-delivery" },
    paymentStatus : {type: Boolean , default: false},
    status : {type : String , default : "order-placed"}
},{timestamps : true})

const Order = mongoose.model("Order" , orderSchema);

module.exports = Order;