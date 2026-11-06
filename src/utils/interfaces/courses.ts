/**
 * Course schema types matching the backend Mongoose Course schema exactly.
 * Only these fields exist on the course hierarchy; use these chunks across the webapp.
 */

// ----- Backend schema (exact match) -----

export interface ICourseTechnology {
  label: string
  description: string
  logo: string
}

export interface ICourseTechnologiesSection {
  title: string
  description: string
  technologies: ICourseTechnology[]
}

export interface ICourseQuizQuestion {
  question: string
  options: string[]
  correctAnswerIndex: number
}

export interface ICourseProject {
  title: string
  description: string
  attachments: string[]
  dueDate: Date | string
  isCompleted?: boolean
}

export interface ICourseSection {
  title: string
  description: string
  quiz?: {
    questions: ICourseQuizQuestion[]
  }
}

export interface ICourseModule {
  name: string
  description: string
  sections: ICourseSection[]
  finalQuiz?: {
    questions: ICourseQuizQuestion[]
  }
  projects: ICourseProject[]
}

export interface ICourseArticleFeature {
  name: string
  description: string
  image: string
}

/** Full Course document shape matching backend CourseSchema. */
export interface ICourse {
  id?: string
  title: string
  heroDescription: string
  courseDurationInMonths: number
  feePerMonth: number
  totalFee: number
  totalNumberOfInstallments: number
  currency: string
  subtitle: string
  subDescription: string
  slug: string
  technologiesSection: ICourseTechnologiesSection
  modules: ICourseModule[]
  articleFeatures: ICourseArticleFeature[]
  /** Free (complimentary) course: no fee is charged. */
  isFree?: boolean
  /** Tag shown on a free course, e.g. "Free" or "Complimentary". */
  freeLabel?: string
}

/** Contact form / API: course reference for linking to Course documents (slug + title). */
export type IContactFormCourse = Pick<ICourse, "slug" | "title"> & {
  /** Enrollment form: the batch picked for this course. */
  batchId?: string | null
  /** Admin list: name of the picked batch. */
  batchName?: string | null
}
