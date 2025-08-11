'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting personalized challenges and habits to users.
 *
 * It utilizes user activity and community trends to provide relevant and motivating suggestions.
 * - suggestPersonalizedChallenges - A function that suggests personalized challenges and habits.
 * - SuggestPersonalizedChallengesInput - The input type for the suggestPersonalizedChallenges function.
 * - SuggestPersonalizedChallengesOutput - The return type for the suggestPersonalizedChallenges function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPersonalizedChallengesInputSchema = z.object({
  userActivity: z.string().describe('A summary of the user\'s recent activity within the app, including completed challenges, joined communities, and tracked habits.'),
  communityTrends: z.string().describe('A summary of trending challenges and habits within the user\'s communities.'),
});
export type SuggestPersonalizedChallengesInput = z.infer<typeof SuggestPersonalizedChallengesInputSchema>;

const SuggestPersonalizedChallengesOutputSchema = z.object({
  suggestedChallenges: z.array(z.string()).describe('A list of personalized challenge suggestions based on user activity and community trends.'),
  suggestedHabits: z.array(z.string()).describe('A list of personalized habit suggestions based on user activity and community trends.'),
});
export type SuggestPersonalizedChallengesOutput = z.infer<typeof SuggestPersonalizedChallengesOutputSchema>;

export async function suggestPersonalizedChallenges(
  input: SuggestPersonalizedChallengesInput
): Promise<SuggestPersonalizedChallengesOutput> {
  return suggestPersonalizedChallengesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPersonalizedChallengesPrompt',
  input: {schema: SuggestPersonalizedChallengesInputSchema},
  output: {schema: SuggestPersonalizedChallengesOutputSchema},
  prompt: `You are an AI assistant designed to suggest personalized challenges and habits to users based on their activity and community trends.

  Consider the following information about the user's activity:
  {{userActivity}}

  Also, consider these trending challenges and habits within the user's communities:
  {{communityTrends}}

  Based on this information, suggest a list of challenges and habits that the user might find interesting and motivating.
  
  Provide 3 suggestions for challenges and 3 for habits.
  `,
});

const suggestPersonalizedChallengesFlow = ai.defineFlow(
  {
    name: 'suggestPersonalizedChallengesFlow',
    inputSchema: SuggestPersonalizedChallengesInputSchema,
    outputSchema: SuggestPersonalizedChallengesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
