# **App Name**: FireSync

## Core Features:

- Personalized Movie Recommendations: Utilize a weighted scoring system incorporating mood, time of day, and viewing history to generate a ranked list of movie recommendations.
- Movie Recommendation Display: Display top movie recommendations with their title, a brief description, and a reason for the suggestion based on user's current state (mood, time) and past history.
- Mood Selection: Capture user mood using a simple input method, like a multiple-choice selection of descriptive moods.
- Time Detection: Detect time of day automatically and allow users to adjust if needed.  Consider morning, afternoon, evening, night as time intervals.
- Viewing History Tracking: Mock and store basic viewing history within the application. Track movie selections, ratings, and completions for each session to establish the user's taste.  Implement a feature that monitors watch patterns by utilizing the LLM as a tool, adjusting weights and content mix for personalization over time.
- Weight Customization: Offer options for manual weight adjustment (Mood, Time, History) for a fully customizable recommendation experience.

## Style Guidelines:

- Primary color: A deep, engaging blue (#3F51B5) evokes feelings of trust and relaxation, crucial for personalized content.
- Background color: Light gray (#F5F5F5), for a clean and modern viewing experience that reduces eye strain.
- Accent color: A vibrant amber (#FFC107) for call-to-action buttons and highlights, adding warmth and catching attention.
- Body font: 'PT Sans', sans-serif, to create a readable interface for long movie descriptions.
- Headline font: 'Space Grotesk', sans-serif, offering a modern twist to film categories and titles.
- Use simple, clear icons in a single color (the primary color). Ensure the icons are easily understood to streamline the user's browsing experience.
- Implement a card-based layout for movie recommendations to highlight each choice. This creates a visually balanced and organized user experience.
- Add subtle transitions to movies as users scroll. As well, incorporate soft animations when refreshing suggestions, avoiding abrupt changes and giving an element of pleasant surprise.