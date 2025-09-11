/**
 * Recipe Domain Types
 * 
 * Types related to recipe management within families
 */

export interface Recipe {
  id?: string;
  name: string;
  ingredients: string[];
  instructions: string;
  familyId?: string;
  authorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Comment {
  id?: string;
  comment: string;
  created_at: string;
  user_id: string;
  recipe_id: string;
}