import crypto from "crypto";
import { sendMail } from "@/lib/sendMail";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json(
        {
          success: false,
          message: "Missing payment details",
        },
        { status: 400 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return Response.json(
        {
          success: false,
          message: "Payment verification failed",
        },
        { status: 400 }
      );
    }

    const bookingData = {
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      batch: user?.batch || "",
      amount: 199,
      originalPrice: 999,
      discount: 800,
      currency: "INR",
      paymentStatus: "Paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      createdAt: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
    };

    console.log("Workshop booking confirmed:", bookingData);

    // OWNER EMAIL
    const ownerMailHtml = `
      <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:24px;">
        <div style="max-width:650px; margin:auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e5e5;">
          <div style="background:#05070d; color:#ffffff; padding:24px;">
            <h2 style="margin:0; color:#facc15;">New Workshop Booking Received</h2>
            <p style="margin:8px 0 0; color:#d1d5db;">Payment verified successfully.</p>
          </div>

          <div style="padding:24px;">
            <h3 style="margin-top:0;">User Details</h3>

            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;"><b>Name</b></td>
                <td style="padding:10px; border-bottom:1px solid #eee;">${bookingData.name}</td>
              </tr>

              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;"><b>WhatsApp Number</b></td>
                <td style="padding:10px; border-bottom:1px solid #eee;">${bookingData.phone}</td>
              </tr>

              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;"><b>Email</b></td>
                <td style="padding:10px; border-bottom:1px solid #eee;">${bookingData.email}</td>
              </tr>

              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;"><b>Batch</b></td>
                <td style="padding:10px; border-bottom:1px solid #eee;">${bookingData.batch}</td>
              </tr>

              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;"><b>Payment Status</b></td>
                <td style="padding:10px; border-bottom:1px solid #eee; color:green;"><b>${bookingData.paymentStatus}</b></td>
              </tr>

              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;"><b>Amount Paid</b></td>
                <td style="padding:10px; border-bottom:1px solid #eee;">₹${bookingData.amount}</td>
              </tr>

              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;"><b>Original Price</b></td>
                <td style="padding:10px; border-bottom:1px solid #eee;">₹${bookingData.originalPrice}</td>
              </tr>

              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;"><b>Discount</b></td>
                <td style="padding:10px; border-bottom:1px solid #eee;">₹${bookingData.discount}</td>
              </tr>

              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;"><b>Razorpay Order ID</b></td>
                <td style="padding:10px; border-bottom:1px solid #eee;">${bookingData.razorpayOrderId}</td>
              </tr>

              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;"><b>Razorpay Payment ID</b></td>
                <td style="padding:10px; border-bottom:1px solid #eee;">${bookingData.razorpayPaymentId}</td>
              </tr>

              <tr>
                <td style="padding:10px;"><b>Booking Time</b></td>
                <td style="padding:10px;">${bookingData.createdAt}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;

    await sendMail({
      to: process.env.OWNER_EMAIL,
      subject: `New Paid Workshop Booking - ${bookingData.name}`,
      html: ownerMailHtml,
    });

    // CUSTOMER CONFIRMATION EMAIL
    if (bookingData.email) {
      const customerMailHtml = `
        <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:24px;">
          <div style="max-width:650px; margin:auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e5e5;">
            <div style="background:#05070d; color:#ffffff; padding:24px;">
              <h2 style="margin:0; color:#facc15;">Your Seat Is Reserved!</h2>
              <p style="margin:8px 0 0; color:#d1d5db;">Thank you for joining InnoBlend AI Live Meta Ads Workshop.</p>
            </div>

            <div style="padding:24px;">
              <p>Hi <b>${bookingData.name}</b>,</p>

              <p>Your payment has been received successfully and your workshop seat is confirmed.</p>

              <table style="width:100%; border-collapse:collapse; margin-top:16px;">
                <tr>
                  <td style="padding:10px; border-bottom:1px solid #eee;"><b>Batch</b></td>
                  <td style="padding:10px; border-bottom:1px solid #eee;">${bookingData.batch}</td>
                </tr>

                <tr>
                  <td style="padding:10px; border-bottom:1px solid #eee;"><b>Amount Paid</b></td>
                  <td style="padding:10px; border-bottom:1px solid #eee;">₹${bookingData.amount}</td>
                </tr>

                <tr>
                  <td style="padding:10px; border-bottom:1px solid #eee;"><b>Payment ID</b></td>
                  <td style="padding:10px; border-bottom:1px solid #eee;">${bookingData.razorpayPaymentId}</td>
                </tr>

                <tr>
                  <td style="padding:10px;"><b>Booking Time</b></td>
                  <td style="padding:10px;">${bookingData.createdAt}</td>
                </tr>
              </table>

              <p style="margin-top:22px;">
                Workshop joining details will be shared on your WhatsApp and email.
              </p>

              <p style="margin-top:20px;">
                Regards,<br/>
                <b>InnoBlend AI Team</b>
              </p>
            </div>
          </div>
        </div>
      `;

      await sendMail({
        to: bookingData.email,
        subject: "Your InnoBlend AI Workshop Seat Is Confirmed",
        html: customerMailHtml,
      });
    }

    return Response.json({
      success: true,
      message: "Payment verified and emails sent successfully",
      booking: bookingData,
    });
  } catch (error) {
    console.error("Payment verify error:", error);

    return Response.json(
      {
        success: false,
        message: "Payment verification error",
      },
      { status: 500 }
    );
  }
}