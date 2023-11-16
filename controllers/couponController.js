const asyncHandler=require('express-async-handler')
const Coupon=require('../model/coupenModel');
const User=require('../model/userModel')






//---------------rendering the coupen add page---------------
const loadCoupon=asyncHandler(async(req,res)=>{
    try {
      const currentPage = '/admin/add-Coupon';
        res.render('addcoupon1',{currentPage})
        
    } catch (error) {
        console.log('Error happence in the coupon controller in the funtion loadCoupon',error);
    }
})
//-----------------------------------------



//--------------------cerate a coupen whith coupen ----------------
const addCoupon = asyncHandler(async (req, res) => {
  console.log('couupppeennnnnn');
  try {
    // Check if required fields are present in the request body
    if (!req.body.name || !req.body.discription || !req.body.offerPrice) {
      throw new Error('Required fields are missing');
    }

    // Validate if offerPrice is greater than minimumAmount
    const offerPrice = parseFloat(req.body.offerPrice);
    const minimumAmount = parseFloat(req.body.minimumAmount);

    if (isNaN(offerPrice) || isNaN(minimumAmount) || offerPrice < 0 || minimumAmount < 0 || offerPrice >= minimumAmount) {
      throw new Error('Invalid offer price or minimum amount And offer price must be less than minimum amount');
    }

    let customExpiryDate = new Date(req.body.expiryDate);

    // Check if customExpiryDate is a valid date
    if (isNaN(customExpiryDate.getTime())) {
      // If it's an invalid date, set it to be one month from the current date
      const currentMonth = new Date().getMonth();
      const newExpiryDate = new Date();
      newExpiryDate.setMonth(currentMonth + 1);
      customExpiryDate = newExpiryDate;
    }

    const coupon = new Coupon({
      code: req.body.code,
      name: req.body.name,
      discription: req.body.discription,
      offerPrice: offerPrice,
      minimumAmount: minimumAmount,
      createdOn: Date.now(),
      expiryDate: customExpiryDate,
    });

    const create = await coupon.save();

    res.redirect('/admin/coupon');
  } catch (error) {
    console.log('Error happened in the coupon controller in the function addCoupon', error);
    // Handle error, e.g., display an error message to the user
    res.status(400).send(error.message);
  }
});


//---------------------------------------------------------








//--------------rendering the coupen page with data-----------------
const coupon=asyncHandler(async(req,res)=>{
    try {
        const coupon= await Coupon.find()
        



        const itemsperpage = 5;
        const currentpage = parseInt(req.query.page) || 1;
        const startindex = (currentpage - 1) * itemsperpage;
        const endindex = startindex + itemsperpage;
        const totalpages = Math.ceil(coupon.length / 5);
        const currentproduct = coupon.slice(startindex,endindex);

        const currentPage = '/admin/coupon';

        res.render('coupon',{coupon,currentproduct, totalpages,currentpage,currentPage})
        
    } catch (error) {
        console.log('Error happence in the coupon controller in the funtion coupon',error);
        
    }
})
//---------------------------------------------------







//--------------------------dlete a sinfle product ------------------------
const deleteCoupon=asyncHandler(async(req,res)=>{
    try {
        const id=req.query.id

        const coupon= await Coupon.findByIdAndDelete(id)



        res.redirect('/admin/coupon')



    } catch (error) {
        console.log('Error happence in the coupon controller in the funtion deleteCoupon',error);
        
    }
})
//--------------------------------------------------------------------







//-------------------rendring th edit coupon page with data in tha vlu------------
const editCoupon=asyncHandler(async(req,res)=>{
    try {
        const id =req.query.id
        const coupon = await Coupon.findById(id)

        res.render('edit-coupon',{coupon})
        
    } catch (error) {
        console.log('Error happence in the coupon controller in the funtion editCoupon',error);
        
    }
})
//------------------------------------------------------






const updateCoupon = asyncHandler(async (req, res) => {
  try {
    const id = req.body.id;
    const x = req.body;

    // Validate if offerPrice is greater than minimumAmount
    const offerPrice = parseFloat(x.offerPrice);
    const minimumAmount = parseFloat(x.minimumAmount);

    if (isNaN(offerPrice) || isNaN(minimumAmount) || offerPrice < 0 || minimumAmount < 0 || offerPrice >= minimumAmount) {
      throw new Error('Invalid offer price or minimum amount');
    }

    if (x.expiryDate) {
      const updatedCoupon = await Coupon.findByIdAndUpdate(
        id,
        {
          name: x.name,
          discription: x.discription,
          offerPrice: offerPrice,
          minimumAmount: minimumAmount,
          expiryDate: x.expiryDate,
        },
        { new: true }
      );
    } else {
      const updatedCoupon = await Coupon.findByIdAndUpdate(
        id,
        {
          name: x.name,
          discription: x.discription,
          offerPrice: offerPrice,
          minimumAmount: minimumAmount,
        },
        { new: true }
      );
    }

    res.redirect('/admin/coupon');
  } catch (error) {
    console.log('Error happened in the coupon controller in the function editCoupon', error);
    // Handle error, e.g., display an error message to the user
    res.status(400).send(error.message);
  }
});


  //--------------------------------------------------------------





//-------------chekthe coupon is valid or not -----------------
  const validateCoupon = asyncHandler(async (req, res) => {
    try {
      console.log('entereeeeeeeeeeee');
      const name = req.body.couponCode;
  
      // Query the database to find the coupon by its name
      const coupon = await Coupon.findOne({ name: name });
  
      if (coupon) {
        const user = await User.findById(req.session.user)
        const userId={
          userId:user._id
        }

    

        coupon.user.push(userId)
        await coupon.save()
        console.log('saved');
        // If a coupon with the provided name is found, send it as a JSON response
        res.status(200).json({
          isValid: true,
          coupon: coupon, // Include the coupon data in the response
        });
      } else {
       // console.log('errorr on notfound');
        // If no coupon with the provided name is found, send an error response
        res.status(404).json({
          isValid: false,
          error: 'Coupon not found',
        });
      }
    } catch (error) {
      console.log('Error happened in the coupon controller in the function validateCoupon', error);
      res.status(500).json({
        isValid: false,
        error: 'An error occurred while processing your request',
      });
    }
  });
//---------------------------------------------------------











module.exports={
    loadCoupon,
    addCoupon,
    coupon,
    editCoupon,
    deleteCoupon,
    updateCoupon,
    validateCoupon
}