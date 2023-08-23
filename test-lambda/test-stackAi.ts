import { main } from '../src/lambda/StackAi/index';
process.env.AVAILABILITY_ZONES = '';
process.env.REGION = 'us-east-1';
try {
	main(getPayload(''));
} catch (e) {
	console.error(e);
}

export function getPayload(event: any ) {
	return {
		version: '2.0',
		routeKey: 'GET /Canvas',
		rawPath: '/Canvas',
		rawQueryString: '',
		headers: {
		  accept: '*/*',
		  'accept-encoding': 'gzip, deflate, br',
		  'cache-control': 'no-cache',
		  'content-length': '150',
		  'content-type': 'application/json',
		  host: 'khfs0kcyyd.execute-api.us-east-1.amazonaws.com',
		  'postman-token': '61e47255-ceca-4227-a52c-1489c5ac1872',
		  'user-agent': 'PostmanRuntime/7.31.3',
		  'x-amzn-trace-id': 'Root=1-6417ad1d-6304e9fb2dd4ba4e5e214925',
		  'x-api-key': '{{API-KEY}}',
		  'x-forwarded-for': '54.86.50.139',
		  'x-forwarded-port': '443',
		  'x-forwarded-proto': 'https',
		  'x-private-key': '{{PRIVATE-KEY}}'
		},
		requestContext: {
		  accountId: '710625923095',
		  apiId: 'khfs0kcyyd',
		  domainName: 'khfs0kcyyd.execute-api.us-east-1.amazonaws.com',
		  domainPrefix: 'khfs0kcyyd',
		  http: {
			method: 'GET',
			path: '/Canvas',
			protocol: 'HTTP/1.1',
			sourceIp: '54.86.50.139',
			userAgent: 'PostmanRuntime/7.31.3'
		  },
		  requestId: 'CDf8ngTmIAMEPew=',
		  routeKey: 'GET /Canvas',
		  stage: '$default',
		  time: '20/Mar/2023:00:47:25 +0000',
		  timeEpoch: 1679273245207
		},
		body: '{\n' +
		  '    "varA" : "Orangead Media",\n' +
		  '    "varB": "https://oa.media/" \n' +
		  '}',
		isBase64Encoded: false
	  };
}

