# Lab 4 - IDOR Advanced Walkthrough

**Vulnerability:** Chained IDOR (Information Disclosure -> Privilege Escalation)
**Difficulty:** Medium
**Points:** 250

## Challenge Scenario
The application uses unguessable UUIDs instead of sequential IDs to prevent simple IDOR attacks. We need to find a way to leak the admin's UUID and then use it to take over their account.

## Walkthrough

1.  **Analyze the Target:**
    Log in with the provided guest credentials (`guest` / `guest`).
    Once logged in, the dashboard displays our profile (which says we don't have the flag) and a "Public Employee Directory".
    
2.  **Information Disclosure:**
    The directory table lists all users, their roles, and notably, their **System UUIDs**.
    Find the user with the `admin` role and copy their UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`).
    
3.  **Exploit the Update Endpoint (IDOR):**
    The page has an "Update Password" feature.
    If we update our own password and inspect the Network request, we see it makes a `PUT` request to `/api/users/<our-uuid>/password`.
    
    Using Burp Suite, Postman, or cURL, we can intercept or replay this request, swapping out our UUID for the admin's UUID.
    
    *cURL Example:*
    ```bash
    curl -X PUT "http://localhost:8004/api/users/<ADMIN-UUID>/password" \
         -b "session_id=<OUR-UUID>" \
         -H "Content-Type: application/json" \
         -d '{"password":"hacked"}'
    ```
    
    The server responds with `{"success":true,"message":"Password updated successfully"}`.
    *Why did this work?* The server checked if we were authenticated (by looking at our `session_id` cookie), but it failed to verify if our `session_id` matched the UUID in the URL path.
    
4.  **Retrieve Flag:**
    Now that we have changed the admin's password to `hacked`, we can log out (or clear cookies) and log in as `admin` with the password `hacked`.
    The dashboard will load the admin profile, revealing the secret flag.

## Mitigation
1. Never leak sensitive identifiers like User UUIDs in public or low-privileged endpoints if those IDs are used for authorization decisions.
2. Relying on "unguessable" IDs (Security through Obscurity) is not a replacement for real Access Control.
3. The server must explicitly verify that the authenticated user (`req.cookies.session_id`) has the permission to modify the resource requested (`req.params.id`). In this case, ensure `session_id === target_id` or that the session user has an 'Admin' role.
