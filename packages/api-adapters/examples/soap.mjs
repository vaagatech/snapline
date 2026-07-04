import { api, executeApi } from '@vaagatech/api-adapters';

const envelope = [
  '<?xml version="1.0"?>',
  '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
  '<soap:Body><GetUserRequest><email>alice@example.com</email></GetUserRequest></soap:Body>',
  '</soap:Envelope>',
].join('');

// Point endpoint at your SOAP service
const result = await executeApi(
  api.soap({
    endpoint: 'https://example.com/soap/user',
    soapAction: 'GetUser',
    envelope,
  }),
);

console.log('SOAP parsed data:', result.data);
