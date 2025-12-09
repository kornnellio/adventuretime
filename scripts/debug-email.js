#!/usr/bin/env node

/**
 * Debug Email Script
 * 
 * This script tests email functionality outside of the application
 * to help troubleshoot email delivery issues.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { Resend } = require('resend');

// Log environment info
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RESEND_API_KEY defined:', !!process.env.RESEND_API_KEY);
console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.length : 0);

if (!process.env.RESEND_API_KEY) {
  console.error('Error: RESEND_API_KEY is not defined in your environment variables');
  process.exit(1);
}

// Initialize the Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Get email recipient from command line or use default
const recipient = process.argv[2] || 'office@adventuretime.ro';

async function main() {
  console.log(`Attempting to send test email to: ${recipient}`);
  
  try {
    // Send a simple test email
    const { data, error } = await resend.emails.send({
      from: 'Adventure Time <no-reply@adventure-time.ro>',
      to: recipient,
      subject: 'Test Email from Debug Script',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #3b82f6;">Email Test Successful</h1>
          <p>This is a test email sent from the debug-email.js script.</p>
          <p>If you're seeing this, email sending is working properly.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent successfully!');
      console.log('Email ID:', data.id);
    }
  } catch (error) {
    console.error('Exception occurred while sending email:');
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 