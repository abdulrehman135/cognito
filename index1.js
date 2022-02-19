import { AmazonCognitoSrp } from 'amazon-cognito-srp';
    
const amazonCognitoSrp = new AmazonCognitoSrp({
    userPoolId: 'us-east-1_haGqWPxAx',
    clientId: '23si15egh9q0bne4uvsg06nv4',
    username: 'leonardo.lima@example.com',
    password: '!Q@W3e4r'
});
    
// If you run code in a sync function
amazonCognitoSrp.authenticate().then(result => {
    console.log(result)
});

// If you run code in a async function
(async () => {
    const result = await amazonCognitoSrp.authenticate();
    console.log(result)
})();
