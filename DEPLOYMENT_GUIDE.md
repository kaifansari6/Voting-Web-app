# Azure App Service Deployment Guide

## Prerequisites
- Azure CLI installed
- Docker Desktop installed and running
- Azure subscription with access to create resources

## Step 1: Build the Docker Image

```bash
# Navigate to project directory
cd "c:\Users\kansari6\Desktop\Project\Terraform project"

# Build the Docker image
docker build -t voting-app:latest .

# Test the image locally (optional)
docker run -p 3000:3000 voting-app:latest
# Then access http://localhost:3000
```

## Step 2: Azure Login

```bash
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account list --output table
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

## Step 3: Create Azure Storage Account (for storing votes)

```bash
# Create a resource group
az group create --name voting-app-rg --location eastus

# Create a storage account (name must be globally unique, 3-24 lowercase letters/numbers)
az storage account create \
  --name votingappstorage123 \
  --resource-group voting-app-rg \
  --location eastus \
  --sku Standard_LRS

# Get the storage account key
az storage account keys list \
  --resource-group voting-app-rg \
  --account-name votingappstorage123 \
  --query "[0].value" \
  --output tsv

# Save this key - you'll need it later!
```

## Step 4: Option A - Deploy using Docker Hub

### 4.1 Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag your image (replace 'yourusername' with your Docker Hub username)
docker tag voting-app:latest yourusername/voting-app:latest

# Push to Docker Hub
docker push yourusername/voting-app:latest
```

### 4.2 Create App Service Plan

```bash
# Create an App Service Plan (Linux, Basic tier)
az appservice plan create \
  --name voting-app-plan \
  --resource-group voting-app-rg \
  --is-linux \
  --sku B1
```

### 4.3 Create Web App

```bash
# Create the web app (name must be globally unique)
az webapp create \
  --resource-group voting-app-rg \
  --plan voting-app-plan \
  --name voting-app-unique-name-123 \
  --deployment-container-image-name yourusername/voting-app:latest
```

### 4.4 Configure Environment Variables

```bash
# Set the environment variables (replace with your actual values)
az webapp config appsettings set \
  --resource-group voting-app-rg \
  --name voting-app-unique-name-123 \
  --settings \
    AZURE_STORAGE_ACCOUNT=votingappstorage123 \
    AZURE_STORAGE_KEY=your-storage-key-from-step3 \
    AZURE_TABLE_NAME=VotingData \
    WEBSITES_PORT=3000 \
    PORT=3000
```

## Step 5: Option B - Deploy using Azure Container Registry (ACR)

### 5.1 Create Azure Container Registry

```bash
# Create ACR (name must be globally unique, alphanumeric only)
az acr create \
  --resource-group voting-app-rg \
  --name votingappregistry123 \
  --sku Basic \
  --admin-enabled true

# Get ACR credentials
az acr credential show \
  --resource-group voting-app-rg \
  --name votingappregistry123
```

### 5.2 Build and Push to ACR

```bash
# Login to ACR
az acr login --name votingappregistry123

# Build and push directly to ACR
az acr build \
  --registry votingappregistry123 \
  --image voting-app:latest \
  --file Dockerfile .
```

### 5.3 Create App Service Plan (if not created)

```bash
az appservice plan create \
  --name voting-app-plan \
  --resource-group voting-app-rg \
  --is-linux \
  --sku B1
```

### 5.4 Create Web App with ACR

```bash
# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name votingappregistry123 --resource-group voting-app-rg --query loginServer --output tsv)

# Create web app
az webapp create \
  --resource-group voting-app-rg \
  --plan voting-app-plan \
  --name voting-app-unique-name-123 \
  --deployment-container-image-name ${ACR_LOGIN_SERVER}/voting-app:latest

# Configure ACR credentials for the web app
az webapp config container set \
  --name voting-app-unique-name-123 \
  --resource-group voting-app-rg \
  --docker-custom-image-name ${ACR_LOGIN_SERVER}/voting-app:latest \
  --docker-registry-server-url https://${ACR_LOGIN_SERVER} \
  --docker-registry-server-user votingappregistry123 \
  --docker-registry-server-password $(az acr credential show --name votingappregistry123 --query "passwords[0].value" --output tsv)
```

### 5.5 Configure Environment Variables

```bash
az webapp config appsettings set \
  --resource-group voting-app-rg \
  --name voting-app-unique-name-123 \
  --settings \
    AZURE_STORAGE_ACCOUNT=votingappstorage123 \
    AZURE_STORAGE_KEY=your-storage-key-from-step3 \
    AZURE_TABLE_NAME=VotingData \
    WEBSITES_PORT=3000 \
    PORT=3000
```

## Step 6: Enable Logging and Monitor

```bash
# Enable container logging
az webapp log config \
  --name voting-app-unique-name-123 \
  --resource-group voting-app-rg \
  --docker-container-logging filesystem

# Stream logs
az webapp log tail \
  --name voting-app-unique-name-123 \
  --resource-group voting-app-rg
```

## Step 7: Access Your Application

```bash
# Get the app URL
az webapp show \
  --name voting-app-unique-name-123 \
  --resource-group voting-app-rg \
  --query defaultHostName \
  --output tsv

# Your app will be available at:
# https://voting-app-unique-name-123.azurewebsites.net
```

## Step 8: Access via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **App Services**
3. Click on **voting-app-unique-name-123**
4. Click on **Browse** or use the URL shown
5. To manage:
   - **Configuration**: Add/edit environment variables
   - **Container settings**: Update Docker image
   - **Log stream**: View real-time logs
   - **Deployment Center**: Configure CI/CD

## Troubleshooting

### View logs:
```bash
az webapp log tail --name voting-app-unique-name-123 --resource-group voting-app-rg
```

### Restart the app:
```bash
az webapp restart --name voting-app-unique-name-123 --resource-group voting-app-rg
```

### Check health:
```bash
curl https://voting-app-unique-name-123.azurewebsites.net/health
```

## Update Deployment

### When you make changes:

```bash
# Rebuild and push to Docker Hub
docker build -t yourusername/voting-app:latest .
docker push yourusername/voting-app:latest

# Restart the web app to pull the new image
az webapp restart --name voting-app-unique-name-123 --resource-group voting-app-rg

# Or for ACR:
az acr build --registry votingappregistry123 --image voting-app:latest .
az webapp restart --name voting-app-unique-name-123 --resource-group voting-app-rg
```

## Clean Up Resources (when done)

```bash
# Delete the entire resource group
az group delete --name voting-app-rg --yes --no-wait
```

## Important Notes

- Replace `voting-app-unique-name-123` with a unique name (must be globally unique)
- Replace `votingappstorage123` with your storage account name
- Replace `votingappregistry123` with your ACR name
- Replace `yourusername` with your Docker Hub username
- Keep your storage account key secure
- The Basic (B1) tier costs approximately $13/month
- Storage account costs are minimal for this use case

## Quick Command Summary

```bash
# Complete deployment script (customize variables)
RESOURCE_GROUP="voting-app-rg"
LOCATION="eastus"
STORAGE_ACCOUNT="votingappstorage123"
APP_NAME="voting-app-unique-123"
ACR_NAME="votingappregistry123"

# Create resources
az group create --name $RESOURCE_GROUP --location $LOCATION
az storage account create --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --location $LOCATION --sku Standard_LRS
STORAGE_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_ACCOUNT --query "[0].value" -o tsv)

# Build and deploy
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true
az acr build --registry $ACR_NAME --image voting-app:latest .
az appservice plan create --name voting-app-plan --resource-group $RESOURCE_GROUP --is-linux --sku B1
ACR_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer -o tsv)
az webapp create --resource-group $RESOURCE_GROUP --plan voting-app-plan --name $APP_NAME --deployment-container-image-name ${ACR_SERVER}/voting-app:latest

# Configure
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)
az webapp config container set --name $APP_NAME --resource-group $RESOURCE_GROUP --docker-registry-server-url https://${ACR_SERVER} --docker-registry-server-user $ACR_NAME --docker-registry-server-password $ACR_PASSWORD
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings AZURE_STORAGE_ACCOUNT=$STORAGE_ACCOUNT AZURE_STORAGE_KEY=$STORAGE_KEY AZURE_TABLE_NAME=VotingData WEBSITES_PORT=3000 PORT=3000

# Get URL
echo "App URL: https://$(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostName -o tsv)"
```
