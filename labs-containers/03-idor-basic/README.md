# Lab 3 - IDOR Basic Walkthrough

**Vulnerability:** Insecure Direct Object Reference (IDOR)
**Difficulty:** Easy
**Points:** 150

## Challenge Scenario
The application assigns users a sequential numeric ID. We are logged in as a "Guest User", but we want to view the Administrator's profile to steal their secret.

## Walkthrough

1.  **Analyze the Target:**
    Click "Login as Guest". The page displays our profile and notes that our "Current logged in user ID" is `2`.
    
2.  **Intercept the Request:**
    If we open the browser's Network tab or use a proxy like Burp Suite, we can see that when the page loads, it makes a `GET` request to `/api/users/2`.
    
3.  **Exploitation (IDOR):**
    The application checks if we have a valid session cookie, but it **does not** check if our session actually belongs to user ID `2`. It blindly trusts the `id` parameter in the URL.
    
    Since IDs are sequential numbers, it's highly likely that the Administrator is user ID `1`.
    
    Let's change the URL and make a request to:
    `GET /api/users/1`
    
    *Using cURL (assuming you copied the cookie from the browser):*
    ```bash
    curl -b "session_id=user_2_token" http://localhost:8003/api/users/1
    ```
    
    *Using the Browser Console:*
    ```javascript
    fetch('/api/users/1').then(r => r.json()).then(console.log)
    ```
    
4.  **Retrieve Flag:**
    The server responds with the Administrator's profile data, which contains the secret flag.

## Mitigation
To prevent IDOR, authorization checks must be performed on the server side for every request accessing a specific object.
1. Extract the `userId` from the secure session token/cookie (not from the URL).
2. If an endpoint requires a parameterized ID in the URL (e.g., viewing *another* public user's profile), explicitly check if the currently authenticated user has the permissions required to view/modify that specific object ID.
3. Consider using non-sequential identifiers like UUIDs (though UUIDs alone do not fix the underlying authorization flaw, they make enumeration harder).
