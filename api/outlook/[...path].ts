import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    // CORS Headers
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    try {
        const { url } = request;
        if (!url) {
            response.status(400).send("Missing URL");
            return;
        }

        // Logic to rewrite the path
        // Incoming: /api/outlook/owa/calendar/...
        // Target: https://outlook.office365.com/owa/calendar/...

        // Remove '/api/outlook' prefix
        let path = url.replace(/^\/api\/outlook/, '');

        // Ensure path starts with / if it doesn't (though replace usually leaves it if exact match)
        // If request was exactly /api/outlook, path is empty string.

        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        const targetUrl = `https://outlook.office365.com${path}`;

        console.log(`Proxying to: ${targetUrl}`);

        const externalResponse = await fetch(targetUrl);

        if (!externalResponse.ok) {
            throw new Error(`Upstream error: ${externalResponse.status} ${externalResponse.statusText}`);
        }

        const data = await externalResponse.text();

        response.status(200).send(data);

    } catch (error: any) {
        console.error('Proxy Error:', error);
        response.status(500).send(`Proxy Error: ${error.message}`);
    }
}
