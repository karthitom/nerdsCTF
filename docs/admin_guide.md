# Administrator Guide: nerdCTF - Version 1

This guide instructs platform administrators on how to moderate players, inspect system audits, handle support tickets, and monitor platform health.

---

## 1. Accessing Admin Panel
1. Authenticate with administrative credentials:
   - Default Email: `admin@nerdsctf.io`
   - Default Password: `NerdCTFAdminPass123!`
2. Upon login, you will see the **Admin** link in the navigation header. Select this link to open the panel dashboard.

---

## 2. Admin Dashboard Sections

### A. Stats & Health (Monitoring)
- Review total user sign-ups, challenge deployments, correct vs incorrect submission ratios.
- Inspect infrastructure monitoring states (MySQL & Redis service statuses, system CPU/Memory usages).

### B. User Moderation
- Navigate to the **Users** tab.
- View a listing of all registered users, emails, and roles.
- Use **Lock User** to restrict access or toggle bans for suspicious behavior.
- Select **Delete** to permanently purge a profile from the database.
- *Note: Self-deletion or deletion of other ADMIN accounts is restricted.*

### C. Log Auditing
- Select the **Logs** tab.
- **User Audit Trails**: Streams user-centric events (such as logins, challenge attempts, solves, and progress updates), detailing actions, IP addresses, and timestamps.
- **Administrative Logs**: Streams system modifications performed by admins (e.g. user bans, deletes, roles updates, or ticket statuses modifications).

### D. Support Ticketing
- Navigate to the **Tickets** tab.
- Displays a table listing support tickets opened by users.
- Review titles, descriptions, priorities, and current statuses.
- Click **Resolve** once an issue is resolved, or **Close** to lock the ticket.
