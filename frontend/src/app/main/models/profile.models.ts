export interface UserProfileDetails {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phoneNumber: string | null;
  photoDataUrl?: string | null;
}
