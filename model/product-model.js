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
    created_on:{
        type:Date,
        default:Date.now
    },
    unit:{
        type:String,
        require:true
    },
    gst:{
        type:Number,
        require:true,
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