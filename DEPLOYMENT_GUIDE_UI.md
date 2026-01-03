# Azure Portal UI Deployment Guide - Voting Application

This guide walks you through deploying the voting application using the Azure Portal web interface (no command line needed).

---

## Part 1: Build Docker Image

### Step 1: Build Docker Image Locally

1. Open **Docker Desktop** on your computer (ensure it's running)
2. Open **Command Prompt** or **PowerShell**
3. Navigate to your project:
   ```
   cd "c:\Users\kansari6\Desktop\Project\Terraform project"
   ```
4. Build the Docker image:
   ```
   docker build -t voting-app:latest .
   ```
5. Wait for the build to complete (you should see "Successfully built" message)

---

## Choose Your Image Storage: Option A or Option B

## **OPTION A: Use Azure Container Registry (ACR)** - RECOMMENDED ⭐

Azure Container Registry is Microsoft's private Docker registry service. Benefits:
- ✅ Private and secure (images not public)
- ✅ Faster deployment (in same Azure region)
- ✅ Integrated with Azure services
- ✅ Better for production
- ✅ Cost: ~$5/month (Basic tier)

### Step 1: Create Azure Container Registry

1. Login to **Azure Portal**: https://portal.azure.com
2. In the search bar at the top, type `Container registries`
3. Click on **Container registries**
4. Click **+ Create**
5. Fill in the details:
   - **Subscription**: Select your subscription
   - **Resource group**: Click **Create new** → Name it `voting-app-rg` → Click **OK**
   - **Registry name**: `votingappregistry123` (must be globally unique, lowercase, alphanumeric only, 5-50 characters)
   - **Location**: Select closest region (e.g., `East US`)
   - **SKU**: **Basic** (sufficient for most needs)
   - **Zone redundancy**: Disabled
6. Click **Review + create**
7. Click **Create**
8. Wait for deployment (1-2 minutes)
9. Click **Go to resource**

### Step 2: Enable Admin Access

1. In your Container Registry, on the left menu click **Access keys**
2. Toggle **Admin user** to **Enabled**
3. You'll see:
   - **Login server**: `votingappregistry123.azurecr.io` (copy this)
   - **Username**: `votingappregistry123` (same as registry name)
   - **password**: Two passwords shown (copy **password** - the first one)
4. **SAVE THESE VALUES** in a notepad:
   - Login server: `votingappregistry123.azurecr.io`
   - Username: `votingappregistry123`
   - Password: `[the password shown]`

### Step 3: Push Image to ACR

1. Open **Command Prompt** or **PowerShell**
2. Login to your Azure Container Registry:
   ```
   docker login votingappregistry123.azurecr.io
   ```
3. Enter the username and password from Step 2
4. Tag your image with the ACR address:
   ```
   docker tag voting-app:latest votingappregistry123.azurecr.io/voting-app:latest
   ```
5. Push to ACR:
   ```
   docker push votingappregistry123.azurecr.io/voting-app:latest
   ```
6. Wait for upload to complete

### Step 4: Verify Image in ACR (Optional)

1. Go back to your Container Registry in Azure Portal
2. On the left menu, click **Repositories**
3. You should see **voting-app** listed
4. Click on it to see the **latest** tag

**Now skip to Part 2 to create Storage Account**

---

## **OPTION B: Use Docker Hub** - Public & Free

Docker Hub is a public registry service. Use this if:
- ✅ You want free hosting
- ✅ You're okay with public images
- ✅ Testing/learning purposes
- ✅ Cost: Free

### Step 1: Create Docker Hub Account (if you don't have one)
1. Go to https://hub.docker.com
2. Click **Sign Up**
3. Create a free account
4. Verify your email

### Step 2: Create a Repository
1. Login to Docker Hub
2. Click **Create Repository**
3. Name it: `voting-app`
4. Set visibility to **Public**
5. Click **Create**

### Step 3: Push Your Image
1. In your terminal, login to Docker Hub:
   ```
   docker login
   ```
2. Enter your Docker Hub username and password
3. Tag your image (replace `yourusername` with your Docker Hub username):
   ```
   docker tag voting-app:latest yourusername/voting-app:latest
   ```
4. Push to Docker Hub:
   ```
   docker push yourusername/voting-app:latest
   ```
5. Wait for upload to complete

**Now continue to Part 2**

---

## Part 2: Create Azure Storage Account

### Step 1: Login to Azure Portal
1. Open your browser
2. Go to: https://portal.azure.com
3. Sign in with your Azure account

### Step 2: Create Resource Group
1. In the Azure Portal, click the **☰ (hamburger menu)** on the top left
2. Click **Resource groups**
3. Click **+ Create**
4. Fill in the details:
   - **Subscription**: Select your subscription
   - **Resource group**: `voting-app-rg`
   - **Region**: Select closest region (e.g., `East US`)
5. Click **Review + create**
6. Click **Create**

### Step 3: Create Storage Account
1. Click the **search bar** at the top
2. Type `Storage accounts` and click on it
3. Click **+ Create**
4. Fill in the details:
   - **Subscription**: Select your subscription
   - **Resource group**: Select `voting-app-rg`
   - **Storage account name**: `votingappstorage123` (must be globally unique, lowercase, no special characters)
   - **Region**: Same as your resource group
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally-redundant storage)
5. Click **Review + create**
6. Click **Create**
7. Wait for deployment to complete (1-2 minutes)
8. Click **Go to resource**

### Step 4: Get Storage Account Key
1. In your storage account, on the left menu click **Access keys**
2. Under **key1**, click **Show** next to Key
3. Click the **Copy** icon to copy the key
4. **SAVE THIS KEY** in a notepad - you'll need it later!

---

## Part 3: Create Azure App Service

### Step 1: Create App Service Plan
1. In the search bar at the top, type `App Service plans`
2. Click on **App Service plans**
3. Click **+ Create**
4. Fill in the details:
   - **Subscription**: Select your subscription
   - **Resource Group**: Select `voting-app-rg`
   - **Name**: `voting-app-plan`
   - **Operating System**: **Linux** (IMPORTANT!)
   - **Region**: Same as your resource group
   - **Pricing tier**: Click **Explore pricing plans**
     - Select **Basic B1** (or Dev/Test B1)
     - Click **Select**
5. Click **Review + create**
6. Click **Create**

### Step 2: Create Web App
1. In the search bar, type `App Services`
2. Click on **App Services**
3. Click **+ Create** → **Web App**
4. Fill in the **Basics** tab:
   - **Subscription**: Select your subscription
   - **Resource Group**: Select `voting-app-rg`
   - **Name**: `voting-app-uniquename123` (must be globally unique)
   - **Publish**: **Docker Container** (IMPORTANT!)
   - **Operating System**: **Linux**
   - **Region**: Same as your resource group
   - **App Service Plan**: Select `voting-app-plan`
5. Click **Next: Docker >**

### Step 3: Configure Docker Settings

**IF YOU USED AZURE CONTAINER REGISTRY (Option A):**
1. On the **Docker** tab:
   - **Options**: Single Container
   - **Image Source**: **Azure Container Registry**
   - **Registry**: Select your registry (e.g., `votingappregistry123`)
   - **Image**: Select `voting-app`
   - **Tag**: Select `latest`
   - **Startup Command**: Leave empty
2. Click **Review + create**
3. Click **Create**
4. Wait for deployment (2-3 minutes)
5. Click **Go to resource**

**IF YOU USED DOCKER HUB (Option B):**
1. On the **Docker** tab:
   - **Options**: Single Container
   - **Image Source**: **Docker Hub**
   - **Access Type**: Public
   - **Image and tag**: `yourusername/voting-app:latest` (replace with your Docker Hub username)
   - **Startup Command**: Leave empty
2. Click **Review + create**
3. Click **Create**
4. Wait for deployment (2-3 minutes)
5. Click **Go to resource**

### Step 4: Configure Environment Variables
1. In your Web App, on the left menu scroll down and click **Configuration**
2. Under **Application settings** tab, click **+ New application setting**
3. Add the following settings one by one (click **+ New application setting** for each):

   **Setting 1:**
   - Name: `AZURE_STORAGE_ACCOUNT`
   - Value: `votingappstorage123` (your storage account name)
   - Click **OK**

   **Setting 2:**
   - Name: `AZURE_STORAGE_KEY`
   - Value: Paste the storage key you copied earlier
   - Click **OK**

   **Setting 3:**
   - Name: `AZURE_TABLE_NAME`
   - Value: `VotingData`
   - Click **OK**

   **Setting 4:**
   - Name: `WEBSITES_PORT`
   - Value: `3000`
   - Click **OK**

   **Setting 5:**
   - Name: `PORT`
   - Value: `3000`
   - Click **OK**

4. Click **Save** at the top
5. Click **Continue** on the warning popup
6. Wait for the app to restart (1-2 minutes)

---

## Part 4: Access Your Application

### Step 1: Get the Application URL
1. In your Web App overview page (if not there, click **Overview** in the left menu)
2. Look for **Default domain** (e.g., `voting-app-uniquename123.azurewebsites.net`)
3. Click on the URL or copy it to your browser

### Step 2: Test Your Application
1. The voting app should load in your browser
2. Enter a name and email
3. Select **Casting** or **NOTA**
4. Click **Submit Vote**
5. Check the results section to see the vote count

---

## Part 5: Monitor and Manage

### View Application Logs
1. In your Web App, click **Log stream** in the left menu
2. You can see real-time logs of your application

### View Application Insights (Optional)
1. Click **Application Insights** in the left menu
2. Follow the prompts to enable monitoring
3. View performance metrics and errors

### Restart Application
1. In the **Overview** page
2. Click **Restart** at the top
3. Click **Yes** to confirm

### Stop Application (to save costs)
1. In the **Overview** page
2. Click **Stop** at the top
3. Click **Yes** to confirm
4. Click **Start** when you want to use it again

---

## Part 6: Update Your Application

### When You Make Code Changes:

**OPTION A - If Using Azure Container Registry:**

1. **Rebuild Docker image:**
   ```
   cd "c:\Users\kansari6\Desktop\Project\Terraform project"
   docker build -t voting-app:latest .
   ```

2. **Tag for ACR:**
   ```
   docker tag voting-app:latest votingappregistry123.azurecr.io/voting-app:latest
   ```

3. **Push to ACR:**
   ```
   docker login votingappregistry123.azurecr.io
   docker push votingappregistry123.azurecr.io/voting-app:latest
   ```

4. **Update in Azure Portal:**
   - Go to your Web App in Azure Portal
   - Click **Deployment Center** in the left menu
   - Click **Sync** to pull the latest image
   - Or go to **Overview** and click **Restart**

**OPTION B - If Using Docker Hub:**

1. **Build new Docker image:**
   ```
   docker build -t voting-app:latest .
   ```

2. **Tag and push to Docker Hub:**
   ```
   docker tag voting-app:latest yourusername/voting-app:latest
   docker push yourusername/voting-app:latest
   ```

3. **Restart Web App in Azure Portal:**
   - Go to your Web App in Azure Portal
   - Click **Deployment Center** in the left menu
   - Click **Sync** to pull the latest image
   - Or simply click **Restart** in Overview

---

## Part 7: View Storage Data (Optional)

### To see the votes stored in Azure Table Storage:

1. Go to your **Storage Account** (`votingappstorage123`)
2. In the left menu, scroll down to **Data storage**
3. Click **Tables**
4. You should see a table named **VotingData**
5. Click on it to view all votes

**Alternative - Use Storage Browser:**
1. In the left menu, click **Storage browser**
2. Expand **Tables**
3. Click on **VotingData**
4. View all stored votes with voter details

---

## Troubleshooting

### Application Not Loading?
1. Go to your Web App
2. Click **Diagnose and solve problems** in the left menu
3. Check for issues
4. Or check **Log stream** for errors

### "Application Error" Message?
1. Go to **Configuration**
2. Verify all environment variables are correct
3. Make sure `WEBSITES_PORT` is set to `3000`
4. Click **Restart**

### Docker Image Not Found?
1. **For ACR:**
   - Go to your Container Registry in Azure Portal
   - Click **Repositories** to verify image exists
   - Go to Web App → **Deployment Center**
   - Verify the registry and image name are correct
   - Click **Save** and **Restart**

2. **For Docker Hub:**
   - Verify your Docker Hub image is public
   - Go to **Deployment Center**
   - Check the image name matches exactly: `yourusername/voting-app:latest`
   - Click **Save** and **Restart**

### Votes Not Saving?
1. Check **Log stream** for errors
2. Verify Storage Account name and key in Configuration
3. Make sure the storage account key is correct

---

## Important Portal Navigation Tips

### Quick Access to Resources:
1. Click **☰** (hamburger menu) on top left
2. Click **All resources** to see everything
3. Use **Search bar** at top to find services quickly

### Common Left Menu Items:
- **Overview**: Main dashboard, URL, start/stop buttons
- **Configuration**: Environment variables, connection strings
- **Deployment Center**: Docker image settings, CI/CD
- **Log stream**: Real-time application logs
- **Console**: Terminal access to container
- **Scale up**: Change pricing tier
- **Scale out**: Add more instances

---

## Cost Management

### To Minimize Costs:
1. **Stop the app** when not using:
   - Go to Web App → Overview → Stop
2. **Use Free Tier** (limited):
   - Note: Free tier doesn't support Docker containers
   - Minimum is Basic B1 (~$13/month)
3. **Delete resources** when done testing:
   - Go to Resource Group `voting-app-rg`
   - Click **Delete resource group**
   - Type the resource group name to confirm
   - Click **Delete**

### Monthly Cost Estimate:
- **Option A (ACR):**
  - App Service (B1): ~$13/month
  - Storage Account: ~$0.50/month
  - Container Registry (Basic): ~$5/month
  - **Total**: ~$18.50/month

- **Option B (Docker Hub):**
  - App Service (B1): ~$13/month
  - Storage Account: ~$0.50/month
  - Docker Hub: Free (public images)
  - **Total**: ~$13.50/month

---

## Summary Checklist

**Common Steps:**
- [ ] Docker image built locally
- [ ] Resource group created
- [ ] Storage account created
- [ ] Storage account key saved
- [ ] App Service Plan created (Linux, B1)

**If Using ACR (Option A):**
- [ ] Azure Container Registry created
- [ ] ACR admin user enabled
- [ ] ACR credentials saved (login server, username, password)
- [ ] Image pushed to ACR
- [ ] Web App created with ACR image source
- [ ] 5 environment variables configured
- [ ] Application accessible via URL
- [ ] Votes are being saved successfully

**If Using Docker Hub (Option B):**
- [ ] Docker Hub account created
- [ ] Image pushed to Docker Hub
- [ ] Web App created with Docker Hub image
- [ ] 5 environment variables configured
- [ ] Application accessible via URL
- [ ] Votes are being saved successfully

---

## Quick Links

- **Azure Portal**: https://portal.azure.com
- **Docker Hub**: https://hub.docker.com
- **Your App URL**: https://voting-app-uniquename123.azurewebsites.net (replace with your actual name)

---

## Need Help?

### Azure Portal Resources:
1. Click the **?** icon (Help) at the top right
2. Access documentation and tutorials
3. Or click the chat icon for Azure support

### Check Application Health:
1. Go to your Web App
2. Visit: `https://your-app-name.azurewebsites.net/health`
3. Should return: `{"status":"healthy",...}`

---

**Congratulations! Your voting application is now deployed on Azure! 🎉**
