const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { Donor, EmailHistory } = require('../models');
const { sendEmail } = require('../utils/emailService');

/**
 * @route   POST /api/emails/send
 * @desc    Send emails to selected donors
 * @access  Private
 */
router.post('/send', authenticate, async (req, res) => {
  try {
    const { donorIds, subject, message, templateType } = req.body;

    // Validate input
    if (!donorIds || !Array.isArray(donorIds) || donorIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one donor'
      });
    }

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    // Fetch donor details
    const donors = await Donor.findAll({
      where: {
        id: donorIds
      }
    });

    if (donors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No donors found with the provided IDs'
      });
    }

    // Get user's hospital name for template variables
    const hospitalName = req.user.hospital_name || 'OptiBlood Hospital';
    const hospitalContact = req.user.phone || 'Contact us for more information';

    // Send emails to each donor
    const emailResults = [];
    const errors = [];

    for (const donor of donors) {
      try {
        // Replace template variables in message
        let personalizedMessage = message
          .replace(/\[Donor Name\]/g, donor.name)
          .replace(/\[Date\]/g, new Date().toLocaleDateString())
          .replace(/\[Blood Type\]/g, donor.blood_type)
          .replace(/\[Hospital Name\]/g, hospitalName)
          .replace(/\[Phone\]/g, hospitalContact)
          .replace(/\n/g, '<br>'); // Convert newlines to HTML breaks

        // Replace template variables in subject
        let personalizedSubject = subject
          .replace(/\[Donor Name\]/g, donor.name)
          .replace(/\[Date\]/g, new Date().toLocaleDateString())
          .replace(/\[Blood Type\]/g, donor.blood_type)
          .replace(/\[Hospital Name\]/g, hospitalName);

        // Send email
        const emailSent = await sendEmail({
          to: donor.email,
          subject: personalizedSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">🩸 OptiBlood</h1>
              </div>
              <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                ${personalizedMessage}
              </div>
              <div style="background-color: #f9fafb; padding: 15px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  ${hospitalName} Blood Donation Team<br>
                  This is an automated message. Please do not reply to this email.
                </p>
              </div>
            </div>
          `
        });

        if (emailSent) {
          emailResults.push({
            donorId: donor.id,
            donorName: donor.name,
            email: donor.email,
            status: 'sent'
          });
        } else {
          errors.push({
            donorId: donor.id,
            donorName: donor.name,
            email: donor.email,
            error: 'Failed to send email - Check email configuration in .env file'
          });
        }
      } catch (error) {
        console.error(`Error sending email to ${donor.email}:`, error);
        errors.push({
          donorId: donor.id,
          donorName: donor.name,
          email: donor.email,
          error: error.message
        });
      }
    }

    // Save email history
    const emailHistory = await EmailHistory.create({
      sent_by: req.user.id,
      subject: subject,
      message: message,
      template_type: templateType,
      recipient_count: donors.length,
      recipients: donors.map(donor => {
        const result = emailResults.find(r => r.donorId === donor.id);
        const error = errors.find(e => e.donorId === donor.id);
        return {
          donorId: donor.id,
          donorName: donor.name,
          email: donor.email,
          bloodType: donor.blood_type,
          status: result ? 'sent' : 'failed',
          error: error ? error.error : null
        };
      }),
      sent_count: emailResults.length,
      failed_count: errors.length
    });

    // Return results
    res.status(200).json({
      success: true,
      message: `Emails sent to ${emailResults.length} donor(s)`,
      data: {
        sent: emailResults.length,
        failed: errors.length,
        results: emailResults,
        errors: errors.length > 0 ? errors : undefined,
        emailHistoryId: emailHistory.id
      }
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emails',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/emails/history
 * @desc    Get email history
 * @access  Private
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const emailHistory = await EmailHistory.findAll({
      where: {
        sent_by: req.user.id
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await EmailHistory.count({
      where: {
        sent_by: req.user.id
      }
    });

    res.status(200).json({
      success: true,
      count: emailHistory.length,
      total: total,
      data: emailHistory
    });
  } catch (error) {
    console.error('Error fetching email history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/emails/history/:id
 * @desc    Get email history details with recipients
 * @access  Private
 */
router.get('/history/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const emailHistory = await EmailHistory.findOne({
      where: {
        id: id,
        sent_by: req.user.id
      }
    });

    if (!emailHistory) {
      return res.status(404).json({
        success: false,
        message: 'Email history not found'
      });
    }

    res.status(200).json({
      success: true,
      data: emailHistory
    });
  } catch (error) {
    console.error('Error fetching email history details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email history details',
      error: error.message
    });
  }
});

module.exports = router;

