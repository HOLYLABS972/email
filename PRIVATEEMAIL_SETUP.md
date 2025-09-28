# PrivateEmail SMTP Configuration Guide

## Overview
This guide will help you configure your email service to work with PrivateEmail (Namecheap's email service) to resolve the 504 Gateway Timeout error you're experiencing.

## PrivateEmail SMTP Settings

### Recommended Configuration:
- **SMTP Server:** `mail.privateemail.com`
- **Port:** `587` (TLS/STARTTLS) or `465` (SSL)
- **Security:** TLS/STARTTLS (recommended) or SSL
- **Authentication:** Required
- **Username:** Your full email address (e.g., `yourname@yourdomain.com`)
- **Password:** Your PrivateEmail account password

### Alternative Configuration (if mail.privateemail.com doesn't work):
- **SMTP Server:** `smtp.privateemail.com`
- **Port:** `587` (TLS/STARTTLS) or `465` (SSL)
- **Security:** TLS/STARTTLS (recommended) or SSL

## Step-by-Step Configuration

### 1. Access Your Project Settings
1. Go to your project dashboard
2. Click on "Project Settings" or the settings icon
3. Navigate to "SMTP Settings"

### 2. Configure SMTP Settings
Enter the following values in your SMTP settings form:

```
Host: mail.privateemail.com
Port: 587
Secure: false (for TLS/STARTTLS) or true (for SSL on port 465)
Username: your-email@yourdomain.com
Password: your-privateemail-password
```

### 3. Test Your Configuration
1. After saving your SMTP settings, use the "Test SMTP" button
2. Enter a test email address (preferably your own email)
3. Click "Send Test Email"

## Troubleshooting Common Issues

### 504 Gateway Timeout Error
This error typically occurs due to:
1. **Incorrect SMTP server settings**
2. **Network connectivity issues**
3. **Authentication problems**
4. **Server timeout configurations**

### Solutions:

#### 1. Verify SMTP Settings
- Double-check your SMTP server hostname
- Ensure the port is correct (587 for TLS, 465 for SSL)
- Verify your username is your full email address
- Confirm your password is correct

#### 2. Try Alternative Ports
If port 587 doesn't work, try:
- Port 465 with SSL enabled
- Port 25 (if not blocked by your hosting provider)

#### 3. Check Authentication
- Ensure your PrivateEmail account is active
- Verify you're using the correct email address as username
- Check if your password contains special characters that need escaping

#### 4. Network Issues
- Test if you can reach `mail.privateemail.com` from your server
- Check if your hosting provider blocks outbound SMTP connections
- Verify firewall settings

## Advanced Configuration

### For SSL (Port 465):
```
Host: mail.privateemail.com
Port: 465
Secure: true
Username: your-email@yourdomain.com
Password: your-password
```

### For TLS (Port 587):
```
Host: mail.privateemail.com
Port: 587
Secure: false
Username: your-email@yourdomain.com
Password: your-password
```

## Testing Your Configuration

### Manual Test
You can test your SMTP configuration using the built-in test feature:

1. Go to Project Settings → SMTP Settings
2. Click "Test SMTP Configuration"
3. Enter your email address
4. Click "Send Test Email"

### Expected Results
- **Success:** You should receive a test email within a few minutes
- **Failure:** Check the error message for specific guidance

## Common Error Messages and Solutions

### "Username and Password not accepted"
- Verify your email address and password
- Check if your PrivateEmail account is active
- Ensure you're using the full email address as username

### "Connection refused"
- Check if the SMTP server hostname is correct
- Verify the port number
- Check if your hosting provider blocks SMTP connections

### "Connection timed out"
- Try a different port (587 vs 465)
- Check your network connectivity
- Verify firewall settings

### "Authentication failed"
- Double-check your credentials
- Ensure your PrivateEmail account is properly set up
- Try resetting your email password

## Additional Resources

- [PrivateEmail Configuration Guide](https://www.namecheap.com/support/knowledgebase/article.aspx/1179/2175/general-private-email-configuration-for-mail-clients-and-mobile-devices)
- [Namecheap Support](https://www.namecheap.com/support/)

## Need Help?

If you continue to experience issues after following this guide:

1. **Check PrivateEmail Status:** Visit Namecheap's status page to see if there are any ongoing issues
2. **Contact Support:** Reach out to Namecheap support for PrivateEmail-specific issues
3. **Test with Different Email Client:** Try configuring the same settings in a desktop email client to isolate the issue

Remember to keep your SMTP credentials secure and never share them publicly.
