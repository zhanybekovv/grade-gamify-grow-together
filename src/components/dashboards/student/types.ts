
export interface Subject {
  id: string;
  name: string;
  description: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: {
    name: string;
  };
  is_active?: boolean;
}
