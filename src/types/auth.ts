export type SignupFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface User {
  id:string,
  email:string,
  name:string
}