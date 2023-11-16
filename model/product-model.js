const mongoose =  require('mongoose');


let productModel = new mongoose.Schema({
    name:{
        type:String,
        require:true,
    },
    description:{
        type:String,
        require:true
    },
    category:{
        type:String,
        require:true,
    },
    regular_price:{
        type:Number,
        require:true
    },
    sale_price:{
        type:Number,
        requrie:true
    },
    product_offer_price:{
        type:Number,
        require:true
    },
    created_on:{
        type:Date,
        default:Date.now
    },
    images:{
        type:Array,
        require:true 
    },
    quantity:{
        type:Number,
        require:true
    }


});

module.exports = mongoose.model('product' , productModel)