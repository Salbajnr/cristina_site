import nodemailer from "nodemailer";
import { logger } from "./logger";

const ADMIN_EMAIL = "dogtrainer_cristina@outlook.com";

// Create transporter
const transporter = nodemailer.createTransport({
  service: "outlook",
  auth: {
    user: process.env.EMAIL_USER || ADMIN_EMAIL,
    pass: process.env.EMAIL_PASSWORD || "",
  },
});

export async function sendPurchaseConfirmation(
  customerEmail: string,
  customerName: string,
  contentTitle: string,
  amount: number,
  contentId: number,
  purchaseId: number
) {
  try {
    const accessLink = `${process.env.APP_URL || "http://localhost:5173"}/purchases/${purchaseId}`;
    
    await transporter.sendMail({
      from: ADMIN_EMAIL,
      to: customerEmail,
      subject: `Your Purchase: ${contentTitle}`,
      html: `
        <h2>Purchase Confirmed!</h2>
        <p>Hi ${customerName},</p>
        <p>Thank you for your purchase of <strong>${contentTitle}</strong> for $${amount.toFixed(2)}.</p>
        <p><a href="${accessLink}" style="background-color: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Your Purchase</a></p>
        <p>If you have any questions, please reply to this email or contact us at ${ADMIN_EMAIL}.</p>
      `,
    });
    
    logger.info(`Purchase confirmation sent to ${customerEmail}`);
  } catch (error) {
    logger.error("Failed to send purchase confirmation email:", error);
    throw error;
  }
}

export async function sendInquiryReply(
  visitorEmail: string,
  visitorName: string,
  replyMessage: string
) {
  try {
    await transporter.sendMail({
      from: ADMIN_EMAIL,
      to: visitorEmail,
      subject: "Re: Your Inquiry",
      html: `
        <h2>We've Replied to Your Inquiry</h2>
        <p>Hi ${visitorName},</p>
        <p>Cristina has replied to your inquiry:</p>
        <p>${replyMessage}</p>
        <p>Best regards,<br>Cristina Lucero</p>
      `,
    });
    
    logger.info(`Inquiry reply sent to ${visitorEmail}`);
  } catch (error) {
    logger.error("Failed to send inquiry reply email:", error);
    throw error;
  }
}

export async function sendNewInquiryNotification(
  visitorName: string,
  visitorEmail: string,
  message: string
) {
  try {
    await transporter.sendMail({
      from: ADMIN_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Inquiry from ${visitorName}`,
      html: `
        <h2>New Inquiry Received</h2>
        <p><strong>From:</strong> ${visitorName} (${visitorEmail})</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });
    
    logger.info(`New inquiry notification sent to ${ADMIN_EMAIL}`);
  } catch (error) {
    logger.error("Failed to send inquiry notification email:", error);
  }
}
