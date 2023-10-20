const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true,
   },
   email: {
      type: String,
      required: true,
   },

   password: {
      type: String,
      required: true,
   },
   repeatPassword: {
      type: String,
      required: true,
   },
   is_verified: {
      type: Number,
      default: 0,

   },
   is_admin: {
      type: Number,
      required: true,

   },
   cart: {
      type: Array

   },
   whishlist: {
      type: Array
   },
   address:
      [{
         name: { type: String },
         number: { type: String },
         altNumber: { type: String },
         pinCode: { type: String },
         house: { type: String },
         area: { type: String },
         landmark: { type: String },
         town: { type: String },
         state: { type: String },


      }],
      total: {
         type: String
      },
   
      wallet: [{
         amount: {
            type: Number
         },
          timestamp: {
            type: Date,
            default: Date.now
   
         }, paymentType: {
            type: String
   
         }
   
   
      }],
      

})


module.exports = mongoose.model("user", userSchema);