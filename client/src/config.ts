// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'w6mcq4pv70'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map. For example:
  // domain: 'dev-nd9990-p4.us.auth0.com',
  domain: 'dev-2qmxi8x4.us.auth0.com',            // Auth0 domain
  clientId: 'x87Lsecl3t8doQ01MR7X4na8uwy7aaaA',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
