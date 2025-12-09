import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/email";
import { getCurrentUser } from "@/lib/session";
import { AUTHORIZED_EMAILS } from "@/middleware";

export async function GET(request: NextRequest) {
  try {
    // Get the current environment
    const isDevelopment = process.env.NODE_ENV === "development";
    const isProduction = process.env.NODE_ENV === "production";
    
    // Security check - only allow in development
    if (!isDevelopment) {
      return NextResponse.json(
        { error: "This endpoint is only available in development mode" },
        { status: 403 }
      );
    }

    // Get the current user for security
    const user = await getCurrentUser();
    if (!user || !user.email) {
      return NextResponse.json(
        { error: "Unauthorized - you must be logged in" },
        { status: 401 }
      );
    }

    // Only allow admin users in production (additional security)
    if (isProduction && !AUTHORIZED_EMAILS.includes(user.email)) {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 401 }
      );
    }

    console.log(`Sending test email to ${user.email}`);

    // Send a test email
    const result = await emailService.sendOrderConfirmation({
      to: user.email,
      username: `${user.name} ${user.surname || ""}`,
      orderDetails: {
        orderId: "TEST-1234",
        adventure: "Test Adventure",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        items: "1x Caiac Single, 1x Caiac Dublu",
        total: 350,
        advancePayment: 100,
        remainingPayment: 250,
      },
    });

    // Log the result for debugging
    console.log("Email send result:", result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${user.email}`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 