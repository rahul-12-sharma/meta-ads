export default function ThankYouPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#02040a] px-5 text-white">
            <div className="max-w-xl rounded-2xl border border-white/10 bg-[#0b1324] p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#ffbf24]/10 text-3xl">
                    ✅
                </div>

                <h1 className="font-display text-4xl font-black">
                    Your Seat Is Reserved!
                </h1>

                <p className="mt-4 text-sm leading-7 text-slate-400">
                    Payment successful. Your workshop joining details will be shared on
                    your email and WhatsApp number.
                </p>

                <a
                    href="/"
                    className="mt-8 inline-block rounded-lg bg-[#ffbf24] px-8 py-4 text-sm font-black text-black"
                >
                    Back To Home
                </a>
            </div>
        </main>
    );
}