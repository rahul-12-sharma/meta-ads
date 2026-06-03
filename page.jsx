"use client";

import { useEffect, useState } from "react";

const OFFER = {
  price: 199,
  originalPrice: 999,
  saving: 800,
  seatsLeft: 2,
};

const images = {
  hero:
    "https://assets.seobotai.com/cdn-cgi/image/quality=75,w=1536,h=1024/adenslab.com/68eca0e0d96b3d41f695c8a0-1760339784731.jpg",
  dashboard:
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=85",
  creative:
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1400&q=85",
  mentor:
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=85",
  strategy:
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=85",
  growth:
    "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1400&q=85",
};

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function WorkshopLandingPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [isPaying, setIsPaying] = useState(false);

  const [userInfo, setUserInfo] = useState({
    name: "",
    phone: "",
    email: "",
    batch: "",
  });

  const [timeLeft, setTimeLeft] = useState({
    hours: 1,
    minutes: 54,
    seconds: 30,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;

          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;

            if (hours > 0) {
              hours--;
            } else {
              hours = 1;
              minutes = 54;
              seconds = 30;
            }
          }
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (field, value) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const selectBatch = (batch) => {
    setUserInfo((prev) => ({
      ...prev,
      batch,
    }));

    document.getElementById("reserve")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const validateForm = () => {
    if (!userInfo.name.trim()) {
      alert("Please enter your full name.");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(userInfo.phone.trim())) {
      alert("Please enter a valid 10 digit Indian mobile number.");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(userInfo.email.trim())) {
      alert("Please enter a valid email address.");
      return false;
    }

    if (!userInfo.batch) {
      alert("Please select your preferred time slot.");
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        value: OFFER.price,
        currency: "INR",
        content_name: "Live Meta Ads Workshop",
      });

      window.fbq("track", "Lead", {
        content_name: "Workshop Registration Form",
      });
    }

    setIsPaying(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        alert("Razorpay failed to load. Please check your internet connection.");
        setIsPaying(false);
        return;
      }

      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userInfo),
      });

      const orderData = await orderResponse.json();

      console.log("Create order response:", orderData);

      if (!orderData.success || !orderData.order?.id) {
        alert(orderData.message || "Unable to create payment order.");
        setIsPaying(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "InnoBlend AI",
        description: "Live Meta Ads Workshop",
        order_id: orderData.order.id,

        prefill: {
          name: userInfo.name,
          email: userInfo.email,
          contact: userInfo.phone,
        },

        theme: {
          color: "#facc15",
        },

        handler: async function (response) {
          console.log("Razorpay success response:", response);

          if (
            !response.razorpay_order_id ||
            !response.razorpay_payment_id ||
            !response.razorpay_signature
          ) {
            alert("Payment details missing from Razorpay response.");
            setIsPaying(false);
            return;
          }

          const verifyResponse = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user: userInfo,
            }),
          });

          const verifyData = await verifyResponse.json();

          console.log("Verify payment response:", verifyData);

          if (verifyData.success) {
            if (typeof window !== "undefined" && window.fbq) {
              window.fbq("track", "Purchase", {
                value: 199,
                currency: "INR",
                content_name: "Live Meta Ads Workshop",
              });
            }

            alert("Payment successful! Your seat is reserved.");
            window.location.href = "/thank-you";
          } else {
            alert(verifyData.message || "Payment verification failed.");
          }

          setIsPaying(false);
        },

        modal: {
          ondismiss: function () {
            setIsPaying(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong. Please try again.");
      setIsPaying(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070d] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_34%),linear-gradient(to_bottom,#05070d,#080b14)]" />

      {/* NAVBAR */}
      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#05070d]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a href="#" className="text-base font-black tracking-tight">
            Inno<span className="text-yellow-400">Blend</span> AI
          </a>

          <nav className="hidden items-center gap-8 text-xs font-bold text-slate-300 md:flex">
            <a href="#learn" className="hover:text-yellow-400">
              Learn
            </a>
            <a href="#schedule" className="hover:text-yellow-400">
              Schedule
            </a>
            <a href="#reserve" className="hover:text-yellow-400">
              Register
            </a>
            <a href="#faq" className="hover:text-yellow-400">
              FAQ
            </a>
          </nav>

          <a
            href="#reserve"
            className="rounded-full bg-yellow-400 px-5 py-2.5 text-xs font-black text-black shadow-[0_0_35px_rgba(250,204,21,0.35)] transition hover:scale-105"
          >
            Reserve Seat
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 px-5 pb-16 pt-32 md:pb-24 md:pt-40">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[0.92fr_1.08fr]">
          <div className="text-center md:text-left">
            <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300 md:mx-0">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Only {OFFER.seatsLeft} Seats Left
            </div>

            <h1 className="font-display text-4xl font-black leading-[1.02] tracking-tight md:text-7xl">
              MASTER META ADS &{" "}
              <span className="text-yellow-400">LEARN HOW TO GENERATE LEADS</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-slate-400 md:text-base">
              Join our live 1-hour workshop and learn the proven Meta Ads framework used by businesses to generate leads and grow revenue.
            </p>

            <div className="mt-7 max-w-xl rounded-[1.8rem] border border-yellow-400/25 bg-yellow-400/10 p-5 shadow-[0_0_55px_rgba(250,204,21,0.12)]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-300">
                    Today Special Price
                  </p>

                  <div className="mt-2 flex items-end justify-center gap-3 md:justify-start">
                    <span className="text-2xl font-black text-slate-500 line-through md:text-3xl">
                      ₹{OFFER.originalPrice}
                    </span>
                    <span className="text-5xl font-black leading-none text-yellow-400 md:text-6xl">
                      ₹{OFFER.price}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-center">
                  <p className="text-3xl font-black text-red-400">
                    {OFFER.seatsLeft}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-red-200">
                    Seats Left
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-bold leading-6 text-yellow-100">
                Save ₹{OFFER.saving} today. Registration may close after these
                seats are filled.
              </p>
            </div>

            <div className="mt-7 flex flex-col items-center gap-4 sm:flex-row">
              <a
                href="#reserve"
                className="rounded-full bg-yellow-400 px-8 py-4 text-sm font-black text-black shadow-[0_0_45px_rgba(250,204,21,0.45)] transition hover:scale-105"
              >
                🚀 Claim My ₹{OFFER.price} Seat
              </a>

              <a
                href="#learn"
                className="rounded-full border border-white/15 bg-white/5 px-8 py-4 text-sm font-black text-white transition hover:border-yellow-400/60"
              >
                See What You’ll Learn
              </a>
            </div>

            <div className="mt-7 grid max-w-xl grid-cols-3 gap-3">
              {[
                [`₹${OFFER.saving}`, "Saving"],
                ["Live", "Workshop"],
                [`${OFFER.seatsLeft}`, "Seats Left"],
              ].map(([big, small]) => (
                <div
                  key={small}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <h3 className="text-2xl font-black text-yellow-400">{big}</h3>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">
                    {small}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-yellow-400/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-white/5 shadow-2xl">
              <img
                src={images.hero}
                alt="Meta Ads workshop"
                className="h-[440px] w-full rounded-[1.7rem] object-cover md:h-[590px]"
              />

              <div className="absolute inset-0 rounded-[2.2rem] bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

              <div className="absolute left-6 top-6 rounded-full bg-red-500 px-4 py-2 text-xs font-black text-white shadow-[0_0_25px_rgba(239,68,68,0.45)]">
                Only {OFFER.seatsLeft} Seats Left
              </div>

              <div className="absolute right-6 top-6 rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-xl">
                <p className="text-xs font-bold text-slate-300">Lead Growth</p>
                <h3 className="mt-1 text-3xl font-black text-green-400">
                  3.8X
                </h3>
              </div>

              <div className="absolute bottom-7 left-7 right-7">
                <h2 className="max-w-md text-3xl font-black leading-tight md:text-4xl">
                  Build ads people notice, trust and click.
                </h2>

                <div className="mt-5 flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-black/60 px-5 py-4 backdrop-blur-xl">
                  <span className="text-xl font-black text-slate-500 line-through">
                    ₹{OFFER.originalPrice}
                  </span>
                  <span className="text-4xl font-black text-yellow-400">
                    ₹{OFFER.price}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="relative z-10 px-5 py-6">
        <div className="mx-auto grid max-w-7xl gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 md:grid-cols-4">
          {[
            "Live Practical Training",
            "Beginner Friendly",
            "Bonus Templates Included",
            "Secure Razorpay Payment",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-black/20 px-4 py-3 text-center text-xs font-black text-slate-300"
            >
              <span className="mr-2 text-yellow-400">✓</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* LEARN */}
      <section id="learn" className="relative z-10 px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            label="What You Get"
            title={
              <>
                Learn Ads That{" "}
                <span className="text-yellow-400">Bring Buyers</span>
              </>
            }
            subtitle="Short. Practical. Result-focused."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {featureCards.map((card) => (
              <ImageCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA SPLIT */}
      <section className="relative z-10 px-5 py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1322] p-5 md:grid-cols-2 md:p-8">
          <div className="overflow-hidden rounded-[1.5rem]">
            <img
              src={images.dashboard}
              alt="Marketing dashboard"
              className="h-[360px] w-full object-cover md:h-[440px]"
            />
          </div>

          <div className="p-2 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
              No More Random Boosting
            </p>

            <h2 className="font-display mt-4 text-3xl font-black leading-tight md:text-5xl">
              Turn ad spend into enquiries.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Learn what to target, what to show and what to say — so your ads
              push people to take action.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Better targeting",
                "Strong creatives",
                "Lead-focused setup",
                "Simple scaling",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold"
                >
                  <span className="mr-2 text-yellow-400">✓</span>
                  {item}
                </div>
              ))}
            </div>

            <a
              href="#reserve"
              className="mt-8 inline-block rounded-full bg-yellow-400 px-8 py-4 text-sm font-black text-black shadow-[0_0_40px_rgba(250,204,21,0.35)] transition hover:scale-105"
            >
              🔥 Build My Lead Machine
            </a>
          </div>
        </div>
      </section>

      {/* MENTOR */}
      <section className="relative z-10 px-5 py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-[0.85fr_1.15fr]">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-3">
            <img
              src={images.mentor}
              alt="Live mentor"
              className="h-[420px] w-full rounded-[1.5rem] object-cover"
            />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
              Why Join Now
            </p>

            <h2 className="font-display mt-4 text-3xl font-black leading-tight md:text-5xl">
              One right campaign can pay for this workshop.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Don’t pay Meta to show your ad to everyone. Learn how to bring
              the right buyer closer to your offer.
            </p>

            <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5">
              <p className="text-lg font-black leading-8 text-yellow-200">
                Your competitors are already collecting leads. Don’t let your
                budget keep working against you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SCHEDULE */}
      <section id="schedule" className="relative z-10 px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            label="Pick Your Batch"
            title={
              <>
                Limited <span className="text-yellow-400">Live Seats</span>
              </>
            }
            subtitle={`Only ${OFFER.seatsLeft} seats left for today's offer.`}
          />

          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-3">
            {batches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                selected={userInfo.batch === batch.id}
                onSelect={() => selectBatch(batch.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* BONUSES */}
      <section className="relative z-10 px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            label="Free Bonuses"
            title={
              <>
                Get Bonuses Worth{" "}
                <span className="text-yellow-400">₹999</span>
              </>
            }
          />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {bonuses.map((bonus) => (
              <ImageCard key={bonus.title} {...bonus} />
            ))}
          </div>
        </div>
      </section>

      {/* RESERVE */}
      <section id="reserve" className="relative z-10 px-5 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1322]">
            <div className="relative h-60">
              <img
                src={images.strategy}
                alt="Register workshop"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1322] via-[#0d1322]/30 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
                  Registration
                </p>
                <h2 className="font-display mt-2 text-3xl font-black">
                  Reserve your seat
                </h2>
              </div>

              <div className="absolute right-5 top-5 rounded-full bg-red-500 px-4 py-2 text-xs font-black text-white">
                {OFFER.seatsLeft} Seats Left
              </div>
            </div>

            <form className="p-5 md:p-7">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={userInfo.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />

              <Input
                label="WhatsApp Number"
                placeholder="Enter 10 digit mobile number"
                value={userInfo.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />

              <Input
                label="Email Address"
                placeholder="Enter your email"
                type="email"
                value={userInfo.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />

              <label className="mb-2 block text-xs font-bold text-slate-300">
                Preferred Time Slot
              </label>

              <select
                value={userInfo.batch}
                onChange={(e) => handleChange("batch", e.target.value)}
                className="mb-5 w-full rounded-xl border border-white/10 bg-[#121d31] px-4 py-3 text-sm text-slate-300 outline-none focus:border-yellow-400"
              >
                <option value="">Select a time slot</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.id}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handlePayment}
                disabled={isPaying}
                className="w-full rounded-full bg-yellow-400 py-4 text-sm font-black text-black shadow-[0_0_40px_rgba(250,204,21,0.4)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPaying
                  ? "Processing..."
                  : `🚀 Reserve My ₹${OFFER.price} Seat`}
              </button>
            </form>
          </div>

          <div className="sticky top-24 rounded-[2rem] border border-white/10 bg-[#0d1322] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-black">Order Summary</h3>

              <span className="rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-black text-red-300">
                {OFFER.seatsLeft} LEFT
              </span>
            </div>

            <div className="space-y-3">
              <SummaryLine text="Live workshop access" />
              <SummaryLine text="Meta Ads framework" />
              <SummaryLine text="Free bonuses included" />
            </div>

            {userInfo.batch && (
              <div className="mt-5 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-xs font-bold text-yellow-200">
                Selected: {userInfo.batch}
              </div>
            )}

            <div className="my-6 h-px bg-white/10" />

            <div className="flex justify-between text-sm text-slate-400">
              <span>Original Price</span>
              <span className="line-through">₹{OFFER.originalPrice}</span>
            </div>

            <div className="mt-3 flex justify-between text-sm text-green-400">
              <span>Today Discount</span>
              <span>-₹{OFFER.saving}</span>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <span className="text-sm font-bold">Pay Today</span>
              <div className="text-right">
                <p className="text-sm font-black text-slate-500 line-through">
                  ₹{OFFER.originalPrice}
                </p>
                <p className="text-5xl font-black leading-none text-yellow-400">
                  ₹{OFFER.price}
                </p>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={isPaying}
              className="mt-6 w-full rounded-full bg-yellow-400 py-4 text-sm font-black text-black shadow-[0_0_40px_rgba(250,204,21,0.4)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPaying ? "Processing..." : "🔥 Unlock Workshop Access"}
            </button>

            <p className="mt-4 text-center text-xs text-slate-500">
              🔒 Secure Payment • UPI / Card / Net Banking
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <TimerBox value={timeLeft.hours} label="Hours" />
              <TimerBox value={timeLeft.minutes} label="Min" />
              <TimerBox value={timeLeft.seconds} label="Sec" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <SectionTitle
            label="FAQ"
            title={
              <>
                Common <span className="text-yellow-400">Questions</span>
              </>
            }
          />

          <div className="mt-10 space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1322]"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-black"
                >
                  {faq.q}
                  <span className="text-yellow-400">
                    {openFaq === index ? "−" : "+"}
                  </span>
                </button>

                {openFaq === index && (
                  <p className="border-t border-white/10 px-5 py-4 text-sm leading-7 text-slate-400">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 px-5 py-24 text-center">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-[#0d1322] p-8 md:p-12">
          <p className="mx-auto mb-4 w-fit rounded-full bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
            Only {OFFER.seatsLeft} Seats Left
          </p>

          <h2 className="font-display text-3xl font-black leading-tight md:text-5xl">
            Don’t let another campaign burn your budget.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">
            Learn the system. Apply the structure. Start running ads with
            confidence.
          </p>

          <a
            href="#reserve"
            className="mt-8 inline-block rounded-full bg-yellow-400 px-8 py-4 text-sm font-black text-black shadow-[0_0_40px_rgba(250,204,21,0.4)] transition hover:scale-105"
          >
            🔥 Claim My ₹{OFFER.price} Seat
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p className="font-black text-white">
            Inno<span className="text-yellow-400">Blend</span> AI
          </p>

          <div className="flex gap-5">
            <a href="#" className="hover:text-yellow-400">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-yellow-400">
              Terms
            </a>
            <a href="#" className="hover:text-yellow-400">
              Refund
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionTitle({ label, title, subtitle }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-400">
        {label}
      </p>

      <h2 className="font-display mt-3 text-3xl font-black leading-tight md:text-5xl">
        {title}
      </h2>

      {subtitle && (
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ImageCard({ title, desc, image }) {
  return (
    <div className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0d1322] shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
      <div className="relative h-72 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

        <div className="absolute bottom-5 left-5 right-5">
          <h3 className="text-2xl font-black">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function BatchCard({ batch, selected, onSelect }) {
  return (
    <div
      className={`rounded-2xl border p-5 transition hover:-translate-y-1 ${selected
        ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_40px_rgba(250,204,21,0.16)]"
        : "border-white/10 bg-[#0d1322]"
        }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/10 text-2xl">
          🕒
        </div>

        {selected && (
          <span className="rounded-full bg-yellow-400 px-3 py-1 text-[10px] font-black text-black">
            Selected
          </span>
        )}
      </div>

      <h3 className="text-xl font-black">{batch.title}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-400">{batch.time}</p>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-yellow-400"
          style={{ width: batch.width }}
        />
      </div>

      <p className="mt-3 text-xs font-bold text-slate-400">
        {batch.filled} seats filled
      </p>

      <button
        onClick={onSelect}
        className="mt-5 w-full rounded-full bg-white/10 py-3 text-xs font-black text-white transition hover:bg-yellow-400 hover:text-black"
      >
        Select Batch
      </button>
    </div>
  );
}

function Input({ label, placeholder, type = "text", value, onChange }) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-xs font-bold text-slate-300">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-[#121d31] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-yellow-400"
      />
    </div>
  );
}

function SummaryLine({ text }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
      <span className="text-yellow-400">✓</span>
      {text}
    </div>
  );
}

function TimerBox({ value, label }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-4 text-center">
      <h3 className="text-xl font-black text-yellow-400">
        {String(value).padStart(2, "0")}
      </h3>
      <p className="mt-1 text-[10px] font-bold text-slate-500">{label}</p>
    </div>
  );
}

const featureCards = [
  {
    title: "Target Better",
    desc: "Reach buyers, not random scrollers.",
    image: images.strategy,
  },
  {
    title: "Create Desire",
    desc: "Make your offer impossible to ignore.",
    image: images.creative,
  },
  {
    title: "Scale Winners",
    desc: "Spend more only where results are visible.",
    image: images.dashboard,
  },
];

const bonuses = [
  {
    title: "Ads Cheat Sheet",
    desc: "Quick setup guide for your next campaign.",
    image: images.dashboard,
  },
  {
    title: "Launch Checklist",
    desc: "Avoid costly mistakes before going live.",
    image: images.strategy,
  },
  {
    title: "Copy Templates",
    desc: "Hooks, desire lines and strong CTA examples.",
    image: images.growth,
  },
];

const batches = [
  {
    id: "Morning Batch - 10:00 AM",
    title: "Morning Batch",
    time: "10:00 AM",
    filled: "32/50",
    width: "64%",
  },
  {
    id: "Afternoon Batch - 3:00 PM",
    title: "Afternoon Batch",
    time: "3:00 PM",
    filled: "36/50",
    width: "72%",
  },
  {
    id: "Evening Batch - 8:00 PM",
    title: "Evening Batch",
    time: "8:00 PM",
    filled: "48/50",
    width: "96%",
  },
];

const faqs = [
  {
    q: "Is this beginner friendly?",
    a: "Yes. You will learn the basics and practical setup in a simple way.",
  },
  {
    q: "Will this be live?",
    a: "Yes. It is a live practical workshop with clear examples.",
  },
  {
    q: "Do I need ad experience?",
    a: "No. This is suitable for beginners, business owners and creators.",
  },
  {
    q: "How will I get joining details?",
    a: "After payment, details will be shared on your email and WhatsApp.",
  },
];