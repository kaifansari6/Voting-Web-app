# GitHub Actions Workflow Setup Guide

This guide will help you set up the GitHub Actions workflow to automatically build and push your Docker image to Azure Container Registry (ACR) and deploy to Azure Web App.

## Prerequisites

Before setting up the workflow, ensure you have:
- Azure Container Registry created
- Azure Web App created
- GitHub repository with the code

---

## Step 1: Get Azure Container Registry Credentials

### Option A: Using Azure Portal (UI)

1. Go to **Azure Portal**: https://portal.azure.com
2. Navigate to your **Container Registry** (e.g., `votingappregistry123`)
3. In the left menu, click **Access keys**
4. Toggle **Admin user** to **Enabled**
5. Copy the following:
   - **Username**: (same as registry name, e.g., `votingappregistry123`)
   - **password**: Copy the first password shown

### Option B: Using Azure CLI

```bash
# Get ACR username
az acr credential show --name votingappregistry123 --query "username" -o tsv

# Get ACR password
az acr credential show --name votingappregistry123 --query "passwords[0].value" -o tsv
```

---

## Step 2: Create Azure Service Principal (for deployment)

### Option A: Using Azure Portal

1. Go to **Azure Portal**
2. Search for **Azure Active Directory** (or **Microsoft Entra ID**)
3. Click **App registrations** → **New registration**
4. Name it: `voting-app-github-actions`
5. Click **Register**
6. Note the **Application (client) ID** and **Directory (tenant) ID**
7. Click **Certificates & secrets** → **New client secret**
8. Add description: `GitHub Actions`
9. Set expiration (e.g., 180 days)
10. Click **Add** and copy the **Value** immediately (you won't see it again)

### Option B: Using Azure CLI (Easier)

```bash
# Get your subscription ID
az account show --query id -o tsv

# Create service principal (replace SUBSCRIPTION_ID with your actual subscription ID)
az ad sp create-for-rbac \
  --name "voting-app-github-actions" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/voting-app-rg \
  --sdk-auth

# This will output JSON - SAVE THE ENTIRE OUTPUT!
```

The output will look like this:
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

**SAVE THIS ENTIRE JSON OUTPUT!**

---

## Step 3: Add GitHub Secrets

1. Go to your GitHub repository: https://github.com/kaifansari6/Voting-Web-app
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** for each of the following:

### Secret 1: ACR_USERNAME
- **Name**: `ACR_USERNAME`
- **Value**: Your ACR username (e.g., `votingappregistry123`)
- Click **Add secret**

### Secret 2: ACR_PASSWORD
- **Name**: `ACR_PASSWORD`
- **Value**: Your ACR password (from Step 1)
- Click **Add secret**

### Secret 3: AZURE_CREDENTIALS
- **Name**: `AZURE_CREDENTIALS`
- **Value**: The entire JSON output from the service principal creation (from Step 2)
- Click **Add secret**

### Secret 4: AZURE_WEBAPP_NAME
- **Name**: `AZURE_WEBAPP_NAME`
- **Value**: Your Azure Web App name (e.g., `voting-app-uniquename123`)
- Click **Add secret**

---

## Step 4: Update Workflow Configuration

1. Open the file `.github/workflows/build-and-deploy.yml` in your repository
2. Update the environment variables at the top:
   ```yaml
   env:
     REGISTRY_NAME: votingappregistry123  # Replace with YOUR ACR name
     IMAGE_NAME: voting-app
   ```
3. Save and commit the changes

---

## Step 5: Test the Workflow

### Automatically trigger on push:
```bash
# Make a small change to any file
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "Test GitHub Actions workflow"
git push
```

### Or trigger manually:
1. Go to your GitHub repository
2. Click **Actions** tab
3. Click on **Build and Push to Azure Container Registry** workflow
4. Click **Run workflow** button
5. Select branch (e.g., `main`)
6. Click **Run workflow**

---

## Step 6: Monitor the Workflow

1. Go to **Actions** tab in your GitHub repository
2. Click on the running workflow
3. Watch the progress of each step:
   - ✓ Checkout code
   - ✓ Set up Docker Buildx
   - ✓ Log in to Azure Container Registry
   - ✓ Extract metadata for Docker
   - ✓ Build and push Docker image
   - ✓ Azure Login
   - ✓ Deploy to Azure Web App
   - ✓ Logout from Azure

4. If all steps are green ✓, your deployment was successful!

---

## What This Workflow Does

1. **Triggers on**:
   - Push to `main` or `develop` branch
   - Pull requests to `main` branch
   - Manual trigger (workflow_dispatch)

2. **Build Process**:
   - Checks out your code
   - Sets up Docker Buildx for building
   - Logs into Azure Container Registry
   - Builds the Docker image
   - Tags image with:
     - `latest` (for main branch)
     - Git commit SHA (e.g., `abc123`)
   - Pushes image to ACR

3. **Deployment**:
   - Logs into Azure
   - Deploys new image to Azure Web App
   - Logs out from Azure

---

## Verify Deployment

### Check in Azure Portal:
1. Go to your **Web App** in Azure Portal
2. Click **Deployment Center**
3. Check the deployment logs
4. Click **Browse** to test your app

### Check in Azure Container Registry:
1. Go to your **Container Registry**
2. Click **Repositories**
3. Click on `voting-app`
4. You should see tags: `latest` and the git commit SHA

---

## Troubleshooting

### Workflow fails at "Log in to Azure Container Registry"
- Verify `ACR_USERNAME` and `ACR_PASSWORD` secrets are correct
- Ensure Admin user is enabled in ACR Access keys

### Workflow fails at "Azure Login"
- Verify `AZURE_CREDENTIALS` secret contains the full JSON
- Check the service principal has proper permissions

### Workflow fails at "Deploy to Azure Web App"
- Verify `AZURE_WEBAPP_NAME` secret matches your Web App name
- Ensure the Web App is configured to use ACR

### Image builds but doesn't deploy
- Check Web App logs in Azure Portal (Deployment Center → Logs)
- Verify Web App container settings point to the correct ACR repository

---

## Advanced: Enable Continuous Deployment

To automatically restart the Web App when a new image is pushed:

1. Go to your **Web App** in Azure Portal
2. Click **Deployment Center**
3. Under **Registry settings**, enable **Continuous deployment**
4. Click **Save**

Now, whenever GitHub Actions pushes a new image, Azure will automatically pull and deploy it!

---

## Workflow Badge (Optional)

Add a badge to your README.md to show build status:

```markdown
![Build and Deploy](https://github.com/kaifansari6/Voting-Web-app/actions/workflows/build-and-deploy.yml/badge.svg)
```

---

## Cost Optimization

### To reduce GitHub Actions costs:
- Workflow only runs on `main` and `develop` branches
- Uses Docker layer caching to speed up builds
- Skips unnecessary steps when possible

### To reduce Azure costs:
- Only deploy on successful builds
- Consider using staging slots for testing before production

---

## Manual Commands (if needed)

### Build locally and push to ACR:
```bash
# Login to ACR
docker login votingappregistry123.azurecr.io -u votingappregistry123 -p YOUR_PASSWORD

# Build
docker build -t votingappregistry123.azurecr.io/voting-app:latest .

# Push
docker push votingappregistry123.azurecr.io/voting-app:latest
```

### Restart Web App:
```bash
az webapp restart --name voting-app-uniquename123 --resource-group voting-app-rg
```

---

## Summary Checklist

- [ ] Azure Container Registry created with admin user enabled
- [ ] ACR credentials obtained (username and password)
- [ ] Azure Service Principal created with contributor role
- [ ] Service Principal JSON saved
- [ ] GitHub secrets added (ACR_USERNAME, ACR_PASSWORD, AZURE_CREDENTIALS, AZURE_WEBAPP_NAME)
- [ ] Workflow file updated with correct ACR name
- [ ] Workflow file committed and pushed to GitHub
- [ ] Workflow successfully runs and builds image
- [ ] Image appears in ACR repositories
- [ ] Web App successfully deployed with new image
- [ ] Application is accessible and working

---

**Your CI/CD pipeline is now set up! Every time you push code to the main branch, it will automatically build and deploy to Azure! 🚀**
