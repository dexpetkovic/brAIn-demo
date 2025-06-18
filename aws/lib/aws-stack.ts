import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2'
import * as apigwv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager'
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline'
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions'
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery'
import * as logs from 'aws-cdk-lib/aws-logs'

export class AwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // VPC
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2
    })

    // RDS Postgres
    const dbSecret = new secretsmanager.Secret(this, 'DBSecret', {
      secretName: 'brain-db-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'brainUser'
        }),
        generateStringKey: 'password',
        excludePunctuation: true
      }
    })

    const brainSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'BrainSecret',
      'prod/brain'
    )

    const db = new rds.DatabaseInstance(this, 'PostgresDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_5
      }),
      vpc,
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: 'brain',
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      multiAz: false,
      publiclyAccessible: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false
    })

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc })

    // CloudMap
    const cloudMapNamespace = new servicediscovery.PrivateDnsNamespace(
      this,
      'DnsNamespace',
      {
        name: 'brain.local',
        vpc
      }
    )

    // ECR Repository
    const repo = new ecr.Repository(this, 'ServerEcrRepo', {
      repositoryName: 'brain-server',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    new cdk.CfnOutput(this, 'EcrRepoUri', {
      value: repo.repositoryUri,
      description: 'ECR repository URI for server Docker image'
    })

    // Fargate Task Definition
    const taskDef = new ecs.FargateTaskDefinition(this, 'ServerTaskDef', {
      cpu: 256,
      memoryLimitMiB: 512
    })

    const serverContainer = taskDef.addContainer('ServerContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'server' }),
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:3000/status | grep UP || exit 1'
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60)
      },
      environment: {
        NODE_ENV: 'production',
        DATABASE_DATABASE: 'brain',
        DATABASE_USERNAME: 'brainUser',
        DATABASE_HOST: db.dbInstanceEndpointAddress,
        DATABASE_PORT: db.dbInstanceEndpointPort,
        AWS_BUCKET: 'brain',
        DATABASE_RUN_MIGRATIONS: 'true',
        DATABASE_USE_SSL: 'true'
      },
      secrets: {
        DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
        GEMINI_API_KEY: ecs.Secret.fromSecretsManager(
          brainSecret,
          'GEMINI_API_KEY'
        ),
        GEMINI_MODEL: ecs.Secret.fromSecretsManager(
          brainSecret,
          'GEMINI_MODEL'
        ),
        WASENDER_API_KEY: ecs.Secret.fromSecretsManager(
          brainSecret,
          'WASENDER_API_KEY'
        ),
        WHATSAPP_WEBHOOK_API_KEY: ecs.Secret.fromSecretsManager(
          brainSecret,
          'WHATSAPP_WEBHOOK_API_KEY'
        )
      },
      portMappings: [{ containerPort: 3000 }]
    })

    // Fargate Service (private, with Cloud Map service discovery)
    const service = new ecs.FargateService(this, 'ServerService', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      cloudMapOptions: {
        cloudMapNamespace,
        name: 'brain-server',
        container: serverContainer,
        containerPort: 3000,
        dnsRecordType: servicediscovery.DnsRecordType.SRV,
        dnsTtl: cdk.Duration.seconds(10)
      }
    })

    // Allow Fargate tasks to connect to RDS
    db.connections.allowDefaultPortFrom(service)

    // Create a dedicated SG for the VPC Link to allow specific traffic
    const vpcLinkSg = new ec2.SecurityGroup(this, 'VpcLinkSg', {
      vpc,
      allowAllOutbound: true,
      description: 'Security Group for the API Gateway VPC Link'
    })

    // Allow traffic from the VPC Link to the Fargate service on port 3000
    service.connections.allowFrom(
      vpcLinkSg,
      ec2.Port.tcp(3000),
      'Allow traffic from API Gateway VPC Link'
    )

    // API Gateway HTTP API -> Fargate via Service Discovery
    const vpcLink = new apigwv2.VpcLink(this, 'VpcLink', {
      vpc,
      securityGroups: [vpcLinkSg]
    })

    const integration =
      new apigwv2_integrations.HttpServiceDiscoveryIntegration(
        'FargateIntegration',
        service.cloudMapService!,
        { vpcLink }
      )

    const api = new apigwv2.HttpApi(this, 'HttpApi', {
      apiName: 'brain-api',
      defaultIntegration: integration
    })

    // Enable detailed access logging for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    const stage = api.defaultStage!.node.defaultChild as apigwv2.CfnStage
    stage.accessLogSettings = {
      destinationArn: logGroup.logGroupArn,
      format: JSON.stringify({
        requestId: '$context.requestId',
        ip: '$context.identity.sourceIp',
        requestTime: '$context.requestTime',
        httpMethod: '$context.httpMethod',
        routeKey: '$context.routeKey',
        status: '$context.status',
        protocol: '$context.protocol',
        responseLength: '$context.responseLength',
        // --- These are the crucial fields for debugging ---
        integrationError: '$context.integration.error',
        integrationStatus: '$context.integration.status',
        integrationLatency: '$context.integration.latency'
      })
    }
    logGroup.grantWrite(new iam.ServicePrincipal('apigateway.amazonaws.com'))

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.apiEndpoint,
      description: 'API Gateway endpoint URL'
    })

    if (
      !process.env.GITHUB_OWNER ||
      !process.env.GITHUB_REPO_NAME ||
      !process.env.GITHUB_BRANCH
    ) {
      throw new Error('GITHUB_OWNER and GITHUB_REPO_NAME must be set')
    }

    // CodeBuild project for Docker image build/push
    const codeBuildProject = new codebuild.Project(this, 'ServerImageBuild', {
      source: codebuild.Source.gitHub({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO_NAME!,
        webhook: false // We'll handle webhook through CodePipeline
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        environmentVariables: {
          AWS_REGION: { value: this.region },
          AWS_ACCOUNT_ID: { value: this.account },
          REPOSITORY_URI: { value: repo.repositoryUri }
        }
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('aws/buildspec.yml')
    })

    // Grant ECR permissions to CodeBuild
    repo.grantPullPush(codeBuildProject)
    codeBuildProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
          'ecr:PutImage',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload'
        ],
        resources: ['*']
      })
    )

    // GitHub connection for CodePipeline
    const githubConnection = new cdk.CfnResource(this, 'GithubConnection', {
      type: 'AWS::CodeStarConnections::Connection',
      properties: {
        ConnectionName: 'brain-github-connection',
        ProviderType: 'GitHub'
      }
    })

    // Pipeline artifact bucket
    const artifactBucket = new cdk.aws_s3.Bucket(this, 'ArtifactBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    })

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      artifactBucket: artifactBucket,
      restartExecutionOnUpdate: true
    })

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput')
    const sourceAction =
      new codepipeline_actions.CodeStarConnectionsSourceAction({
        actionName: 'GitHub_Source',
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO_NAME!,
        branch: process.env.GITHUB_BRANCH || 'master',
        output: sourceOutput,
        connectionArn: githubConnection.ref,
        triggerOnPush: true
      })
    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction]
    })

    // Build stage
    const buildOutput = new codepipeline.Artifact('BuildOutput')
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: codeBuildProject,
      input: sourceOutput,
      outputs: [buildOutput]
    })
    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction]
    })

    // Deploy stage
    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'Deploy',
      service: service,
      imageFile: buildOutput.atPath('images.json')
    })
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction]
    })

    // Grant pipeline role permissions to deploy to ECS
    pipeline.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ecs:DescribeServices',
          'ecs:DescribeTaskDefinition',
          'ecs:DescribeTasks',
          'ecs:ListTasks',
          'ecs:RegisterTaskDefinition',
          'ecs:UpdateService'
        ],
        resources: ['*']
      })
    )

    // Output the connection ARN - you'll need this to complete the GitHub connection
    new cdk.CfnOutput(this, 'GithubConnectionArn', {
      value: githubConnection.ref,
      description:
        'ARN of the GitHub connection. Use this to complete the connection in the AWS Console.'
    })

    // Output the pipeline name
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'Name of the CodePipeline'
    })

    // Route53 custom domain and DNS for API Gateway
    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: 'elands.studio'
    })
    const cert = new certificatemanager.Certificate(this, 'ApiCert', {
      domainName: 'brain-api.elands.studio',
      validation: certificatemanager.CertificateValidation.fromDns(zone)
    })
    const domain = new apigwv2.DomainName(this, 'CustomDomain', {
      domainName: 'brain-api.elands.studio',
      certificate: cert
    })
    new apigwv2.ApiMapping(this, 'ApiMapping', {
      api,
      domainName: domain,
      stage: api.defaultStage!
    })
    new route53.ARecord(this, 'BrainApiAliasRecord', {
      zone,
      recordName: 'brain-api',
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayv2DomainProperties(
          domain.regionalDomainName,
          domain.regionalHostedZoneId
        )
      )
    })
  }
}
