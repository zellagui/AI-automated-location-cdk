import { Configuration, OpenAIApi } from 'openai';
import { z } from "zod";
import fetch from 'node-fetch';
import { stackAiKey, apifyKey } from '../auth';
import {ApifyClient} from 'apify-client';

interface IMerged {
    depth: number;
    originalStartUrl: string;
    referrerUrl: null | string;
    url: string;
    domain: string;
    emails: string[];
    phones: string[];
    phonesUncertain: string[];
    linkedIns: string[];
    twitters: string[];
    instagrams: string[];
    facebooks: string[];
    youtubes: string[];
    tiktoks: string[];
    pinterests: string[];
    discords: string[];
    [key: string]: any; // This is the index signature
}

export async function main(event: any) {
    try {
        const query = payloadValidation(event);
        const { varA, varB } = query;

        const contactInfo = await apifyMedia(varB);
        const searchResults = await apifySearchGoogleBusiness(varA);

        const WebPresence = {
            contactInfo,
            searchResults,
        };

        console.log(WebPresence);
        console.log('program exit...');
        return WebPresence;
    } catch (e: any) {
        let res = 'error';
        console.log(e);
        return res;
    }
}
async function apifySearchGoogleBusiness(varA:string) {
    const client = new ApifyClient({
        token: apifyKey,  // Use your API token here
    });

    const input = {
        "search": varA,
        "location": "Montreal",
        "maxCrawledPlacesPerSearch": 1
    };

    const run = await client.actor("compass/easy-google-maps").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    return items;
}

async function apifyMedia(varB: string) {
    const client = new ApifyClient({
        token: apifyKey,
    });

    const input = {
        "startUrls": [
            {
                "url": varB
            }
        ],
        "maxRequestsPerStartUrl": 3,
        "maxDepth": 3,
        "maxRequests": 99,
        "sameDomain": true,
        "considerChildFrames": true,
        "proxyConfig": {
            "useApifyProxy": true
        }
    };

    const run = await client.actor("vdrmota/contact-info-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    return mergeResults(items as IMerged[]);
}

function mergeResults(items: IMerged[]) {
    const merged: IMerged = {
        depth: 0,
        originalStartUrl: '',
        referrerUrl: null,
        url: '',
        domain: '',
        emails: [],
        phones: [],
        phonesUncertain: [],
        linkedIns: [],
        twitters: [],
        instagrams: [],
        facebooks: [],
        youtubes: [],
        tiktoks: [],
        pinterests: [],
        discords: []
    };

    items.forEach(item => {
        for (let key in merged) {
            if (Array.isArray(merged[key])) {
                merged[key] = [...merged[key], ...item[key]];
            }
        }
    });

    for (let key in merged) {
        if (Array.isArray(merged[key])) {
            merged[key] = [...new Set(merged[key])]; // Remove duplicates
        }
    }

    return merged;
}

function payloadValidation(event: any) {
    const payloadSchema = z.object({
        varA: z.string(),
        varB: z.string(),
    });

    return payloadSchema.parse(
        JSON.parse(event.body || JSON.stringify({}))
    );
}
