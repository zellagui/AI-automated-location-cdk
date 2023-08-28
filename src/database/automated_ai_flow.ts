import * as dynamoose from 'dynamoose';
import { Item } from 'dynamoose/dist/Item';
import { automated_ai_flow } from './../../lib/location-cdk-stack';

const ddb = new dynamoose.aws.ddb.DynamoDB({
	region: 'us-east-1',
});

dynamoose.aws.ddb.set(ddb);


class requests extends Item {
    id: string;     
    userId: string;                  
	targetAge: string;                         
	targetIncome: string;         
	audienceDescription: string;
	audienceResume: string;           
	audienceSchedule: string;    
	groupedDevices: string;
	audienceName: string;                
	image_path: string;                          
}

const schema = new dynamoose.Schema(
	{
		id: { required: false, type: String },
		userId: { required: false, type: String },
		targetAge: { required: false, type: String },
		targetIncome: { required: false, type: String },
		audienceDescription: { required: false, type: String },
		audienceResume: { required: false, type: String },
		audienceSchedule: { required: false, type: String },
		enhancedPrompt: { required: false, type: String },
		groupedDevices: { required: false, type: String },
		audienceName: { required: true, type: String },
	},
	{
		saveUnknown: true,
		timestamps: true,
	}
);

export const all_requests = dynamoose.model<requests>(
	automated_ai_flow,
	schema
);