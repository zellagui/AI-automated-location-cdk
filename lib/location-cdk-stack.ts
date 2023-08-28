import * as cdk from 'aws-cdk-lib';

//LAMBDA
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";

//API
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import {
  HttpApi,
  HttpMethod,
  CorsHttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";

//Database - Dynamo
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';


//Resource
import * as path from "path";

export const data_analysis_lambda = 'data_analysis_lambda';
export const openAiRequest = 'openAi_Request';
export const automated_ai_flow = 'Automated_ai_flow';


export class LocationCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Post - LAMBDA
    const data_lambda = new NodejsFunction(this, data_analysis_lambda, {
			memorySize: 1024,
			timeout: cdk.Duration.seconds(15),
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: 'main',
			entry: path.join(__dirname, '../src/lambda/data_analysis/data_analysis.ts'),
		});

	const openAiReq = new NodejsFunction(this, openAiRequest, {
			memorySize: 1024,
			timeout: cdk.Duration.seconds(30),
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: 'main',
			entry: path.join(__dirname, '../src/lambda/openAi_req/index.ts'),
		});


	//create a database to save the audience & campaign 	


	const Automated_ai_flow_db = new dynamodb.Table(this, automated_ai_flow, {
		partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
		replicationRegions: ['us-east-1'],
		tableName: automated_ai_flow,
		billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
	});

	Automated_ai_flow_db.grantReadWriteData(openAiReq);

    // create Api
		const httpApi = new HttpApi(this, "LocationFeature", {
			description: "LocationFeature API",
			corsPreflight: {
			allowHeaders: [
				"Content-Type",
				"X-Amz-Date",
				"Authorization",
				"X-Api-Key",
			],
			allowMethods: [
				CorsHttpMethod.OPTIONS,
				CorsHttpMethod.GET,
				CorsHttpMethod.POST,
				CorsHttpMethod.PUT,
				CorsHttpMethod.PATCH,
				CorsHttpMethod.DELETE,
			],
			allowCredentials: true,
			allowOrigins: ["http://localhost:8080"],
			},
		});

     	httpApi.addRoutes({
			path: "/audience",
			methods: [HttpMethod.POST],
			integration: new HttpLambdaIntegration(
			  "post-newAudience",
			  data_lambda
			),
		  });

		  httpApi.addRoutes({
			path: "/audience",
			methods: [HttpMethod.PUT],
			integration: new HttpLambdaIntegration(
			  "post-openAi-Req",
			  openAiReq
			),
		  });

  }
}
