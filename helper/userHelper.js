const bcrypt = require("bcrypt")
const User = require("../model/userModel")
const randomString = require("randomstring")
const nodemailer = require("nodemailer")
const session = require("express-session");
//const mongoose = require("mongoose")
const objj = {}
module.exports = {

   
    //otp loader
    loadOtp: async(req,res)=>{
        try{
         
            res.render("otp",{userId:req.query.id})
        }
        catch(error){
            console.log(error.message);
        }
    },

    //password decryption
    passwordHash: async(password)=>{
        try{
            hashedPassword = await bcrypt.hash(password,10)
            return hashedPassword

        }
        catch(Error){
            console.log(Error.message);
        }
    },

    //mail verification 
    sendVerifyMail: async(name,email,otp)=>{
        try{
            const transporter = nodemailer.createTransport({
                host:"smtp.gmail.com",
                port:587,
                secure:false,
                requireTLS:true,
                auth:{
                    user:"aswinbrototype@gmail.com",
                    pass:"bylafaucmxasiwnm"
                }
            }) 
            const mailOption = {
                from:"aswinbrototype@gmail.com",
                to:email,
                subject:"For verification mail",
                html:'<p>Hyy '+name+" "+"this is your verify opt " +"  "+  otp+' "</p>'
                
            }
            transporter.sendMail(mailOption,function(error,info){
                if(error){

                }else{
                    console.log("Email has been send :-" ,info.response);
                }
            })
            
        }
        catch(error){
            console.log(error.message);
        }
    },

    // sign up page loader
    // loadingsinup: async(req,res)=>{
    //     try{
    //         res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    //         res.render("users/siginup")
    //     }
    //     catch(error){
    //         console.log(error.message);
    //     }
    // },

    // new user
    insertuser: async(req,res)=>{
        try{
           
            const Spassword = await module.exports.passwordHash(req.body.password)
            console.log();
          
            const user= new User({
                name:req.body.name,
                email:req.body.email,
                mobile:req.body.mobile,
                password:Spassword,
                is_admin:0

            })
            const userData = await user.save()

           if(userData){
            const otp = randomString.generate({length:4,charset:"numeric"})
           objj.OTP = otp
           console.log(objj.OTP);
          
           await module.exports.sendVerifyMail(req.body.name,req.body.email,otp)
           res.redirect(`/otp?id=${userData._id} `);

           }
           else{
            res.render("registration",{message:"your registerarion Failed"})
           }
        }
        catch(error){
            console.log(error.message);
        }
    },

    //verify otp
    Verifyotp: async(req,res)=>{
        try{
           
            const otp1 = req.body.otp1;
            const otp2 = req.body.otp2;
            const otp3 = req.body.otp3;
            const otp4 = req.body.otp4;
            const Newopt =otp1+otp2+otp3+otp4
            
          
            if(objj.OTP === Newopt){
                delete objj.OTP
                const id = req.body.userId.trim()
        
              const udpateinfo = await User.updateOne({_id:id} , {$set:{is_verified:1}})
              console.log(udpateinfo);
               res.redirect("/")
            }
 
        }
        catch(error){
            console.log(error.message);
        }
    },

    varifyLogin: async(req,res)=>{
        try {
            const email = req.body.email
            const password = req.body.password
      
      
      
      
            const userData = await User.findOne({ email: email })
      
            if (userData) {
                req.session.user = userData
                console.log(req.session.user);
                const passwordMatch = await bcrypt.compare(password, userData.password)
                if (passwordMatch == 0) {
                    res.render("login", { message: "email and password is incorrect" })
      
      
                } else {
                    console.log(req.session.isLoggedIn + "Before");
                    req.session.isLoggedIn = true
                    res.redirect('/')
      
                }
      
      
            } else {
                res.render("landing-page", { message: "email and password is incorrect" })
            }
      
        } catch (error) {
            
        }
    }
   
}   