import nodemailer from 'nodemailer';
import { TokenWithDetails } from '@shared/schema';

// Create a test account if no SMTP credentials are provided
const createTestAccount = async () => {
  const testAccount = await nodemailer.createTestAccount();
  return {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  };
};

// Get email configuration from environment variables or use test account
const getEmailConfig = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };
  }
  
  return await createTestAccount();
};

// Create transporter
let transporter: nodemailer.Transporter | null = null;

const initializeTransporter = async () => {
  if (!transporter) {
    const config = await getEmailConfig();
    transporter = nodemailer.createTransport(config);
  }
  return transporter;
};

// Send registration confirmation email
export const sendRegistrationEmail = async (token: TokenWithDetails): Promise<boolean> => {
  try {
    const transport = await initializeTransporter();
    
    const message = {
      from: process.env.EMAIL_FROM || 'noreply@airoadshow.com',
      to: token.participant.email,
      subject: `AI Roadshow: Your Token ${token.tokenNumber} has been generated`,
      text: `
Hello ${token.participant.name},

Thank you for registering for the AI Roadshow. Your token has been generated successfully.

Token Number: ${token.tokenNumber}
Booth: ${token.boothName}
Queue Position: ${token.queuePosition || 'N/A'}
Estimated Wait Time: ${token.estimatedWaitTime || 'N/A'}

You can track your token status on our dashboard.

Thank you,
AI Roadshow Team
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <h2 style="color: #4F46E5;">AI Roadshow: Token Confirmation</h2>
  <p>Hello ${token.participant.name},</p>
  <p>Thank you for registering for the AI Roadshow. Your token has been generated successfully.</p>
  
  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Token Number:</strong> <span style="background-color: #4F46E5; color: white; padding: 3px 8px; border-radius: 3px;">${token.tokenNumber}</span></p>
    <p style="margin: 5px 0;"><strong>Booth:</strong> ${token.boothName}</p>
    <p style="margin: 5px 0;"><strong>Queue Position:</strong> ${token.queuePosition || 'N/A'}</p>
    <p style="margin: 5px 0;"><strong>Estimated Wait Time:</strong> ${token.estimatedWaitTime || 'N/A'}</p>
  </div>
  
  <p>You can track your token status on our dashboard.</p>
  
  <p>Thank you,<br>AI Roadshow Team</p>
</div>
      `
    };
    
    const info = await transport.sendMail(message);
    console.log('Email sent:', info.messageId);
    
    // For ethereal test accounts, log the preview URL
    if (info.messageId && transport.options.host === 'smtp.ethereal.email') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

// Send reassignment notification email
export const sendReassignmentEmail = async (
  token: TokenWithDetails, 
  fromBoothName: string, 
  reason?: string
): Promise<boolean> => {
  try {
    const transport = await initializeTransporter();
    
    const message = {
      from: process.env.EMAIL_FROM || 'noreply@airoadshow.com',
      to: token.participant.email,
      subject: `AI Roadshow: Your Token ${token.tokenNumber} has been reassigned`,
      text: `
Hello ${token.participant.name},

Your token has been reassigned to a different booth.

Token Number: ${token.tokenNumber}
From Booth: ${fromBoothName}
To Booth: ${token.boothName}
Reason: ${reason || 'Not specified'}
New Queue Position: ${token.queuePosition || 'N/A'}
New Estimated Wait Time: ${token.estimatedWaitTime || 'N/A'}

You can track your token status on our dashboard.

Thank you,
AI Roadshow Team
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <h2 style="color: #EA580C;">AI Roadshow: Token Reassignment</h2>
  <p>Hello ${token.participant.name},</p>
  <p>Your token has been reassigned to a different booth.</p>
  
  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Token Number:</strong> <span style="background-color: #EA580C; color: white; padding: 3px 8px; border-radius: 3px;">${token.tokenNumber}</span></p>
    <p style="margin: 5px 0;"><strong>From Booth:</strong> ${fromBoothName}</p>
    <p style="margin: 5px 0;"><strong>To Booth:</strong> ${token.boothName}</p>
    <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason || 'Not specified'}</p>
    <p style="margin: 5px 0;"><strong>New Queue Position:</strong> ${token.queuePosition || 'N/A'}</p>
    <p style="margin: 5px 0;"><strong>New Estimated Wait Time:</strong> ${token.estimatedWaitTime || 'N/A'}</p>
  </div>
  
  <p>You can track your token status on our dashboard.</p>
  
  <p>Thank you,<br>AI Roadshow Team</p>
</div>
      `
    };
    
    const info = await transport.sendMail(message);
    console.log('Email sent:', info.messageId);
    
    // For ethereal test accounts, log the preview URL
    if (info.messageId && transport.options.host === 'smtp.ethereal.email') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

// Send status update email
export const sendStatusUpdateEmail = async (token: TokenWithDetails): Promise<boolean> => {
  try {
    const transport = await initializeTransporter();
    
    const statusText = token.status === 'attending' 
      ? 'now being attended to' 
      : token.status === 'served' 
        ? 'completed' 
        : 'in the waiting queue';
    
    const message = {
      from: process.env.EMAIL_FROM || 'noreply@airoadshow.com',
      to: token.participant.email,
      subject: `AI Roadshow: Your Token ${token.tokenNumber} Status Update`,
      text: `
Hello ${token.participant.name},

The status of your token has been updated.

Token Number: ${token.tokenNumber}
Booth: ${token.boothName}
Status: Your token is ${statusText}

You can track your token status on our dashboard.

Thank you,
AI Roadshow Team
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <h2 style="color: #3B82F6;">AI Roadshow: Token Status Update</h2>
  <p>Hello ${token.participant.name},</p>
  <p>The status of your token has been updated.</p>
  
  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Token Number:</strong> 
      <span style="background-color: ${
        token.status === 'attending' ? '#3B82F6' : 
        token.status === 'served' ? '#10B981' : '#F59E0B'
      }; color: white; padding: 3px 8px; border-radius: 3px;">${token.tokenNumber}</span>
    </p>
    <p style="margin: 5px 0;"><strong>Booth:</strong> ${token.boothName}</p>
    <p style="margin: 5px 0;"><strong>Status:</strong> Your token is ${statusText}</p>
  </div>
  
  <p>You can track your token status on our dashboard.</p>
  
  <p>Thank you,<br>AI Roadshow Team</p>
</div>
      `
    };
    
    const info = await transport.sendMail(message);
    console.log('Email sent:', info.messageId);
    
    // For ethereal test accounts, log the preview URL
    if (info.messageId && transport.options.host === 'smtp.ethereal.email') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};
