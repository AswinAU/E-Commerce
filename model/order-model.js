const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'user',
	},
	items: [
		{
			product: {
				type: mongoose.Schema.ObjectId,
				ref: 'product',
				required: true,
			},
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
			price: {
				type: Number,
				required: true,
				min: 0,
			},
		},
	],
	orderStatus: {
		type: String,
		enum:["pending","delivered","placed","cancelled"],
		default: 'pending',
	},
	totalAmount: {
		type: Number,
		required: true,
		min: 0,
	},
	// coupon:{
	// 	type:mongoose.Schema.ObjectId,
	// 	ref:'coupon',
	// },
    finalAmount: {
		type: Number,
		required: true,
		min: 0,
	},
	discount: {
		type: Number,
		default: 0,
		min: 0,
	},
	paymentMode: {
		type: String,
		required: true,
	},
	isPaid:{
		type:Boolean,
		default:false,
	},
	paymentData:{
		type:Object,
	},
   
	address: {
		type:Array
	},
	
	createdAt: {
		type: Date,
		default: Date.now,
	},
})

orderSchema.pre('save', async function (next) {
	let total = 0
	for (let item of this.items) {
		total += item.price * item.quantity
	}
	this.totalAmount = total
    this.finalAmount = total - this.discount
	next()
})

module.exports = mongoose.model('Order', orderSchema, 'orders')