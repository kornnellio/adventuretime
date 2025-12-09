import { Resend } from 'resend';

// More detailed initialization with logging
const apiKey = process.env.RESEND_API_KEY;
console.log('Resend API Key available:', !!apiKey);
console.log('Resend API Key first 5 chars:', apiKey ? apiKey.substring(0, 5) : 'none');

// Verify we're using the correct API key format for Resend
if (!apiKey || !apiKey.startsWith('re_')) {
  console.error('WARNING: Resend API key does not start with "re_" which is the expected format');
}

// Initialize Resend
const resend = new Resend(apiKey);

// Check if the sendEmail function is already defined in the file
// If not, define a basic sendEmail function to handle email sending

// Helpers for email sending
const sendEmail = async ({ to, subject, text, html }: { 
  to: string;
  subject: string; 
  text: string; 
  html: string; 
}) => {
  if (!apiKey) {
    console.error('Resend API key is missing or undefined');
    return { success: false, error: 'API key is missing' };
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Adventure Time <no-reply@adventure-time.ro>',
      to,
      cc: 'office@adventuretime.ro',
      subject,
      text,
      html,
    });
    
    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Email service for sending transactional emails
 */
export const emailService = {
  /**
   * Send a welcome email to a newly registered user
   */
  async sendWelcomeEmail(
    name: string,
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Attempting to send welcome email to: ${email}`);
      
      // Debug the environment variables
      console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
      console.log('Using Resend API key:', !!process.env.RESEND_API_KEY);
      
      if (!apiKey) {
        console.error('Resend API key is missing or undefined');
        return { success: false, error: 'API key is missing' };
      }
      
      const { data, error } = await resend.emails.send({
        from: 'Adventure Time <no-reply@adventure-time.ro>',
        to: email,
        cc: ['office@adventuretime.ro'],
        subject: 'Bine ai venit la Adventure Time!',
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin-bottom: 10px;">Bine ai venit la Adventure Time!</h1>
              <div style="width: 100px; height: 4px; background: linear-gradient(to right, #3b82f6, #8b5cf6); margin: 0 auto;"></div>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">Salut ${name},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Bine ai venit la Adventure Time! Suntem încântați să te alături comunității noastre de aventurieri.</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Cu noul tău cont, poți:</p>
            
            <ul style="font-size: 16px; line-height: 1.6;">
              <li>Rezerva aventuri și experiențe captivante</li>
              <li>Gestiona rezervările și profilul tău</li>
              <li>Rămâne la curent cu cele mai noi oferte de aventură</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}" 
                 style="background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; display: inline-block;">
                Explorează Aventuri
              </a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">Dacă ai întrebări sau ai nevoie de asistență, nu ezita să contactezi echipa noastră de suport.</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Aventuri plăcute!</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Echipa Adventure Time</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #666; font-size: 12px;">
              <p>Adventure Time © ${new Date().getFullYear()}</p>
              <p>Acesta este un mesaj automat, te rugăm să nu răspunzi la acest email.</p>
            </div>
          </div>
        `,
      });

      console.log('Welcome email send response data:', data);
      console.log('Welcome email error if any:', error);

      if (error) {
        console.error('Error sending welcome email:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
      }

      console.log('Welcome email sent successfully!');
      return { success: true };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Unknown error type:', typeof error);
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * Send a password reset email with a reset link
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Attempting to send password reset email to: ${email}`);
      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`;
      console.log('Reset URL:', resetUrl);
      
      if (!apiKey) {
        console.error('Resend API key is missing or undefined');
        return { success: false, error: 'API key is missing' };
      }
      
      const { data, error } = await resend.emails.send({
        from: 'Adventure Time <no-reply@adventure-time.ro>',
        to: email,
        cc: ['office@adventuretime.ro'],
        subject: 'Resetare parolă Adventure Time',
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin-bottom: 10px;">Cerere de resetare parolă</h1>
              <div style="width: 100px; height: 4px; background: linear-gradient(to right, #3b82f6, #8b5cf6); margin: 0 auto;"></div>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">Salut,</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Am primit o cerere de resetare a parolei pentru contul tău Adventure Time. Dacă nu tu ai făcut această cerere, poți ignora acest email.</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Pentru a-ți reseta parola, apasă pe butonul de mai jos:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; display: inline-block;">
                Resetează Parola
              </a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">Acest link va expira în 1 oră din motive de securitate.</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Dacă întâmpini dificultăți la apăsarea butonului, copiază și lipește URL-ul de mai jos în browserul tău web:</p>
            
            <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">
              ${resetUrl}
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">Dacă nu tu ai solicitat resetarea parolei, te rugăm să ne anunți imediat contactând echipa de suport.</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Mulțumim,</p>
            <p style="font-size: 16px; line-height: 1.6;">Echipa Adventure Time</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #666; font-size: 12px;">
              <p>Adventure Time © ${new Date().getFullYear()}</p>
              <p>Acesta este un mesaj automat, te rugăm să nu răspunzi la acest email.</p>
            </div>
          </div>
        `,
      });

      console.log('Password reset email send response data:', data);
      console.log('Password reset email error if any:', error);

      if (error) {
        console.error('Error sending password reset email:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
      }

      console.log('Password reset email sent successfully!');
      return { success: true };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Unknown error type:', typeof error);
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * Send a reservation confirmation email
   */
  async sendReservationConfirmation(
    name: string,
    email: string,
    reservationDetails: {
      reservationId: string;
      adventureTitle: string;
      date: string;
      startTime?: string;
      location: string;
      participants: number;
      totalPrice: number;
      advancePayment?: number;
      status: string;
      comments?: string;
      // Add coupon information
      couponCode?: string;
      couponType?: 'percentage' | 'fixed';
      couponValue?: number;
      couponDiscount?: number;
      originalPrice?: number;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Attempting to send reservation confirmation email to: ${email}`);
      
      // Format the financial values
      const formatter = new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'RON',
      });
      const totalPrice = formatter.format(reservationDetails.totalPrice);
      const advancePayment = reservationDetails.advancePayment 
        ? formatter.format(reservationDetails.advancePayment) 
        : null;
      
      // Format coupon values if present
      const couponDiscount = reservationDetails.couponDiscount
        ? formatter.format(reservationDetails.couponDiscount)
        : null;
      const originalPrice = reservationDetails.originalPrice
        ? formatter.format(reservationDetails.originalPrice)
        : null;
      
      if (!apiKey) {
        console.error('Resend API key is missing or undefined');
        return { success: false, error: 'API key is missing' };
      }
      
      // Update URL to point to dashboard/bookings instead of a specific reservation
      const manageReservationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/bookings`;

      // Add coupon information to email if present
      const couponInfoHtml = reservationDetails.couponCode && couponDiscount ? `
        <div style="background-color: #f0fff4; border: 1px solid #c6f6d5; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h3 style="font-size: 16px; color: #38a169; margin-top: 0; margin-bottom: 10px;">Cupon aplicat</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
            <tr>
              <td style="padding: 5px 0; color: #2f855a; width: 40%;">Cod cupon:</td>
              <td style="padding: 5px 0; font-weight: 500;">${reservationDetails.couponCode}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #2f855a;">Tip discount:</td>
              <td style="padding: 5px 0; font-weight: 500;">${reservationDetails.couponType === 'percentage' ? 'Procentual' : 'Sumă fixă'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #2f855a;">Valoare discount:</td>
              <td style="padding: 5px 0; font-weight: 500;">${reservationDetails.couponType === 'percentage' ? `${reservationDetails.couponValue}%` : formatter.format(reservationDetails.couponValue || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #2f855a;">Discount aplicat:</td>
              <td style="padding: 5px 0; font-weight: 700; color: #38a169;">${couponDiscount}</td>
            </tr>
            ${originalPrice ? `
            <tr>
              <td style="padding: 5px 0; color: #2f855a;">Preț inițial:</td>
              <td style="padding: 5px 0; font-weight: 500; text-decoration: line-through;">${originalPrice}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      ` : '';
      
      const { data, error } = await resend.emails.send({
        from: 'Adventure Time <no-reply@adventure-time.ro>',
        to: email,
        cc: ['office@adventuretime.ro'],
        subject: 'Confirmare rezervare - Adventure Time',
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin-bottom: 10px;">Confirmare rezervare</h1>
              <div style="width: 100px; height: 4px; background: linear-gradient(to right, #3b82f6, #8b5cf6); margin: 0 auto;"></div>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">Salut ${name},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Îți mulțumim pentru rezervarea ta. Detaliile rezervării tale sunt mai jos:</p>
            
            <div style="background-color: #f5f7f9; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h2 style="font-size: 18px; color: #3b82f6; margin-top: 0;">Detalii rezervare</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 15px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 40%;">ID Rezervare:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.reservationId}</td>
                </tr>
                ${reservationDetails.comments ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Cerințe speciale sau comentarii:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.comments}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Aventură:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.adventureTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Data:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.date}</td>
                </tr>
                ${reservationDetails.startTime ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Ora începerii:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.startTime}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Locație:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.location}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Participanți:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.participants}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Preț total:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #3b82f6;">${totalPrice}</td>
                </tr>
                ${advancePayment ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Avans plătit:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #10b981;">${advancePayment}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Status:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500; ${
                    reservationDetails.status === 'confirmed' ? 'color: #10b981;' : 
                    reservationDetails.status === 'pending' ? 'color: #f59e0b;' : 
                    reservationDetails.status === 'awaiting confirmation' ? 'color: #f59e0b;' :
                    'color: #64748b;'
                  }">${
                    reservationDetails.status === 'confirmed' ? 'Confirmată' : 
                    reservationDetails.status === 'pending' ? 'În așteptare' : 
                    reservationDetails.status === 'awaiting confirmation' ? 'În așteptare confirmării' :
                    reservationDetails.status
                  }</td>
                </tr>
              </table>
            </div>
            
            ${couponInfoHtml}
            
            ${reservationDetails.status === 'pending' ? `
            <p style="font-size: 16px; line-height: 1.6; background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 10px 15px; margin: 20px 0; border-radius: 2px;">
              <strong style="color: #ef4444;">Important:</strong> Rezervarea ta nu este încă confirmată! Pentru a confirma rezervarea, trebuie să efectuezi plata avansului în contul tău. 
              <br><br>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/bookings" 
                 style="background-color: #ef4444; color: white; text-decoration: none; padding: 8px 15px; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 5px;">
                Plătește acum
              </a>
            </p>
            ` : ''}
            
            ${reservationDetails.status === 'awaiting confirmation' ? `
            <p style="font-size: 16px; line-height: 1.6; background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 10px 15px; margin: 20px 0; border-radius: 2px;">
              <strong>Notă:</strong> Rezervarea ta este în așteptarea confirmării. Vom verifica disponibilitatea și te vom contacta în curând pentru a confirma rezervarea.
            </p>
            ` : ''}
            
            <p style="font-size: 16px; line-height: 1.6;">Poți gestiona rezervarea ta din contul tău:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${manageReservationUrl}" 
                 style="background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; display: inline-block;">
                Gestionează Rezervarea
              </a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">Dacă ai întrebări sau ai nevoie de asistență, nu ezita să contactezi echipa noastră de suport.</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Așteptăm cu nerăbdare să te întâmpinăm la aventura noastră!</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Echipa Adventure Time</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #666; font-size: 12px;">
              <p>Adventure Time © ${new Date().getFullYear()}</p>
              <p>Acesta este un mesaj automat, te rugăm să nu răspunzi la acest email.</p>
            </div>
          </div>
        `,
      });

      console.log('Reservation confirmation email send response data:', data);
      console.log('Reservation confirmation email error if any:', error);

      if (error) {
        console.error('Error sending reservation confirmation email:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
      }

      console.log('Reservation confirmation email sent successfully!');
      return { success: true };
    } catch (error) {
      console.error('Failed to send reservation confirmation email:', error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Unknown error type:', typeof error);
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * Send a notification email when a reservation is updated or cancelled
   */
  async sendReservationChangeNotification(
    name: string,
    email: string,
    changeType: 'update' | 'cancellation',
    reservationDetails: {
      reservationId: string;
      adventureTitle: string;
      date?: string;
      endDate?: string;
      oldDate?: string;
      newDate?: string;
      startTime?: string;
      duration?: string;
      location?: string;
      meetingPoint?: string;
      difficulty?: string;
      oldLocation?: string;
      newLocation?: string;
      totalPrice?: number;
      oldTotalPrice?: number;
      newTotalPrice?: number;
      refundAmount?: number;
      cancellationReason?: string;
      advancePayment?: number;
      remainingPayment?: number;
      comments?: string;
      customFields?: {
        advancePaymentPercentage?: number;
        requirements?: string[];
        includedItems?: string[];
        excludedItems?: string[];
        equipmentNeeded?: string[];
        minimumAge?: number;
        minimumParticipants?: number;
        maximumParticipants?: number;
        [key: string]: any;
      };
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Attempting to send reservation ${changeType} notification email to: ${email}`);
      
      // Format financial values if present
      const formatter = new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'RON',
      });
      
      const totalPrice = reservationDetails.totalPrice 
        ? formatter.format(reservationDetails.totalPrice) 
        : null;
      
      const oldTotalPrice = reservationDetails.oldTotalPrice 
        ? formatter.format(reservationDetails.oldTotalPrice) 
        : null;
      
      const newTotalPrice = reservationDetails.newTotalPrice 
        ? formatter.format(reservationDetails.newTotalPrice) 
        : null;
      
      const refundAmount = reservationDetails.refundAmount 
        ? formatter.format(reservationDetails.refundAmount) 
        : null;
        
      const advancePayment = reservationDetails.advancePayment
        ? formatter.format(reservationDetails.advancePayment)
        : null;
        
      const remainingPayment = reservationDetails.remainingPayment
        ? formatter.format(reservationDetails.remainingPayment)
        : null;
      
      if (!apiKey) {
        console.error('Resend API key is missing or undefined');
        return { success: false, error: 'API key is missing' };
      }
      
      // Update URL to point to dashboard/bookings
      const manageReservationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/bookings`;
      
      let emailSubject = '';
      let emailHeading = '';
      let mainMessage = '';
      
      if (changeType === 'update') {
        emailSubject = 'Rezervarea ta a fost actualizată - Adventure Time';
        emailHeading = 'Actualizare rezervare';
        mainMessage = 'Rezervarea ta a fost confirmată și a fost actualizată în sistemul nostru. Detaliile actualizate sunt mai jos:';
      } else {
        emailSubject = 'Rezervarea ta a fost anulată - Adventure Time';
        emailHeading = 'Anulare rezervare';
        mainMessage = 'Rezervarea ta a fost anulată. Detaliile sunt mai jos:';
      }
      
      // Main content of the email with payment details for confirmed status updates
      let paymentInfoHtml = '';
      if (changeType === 'update' && advancePayment && remainingPayment && totalPrice) {
        const advancePaymentPercentage = reservationDetails.customFields?.advancePaymentPercentage;
        
        paymentInfoHtml = `
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #065f46; font-size: 16px;">Rezervare confirmată - Detalii plată</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="font-size: 16px; padding: 4px 0;">Preț total:</td>
                <td style="font-size: 16px; font-weight: bold; text-align: right;">${totalPrice}</td>
              </tr>
              ${advancePaymentPercentage ? `
              <tr>
                <td style="font-size: 16px; padding: 4px 0;">Procent avans:</td>
                <td style="font-size: 16px; font-weight: bold; text-align: right;">${advancePaymentPercentage}%</td>
              </tr>
              ` : ''}
              <tr>
                <td style="font-size: 16px; padding: 4px 0;">Avans plătit:</td>
                <td style="font-size: 16px; font-weight: bold; text-align: right; color: #10b981;">${advancePayment}</td>
              </tr>
              <tr>
                <td style="font-size: 16px; padding: 4px 0;">Rest de plată:</td>
                <td style="font-size: 16px; font-weight: bold; text-align: right; color: #f59e0b;">${remainingPayment}</td>
              </tr>
            </table>
          </div>
        `;
      }
      
      // Generate HTML for additional details if they exist
      let additionalDetailsHtml = '';
      const customFields = reservationDetails.customFields || {};
      
      // Requirements section
      if (customFields.requirements && customFields.requirements.length > 0) {
        additionalDetailsHtml += `
          <div style="background-color: #fffbeb; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="font-size: 16px; margin-top: 0; color: #92400e;">Cerințe pentru participare</h3>
            <ul style="margin-top: 10px; padding-left: 20px;">
              ${customFields.requirements.map((req: string) => `<li style="margin-bottom: 5px;">${req}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      // Equipment needed section
      if (customFields.equipmentNeeded && customFields.equipmentNeeded.length > 0) {
        additionalDetailsHtml += `
          <div style="background-color: #f0f9ff; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #0284c7;">
            <h3 style="font-size: 16px; margin-top: 0; color: #0369a1;">Echipament necesar</h3>
            <ul style="margin-top: 10px; padding-left: 20px;">
              ${customFields.equipmentNeeded.map((item: string) => `<li style="margin-bottom: 5px;">${item}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      // Included items section
      if (customFields.includedItems && customFields.includedItems.length > 0) {
        additionalDetailsHtml += `
          <div style="background-color: #f0fdf4; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <h3 style="font-size: 16px; margin-top: 0; color: #166534;">Ce este inclus</h3>
            <ul style="margin-top: 10px; padding-left: 20px;">
              ${customFields.includedItems.map((item: string) => `<li style="margin-bottom: 5px;">${item}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      // Excluded items section
      if (customFields.excludedItems && customFields.excludedItems.length > 0) {
        additionalDetailsHtml += `
          <div style="background-color: #fef2f2; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h3 style="font-size: 16px; margin-top: 0; color: #b91c1c;">Ce nu este inclus</h3>
            <ul style="margin-top: 10px; padding-left: 20px;">
              ${customFields.excludedItems.map((item: string) => `<li style="margin-bottom: 5px;">${item}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      // Participant information
      if (customFields.minimumAge || customFields.minimumParticipants || customFields.maximumParticipants) {
        additionalDetailsHtml += `
          <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #6b7280;">
            <h3 style="font-size: 16px; margin-top: 0; color: #4b5563;">Informații participanți</h3>
            <ul style="margin-top: 10px; padding-left: 20px;">
              ${customFields.minimumAge ? `<li style="margin-bottom: 5px;">Vârsta minimă: ${customFields.minimumAge} ani</li>` : ''}
              ${customFields.minimumParticipants ? `<li style="margin-bottom: 5px;">Număr minim de participanți: ${customFields.minimumParticipants}</li>` : ''}
              ${customFields.maximumParticipants ? `<li style="margin-bottom: 5px;">Număr maxim de participanți: ${customFields.maximumParticipants}</li>` : ''}
            </ul>
          </div>
        `;
      }
      
      const { data, error } = await resend.emails.send({
        from: 'Adventure Time <no-reply@adventure-time.ro>',
        to: email,
        cc: ['office@adventuretime.ro'],
        subject: emailSubject,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin-bottom: 10px;">${emailHeading}</h1>
              <div style="width: 100px; height: 4px; background: linear-gradient(to right, #3b82f6, #8b5cf6); margin: 0 auto;"></div>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">Salut ${name},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">${mainMessage}</p>
            
            ${paymentInfoHtml}
            
            <div style="background-color: #f5f7f9; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h2 style="font-size: 18px; color: #3b82f6; margin-top: 0;">Detalii rezervare</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 15px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 40%;">ID Rezervare:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.reservationId}</td>
                </tr>
                ${reservationDetails.comments ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Cerințe speciale sau comentarii:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.comments}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Aventură:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.adventureTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Data:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.date || reservationDetails.newDate || '-'}</td>
                </tr>
                ${reservationDetails.endDate ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Data de încheiere:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.endDate}</td>
                </tr>
                ` : ''}
                ${reservationDetails.startTime ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Ora de începere:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #10b981;">${reservationDetails.startTime}</td>
                </tr>
                ` : ''}
                ${reservationDetails.duration ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Durată:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #10b981;">${reservationDetails.duration}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Locația:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.location || reservationDetails.newLocation || '-'}</td>
                </tr>
                ${reservationDetails.meetingPoint ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Punct de întâlnire:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.meetingPoint}</td>
                </tr>
                ` : ''}
                ${reservationDetails.difficulty ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Dificultate:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${reservationDetails.difficulty.charAt(0).toUpperCase() + reservationDetails.difficulty.slice(1)}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <!-- Payment Details Section -->
            <div style="background-color: #f0f9ff; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h2 style="font-size: 18px; color: #0369a1; margin-top: 0;">Informații de plată</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 15px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0f2fe; color: #0369a1; width: 60%;">Preț total:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0f2fe; font-weight: 700; color: #0c4a6e; text-align: right;">${totalPrice}</td>
                </tr>
                ${reservationDetails.customFields?.advancePaymentPercentage ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0f2fe; color: #0369a1;">Procent avans:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0f2fe; font-weight: 700; color: #0369a1; text-align: right;">${reservationDetails.customFields.advancePaymentPercentage}%</td>
                </tr>
                ` : ''}
                ${advancePayment ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0f2fe; color: #0369a1;">Avans plătit:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e0f2fe; font-weight: 700; color: #047857; text-align: right;">${advancePayment}</td>
                </tr>
                ` : ''}
                ${remainingPayment ? `
                <tr>
                  <td style="padding: 8px 0; color: #0369a1;">Rest de plată la fața locului:</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #b91c1c; text-align: right;">${remainingPayment}</td>
                </tr>
                ` : ''}
              </table>
              
              ${remainingPayment ? `
              <div style="margin-top: 15px; padding: 10px; background-color: #fff8e1; border-radius: 4px; border-left: 3px solid #f59e0b;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Important:</strong> Diferența de ${remainingPayment} trebuie achitată în ziua aventurii.
                </p>
              </div>
              ` : ''}
              
              <div style="margin-top: 15px; padding: 12px; background-color: #ecfdf5; border-radius: 4px; border-left: 3px solid #10b981; font-size: 14px; color: #065f46;">
                <p style="margin: 0; margin-bottom: 5px;"><strong>Metode de plată acceptate pentru rest:</strong></p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 3px;">Numerar la locația evenimentului</li>
                  <li style="margin-bottom: 3px;">Card bancar (Visa, Mastercard)</li>
                  <li style="margin-bottom: 3px;">Transfer bancar înainte de eveniment</li>
                </ul>
              </div>
            </div>
            
            ${additionalDetailsHtml}
            
            <!-- Price Comparison (if applicable) -->
            ${(changeType === 'update' && oldTotalPrice && newTotalPrice) ? `
            <div style="background-color: #f7f7f7; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="font-size: 16px; margin-top: 0;">Modificare preț</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 15px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Preț inițial:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500; text-decoration: line-through;">${oldTotalPrice}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Preț nou:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: ${Number(reservationDetails.newTotalPrice) > Number(reservationDetails.oldTotalPrice) ? '#ef4444' : '#10b981'};">${newTotalPrice}</td>
                </tr>
              </table>
            </div>
            ` : ''}
            
            <!-- Cancellation Details (if applicable) -->
            ${(changeType === 'cancellation' && (refundAmount || reservationDetails.cancellationReason)) ? `
            <div style="background-color: #fee2e2; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="font-size: 16px; margin-top: 0; color: #b91c1c;">Detalii anulare</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 15px;">
                ${refundAmount ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #fecaca; color: #7f1d1d;">Sumă rambursată:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #fecaca; font-weight: 700; color: #10b981;">${refundAmount}</td>
                </tr>
                ` : ''}
                ${reservationDetails.cancellationReason ? `
                <tr>
                  <td style="padding: 8px 0; color: #7f1d1d;">Motiv anulare:</td>
                  <td style="padding: 8px 0; font-weight: 500;">${reservationDetails.cancellationReason}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            ` : ''}
            
            ${changeType === 'update' ? `
            <p style="font-size: 16px; line-height: 1.6;">Poți gestiona rezervarea ta din contul tău:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${manageReservationUrl}" 
                 style="background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; display: inline-block;">
                Gestionează Rezervarea
              </a>
            </div>
            ` : ''}
            
            ${(changeType === 'update' && remainingPayment) ? `
            <div style="background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #9a3412; font-size: 18px;">Informații importante despre plată</h3>
              <p style="margin-bottom: 10px; font-size: 16px; line-height: 1.5;">
                Rezervarea ta a fost acum <strong>confirmată</strong>. 
              </p>
              <ul style="margin: 0; padding-left: 20px; font-size: 16px; line-height: 1.5;">
                <li>Ai plătit un avans de <strong>${advancePayment}</strong></li>
                <li>Prețul total al aventurii este <strong>${totalPrice}</strong></li>
                <li>Mai ai de achitat <strong>${remainingPayment}</strong></li>
              </ul>
              <p style="margin-top: 10px; font-size: 16px; line-height: 1.5;">
                <strong>Important:</strong> Restul de plată se achită exclusiv la locația evenimentului, înainte de începerea aventurii.
              </p>
            </div>
            ` : ''}
            
            <p style="font-size: 16px; line-height: 1.6;">Dacă ai întrebări sau ai nevoie de asistență, nu ezita să contactezi echipa noastră de suport.</p>
            
            ${changeType === 'cancellation' ? `
            <p style="font-size: 16px; line-height: 1.6;">Sperăm să te alături nouă pentru o altă aventură în viitorul apropiat!</p>
            ` : `
            <p style="font-size: 16px; line-height: 1.6;">Așteptăm cu nerăbdare să te întâmpinăm la aventura noastră!</p>
            `}
            
            <p style="font-size: 16px; line-height: 1.6;">Echipa Adventure Time</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #666; font-size: 12px;">
              <p>Adventure Time © ${new Date().getFullYear()}</p>
              <p>Acesta este un mesaj automat, te rugăm să nu răspunzi la acest email.</p>
            </div>
          </div>
        `,
      });

      console.log(`Reservation ${changeType} notification email send response data:`, data);
      console.log(`Reservation ${changeType} notification email error if any:`, error);

      if (error) {
        console.error(`Error sending reservation ${changeType} notification email:`, JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
      }

      console.log(`Reservation ${changeType} notification email sent successfully!`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to send reservation ${changeType} notification email:`, error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Unknown error type:', typeof error);
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * Send a payment confirmation email
   */
  async sendPaymentConfirmation(name: string, email: string, paymentDetails: {
    orderId: string;
    adventureTitle: string;
    date: Date;
    amount: number;
    currency: string;
    transactionId: string;
    paymentMethod: string;
  }) {
    try {
      // Format date for display
      const formattedDate = new Date(paymentDetails.date).toLocaleDateString('ro-RO');
      
      const plainText = `
        Salut ${name},
        
        Îți mulțumim pentru plata pentru "${paymentDetails.adventureTitle}".
        
        Detalii Plată:
        - ID Comandă: ${paymentDetails.orderId}
        - Data: ${formattedDate}
        - Sumă Plătită: ${paymentDetails.amount} ${paymentDetails.currency}
        - Metodă de Plată: ${paymentDetails.paymentMethod}
        - ID Tranzacție: ${paymentDetails.transactionId}
        
        Plata ta a fost procesată cu succes. Vom verifica disponibilitatea locurilor și vei primi o confirmare în curând.
        
        Dacă ai întrebări, te rugăm să ne contactezi.
        
        Mulțumim,
        Echipa Adventure Time
      `;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4a5568;">Confirmare Plată</h2>
          <p>Salut ${name},</p>
          <p>Îți mulțumim pentru plata pentru <strong>"${paymentDetails.adventureTitle}"</strong>.</p>
          
          <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #4a5568; margin-top: 0;">Detalii Plată</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>ID Comandă:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${paymentDetails.orderId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Data:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Sumă Plătită:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${paymentDetails.amount} ${paymentDetails.currency}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Metodă de Plată:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${paymentDetails.paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>ID Tranzacție:</strong></td>
                <td style="padding: 8px 0;">${paymentDetails.transactionId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fff7ed; border: 1px solid #fdba74; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #c2410c; margin-top: 0;">În așteptarea confirmării</h3>
            <p style="margin-bottom: 0;">Plata ta a fost procesată cu succes. Rezervarea ta este acum în așteptarea confirmării. Vom verifica disponibilitatea locurilor și vei primi o confirmare finală în curând.</p>
          </div>
          
          <p>Poți vedea detaliile rezervării în panoul de control al contului tău.</p>
          
          <p>Dacă ai întrebări, te rugăm să ne contactezi.</p>
          
          <p style="margin-top: 30px;">Mulțumim,<br>Echipa Adventure Time</p>
        </div>
      `;
      
      await sendEmail({
        to: email,
        subject: `Confirmare Plată - ${paymentDetails.orderId}`,
        text: plainText,
        html: htmlContent
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error sending payment confirmation email:', error);
      return { success: false, error: 'Failed to send payment confirmation email' };
    }
  },
  
  /**
   * Send payment failed notification
   */
  async sendPaymentFailedNotification(name: string, email: string, paymentDetails: {
    orderId: string;
    adventureTitle: string;
    date: Date;
    failureReason: string;
    paymentRetryUrl: string;
  }) {
    try {
      // Format date for display
      const formattedDate = new Date(paymentDetails.date).toLocaleDateString('ro-RO');
      
      const plainText = `
        Salut ${name},
        
        Ne pare rău, dar nu am putut procesa plata ta pentru "${paymentDetails.adventureTitle}".
        
        Detalii Rezervare:
        - ID Comandă: ${paymentDetails.orderId}
        - Data: ${formattedDate}
        
        Motiv eșuare: ${paymentDetails.failureReason}
        
        Poți încerca din nou plata accesând: ${paymentDetails.paymentRetryUrl}
        
        Dacă continui să întâmpini probleme, te rugăm să ne contactezi pentru asistență.
        
        Mulțumim,
        Echipa Adventure Time
      `;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #e53e3e;">Plată Nereușită</h2>
          <p>Salut ${name},</p>
          <p>Ne pare rău, dar nu am putut procesa plata ta pentru <strong>"${paymentDetails.adventureTitle}"</strong>.</p>
          
          <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #4a5568; margin-top: 0;">Detalii Rezervare</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>ID Comandă:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${paymentDetails.orderId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Data:</strong></td>
                <td style="padding: 8px 0;">${formattedDate}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #c53030; margin-top: 0;">Motiv Eșuare</h3>
            <p style="margin-bottom: 0;">${paymentDetails.failureReason}</p>
          </div>
          
          <p>Poți încerca din nou plata apăsând butonul de mai jos:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentDetails.paymentRetryUrl}" style="background-color: #3182ce; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Încearcă Plata din Nou
            </a>
          </div>
          
          <p>Dacă continui să întâmpini probleme, te rugăm să ne contactezi pentru asistență.</p>
          
          <p style="margin-top: 30px;">Mulțumim,<br>Echipa Adventure Time</p>
        </div>
      `;
      
      await sendEmail({
        to: email,
        subject: `Plată Eșuată - ${paymentDetails.orderId}`,
        text: plainText,
        html: htmlContent
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error sending payment failed notification:', error);
      return { success: false, error: 'Failed to send payment failed notification' };
    }
  },

  /**
   * Send an email notification when an order status is updated
   */
  async sendOrderStatusUpdate(
    name: string,
    email: string,
    orderDetails: {
      orderId: string;
      status: string;
      statusMessage: string;
      products: any[];
      total: number;
      date: Date;
      startDate?: Date;
      endDate?: Date;
      details?: any;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Attempting to send order status update email to: ${email}`);
      
      // Format financial values
      const formatter = new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'RON',
      });
      
      const totalPrice = formatter.format(orderDetails.total);
      
      if (!apiKey) {
        console.error('Resend API key is missing or undefined');
        return { success: false, error: 'API key is missing' };
      }
      
      // URL to view the order
      const viewOrderUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/orders`;
      
      let emailSubject = 'Actualizare comandă - Adventure Time';
      let emailHeading = 'Comandă confirmată';
      
      const { data, error } = await resend.emails.send({
        from: 'Adventure Time <no-reply@adventure-time.ro>',
        to: email,
        cc: ['office@adventuretime.ro'],
        subject: emailSubject,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin-bottom: 10px;">${emailHeading}</h1>
              <div style="width: 100px; height: 4px; background: linear-gradient(to right, #3b82f6, #8b5cf6); margin: 0 auto;"></div>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">Salut ${name},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Comanda ta a fost confirmată și este acum în procesare.</p>
            
            ${orderDetails.statusMessage ? `
              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                ${orderDetails.statusMessage}
              </div>
            ` : ''}
            
            <div style="background-color: #f5f7f9; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h2 style="font-size: 18px; color: #3b82f6; margin-top: 0;">Detalii comandă</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 15px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 40%;">ID Comandă:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${orderDetails.orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Dată:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${new Date(orderDetails.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                ${orderDetails.endDate && new Date(orderDetails.endDate).toDateString() !== new Date(orderDetails.date).toDateString() ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Data de încheiere:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${new Date(orderDetails.endDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                ` : ''}
                ${orderDetails.details?.location ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Locație:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${orderDetails.details.location}</td>
                </tr>
                ` : ''}
                ${orderDetails.details?.meetingPoint ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Punct de întâlnire:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${orderDetails.details.meetingPoint}</td>
                </tr>
                ` : ''}
                ${orderDetails.details?.difficulty ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Dificultate:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${orderDetails.details.difficulty}</td>
                </tr>
                ` : ''}
                ${orderDetails.details?.duration?.value && orderDetails.details?.duration?.unit ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Durată:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${orderDetails.details.duration.value} ${orderDetails.details.duration.unit === 'hours' ? 'ore' : 'zile'}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Total:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${totalPrice}</td>
                </tr>
                ${orderDetails.details?.advancePaymentPercentage !== undefined ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Procent avans:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${orderDetails.details.advancePaymentPercentage}%</td>
                </tr>
                ` : ''}
                ${orderDetails.details?.remainingPayment !== undefined ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Rest de plată:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${formatter.format(orderDetails.details.remainingPayment)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Status:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">Confirmat</td>
                </tr>
              </table>
            </div>

            ${(orderDetails.details?.requirements && orderDetails.details.requirements.length > 0) || 
              (orderDetails.details?.includedItems && orderDetails.details.includedItems.length > 0) || 
              (orderDetails.details?.excludedItems && orderDetails.details.excludedItems.length > 0) || 
              (orderDetails.details?.equipmentNeeded && orderDetails.details.equipmentNeeded.length > 0) ? `
            <div style="background-color: #f5f7f9; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h2 style="font-size: 18px; color: #3b82f6; margin-top: 0;">Informații importante despre aventură</h2>
              
              ${orderDetails.details.requirements && orderDetails.details.requirements.length > 0 ? `
              <div style="margin-bottom: 15px;">
                <h3 style="font-size: 16px; color: #475569; margin-top: 15px; margin-bottom: 8px;">Cerințe</h3>
                <ul style="margin: 0; padding-left: 20px; color: #64748b;">
                  ${orderDetails.details.requirements.map((req: string) => `
                    <li style="margin-bottom: 5px;">${req}</li>
                  `).join('')}
                </ul>
              </div>
              ` : ''}
              
              ${orderDetails.details.includedItems && orderDetails.details.includedItems.length > 0 ? `
              <div style="margin-bottom: 15px;">
                <h3 style="font-size: 16px; color: #475569; margin-top: 15px; margin-bottom: 8px;">Ce este inclus</h3>
                <ul style="margin: 0; padding-left: 20px; color: #64748b;">
                  ${orderDetails.details.includedItems.map((item: string) => `
                    <li style="margin-bottom: 5px;">${item}</li>
                  `).join('')}
                </ul>
              </div>
              ` : ''}
              
              ${orderDetails.details.excludedItems && orderDetails.details.excludedItems.length > 0 ? `
              <div style="margin-bottom: 15px;">
                <h3 style="font-size: 16px; color: #475569; margin-top: 15px; margin-bottom: 8px;">Ce nu este inclus</h3>
                <ul style="margin: 0; padding-left: 20px; color: #64748b;">
                  ${orderDetails.details.excludedItems.map((item: string) => `
                    <li style="margin-bottom: 5px;">${item}</li>
                  `).join('')}
                </ul>
              </div>
              ` : ''}
              
              ${orderDetails.details.equipmentNeeded && orderDetails.details.equipmentNeeded.length > 0 ? `
              <div style="margin-bottom: 15px;">
                <h3 style="font-size: 16px; color: #475569; margin-top: 15px; margin-bottom: 8px;">Echipament necesar</h3>
                <ul style="margin: 0; padding-left: 20px; color: #64748b;">
                  ${orderDetails.details.equipmentNeeded.map((item: string) => `
                    <li style="margin-bottom: 5px;">${item}</li>
                  `).join('')}
                </ul>
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            <div style="background-color: #f5f7f9; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h2 style="font-size: 18px; color: #3b82f6; margin-top: 0;">Produse comandate</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 15px;">
                ${orderDetails.products.map(product => `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${product.name || product.title || 'Produs'}</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 500;">${formatter.format(product.price || 0)}</td>
                  </tr>
                  ${product.variation ? `
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;" colspan="2">${product.variation}</td>
                    </tr>
                  ` : ''}
                `).join('')}
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 700;">Total</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${totalPrice}</td>
                </tr>
              </table>
            </div>
            
            ${orderDetails.details?.remainingPayment !== undefined ? `
            <div style="background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #9a3412; font-size: 18px;">Informații importante despre plată</h3>
              <p style="margin-bottom: 10px; font-size: 16px; line-height: 1.5;">
                Mai ai de achitat suma de <strong>${formatter.format(orderDetails.details.remainingPayment)}</strong>.
              </p>
              <p style="margin-bottom: 0; font-size: 16px; line-height: 1.5;">
                <strong>Important:</strong> Restul de plată se achită exclusiv la locația evenimentului, înainte de începerea aventurii.
              </p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${viewOrderUrl}" 
                 style="background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; display: inline-block;">
                Vezi Comanda
              </a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">Pentru orice întrebări sau nelămuriri, te rugăm să ne contactezi.</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Îți mulțumim,</p>
            <p style="font-size: 16px; line-height: 1.6;">Echipa Adventure Time</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #666; font-size: 12px;">
              <p>Adventure Time © ${new Date().getFullYear()}</p>
              <p>Acesta este un mesaj automat, te rugăm să nu răspunzi la acest email.</p>
            </div>
          </div>
        `,
      });

      console.log('Order status update email send response data:', data);
      console.log('Order status update email error if any:', error);

      if (error) {
        console.error('Error sending order status update email:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
      }

      console.log('Order status update email sent successfully!');
      return { success: true };
    } catch (error) {
      console.error('Failed to send order status update email:', error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Unknown error type:', typeof error);
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  // Add this right before the 'sendOrderConfirmation' function
  /**
   * Debug helper - log the exact API call with important details
   */
  logApiCall(from: string, to: string | string[], subject: string) {
    console.log(`
========== EMAIL API CALL ==========
FROM: ${from}
TO: ${Array.isArray(to) ? to.join(', ') : to}
SUBJECT: ${subject}
API KEY: ${apiKey ? 'Present' : 'Missing'} (length: ${apiKey?.length || 0})
NODE_ENV: ${process.env.NODE_ENV}
====================================
`);
  },

  /**
   * Send a order confirmation email for the kayak booking system
   */
  async sendOrderConfirmation({
    to,
    username,
    orderDetails
  }: {
    to: string;
    username: string;
    orderDetails: {
      orderId: string;
      adventure: string;
      date: string;
      time?: string;
      items: string;
      total: number;
      advancePayment: number;
      remainingPayment: number;
      kayakSelections?: {
        caiacSingle: number;
        caiacDublu: number;
        placaSUP: number;
      };
      couponCode?: string;
      couponDiscount?: number;
    }
  }): Promise<{ success: boolean; error?: string }> {
    // Log all email sending parameters for debugging
    console.log(`Sending order confirmation email to: ${to}`);
    console.log(`Order details:`, JSON.stringify(orderDetails, null, 2));

    // Format currency for display
    const formatPrice = (amount: number) => {
      return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'RON',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    try {
      // For caiac selections display
      const caiacSingleHtml = orderDetails.kayakSelections?.caiacSingle ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="font-size: 15px;">Caiac single (${orderDetails.kayakSelections.caiacSingle}x):</span>
          <span style="font-size: 15px;">${formatPrice((orderDetails.total / ((orderDetails.kayakSelections?.caiacSingle || 0) + (orderDetails.kayakSelections?.placaSUP || 0) + ((orderDetails.kayakSelections?.caiacDublu || 0) * 2))) * orderDetails.kayakSelections.caiacSingle)}</span>
        </div>
      ` : '';

      const caiacDubluHtml = orderDetails.kayakSelections?.caiacDublu ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="font-size: 15px;">Caiac dublu (${orderDetails.kayakSelections.caiacDublu}x):</span>
          <span style="font-size: 15px;">${formatPrice((orderDetails.total / ((orderDetails.kayakSelections?.caiacSingle || 0) + (orderDetails.kayakSelections?.placaSUP || 0) + ((orderDetails.kayakSelections?.caiacDublu || 0) * 2))) * orderDetails.kayakSelections.caiacDublu * 2)}</span>
        </div>
      ` : '';

      const placaSUPHtml = orderDetails.kayakSelections?.placaSUP ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="font-size: 15px;">Placă SUP (${orderDetails.kayakSelections.placaSUP}x):</span>
          <span style="font-size: 15px;">${formatPrice((orderDetails.total / ((orderDetails.kayakSelections?.caiacSingle || 0) + (orderDetails.kayakSelections?.placaSUP || 0) + ((orderDetails.kayakSelections?.caiacDublu || 0) * 2))) * orderDetails.kayakSelections.placaSUP)}</span>
        </div>
      ` : '';

      // For coupon display
      const couponHtml = orderDetails.couponCode ? `
        <div style="margin-top: 12px; padding: 8px; background-color: #e6f7e6; border-radius: 4px; border-left: 3px solid #4caf50;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="font-size: 15px; font-weight: bold; color: #2e7d32;">Cupon aplicat:</span>
            <span style="font-size: 15px; font-weight: bold; color: #2e7d32;">${orderDetails.couponCode}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 15px; color: #2e7d32;">Discount:</span>
            <span style="font-size: 15px; color: #2e7d32;">-${formatPrice(orderDetails.couponDiscount || 0)}</span>
          </div>
        </div>
      ` : '';

      // Time display
      const timeHtml = orderDetails.time ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: bold;">Ora:</span>
          <span>${orderDetails.time}</span>
        </div>
      ` : '';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6; text-align: center;">Comanda ta a fost înregistrată cu succes!</h1>
          
          <div style="margin-bottom: 24px;">
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 16px;">
              Salut ${username},
            </p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 16px;">
              Îți mulțumim pentru rezervare! Comanda ta a fost înregistrată cu succes și este în curs de procesare.
              Iată un rezumat al comenzii tale:
            </p>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h2 style="font-size: 18px; font-weight: bold; margin: 0 0 12px 0;">Detalii comandă</h2>
              <div style="font-size: 16px; line-height: 1.6;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: bold;">Număr comandă:</span>
                  <span>${orderDetails.orderId}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: bold;">Aventură:</span>
                  <span>${orderDetails.adventure}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: bold;">Data:</span>
                  <span>${orderDetails.date}</span>
                </div>
                ${timeHtml}
                
                <h3 style="font-size: 16px; font-weight: bold; margin: 16px 0 8px 0;">Detalii rezervare</h3>
                
                ${caiacSingleHtml}
                ${caiacDubluHtml}
                ${placaSUPHtml}
                
                ${couponHtml}
                
                <div style="border-top: 1px solid #ddd; margin-top: 12px; padding-top: 12px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: bold;">Total:</span>
                    <span>${formatPrice(orderDetails.total)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: bold; color: #f59e0b;">Avans:</span>
                    <span style="color: #f59e0b;">${formatPrice(orderDetails.advancePayment)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: bold; color: #2563eb;">Rest de plată:</span>
                    <span style="color: #2563eb;">${formatPrice(orderDetails.remainingPayment)}</span>
                  </div>
                </div>
              </div>
            </div>

            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 16px;">
              <strong>Important:</strong> Pentru a confirma rezervarea ta, te rugăm să achiți avansul în valoare de ${formatPrice(orderDetails.advancePayment)} cât mai curând.
              Restul de ${formatPrice(orderDetails.remainingPayment)} se va achita la fața locului, în ziua aventurii.
            </p>

            <div style="background: #fff8e1; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
              <p style="font-size: 16px; line-height: 1.5; font-weight: bold; color: #b45309; margin: 0 0 8px 0;">
                Politica de anulare:
              </p>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5; color: #78350f;">
                <li>Anulare cu 7+ zile înainte: Rambursare 100% a avansului</li>
                <li>Anulare cu 3-7 zile înainte: Rambursare 50% a avansului</li>
                <li>Anulare cu mai puțin de 3 zile înainte: Avansul nu este rambursabil</li>
              </ul>
            </div>

            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 16px;">
              Poți găsi toate detaliile despre rezervarea ta în contul tău de pe Adventure Time. 
              Dacă ai întrebări sau ai nevoie de asistență, nu ezita să ne contactezi la adresa de email <a href="mailto:contact@adventure-time.ro" style="color: #2563eb;">contact@adventure-time.ro</a>.
            </p>

            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 8px;">
              Cu mulțumiri,
            </p>
            <p style="font-size: 16px; line-height: 1.5; font-weight: bold;">
              Echipa Adventure Time
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to,
        subject: `Confirmare Comandă: ${orderDetails.orderId}`,
        text: `Comanda ta a fost înregistrată cu succes! ${orderDetails.orderId}`,
        html: htmlContent
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send order confirmation email' };
    }
  },

  async sendVoucherCouponNotification(username: string, email: string, voucherDetails: {
    orderId: string;
    voucherAmount: number;
    couponCode: string;
    expiryDate: Date;
  }) {
    try {
      const expiryDate = voucherDetails.expiryDate.toLocaleDateString('ro-RO', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Voucherul tău AdventureTime</h2>
          <p>Salut ${username},</p>
          <p>Mulțumim pentru achiziționarea voucherului! Plata ta a fost procesată cu succes.</p>
          
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px dashed #007bff;">
            <h3 style="color: #007bff; margin-top: 0; text-align: center;">Codul tău voucher</h3>
            <p style="font-size: 24px; font-weight: bold; text-align: center; color: #007bff; letter-spacing: 2px;">
              ${voucherDetails.couponCode}
            </p>
            <p style="text-align: center; margin: 0;"><strong>Valoare:</strong> ${voucherDetails.voucherAmount} lei</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Detalii comandă</h3>
            <p><strong>Numărul comenzii:</strong> ${voucherDetails.orderId}</p>
            <p><strong>Valoare voucher:</strong> ${voucherDetails.voucherAmount} lei</p>
            <p><strong>Cod voucher:</strong> ${voucherDetails.couponCode}</p>
            <p><strong>Valabil până la:</strong> ${expiryDate}</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin-top: 0;">Cum folosesc voucherul?</h4>
            <ul style="color: #856404;">
              <li>Accesează site-ul nostru și alege aventura dorită</li>
              <li>La finalizarea rezervării, introdu codul <strong>${voucherDetails.couponCode}</strong></li>
              <li>Voucherul va fi aplicat automat la suma totală</li>
              <li>Voucherul poate fi folosit o singură dată</li>
            </ul>
          </div>
          
          <p>Îți mulțumim pentru încredere și te așteptăm la aventuri!</p>
          <p>Echipa AdventureTime.Ro</p>
        </div>
      `;

      await sendEmail({
        to: email,
        subject: `Voucherul tău AdventureTime - ${voucherDetails.voucherAmount} lei`,
        text: `Voucherul tău AdventureTime: ${voucherDetails.couponCode} - ${voucherDetails.voucherAmount} lei`,
        html: htmlContent
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending voucher coupon notification email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send voucher coupon notification email' };
    }
  },
}; 