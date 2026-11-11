import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const API = 'http://api.test/api/v1';

/** A slice of the district list (GET /regions/districts): shared reference data, so a default. */
export const TEST_DISTRICTS = [
  { name: 'Patna', state: 'Bihar', region: 'EAST_INDIA', label: 'Patna', aliases: [] },
  { name: 'Gaya', state: 'Bihar', region: 'EAST_INDIA', label: 'Gaya', aliases: [] },
  { name: 'Gadchiroli', state: 'Maharashtra', region: 'CENTRAL_INDIA', label: 'Gadchiroli', aliases: [] },
  { name: 'Muzaffarpur', state: 'Bihar', region: 'EAST_INDIA', label: 'Muzaffarpur', aliases: [] },
  { name: 'Shimla', state: 'Himachal Pradesh', region: 'HILLS_COOL', label: 'Shimla', aliases: [] },
  { name: 'Gurugram', state: 'Haryana', region: 'NORTH_INDIA', label: 'Gurugram', aliases: ['Gurgaon'] },
  { name: 'Aurangabad', state: 'Bihar', region: 'EAST_INDIA', label: 'Aurangabad, Bihar', aliases: [] },
  {
    name: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    region: 'WEST_INDIA',
    label: 'Chhatrapati Sambhajinagar, Maharashtra',
    aliases: ['Aurangabad'],
  },
];

/**
 * Tests add handlers per case with server.use(...). Unhandled requests fail the test.
 * The district list is the one default: it is fixed reference data most screens read.
 */
export const server = setupServer(http.get(`${API}/regions/districts`, () => HttpResponse.json({ success: true, data: TEST_DISTRICTS })));
