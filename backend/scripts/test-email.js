import { sendEmail } from "../src/utils/email.js";
import { env } from "../src/config/env.js";

(async () => {
  try {
    const to = env.ADMIN_NOTIFICATION_EMAIL || env.SUPPORT_EMAIL;
    if (!to) {
      throw new Error("Set ADMIN_NOTIFICATION_EMAIL or SUPPORT_EMAIL in .env before running this test.");
    }

    await sendEmail({
      to,
      subject: "Visual Verse Store — Test Email",
      text: "This is a test email from Visual Verse Store backend.",
      html: "<p>This is a <strong>test</strong> email from Visual Verse Store backend.</p>",
    });

    console.log("Test email sent to:", to);
    process.exit(0);
  } catch (e) {
    console.error("Send failed:", e);
    process.exit(1);
  }
})();
