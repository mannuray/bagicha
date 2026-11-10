import { setupServer } from 'msw/node';

export const API = 'http://api.test/api/v1';

/** Tests add handlers per case with server.use(...). Unhandled requests fail the test. */
export const server = setupServer();
