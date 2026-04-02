# Peer Matching Algorithm - Implementation Guide

## Overview
The advanced peer matching algorithm automatically connects similar peers based on shared interests, discussion categories, and keywords. It uses a sophisticated scoring system to rank compatible peers and provides personalized suggestions.

## Features

### 1. **Compatibility Scoring System**
The algorithm calculates a compatibility score (0-100) based on:

- **Category Overlap (40% weight)**: Matches shared discussion topics
  - Example: If User A discusses "Stress" and "Exams", and User B also discusses "Stress", they share 50% overlap
  
- **Keyword Overlap (40% weight)**: Matches topic-specific keywords
  - Example: If both users mention keywords like "exam anxiety", "study tips", they score higher
  
- **Diversity Bonus (20% weight)**: Encourages matching between users with multiple interests
  - Users with 2+ categories/keywords get a bonus
  - Single-interest users get a smaller bonus

**Formula:**
```
Score = (Category Overlap %) × 40 + (Keyword Overlap %) × 40 + Diversity Bonus
```

### 2. **Data Persistence**
All peer matches are stored in the `PeerMatch` model with:
- `compatibilityScore`: Numeric score (0-100)
- `categoryOverlap`: Array of shared discussion categories
- `keywordOverlap`: Array of shared keywords
- `sharedChallenges`: Common challenges/interests
- `dismissedAt`: Timestamp when user dismissed the suggestion
- `lastInteractionAt`: Last time this match was updated

### 3. **Smart Filtering**
- **Minimum Score Threshold**: Only shows matches with 30%+ compatibility
- **Dismissed Filtering**: Doesn't show dismissed suggestions
- **Freshness**: Prioritizes recent posts and active users
- **Limit**: Shows top 5 matches per user

### 4. **Match Refresh Logic**
- Matches are recalculated on each `/overview` request
- Existing matches are updated with latest compatibility scores
- New potential matches are automatically discovered
- Dismissed matches are permanently hidden from suggestions

## Database Schema

### PeerMatch Model
```javascript
{
  userId: ObjectId,              // User receiving suggestions
  matchedUserId: ObjectId,       // Suggested user
  faculty: String,               // Faculty (for filtering)
  compatibilityScore: Number,    // 0-100 score
  categoryOverlap: [String],     // e.g., ["Stress", "Exams"]
  keywordOverlap: [String],      // e.g., ["anxiety", "study"]
  sharedChallenges: [String],    // Common challenges
  isMutualInterest: Boolean,     // If match was mutual
  replyCount: Number,            // Posts from matched user
  lastInteractionAt: Date,
  dismissedAt: Date,             // When user dismissed
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### 1. **GET /api/peer/overview**
Returns suggested connections with compatibility scores

**Response:**
```json
{
  "suggestedConnections": [
    {
      "id": "peer-60d5ec49c1234567890abc12-0",
      "label": "Peer #abc12",
      "compatibilityScore": 85,
      "overlapCategories": ["Stress", "Academic Difficulty"],
      "overlapKeywords": ["anxiety", "study"],
      "reason": "2 shared interests",
      "latestAt": "2024-03-26T10:30:00Z"
    }
  ]
}
```

### 2. **POST /api/peer/matches/:matchedPeerId/dismiss**
Dismiss a peer suggestion permanently

**Request:**
```
POST /api/peer/matches/60d5ec49c1234567890abc12/dismiss
```

**Response:**
```json
{
  "message": "Peer suggestion dismissed. It won't appear again.",
  "dismissedAt": "2024-03-26T10:35:00Z"
}
```

### 3. **GET /api/peer/matches/stats**
Get matching statistics for the current user

**Response:**
```json
{
  "totalMatches": 15,
  "avgCompatibilityScore": 72.5,
  "dismissedCount": 3
}
```

## Frontend Integration

### Display Peer Suggestions Component
```jsx
{overview.suggestedConnections.length ? (
  overview.suggestedConnections.map((connection) => (
    <div key={connection.id} className="match-card">
      {/* Display match info */}
      <p>Match Score: {connection.compatibilityScore}%</p>
      <p>Reason: {connection.reason}</p>
      
      {/* Dismiss button */}
      <button onClick={() => dismissPeerMatch(connection.id)}>
        Dismiss
      </button>
    </div>
  ))
) : null}
```

## Scoring Examples

### Scenario 1: High Compatibility
- **User A posts:** "Stress management" (keywords: stress, anxiety, coping)
- **User B posts:** "Dealing with exam stress" (keywords: stress, exam, anxiety)
- **Overlap:** Categories: 1/1 (100%), Keywords: 2/3 (66%)
- **Score:** (1/1 × 40) + (2/3 × 40) + 20 = **86%**

### Scenario 2: Moderate Compatibility
- **User A:** Categories [Stress, Exams], Keywords [anxiety, study, exam]
- **User B:** Categories [Academic Difficulty], Keywords [study, difficult]
- **Overlap:** Categories: 0/2 (0%), Keywords: 1/3 (33%)
- **Score:** (0 × 40) + (1/3 × 40) + 20 = **33%**

### Scenario 3: Low Compatibility (Filtered Out)
- **User A:** Categories [Stress], Keywords [anxiety]
- **User B:** Categories [Personal Growth], Keywords [meditation]
- **Overlap:** Categories: 0/1 (0%), Keywords: 0/1 (0%)
- **Score:** (0 × 40) + (0 × 40) + 10 = **10%** → **Filtered (below 30%)**

## Performance Optimizations

1. **Aggregation Pipeline**: Uses MongoDB aggregation for efficient grouping
2. **Lean Queries**: Uses `.lean()` for read-only operations
3. **Indexing**: 
   - `userId, compatibilityScore, createdAt` for fast sorting
   - `userId, matchedUserId` unique index to prevent duplicates
4. **TTL Index**: Matches auto-delete after 30 days if not updated
5. **Batch Promises**: Parallel processing of compatibility calculations

## Future Enhancements

1. **Machine Learning**: Use past interactions to improve scoring
2. **Time Decay**: Reduce score of old matches
3. **Bidirectional Matching**: Show mutual connections differently
4. **Subject Expertise**: Tag knowledgeable peers as "Experts"
5. **Interaction Tracking**: Score based on actual conversations
6. **A/B Testing**: Test different weighting algorithms

## Troubleshooting

### No suggestions appearing
- User must have at least one post
- Posts must be visible (not hidden/flagged)
- No matches meet 30% threshold
- All potential matches dismissed

### Low matching accuracy
- Increase keyword extraction quality
- Adjust weighting percentages
- Add more categories in post creation
- Users need diverse posts

### Performance issues
- Add indexes to PeerPost and PeerMatch collections
- Increase `$limit` in aggregation pipeline
- Cache results on client-side
- Use pagination for large result sets

## API Usage Example

```javascript
// Get peer suggestions with compatibility scores
async function getPeerSuggestions() {
  const response = await fetch('/api/peer/overview');
  const data = await response.json();
  
  // Display sorted by compatibility
  data.suggestedConnections.forEach(match => {
    console.log(`${match.label}: ${match.compatibilityScore}%`);
    console.log(`Shared interests: ${match.overlapCategories.join(', ')}`);
  });
}

// Dismiss a peer suggestion
async function dismissMatch(matchedPeerId) {
  await fetch(`/api/peer/matches/${matchedPeerId}/dismiss`, {
    method: 'POST'
  });
}

// Get matching statistics
async function getMatchStats() {
  const response = await fetch('/api/peer/matches/stats');
  const stats = await response.json();
  console.log(`Average compatibility: ${stats.avgCompatibilityScore}%`);
}
```
