const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    title : {type: String , required: true},
    price : {type: Number , required: true},
    rating : {type : Number , required: true},
    image : {type : String  },
})

const Product = mongoose.model("Product" , productSchema);

module.exports = Product;

