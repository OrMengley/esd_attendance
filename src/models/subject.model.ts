export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  duration?: string;
  status: "active" | "inactive";
}
