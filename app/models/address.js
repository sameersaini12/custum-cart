const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
    customerId : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required: true
    },
    phone: {type: Number , required: true},
    pincode : {type: Number , required: true},
    address : { type : String , requried: true}
})

const Address = mongoose.model("Address" , addressSchema);

module.exports = Address;