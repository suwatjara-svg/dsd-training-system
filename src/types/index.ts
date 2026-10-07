export type QualificationStatus = 'PENDING' | 'QUALIFIED' | 'NOT_QUALIFIED';

export type ContactStatus = 'NOT_CONTACTED' | 'CONTACTED' | 'NO_ANSWER' | 'CALL_BACK';

export type InterestStatus = 'UNKNOWN' | 'INTERESTED' | 'NOT_INTERESTED' | 'UNDECIDED';

export type SelectionStatus = 'PENDING' | 'SELECTED' | 'WAITLIST' | 'REJECTED' | 'WITHDRAWN';

export type CourseStatus = 'DRAFT' | 'OPEN' | 'FULL' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';

export interface ApplicantFullProfile {
  id: string;
  applicationNumber: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  idCardNumber: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string | null;
  age?: number | null;
  occupation?: string | null;
  educationLevel?: string | null;
  address?: string | null;
  submittedAt: string;

  screening?: {
    id: string;
    qualificationStatus: QualificationStatus;
    disqualifiedReason?: string | null;
    evaluatedAt?: string | null;
    evaluatedByName?: string | null;
    notes?: string | null;
  } | null;

  contacts: Array<{
    id: string;
    contactStatus: ContactStatus;
    interestStatus: InterestStatus;
    contactDate: string;
    calledByName?: string | null;
    notes?: string | null;
    callAttempt: number;
  }>;

  selection?: {
    id: string;
    selectionStatus: SelectionStatus;
    waitlistOrder?: number | null;
    selectedDate?: string | null;
    selectedByName?: string | null;
    remarks?: string | null;
    isOverridden: boolean;
  } | null;

  documents: Array<{
    id: string;
    documentTitle: string;
    fileUrl: string;
    mimeType?: string | null;
    status: string;
  }>;

  answers: Array<{
    id: string;
    questionLabel: string;
    answerValue: string;
  }>;
}

export interface CourseCapacityStats {
  capacity: number;
  totalApplicants: number;
  screenedCount: number;
  qualifiedCount: number;
  contactedCount: number;
  interestedCount: number;
  selectedCount: number;
  waitlistCount: number;
  remainingSlots: number;
  isFull: boolean;
}
