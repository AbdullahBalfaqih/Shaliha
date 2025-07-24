import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      models: {
        'gemini-2.0-flash': {
          model: 'gemini-2.0-flash',
        },
      },
    }),
  ],
});
