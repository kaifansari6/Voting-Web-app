# Voting Application

A Docker-based voting application with HTML, CSS, and JavaScript frontend that stores votes in Azure Table Storage.

## Features

- **Simple Voting Interface**: Two voting options - Casting and NOTA (None of the Above)
- **Real-time Results**: View current vote counts
- **Azure Table Storage**: Persistent data storage using Azure Table Storage
- **Docker Support**: Fully containerized application
- **Azure App Service Ready**: Configured for deployment to Azure App Service

## Project Structure

```
.
├── index.html          # Frontend HTML
├── styles.css          # Styling
├── script.js           # Frontend JavaScript
├── server.js           # Node.js backend server
├── package.json        # Node.js dependencies
├── Dockerfile          # Docker configuration
├── .dockerignore       # Docker ignore file
└── README.md          # This file
```

## Prerequisites

- Node.js 18+ (for local development)
- Docker (for containerization)
- Azure Account with Storage Account created
- Azure CLI (for deployment)

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Azure Storage credentials:
   ```
   AZURE_STORAGE_ACCOUNT=your-storage-account-name
   AZURE_STORAGE_KEY=your-storage-account-key
   AZURE_TABLE_NAME=VotingData
   PORT=3000
   ```

3. **Run the application**:
   ```bash
   npm start
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

## Docker Build and Run

1. **Build the Docker image**:
   ```bash
   docker build -t voting-app .
   ```

2. **Run the container**:
   ```bash
   docker run -p 3000:3000 \
     -e AZURE_STORAGE_ACCOUNT=your-storage-account \
     -e AZURE_STORAGE_KEY=your-storage-key \
     -e AZURE_TABLE_NAME=VotingData \
     voting-app
   ```

3. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

## Azure Storage Account Setup

1. **Create a Storage Account** in Azure Portal

2. **Get the connection details**:
   - Storage Account Name
   - Storage Account Key (found in Access Keys section)

3. **The application will automatically create the table** named `VotingData` on first run

## Deploy to Azure App Service

### Option 1: Deploy using Azure CLI

1. **Login to Azure**:
   ```bash
   az login
   ```

2. **Create a Resource Group** (if not exists):
   ```bash
   az group create --name voting-app-rg --location eastus
   ```

3. **Create an Azure Container Registry** (optional, if you want to use ACR):
   ```bash
   az acr create --resource-group voting-app-rg --name votingappregistry --sku Basic
   ```

4. **Build and push the image to ACR**:
   ```bash
   az acr build --registry votingappregistry --image voting-app:latest .
   ```

5. **Create an App Service Plan**:
   ```bash
   az appservice plan create --name voting-app-plan --resource-group voting-app-rg --is-linux --sku B1
   ```

6. **Create the Web App**:
   ```bash
   az webapp create --resource-group voting-app-rg --plan voting-app-plan --name voting-app-unique --deployment-container-image-name votingappregistry.azurecr.io/voting-app:latest
   ```

7. **Configure environment variables**:
   ```bash
   az webapp config appsettings set --resource-group voting-app-rg --name voting-app-unique --settings \
     AZURE_STORAGE_ACCOUNT=your-storage-account \
     AZURE_STORAGE_KEY=your-storage-key \
     AZURE_TABLE_NAME=VotingData \
     WEBSITES_PORT=3000
   ```

8. **Enable container logging**:
   ```bash
   az webapp log config --name voting-app-unique --resource-group voting-app-rg --docker-container-logging filesystem
   ```

### Option 2: Deploy using Docker Hub

1. **Build and tag the image**:
   ```bash
   docker build -t yourusername/voting-app:latest .
   ```

2. **Push to Docker Hub**:
   ```bash
   docker push yourusername/voting-app:latest
   ```

3. **Create Web App with Docker Hub image**:
   ```bash
   az webapp create --resource-group voting-app-rg --plan voting-app-plan --name voting-app-unique --deployment-container-image-name yourusername/voting-app:latest
   ```

4. **Configure environment variables** (same as above)

## Environment Variables for Azure App Service

Set these in Azure App Service Configuration > Application Settings:

| Variable | Description |
|----------|-------------|
| `AZURE_STORAGE_ACCOUNT` | Your Azure Storage Account name |
| `AZURE_STORAGE_KEY` | Your Azure Storage Account access key |
| `AZURE_TABLE_NAME` | Table name for storing votes (default: VotingData) |
| `WEBSITES_PORT` | Port number (set to 3000) |
| `PORT` | Application port (set to 3000) |

## API Endpoints

- `POST /api/vote` - Submit a vote
  ```json
  {
    "voterName": "John Doe",
    "voterEmail": "john@example.com",
    "vote": "casting",
    "timestamp": "2026-01-03T10:00:00.000Z"
  }
  ```

- `GET /api/results` - Get voting results
  ```json
  {
    "casting": 10,
    "nota": 5,
    "total": 15
  }
  ```

- `GET /health` - Health check endpoint

## Terraform Deployment (Optional)

If you want to use Terraform to deploy the infrastructure, create the following configuration files:

### main.tf
```hcl
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "voting_app" {
  name     = "voting-app-rg"
  location = "East US"
}

resource "azurerm_storage_account" "voting_app" {
  name                     = "votingappstorage${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.voting_app.name
  location                 = azurerm_resource_group.voting_app.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_table" "voting_data" {
  name                 = "VotingData"
  storage_account_name = azurerm_storage_account.voting_app.name
}

resource "azurerm_service_plan" "voting_app" {
  name                = "voting-app-plan"
  resource_group_name = azurerm_resource_group.voting_app.name
  location            = azurerm_resource_group.voting_app.location
  os_type             = "Linux"
  sku_name            = "B1"
}

resource "azurerm_linux_web_app" "voting_app" {
  name                = "voting-app-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.voting_app.name
  location            = azurerm_service_plan.voting_app.location
  service_plan_id     = azurerm_service_plan.voting_app.id

  site_config {
    application_stack {
      docker_image     = "yourusername/voting-app"
      docker_image_tag = "latest"
    }
  }

  app_settings = {
    "AZURE_STORAGE_ACCOUNT" = azurerm_storage_account.voting_app.name
    "AZURE_STORAGE_KEY"     = azurerm_storage_account.voting_app.primary_access_key
    "AZURE_TABLE_NAME"      = "VotingData"
    "WEBSITES_PORT"         = "3000"
    "PORT"                  = "3000"
  }
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

output "app_url" {
  value = "https://${azurerm_linux_web_app.voting_app.default_hostname}"
}

output "storage_account_name" {
  value = azurerm_storage_account.voting_app.name
}
```

## Troubleshooting

1. **Container not starting**: Check logs with `az webapp log tail`
2. **Database connection issues**: Verify Azure Storage credentials
3. **Port issues**: Ensure `WEBSITES_PORT` is set to 3000

## License

MIT License
