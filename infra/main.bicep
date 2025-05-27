
param location string = resourceGroup().location

var tags = {
  Owner: 'testing'
}

@description('Username to authenticate with Azure Container Registry')
param containerRegistryUsername string

@description('Password to authenticate with Azure Container Registry')
@secure()
param containerRegistryPassword string

@description('Managed Environment with minimum parameters')
module managedEnvironmentMinimumParams 'br:icebox.azurecr.io/bicep/ice/providers/app/managedenvironments:v3.2' = {
  name: '${deployment().name}-caenv-minimum'
  params: {
    appLogsConfiguration: {
      destination: 'none'
    }
    containerAppEnvironmentName: 'ai-roadshow-mumbai-001' 
    location: location
    tags: tags
  }
}


module containerAppsMinimum 'br:icebox.azurecr.io/bicep/ice/providers/app/containerapps:v1.0' = {
  name: '${deployment().name}-containerApps-minimum'
  params: {
    containerAppEnvironmentName: 'ai-roadshow-mumbai-001'
    containerAppName: 'ai-roadshow-mumbai-001'
    containerRegistryPassword: containerRegistryPassword
    containerRegistryUsername: containerRegistryUsername
    containers: [
      {
        name: 'airoadshowmumbai'
        image: 'icebox.azurecr.io/sandbox/airoadshowmumbai:shreyasversion'
        resources: {
          cpu: json('0.25')
          memory: '0.5Gi'
        }
      }
    ]
    tags: tags
    location: location
    containerTargetPort: 5000
  }
}
