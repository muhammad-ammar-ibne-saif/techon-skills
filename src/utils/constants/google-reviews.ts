/**
 * Google reviews shown on the home page. Copied by hand from the Google Business profile;
 * replace with a live fetch later. Keep to 4, and copy the text exactly as written on Google.
 */
export interface GoogleReview {
  authorName: string
  /** 1–5 */
  rating: number
  text: string
  /** As shown on Google, e.g. "2 months ago". */
  relativeTime?: string
}

/** Overall star rating shown on the Google Business profile. */
export const GOOGLE_RATING = 4.9

/** Google Place ID of the business (for a live reviews fetch later). */
export const GOOGLE_PLACE_ID = "ChIJy5JsBUTqLQsRQsFc4OG08Vw"

/** Google's "write a review" link from the Business profile (Ask for reviews → Share review form). */
export const GOOGLE_WRITE_REVIEW_URL = "https://g.page/r/CULBXODhtPFcEBM/review"

export const GOOGLE_REVIEWS: GoogleReview[] = [
  {
    authorName: "Maryam Fatima",
    rating: 5,
    text: "I personally really like Tech On Skills and highly recommend it, especially for girls and those who can’t afford expensive courses. Their courses and outlines are very helpful and practical. The best part is that they also provide a proper internship after completion, giving students real-world experience. Definitely a great and affordable option!",
  },
  {
    authorName: "Haris",
    rating: 5,
    text: "Great course. Helped me learn about AI development and deployment of the application. Online lecture make it easy to learn and regular tasks/projects help us to revise what we've learned in the lectures",
  },
  {
    authorName: "Maarij",
    rating: 5,
    text: "Studying Software Engineering at Techon Skills has been an exceptional experience. The focus on practical problem-solving and industry-relevant skills truly sets this institute apart",
  },
  {
    authorName: "Eesha Bilal",
    rating: 5,
    text: "Techon skills is such a great institution to learn skills from basics to master level. They explain everything in detail that after the course you can easily get a job",
  },
]
