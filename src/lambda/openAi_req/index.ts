import { Configuration, OpenAIApi } from 'openai';
import { z } from "zod";
import { openAIKey } from '../auth';

export async function main(event: any) {
    try {
        // console.log(event);
        const query = payloadValidation(event);
        console.log(query);
        const {varA, varB} = query
        const result = await chatGPTRequest(varA, varB);
        console.log(result);
        return result;
    }catch (e: any) {
        let res = 'error'
        console.log(e)
        return res;
    }
}

async function chatGPTRequest(varA: String, varB: String) {
    try {
      const configuration = new Configuration({
        apiKey: openAIKey,
      });
      const openai = new OpenAIApi(configuration);

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        "messages": [{"role": "system", "content": `As an endpoint API for a website, you are responsible for receiving and interpreting JSON objects. These JSON objects represent a request from a user of the website and your task is to formulate a response based on this request. Specifically, your role is to help users identify the ideal audience for an advertisement campaign in their city.

        The user will provide two key details:
        
        A description of their company or product or serviced offered.
        A customer description.
        Your role is to understand these descriptions and deduce the optimal audience in terms of age and income demographics, with the values scaled between 0 and 1, 1 representing the highest possible value.
        
        Here is an example of the JSON object you might receive:
        {
            "companyOrProductDescription": "We sell luxurious cars that prioritize comfort and durability.",
            "idealCustomerDescription": "Wealthy individuals with an affinity for luxury cars."
        }

        The last response expected is to categorize, you must choose the category between the option provided and return the matching ones (separated by a "/"):
        
        -Abortion/Advocacy Organizations/Alcool/Alternatives Beliefs/Dating/Gambling/Lingerie and Swimsuit/Marijuana/Nudity and Risque/Other Adult Materials/Pornography/Sex Education/Sports Hunting and War Games/Tobacco/Weapons (Sales)
  
        -Advertising/Arts & Culture/Auction/Brokerage and trading/Child Education/Content Servers/Domain Parking/Education/Entertainment/Folklore/Games/Global Religion/Health & Wellness/Instant Messaging/Job Search/Meaningless Content/Medicine/News & Media/Newsgroups and Message Boards/Personal Vehicles/Real Estate/Reference/Restaurants & Dining/Shopping/Social Networking/Society & Lifestyles/Sports/Travel/Web chat/Web-based Email
  
        -Armed Forces/Business/Charitable Organizations/Finance & Banking/General Organizations/Government & Legal Organizations/Information Technology/Information and Computer Security/Remote Access/Search Engines & Portals/Secure Website/Web Analytics/Web Hosting/Web-based Applications
                
        Based on the given descriptions, your task is to formulate a response JSON object that includes:
        
        targetAge: Based on the provided data, determine the ideal audience age (a value between 0 and 1).
        targetIncome: Similarly, figure out the ideal income range (also a value between 0 and 1).
        audienceDescription: Finally, construct a list of 5 accurate insights and particularities to be able to identify them, you must provide clear and constructive information, not only basic information the already know.
        The category that it does fit in.
        A resume explaining the reasons of choosing this audience, you must explain with the information and not only reformulate the audience description.
        The goal is to have the best hours to display the ads corresponding to this audience/product/service/schedule in a json format. The result must be a weekly planning well attributed with a maximum of 4 per days. This data will be stored in a object representing the week with an array of array setting the range for each day of the week.
        {
            "targetAge": number,
            "targetIncome": number,
            "audienceDescription": [
                "Audience profile description",
                "Audience profile description",
                "Audience profile description",
                "Audience profile description",
                "Audience profile description"
            ],
            "categories": ["category 1", "category 2", "category 3"],
            "audienceResume": "A resume of few lines",
            "schedule": {"Mon":[[8,12]],"Tue":[],"Wed":[[7,11]],"Thu":[],"Fri":[],"Sat":[16,20],"Sun":[]},
          audience name: few work to title this audience.
        }
        
        Your goal is to provide accurate, clear, and insightful data to effectively target the desired audience.
        
        This object bellow is the actual call with the json object:
        
        {
            "The_company_or_product_description":${varA},
            "idealCustomerDescription": ${varB}"
        }
      
      You must only the json response!`}]});

      
      //This way is the way to use completion with daviinci or ada.  
      // const prompt = `"Please provide the JSON response for the following API endpoint prompt: 
      // \n\nAs an API endpoint, you will receive JSON objects from users who want to determine the best audience for their advertising campaign. 
      // These JSON objects will include a company or product description and an ideal customer description. 
      // Your task is to analyze the data and identify the optimal audience based on age and income demographics, using values between 0 and 1. 
      // Your response should be a JSON object containing the following: 'targetAge' and 'targetIncome' fields, which represent the desired age and income demographics, 
      // respectively, and a list of five descriptors that describe the identified audience. 
      // The structure of the input JSON object is as follows:
      // \n\n{\n \"The_company_or_product_description\": ${varA},\n \"idealCustomerDescription\": ${varB}\n}\n\n
      // Please ensure that your response is in the form of a JSON object."`;
  
      // const response = await openai.createCompletion({
      //   model: "text-davinci-003",
      //   prompt: prompt,
      //   temperature: 0.1,
      //   max_tokens: 700,
      // });
      const rep = completion.data.choices[0].message;

      // console.log(rep)
      if (rep) {
        return JSON.parse(rep.content);
    } else {
        console.error('OpenAI response does not contain a message');
        return {}; // or whatever default value makes sense in your context
    }
    
    //  return rep?.content;
    } catch (e) {
      console.log("openAI call returning an error");
      console.log(e);
      return e;
    }
  }
  

  function payloadValidation (event: any) {

    const payloadSchema = z.object({
        varA: z.string(),
        varB: z.string(),
    });

    return payloadSchema.parse(
        JSON.parse(event.body || JSON.stringify({}))
      );
}


