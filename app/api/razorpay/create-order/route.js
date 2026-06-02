import Razorpay from "razorpay";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, email, batch } = body;

    if (!name || !phone || !email || !batch) {
      return Response.json(
        {
          success: false,
          message: "Missing user information",
        },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: 199 * 100,
      currency: "INR",
      receipt: `workshop_${Date.now()}`,
      notes: {
        name,
        phone,
        email,
        batch,
        product: "Live Meta Ads Workshop",
      },
    });

    return Response.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to create Razorpay order",
      },
      { status: 500 }
    );
  }
}