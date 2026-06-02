import nodemailer from "nodemailer";

export async function sendMail({ to, subject, html }) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_APP_PASSWORD,
            },
        });

        const info = await transporter.sendMail({
            from: `"InnoBlend AI" <${process.env.MAIL_USER}>`,
            to,
            subject,
            html,
        });

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error("Email send error:", error);

        return {
            success: false,
            error: error.message,
        };
    }
}