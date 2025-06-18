# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Deploying this stack

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Bootstrap your AWS environment (if not done before):**
   ```sh
   npx cdk bootstrap --region eu-central-1
   ```
3. **Deploy the stack:**
   ```sh
   npx cdk deploy --region eu-central-1
   ```

- The stack will build and push the Docker image, provision RDS, ECS Fargate, API Gateway, and wire up everything automatically.
- After deploy, the API Gateway endpoint will be output in the console.
