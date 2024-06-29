const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Booking = require("../models/bookingModel");
const Car = require("../models/carModel");
const ErrorHandler = require("../utils/errorHandler");
const stripe = require('stripe')("sk_test_51MD4fISAnNDrfpjkwWC3y9OBlvRiAU5dTuxjD5zXxxQzvtWFBZicKXfNniiKJKqLTjE6X85yJYtqNrlTJBregocI009FqdBmnc")
const generateReceiptPDF = require("../service/pdfGenerator");
const sendEmailWithAttachment = require("../service/emailService");


// Book Car
exports.bookCar = catchAsyncErrors(async (req, res, next) => {
  if (req.body.totalHours === 0) {
    return next(new ErrorHandler("Please select valid hours!",404));
  }
  else{
    const {token} = req.body;
    const customer = await stripe.customers.create({
      email:token.email,
      source:token.id
    })
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.totalAmount * 100,
      currency:'inr',
      payment_method_types: ['card'],
      confirm:true,
      customer:customer.id,
      payment_method:token.card.id,
    });
    // console.log(paymentIntent);
    // console.log(token.card.id);
    // const {token} = req.body;
    // // console.log(token);
    // const customer = await stripe.customers.create({
    //   email:token.email,
    //   source:token.id
    // })
    // const payment = await stripe.charges.create({
    //   amount:req.body.totalAmount,
    //   currency:"INR",
    //   customer:customer.id,
    //   receipt_email:token.email
    // },{idempotencyKey:uuidv4()})

    if (paymentIntent) {
      const selectedCar = await Car.findById(req.body.carBooked);
      if (!selectedCar) {
        return next(new ErrorHandler("Invalid Car", 500));
      }
      req.body.user = req.user.id;
      // req.body.totalAmount = selectedCar.rent * req.body.totalHours;
      req.body.transactionId = paymentIntent.id;
      const newBooking = await Booking.create(req.body);
      // (selectedCar.bookedSlot.from = req.body.bookedSlot.from),
      //   (selectedCar.bookedSlot.to = req.body.bookedSlot.to),
      var obj = {
        from:req.body.bookedSlot.from,
        to:req.body.bookedSlot.to,
        bookingId:newBooking._id
      }
      selectedCar.bookedSlot.push(obj);
      // (selectedCar.bookedSlot.bookingId = newBooking._id),
      // bookedCar.bookedSlot.bookingId = newBooking._id;
      await selectedCar.save();


      const pdfBytes = await generateReceiptPDF(newBooking);

      try {
        const emailSent = await sendEmailWithAttachment(
            token.email,
            'Booking Receipt',
            'Please find attached your booking receipt.',
            'receipt.pdf',
            pdfBytes.toString('base64')
        );

        if (!emailSent) {
          throw new ErrorHandler('Could not send email', 500);
        }

        res.status(200).json({
          success: true,
          bookingDetails: newBooking,
          bookingInfo: selectedCar.bookedSlot,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
    else{
      return next(new ErrorHandler("Booking Failed", 500));
    }
  }
});

// Get All Bookings --Admin

exports.allBookings = catchAsyncErrors(async (req, res, next) => {
  const bookings = await Booking.find({});
  if (!bookings) {
    return next(new ErrorHandler("No bookings available", 500));
  }
  res.status(200).json({
    success: true,
    allBookings:bookings,
    totalBookings:bookings.length
  });
});

// Get Individual Booking
exports.particularBooking = catchAsyncErrors(async (req, res, next) => {
  const booking = await Booking.find({user:req.user.id});
  if (!booking) {
    return next(new ErrorHandler("No bookings available", 500));
  }
  res.status(200).json({
    success: true,
    allBookings:booking,
  });
});

// Delete Booking --Admin

exports.deleteBooking = catchAsyncErrors(async(req,res,next)=>{
  const booking = await Booking.findById(req.params.id);
  if(!booking){
    return next(new ErrorHandler("Booking not found!",500));
  }
  const car = await Car.findById(booking.carBooked);
  await booking.remove();
  await car.update({$pull:{bookedSlot:{bookingId:req.params.id}}})
  res.status(200).json({
    success:true,
    message:"Booking deleted successfully",
  })
})