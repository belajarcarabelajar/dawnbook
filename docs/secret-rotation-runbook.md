# Secret Rotation Runbook

**CRITICAL NOTE:** Any secret ever committed to a public repository must be treated as permanently compromised. Deleting the file in a new commit does **not** protect the secret, as it remains accessible in the git history. You must immediately rotate the secret and purge it from the repository history.

## Steps for Rotating Clerk Credentials

Follow these steps immediately upon discovering an exposed `CLERK_SECRET_KEY` (e.g., in `.env.local`).

### 1. Identify the Exposed Key
- Verify the exact exposed value.
- Confirm whether it is a secret key (`sk_...`) or publishable key (`pk_...`). Publishable keys are safe to expose by design; this runbook applies only to secret keys or database credentials.

### 2. Revoke the Secret
- Log in to the [Clerk Dashboard](https://dashboard.clerk.com/).
- Navigate to the affected Application and Instance.
- Go to **API Keys**.
- Click **Roll Secret Key** to immediately invalidate the exposed key and generate a new one.
- *Warning:* This action will instantly break production systems currently relying on the old key.

### 3. Update Cloudflare Environment Variables
- Log in to the Cloudflare Dashboard.
- Navigate to **Workers & Pages** -> **Dawnbook**.
- Go to **Settings** -> **Environment variables**.
- Edit `CLERK_SECRET_KEY` with the newly generated value.
- Deploy a new build or restart the Pages environment to ensure the new variable is actively used by the edge functions.

### 4. Purge the Secret from Git History
Since the repository is public, you must completely rewrite the git history to remove the object.

```bash
# Install git-filter-repo (recommended tool for history rewrites)
pip install git-filter-repo

# Create a fresh clone of the repository
git clone https://github.com/belajarcarabelajar/dawnbook.git dawnbook-purge
cd dawnbook-purge

# Run filter-repo to completely remove the file from all commits
git filter-repo --invert-paths --path apps/admin/.env.local

# OR, if replacing a specific string across all files:
# Create a replacements.txt with the secret:
# sk_test_EXPOSED_KEY==>REDACTED
# git filter-repo --replace-text replacements.txt
```

### 5. Force Push
```bash
# Add the remote back and force-push to overwrite the public history
git remote add origin https://github.com/belajarcarabelajar/dawnbook.git
git push origin --force --all
git push origin --force --tags
```

### 6. Post-Rotation Verification
- Check the repository on GitHub to ensure the file or commit no longer exists.
- Check live endpoints (e.g., `/api/books`) to verify the new key validates sessions correctly.
- Ensure your local `.gitignore` prevents future leaks (`echo ".env.local" >> .gitignore`).
