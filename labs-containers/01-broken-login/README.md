# Lab 1 - Broken Login Walkthrough

**Vulnerability:** Weak Credentials & Lack of Rate Limiting
**Difficulty:** Easy
**Points:** 100

## Challenge Scenario
The company employee portal is using insecure authentication logic. There is an `admin` account, but we don't know the password. The goal is to gain administrator access.

## Walkthrough

1.  **Analyze the Target:**
    Open the application. We see a simple login form requiring a Username and Password.
    
2.  **Identify the Weakness:**
    If we try random credentials (e.g., `test` / `test`), we either get "Invalid credentials" or maybe login as a low-privileged user.
    Since this is an employee portal, there's likely an `admin` user. Let's try `admin` as the username.
    
3.  **Exploitation (Brute Force):**
    Because the application doesn't implement CAPTCHAs, account lockouts, or rate limiting on the `/api/login` endpoint, we can brute-force the password.
    
    Using a tool like **Burp Suite Intruder** or a Python script:
    *   Target: `POST /api/login`
    *   Payload 1 (Username): `admin`
    *   Payload 2 (Password): Load a common password list (e.g., `rockyou.txt` or a smaller top-100 list).
    
    *Python Script Example:*
    ```python
    import requests
    
    url = "http://localhost:8001/api/login"
    passwords = ["admin", "password", "123456", "admin123"]
    
    for pwd in passwords:
        res = requests.post(url, json={"username": "admin", "password": pwd})
        if res.status_code == 200:
            print(f"Success! Password is: {pwd}")
            print(res.json())
            break
    ```
    
4.  **Retrieve Flag:**
    The script (or Burp Intruder) will identify that the password is `admin123`.
    Logging in manually with `admin` / `admin123` via the web UI reveals the secret flag.

## Mitigation
To fix this vulnerability, developers should:
1. Enforce strong password complexity rules.
2. Implement rate limiting (e.g., max 5 failed attempts per minute per IP).
3. Implement account lockouts after successive failed attempts.
