import dotenv from 'dotenv';

dotenv.config();

const testRestApi = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    const versions = ['v1', 'v1beta'];
    const models = ['gemini-1.5-flash', 'gemini-pro'];

    for (const version of versions) {
        for (const model of models) {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
            console.log(`\nTesting ${version} with ${model}...`);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "Hello" }] }]
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    console.log(`SUCCESS [${version}/${model}]: Response received!`);
                    // console.log(JSON.stringify(data, null, 2));
                    return;
                } else {
                    console.error(`FAILED [${version}/${model}]: ${response.status} ${response.statusText}`);
                    console.error('Error info:', JSON.stringify(data, null, 2));
                }
            } catch (err) {
                console.error(`FETCH ERROR [${version}/${model}]:`, err.message);
            }
        }
    }
};

testRestApi();
